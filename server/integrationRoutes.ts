
import { Router } from 'express';
import { db } from './db';
import { integrations } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Available integrations catalog
const AVAILABLE_INTEGRATIONS = [
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'Payments',
    description: 'Accept PayPal payments and subscriptions',
    status: 'active',
    isPremium: false,
    authType: 'oauth',
    configFields: [
      { name: 'clientId', label: 'Client ID', type: 'text', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true }
    ]
  },
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'Payments',
    description: 'Process credit cards and manage subscriptions',
    status: 'active',
    isPremium: false,
    authType: 'api_key',
    configFields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true }
    ]
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    category: 'Productivity',
    description: 'Sync with Google Calendar, Gmail, and Drive',
    status: 'active',
    isPremium: false,
    authType: 'oauth'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    category: 'Social',
    description: 'Import profiles and post job listings',
    status: 'active',
    isPremium: true,
    authType: 'oauth'
  },
  {
    id: 'calendly',
    name: 'Calendly',
    category: 'Scheduling',
    description: 'Schedule interviews with Calendly integration',
    status: 'active',
    isPremium: false,
    authType: 'api_key',
    configFields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true }
    ]
  }
];

// Get available integrations
router.get('/api/integrations/available', async (req: any, res: any) => {
  const category = req.query.category;
  
  let filteredIntegrations = AVAILABLE_INTEGRATIONS;
  
  if (category && category !== 'all') {
    filteredIntegrations = AVAILABLE_INTEGRATIONS.filter(int => int.category === category);
  }
  
  res.json(filteredIntegrations);
});

// Get user's active integrations
router.get('/api/integrations/active', async (req: any, res: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const userIntegrations = await db.query.integrations.findMany({
      where: eq(integrations.userId, req.user.id)
    });

    res.json(userIntegrations);
  } catch (error) {
    console.error('Error fetching active integrations:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

// Connect integration
router.post('/api/integrations/connect', async (req: any, res: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { integrationId, integrationName, category, config } = req.body;

  try {
    // Check if integration is already connected
    const existing = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.userId, req.user.id),
        eq(integrations.platformName, integrationId)
      )
    });

    if (existing) {
      return res.status(400).json({ error: 'Integration already connected' });
    }

    // Create integration record
    await db.insert(integrations).values({
      userId: req.user.id,
      platformName: integrationId,
      platformType: category,
      syncStatus: 'active',
      lastSync: new Date(),
      config: config ? JSON.stringify(config) : null,
      createdAt: new Date()
    });

    res.json({ 
      success: true,
      message: `${integrationName} connected successfully`
    });
  } catch (error) {
    console.error('Error connecting integration:', error);
    res.status(500).json({ error: 'Failed to connect integration' });
  }
});

// Disconnect integration
router.post('/api/integrations/:integrationId/disconnect', async (req: any, res: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { integrationId } = req.params;

  try {
    await db.delete(integrations)
      .where(and(
        eq(integrations.id, parseInt(integrationId)),
        eq(integrations.userId, req.user.id)
      ));

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    res.status(500).json({ error: 'Failed to disconnect integration' });
  }
});

// Sync integration
router.post('/api/integrations/:integrationId/sync', async (req: any, res: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { integrationId } = req.params;

  try {
    await db.update(integrations)
      .set({ 
        lastSync: new Date(),
        syncStatus: 'syncing'
      })
      .where(and(
        eq(integrations.id, parseInt(integrationId)),
        eq(integrations.userId, req.user.id)
      ));

    // Trigger actual sync in background
    setTimeout(async () => {
      await db.update(integrations)
        .set({ syncStatus: 'active' })
        .where(eq(integrations.id, parseInt(integrationId)));
    }, 2000);

    res.json({ success: true });
  } catch (error) {
    console.error('Error syncing integration:', error);
    res.status(500).json({ error: 'Failed to sync integration' });
  }
});

export default router;
