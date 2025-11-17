import express from "express";
import { db } from "./db";
import { tasks, userIntegrations, users } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { isAuthenticated } from "./auth";
import { aiService } from "./aiService";
import { z } from "zod";
import crypto from "crypto";

const router = express.Router();

if (!process.env.ENCRYPTION_KEY) {
  console.error('⚠️ ENCRYPTION_KEY not set - BYOK features will be disabled');
  console.error('⚠️ Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

function validateEncryptionKey(): boolean {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64 || !/^[0-9a-f]{64}$/i.test(ENCRYPTION_KEY)) {
    return false;
  }
  return true;
}

function encryptApiKey(apiKey: string): string {
  if (!validateEncryptionKey()) {
    throw new Error('ENCRYPTION_KEY not configured or invalid - BYOK features disabled');
  }
  
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decryptApiKey(encryptedData: string): string {
  if (!validateEncryptionKey()) {
    throw new Error('ENCRYPTION_KEY not configured or invalid - cannot decrypt BYOK keys');
  }
  
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  reminderAt: z.string().datetime().optional()
});

// Get user tasks
router.get('/tasks', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset(offset);
    
    res.json({ success: true, tasks: userTasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
});

// Create task
router.post('/tasks', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const validatedData = createTaskSchema.parse(req.body);
    
    const [newTask] = await db.insert(tasks).values({
      userId,
      title: validatedData.title,
      description: validatedData.description || null,
      reminderDateTime: validatedData.reminderAt ? new Date(validatedData.reminderAt) : null,
      status: 'pending',
      taskType: 'reminder',
      priority: 'medium',
      category: 'general'
    }).returning();
    
    res.json({ success: true, task: newTask });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

// Update task
router.patch('/tasks/:id', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id);
    const { completed } = req.body;
    
    const [updatedTask] = await db
      .update(tasks)
      .set({
        status: completed ? 'completed' : 'pending',
        completedAt: completed ? new Date() : null
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    
    res.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/tasks/:id', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const taskId = parseInt(req.params.id);
    
    await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
});

// Get user settings (including BYOK API key)
router.get('/user/settings', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const integration = await db
      .select()
      .from(userIntegrations)
      .where(and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.integrationId, 'groq')
      ))
      .limit(1);
    
    res.json({
      success: true,
      settings: {
        groqApiKey: integration[0]?.apiKey ? true : false,
        encryptionEnabled: validateEncryptionKey()
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// Save user settings (BYOK API key)
router.post('/user/settings', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { groqApiKey } = req.body;
    
    if (!groqApiKey || typeof groqApiKey !== 'string' || groqApiKey.length < 10) {
      return res.status(400).json({ success: false, error: 'Valid API key is required' });
    }
    
    if (!validateEncryptionKey()) {
      return res.status(503).json({ 
        success: false, 
        error: 'BYOK features are temporarily unavailable. Please contact support to enable encryption.' 
      });
    }
    
    let encryptedKey: string;
    try {
      encryptedKey = encryptApiKey(groqApiKey);
    } catch (encryptError) {
      console.error('Error encrypting API key:', encryptError);
      return res.status(500).json({ success: false, error: 'Failed to encrypt API key' });
    }
    
    const existing = await db
      .select()
      .from(userIntegrations)
      .where(and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.integrationId, 'groq')
      ))
      .limit(1);
    
    if (existing.length > 0) {
      await db
        .update(userIntegrations)
        .set({
          apiKey: encryptedKey,
          isEnabled: true,
          updatedAt: new Date()
        })
        .where(eq(userIntegrations.id, existing[0].id));
    } else {
      await db.insert(userIntegrations).values({
        userId,
        integrationId: 'groq',
        apiKey: encryptedKey,
        isEnabled: true
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

// Chat endpoint
router.post('/chat', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;
    
    if (!message || typeof message !== 'string' || message.length > 10000) {
      return res.status(400).json({ success: false, error: 'Valid message is required (max 10000 chars)' });
    }
    
    const integration = await db
      .select()
      .from(userIntegrations)
      .where(and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.integrationId, 'groq'),
        eq(userIntegrations.isEnabled, true)
      ))
      .limit(1);
    
    const hasValidByokKey = integration.length > 0 && integration[0].apiKey && integration[0].isEnabled;
    
    let decryptedKey: string | undefined;
    if (hasValidByokKey) {
      if (!validateEncryptionKey()) {
        console.warn('BYOK key exists but ENCRYPTION_KEY not configured - falling back to premium service');
      } else {
        try {
          decryptedKey = decryptApiKey(integration[0].apiKey!);
        } catch (err) {
          console.error('Failed to decrypt BYOK key - falling back to premium service:', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to decrypt your API key. Please re-enter it in Settings.' 
          });
        }
      }
    }
    
    const reply = await aiService.chatWithContext(message, {
      userId,
      customApiKey: decryptedKey
    });
    
    res.json({ success: true, reply });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ success: false, error: 'Failed to process chat' });
  }
});

// Resume Generation endpoint
router.post('/resume/generate', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { jobDescription, additionalRequirements } = req.body;
    
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.length < 50) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide a valid job description (minimum 50 characters)' 
      });
    }

    if (jobDescription.length > 20000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Job description is too long (maximum 20000 characters)' 
      });
    }
    
    // Check user's premium status
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { planType: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isPremium = user.planType === 'premium' || user.planType === 'enterprise' || user.planType === 'ultra_premium';
    
    // Check for BYOK key
    const integration = await db
      .select()
      .from(userIntegrations)
      .where(and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.integrationId, 'groq'),
        eq(userIntegrations.isEnabled, true)
      ))
      .limit(1);
    
    const hasValidByokKey = integration.length > 0 && integration[0].apiKey && integration[0].isEnabled;

    // Enforce premium or BYOK requirement
    if (!isPremium && !hasValidByokKey) {
      return res.status(403).json({ 
        success: false, 
        error: 'Resume generation requires a premium subscription or your own Groq API key. Please upgrade to premium or add your API key in Settings.' 
      });
    }
    
    let decryptedKey: string | undefined;
    if (hasValidByokKey) {
      if (!validateEncryptionKey()) {
        console.warn('BYOK key exists but ENCRYPTION_KEY not configured - falling back to premium service');
      } else {
        try {
          decryptedKey = decryptApiKey(integration[0].apiKey!);
        } catch (err) {
          console.error('Failed to decrypt BYOK key - falling back to premium service:', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to decrypt your API key. Please re-enter it in Settings.' 
          });
        }
      }
    }

    // Build the prompt for resume generation
    const prompt = `You are a professional resume writer. Generate a tailored resume based on the following job description.

Job Description:
${jobDescription}

${additionalRequirements ? `Additional Requirements to Highlight:\n${additionalRequirements}\n` : ''}

Please generate a professional resume that:
1. Highlights relevant skills and experience for this specific role
2. Uses action verbs and quantifiable achievements
3. Follows ATS-friendly formatting
4. Includes relevant sections: Summary, Skills, Experience, Education
5. Tailors the content to match the job requirements

Generate a complete, professional resume in plain text format.`;

    // Use AI service to generate the resume
    const resume = await aiService.chatWithContext(prompt, {
      userId,
      customApiKey: decryptedKey
    });
    
    if (!resume) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to generate resume. Please try again.' 
      });
    }

    res.json({ success: true, resume });
  } catch (error) {
    console.error('Error generating resume:', error);
    res.status(500).json({ success: false, error: 'Failed to generate resume' });
  }
});

export default router;