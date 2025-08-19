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
import { RecruiterNavbar } from "@/components/RecruiterNavbar";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import {
  Search,
  Plus,
  Calendar,
  Clock,
  User,
  Mail,
  Video,
  Phone,
  CheckCircle,
  AlertCircle,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
  RefreshCw,
  UserCheck,
  BookOpen,
  Target,
  Bell,
  Play,
  Users,
  CalendarDays,
  Link2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  taskType: 'interview' | 'meeting' | 'followup' | 'reminder' | 'document_review' | 'background_check';
  relatedTo?: string;
  relatedId?: number;
  owner: string;
  ownerId: string;
  assignedBy: string;
  assignedById: string;
  dueDateTime: string;
  createdAt: string;
  updatedAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  candidateName?: string;
  candidateEmail?: string;
  jobTitle?: string;
  meetingLink?: string;
  calendlyLink?: string;
  emailSent: boolean;
}

export default function TaskManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isRecruiter = user?.userType === 'recruiter' || user?.currentRole === 'recruiter';

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [taskTypeFilter, setTaskTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [bulkSelection, setBulkSelection] = useState<Set<number>>(new Set());
  
  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    taskType: "meeting",
    priority: "medium",
    dueDateTime: "",
    candidateEmail: "",
    candidateName: "",
    jobTitle: "",
    meetingLink: "",
    calendlyLink: "",
    relatedTo: "",
    relatedId: ""
  });

  // Fetch tasks - use appropriate endpoint based on user type
  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: isRecruiter ? ["/api/recruiter/tasks"] : ["/api/tasks"],
    retry: false,
  });

  // Fetch candidates for task assignment (recruiter only)
  const { data: candidates } = useQuery({
    queryKey: ["/api/recruiter/applications"],
    retry: false,
    enabled: isRecruiter,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      // Validate required fields
      if (!taskData.title?.trim()) {
        throw new Error("Task title is required");
      }
      if (!taskData.dueDateTime) {
        throw new Error("Due date and time are required");
      }
      
      // Format the data properly
      const formattedData = {
        ...taskData,
        title: taskData.title.trim(),
        description: taskData.description?.trim() || '',
        dueDateTime: new Date(taskData.dueDateTime).toISOString(),
      };
      
      return apiRequest(isRecruiter ? "/api/recruiter/tasks" : "/api/tasks", "POST", formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: isRecruiter ? ["/api/recruiter/tasks"] : ["/api/tasks"] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "✅ Task Created",
        description: "Your task has been created successfully and added to your dashboard.",
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

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...taskData }: any) => {
      return apiRequest(`/api/recruiter/tasks/${id}`, "PATCH", taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/tasks"] });
      setShowEditDialog(false);
      toast({
        title: "Task Updated",
        description: "Task has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    }
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async ({ taskId, type }: { taskId: number, type: string }) => {
      return apiRequest("/api/recruiter/tasks/send-email", "POST", { taskId, type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/tasks"] });
      toast({
        title: "Email Sent",
        description: "Meeting invitation has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    }
  });

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, taskIds }: { action: string, taskIds: number[] }) => {
      return apiRequest("/api/recruiter/tasks/bulk", "POST", { action, taskIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/tasks"] });
      setBulkSelection(new Set());
      toast({
        title: "Bulk Action Completed",
        description: "Selected tasks have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to perform bulk action",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      taskType: "meeting",
      priority: "medium",
      dueDateTime: "",
      candidateEmail: "",
      candidateName: "",
      jobTitle: "",
      meetingLink: "",
      calendlyLink: "",
      relatedTo: "",
      relatedId: ""
    });
  };

  // Enhanced form validation
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.title?.trim()) {
      errors.push("Task title is required");
    }
    
    if (!formData.dueDateTime) {
      errors.push("Due date and time are required");
    } else {
      const dueDate = new Date(formData.dueDateTime);
      const now = new Date();
      if (dueDate < now) {
        errors.push("Due date cannot be in the past");
      }
    }
    
    if (formData.candidateEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.candidateEmail)) {
      errors.push("Please enter a valid email address");
    }
    
    return errors;
  };

  const handleCreateTask = () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: "❌ Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }
    
    createTaskMutation.mutate(formData);
  };

  const handleEditTask = () => {
    if (!selectedTask) return;
    updateTaskMutation.mutate({ id: selectedTask.id, ...formData });
  };

  const handleSendEmail = (taskId: number, type: string) => {
    sendEmailMutation.mutate({ taskId, type });
  };

  const handleBulkAction = (action: string) => {
    if (bulkSelection.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select tasks to perform bulk actions.",
        variant: "destructive",
      });
      return;
    }
    bulkActionMutation.mutate({ action, taskIds: Array.from(bulkSelection) });
  };

  const toggleBulkSelection = (taskId: number) => {
    const newSelection = new Set(bulkSelection);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setBulkSelection(newSelection);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
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
      case 'interview': return <Video className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'followup': return <Phone className="h-4 w-4" />;
      case 'reminder': return <Bell className="h-4 w-4" />;
      case 'document_review': return <BookOpen className="h-4 w-4" />;
      case 'background_check': return <UserCheck className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  // Extract tasks from response
  const taskList = isRecruiter ? (tasks as Task[] || []) : ((tasks as any)?.tasks || []);
  
  // Filter tasks
  const filteredTasks = taskList.filter((task: any) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.candidateEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesTaskType = taskTypeFilter === "all" || task.taskType === taskTypeFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesTaskType && matchesPriority;
  });

  if (tasksLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {isRecruiter ? <RecruiterNavbar user={user as any} /> : <Navbar />}
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {isRecruiter ? <RecruiterNavbar user={user as any} /> : <Navbar />}
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Task & Meeting Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage tasks, schedule meetings, and send invitations to candidates
            </p>
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

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, job, email or LinkedIn URL..."
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
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={taskTypeFilter} onValueChange={setTaskTypeFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-task-type-filter">
                  <SelectValue placeholder="Task Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="document_review">Document Review</SelectItem>
                  <SelectItem value="background_check">Background Check</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[120px]" data-testid="select-priority-filter">
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

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {bulkSelection.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-700 dark:text-blue-300">
                    {bulkSelection.size} task(s) selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBulkAction("complete")}
                      disabled={bulkActionMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark Complete
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBulkAction("cancel")}
                      disabled={bulkActionMutation.isPending}
                    >
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBulkAction("send_reminder")}
                      disabled={bulkActionMutation.isPending}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Send Reminders
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Tasks ({filteredTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="p-4 text-left">
                      <input
                        type="checkbox"
                        checked={bulkSelection.size === filteredTasks.length && filteredTasks.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkSelection(new Set(filteredTasks.map((t: any) => t.id)));
                          } else {
                            setBulkSelection(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="p-4 text-left font-semibold">TITLE</th>
                    <th className="p-4 text-left font-semibold">STATUS</th>
                    <th className="p-4 text-left font-semibold">RELATED TO</th>
                    <th className="p-4 text-left font-semibold">OWNER</th>
                    <th className="p-4 text-left font-semibold">DUE DATE & TIME</th>
                    <th className="p-4 text-left font-semibold">TASK TYPE</th>
                    <th className="p-4 text-left font-semibold">PRIORITY</th>
                    <th className="p-4 text-left font-semibold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-500">
                        No tasks found. Create your first task to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task: any) => (
                      <tr 
                        key={task.id} 
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                        data-testid={`row-task-${task.id}`}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={bulkSelection.has(task.id)}
                            onChange={() => toggleBulkSelection(task.id)}
                          />
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{task.title}</div>
                            {task.candidateName && (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {task.candidateName}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {task.relatedTo || 'Not available'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{task.owner}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {new Date(task.dueDateTime).toLocaleString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getTaskTypeIcon(task.taskType)}
                            <span className="text-sm capitalize">
                              {task.taskType.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {(task.taskType === 'meeting' || task.taskType === 'interview') && !task.emailSent && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendEmail(task.id, 'meeting_invite')}
                                disabled={sendEmailMutation.isPending}
                                data-testid={`button-send-invite-${task.id}`}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            )}
                            {task.meetingLink && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(task.meetingLink, '_blank')}
                                data-testid={`button-join-meeting-${task.id}`}
                              >
                                <Link2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTask(task);
                                setFormData({
                                  title: task.title,
                                  description: task.description || "",
                                  taskType: task.taskType,
                                  priority: task.priority,
                                  dueDateTime: task.dueDateTime,
                                  candidateEmail: task.candidateEmail || "",
                                  candidateName: task.candidateName || "",
                                  jobTitle: task.jobTitle || "",
                                  meetingLink: task.meetingLink || "",
                                  calendlyLink: task.calendlyLink || "",
                                  relatedTo: task.relatedTo || "",
                                  relatedId: task.relatedId?.toString() || ""
                                });
                                setShowEditDialog(true);
                              }}
                              data-testid={`button-edit-${task.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Create Task Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Create a new task, meeting, or interview invitation
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Task Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Confirm Interview Time"
                    data-testid="input-task-title"
                    className={!formData.title?.trim() ? "border-red-300" : ""}
                  />
                  {!formData.title?.trim() && (
                    <p className="text-sm text-red-600 mt-1">Title is required</p>
                  )}
                </div>
                <div>
                  <Label>Task Type</Label>
                  <Select
                    value={formData.taskType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, taskType: value }))}
                  >
                    <SelectTrigger data-testid="select-task-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="document_review">Document Review</SelectItem>
                      <SelectItem value="background_check">Background Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details about the task..."
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
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
                <div>
                  <Label>Due Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.dueDateTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDateTime: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)} // Prevent past dates
                    data-testid="input-due-datetime"
                    className={!formData.dueDateTime ? "border-red-300" : ""}
                  />
                  {!formData.dueDateTime && (
                    <p className="text-sm text-red-600 mt-1">Due date is required</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Candidate Name</Label>
                  <Input
                    value={formData.candidateName}
                    onChange={(e) => setFormData(prev => ({ ...prev, candidateName: e.target.value }))}
                    placeholder="John Doe"
                    data-testid="input-candidate-name"
                  />
                </div>
                <div>
                  <Label>Candidate Email</Label>
                  <Input
                    type="email"
                    value={formData.candidateEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, candidateEmail: e.target.value }))}
                    placeholder="john@example.com"
                    data-testid="input-candidate-email"
                    className={formData.candidateEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.candidateEmail) ? "border-red-300" : ""}
                  />
                  {formData.candidateEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.candidateEmail) && (
                    <p className="text-sm text-red-600 mt-1">Please enter a valid email address</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Job Title</Label>
                <Input
                  value={formData.jobTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                  placeholder="Senior Software Engineer"
                  data-testid="input-job-title"
                />
              </div>

              {(formData.taskType === 'meeting' || formData.taskType === 'interview') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Meeting Link (Zoom, Teams, etc.)</Label>
                    <Input
                      type="url"
                      value={formData.meetingLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                      placeholder="https://zoom.us/j/123456789"
                      data-testid="input-meeting-link"
                    />
                  </div>
                  <div>
                    <Label>Calendly Link (Optional)</Label>
                    <Input
                      type="url"
                      value={formData.calendlyLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, calendlyLink: e.target.value }))}
                      placeholder="https://calendly.com/yourname/meeting"
                      data-testid="input-calendly-link"
                    />
                  </div>
                </div>
              )}

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
                  disabled={createTaskMutation.isPending || !formData.title?.trim() || !formData.dueDateTime}
                  data-testid="button-submit-create"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {createTaskMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating Task...
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

        {/* Edit Task Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update task details and settings
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Task Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Confirm Interview Time"
                    data-testid="input-edit-task-title"
                  />
                </div>
                <div>
                  <Label>Task Type</Label>
                  <Select
                    value={formData.taskType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, taskType: value }))}
                  >
                    <SelectTrigger data-testid="select-edit-task-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="document_review">Document Review</SelectItem>
                      <SelectItem value="background_check">Background Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details about the task..."
                  rows={3}
                  data-testid="textarea-edit-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger data-testid="select-edit-priority">
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
                <div>
                  <Label>Due Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.dueDateTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDateTime: e.target.value }))}
                    data-testid="input-edit-due-datetime"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Candidate Name</Label>
                  <Input
                    value={formData.candidateName}
                    onChange={(e) => setFormData(prev => ({ ...prev, candidateName: e.target.value }))}
                    placeholder="John Doe"
                    data-testid="input-edit-candidate-name"
                  />
                </div>
                <div>
                  <Label>Candidate Email</Label>
                  <Input
                    type="email"
                    value={formData.candidateEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, candidateEmail: e.target.value }))}
                    placeholder="john@example.com"
                    data-testid="input-edit-candidate-email"
                  />
                </div>
              </div>

              <div>
                <Label>Job Title</Label>
                <Input
                  value={formData.jobTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                  placeholder="Senior Software Engineer"
                  data-testid="input-edit-job-title"
                />
              </div>

              {(formData.taskType === 'meeting' || formData.taskType === 'interview') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Meeting Link (Zoom, Teams, etc.)</Label>
                    <Input
                      type="url"
                      value={formData.meetingLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                      placeholder="https://zoom.us/j/123456789"
                      data-testid="input-edit-meeting-link"
                    />
                  </div>
                  <div>
                    <Label>Calendly Link (Optional)</Label>
                    <Input
                      type="url"
                      value={formData.calendlyLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, calendlyLink: e.target.value }))}
                      placeholder="https://calendly.com/yourname/meeting"
                      data-testid="input-edit-calendly-link"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setSelectedTask(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditTask}
                  disabled={updateTaskMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateTaskMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Task
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