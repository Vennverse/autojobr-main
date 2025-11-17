import express from "express";
import { db } from "./db";
import { tasks, userIntegrations} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { isAuthenticated } from "./auth";
import { aiService } from "./aiService";

const router = express.Router();

// Get user tasks
router.get('/tasks', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
    
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
    const { title, description, reminderAt } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    
    const [newTask] = await db.insert(tasks).values({
      userId,
      title,
      description: description || null,
      reminderDateTime: reminderAt || null,
      status: 'pending',
      taskType: 'reminder',
      priority: 'medium',
      category: 'general'
    }).returning();
    
    res.json({ success: true, task: newTask });
  } catch (error) {
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
        groqApiKey: integration[0]?.apiKey ? true : false // Only return boolean
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
    
    if (!groqApiKey) {
      return res.status(400).json({ success: false, error: 'API key is required' });
    }
    
    // Check if integration exists
    const existing = await db
      .select()
      .from(userIntegrations)
      .where(and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.integrationId, 'groq')
      ))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing
      await db
        .update(userIntegrations)
        .set({
          apiKey: groqApiKey,
          isEnabled: true,
          updatedAt: new Date()
        })
        .where(eq(userIntegrations.id, existing[0].id));
    } else {
      // Create new
      await db.insert(userIntegrations).values({
        userId,
        integrationId: 'groq',
        apiKey: groqApiKey,
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
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }
    
    // Check if user has BYOK key
    const integration = await db
      .select()
      .from(userIntegrations)
      .where(and(
        eq(userIntegrations.userId, userId),
        eq(userIntegrations.integrationId, 'groq'),
        eq(userIntegrations.isEnabled, true)
      ))
      .limit(1);
    
    const useByokKey = integration.length > 0 && integration[0].apiKey;
    
    // Use AI service with BYOK key or premium service
    const reply = await aiService.chatWithContext(message, {
      userId,
      customApiKey: useByokKey ? integration[0].apiKey : undefined
    });
    
    res.json({ success: true, reply });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ success: false, error: 'Failed to process chat' });
  }
});

export default router;