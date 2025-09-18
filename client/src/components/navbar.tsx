import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/profile-avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Rocket, 
  Moon, 
  Sun, 
  User, 
  Settings, 
  LogOut, 
  Home,
  Briefcase, 
  Crown, 
  Menu, 
  X, 
  MessageCircle, 
  Brain, 
  Trophy, 
  Code, 
  Bell, 
  Video,
  ChevronDown,
  FileText,
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  Users,
  Star,
  Handshake,
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const [location] = useLocation();
  const { user } = useAuth() as { user: any };
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get unread message count (load once per session)
  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ['/api/simple-chat/conversations'],
    enabled: !!user?.id,
    staleTime: 0, // Always fresh - will update when cache is invalidated by chat page
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: false, // Use cached data on mount
  });

  const totalUnreadCount = conversations.reduce((total: number, conv: any) => 
    total + (conv.unreadCount || 0), 0);

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
      window.location.href = '/auth';
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
        return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"><Zap className="w-3 h-3 mr-1" />Pro</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  // Define navigation items based on user type
  const getNavigationItems = () => {
    if (!user) {
      // For non-authenticated users
      return [
        {
          name: "For Recruiters",
          href: "/for-recruiters",
          icon: Target,
          current: location === "/for-recruiters"
        }
      ];
    } else if (user?.currentRole === 'recruiter' || user?.currentRole === 'company') {
      // Redirect recruiters to their dedicated navbar
      return [
        {
          name: "Dashboard", 
          href: "/recruiter/dashboard",
          icon: Home,
          current: location === "/recruiter/dashboard"
        }
      ];
    } else {
      // Job seeker navigation items - cleaned up as requested
      return [
        {
          name: "Dashboard",
          href: "/",
          icon: Home,
          current: location === "/"
        },
        {
          name: "Jobs",
          href: "/jobs",
          icon: Briefcase,
          current: location === "/jobs"
        },
        {
          name: "Internships",
          href: "/internships",
          icon: GraduationCap,
          current: location === "/internships"
        },
        {
          name: "Premium",
          href: "/job-seeker-premium",
          icon: Crown,
          current: location === "/job-seeker-premium",
          premium: true
        },
        {
          name: "AI Coach",
          href: "/career-ai-assistant",
          icon: Brain,
          current: location === "/career-ai-assistant" || location.startsWith("/career-analysis"),
          badge: "AI"
        },
        {
          name: "AI-powered Mock Interviews",
          href: "/virtual-interview/new",
          icon: Video,
          current: location === "/virtual-interview/new" || location.startsWith("/virtual-interview") || location.startsWith("/mock-interview"),
          badge: "New"
        },
        {
          name: "Get Referred",
          href: "/referral-marketplace",
          icon: Handshake,
          current: location === "/referral-marketplace" || location === "/become-referrer" || location === "/my-bookings",
          badge: "New"
        }
      ];
    }
  };

  const navigationItems = getNavigationItems();

  const canAccessFeature = (isPremium: boolean) => {
    if (!isPremium) return true;
    return user?.planType === 'premium' || user?.planType === 'enterprise';
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <Link href="/">
                  <div className="flex items-center space-x-2 cursor-pointer">
                    <Rocket className="h-8 w-8 text-blue-600" />
                    <span className="font-bold text-xl text-gray-900 dark:text-white">AutoJobr</span>
                  </div>
                </Link>
              </div>

              {/* Desktop Navigation */}
              {user && (
                <div className="hidden md:ml-4 md:flex md:space-x-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const canAccess = canAccessFeature(item.premium || false);
                    
                    return (
                      <Link
                        key={item.name}
                        href={canAccess ? item.href : "/job-seeker-premium"}
                        className={`${
                          item.current
                            ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 border-blue-500"
                            : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent"
                        } inline-flex items-center px-2.5 py-2 border-b-2 text-sm font-medium transition-all duration-200 rounded-t-lg relative ${
                          !canAccess ? "opacity-50" : ""
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                        <span className="whitespace-nowrap">{item.name}</span>
                        {item.badge && typeof item.badge === 'string' && (
                          <Badge className="ml-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                            {item.badge}
                          </Badge>
                        )}
                        {item.badge && typeof item.badge === 'number' && (
                          <Badge className="ml-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 rounded-full font-medium flex items-center justify-center">
                            {item.badge > 9 ? '9+' : item.badge}
                          </Badge>
                        )}
                        {item.premium && !canAccess && (
                          <Crown className="w-3 h-3 ml-1 text-amber-500 flex-shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right side */}
            <div className="hidden md:ml-4 md:flex md:items-center md:space-x-2">
              
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Login button for non-authenticated users */}
              {!user && (
                <Button 
                  onClick={() => window.location.href = "/auth"} 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm"
                >
                  Sign In
                </Button>
              )}

              {/* Upgrade Button for Free Users */}
              {user && user?.planType === 'free' && (
                <Link href="/job-seeker-premium">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm">
                    <Crown className="w-4 h-4 mr-1" />
                    Upgrade
                  </Button>
                </Link>
              )}
              
              {/* User Profile Dropdown */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 p-0 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full">
                      <Avatar className="h-8 w-8 ring-2 ring-gray-200 dark:ring-gray-600">
                        <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${user?.firstName} ${user?.lastName}`} />
                        <AvatarFallback className="bg-blue-600 text-white font-semibold">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
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
                      <Link href="/profile" className="w-full flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/applications" className="w-full flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>My Applications</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/resume" className="w-full flex items-center">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        <span>Resume & ATS Score</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-bookings" className="w-full flex items-center">
                        <Handshake className="mr-2 h-4 w-4" />
                        <span>My Bookings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/job-seeker-premium" className="w-full flex items-center">
                        <Crown className="mr-2 h-4 w-4" />
                        <span>Premium Features</span>
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
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              {user && totalUnreadCount > 0 && (
                <Link href="/chat">
                  <button className="relative p-2 text-gray-400 hover:text-gray-500">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                      {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                    </span>
                  </button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 z-[65] relative"
                data-testid="mobile-menu-button"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-[55] md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              data-testid="mobile-menu-backdrop"
            />
            <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 fixed top-16 left-0 right-0 z-[60] max-h-[calc(100vh-4rem)] overflow-y-auto shadow-xl"
                 data-testid="mobile-menu-dropdown">
            <div className="px-4 pt-4 pb-3 space-y-2">
              {user ? navigationItems.map((item) => {
                const Icon = item.icon;
                const canAccess = canAccessFeature(item.premium || false);
                
                return (
                  <Link
                    key={item.name}
                    href={canAccess ? item.href : "/job-seeker-premium"}
                    className={`${
                      item.current
                        ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    } group flex items-center px-4 py-3 text-base font-medium rounded-xl transition-colors ${
                      !canAccess ? "opacity-50" : ""
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && typeof item.badge === 'string' && (
                      <Badge className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </Badge>
                    )}
                    {item.badge && typeof item.badge === 'number' && (
                      <Badge className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge > 9 ? '9+' : item.badge}
                      </Badge>
                    )}
                    {item.premium && !canAccess && (
                      <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    )}
                  </Link>
                );
              }) : (
                <Link
                  href="/for-recruiters"
                  className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 group flex items-center px-3 py-3 text-base font-medium rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Target className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="flex-1">For Recruiters</span>
                </Link>
              )}
              
              {/* Mobile User Info */}
              {user && (
                <div className="mt-6 px-3 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${user?.firstName} ${user?.lastName}`} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getPlanBadge(user?.planType || 'free')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Link
                      href="/profile"
                      className="flex items-center px-2 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile Settings
                    </Link>
                    <Link
                      href="/job-seeker-premium"
                      className="flex items-center px-2 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Premium Features
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logoutMutation.mutate();
                      }}
                      disabled={logoutMutation.isPending}
                      className="flex items-center w-full px-2 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile login button for non-authenticated users */}
              {!user && (
                <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    onClick={() => window.location.href = "/auth"} 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </div>
          </div>
          </>
        )}
      </nav>
    </>
  );
}
