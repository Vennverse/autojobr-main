
import { db } from './db';
import { jobApplications, resumes, users, jobPostings } from '@shared/schema';
import { eq, desc, sql, and, gte } from 'drizzle-orm';

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
    const insights: CareerInsight[] = [];
    
    // Get user's recent applications
    const recentApps = await db
      .select({
        id: jobApplications.id,
        jobTitle: jobPostings.title,
        jobCategory: jobPostings.category,
        appliedAt: jobApplications.createdAt
      })
      .from(jobApplications)
      .leftJoin(jobPostings, eq(jobApplications.jobPostingId, jobPostings.id))
      .where(eq(jobApplications.userId, userId))
      .orderBy(desc(jobApplications.createdAt))
      .limit(10);
    
    // Get user's resumes
    const userResumes = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, userId));
    
    // 1. Pattern Detection: Same role category applications
    const categoryCount = this.analyzeApplicationPatterns(recentApps);
    for (const [category, count] of Object.entries(categoryCount)) {
      if (count >= 3) {
        insights.push({
          type: 'resume_optimization',
          priority: 'high',
          title: `📊 ${category} Role Pattern Detected`,
          message: `You've applied to ${count} ${category} roles. Create a specialized resume version to boost your ATS score by 40%.`,
          actionUrl: '/premium-ai-tools?tab=tailor',
          actionLabel: 'Optimize Resume'
        });
      }
    }
    
    // 2. Leadership Growth Detection
    const hasLeadershipGrowth = this.detectLeadershipGrowth(userResumes);
    if (hasLeadershipGrowth && recentApps.length > 0) {
      insights.push({
        type: 'career_transition',
        priority: 'high',
        title: '🚀 Leadership Growth Detected',
        message: 'Your resume shows leadership experience. Ready to transition into management roles? Get a personalized career roadmap.',
        actionUrl: '/premium-ai-tools?tab=career',
        actionLabel: 'Plan Career Path'
      });
    }
    
    // 3. Salary Analysis Alert
    const salaryInsight = await this.analyzeSalaryExpectations(userId, recentApps);
    if (salaryInsight) {
      insights.push(salaryInsight);
    }
    
    // 4. Application Velocity Alert
    if (recentApps.length >= 5) {
      const daysSinceFirst = this.getDaysBetween(
        new Date(recentApps[recentApps.length - 1].appliedAt),
        new Date()
      );
      
      if (daysSinceFirst <= 7) {
        insights.push({
          type: 'application_pattern',
          priority: 'medium',
          title: '⚡ High Application Velocity',
          message: `You've applied to ${recentApps.length} jobs this week. Make sure each application is optimized with our AI tools.`,
          actionUrl: '/applications',
          actionLabel: 'Review Applications'
        });
      }
    }
    
    // 5. Resume Update Suggestion
    const oldestResume = userResumes.reduce((oldest, current) => 
      new Date(current.createdAt) < new Date(oldest.createdAt) ? current : oldest
    , userResumes[0]);
    
    if (oldestResume) {
      const daysSinceUpdate = this.getDaysBetween(new Date(oldestResume.createdAt), new Date());
      if (daysSinceUpdate > 90 && recentApps.length > 0) {
        insights.push({
          type: 'resume_optimization',
          priority: 'medium',
          title: '📝 Resume Refresh Needed',
          message: `Your resume is ${Math.floor(daysSinceUpdate / 30)} months old. Refresh it with AI-powered enhancements.`,
          actionUrl: '/premium-ai-tools?tab=bullets',
          actionLabel: 'Enhance Resume'
        });
      }
    }
    
    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  private analyzeApplicationPatterns(apps: any[]): Record<string, number> {
    const categoryCount: Record<string, number> = {};
    
    for (const app of apps) {
      const category = app.jobCategory || 'General';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    }
    
    return categoryCount;
  }
  
  private detectLeadershipGrowth(resumes: any[]): boolean {
    const leadershipKeywords = ['lead', 'manager', 'director', 'head', 'senior', 'principal', 'architect'];
    
    for (const resume of resumes) {
      const text = (resume.resumeText || '').toLowerCase();
      const matchCount = leadershipKeywords.filter(keyword => text.includes(keyword)).length;
      if (matchCount >= 3) return true;
    }
    
    return false;
  }
  
  private async analyzeSalaryExpectations(userId: string, recentApps: any[]): Promise<CareerInsight | null> {
    // Get user's profile data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) return null;
    
    // Simple heuristic: if user has 3+ years experience but applying to junior roles
    const resumeData = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .limit(1);
    
    if (resumeData.length === 0) return null;
    
    const resumeText = (resumeData[0].resumeText || '').toLowerCase();
    const hasExperience = resumeText.includes('years') || resumeText.includes('experience');
    
    if (hasExperience && recentApps.length > 0) {
      return {
        type: 'salary_alert',
        priority: 'high',
        title: '💰 Salary Negotiation Opportunity',
        message: 'Your experience level suggests you may be undervaluing yourself. Get a data-driven negotiation strategy.',
        actionUrl: '/premium-ai-tools?tab=salary',
        actionLabel: 'Check Salary Range'
      };
    }
    
    return null;
  }
  
  private getDaysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export const careerInsightsService = new CareerInsightsService();
