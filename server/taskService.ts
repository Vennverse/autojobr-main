// Task Service - Handles task management and reminders for Chrome extension
import { Request, Response } from 'express';
import { eq, and, desc, lt, gte, lte } from 'drizzle-orm';
import { db } from './db';
import { tasks, taskReminders, users, type InsertTask, type InsertTaskReminder } from '@shared/schema';

export class TaskService {
  // Create a new task
  static async createTask(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const {
        title,
        description,
        taskType = 'reminder',
        priority = 'medium',
        category = 'general',
        dueDateTime,
        reminderDateTime,
        reminderEnabled = true,
        recurrence = 'none',
        relatedTo,
        relatedId,
        relatedUrl,
        tags = [],
        notes
      } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Task title is required' });
      }

      // Create task
      const taskData: InsertTask = {
        userId,
        title,
        description,
        taskType,
        priority,
        category,
        dueDateTime: dueDateTime ? new Date(dueDateTime) : undefined,
        reminderDateTime: reminderDateTime ? new Date(reminderDateTime) : undefined,
        reminderEnabled,
        recurrence,
        relatedTo,
        relatedId,
        relatedUrl,
        tags,
        notes
      };

      const [newTask] = await db.insert(tasks)
        .values(taskData)
        .returning();

      // Create reminder if specified
      if (reminderEnabled && reminderDateTime) {
        const reminderData: InsertTaskReminder = {
          taskId: newTask.id,
          userId,
          triggerDateTime: new Date(reminderDateTime),
          reminderType: 'popup'
        };

        await db.insert(taskReminders)
          .values(reminderData);
      }

      res.json({ success: true, task: newTask });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }

  // Get user's tasks
  static async getUserTasks(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { 
        status, 
        category, 
        priority,
        limit = 50,
        offset = 0,
        search
      } = req.query;

      let whereConditions = [eq(tasks.userId, userId)];

      // Apply filters
      if (status) {
        whereConditions.push(eq(tasks.status, status as string));
      }

      if (category) {
        whereConditions.push(eq(tasks.category, category as string));
      }

      if (priority) {
        whereConditions.push(eq(tasks.priority, priority as string));
      }

      const query = db.select()
        .from(tasks)
        .where(and(...whereConditions));

      const userTasks = await query
        .orderBy(desc(tasks.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      // Get pending reminders count
      const now = new Date();
      const pendingReminders = await db.select()
        .from(taskReminders)
        .where(and(
          eq(taskReminders.userId, userId),
          eq(taskReminders.isTriggered, false),
          lte(taskReminders.triggerDateTime, now)
        ));

      res.json({ 
        success: true, 
        tasks: userTasks,
        pendingRemindersCount: pendingReminders.length
      });
    } catch (error) {
      console.error('Get user tasks error:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }

  // Update task status
  static async updateTaskStatus(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { taskId } = req.params;
      const { status, notes } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const updateData: any = { 
        status,
        updatedAt: new Date()
      };

      if (notes) {
        updateData.notes = notes;
      }

      if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      const [updatedTask] = await db.update(tasks)
        .set(updateData)
        .where(and(
          eq(tasks.userId, userId),
          eq(tasks.id, parseInt(taskId))
        ))
        .returning();

      if (!updatedTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ success: true, task: updatedTask });
    } catch (error) {
      console.error('Update task status error:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  }

  // Get pending reminders for Chrome extension popup
  static async getPendingReminders(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const now = new Date();

      // Get reminders that should be triggered now
      const pendingReminders = await db.select({
        reminderId: taskReminders.id,
        taskId: taskReminders.taskId,
        triggerDateTime: taskReminders.triggerDateTime,
        reminderType: taskReminders.reminderType,
        taskTitle: tasks.title,
        taskDescription: tasks.description,
        taskPriority: tasks.priority,
        taskCategory: tasks.category,
        dueDateTime: tasks.dueDateTime,
        relatedUrl: tasks.relatedUrl
      })
      .from(taskReminders)
      .innerJoin(tasks, eq(taskReminders.taskId, tasks.id))
      .where(and(
        eq(taskReminders.userId, userId),
        eq(taskReminders.isTriggered, false),
        lte(taskReminders.triggerDateTime, now),
        eq(tasks.status, 'pending') // Only show reminders for active tasks
      ));

      // Mark reminders as triggered
      if (pendingReminders.length > 0) {
        const reminderIds = pendingReminders.map(r => r.reminderId);
        await db.update(taskReminders)
          .set({ 
            isTriggered: true,
            triggeredAt: now
          })
          .where(eq(taskReminders.id, reminderIds[0])); // Update all at once would need OR condition
      }

      res.json({ 
        success: true, 
        reminders: pendingReminders,
        count: pendingReminders.length
      });
    } catch (error) {
      console.error('Get pending reminders error:', error);
      res.status(500).json({ error: 'Failed to fetch reminders' });
    }
  }

  // Snooze a reminder
  static async snoozeReminder(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { reminderId } = req.params;
      const { snoozeMinutes = 15 } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const snoozeUntil = new Date();
      snoozeUntil.setMinutes(snoozeUntil.getMinutes() + parseInt(snoozeMinutes));

      await db.update(taskReminders)
        .set({ 
          userResponse: 'snoozed',
          snoozeUntil,
          isTriggered: false // Reset so it can trigger again
        })
        .where(and(
          eq(taskReminders.userId, userId),
          eq(taskReminders.id, parseInt(reminderId))
        ));

      res.json({ success: true, message: `Reminder snoozed for ${snoozeMinutes} minutes` });
    } catch (error) {
      console.error('Snooze reminder error:', error);
      res.status(500).json({ error: 'Failed to snooze reminder' });
    }
  }

  // Mark reminder as dismissed
  static async dismissReminder(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { reminderId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      await db.update(taskReminders)
        .set({ 
          userResponse: 'dismissed'
        })
        .where(and(
          eq(taskReminders.userId, userId),
          eq(taskReminders.id, parseInt(reminderId))
        ));

      res.json({ success: true, message: 'Reminder dismissed' });
    } catch (error) {
      console.error('Dismiss reminder error:', error);
      res.status(500).json({ error: 'Failed to dismiss reminder' });
    }
  }

  // Delete a task
  static async deleteTask(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const { taskId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Delete associated reminders first
      await db.delete(taskReminders)
        .where(eq(taskReminders.taskId, parseInt(taskId)));

      // Delete the task
      const [deletedTask] = await db.delete(tasks)
        .where(and(
          eq(tasks.userId, userId),
          eq(tasks.id, parseInt(taskId))
        ))
        .returning();

      if (!deletedTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }

  // Get task analytics/stats
  static async getTaskStats(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get task counts by status
      const allTasks = await db.select()
        .from(tasks)
        .where(eq(tasks.userId, userId));

      const stats = {
        total: allTasks.length,
        pending: allTasks.filter(t => t.status === 'pending').length,
        inProgress: allTasks.filter(t => t.status === 'in_progress').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        overdue: allTasks.filter(t => {
          return t.status !== 'completed' && t.dueDateTime && 
                 new Date(t.dueDateTime) < new Date();
        }).length,
        byCategory: {} as Record<string, number>,
        byPriority: {} as Record<string, number>
      };

      // Count by category
      allTasks.forEach(task => {
        const category = task.category || 'general';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      });

      // Count by priority
      allTasks.forEach(task => {
        const priority = task.priority || 'medium';
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
      });

      res.json({ success: true, stats });
    } catch (error) {
      console.error('Get task stats error:', error);
      res.status(500).json({ error: 'Failed to fetch task statistics' });
    }
  }
}