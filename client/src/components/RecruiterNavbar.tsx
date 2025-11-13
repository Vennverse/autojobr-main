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
  MessageCircle,
  Mail,
  Calendar,
  CheckSquare,
  ClipboardList,
  UserPlus,
  DollarSign,
  Award,
  Sparkles,
  BriefcaseBusiness,
  Network
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

  // Get unread message count for notifications - sync with chat page updates
  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ['/api/simple-chat/conversations'],
    enabled: !!user?.id,
    staleTime: 0, // Always fresh - will update when cache is invalidated by chat page
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: false, // Use cached data on mount
  });

  const unreadCount = conversations.reduce((total: number, conv: any) => {
    return total + (conv.unreadCount || 0);
  }, 0);

  // Logout mutation - CRITICAL SECURITY FIX
  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('🚪 [RECRUITER] Starting logout...');

      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      console.log('✅ [RECRUITER] Logout successful, clearing all state...');

      // CRITICAL: Clear ALL cached data
      queryClient.clear();

      // CRITICAL: Clear all browser storage
      sessionStorage.clear();

      // Clear local storage but preserve theme
      const theme = localStorage.getItem('theme');
      localStorage.clear();
      if (theme) localStorage.setItem('theme', theme);

      console.log('✅ [RECRUITER] All state cleared, redirecting...');

      // CRITICAL: Use replace to prevent back button issues and ensure clean redirect
      // Redirect to auth page to ensure user sees login screen
      window.location.replace('/auth');
    },
    onError: (error: any) => {
      console.error('❌ [RECRUITER] Logout error:', error);

      // Even on error, clear everything for security
      queryClient.clear();
      sessionStorage.clear();

      const theme = localStorage.getItem('theme');
      localStorage.clear();
      if (theme) localStorage.setItem('theme', theme);

      toast({
        title: "Logout failed",
        description: error.message || "Failed to logout properly",
        variant: "destructive",
      });

      // Force redirect to auth page anyway for security
      window.location.replace('/auth');
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
      icon: Home,
      current: location === "/recruiter/dashboard" || location === "/" || location === "/dashboard"
    },
    {
      name: "🚀 ATS Platform",
      href: "/unified-ats",
      icon: Zap,
      current: location === "/unified-ats" || location === "/ats-platform" || location === "/recruiter/ats",
      highlight: true
    },
    {
      name: "Applicants",
      href: "/recruiter/applicants",
      icon: Users,
      current: location === "/recruiter/applicants"
    },
    {
      name: "Pipeline",
      href: "/recruiter/enhanced-pipeline",
      icon: GitBranch,
      current: location === "/recruiter/enhanced-pipeline" || location === "/recruiter/pipeline"
    },
    {
      name: "CRM",
      href: "/enhanced-crm",
      icon: Building,
      current: location === "/enhanced-crm" || location.startsWith("/enhanced-crm") || location === "/crm"
    },
    {
      name: "Analytics",
      href: "/advanced-analytics-dashboard",
      icon: TrendingUp,
      current: location === "/advanced-analytics-dashboard"
    },
    // Removed Messages link
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
              <div className="hidden md:ml-6 md:flex md:space-x-1 md:flex-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const canAccess = canAccessFeature(item.premium || false);

                  return (
                    <Link
                      key={item.name}
                      href={canAccess ? item.href : "/recruiter/premium"}
                      className={`${
                        item.current
                          ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 border-blue-500"
                          : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent"
                      } inline-flex items-center px-4 py-2 border-b-2 text-xs font-medium transition-all duration-200 rounded-t-lg ${
                        !canAccess ? "opacity-50" : ""
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                      {item.badge && (
                        <Badge className="ml-2 bg-red-500 text-white text-xs px-2 py-1 min-w-[1.25rem] h-5 rounded-full">
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
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-3">

              {/* More Tools Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Sparkles className="w-4 h-4 mr-2" />
                    More Tools
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72" align="end">
                  <DropdownMenuLabel className="font-semibold">📋 Hiring & Interviews</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/recruiter/post-job" className="w-full flex items-center cursor-pointer">
                      <Briefcase className="mr-2 h-4 w-4" />
                      <span>Post New Job</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/recruiter/interview-assignments" className="w-full flex items-center cursor-pointer">
                      <Video className="mr-2 h-4 w-4" />
                      <span>Interview Assignments</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/collaborative-hiring-scorecard" className="w-full flex items-center cursor-pointer">
                      <CheckSquare className="mr-2 h-4 w-4" />
                      <span>Scorecards</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/recruiter/test-management" className="w-full flex items-center cursor-pointer">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      <span>Test Management</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="font-semibold">🎯 Sourcing & Targeting</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/premium-targeting" className="w-full flex items-center cursor-pointer">
                      <Target className="mr-2 h-4 w-4" />
                      <span>Premium Targeting</span>
                      <Crown className="w-3 h-3 ml-auto text-amber-500" />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/referral-marketplace" className="w-full flex items-center cursor-pointer">
                      <UserPlus className="mr-2 h-4 w-4" />
                      <span>Referral Marketplace</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bidder-dashboard" className="w-full flex items-center cursor-pointer">
                      <DollarSign className="mr-2 h-4 w-4" />
                      <span>Bidder System</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="font-semibold">⚙️ Management Tools</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/recruiter/tasks" className="w-full flex items-center cursor-pointer">
                      <ClipboardList className="mr-2 h-4 w-4" />
                      <span>Task Management</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/recruiter/background-checks" className="w-full flex items-center cursor-pointer">
                      <Award className="mr-2 h-4 w-4" />
                      <span>Background Checks</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/sso-configuration" className="w-full flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>SSO Configuration</span>
                    </Link>
                  </DropdownMenuItem>
                  {/* Integration Marketplace */}
                  <DropdownMenuItem asChild>
                    <Link href="/integration-marketplace" className="w-full flex items-center cursor-pointer">
                      <Network className="mr-2 h-4 w-4" />
                      <span>Integration Marketplace</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Upgrade Button for Free Users */}
              {user?.planType === 'free' && (
                <Link href="/recruiter/premium">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm">
                    <Crown className="w-4 h-4 mr-1" />
                    Upgrade to Premium
                  </Button>
                </Link>
              )}

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-auto px-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8 ring-2 ring-gray-200 dark:ring-gray-600">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.firstName + ' ' + user?.lastName)}&backgroundColor=3b82f6,8b5cf6,ec4899,10b981,f59e0b`} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left hidden xl:block">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <div className="flex items-center gap-1">
                          {getPlanBadge(user?.planType || 'free')}
                        </div>
                      </div>
                      <ChevronDown className="h-3 w-3 text-gray-400 hidden lg:block" />
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
            <div className="md:hidden flex items-center space-x-2">
              {/* Removed Bell icon related to Messages */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const canAccess = canAccessFeature(item.premium || false);

                return (
                  <Link
                    key={item.name}
                    href={canAccess ? item.href : "/recruiter/premium"}
                    className={`${
                      item.current
                        ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    } group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                      !canAccess ? "opacity-50" : ""
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <Badge className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge > 9 ? '9+' : item.badge}
                      </Badge>
                    )}
                    {item.premium && !canAccess && (
                      <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}

              {/* Mobile User Info */}
              <div className="mt-6 px-3 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.firstName + ' ' + user?.lastName)}&backgroundColor=3b82f6,8b5cf6,ec4899,10b981,f59e0b`} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.companyName}
                    </p>
                  </div>
                  {user && getPlanBadge(user.planType)}
                </div>
                {user?.planType === 'free' && (
                  <Link href="/recruiter/premium">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      <Crown className="w-4 h-4 mr-2" />
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