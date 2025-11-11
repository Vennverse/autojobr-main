
import { db } from './db';
import { jobApplications, resumes, users, jobPostings, userSkills } from '@shared/schema';
import { eq, desc, sql, and, gte, count } from 'drizzle-orm';

interface CareerInsight {
  type: 'resume_optimization' | 'career_transition' | 'salary_alert' | 'skill_gap' | 'application_pattern';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionUrl: string;
  actionLabel: string;
  data?: any;
}

export class CareerInsightsService {
  
  async generateProactiveInsights(userId: string): Promise<CareerInsight[]> {
    console.log('[CAREER INSIGHTS] Generating rule-based insights for user:', userId);
    const insights: CareerInsight[] = [];
    
    // Get user data in parallel for efficiency
    const [recentApps, userResumes, user, skills] = await Promise.all([
      db.select({
        id: jobApplications.id,
        jobTitle: jobApplications.jobTitle,
        jobCategory: jobApplications.jobType,
        appliedAt: jobApplications.appliedDate
      })
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId))
      .orderBy(desc(jobApplications.appliedDate))
      .limit(10),
      
      db.select()
        .from(resumes)
        .where(eq(resumes.userId, userId))
        .orderBy(desc(resumes.createdAt)),
        
      db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
        
      db.select()
        .from(userSkills)
        .where(eq(userSkills.userId, userId))
    ]);
    
    console.log('[CAREER INSIGHTS] Data fetched - Apps:', recentApps.length, 'Resumes:', userResumes.length);
    
    // Rule 1: Application Pattern Analysis (no AI needed)
    const categoryCount = this.analyzeApplicationPatterns(recentApps);
    for (const [category, count] of Object.entries(categoryCount)) {
      if (count >= 3) {
        insights.push({
          type: 'application_pattern',
          priority: 'high',
          title: `📊 ${category} Role Focus Detected`,
          message: `You've applied to ${count} ${category} positions. Consider tailoring your resume to highlight relevant ${category} experience.`,
          actionUrl: '/resumes',
          actionLabel: 'Update Resume'
        });
        break; // Only show top pattern
      }
    }
    
    // Rule 2: Resume Score Analysis (simple check)
    const latestResume = userResumes[0];
    if (latestResume && latestResume.atsScore) {
      if (latestResume.atsScore < 70) {
        insights.push({
          type: 'resume_optimization',
          priority: 'high',
          title: '🎯 ATS Score Below Target',
          message: `Your resume scores ${latestResume.atsScore}%. Aim for 70+ to pass most ATS systems.`,
          actionUrl: '/resumes',
          actionLabel: 'Improve Score'
        });
      }
    }
    
    // Rule 3: Application Velocity Check
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentAppsLast7Days = recentApps.filter(app => 
      app.appliedAt && new Date(app.appliedAt) >= last7Days
    );
    
    if (recentAppsLast7Days.length >= 5) {
      insights.push({
        type: 'application_pattern',
        priority: 'medium',
        title: '⚡ Strong Application Activity',
        message: `${recentAppsLast7Days.length} applications this week! Keep momentum going and track your progress.`,
        actionUrl: '/applications',
        actionLabel: 'View Progress'
      });
    } else if (recentApps.length > 0 && recentAppsLast7Days.length === 0) {
      insights.push({
        type: 'application_pattern',
        priority: 'medium',
        title: '📅 Time to Apply',
        message: `No applications in the past week. Consistency is key - aim for 3-5 quality applications weekly.`,
        actionUrl: '/jobs',
        actionLabel: 'Find Jobs'
      });
    }
    
    // Rule 4: Resume Freshness Check
    if (latestResume && latestResume.createdAt) {
      const daysSinceUpdate = this.getDaysBetween(new Date(latestResume.createdAt), new Date());
      if (daysSinceUpdate > 90 && recentApps.length > 0) {
        insights.push({
          type: 'resume_optimization',
          priority: 'medium',
          title: '📝 Resume Update Recommended',
          message: `Resume last updated ${Math.floor(daysSinceUpdate / 30)} months ago. Fresh resumes perform 30% better.`,
          actionUrl: '/resumes',
          actionLabel: 'Update Resume'
        });
      }
    }
    
    // Rule 5: Skills Gap Analysis (based on user data)
    const totalSkills = skills.length;
    if (totalSkills < 5 && recentApps.length > 0) {
      insights.push({
        type: 'skill_gap',
        priority: 'high',
        title: '🔧 Skills Profile Incomplete',
        message: `Only ${totalSkills} skills listed. Add 10+ relevant skills to improve job matching.`,
        actionUrl: '/profile',
        actionLabel: 'Add Skills'
      });
    }
    
    // Starter recommendations for new users
    if (insights.length === 0) {
      if (!latestResume) {
        insights.push({
          type: 'resume_optimization',
          priority: 'high',
          title: '🚀 Upload Your Resume',
          message: 'Get started by uploading your resume to receive instant ATS score and optimization tips.',
          actionUrl: '/resumes',
          actionLabel: 'Upload Resume'
        });
      }
      
      if (recentApps.length === 0) {
        insights.push({
          type: 'application_pattern',
          priority: 'medium',
          title: '💼 Start Your Job Search',
          message: 'Browse thousands of job openings and start applying today.',
          actionUrl: '/jobs',
          actionLabel: 'Find Jobs'
        });
      }
      
      if (totalSkills === 0) {
        insights.push({
          type: 'skill_gap',
          priority: 'medium',
          title: '🎯 Complete Your Profile',
          message: 'Add your skills and experience to get better job recommendations.',
          actionUrl: '/profile',
          actionLabel: 'Update Profile'
        });
      }
    }
    
    console.log('[CAREER INSIGHTS] Rule-based insights generated:', insights.length);
    
    // Sort by priority and return top 3
    return insights
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 3);
  }
  
  private analyzeApplicationPatterns(apps: any[]): Record<string, number> {
    const categoryCount: Record<string, number> = {};
    
    for (const app of apps) {
      const category = app.jobCategory || app.jobTitle?.split(' ')[0] || 'General';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    }
    
    // Sort by frequency
    return Object.fromEntries(
      Object.entries(categoryCount).sort(([,a], [,b]) => b - a)
    );
  }
  
  private getDaysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export const careerInsightsService = new CareerInsightsService();
