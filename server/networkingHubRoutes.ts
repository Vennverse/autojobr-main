


import express from 'express';
import { db } from './db';
import { networkingContacts, networkingEvents, networkingEventAttendees } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = express.Router();

// Middleware to check authentication
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Contact Management Routes
router.get('/contacts', isAuthenticated, async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userContacts = await db
      .select()
      .from(networkingContacts)
      .where(eq(networkingContacts.userId, req.user.id))
      .orderBy(desc(networkingContacts.createdAt));

    res.json(userContacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

router.post('/contacts', isAuthenticated, async (req: any, res) => {
  try {
    const { fullName, company, jobTitle, email, phone, linkedinUrl, notes } = req.body;

    if (!fullName) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const newContact = await db.insert(networkingContacts).values({
      userId: req.user.id,
      fullName,
      company,
      jobTitle,
      email,
      phone,
      linkedinUrl,
      notes,
    }).returning();

    res.json(newContact[0]);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

router.patch('/contacts/:id', isAuthenticated, async (req: any, res) => {
  try {
    const contactId = parseInt(req.params.id);
    const updates = req.body;

    const updatedContact = await db
      .update(networkingContacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(networkingContacts.id, contactId),
        eq(networkingContacts.userId, req.user.id)
      ))
      .returning();

    if (!updatedContact.length) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(updatedContact[0]);
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

router.delete('/contacts/:id', isAuthenticated, async (req: any, res) => {
  try {
    const contactId = parseInt(req.params.id);

    await db
      .delete(networkingContacts)
      .where(and(
        eq(networkingContacts.id, contactId),
        eq(networkingContacts.userId, req.user.id)
      ));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router;
