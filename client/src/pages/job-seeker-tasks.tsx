import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import {
  Search,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  RefreshCw,
  Target,
  Bell,
  Users,
  CalendarDays,
  Link2,
  ArrowLeft,
  Briefcase,
  Building,
  FileText,
  Phone,
  Mail,
  CheckSquare,
  Timer,
  Flag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface JobSeekerTask {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  taskType: 'application' | 'followup' | 'interview_prep' | 'networking' | 'skill_development' | 'research' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  dueDateTime?: string;
  reminderDateTime?: string;
  reminderEnabled?: boolean;
  relatedUrl?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  title: string;
  description: string;
  taskType: string;
  priority: string;
  category: string;
  dueDateTime: string;
  reminderDateTime: string;
  reminderEnabled: boolean;
  relatedUrl: string;
  tags: string[];
  notes: string;
  companyName: string;
}

export default function JobSeekerTasks() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<JobSeekerTask | null>(null);

  // Form data for creating/editing tasks
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    taskType: "application",
    priority: "medium",
    category: "general",
    dueDateTime: "",
    reminderDateTime: "",
    reminderEnabled: false,
    relatedUrl: "",
    tags: [],
    notes: "",
    companyName: ""
  });

  const [selectedTemplate, setSelectedTemplate] = useState("custom");

  // Redirect to auth page if not authenticated (after loading is complete)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/auth";
    }
  }, [isAuthenticated, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // Fetch user tasks
  const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks, error: tasksError } = useQuery({
    queryKey: ["/api/tasks"],
    retry: false,
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  // Handle authentication errors from API
  useEffect(() => {
    if (tasksError && (tasksError as any)?.message?.includes('401')) {
      console.error('Authentication error on tasks page:', tasksError);
      toast({
        title: "Session Expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1500);
    }
  }, [tasksError, toast]);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      if (!taskData.title?.trim()) {
        throw new Error("Task title is required");
      }
      if (!taskData.dueDateTime) {
        throw new Error("Due date and time are required");
      }
      
      const formattedData = {
        ...taskData,
        title: taskData.title.trim(),
        description: taskData.description?.trim() || '',
        dueDateTime: new Date(taskData.dueDateTime).toISOString(),
        reminderDateTime: taskData.reminderDateTime ? new Date(taskData.reminderDateTime).toISOString() : undefined,
      };
      
      return apiRequest("/api/tasks", "POST", formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "✅ Task Created",
        description: "Your task has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Task creation error:', error);
      toast({
        title: "❌ Failed to Create Task",
        description: error.message || "Please check all required fields and try again.",
        variant: "destructive",
      });
    }
  });

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      console.log('Updating task status:', { id, status });
      const result = await apiRequest(`/api/tasks/${id}/status`, "PATCH", { status });
      console.log('Update result:', result);
      return result;
    },
    onSuccess: (data, variables) => {
      console.log('Task update successful:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      refetchTasks(); // Force refetch
      toast({
        title: "✅ Task Updated",
        description: `Task marked as ${variables.status.replace('_', ' ')}`,
      });
    },
    onError: (error: any) => {
      console.error('Task update error:', error);
      toast({
        title: "❌ Update Failed",
        description: error.message || "Failed to update task status",
        variant: "destructive",
      });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      console.log('Deleting task:', taskId);
      const result = await apiRequest(`/api/tasks/${taskId}`, "DELETE");
      console.log('Delete result:', result);
      return result;
    },
    onSuccess: (data, taskId) => {
      console.log('Task delete successful:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      refetchTasks(); // Force refetch
      toast({
        title: "🗑️ Task Deleted",
        description: "Task has been permanently deleted.",
      });
    },
    onError: (error: any) => {
      console.error('Task delete error:', error);
      toast({
        title: "❌ Delete Failed",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    }
  });

  // Task templates matching extension functionality
  interface TaskTemplate {
    title: string;
    description: string;
    priority: string;
    category: string;
    taskType: string;
    daysOffset: number;
    hoursOffset?: number;
  }

  // Task templates matching extension exactly
  const getTaskTemplates = (): Record<string, TaskTemplate> => {
    return {
      follow_up: {
        title: 'Follow up on application at {company}',
        description: 'Send a polite follow-up email to check on application status. Include specific details about the role and express continued interest.',
        priority: 'medium',
        category: 'job_application',
        taskType: 'followup',
        daysOffset: 3
      },
      interview_prep: {
        title: 'Prepare for interview at {company}',
        description: 'Research the company, review job requirements, prepare answers for common questions, and practice technical skills if needed.',
        priority: 'high',
        category: 'interview',
        taskType: 'interview_prep',
        daysOffset: 1
      },
      thank_you: {
        title: 'Send thank you note after interview',
        description: 'Send a personalized thank you email within 24 hours of the interview. Reference specific discussion points and reiterate interest.',
        priority: 'high',
        category: 'job_application',
        taskType: 'followup',
        daysOffset: 0,
        hoursOffset: 2
      },
      research: {
        title: 'Research {company} before applying',
        description: 'Research company culture, recent news, products/services, competitors, and key team members. Prepare thoughtful questions.',
        priority: 'medium',
        category: 'career_planning',
        taskType: 'reminder',
        daysOffset: 0,
        hoursOffset: 2
      },
      custom: {
        title: '',
        description: '',
        priority: 'medium',
        category: 'general',
        taskType: 'reminder',
        daysOffset: 1
      }
    };
  };

  // Extract company name from URL or use manual input
  const extractCompanyFromUrl = (url: string): string => {
    if (!url) return '';
    try {
      const domain = new URL(url).hostname;
      const parts = domain.split('.');
      const companyPart = parts.length > 2 ? parts[parts.length - 2] : parts[0];
      return companyPart.charAt(0).toUpperCase() + companyPart.slice(1);
    } catch {
      return '';
    }
  };

  const applyTemplate = (templateKey: string) => {
    const templates = getTaskTemplates();
    const template = templates[templateKey];
    if (!template) return;

    // Calculate due date based on template offset
    let dueDate = new Date();
    if (template.daysOffset) {
      dueDate.setDate(dueDate.getDate() + template.daysOffset);
    }
    if (template.hoursOffset) {
      dueDate.setHours(dueDate.getHours() + template.hoursOffset);
    }

    // Use functional updates to avoid stale closure issues
    setFormData(prev => {
      const companyName = prev.companyName || extractCompanyFromUrl(prev.relatedUrl);
      const title = template.title && companyName ? 
        template.title.replace('{company}', companyName) : 
        template.title;

      return {
        ...prev,
        title,
        description: template.description,
        priority: template.priority,
        category: template.category,
        taskType: template.taskType,
        dueDateTime: dueDate.toISOString().slice(0, 16)
      };
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      taskType: "application",
      priority: "medium",
      category: "general",
      dueDateTime: "",
      reminderDateTime: "",
      reminderEnabled: false,
      relatedUrl: "",
      tags: [],
      notes: "",
      companyName: ""
    });
    setSelectedTemplate("custom");
  };

  const handleCreateTask = () => {
    createTaskMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType) {
      case 'application': return <Briefcase className="h-4 w-4" />;
      case 'followup': return <Phone className="h-4 w-4" />;
      case 'interview_prep': return <Users className="h-4 w-4" />;
      case 'networking': return <Users className="h-4 w-4" />;
      case 'skill_development': return <Target className="h-4 w-4" />;
      case 'research': return <FileText className="h-4 w-4" />;
      case 'reminder': return <Bell className="h-4 w-4" />;
      default: return <CheckSquare className="h-4 w-4" />;
    }
  };

  // Extract tasks from response
  const taskList = (tasksData as any)?.tasks || [];
  
  // Filter tasks
  const filteredTasks = taskList.filter((task: JobSeekerTask) => {
    const matchesSearch = !searchTerm || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesType = typeFilter === "all" || task.taskType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  // Task stats
  const taskStats = {
    total: taskList.length,
    pending: taskList.filter((t: JobSeekerTask) => t.status === 'pending').length,
    inProgress: taskList.filter((t: JobSeekerTask) => t.status === 'in_progress').length,
    completed: taskList.filter((t: JobSeekerTask) => t.status === 'completed').length,
    overdue: taskList.filter((t: JobSeekerTask) => {
      return t.status !== 'completed' && t.dueDateTime && new Date(t.dueDateTime) < new Date();
    }).length
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-900"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                My Tasks
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Manage your job search tasks and stay organized
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => refetchTasks()}
              variant="outline"
              size="sm"
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-task">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{taskStats.total}</p>
                </div>
                <CheckSquare className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{taskStats.pending}</p>
                </div>
                <Timer className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{taskStats.inProgress}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{taskStats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-priority-filter">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-type-filter">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="application">Application</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="interview_prep">Interview Prep</SelectItem>
                  <SelectItem value="networking">Networking</SelectItem>
                  <SelectItem value="skill_development">Skill Development</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Grid */}
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredTasks.map((task: JobSeekerTask) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="group"
              >
                <Card className="hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getTaskTypeIcon(task.taskType)}
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Flag className={`h-4 w-4 ${getPriorityColor(task.priority)}`} />
                        </div>
                        
                        {task.description && (
                          <p className="text-gray-600 dark:text-gray-300 mb-3">{task.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {task.dueDateTime && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Due: {new Date(task.dueDateTime).toLocaleDateString()}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Created: {new Date(task.createdAt).toLocaleDateString()}
                          </div>
                          {task.relatedUrl && (
                            <a 
                              href={task.relatedUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:underline"
                            >
                              <Link2 className="h-4 w-4" />
                              Related Link
                            </a>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {task.status !== 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newStatus = task.status === 'pending' ? 'in_progress' : 'completed';
                              updateTaskStatusMutation.mutate({ id: task.id, status: newStatus });
                            }}
                            disabled={updateTaskStatusMutation.isPending}
                            data-testid={`button-update-${task.id}`}
                          >
                            {updateTaskStatusMutation.isPending ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              task.status === 'pending' ? 'Start' : 'Complete'
                            )}
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this task?')) {
                              deleteTaskMutation.mutate(task.id);
                            }
                          }}
                          disabled={deleteTaskMutation.isPending}
                          data-testid={`button-delete-${task.id}`}
                        >
                          {deleteTaskMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredTasks.length === 0 && !tasksLoading && (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No tasks found
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Create your first task to get started with organizing your job search.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Task Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to help organize your job search activities.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Task Templates */}
              <div>
                <Label>Quick Templates</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {Object.entries(getTaskTemplates()).map(([key, template]) => (
                    <Button
                      key={key}
                      type="button"
                      variant={selectedTemplate === key ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-auto py-2 px-3"
                      onClick={() => {
                        setSelectedTemplate(key);
                        applyTemplate(key);
                      }}
                      data-testid={`template-${key}`}
                    >
                      {key === 'follow_up' && '📧 Follow Up'}
                      {key === 'interview_prep' && '💼 Interview Prep'}
                      {key === 'thank_you' && '🙏 Thank You Note'}
                      {key === 'research' && '🔍 Company Research'}
                      {key === 'custom' && '✏️ Custom Task'}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Follow up with ABC Company"
                  data-testid="input-title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Send a follow-up email about the software engineer position..."
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>

              <div>
                <Label htmlFor="companyName">Company Name (optional)</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => {
                    const companyName = e.target.value;
                    setFormData(prev => ({ ...prev, companyName }));
                    // Auto-update title if using a template with {company} placeholder
                    if (selectedTemplate !== 'custom' && companyName) {
                      const templates = getTaskTemplates();
                      const template = templates[selectedTemplate];
                      if (template?.title?.includes('{company}')) {
                        setFormData(prev => ({
                          ...prev,
                          title: template.title.replace('{company}', companyName)
                        }));
                      }
                    }
                  }}
                  placeholder="e.g., Google, Microsoft, Amazon"
                  data-testid="input-company-name"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Will auto-populate task titles with company name when using templates
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label>Task Type</Label>
                  <Select value={formData.taskType} onValueChange={(value) => setFormData(prev => ({ ...prev, taskType: value }))}>
                    <SelectTrigger data-testid="select-task-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="application">Job Application</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="interview_prep">Interview Prep</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="skill_development">Skill Development</SelectItem>
                      <SelectItem value="research">Company Research</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="job_application">Job Application</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="career_planning">Career Planning</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="skill_development">Skill Development</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="dueDateTime">Due Date & Time *</Label>
                <Input
                  id="dueDateTime"
                  type="datetime-local"
                  value={formData.dueDateTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDateTime: e.target.value }))}
                  data-testid="input-due-datetime"
                />
              </div>

              <div>
                <Label htmlFor="relatedUrl">Related URL</Label>
                <Input
                  id="relatedUrl"
                  type="url"
                  value={formData.relatedUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setFormData(prev => ({ ...prev, relatedUrl: url }));
                    // Auto-extract company name from URL if company field is empty
                    if (url && !formData.companyName) {
                      const extractedCompany = extractCompanyFromUrl(url);
                      if (extractedCompany) {
                        setFormData(prev => ({ ...prev, companyName: extractedCompany }));
                      }
                    }
                  }}
                  placeholder="https://company.com/careers/job-posting"
                  data-testid="input-related-url"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Company name will be auto-extracted from job posting URLs
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or details..."
                  rows={2}
                  data-testid="textarea-notes"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTask}
                  disabled={createTaskMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createTaskMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}