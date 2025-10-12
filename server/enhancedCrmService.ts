import { Request, Response } from 'express';
import { eq, and, desc, gte, lte, sql, or, count } from 'drizzle-orm';
import { db } from './db';
import { 
  crmContacts, 
  contactInteractions, 
  pipelineStages, 
  pipelineItems,
  tasks,
  taskReminders,
  users
} from '@shared/schema';
import { aiService } from './aiService';

export class EnhancedCrmService {
  // ============= ROLE-BASED CONTACT MANAGEMENT =============
  
  // Get contact types based on user role
  static getContactTypesByRole(userType: string) {
    if (userType === 'recruiter') {
      return ['candidate', 'hiring_manager', 'client', 'referral', 'vendor'];
    } else {
      return ['recruiter', 'hiring_manager', 'referral', 'colleague', 'company'];
    }
  }

  // Get analytics dashboard data
  static async getAnalytics(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const userType = (req.user as any)?.userType;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get time-based metrics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Total contacts
      const totalContacts = await db.select({ count: count() })
        .from(crmContacts)
        .where(eq(crmContacts.userId, userId));

      // Active contacts (contacted in last 30 days)
      const activeContacts = await db.select({ count: count() })
        .from(crmContacts)
        .where(and(
          eq(crmContacts.userId, userId),
          gte(crmContacts.lastContactDate, thirtyDaysAgo)
        ));

      // Contacts needing follow-up
      const followUpContacts = await db.select({ count: count() })
        .from(crmContacts)
        .where(and(
          eq(crmContacts.userId, userId),
          lte(crmContacts.nextTouchDate, new Date()),
          eq(crmContacts.status, 'active')
        ));

      // Total interactions last 30 days
      const recentInteractions = await db.select({ count: count() })
        .from(contactInteractions)
        .where(and(
          eq(contactInteractions.userId, userId),
          gte(contactInteractions.interactionDate, thirtyDaysAgo)
        ));

      // Interactions by type (last 30 days)
      const interactionsByType = await db.select({
        type: contactInteractions.interactionType,
        count: count()
      })
        .from(contactInteractions)
        .where(and(
          eq(contactInteractions.userId, userId),
          gte(contactInteractions.interactionDate, thirtyDaysAgo)
        ))
        .groupBy(contactInteractions.interactionType);

      // Pipeline conversion metrics
      const pipelineMetrics = await db.select({
        stage: pipelineStages.stageName,
        count: count()
      })
        .from(pipelineItems)
        .innerJoin(pipelineStages, eq(pipelineItems.stageId, pipelineStages.id))
        .where(eq(pipelineItems.userId, userId))
        .groupBy(pipelineStages.stageName);

      // Weekly activity trend
      const weeklyActivity = await db.select({
        count: count()
      })
        .from(contactInteractions)
        .where(and(
          eq(contactInteractions.userId, userId),
          gte(contactInteractions.interactionDate, sevenDaysAgo)
        ));

      // Response rate calculation
      const emailsSent = await db.select({ count: count() })
        .from(contactInteractions)
        .where(and(
          eq(contactInteractions.userId, userId),
          eq(contactInteractions.interactionType, 'email'),
          gte(contactInteractions.interactionDate, thirtyDaysAgo)
        ));

      const responsesReceived = await db.select({ count: count() })
        .from(contactInteractions)
        .where(and(
          eq(contactInteractions.userId, userId),
          eq(contactInteractions.interactionType, 'email'),
          eq(contactInteractions.outcome, 'positive'),
          gte(contactInteractions.interactionDate, thirtyDaysAgo)
        ));

      const responseRate = emailsSent[0]?.count > 0 
        ? Math.round((responsesReceived[0]?.count / emailsSent[0]?.count) * 100)
        : 0;

      res.json({
        success: true,
        analytics: {
          overview: {
            totalContacts: totalContacts[0]?.count || 0,
            activeContacts: activeContacts[0]?.count || 0,
            followUpDue: followUpContacts[0]?.count || 0,
            interactionsLast30Days: recentInteractions[0]?.count || 0,
            weeklyActivity: weeklyActivity[0]?.count || 0,
            responseRate
          },
          interactionsByType,
          pipelineMetrics,
          roleSpecific: userType === 'recruiter' 
            ? await this.getRecruiterMetrics(userId)
            : await this.getJobSeekerMetrics(userId)
        }
      });
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  // Get recruiter-specific metrics
  private static async getRecruiterMetrics(userId: string) {
    // Candidates in pipeline
    const candidatesInPipeline = await db.select({ count: count() })
      .from(pipelineItems)
      .where(and(
        eq(pipelineItems.userId, userId),
        eq(pipelineItems.itemType, 'candidate')
      ));

    // Placements this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    
    const placementsThisMonth = await db.select({ count: count() })
      .from(pipelineItems)
      .innerJoin(pipelineStages, eq(pipelineItems.stageId, pipelineStages.id))
      .where(and(
        eq(pipelineItems.userId, userId),
        eq(pipelineStages.stageName, 'Placed'),
        gte(pipelineItems.updatedAt, firstDayOfMonth)
      ));

    return {
      candidatesInPipeline: candidatesInPipeline[0]?.count || 0,
      placementsThisMonth: placementsThisMonth[0]?.count || 0
    };
  }

  // Get job seeker-specific metrics
  private static async getJobSeekerMetrics(userId: string) {
    // Applications in pipeline
    const applicationsInPipeline = await db.select({ count: count() })
      .from(pipelineItems)
      .where(and(
        eq(pipelineItems.userId, userId),
        eq(pipelineItems.itemType, 'job_application')
      ));

    // Interviews this week
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const interviewsThisWeek = await db.select({ count: count() })
      .from(contactInteractions)
      .where(and(
        eq(contactInteractions.userId, userId),
        eq(contactInteractions.interactionType, 'interview'),
        gte(contactInteractions.interactionDate, sevenDaysAgo)
      ));

    return {
      applicationsInPipeline: applicationsInPipeline[0]?.count || 0,
      interviewsThisWeek: interviewsThisWeek[0]?.count || 0
    };
  }

  // AI-powered contact scoring
  static async scoreContact(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { contactId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get contact details
      const [contact] = await db.select()
        .from(crmContacts)
        .where(and(
          eq(crmContacts.id, parseInt(contactId)),
          eq(crmContacts.userId, userId)
        ));

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      // Get interaction history
      const interactions = await db.select()
        .from(contactInteractions)
        .where(eq(contactInteractions.contactId, parseInt(contactId)))
        .orderBy(desc(contactInteractions.interactionDate));

      // Calculate engagement score
      const engagementScore = this.calculateEngagementScore(contact, interactions);

      // Generate AI insights
      const aiInsight = await this.generateContactInsight(contact, interactions);

      // Determine priority
      const priority = engagementScore > 70 ? 'high' : engagementScore > 40 ? 'medium' : 'low';

      // Update contact priority
      await db.update(crmContacts)
        .set({ priority, customFields: { ...contact.customFields, engagementScore } })
        .where(eq(crmContacts.id, parseInt(contactId)));

      res.json({
        success: true,
        score: {
          engagementScore,
          priority,
          insight: aiInsight,
          factors: {
            recentActivity: interactions.length > 0,
            responseRate: this.calculateResponseRate(interactions),
            relationshipStrength: contact.relationship || 'new'
          }
        }
      });
    } catch (error) {
      console.error('Score contact error:', error);
      res.status(500).json({ error: 'Failed to score contact' });
    }
  }

  // Calculate engagement score
  private static calculateEngagementScore(contact: any, interactions: any[]): number {
    let score = 0;

    // Recent activity (40 points)
    if (contact.lastContactDate) {
      const daysSinceContact = Math.floor(
        (Date.now() - new Date(contact.lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      score += Math.max(0, 40 - daysSinceContact);
    }

    // Interaction frequency (30 points)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentInteractions = interactions.filter(i => 
      new Date(i.interactionDate) > thirtyDaysAgo
    );
    score += Math.min(30, recentInteractions.length * 5);

    // Response quality (30 points)
    const positiveInteractions = interactions.filter(i => i.outcome === 'positive');
    const responseRate = interactions.length > 0 
      ? (positiveInteractions.length / interactions.length) * 30
      : 0;
    score += responseRate;

    return Math.min(100, Math.round(score));
  }

  // Calculate response rate
  private static calculateResponseRate(interactions: any[]): number {
    if (interactions.length === 0) return 0;
    const positiveResponses = interactions.filter(i => i.outcome === 'positive').length;
    return Math.round((positiveResponses / interactions.length) * 100);
  }

  // Generate AI insight for contact
  private static async generateContactInsight(contact: any, interactions: any[]): string {
    try {
      const recentInteractions = interactions.slice(0, 3).map(i => 
        `${i.interactionType}: ${i.subject || i.description}`
      ).join('; ');

      const prompt = `Analyze this contact and provide a brief insight (max 50 words):
      Contact: ${contact.name} at ${contact.company || 'Unknown Company'}
      Recent interactions: ${recentInteractions || 'No recent interactions'}
      Last contact: ${contact.lastContactDate ? new Date(contact.lastContactDate).toLocaleDateString() : 'Never'}
      
      Provide actionable insight about next steps or relationship strength.`;

      const response = await aiService.createChatCompletion([
        { role: 'user', content: prompt }
      ], { maxTokens: 100, temperature: 0.7 });

      return response || 'Stay engaged with regular follow-ups to maintain relationship momentum.';
    } catch (error) {
      return 'Regular follow-up recommended to maintain engagement.';
    }
  }

  // Auto-create tasks from interactions
  static async autoCreateTasks(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Find contacts needing follow-up
      const contactsNeedingFollowUp = await db.select()
        .from(crmContacts)
        .where(and(
          eq(crmContacts.userId, userId),
          lte(crmContacts.nextTouchDate, new Date()),
          eq(crmContacts.status, 'active')
        ));

      const createdTasks = [];

      for (const contact of contactsNeedingFollowUp) {
        // Check if task already exists
        const existingTasks = await db.select()
          .from(tasks)
          .where(and(
            eq(tasks.userId, userId),
            eq(tasks.title, `Follow up with ${contact.name}`),
            eq(tasks.status, 'pending')
          ));

        if (existingTasks.length === 0) {
          const [newTask] = await db.insert(tasks)
            .values({
              userId,
              title: `Follow up with ${contact.name}`,
              description: `Reach out to ${contact.name} at ${contact.company || 'their company'}`,
              status: 'pending',
              priority: contact.priority || 'medium',
              taskType: 'follow_up',
              dueDate: contact.nextTouchDate
            })
            .returning();

          createdTasks.push(newTask);
        }
      }

      res.json({
        success: true,
        message: `Created ${createdTasks.length} follow-up tasks`,
        tasks: createdTasks
      });
    } catch (error) {
      console.error('Auto-create tasks error:', error);
      res.status(500).json({ error: 'Failed to create tasks' });
    }
  }

  // Generate email template using AI
  static async generateEmailTemplate(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { contactId, purpose } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const [contact] = await db.select()
        .from(crmContacts)
        .where(eq(crmContacts.id, contactId));

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      const prompt = `Generate a professional email ${purpose} for ${contact.name} at ${contact.company || 'their company'}.
      Keep it concise (max 150 words), personable, and action-oriented.
      Include: greeting, context, value proposition, clear call-to-action, and professional closing.`;

      const emailContent = await aiService.createChatCompletion([
        { role: 'user', content: prompt }
      ], { maxTokens: 300, temperature: 0.7 });

      res.json({
        success: true,
        email: {
          subject: `Re: ${purpose} - ${contact.name}`,
          body: emailContent || 'Please customize this email template.'
        }
      });
    } catch (error) {
      console.error('Generate email error:', error);
      res.status(500).json({ error: 'Failed to generate email' });
    }
  }

  // Get recommended next actions
  static async getNextBestActions(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const userType = (req.user as any)?.userType;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const actions = [];

      // Check for overdue follow-ups
      const overdueFollowUps = await db.select()
        .from(crmContacts)
        .where(and(
          eq(crmContacts.userId, userId),
          lte(crmContacts.nextTouchDate, new Date()),
          eq(crmContacts.status, 'active')
        ))
        .limit(3);

      overdueFollowUps.forEach(contact => {
        actions.push({
          type: 'follow_up',
          priority: 'high',
          title: `Follow up with ${contact.name}`,
          description: `This contact was due for follow-up on ${new Date(contact.nextTouchDate).toLocaleDateString()}`,
          contactId: contact.id,
          icon: 'phone'
        });
      });

      // Check for high-value contacts with no recent interaction
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const staleHighValueContacts = await db.select()
        .from(crmContacts)
        .where(and(
          eq(crmContacts.userId, userId),
          eq(crmContacts.priority, 'high'),
          lte(crmContacts.lastContactDate, sevenDaysAgo)
        ))
        .limit(2);

      staleHighValueContacts.forEach(contact => {
        actions.push({
          type: 'engage',
          priority: 'medium',
          title: `Re-engage with ${contact.name}`,
          description: `High-priority contact with no activity in the past week`,
          contactId: contact.id,
          icon: 'message'
        });
      });

      // Role-specific actions
      if (userType === 'recruiter') {
        // Check pipeline stages for stuck candidates
        const stuckCandidates = await db.select()
          .from(pipelineItems)
          .innerJoin(pipelineStages, eq(pipelineItems.stageId, pipelineStages.id))
          .where(and(
            eq(pipelineItems.userId, userId),
            lte(pipelineItems.enteredStageAt, sevenDaysAgo)
          ))
          .limit(2);

        stuckCandidates.forEach((item: any) => {
          actions.push({
            type: 'pipeline_action',
            priority: 'medium',
            title: `Move ${item.pipeline_items.itemTitle} forward`,
            description: `Candidate has been in ${item.pipeline_stages.stageName} for over a week`,
            pipelineItemId: item.pipeline_items.id,
            icon: 'trending'
          });
        });
      }

      res.json({
        success: true,
        actions: actions.sort((a, b) => 
          (b.priority === 'high' ? 2 : b.priority === 'medium' ? 1 : 0) -
          (a.priority === 'high' ? 2 : a.priority === 'medium' ? 1 : 0)
        )
      });
    } catch (error) {
      console.error('Get next actions error:', error);
      res.status(500).json({ error: 'Failed to fetch next actions' });
    }
  }
}
