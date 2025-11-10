import { Router, Request, Response } from "express";
import { db } from "./db";
import { userIntegrations } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { isAuthenticated } from "./auth";
import { EncryptionService } from "./encryptionService";

const router = Router();

// Define which integrations link to which AutoJobr features
const INTEGRATION_FEATURES = {
  "openai": {
    name: "OpenAI",
    features: [
      { name: "Cover Letter Generator", path: "/cover-letter-generator" },
      { name: "Career AI Assistant", path: "/career-ai-assistant" },
      { name: "LinkedIn Optimizer", path: "/linkedin-optimizer" },
      { name: "Resume Optimization", path: "/resumes" }
    ],
    requiresSetup: true,
    setupFields: ["apiKey"]
  },
  "google-workspace": {
    name: "Google Workspace",
    features: [
      { name: "Calendar Integration", path: "/recruiter/interview-assignments" },
      { name: "Email Service", path: "/chat" },
      { name: "Document Storage", path: "/resumes" }
    ],
    requiresSetup: true,
    setupFields: ["accessToken", "refreshToken"]
  },
  "linkedin": {
    name: "LinkedIn",
    features: [
      { name: "LinkedIn Profile Optimizer", path: "/linkedin-optimizer" },
      { name: "Job Posting", path: "/recruiter/post-job" },
      { name: "Profile Import", path: "/profile" }
    ],
    requiresSetup: true,
    setupFields: ["accessToken"]
  },
  "slack": {
    name: "Slack",
    features: [
      { name: "Application Notifications", path: "/applications" },
      { name: "Interview Reminders", path: "/recruiter/interview-assignments" },
      { name: "Team Chat", path: "/chat" }
    ],
    requiresSetup: true,
    setupFields: ["webhookUrl"]
  },
  "zapier": {
    name: "Zapier",
    features: [
      { name: "Workflow Automation", path: "/dashboard" },
      { name: "Custom Triggers", path: "/applications" }
    ],
    requiresSetup: true,
    setupFields: ["apiKey"]
  },
  "notion": {
    name: "Notion",
    features: [
      { name: "Application Tracking", path: "/applications" },
      { name: "Note Taking", path: "/jobs" },
      { name: "CRM Integration", path: "/enhanced-crm" }
    ],
    requiresSetup: true,
    setupFields: ["accessToken"]
  },
  "airtable": {
    name: "Airtable",
    features: [
      { name: "Recruiter Analytics", path: "/advanced-analytics-dashboard" },
      { name: "Data Export", path: "/recruiter/applicants" },
      { name: "Custom Views", path: "/recruiter/pipeline" }
    ],
    requiresSetup: true,
    setupFields: ["apiKey", "baseId"]
  },
  "calendly": {
    name: "Calendly",
    features: [
      { name: "Interview Scheduling", path: "/recruiter/interview-assignments" },
      { name: "Candidate Booking", path: "/applications" }
    ],
    requiresSetup: true,
    setupFields: ["apiKey"]
  },
  "sendgrid": {
    name: "SendGrid",
    features: [
      { name: "Email Campaigns", path: "/chat" },
      { name: "Application Updates", path: "/applications" },
      { name: "Recruiter Outreach", path: "/recruiter/applicants" }
    ],
    requiresSetup: true,
    setupFields: ["apiKey"]
  },
  "zoom": {
    name: "Zoom",
    features: [
      { name: "Virtual Interviews", path: "/virtual-interview-start" },
      { name: "Video Meetings", path: "/video-practice" },
      { name: "Interview Recording", path: "/recruiter/interview-assignments" }
    ],
    requiresSetup: true,
    setupFields: ["apiKey", "apiSecret"]
  },
  "paypal": {
    name: "PayPal",
    features: [],
    requiresSetup: false,
    setupFields: []
  },
  "stripe": {
    name: "Stripe",
    features: [],
    requiresSetup: false,
    setupFields: []
  }
};

// Get all integrations for current user
router.get("/user-integrations", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const integrations = await db
      .select()
      .from(userIntegrations)
      .where(eq(userIntegrations.userId, userId));
    
    // Map integrations with their feature links and redact sensitive fields
    const integrationsWithFeatures = integrations.map(integration => ({
      id: integration.id,
      userId: integration.userId,
      integrationId: integration.integrationId,
      isEnabled: integration.isEnabled,
      config: integration.config,
      lastSyncedAt: integration.lastSyncedAt,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
      features: INTEGRATION_FEATURES[integration.integrationId]?.features || [],
      setupRequired: INTEGRATION_FEATURES[integration.integrationId]?.requiresSetup || false,
      // Redact sensitive fields - only show if configured
      hasApiKey: !!integration.apiKey,
      hasApiSecret: !!integration.apiSecret,
      hasAccessToken: !!integration.accessToken,
      hasRefreshToken: !!integration.refreshToken
    }));
    
    res.json(integrationsWithFeatures);
  } catch (error) {
    console.error("Error fetching user integrations:", error);
    res.status(500).json({ message: "Failed to fetch integrations" });
  }
});

// Get integration feature mapping
router.get("/integration-features/:integrationId", (req: Request, res: Response) => {
  const { integrationId } = req.params;
  const integration = INTEGRATION_FEATURES[integrationId];
  
  if (!integration) {
    return res.status(404).json({ message: "Integration not found" });
  }
  
  res.json(integration);
});

// Enable/configure an integration
router.post("/user-integrations", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { integrationId, config: clientConfig } = req.body;
    
    if (!integrationId) {
      return res.status(400).json({ message: "Integration ID is required" });
    }

    // Get integration setup requirements
    const integrationSetup = INTEGRATION_FEATURES[integrationId];
    if (!integrationSetup) {
      return res.status(404).json({ message: "Integration not found" });
    }

    // Validate required setup fields
    if (integrationSetup.requiresSetup && integrationSetup.setupFields.length > 0) {
      const missingFields = integrationSetup.setupFields.filter(
        field => !clientConfig || !clientConfig[field]
      );
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }
    }

    // Encrypt sensitive fields
    const encryptedConfig: any = { ...clientConfig };
    const sensitiveFields = ['apiKey', 'apiSecret', 'accessToken', 'refreshToken', 'webhookUrl'];
    
    for (const field of sensitiveFields) {
      if (encryptedConfig[field]) {
        encryptedConfig[field] = EncryptionService.encrypt(encryptedConfig[field]);
      }
    }
    
    // Check if integration already exists
    const existing = await db
      .select()
      .from(userIntegrations)
      .where(and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.integrationId, integrationId)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing integration
      await db
        .update(userIntegrations)
        .set({
          config: encryptedConfig,
          isEnabled: true,
          updatedAt: new Date()
        })
        .where(eq(userIntegrations.id, existing[0].id));
      
      return res.json({ 
        message: "Integration updated successfully",
        integrationId,
        isEnabled: true
      });
    }
    
    // Create new integration
    const [newIntegration] = await db
      .insert(userIntegrations)
      .values({
        userId,
        integrationId,
        config: encryptedConfig,
        isEnabled: true
      })
      .returning();
    
    res.json({ 
      message: "Integration enabled successfully",
      integrationId: newIntegration.integrationId,
      isEnabled: newIntegration.isEnabled
    });
  } catch (error) {
    console.error("Error enabling integration:", error);
    res.status(500).json({ message: "Failed to enable integration" });
  }
});

// Toggle integration on/off
router.patch("/user-integrations/:integrationId/toggle", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { integrationId } = req.params;
    const { isEnabled } = req.body;
    
    const integration = await db
      .select()
      .from(userIntegrations)
      .where(and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.integrationId, integrationId)
      ))
      .limit(1);
    
    if (integration.length === 0) {
      return res.status(404).json({ message: "Integration not found" });
    }
    
    await db
      .update(userIntegrations)
      .set({ isEnabled, updatedAt: new Date() })
      .where(eq(userIntegrations.id, integration[0].id));
    
    res.json({ message: "Integration status updated" });
  } catch (error) {
    console.error("Error toggling integration:", error);
    res.status(500).json({ message: "Failed to update integration" });
  }
});

// Delete an integration
router.delete("/user-integrations/:integrationId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { integrationId } = req.params;
    
    await db
      .delete(userIntegrations)
      .where(and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.integrationId, integrationId)
      ));
    
    res.json({ message: "Integration removed successfully" });
  } catch (error) {
    console.error("Error deleting integration:", error);
    res.status(500).json({ message: "Failed to remove integration" });
  }
});

export default router;
