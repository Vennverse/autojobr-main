import { db } from './db';
import { sendEmail } from './emailService';
import { calendarIntegrationService } from './calendarIntegrationService';
import { CrmService } from './crmService';
import { interviewAssignmentService } from './interviewAssignmentService';
import { emailNotificationService } from './emailNotificationService';
import { eq, and, inArray, or } from 'drizzle-orm';
import { jobPostingApplications, users, jobPostings, virtualInterviews } from '@shared/schema';

export interface EmailTemplate {
  subject: string;
  html: string;
}

export interface BulkEmailRequest {
  applicationIds: number[];
  template: 'rejection' | 'acceptance' | 'interview_invite' | 'custom';
  customSubject?: string;
  customBody?: string;
  scheduleInterview?: {
    date: Date;
    duration: number;
    location?: string;
    meetingLink?: string;
  };
}

export interface InterviewScheduleRequest {
  applicationId: number;
  interviewDate: Date;
  interviewType: 'phone' | 'video' | 'in_person' | 'technical';
  duration: number;
  interviewers: string[];
  location?: string;
  meetingLink?: string;
  notes?: string;
}

export interface ScorecardIntegration {
  applicationId: number;
  stage: string;
  scorecardData: any;
  nextAction: 'advance' | 'reject' | 'hold';
}

class UnifiedAtsService {
  private crmService: CrmService;

  constructor() {
    this.crmService = new CrmService();
  }

  async sendBulkEmails(request: BulkEmailRequest, recruiterId: string): Promise<{
    sent: number;
    failed: number;
    results: Array<{ applicationId: number; success: boolean; error?: string }>;
  }> {
    console.log(`📧 [ATS] Starting bulk email send for ${request.applicationIds.length} candidates`);
    
    const applications = await db
      .select({
        application: jobPostingApplications,
        candidate: users,
        job: jobPostings,
      })
      .from(jobPostingApplications)
      .leftJoin(users, eq(users.id, jobPostingApplications.applicantId))
      .leftJoin(jobPostings, eq(jobPostings.id, jobPostingApplications.jobPostingId))
      .where(
        and(
          inArray(jobPostingApplications.id, request.applicationIds),
          eq(jobPostings.recruiterId, recruiterId)
        )
      );

    const results = [];
    let sent = 0;
    let failed = 0;

    for (const { application, candidate, job } of applications) {
      if (!candidate?.email || !job) {
        results.push({
          applicationId: application.id,
          success: false,
          error: 'Missing candidate email or job details',
        });
        failed++;
        continue;
      }

      try {
        const template = this.getEmailTemplate(
          request.template,
          {
            candidateName: `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || 'Candidate',
            jobTitle: job.title,
            companyName: job.companyName,
            customSubject: request.customSubject,
            customBody: request.customBody,
            scheduleInterview: request.scheduleInterview,
          }
        );

        const success = await sendEmail({
          to: candidate.email,
          subject: template.subject,
          html: template.html,
        });

        if (success) {
          await db
            .update(jobPostingApplications)
            .set({
              lastEmailSent: new Date(),
              status: request.template === 'rejection' ? 'rejected' : 
                      request.template === 'acceptance' ? 'accepted' :
                      request.template === 'interview_invite' ? 'interview_scheduled' :
                      application.status,
            })
            .where(eq(jobPostingApplications.id, application.id));

          sent++;
          results.push({ applicationId: application.id, success: true });
        } else {
          failed++;
          results.push({
            applicationId: application.id,
            success: false,
            error: 'Email send failed',
          });
        }
      } catch (error) {
        console.error(`❌ [ATS] Error sending email to ${candidate.email}:`, error);
        failed++;
        results.push({
          applicationId: application.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(`✅ [ATS] Bulk email complete: ${sent} sent, ${failed} failed`);
    return { sent, failed, results };
  }

  async scheduleInterview(request: InterviewScheduleRequest, recruiterId: string): Promise<{
    success: boolean;
    interviewId?: number;
    calendarEventCreated?: boolean;
    error?: string;
  }> {
    try {
      console.log(`📅 [ATS] Scheduling interview for application ${request.applicationId}`);

      const application = await db
        .select({
          application: jobPostingApplications,
          candidate: users,
          job: jobPostings,
        })
        .from(jobPostingApplications)
        .leftJoin(users, eq(users.id, jobPostingApplications.applicantId))
        .leftJoin(jobPostings, eq(jobPostings.id, jobPostingApplications.jobPostingId))
        .where(
          and(
            eq(jobPostingApplications.id, request.applicationId),
            eq(jobPostings.recruiterId, recruiterId)
          )
        )
        .limit(1);

      if (!application[0]) {
        return { success: false, error: 'Application not found or access denied' };
      }

      const { candidate, job } = application[0];

      if (!candidate || !job) {
        return { success: false, error: 'Missing candidate or job details' };
      }

      const [interview] = await db
        .insert(virtualInterviews)
        .values({
          userId: candidate.id,
          jobTitle: job.title,
          scheduledFor: request.interviewDate,
          status: 'scheduled',
          interviewType: request.interviewType,
          duration: request.duration,
          location: request.location,
          meetingLink: request.meetingLink,
          notes: request.notes,
        })
        .returning();

      await db
        .update(jobPostingApplications)
        .set({
          status: 'interview_scheduled',
          interviewScheduledDate: request.interviewDate,
        })
        .where(eq(jobPostingApplications.id, request.applicationId));

      let calendarEventCreated = false;
      try {
        await calendarIntegrationService.syncToGoogleCalendar(recruiterId, {
          title: `Interview: ${candidate.firstName} ${candidate.lastName} - ${job.title}`,
          description: `
Interview Type: ${request.interviewType}
Candidate: ${candidate.firstName} ${candidate.lastName}
Position: ${job.title}
Company: ${job.companyName}

${request.notes || ''}
          `.trim(),
          startTime: request.interviewDate,
          endTime: new Date(request.interviewDate.getTime() + request.duration * 60000),
          location: request.location || request.meetingLink,
        });
        calendarEventCreated = true;
      } catch (calError) {
        console.warn('⚠️ [ATS] Calendar sync failed, interview still created:', calError);
      }

      const emailTemplate = this.getInterviewInviteTemplate({
        candidateName: `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
        jobTitle: job.title,
        companyName: job.companyName,
        interviewDate: request.interviewDate,
        interviewType: request.interviewType,
        duration: request.duration,
        location: request.location,
        meetingLink: request.meetingLink,
      });

      await sendEmail({
        to: candidate.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });

      console.log(`✅ [ATS] Interview scheduled: ID ${interview.id}`);
      return {
        success: true,
        interviewId: interview.id,
        calendarEventCreated,
      };
    } catch (error) {
      console.error('❌ [ATS] Error scheduling interview:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async processScorecardAndAdvance(request: ScorecardIntegration, recruiterId: string): Promise<{
    success: boolean;
    action: string;
    error?: string;
  }> {
    try {
      console.log(`📊 [ATS] Processing scorecard for application ${request.applicationId}`);

      const application = await db
        .select()
        .from(jobPostingApplications)
        .leftJoin(jobPostings, eq(jobPostings.id, jobPostingApplications.jobPostingId))
        .where(
          and(
            eq(jobPostingApplications.id, request.applicationId),
            eq(jobPostings.recruiterId, recruiterId)
          )
        )
        .limit(1);

      if (!application[0]) {
        return { success: false, action: 'none', error: 'Application not found' };
      }

      const newStatus = 
        request.nextAction === 'advance' ? this.getNextStage(request.stage) :
        request.nextAction === 'reject' ? 'rejected' :
        'on_hold';

      await db
        .update(jobPostingApplications)
        .set({
          status: newStatus,
          scorecardData: request.scorecardData,
          lastUpdated: new Date(),
        })
        .where(eq(jobPostingApplications.id, request.applicationId));

      console.log(`✅ [ATS] Scorecard processed, action: ${request.nextAction}, new status: ${newStatus}`);
      return { success: true, action: request.nextAction };
    } catch (error) {
      console.error('❌ [ATS] Error processing scorecard:', error);
      return {
        success: false,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getApplicationPipeline(recruiterId: string): Promise<any> {
    const applications = await db
      .select({
        application: jobPostingApplications,
        candidate: users,
        job: jobPostings,
      })
      .from(jobPostingApplications)
      .leftJoin(users, eq(users.id, jobPostingApplications.applicantId))
      .leftJoin(jobPostings, eq(jobPostings.id, jobPostingApplications.jobPostingId))
      .where(eq(jobPostings.recruiterId, recruiterId));

    const pipeline = {
      new: [],
      screening: [],
      interview_scheduled: [],
      interviewed: [],
      offer: [],
      accepted: [],
      rejected: [],
      on_hold: [],
    };

    for (const { application, candidate, job } of applications) {
      const status = application.status || 'new';
      const pipelineStage = pipeline[status as keyof typeof pipeline];
      if (pipelineStage) {
        pipelineStage.push({
          application,
          candidate,
          job,
        });
      }
    }

    return pipeline;
  }

  private getNextStage(currentStage: string): string {
    const stageFlow = {
      'new': 'screening',
      'screening': 'interview_scheduled',
      'interview_scheduled': 'interviewed',
      'interviewed': 'offer',
      'offer': 'accepted',
    };
    return stageFlow[currentStage as keyof typeof stageFlow] || currentStage;
  }

  private getEmailTemplate(
    type: 'rejection' | 'acceptance' | 'interview_invite' | 'custom',
    data: any
  ): EmailTemplate {
    switch (type) {
      case 'rejection':
        return {
          subject: `Update on your application for ${data.jobTitle} at ${data.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Thank you for your application</h2>
              <p>Dear ${data.candidateName},</p>
              <p>Thank you for taking the time to apply for the <strong>${data.jobTitle}</strong> position at ${data.companyName}.</p>
              <p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
              <p>We appreciate your interest in ${data.companyName} and encourage you to apply for future opportunities that match your skills and experience.</p>
              <p>We wish you the best in your job search and future endeavors.</p>
              <p>Best regards,<br>${data.companyName} Recruiting Team</p>
            </div>
          `,
        };

      case 'acceptance':
        return {
          subject: `Congratulations! Offer for ${data.jobTitle} at ${data.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #22c55e;">🎉 Congratulations!</h2>
              <p>Dear ${data.candidateName},</p>
              <p>We are pleased to offer you the position of <strong>${data.jobTitle}</strong> at ${data.companyName}!</p>
              <p>We were impressed with your qualifications and believe you will be a great addition to our team.</p>
              <p>You will receive a formal offer letter with detailed information about compensation, benefits, and next steps within the next 24-48 hours.</p>
              <p>Please feel free to reach out if you have any questions in the meantime.</p>
              <p>We look forward to welcoming you to the team!</p>
              <p>Best regards,<br>${data.companyName} Recruiting Team</p>
            </div>
          `,
        };

      case 'interview_invite':
        return this.getInterviewInviteTemplate(data);

      case 'custom':
        return {
          subject: data.customSubject || `Update regarding ${data.jobTitle}`,
          html: data.customBody || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <p>Dear ${data.candidateName},</p>
              <p>${data.customBody}</p>
              <p>Best regards,<br>${data.companyName} Recruiting Team</p>
            </div>
          `,
        };

      default:
        return {
          subject: `Update regarding your application`,
          html: `<p>Thank you for your application.</p>`,
        };
    }
  }

  private getInterviewInviteTemplate(data: {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    interviewDate: Date;
    interviewType: string;
    duration: number;
    location?: string;
    meetingLink?: string;
  }): EmailTemplate {
    const formattedDate = data.interviewDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    return {
      subject: `Interview Invitation: ${data.jobTitle} at ${data.companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #3b82f6; margin-bottom: 20px;">📅 Interview Invitation</h2>
            
            <p>Dear ${data.candidateName},</p>
            
            <p>We are excited to invite you for an interview for the <strong>${data.jobTitle}</strong> position at ${data.companyName}!</p>
            
            <div style="background-color: #eff6ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h3 style="margin-top: 0; color: #1e40af;">Interview Details</h3>
              <p style="margin: 8px 0;"><strong>Type:</strong> ${data.interviewType.replace('_', ' ').toUpperCase()}</p>
              <p style="margin: 8px 0;"><strong>Date & Time:</strong> ${formattedDate}</p>
              <p style="margin: 8px 0;"><strong>Duration:</strong> ${data.duration} minutes</p>
              ${data.location ? `<p style="margin: 8px 0;"><strong>Location:</strong> ${data.location}</p>` : ''}
              ${data.meetingLink ? `
                <p style="margin: 8px 0;"><strong>Meeting Link:</strong></p>
                <a href="${data.meetingLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 8px;">
                  Join Interview
                </a>
              ` : ''}
            </div>
            
            <p>Please confirm your availability by replying to this email. If this time doesn't work for you, please let us know your availability for the next few days.</p>
            
            <p><strong>Preparation Tips:</strong></p>
            <ul>
              <li>Review the job description and your resume</li>
              <li>Prepare examples of your relevant experience</li>
              <li>Have questions ready about the role and company</li>
              ${data.meetingLink ? '<li>Test your video and audio setup in advance</li>' : ''}
            </ul>
            
            <p>We look forward to speaking with you!</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>${data.companyName} Recruiting Team</strong></p>
          </div>
        </div>
      `,
    };
  }

  async integrateScorecardWithPipeline(applicationId: number, recruiterId: string) {
    console.log(`🔗 [ATS] Integrating scorecard with pipeline for application ${applicationId}`);
  }

  async getUnifiedDashboardData(recruiterId: string) {
    const pipeline = await this.getApplicationPipeline(recruiterId);
    
    const stats = {
      totalApplications: Object.values(pipeline).flat().length,
      newApplications: pipeline.new.length,
      interviewsScheduled: pipeline.interview_scheduled.length,
      offersExtended: pipeline.offer.length,
      acceptances: pipeline.accepted.length,
      rejections: pipeline.rejected.length,
    };

    return {
      pipeline,
      stats,
    };
  }
}

export const unifiedAtsService = new UnifiedAtsService();
