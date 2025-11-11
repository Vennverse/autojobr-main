
import { Request, Response } from 'express';
import { eq, and, desc, gte, lte, sql, or, inArray } from 'drizzle-orm';
import { db } from './db';
import { 
  crmContacts, 
  contactInteractions, 
  pipelineStages, 
  pipelineItems,
  type InsertCrmContact,
  type InsertContactInteraction,
  type InsertPipelineStage,
  type InsertPipelineItem
} from '@shared/schema';

export class CrmService {
  // ============= CONTACT MANAGEMENT =============
  
  // Create a new contact
  static async createContact(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const contactData: InsertCrmContact = {
        userId,
        ...req.body,
        lastContactDate: new Date(),
        // Convert string dates to Date objects
        nextTouchDate: req.body.nextTouchDate ? new Date(req.body.nextTouchDate) : undefined,
      };

      const [newContact] = await db.insert(crmContacts)
        .values(contactData)
        .returning();

      res.json({ success: true, contact: newContact });
    } catch (error) {
      console.error('Create contact error:', error);
      res.status(500).json({ error: 'Failed to create contact' });
    }
  }

  // Get all contacts with filters
  static async getContacts(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { 
        contactType, 
        status = 'active',
        search,
        tags,
        needsFollowUp 
      } = req.query;

      let whereConditions = [eq(crmContacts.userId, userId)];

      if (status && status !== 'all') {
        whereConditions.push(eq(crmContacts.status, status as string));
      }

      if (contactType) {
        whereConditions.push(eq(crmContacts.contactType, contactType as string));
      }

      let query = db.select()
        .from(crmContacts)
        .where(and(...whereConditions));

      let contacts = await query.orderBy(desc(crmContacts.lastContactDate));

      // Filter by search
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        contacts = contacts.filter(c => 
          c.name.toLowerCase().includes(searchTerm) ||
          c.email?.toLowerCase().includes(searchTerm) ||
          c.company?.toLowerCase().includes(searchTerm)
        );
      }

      // Filter by tags
      if (tags) {
        const tagArray = (tags as string).split(',');
        contacts = contacts.filter(c => 
          c.tags && c.tags.some(t => tagArray.includes(t))
        );
      }

      // Filter contacts needing follow-up
      if (needsFollowUp === 'true') {
        const today = new Date();
        contacts = contacts.filter(c => 
          c.nextTouchDate && new Date(c.nextTouchDate) <= today
        );
      }

      // Get interaction count for each contact
      const contactsWithStats = await Promise.all(contacts.map(async (contact) => {
        const interactions = await db.select()
          .from(contactInteractions)
          .where(eq(contactInteractions.contactId, contact.id));

        return {
          ...contact,
          interactionCount: interactions.length,
          lastInteraction: interactions[0]?.interactionDate,
        };
      }));

      res.json({ success: true, contacts: contactsWithStats });
    } catch (error) {
      console.error('Get contacts error:', error);
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  }

  // Update contact
  static async updateContact(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { contactId } = req.params;

      const updateData: any = {
        ...req.body,
        updatedAt: new Date()
      };

      // Convert string dates to Date objects
      if (req.body.nextTouchDate) {
        updateData.nextTouchDate = new Date(req.body.nextTouchDate);
      }
      if (req.body.lastContactDate) {
        updateData.lastContactDate = new Date(req.body.lastContactDate);
      }

      const [updatedContact] = await db.update(crmContacts)
        .set(updateData)
        .where(and(
          eq(crmContacts.userId, userId),
          eq(crmContacts.id, parseInt(contactId))
        ))
        .returning();

      res.json({ success: true, contact: updatedContact });
    } catch (error) {
      console.error('Update contact error:', error);
      res.status(500).json({ error: 'Failed to update contact' });
    }
  }

  // Log interaction with contact
  static async logInteraction(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { contactId } = req.params;

      const interactionData: InsertContactInteraction = {
        contactId: parseInt(contactId),
        userId,
        ...req.body,
      };

      const [newInteraction] = await db.insert(contactInteractions)
        .values(interactionData)
        .returning();

      // Update contact's last contact date
      await db.update(crmContacts)
        .set({ 
          lastContactDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(crmContacts.id, parseInt(contactId)));

      res.json({ success: true, interaction: newInteraction });
    } catch (error) {
      console.error('Log interaction error:', error);
      res.status(500).json({ error: 'Failed to log interaction' });
    }
  }

  // Get contact interactions
  static async getContactInteractions(req: Request, res: Response) {
    try {
      const { contactId } = req.params;

      const interactions = await db.select()
        .from(contactInteractions)
        .where(eq(contactInteractions.contactId, parseInt(contactId)))
        .orderBy(desc(contactInteractions.interactionDate));

      res.json({ success: true, interactions });
    } catch (error) {
      console.error('Get interactions error:', error);
      res.status(500).json({ error: 'Failed to fetch interactions' });
    }
  }

  // ============= PIPELINE MANAGEMENT =============

  // Get or create default pipeline stages
  static async getPipelineStages(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { pipelineType = 'job_search' } = req.query;

      let stages = await db.select()
        .from(pipelineStages)
        .where(and(
          eq(pipelineStages.userId, userId),
          eq(pipelineStages.pipelineType, pipelineType as string)
        ))
        .orderBy(pipelineStages.stageOrder);

      // Create default stages if none exist
      if (stages.length === 0) {
        const defaultStages = pipelineType === 'job_search' 
          ? [
              { stageName: 'Interested', stageOrder: 1, stageColor: '#94A3B8' },
              { stageName: 'Applied', stageOrder: 2, stageColor: '#3B82F6' },
              { stageName: 'Screening', stageOrder: 3, stageColor: '#F59E0B' },
              { stageName: 'Interview', stageOrder: 4, stageColor: '#8B5CF6' },
              { stageName: 'Offer', stageOrder: 5, stageColor: '#10B981' },
              { stageName: 'Rejected', stageOrder: 6, stageColor: '#EF4444' },
            ]
          : [
              { stageName: 'Lead', stageOrder: 1, stageColor: '#94A3B8' },
              { stageName: 'Contacted', stageOrder: 2, stageColor: '#3B82F6' },
              { stageName: 'Screening', stageOrder: 3, stageColor: '#F59E0B' },
              { stageName: 'Interview', stageOrder: 4, stageColor: '#8B5CF6' },
              { stageName: 'Offer', stageOrder: 5, stageColor: '#10B981' },
              { stageName: 'Hired', stageOrder: 6, stageColor: '#059669' },
            ];

        stages = await db.insert(pipelineStages)
          .values(defaultStages.map(s => ({
            userId,
            pipelineType: pipelineType as string,
            ...s
          })))
          .returning();
      }

      res.json({ success: true, stages });
    } catch (error) {
      console.error('Get pipeline stages error:', error);
      res.status(500).json({ error: 'Failed to fetch pipeline stages' });
    }
  }

  // Get pipeline items
  static async getPipelineItems(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { stageId } = req.query;

      let query = db.select()
        .from(pipelineItems)
        .where(eq(pipelineItems.userId, userId));

      if (stageId) {
        query = query.where(and(
          eq(pipelineItems.userId, userId),
          eq(pipelineItems.stageId, parseInt(stageId as string))
        ));
      }

      const items = await query.orderBy(desc(pipelineItems.updatedAt));

      res.json({ success: true, items });
    } catch (error) {
      console.error('Get pipeline items error:', error);
      res.status(500).json({ error: 'Failed to fetch pipeline items' });
    }
  }

  // Move pipeline item to different stage
  static async movePipelineItem(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { itemId } = req.params;
      const { stageId } = req.body;

      const [updatedItem] = await db.update(pipelineItems)
        .set({ 
          stageId,
          enteredStageAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(pipelineItems.userId, userId),
          eq(pipelineItems.id, parseInt(itemId))
        ))
        .returning();

      res.json({ success: true, item: updatedItem });
    } catch (error) {
      console.error('Move pipeline item error:', error);
      res.status(500).json({ error: 'Failed to move pipeline item' });
    }
  }

  // Dashboard analytics
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;

      // Contact stats
      const allContacts = await db.select()
        .from(crmContacts)
        .where(eq(crmContacts.userId, userId));

      const today = new Date();
      const contactsNeedingFollowUp = allContacts.filter(c => 
        c.nextTouchDate && new Date(c.nextTouchDate) <= today
      );

      // Interaction stats
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const recentInteractions = await db.select()
        .from(contactInteractions)
        .where(and(
          eq(contactInteractions.userId, userId),
          gte(contactInteractions.interactionDate, last30Days)
        ));

      res.json({
        success: true,
        stats: {
          totalContacts: allContacts.length,
          activeContacts: allContacts.filter(c => c.status === 'active').length,
          contactsNeedingFollowUp: contactsNeedingFollowUp.length,
          interactionsLast30Days: recentInteractions.length,
          contactsByType: allContacts.reduce((acc, c) => {
            acc[c.contactType] = (acc[c.contactType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        }
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  }
}
