import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building, MapPin, MoreHorizontal, ExternalLink, Edit, Trash2, Zap, Globe, Users, Calendar, Bell, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  status: string;
  matchScore?: number;
  appliedDate: string;
  jobType?: string;
  workMode?: string;
  salaryRange?: string;
  jobUrl?: string;
  source?: 'internal' | 'extension';
  jobPostingId?: number;
  notes?: string; // Added for extension notes
  appliedAt?: string; // Added for extension applied date
}

interface ApplicationsTableProps {
  applications: Application[];
  isLoading: boolean;
  showActions?: boolean;
  onEdit?: (application: Application) => void;
  onDelete?: (application: Application) => void;
}

export function ApplicationsTable({ applications, isLoading, showActions = false, onEdit, onDelete }: ApplicationsTableProps) {
  const { toast } = useToast();

  const createFollowUpTask = async (application: Application) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: `Follow up on ${application.jobTitle} at ${application.company}`,
          description: `Send a follow-up email to check on application status for ${application.jobTitle} position.`,
          taskType: 'followup',
          priority: 'medium',
          category: 'job_application',
          dueDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          relatedUrl: application.jobUrl,
          companyName: application.company,
          notes: `Applied on ${new Date(application.appliedDate).toLocaleDateString()}`
        })
      });

      if (response.ok) {
        toast({
          title: "✅ Follow-up task created",
          description: "Task has been added to your task list",
        });
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error) {
      toast({
        title: "❌ Failed to create task",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const markAsInterviewed = async (application: Application) => {
    try {
      if (onEdit) {
        onEdit({ ...application, status: 'interview' });
      }
      toast({
        title: "✅ Status updated",
        description: "Application marked as interview stage",
      });
    } catch (error) {
      toast({
        title: "❌ Update failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="ml-auto">
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-foreground mb-2">No applications yet</h3>
        <p className="text-muted-foreground">Start applying to jobs to see them here.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      applied: { label: "Applied", className: "status-applied" },
      under_review: { label: "Under Review", className: "status-under-review" },
      interview: { label: "Interview", className: "status-interview" },
      offer: { label: "Offer", className: "status-offer" },
      rejected: { label: "Rejected", className: "status-rejected" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      className: "bg-secondary text-secondary-foreground" 
    };

    return (
      <Badge className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", config.className)}>
        {config.label}
      </Badge>
    );
  };

  const getMatchScoreColor = (score?: number) => {
    if (!score) return "bg-muted";
    if (score >= 90) return "bg-green-500";
    if (score >= 75) return "bg-blue-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const getSourceBadge = (source?: 'internal' | 'extension') => {
    if (source === 'internal') {
      return (
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
          <Zap className="w-3 h-3 mr-1" />
          Platform
        </Badge>
      );
    }
    if (source === 'extension') {
      return (
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
          <Globe className="w-3 h-3 mr-1" />
          Extension
        </Badge>
      );
    }
    return null;
  };

  return (
    <>
      {/* Mobile Card Layout - Apple-level UI */}
      <div className="block md:hidden space-y-3">
        {applications.map((application) => (
          <div key={application.id} className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-base leading-tight">{application.jobTitle}</h3>
                <div className="flex items-center text-muted-foreground text-sm mt-1.5">
                  <Building className="w-3.5 h-3.5 mr-1.5" />
                  <span className="font-medium">{application.company}</span>
                </div>
                {application.location && (
                  <div className="flex items-center text-muted-foreground text-xs mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>{application.location}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getSourceBadge(application.source)}
              </div>
            </div>

            {/* Streamlined status and quick actions */}
            <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</span>
                          <Badge className={getStatusColor(application.status)}>
                            {getStatusIcon(application.status)}
                            <span className="ml-1 capitalize">{application.status?.replace('_', ' ')}</span>
                          </Badge>
                        </div>

                        {application.location && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Location</span>
                            <span className="text-sm font-medium">{application.location}</span>
                          </div>
                        )}

                        {application.jobType && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Job Type</span>
                            <span className="text-sm font-medium">{application.jobType}</span>
                          </div>
                        )}

                        {application.workMode && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Work Mode</span>
                            <span className="text-sm font-medium">{application.workMode}</span>
                          </div>
                        )}

                        {application.matchScore && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Match</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                                  style={{ width: `${application.matchScore}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-green-600">{application.matchScore}%</span>
                            </div>
                          </div>
                        )}

                        {application.jobUrl && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Job Link</span>
                            <a 
                              href={application.jobUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        {application.notes && (
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Notes:</span>
                            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">{application.notes}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(application.appliedDate || application.appliedAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded-full">
                            {Math.floor((Date.now() - new Date(application.appliedDate || application.appliedAt).getTime()) / (1000 * 60 * 60 * 24))}d ago
                          </span>
                        </div>

                        {/* Quick Actions - Competitor differentiator */}
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-8"
                            onClick={() => createFollowUpTask(application)}
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            Follow Up
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-8"
                            onClick={() => markAsInterviewed(application)}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Interview
                          </Button>
                          {application.jobUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              asChild
                            >
                              <a href={application.jobUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </Button>
                          )}
                        </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Company
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Position
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Match
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Status
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Source
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Applied
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Job Type
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Work Mode
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                Salary
              </th>
              {showActions && (
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-6">
                  Actions
                </th>
              )}
            </tr>
          </thead>
        <tbody className="divide-y divide-border">
          {applications.map((application) => {
            const daysSinceApplied = Math.floor((Date.now() - new Date(application.appliedDate || application.appliedAt).getTime()) / (1000 * 60 * 60 * 24));
            const needsFollowUp = daysSinceApplied >= 7 && daysSinceApplied <= 14 && application.status === 'applied';
            
            return (
              <tr key={application.id} className="hover:bg-muted/50 transition-colors">
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                      <Building className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {application.company}
                      </div>
                      {application.location && (
                        <div className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {application.location}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="text-sm font-medium text-foreground">
                    {application.jobTitle}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {application.jobType && `${application.jobType} • `}
                    {application.workMode}
                  </div>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  {application.matchScore ? (
                    <div className="flex items-center">
                      <div className="w-16 bg-muted rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${getMatchScoreColor(application.matchScore)}`}
                          style={{ width: `${application.matchScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {application.matchScore}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="space-y-1">
                    {getStatusBadge(application.status)}
                    {needsFollowUp && (
                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                        Follow-up Due
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  {getSourceBadge(application.source)}
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-sm text-muted-foreground">
                  <div>{formatDistanceToNow(new Date(application.appliedDate || application.appliedAt), { addSuffix: true })}</div>
                  <div className="text-xs text-muted-foreground">{daysSinceApplied} days ago</div>
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-sm text-foreground">
                  {application.jobType || "-"}
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-sm text-foreground">
                  {application.workMode || "-"}
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-sm text-foreground">
                  {application.salaryRange || "-"}
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {/* Smart action based on days since application */}
                    {needsFollowUp ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 text-xs font-medium"
                        onClick={() => createFollowUpTask(application)}
                      >
                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                        Create Follow-up
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8 text-xs font-medium"
                        onClick={() => markAsInterviewed(application)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        Mark Interview
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {application.jobUrl && (
                          <DropdownMenuItem asChild>
                            <a href={application.jobUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open Job Posting
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => createFollowUpTask(application)}>
                          <Calendar className="w-4 h-4 mr-2" />
                          Add Follow-up Task
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(application)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Update Status
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          window.open(`/interview-prep-tools?job=${encodeURIComponent(application.jobTitle)}&company=${encodeURIComponent(application.company)}`, '_blank');
                        }}>
                          <Users className="w-4 h-4 mr-2" />
                          Interview Prep
                        </DropdownMenuItem>
                        {showActions && (
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => onDelete?.(application)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </>
  );
}

// Helper functions for mobile view (if not already defined elsewhere)
function getStatusColor(status: string): string {
  switch (status) {
    case "applied": return "bg-blue-100 text-blue-800 border-blue-300";
    case "under_review": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "interview": return "bg-purple-100 text-purple-800 border-purple-300";
    case "offer": return "bg-green-100 text-green-800 border-green-300";
    case "rejected": return "bg-red-100 text-red-800 border-red-300";
    default: return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

function getStatusIcon(status: string) {
  // You can replace these with actual icons if needed
  switch (status) {
    case "applied": return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6a2 2 0 0 0-2 2z"/><path d="M13.5 3.5l-5.5 5.5 5.5 5.5 5.5-5.5-5.5-5.5z"/></svg>;
    case "under_review": return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M9 18l3 3 3-3M9 3l3-3 3 3"/></svg>;
    case "interview": return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-6 8-10V5l-8-3-8 3v7c0 4 8 10 8 10z"/><path d="m9 10 3 3 3-3"/></svg>;
    case "offer": return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L4 7l8 5 8-5-8-5z"/><path d="M6 12l-4 4m0 0l4 4m-4-4h16M4 16l4-4m-4 0l4-4"/></svg>;
    case "rejected": return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
    default: return null;
  }
}