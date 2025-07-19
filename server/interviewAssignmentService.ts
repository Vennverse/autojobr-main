import { db } from "./db";
import { 
  virtualInterviews, 
  mockInterviews, 
  interviewRetakePayments, 
  users, 
  jobPostings,
  jobPostingApplications
} from "@shared/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { sendEmail } from "./emailService";
import { paymentService } from "./paymentService";
import type { 
  InsertVirtualInterview, 
  InsertMockInterview, 
  InsertInterviewRetakePayment 
} from "@shared/schema";

export class InterviewAssignmentService {
  
  // Assign virtual interview to a candidate
  async assignVirtualInterview(data: {
    recruiterId: string;
    candidateId: string;
    jobPostingId?: number;
    interviewType: string;
    role: string;
    company?: string;
    difficulty: string;
    duration: number;
    dueDate: Date;
    interviewerPersonality: string;
    jobDescription?: string;
  }) {
    const sessionId = `virtual_assigned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Use only fields that exist in the database (like test assignment)
    const interviewData = {
      userId: data.candidateId,
      sessionId,
      interviewType: data.interviewType,
      role: data.role,
      company: data.company,
      difficulty: data.difficulty,
      duration: data.duration,
      interviewerPersonality: data.interviewerPersonality,
      jobDescription: data.jobDescription,
      status: "assigned"
    };

    // Use raw SQL to bypass schema validation issues
    const result = await db.execute(sql`
      INSERT INTO virtual_interviews (
        user_id, session_id, interview_type, role, company, 
        difficulty, duration, interviewer_personality, job_description, status,
        assigned_by, assigned_at, due_date
      ) VALUES (
        ${data.candidateId}, ${sessionId}, ${data.interviewType}, ${data.role}, 
        ${data.company}, ${data.difficulty}, ${data.duration}, 
        ${data.interviewerPersonality}, ${data.jobDescription}, 'assigned',
        ${data.recruiterId}, NOW(), ${data.dueDate.toISOString()}
      ) RETURNING *
    `);
    
    const interview = result.rows[0];

    // Send email notification to candidate
    await this.sendAssignmentEmail(
      data.candidateId,
      data.recruiterId,
      interview.id,
      'virtual',
      data.dueDate,
      data.role,
      data.company
    );

    // Mark email as sent using raw SQL
    await db.execute(sql`
      UPDATE virtual_interviews SET email_sent = true WHERE id = ${interview.id}
    `);

    return interview;
  }

  // Assign mock interview to a candidate
  async assignMockInterview(data: {
    recruiterId: string;
    candidateId: string;
    jobPostingId?: number;
    interviewType: string;
    role: string;
    company?: string;
    difficulty: string;
    language: string;
    totalQuestions: number;
    dueDate: Date;
  }) {
    const sessionId = `mock_assigned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Use only fields that exist in the database (same pattern as working test assignment)
    const interviewData = {
      userId: data.candidateId,
      sessionId,
      interviewType: data.interviewType,
      role: data.role,
      company: data.company,
      difficulty: data.difficulty,
      language: data.language,
      totalQuestions: data.totalQuestions,
      status: "assigned"
    };

    // Use raw SQL to bypass schema validation issues  
    const result = await db.execute(sql`
      INSERT INTO mock_interviews (
        user_id, session_id, interview_type, role, company,
        difficulty, language, total_questions, status,
        assigned_by, assigned_at, due_date
      ) VALUES (
        ${data.candidateId}, ${sessionId}, ${data.interviewType}, ${data.role},
        ${data.company}, ${data.difficulty}, ${data.language}, ${data.totalQuestions}, 'assigned',
        ${data.recruiterId}, NOW(), ${data.dueDate.toISOString()}
      ) RETURNING *
    `);
    
    const interview = result.rows[0];

    // Send email notification to candidate
    await this.sendAssignmentEmail(
      data.candidateId,
      data.recruiterId,
      interview.id,
      'mock',
      data.dueDate,
      data.role,
      data.company
    );

    // Mark email as sent using raw SQL
    await db.execute(sql`
      UPDATE mock_interviews SET email_sent = true WHERE id = ${interview.id}
    `);

    return interview;
  }

  // Process retake payment for virtual interview
  async processVirtualInterviewRetakePayment(data: {
    userId: string;
    interviewId: number;
    paymentProvider: 'stripe' | 'paypal' | 'razorpay';
    amount?: number;
  }) {
    const interview = await db
      .select()
      .from(virtualInterviews)
      .where(eq(virtualInterviews.id, data.interviewId))
      .then(rows => rows[0]);

    if (!interview) {
      throw new Error('Interview not found');
    }

    if (interview.retakeCount >= interview.maxRetakes) {
      throw new Error('Maximum retakes exceeded');
    }

    const retakePayment: InsertInterviewRetakePayment = {
      userId: data.userId,
      interviewType: 'virtual',
      interviewId: data.interviewId,
      amount: data.amount || 500, // $5 default
      paymentProvider: data.paymentProvider,
      retakeNumber: interview.retakeCount + 1,
      previousScore: interview.overallScore || 0,
      status: 'pending'
    };

    const [payment] = await db
      .insert(interviewRetakePayments)
      .values(retakePayment)
      .returning();

    // Process payment based on provider
    let paymentResult;
    switch (data.paymentProvider) {
      case 'stripe':
        paymentResult = await paymentService.createStripePaymentIntent(data.amount || 500, 'usd');
        await db
          .update(interviewRetakePayments)
          .set({ paymentIntentId: paymentResult.id })
          .where(eq(interviewRetakePayments.id, payment.id));
        break;
      case 'paypal':
        paymentResult = await paymentService.createPaypalOrder(data.amount || 500, 'USD');
        await db
          .update(interviewRetakePayments)
          .set({ paypalOrderId: paymentResult.id })
          .where(eq(interviewRetakePayments.id, payment.id));
        break;
      case 'razorpay':
        paymentResult = await paymentService.createRazorpayOrder(data.amount || 500, 'USD');
        await db
          .update(interviewRetakePayments)
          .set({ razorpayOrderId: paymentResult.id })
          .where(eq(interviewRetakePayments.id, payment.id));
        break;
    }

    return {
      payment,
      paymentResult
    };
  }

  // Process retake payment for mock interview
  async processMockInterviewRetakePayment(data: {
    userId: string;
    interviewId: number;
    paymentProvider: 'stripe' | 'paypal' | 'razorpay';
    amount?: number;
  }) {
    const interview = await db
      .select()
      .from(mockInterviews)
      .where(eq(mockInterviews.id, data.interviewId))
      .then(rows => rows[0]);

    if (!interview) {
      throw new Error('Interview not found');
    }

    if (interview.retakeCount >= interview.maxRetakes) {
      throw new Error('Maximum retakes exceeded');
    }

    const retakePayment: InsertInterviewRetakePayment = {
      userId: data.userId,
      interviewType: 'mock',
      interviewId: data.interviewId,
      amount: data.amount || 500, // $5 default
      paymentProvider: data.paymentProvider,
      retakeNumber: interview.retakeCount + 1,
      previousScore: interview.score || 0,
      status: 'pending'
    };

    const [payment] = await db
      .insert(interviewRetakePayments)
      .values(retakePayment)
      .returning();

    // Process payment based on provider
    let paymentResult;
    switch (data.paymentProvider) {
      case 'stripe':
        paymentResult = await paymentService.createStripePaymentIntent(data.amount || 500, 'usd');
        await db
          .update(interviewRetakePayments)
          .set({ paymentIntentId: paymentResult.id })
          .where(eq(interviewRetakePayments.id, payment.id));
        break;
      case 'paypal':
        paymentResult = await paymentService.createPaypalOrder(data.amount || 500, 'USD');
        await db
          .update(interviewRetakePayments)
          .set({ paypalOrderId: paymentResult.id })
          .where(eq(interviewRetakePayments.id, payment.id));
        break;
      case 'razorpay':
        paymentResult = await paymentService.createRazorpayOrder(data.amount || 500, 'USD');
        await db
          .update(interviewRetakePayments)
          .set({ razorpayOrderId: paymentResult.id })
          .where(eq(interviewRetakePayments.id, payment.id));
        break;
    }

    return {
      payment,
      paymentResult
    };
  }

  // Get partial results for recruiter (summary only)
  async getPartialResultsForRecruiter(interviewId: number, interviewType: 'virtual' | 'mock', recruiterId: string) {
    if (interviewType === 'virtual') {
      const interview = await db
        .select({
          id: virtualInterviews.id,
          userId: virtualInterviews.userId,
          sessionId: virtualInterviews.sessionId,
          interviewType: virtualInterviews.interviewType,
          role: virtualInterviews.role,
          company: virtualInterviews.company,
          difficulty: virtualInterviews.difficulty,
          status: virtualInterviews.status,
          overallScore: virtualInterviews.overallScore,
          technicalScore: virtualInterviews.technicalScore,
          communicationScore: virtualInterviews.communicationScore,
          confidenceScore: virtualInterviews.confidenceScore,
          strengths: virtualInterviews.strengths,
          weaknesses: virtualInterviews.weaknesses,
          startTime: virtualInterviews.startTime,
          endTime: virtualInterviews.endTime,
          assignedBy: virtualInterviews.assignedBy,
          // Hide detailed feedback and recommendations from recruiter
          candidateName: users.firstName,
          candidateEmail: users.email
        })
        .from(virtualInterviews)
        .leftJoin(users, eq(virtualInterviews.userId, users.id))
        .where(
          and(
            eq(virtualInterviews.id, interviewId),
            eq(virtualInterviews.assignedBy, recruiterId)
          )
        )
        .then(rows => rows[0]);

      if (!interview) {
        throw new Error('Interview not found or access denied');
      }

      return {
        ...interview,
        // Provide only summary-level feedback to encourage retakes
        partialFeedback: interview.overallScore && interview.overallScore < 80 
          ? "Performance shows room for improvement. Consider retaking for better results."
          : interview.overallScore && interview.overallScore >= 80
          ? "Good performance demonstrated. Results available for detailed review."
          : "Interview in progress or not yet scored.",
        canRetake: true, // Allow retakes by default
        retakePrice: 5.00
      };
    } else {
      const interview = await db
        .select({
          id: mockInterviews.id,
          userId: mockInterviews.userId,
          sessionId: mockInterviews.sessionId,
          interviewType: mockInterviews.interviewType,
          role: mockInterviews.role,
          company: mockInterviews.company,
          difficulty: mockInterviews.difficulty,
          language: mockInterviews.language,
          status: mockInterviews.status,
          score: mockInterviews.score,
          startTime: mockInterviews.startTime,
          endTime: mockInterviews.endTime,
          assignedBy: mockInterviews.assignedBy,
          // Hide detailed feedback from recruiter
          candidateName: users.firstName,
          candidateEmail: users.email
        })
        .from(mockInterviews)
        .leftJoin(users, eq(mockInterviews.userId, users.id))
        .where(
          and(
            eq(mockInterviews.id, interviewId),
            eq(mockInterviews.assignedBy, recruiterId)
          )
        )
        .then(rows => rows[0]);

      if (!interview) {
        throw new Error('Interview not found or access denied');
      }

      return {
        ...interview,
        // Provide only summary-level feedback to encourage retakes
        partialFeedback: interview.score && interview.score < 80 
          ? "Performance shows room for improvement. Consider retaking for better results."
          : interview.score && interview.score >= 80
          ? "Good performance demonstrated. Results available for detailed review."
          : "Interview in progress or not yet scored.",
        canRetake: true, // Allow retakes by default
        retakePrice: 5.00
      };
    }
  }

  // Get recruiter's assigned interviews
  async getRecruiterAssignedInterviews(recruiterId: string) {
    try {
      // Use raw SQL to avoid potential circular reference issues
      const virtualInterviewsQuery = await db.execute(sql`
        SELECT 
          vi.id,
          vi.interview_type as type,
          vi.role,
          vi.company,
          vi.difficulty,
          vi.status,
          vi.assigned_at as "assignedAt",
          vi.due_date as "dueDate",
          vi.overall_score as "overallScore",
          u.first_name as "candidateName",
          u.email as "candidateEmail",
          'virtual' as "interviewCategory"
        FROM virtual_interviews vi
        LEFT JOIN users u ON vi.user_id = u.id
        WHERE vi.assigned_by = ${recruiterId}
        ORDER BY vi.assigned_at DESC
      `);

      const mockInterviewsQuery = await db.execute(sql`
        SELECT 
          mi.id,
          mi.interview_type as type,
          mi.role,
          mi.company,
          mi.difficulty,
          mi.status,
          mi.assigned_at as "assignedAt",
          mi.due_date as "dueDate",
          mi.score as "overallScore",
          u.first_name as "candidateName",
          u.email as "candidateEmail",
          'mock' as "interviewCategory"
        FROM mock_interviews mi
        LEFT JOIN users u ON mi.user_id = u.id
        WHERE mi.assigned_by = ${recruiterId}
        ORDER BY mi.assigned_at DESC
      `);

      const virtualInterviewsData = virtualInterviewsQuery.rows || [];
      const mockInterviewsData = mockInterviewsQuery.rows || [];

      return [...virtualInterviewsData, ...mockInterviewsData]
        .sort((a: any, b: any) => {
          const dateA = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;
          const dateB = b.assignedAt ? new Date(b.assignedAt).getTime() : 0;
          return dateB - dateA;
        });
    } catch (error) {
      console.error('Error fetching recruiter assigned interviews:', error);
      return [];
    }
  }

  // Get assignment statistics for recruiter
  async getAssignmentStats(recruiterId: string) {
    try {
      // Get virtual interview stats
      const virtualStats = await db
        .select({
          count: count(),
          completed: count(sql`CASE WHEN ${virtualInterviews.status} = 'completed' THEN 1 END`),
          pending: count(sql`CASE WHEN ${virtualInterviews.status} = 'pending' THEN 1 END`),
          avgScore: sql`AVG(${virtualInterviews.overallScore})`
        })
        .from(virtualInterviews)
        .where(eq(virtualInterviews.assignedBy, recruiterId))
        .groupBy(virtualInterviews.assignedBy);

      // Get mock interview stats
      const mockStats = await db
        .select({
          count: count(),
          completed: count(sql`CASE WHEN ${mockInterviews.status} = 'completed' THEN 1 END`),
          pending: count(sql`CASE WHEN ${mockInterviews.status} = 'pending' THEN 1 END`),
          avgScore: sql`AVG(${mockInterviews.score})`
        })
        .from(mockInterviews)
        .where(eq(mockInterviews.assignedBy, recruiterId))
        .groupBy(mockInterviews.assignedBy);

      const virtualData = virtualStats[0] || { count: 0, completed: 0, pending: 0, avgScore: 0 };
      const mockData = mockStats[0] || { count: 0, completed: 0, pending: 0, avgScore: 0 };

      return {
        total: Number(virtualData.count) + Number(mockData.count),
        completed: Number(virtualData.completed) + Number(mockData.completed),
        pending: Number(virtualData.pending) + Number(mockData.pending),
        averageScore: (Number(virtualData.avgScore) + Number(mockData.avgScore)) / 2 || 0,
        virtual: {
          count: Number(virtualData.count),
          completed: Number(virtualData.completed),
          pending: Number(virtualData.pending),
          avgScore: Number(virtualData.avgScore) || 0
        },
        mock: {
          count: Number(mockData.count),
          completed: Number(mockData.completed),
          pending: Number(mockData.pending),
          avgScore: Number(mockData.avgScore) || 0
        }
      };
    } catch (error) {
      console.error('Error fetching assignment stats:', error);
      return {
        total: 0,
        completed: 0,
        pending: 0,
        averageScore: 0,
        virtual: { count: 0, completed: 0, pending: 0, avgScore: 0 },
        mock: { count: 0, completed: 0, pending: 0, avgScore: 0 }
      };
    }
  }

  // Get candidates (job seekers) for interview assignment
  async getCandidates() {
    try {
      const candidates = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          userType: users.userType,
          createdAt: users.createdAt,
          isActive: users.isActive
        })
        .from(users)
        .where(eq(users.userType, 'jobSeeker'))
        .orderBy(desc(users.createdAt));

      // Format candidates with names
      return candidates.map(candidate => ({
        id: candidate.id,
        name: `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || candidate.email,
        email: candidate.email,
        userType: candidate.userType,
        createdAt: candidate.createdAt,
        isActive: candidate.isActive
      }));
    } catch (error) {
      console.error('Error fetching candidates:', error);
      return [];
    }
  }

  // Get candidates who applied to a specific job posting
  async getCandidatesForJobPosting(jobPostingId: number) {
    try {
      console.log(`Fetching candidates for job posting: ${jobPostingId}`);
      
      // Use the same structure as the working storage service
      const candidatesWithApplications = await db
        .select({
          // User info
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          userType: users.userType,
          createdAt: users.createdAt,
          // Application info
          applicationId: jobPostingApplications.id,
          applicationStatus: jobPostingApplications.status,
          appliedAt: jobPostingApplications.appliedAt,
          matchScore: jobPostingApplications.matchScore
        })
        .from(jobPostingApplications)
        .leftJoin(users, eq(jobPostingApplications.applicantId, users.id))
        .where(eq(jobPostingApplications.jobPostingId, jobPostingId))
        .orderBy(desc(jobPostingApplications.appliedAt));

      console.log(`Found ${candidatesWithApplications.length} candidates for job ${jobPostingId}`);

      // Format candidates with names and application info
      return candidatesWithApplications.map(candidate => ({
        id: candidate.id,
        name: `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || candidate.email,
        email: candidate.email,
        userType: candidate.userType,
        createdAt: candidate.createdAt,
        applicationId: candidate.applicationId,
        applicationStatus: candidate.applicationStatus,
        appliedAt: candidate.appliedAt,
        matchScore: candidate.matchScore
      }));
    } catch (error) {
      console.error('Error fetching candidates for job posting:', error);
      return [];
    }
  }

  // Send assignment email notification
  private async sendAssignmentEmail(
    candidateId: string,
    recruiterId: string,
    interviewId: number,
    interviewType: 'virtual' | 'mock',
    dueDate: Date,
    role: string,
    company?: string
  ) {
    const [candidate, recruiter] = await Promise.all([
      db.select().from(users).where(eq(users.id, candidateId)).then(rows => rows[0]),
      db.select().from(users).where(eq(users.id, recruiterId)).then(rows => rows[0])
    ]);

    if (!candidate || !recruiter) {
      throw new Error('Candidate or recruiter not found');
    }

    // Get the session ID for the interview to create the correct URL
    let sessionId: string;
    if (interviewType === 'virtual') {
      const interview = await db.select().from(virtualInterviews).where(eq(virtualInterviews.id, interviewId)).then(rows => rows[0]);
      sessionId = interview?.sessionId || String(interviewId);
    } else {
      const interview = await db.select().from(mockInterviews).where(eq(mockInterviews.id, interviewId)).then(rows => rows[0]);
      sessionId = interview?.sessionId || String(interviewId);
    }

    const interviewTypeText = interviewType === 'virtual' ? 'Virtual AI Interview' : 'Mock Interview';
    const companyText = company ? ` at ${company}` : '';
    const interviewUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/${interviewType}-interview/${sessionId}`;

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Interview Assignment - ${interviewTypeText}</h2>
        
        <p>Dear ${candidate.firstName},</p>
        
        <p>You have been assigned a <strong>${interviewTypeText}</strong> for the <strong>${role}</strong> position${companyText} by <strong>${recruiter.firstName} ${recruiter.lastName}</strong>.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Interview Details:</h3>
          <ul style="margin: 10px 0;">
            <li><strong>Position:</strong> ${role}</li>
            ${company ? `<li><strong>Company:</strong> ${company}</li>` : ''}
            <li><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</li>
            <li><strong>Interview Type:</strong> ${interviewTypeText}</li>
          </ul>
        </div>
        
        <p style="margin: 20px 0;">
          <a href="${interviewUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Start Interview
          </a>
        </p>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;"><strong>Important:</strong> Please complete the interview by ${dueDate.toLocaleDateString()}. Your results will be shared with the recruiter in summary form only.</p>
        </div>
        
        <p>If you have any questions, please contact the recruiter directly.</p>
        
        <p>Best regards,<br>AutoJobr Team</p>
      </div>
    `;

    await sendEmail({
      to: candidate.email!,
      subject: `Interview Assignment: ${role} Position`,
      html: emailContent
    });
  }
}

export const interviewAssignmentService = new InterviewAssignmentService();