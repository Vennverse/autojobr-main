import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Building,
  Users,
  Briefcase,
  FileText,
  Target,
  BarChart3,
  Settings,
  Crown,
  Menu,
  X,
  Zap,
  Star,
  Bell,
  GitBranch,
  Video,
  LogOut,
  User,
  ChevronDown,
  Home,
  TrendingUp,
  MessageCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  planType: string;
  subscriptionStatus: string;
}

interface RecruiterNavbarProps {
  user?: User;
}

export function RecruiterNavbar({ user }: RecruiterNavbarProps) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get unread message count for notifications (load once per session)
  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ['/api/chat/conversations'],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    // No automatic refresh - updates when user navigates or manually refreshes
  });

  const unreadCount = conversations.reduce((total: number, conv: any) => {
    return total + (conv.unreadCount || 0);
  }, 0);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session-based auth
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Show success message
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      // Redirect to auth page
      setLocation('/auth');
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "Failed to logout properly",
        variant: "destructive",
      });
    }
  });

  const getPlanBadge = (planType: string) => {
    switch (planType) {
      case 'premium':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Crown className="w-3 h-3 mr-1" />Premium</Badge>;
      case 'enterprise':
        return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"><Star className="w-3 h-3 mr-1" />Enterprise</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/recruiter/dashboard",
      icon: BarChart3,
      current: location === "/recruiter/dashboard"
    },
    {
      name: "Job Postings",
      href: "/recruiter/jobs",
      icon: Briefcase,
      current: location === "/recruiter/jobs"
    },

    {
      name: "Pipeline",
      href: "/recruiter/pipeline",
      icon: GitBranch,
      current: location === "/recruiter/pipeline"
    },
    {
      name: "Messages",
      href: "/chat",
      icon: MessageCircle,
      current: location === "/chat",
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      name: "Interview Assignments",
      href: "/recruiter/interview-assignments",
      icon: Video,
      current: location === "/recruiter/interview-assignments"
    },
    {
      name: "Test Center",
      href: "/recruiter/tests",
      icon: FileText,
      current: location === "/recruiter/tests"
    },
    {
      name: "Premium Targeting",
      href: "/premium-targeting",
      icon: Target,
      current: location === "/premium-targeting",
      premium: true
    },
    {
      name: "Analytics",
      href: "/recruiter/analytics",
      icon: BarChart3,
      current: location === "/recruiter/analytics",
      premium: true
    }
  ];

  const canAccessFeature = (isPremium: boolean) => {
    if (!isPremium) return true;
    return user?.planType === 'premium' || user?.planType === 'enterprise';
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/recruiter/dashboard">
                  <div className="flex items-center space-x-2 cursor-pointer">
                    <Building className="h-8 w-8 text-blue-600" />
                    <span className="font-bold text-xl text-gray-900 dark:text-white">AutoJobr</span>
                  </div>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const canAccess = canAccessFeature(item.premium || false);
                  
                  return (
                    <Link
                      key={item.name}
                      href={canAccess ? item.href : "/recruiter/premium"}
                      className={`${
                        item.current
                          ? "border-blue-500 text-gray-900 dark:text-white"
                          : "border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                        !canAccess ? "opacity-50" : ""
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                      {item.badge && (
                        <Badge className="ml-2 bg-red-500 text-white text-xs px-1 py-0 min-w-[1rem] h-5">
                          {item.badge > 9 ? '9+' : item.badge}
                        </Badge>
                      )}
                      {item.premium && !canAccess && (
                        <Crown className="w-3 h-3 ml-1 text-amber-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              {/* Notifications */}
              <Link href="/messaging">
                <button className="relative p-1 text-gray-400 hover:text-gray-500 focus:outline-none">
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </Link>
              
              {/* Upgrade Button for Free Users */}
              {user?.planType === 'free' && (
                <Link href="/recruiter/premium">
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade
                  </Button>
                </Link>
              )}
              
              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-auto px-3 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${user?.firstName} ${user?.lastName}`} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left hidden lg:block">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.companyName}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <div className="pt-1">
                        {getPlanBadge(user?.planType || 'free')}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/recruiter/profile" className="w-full flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/recruiter/billing" className="w-full flex items-center">
                      <Crown className="mr-2 h-4 w-4" />
                      <span>Billing & Plans</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/recruiter/settings" className="w-full flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Account Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{logoutMutation.isPending ? 'Logging out...' : 'Logout'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const canAccess = canAccessFeature(item.premium || false);
                
                return (
                  <Link
                    key={item.name}
                    href={canAccess ? item.href : "/recruiter/premium"}
                    className={`${
                      item.current
                        ? "bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-200"
                        : "border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                      !canAccess ? "opacity-50" : ""
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Icon className="w-4 h-4 mr-3" />
                      {item.name}
                      {item.premium && !canAccess && (
                        <Crown className="w-3 h-3 ml-2 text-amber-500" />
                      )}
                    </div>
                  </Link>
                );
              })}
              
              {/* Mobile Plan Info */}
              <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Current Plan:</span>
                  {user && getPlanBadge(user.planType)}
                </div>
                {user?.planType === 'free' && (
                  <Link href="/recruiter/premium">
                    <Button className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                      <Zap className="w-4 h-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}