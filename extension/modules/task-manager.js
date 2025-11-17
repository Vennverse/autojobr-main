
// Task Manager Module - Handles task operations
class TaskManager {
  constructor(apiClient, notificationManager) {
    this.apiClient = apiClient;
    this.notificationManager = notificationManager;
  }

  async loadTasks() {
    try {
      const response = await this.apiClient.makeRequest('/api/tasks');
      if (response.success && response.tasks) {
        return response.tasks;
      }
      return [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  }

  async createTask(taskData) {
    const { title, description, reminderAt } = taskData;

    if (!title || !reminderAt) {
      return { success: false, error: 'Title and due date are required' };
    }

    try {
      const response = await this.apiClient.makeRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: description || '',
          dueDateTime: reminderAt,
          reminderAt: reminderAt,
          reminderEnabled: true,
          priority: 'medium',
          category: 'general',
          taskType: 'reminder'
        })
      });

      if (response.success || response.task) {
        return { success: true, task: response.task };
      }
      return { success: false, error: response.error || 'Failed to create task' };
    } catch (error) {
      console.error('Task creation error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateTask(taskId, updates) {
    try {
      await this.apiClient.makeRequest(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      return { success: true };
    } catch (error) {
      console.error('Task update error:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteTask(taskId) {
    try {
      await this.apiClient.makeRequest(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      return { success: true };
    } catch (error) {
      console.error('Task delete error:', error);
      return { success: false, error: error.message };
    }
  }
}

if (typeof window !== 'undefined') {
  window.TaskManager = TaskManager;
}
