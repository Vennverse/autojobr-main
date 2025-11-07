import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Briefcase, UserCircle, ArrowRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function RoleSwitcher() {
  const { user } = useAuth() as { user: any };
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const switchRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      return await apiRequest("/api/user/switch-role", "POST", { role: newRole });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Role switched successfully",
        description: `Switched to ${data.currentRole === 'recruiter' ? 'Recruiter' : 'Job Seeker'} dashboard`,
      });

      if (data.currentRole === 'recruiter') {
        setLocation('/recruiter-dashboard');
      } else {
        setLocation('/dashboard');
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    onError: (error: any) => {
      // Handle verification required error
      if (error.error === 'VERIFICATION_REQUIRED' || error.requiresVerification) {
        toast({
          title: "Company Email Verification Required",
          description: "You need to verify your company email before accessing recruiter features.",
        });
        
        // Redirect to post-job page where verification form is shown
        setTimeout(() => {
          setLocation('/post-job');
        }, 1000);
      } else {
        toast({
          title: "Failed to switch role",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    },
  });

  if (!user) return null;

  const isRecruiter = user.currentRole === 'recruiter';

  const handleToggle = () => {
    const newRole = isRecruiter ? 'job_seeker' : 'recruiter';
    switchRoleMutation.mutate(newRole);
  };

  return (
    <div className="p-4 border-t dark:border-gray-800">
      <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-700">
        <div className="flex items-center gap-2 flex-1">
          {isRecruiter ? (
            <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <UserCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          )}
          <div className="flex flex-col">
            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {isRecruiter ? 'Recruiter Mode' : 'Job Seeker Mode'}
            </Label>
          </div>
        </div>
        <Button
          onClick={handleToggle}
          disabled={switchRoleMutation.isPending}
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1 bg-white dark:bg-gray-800"
          data-testid="button-switch-role"
        >
          <span>Switch to {isRecruiter ? 'Job Seeker' : 'Recruiter'}</span>
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
