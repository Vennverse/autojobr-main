import { Request, Response } from 'express';
import { eq, and, desc, gte, lte, sql, or, count, like } from 'drizzle-orm';
import { db } from './db';
import { 
  crmContacts, 
  contactInteractions, 
  pipelineStages, 
  pipelineItems,
  tasks,
  taskReminders,
  users,
  crmCompanies,
  crmDeals,
  crmEmailTemplates,
  crmEmailCampaigns,
  crmEmailSequences,
  crmSequenceSteps,
  crmSequenceEnrollments,
  crmWorkflows,
  crmMeetings,
  crmDocuments,
  crmActivities,
  crmLeadScores
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

  // Generate LinkedIn follow-up message
  static async generateLinkedInFollowUp(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { contactId, purpose, context } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const [contact] = await db.select()
        .from(crmContacts)
        .where(eq(crmContacts.id, contactId));

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      // LinkedIn messages are limited to 300 characters for connection requests
      const charLimit = purpose === 'connection' ? 300 : 300; // Keep follow-ups short

      const prompt = `Write a LinkedIn ${purpose} message to ${contact.name}${contact.jobTitle ? `, ${contact.jobTitle}` : ''} at ${contact.company || 'their company'}.
${context ? `Context: ${context}` : ''}

Requirements:
- STRICT maximum ${charLimit} characters
- Professional and personable tone
- Clear value proposition
- Natural conversational style
- Specific to this person (avoid generic phrases)
- No emojis or special formatting

Return ONLY the message text, no quotes, no extra formatting.`;

      const completion = await aiService.createChatCompletion([
        { role: 'system', content: 'You are a LinkedIn networking expert. Generate ultra-concise, personalized messages that respect character limits and get responses.' },
        { role: 'user', content: prompt }
      ], { maxTokens: 150, temperature: 0.7, user: req.user });

      const messageContent = completion.choices[0]?.message?.content || '';
      const trimmedMessage = messageContent.trim().substring(0, charLimit);

      res.json({
        success: true,
        message: trimmedMessage,
        characterCount: trimmedMessage.length,
        characterLimit: charLimit
      });
    } catch (error) {
      console.error('Generate LinkedIn message error:', error);
      res.status(500).json({ error: 'Failed to generate LinkedIn message' });
    }
  }

  // Generate automated follow-up with channel selection
  static async generateAutomatedFollowUp(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { contactId, channel, purpose, personalNote } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const [contact] = await db.select()
        .from(crmContacts)
        .where(eq(crmContacts.id, contactId));

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      if (channel === 'email') {
        // Generate email follow-up
        const emailPrompt = `Write a professional follow-up email to ${contact.name}${contact.jobTitle ? `, ${contact.jobTitle}` : ''} at ${contact.company || 'their company'}.
Purpose: ${purpose}
${personalNote ? `Personal context: ${personalNote}` : ''}

Requirements:
- Maximum 150 words
- Professional yet friendly tone
- Include clear call-to-action
- Personalized and specific
- Avoid generic templates

Return only the email body text, no subject line.`;

        const emailContent = await aiService.createChatCompletion([
          { role: 'system', content: 'You are an expert at writing professional business emails. Generate concise, personalized emails that get responses.' },
          { role: 'user', content: emailPrompt }
        ], { maxTokens: 300, temperature: 0.7, user: req.user });

        const emailBody = emailContent.choices[0]?.message?.content || 'Thank you for your time. I look forward to connecting with you soon.';

        res.json({
          success: true,
          channel: 'email',
          content: {
            subject: `Following up - ${contact.name}`,
            body: emailBody.trim()
          }
        });
      } else if (channel === 'linkedin') {
        // Generate LinkedIn message with strict character limit
        const linkedinPrompt = `Write a brief LinkedIn message to ${contact.name}${contact.jobTitle ? `, ${contact.jobTitle}` : ''} at ${contact.company || 'their company'}.
Purpose: ${purpose}
${personalNote ? `Personal context: ${personalNote}` : ''}

Requirements:
- STRICT maximum 250 characters (LinkedIn limit)
- Professional and personable
- Clear value proposition
- Natural conversational tone
- Avoid generic templates

Return ONLY the message text, no formatting or quotes.`;

        const linkedinContent = await aiService.createChatCompletion([
          { role: 'system', content: 'You are an expert at LinkedIn networking. Generate ultra-concise, personalized messages under 250 characters that get responses.' },
          { role: 'user', content: linkedinPrompt }
        ], { maxTokens: 120, temperature: 0.7, user: req.user });

        const rawMessage = linkedinContent.choices[0]?.message?.content || '';
        const message = rawMessage.trim().substring(0, 300);

        res.json({
          success: true,
          channel: 'linkedin',
          content: {
            message: message,
            characterCount: message.length,
            characterLimit: 300
          }
        });
      } else {
        res.status(400).json({ error: 'Invalid channel. Use "email" or "linkedin"' });
      }
    } catch (error) {
      console.error('Generate automated follow-up error:', error);
      res.status(500).json({ error: 'Failed to generate follow-up' });
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

  // ============= COMPANIES MANAGEMENT =============

  static async createCompany(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const [company] = await db.insert(crmCompanies).values({ ...req.body, userId }).returning();
      res.json({ success: true, company });
    } catch (error) {
      console.error('Create company error:', error);
      res.status(500).json({ error: 'Failed to create company' });
    }
  }

  static async getCompanies(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const companies = await db.select().from(crmCompanies).where(eq(crmCompanies.userId, userId));
      res.json({ success: true, companies });
    } catch (error) {
      console.error('Get companies error:', error);
      res.status(500).json({ error: 'Failed to fetch companies' });
    }
  }

  static async getCompanyById(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { companyId } = req.params;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const [company] = await db.select().from(crmCompanies).where(and(
        eq(crmCompanies.id, parseInt(companyId)),
        eq(crmCompanies.userId, userId)
      ));
      res.json({ success: true, company });
    } catch (error) {
      console.error('Get company error:', error);
      res.status(500).json({ error: 'Failed to fetch company' });
    }
  }

  static async updateCompany(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { companyId } = req.params;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      await db.update(crmCompanies).set(req.body).where(and(
        eq(crmCompanies.id, parseInt(companyId)),
        eq(crmCompanies.userId, userId)
      ));
      res.json({ success: true });
    } catch (error) {
      console.error('Update company error:', error);
      res.status(500).json({ error: 'Failed to update company' });
    }
  }

  static async deleteCompany(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { companyId } = req.params;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      await db.delete(crmCompanies).where(and(
        eq(crmCompanies.id, parseInt(companyId)),
        eq(crmCompanies.userId, userId)
      ));
      res.json({ success: true });
    } catch (error) {
      console.error('Delete company error:', error);
      res.status(500).json({ error: 'Failed to delete company' });
    }
  }

  // ============= DEALS MANAGEMENT =============

  static async createDeal(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const [deal] = await db.insert(crmDeals).values({ ...req.body, userId }).returning();

      await db.insert(crmActivities).values({
        userId,
        activityType: 'deal_created',
        title: `Deal created: ${deal.dealName}`,
        description: `New deal "${deal.dealName}" added to pipeline`,
        dealId: deal.id
      });

      res.json({ success: true, deal });
    } catch (error) {
      console.error('Create deal error:', error);
      res.status(500).json({ error: 'Failed to create deal' });
    }
  }

  static async getDeals(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const deals = await db.select().from(crmDeals).where(eq(crmDeals.userId, userId));
      res.json({ success: true, deals });
    } catch (error) {
      console.error('Get deals error:', error);
      res.status(500).json({ error: 'Failed to fetch deals' });
    }
  }

  static async getDealById(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { dealId } = req.params;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const [deal] = await db.select().from(crmDeals).where(and(
        eq(crmDeals.id, parseInt(dealId)),
        eq(crmDeals.userId, userId)
      ));
      res.json({ success: true, deal });
    } catch (error) {
      console.error('Get deal error:', error);
      res.status(500).json({ error: 'Failed to fetch deal' });
    }
  }

  static async updateDeal(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { dealId } = req.params;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      await db.update(crmDeals).set(req.body).where(and(
        eq(crmDeals.id, parseInt(dealId)),
        eq(crmDeals.userId, userId)
      ));
      res.json({ success: true });
    } catch (error) {
      console.error('Update deal error:', error);
      res.status(500).json({ error: 'Failed to update deal' });
    }
  }

  static async deleteDeal(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { dealId } = req.params;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      await db.delete(crmDeals).where(and(
        eq(crmDeals.id, parseInt(dealId)),
        eq(crmDeals.userId, userId)
      ));
      res.json({ success: true });
    } catch (error) {
      console.error('Delete deal error:', error);
      res.status(500).json({ error: 'Failed to delete deal' });
    }
  }

  static async moveDealStage(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { dealId } = req.params;
      const { newStage } = req.body;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      await db.update(crmDeals).set({ stage: newStage }).where(and(
        eq(crmDeals.id, parseInt(dealId)),
        eq(crmDeals.userId, userId)
      ));

      await db.insert(crmActivities).values({
        userId,
        activityType: 'deal_stage_changed',
        title: `Deal stage changed to ${newStage}`,
        description: `Deal moved to ${newStage} stage`,
        dealId: parseInt(dealId)
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Move deal error:', error);
      res.status(500).json({ error: 'Failed to move deal' });
    }
  }

  // ============= EMAIL TEMPLATES MANAGEMENT =============

  static async createEmailTemplate(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const [template] = await db.insert(crmEmailTemplates).values({ ...req.body, userId }).returning();
      res.json({ success: true, template });
    } catch (error) {
      console.error('Create email template error:', error);
      res.status(500).json({ error: 'Failed to create email template' });
    }
  }

  static async getEmailTemplates(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const templates = await db.select().from(crmEmailTemplates).where(eq(crmEmailTemplates.userId, userId));
      res.json({ success: true, templates });
    } catch (error) {
      console.error('Get email templates error:', error);
      res.status(500).json({ error: 'Failed to fetch email templates' });
    }
  }

  static async getEmailTemplateById(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { templateId } = req.params;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const [template] = await db.select().from(crmEmailTemplates).where(and(
        eq(crmEmailTemplates.id, parseInt(templateId)),
        eq(crmEmailTemplates.userId, userId)
      ));
      res.json({ success: true, template });
    } catch (error) {
      console.error('Get email template error:', error);
      res.status(500).json({ error: 'Failed to fetch email template' });
    }
  }

  static async updateEmailTemplate(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { templateId } = req.params;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      await db.update(crmEmailTemplates).set(req.body).where(and(
        eq(crmEmailTemplates.id, parseInt(templateId)),
        eq(crmEmailTemplates.userId, userId)
      ));
      res.json({ success: true });
    } catch (error) {
      console.error('Update email template error:', error);
      res.status(500).json({ error: 'Failed to update email template' });
    }
  }

  static async deleteEmailTemplate(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { templateId } = req.params;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      await db.delete(crmEmailTemplates).where(and(
        eq(crmEmailTemplates.id, parseInt(templateId)),
        eq(crmEmailTemplates.userId, userId)
      ));
      res.json({ success: true });
    } catch (error) {
      console.error('Delete email template error:', error);
      res.status(500).json({ error: 'Failed to delete email template' });
    }
  }

  // ============= AI EMAIL GENERATION & SENDING =============

  static async generateEmailWithAI(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { prompt, context } = req.body;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const emailPrompt = `Generate a professional ${context?.category || 'business'} email.
      Subject: ${context?.subject || 'Professional outreach'}
      Context: ${prompt}

      Requirements:
      - Professional and concise
      - Clear purpose and call-to-action
      - Personalized tone
      - 150-200 words

      Generate only the email body, no subject line.`;

      const emailBody = await aiService.createChatCompletion([
        { role: 'user', content: emailPrompt }
      ], { maxTokens: 400, temperature: 0.7 });

      res.json({ success: true, emailBody });
    } catch (error) {
      console.error('Generate AI email error:', error);
      res.status(500).json({ error: 'Failed to generate email' });
    }
  }

  // Prepare email for client (returns mailto or web client URL)
  static async sendEmail(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { to, subject, body, contactId, emailClient = 'default' } = req.body;

      if (!to || !subject || !body) {
        return res.status(400).json({ error: 'Missing required email fields' });
      }

      // Log activity in CRM
      await db.insert(crmActivities).values({
        userId,
        activityType: 'email',
        title: `Email prepared for ${to}`,
        description: `Subject: ${subject}`,
        contactId: contactId ? parseInt(contactId) : null,
      });

      // Return appropriate URL based on email client
      const encodedTo = encodeURIComponent(to);
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);

      let emailUrl = '';
      if (emailClient === 'gmail') {
        emailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`;
      } else if (emailClient === 'outlook') {
        emailUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`;
      } else {
        emailUrl = `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
      }

      res.json({ 
        success: true, 
        emailUrl,
        mailtoUrl: `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`,
        message: 'Email prepared successfully' 
      });
    } catch (error) {
      console.error('[CRM Email] Prepare email error:', error);
      res.status(500).json({ error: 'Failed to prepare email' });
    }
  }

  // ============= EMAIL CAMPAIGNS =============

  static async createEmailCampaign(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const [campaign] = await db.insert(crmEmailCampaigns).values({ ...req.body, userId }).returning();
      res.json({ success: true, campaign });
    } catch (error) {
      console.error('Create email campaign error:', error);
      res.status(500).json({ error: 'Failed to create email campaign' });
    }
  }

  static async getEmailCampaigns(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const campaigns = await db.select().from(crmEmailCampaigns).where(eq(crmEmailCampaigns.userId, userId));
      res.json({ success: true, campaigns });
    } catch (error) {
      console.error('Get email campaigns error:', error);
      res.status(500).json({ error: 'Failed to fetch email campaigns' });
    }
  }

  static async getEmailCampaignById(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { campaignId } = req.params;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const [campaign] = await db.select().from(crmEmailCampaigns).where(and(
        eq(crmEmailCampaigns.id, parseInt(campaignId)),
        eq(crmEmailCampaigns.userId, userId)
      ));
      res.json({ success: true, campaign });
    } catch (error) {
      console.error('Get email campaign error:', error);
      res.status(500).json({ error: 'Failed to fetch email campaign' });
    }
  }

  static async sendEmailCampaign(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { campaignId } = req.params;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      res.json({ success: true, message: 'Campaign sending initiated' });
    } catch (error) {
      console.error('Send email campaign error:', error);
      res.status(500).json({ error: 'Failed to send email campaign' });
    }
  }

  // ============= EMAIL SEQUENCES =============

  static async createEmailSequence(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const [sequence] = await db.insert(crmEmailSequences).values({ ...req.body, userId }).returning();
      res.json({ success: true, sequence });
    } catch (error) {
      console.error('Create email sequence error:', error);
      res.status(500).json({ error: 'Failed to create email sequence' });
    }
  }

  static async getEmailSequences(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const sequences = await db.select().from(crmEmailSequences).where(eq(crmEmailSequences.userId, userId));
      res.json({ success: true, sequences });
    } catch (error) {
      console.error('Get email sequences error:', error);
      res.status(500).json({ error: 'Failed to fetch email sequences' });
    }
  }

  static async enrollInSequence(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { sequenceId } = req.params;
      const { contactId } = req.body;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const [enrollment] = await db.insert(crmSequenceEnrollments).values({
        sequenceId: parseInt(sequenceId),
        contactId: parseInt(contactId),
        userId
      }).returning();

      res.json({ success: true, enrollment });
    } catch (error) {
      console.error('Enroll in sequence error:', error);
      res.status(500).json({ error: 'Failed to enroll in sequence' });
    }
  }

  // ============= WORKFLOWS =============

  static async createWorkflow(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const [workflow] = await db.insert(crmWorkflows).values({ ...req.body, userId }).returning();
      res.json({ success: true, workflow });
    } catch (error) {
      console.error('Create workflow error:', error);
      res.status(500).json({ error: 'Failed to create workflow' });
    }
  }

  static async getWorkflows(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const workflows = await db.select().from(crmWorkflows).where(eq(crmWorkflows.userId, userId));
      res.json({ success: true, workflows });
    } catch (error) {
      console.error('Get workflows error:', error);
      res.status(500).json({ error: 'Failed to fetch workflows' });
    }
  }

  static async toggleWorkflow(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { workflowId } = req.params;
      const { isActive } = req.body;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      await db.update(crmWorkflows).set({ isActive }).where(and(
        eq(crmWorkflows.id, parseInt(workflowId)),
        eq(crmWorkflows.userId, userId)
      ));

      res.json({ success: true });
    } catch (error) {
      console.error('Toggle workflow error:', error);
      res.status(500).json({ error: 'Failed to toggle workflow' });
    }
  }

  // ============= MEETINGS MANAGEMENT =============

  static async createMeeting(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const [meeting] = await db.insert(crmMeetings).values({ ...req.body, userId }).returning();

      await db.insert(crmActivities).values({
        userId,
        activityType: 'meeting',
        title: `Meeting scheduled: ${meeting.title}`,
        description: `New meeting "${meeting.title}" scheduled`,
        metadata: { meetingId: meeting.id }
      });

      res.json({ success: true, meeting });
    } catch (error) {
      console.error('Create meeting error:', error);
      res.status(500).json({ error: 'Failed to create meeting' });
    }
  }

  static async getMeetings(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const meetings = await db.select().from(crmMeetings).where(eq(crmMeetings.userId, userId)).orderBy(desc(crmMeetings.startTime));
      res.json({ success: true, meetings });
    } catch (error) {
      console.error('Get meetings error:', error);
      res.status(500).json({ error: 'Failed to fetch meetings' });
    }
  }

  static async getMeetingById(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { meetingId } = req.params;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const [meeting] = await db.select().from(crmMeetings).where(and(
        eq(crmMeetings.id, parseInt(meetingId)),
        eq(crmMeetings.userId, userId)
      ));
      res.json({ success: true, meeting });
    } catch (error) {
      console.error('Get meeting error:', error);
      res.status(500).json({ error: 'Failed to fetch meeting' });
    }
  }

  static async updateMeeting(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { meetingId } = req.params;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      await db.update(crmMeetings).set(req.body).where(and(
        eq(crmMeetings.id, parseInt(meetingId)),
        eq(crmMeetings.userId, userId)
      ));
      res.json({ success: true });
    } catch (error) {
      console.error('Update meeting error:', error);
      res.status(500).json({ error: 'Failed to update meeting' });
    }
  }

  static async deleteMeeting(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { meetingId } = req.params;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      await db.delete(crmMeetings).where(and(
        eq(crmMeetings.id, parseInt(meetingId)),
        eq(crmMeetings.userId, userId)
      ));
      res.json({ success: true });
    } catch (error) {
      console.error('Delete meeting error:', error);
      res.status(500).json({ error: 'Failed to delete meeting' });
    }
  }

  // ============= DOCUMENTS MANAGEMENT =============

  static async uploadDocument(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const [document] = await db.insert(crmDocuments).values({ ...req.body, userId }).returning();
      res.json({ success: true, document });
    } catch (error) {
      console.error('Upload document error:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }

  static async getDocuments(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const documents = await db.select().from(crmDocuments).where(eq(crmDocuments.userId, userId));
      res.json({ success: true, documents });
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }

  static async deleteDocument(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { documentId } = req.params;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      await db.delete(crmDocuments).where(and(
        eq(crmDocuments.id, parseInt(documentId)),
        eq(crmDocuments.userId, userId)
      ));
      res.json({ success: true });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }

  // ============= ACTIVITIES TIMELINE =============

  static async getActivities(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const activities = await db.select().from(crmActivities).where(eq(crmActivities.userId, userId)).orderBy(desc(crmActivities.createdAt)).limit(50);
      res.json({ success: true, activities });
    } catch (error) {
      console.error('Get activities error:', error);
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  }

  static async logActivity(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const [activity] = await db.insert(crmActivities).values({ ...req.body, userId }).returning();
      res.json({ success: true, activity });
    } catch (error) {
      console.error('Log activity error:', error);
      res.status(500).json({ error: 'Failed to log activity' });
    }
  }

  // ============= LEAD SCORING =============

  static async getLeadScores(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const scores = await db.select().from(crmLeadScores).where(eq(crmLeadScores.userId, userId)).orderBy(desc(crmLeadScores.totalScore));
      res.json({ success: true, scores });
    } catch (error) {
      console.error('Get lead scores error:', error);
      res.status(500).json({ error: 'Failed to fetch lead scores' });
    }
  }

  static async calculateLeadScores(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const contacts = await db.select().from(crmContacts).where(eq(crmContacts.userId, userId));
      const calculated = [];

      for (const contact of contacts) {
        const interactions = await db.select().from(contactInteractions).where(eq(contactInteractions.contactId, contact.id));
        const engagementScore = this.calculateEngagementScore(contact, interactions);

        const grade = engagementScore >= 80 ? 'A' : engagementScore >= 60 ? 'B' : engagementScore >= 40 ? 'C' : engagementScore >= 20 ? 'D' : 'F';

        await db.insert(crmLeadScores).values({
          contactId: contact.id,
          userId,
          totalScore: engagementScore,
          engagementScore,
          demographicScore: 50,
          behaviorScore: 50,
          grade
        }).onConflictDoUpdate({
          target: crmLeadScores.contactId,
          set: { totalScore: engagementScore, engagementScore, grade }
        });

        calculated.push({ contactId: contact.id, score: engagementScore, grade });
      }

      res.json({ success: true, calculated });
    } catch (error) {
      console.error('Calculate lead scores error:', error);
      res.status(500).json({ error: 'Failed to calculate lead scores' });
    }
  }

  // ============= DASHBOARD STATS =============

  static async getDashboardStats(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const [totalContacts] = await db.select({ count: count() }).from(crmContacts).where(eq(crmContacts.userId, userId));
      const [totalCompanies] = await db.select({ count: count() }).from(crmCompanies).where(eq(crmCompanies.userId, userId));
      const [activeDeals] = await db.select({ count: count() }).from(crmDeals).where(and(eq(crmDeals.userId, userId), or(
        eq(crmDeals.stage, 'prospecting'),
        eq(crmDeals.stage, 'qualification'),
        eq(crmDeals.stage, 'proposal'),
        eq(crmDeals.stage, 'negotiation')
      )));

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const [upcomingMeetings] = await db.select({ count: count() }).from(crmMeetings).where(and(
        eq(crmMeetings.userId, userId),
        gte(crmMeetings.startTime, new Date()),
        lte(crmMeetings.startTime, tomorrow)
      ));

      res.json({
        success: true,
        stats: {
          totalContacts: totalContacts.count || 0,
          totalCompanies: totalCompanies.count || 0,
          activeDeals: activeDeals.count || 0,
          upcomingMeetings: upcomingMeetings.count || 0
        }
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  }
}