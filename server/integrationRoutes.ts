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

// Export CRM contacts to Airtable (EXAMPLE OF ACTUAL INTEGRATION)
router.post("/export/airtable/crm-contacts", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { contacts } = req.body;

    if (!contacts || contacts.length === 0) {
      return res.status(400).json({ message: "No contacts to export" });
    }

    // Import IntegrationService
    const { IntegrationService } = await import("./integrationService.js");
    
    // Export to Airtable
    const success = await IntegrationService.exportToAirtable(
      userId,
      "CRM Contacts",
      contacts
    );

    if (!success) {
      return res.status(400).json({ 
        message: "Airtable not configured or export failed. Please configure Airtable in Integration Marketplace."
      });
    }

    res.json({ 
      message: "Successfully exported to Airtable",
      count: contacts.length
    });
  } catch (error) {
    console.error("Error exporting to Airtable:", error);
    res.status(500).json({ message: "Failed to export to Airtable" });
  }
});

// Send Slack notification (EXAMPLE OF ACTUAL INTEGRATION)
router.post("/notify/slack", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { message, title, color, fields } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Import IntegrationService
    const { IntegrationService } = await import("./integrationService.js");
    
    // Send Slack notification
    const success = await IntegrationService.sendSlackNotification(
      userId,
      message,
      { title, color, fields }
    );

    if (!success) {
      return res.status(400).json({ 
        message: "Slack not configured or notification failed. Please configure Slack in Integration Marketplace."
      });
    }

    res.json({ message: "Notification sent to Slack" });
  } catch (error) {
    console.error("Error sending Slack notification:", error);
    res.status(500).json({ message: "Failed to send Slack notification" });
  }
});

// Post job to LinkedIn
router.post("/post/linkedin", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, description, location, company } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    const { IntegrationService } = await import("./integrationService.js");
    
    const success = await IntegrationService.postToLinkedIn(userId, {
      title,
      description,
      location,
      company
    });

    if (!success) {
      return res.status(400).json({ 
        message: "LinkedIn not configured or posting failed. Please configure LinkedIn in Integration Marketplace."
      });
    }

    res.json({ message: "Job posted to LinkedIn successfully" });
  } catch (error) {
    console.error("Error posting to LinkedIn:", error);
    res.status(500).json({ message: "Failed to post to LinkedIn" });
  }
});

// Create Calendly meeting
router.post("/schedule/calendly", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, email, startTime, endTime } = req.body;

    if (!name || !email || !startTime || !endTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const { IntegrationService } = await import("./integrationService.js");
    
    const result = await IntegrationService.createCalendlyMeeting(userId, {
      name,
      email,
      startTime,
      endTime
    });

    if (!result.success) {
      return res.status(400).json({ 
        message: "Calendly not configured or scheduling failed. Please configure Calendly in Integration Marketplace."
      });
    }

    res.json({ 
      message: "Meeting scheduled via Calendly",
      meetingUrl: result.meetingUrl
    });
  } catch (error) {
    console.error("Error creating Calendly meeting:", error);
    res.status(500).json({ message: "Failed to create Calendly meeting" });
  }
});

// Create Zoom meeting
router.post("/schedule/zoom", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { topic, startTime, duration, agenda } = req.body;

    if (!topic || !startTime || !duration) {
      return res.status(400).json({ message: "Topic, start time, and duration are required" });
    }

    const { IntegrationService } = await import("./integrationService.js");
    
    const result = await IntegrationService.createZoomMeeting(userId, {
      topic,
      startTime,
      duration,
      agenda
    });

    if (!result.success) {
      return res.status(400).json({ 
        message: "Zoom not configured or meeting creation failed. Please configure Zoom in Integration Marketplace."
      });
    }

    res.json({ 
      message: "Zoom meeting created successfully",
      meetingUrl: result.meetingUrl,
      meetingId: result.meetingId,
      password: result.password
    });
  } catch (error) {
    console.error("Error creating Zoom meeting:", error);
    res.status(500).json({ message: "Failed to create Zoom meeting" });
  }
});

// Create Google Meet
router.post("/schedule/google-meet", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { summary, description, startTime, endTime, attendees } = req.body;

    if (!summary || !startTime || !endTime) {
      return res.status(400).json({ message: "Summary, start time, and end time are required" });
    }

    const { IntegrationService } = await import("./integrationService.js");
    
    const result = await IntegrationService.createGoogleMeet(userId, {
      summary,
      description,
      startTime,
      endTime,
      attendees
    });

    if (!result.success) {
      return res.status(400).json({ 
        message: "Google Workspace not configured or meeting creation failed. Please configure Google Workspace in Integration Marketplace."
      });
    }

    res.json({ 
      message: "Google Meet created successfully",
      meetingUrl: result.meetingUrl,
      eventId: result.eventId
    });
  } catch (error) {
    console.error("Error creating Google Meet:", error);
    res.status(500).json({ message: "Failed to create Google Meet" });
  }
});

export default router;
