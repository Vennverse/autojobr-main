import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Search,
  Bookmark,
  TrendingUp,
  BarChart3,
  FileText,
  Clock,
  Calendar,
  Target,
  Video,
  Users,
  MessageCircle,
  Code,
  Trophy,
  Brain,
  Settings,
  Upload,
  Edit,
  Zap,
  Star,
  Handshake,
  UserPlus,
  Building,
  Crown,
  Chrome,
  Shield,
  Briefcase,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  Download,
  Share,
  Filter,
  Globe,
  Link as LinkIcon,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Layers,
  Rocket,
  Sparkles,
  Headphones,
  BookOpen,
  GraduationCap,
  Award,
  TrendingDown,
  PieChart,
  LineChart,
  Activity,
  UserCheck,
  Users2,
  Building2,
  Megaphone,
  Bell,
  Archive,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Database,
  Server,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  Globe2,
  Cloud,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Router,
  Signal,
  Bluetooth,
  Usb,
  Printer,
  ScanLine,
  QrCode,
  Barcode,
  CreditCard,
  Wallet,
  Receipt,
  ShoppingCart,
  Package,
  Truck,
  Plane,
  Car,
  Bus,
  Train,
  Ship,
  Bike,
  Home,
  MapPin as LocationIcon,
  Navigation,
  Compass,
  Map,
  Route,
  Milestone,
  Flag,
  Anchor,
  Lightbulb,
  FlashZap,
  Thunder,
  Flame,
  Sun,
  Moon,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  Umbrella,
  Rainbow,
  Heart
} from "lucide-react";

export function ContextualSidebar() {
  const [location] = useLocation();
  const { user } = useAuth() as { user: any };

  if (!user) return null;

  // Define sidebar content based on current route
  const getSidebarContent = () => {
    // Jobs Section
    if (location === "/jobs" || location.startsWith("/job")) {
      return {
        title: "Jobs",
        groups: [
          {
            label: "Job Discovery",
            items: [
              { name: "Search Jobs", href: "/jobs", icon: Search, current: location === "/jobs" },
              { name: "Job Discovery", href: "/job-discovery", icon: Globe, current: location === "/job-discovery" },
              { name: "Saved Jobs", href: "/jobs?filter=saved", icon: Bookmark, current: location.includes("saved") },
              { name: "Recommendations", href: "/jobs?filter=recommended", icon: TrendingUp, current: location.includes("recommended") },
              { name: "Remote Jobs", href: "/jobs?remote=true", icon: Wifi, current: location.includes("remote") },
              { name: "Urgent Hiring", href: "/jobs?urgent=true", icon: Clock, current: location.includes("urgent") },
            ]
          },
          {
            label: "Job Tools",
            items: [

              { name: "Salary Insights", href: "/salary-insights", icon: DollarSign, current: location === "/salary-insights" },
              { name: "Company Research", href: "/company-research", icon: Building2, current: location === "/company-research" },
              { name: "Job Alerts", href: "/job-alerts", icon: Bell, current: location === "/job-alerts" },
              { name: "Chrome Extension", href: "/chrome-extension", icon: Chrome, current: location === "/chrome-extension" },
            ]
          },
          {
            label: "Application Tools",
            items: [
              { name: "Quick Apply", href: "/quick-apply", icon: Zap, current: location === "/quick-apply" },
              { name: "Auto Fill", href: "/auto-fill", icon: Edit, current: location === "/auto-fill" },
              { name: "ATS Optimizer", href: "/ats-optimizer", icon: Target, current: location === "/ats-optimizer" },
              { name: "Cover Letter AI", href: "/cover-letter-ai", icon: Brain, current: location === "/cover-letter-ai" },
            ]
          }
        ]
      };
    }

    // Internships Section
    if (location === "/internships" || location.startsWith("/internship")) {
      return {
        title: "Internships",
        groups: [
          {
            label: "Internship Discovery",
            items: [
              { name: "Search Internships", href: "/internships", icon: Search, current: location === "/internships" },
              { name: "Saved Internships", href: "/internships?filter=saved", icon: Bookmark, current: location.includes("saved") },
              { name: "Summer 2026", href: "/internships?season=summer", icon: Calendar, current: location.includes("summer") },
              { name: "Remote Internships", href: "/internships?remote=true", icon: Wifi, current: location.includes("remote") },
              { name: "Tech Companies", href: "/internships?category=tech", icon: Monitor, current: location.includes("tech") },
              { name: "Recent Postings", href: "/internships?recent=true", icon: Clock, current: location.includes("recent") },
            ]
          },
          {
            label: "Top Companies",
            items: [
              { name: "Apple Internships", href: "/internships?company=apple", icon: Building2, current: location.includes("apple") },
              { name: "Google Internships", href: "/internships?company=google", icon: Building2, current: location.includes("google") },
              { name: "Netflix Internships", href: "/internships?company=netflix", icon: Building2, current: location.includes("netflix") },
              { name: "OpenAI Internships", href: "/internships?company=openai", icon: Building2, current: location.includes("openai") },
              { name: "NVIDIA Internships", href: "/internships?company=nvidia", icon: Building2, current: location.includes("nvidia") },
            ]
          },
          {
            label: "Application Tools",
            items: [
              { name: "Quick Apply", href: "/quick-apply", icon: Zap, current: location === "/quick-apply" },
              { name: "Resume Optimizer", href: "/ats-optimizer", icon: Target, current: location === "/ats-optimizer" },
              { name: "Cover Letter AI", href: "/cover-letter-ai", icon: Brain, current: location === "/cover-letter-ai" },
              { name: "Application Tracker", href: "/applications", icon: FileText, current: location === "/applications" },
            ]
          }
        ]
      };
    }

    // Applications Section
    if (location === "/applications" || location.startsWith("/application")) {
      return {
        title: "Applications",
        groups: [
          {
            label: "Application Management",
            items: [
              { name: "All Applications", href: "/applications", icon: FileText, current: location === "/applications" },
              { name: "In Progress", href: "/applications?status=pending", icon: Clock, current: location.includes("pending") },
              { name: "Interviews Scheduled", href: "/applications?status=interview", icon: Calendar, current: location.includes("interview") },
              { name: "Offers Received", href: "/applications?status=offer", icon: Star, current: location.includes("offer") },
              { name: "Rejected", href: "/applications?status=rejected", icon: AlertCircle, current: location.includes("rejected") },
              { name: "Application Backup", href: "/applications-backup", icon: Archive, current: location === "/applications-backup" },
            ]
          },
          {
            label: "Analytics & Tracking",
            items: [
              { name: "Application Stats", href: "/applications/stats", icon: BarChart3, current: location.includes("stats") },
              { name: "Success Rate", href: "/application-success", icon: TrendingUp, current: location === "/application-success" },
              { name: "Response Timeline", href: "/response-timeline", icon: Clock, current: location === "/response-timeline" },
            ]
          },
          {
            label: "Templates & Tools",
            items: [
              { name: "Cover Letter Builder", href: "/cover-letter-builder", icon: Edit, current: location === "/cover-letter-builder" },
              { name: "Application Tracker", href: "/application-tracker", icon: Target, current: location === "/application-tracker" },
              { name: "Follow-up Templates", href: "/follow-up-templates", icon: Mail, current: location === "/follow-up-templates" },
              { name: "Thank You Notes", href: "/thank-you-notes", icon: Heart, current: location === "/thank-you-notes" },
            ]
          }
        ]
      };
    }

    // Interviews Section
    if (location === "/mock-interview" || location.startsWith("/virtual-interview") || location.startsWith("/mock-interview") || location === "/chat-interview") {
      return {
        title: "Interviews",
        groups: [
          {
            label: "AI Practice",
            items: [
              { name: "AI-powered Mock Interviews", href: "/virtual-interview/new", icon: Video, current: location === "/virtual-interview/new" || location.startsWith("/virtual-interview") },
              { name: "Mock Interview", href: "/mock-interview", icon: Users, current: location === "/mock-interview" },
              { name: "AI Chat Interview", href: "/chat-interview", icon: MessageCircle, current: location === "/chat-interview" },
              { name: "Technical Practice", href: "/mock-interview/technical", icon: Code, current: location.includes("/technical") },
              { name: "Behavioral Questions", href: "/mock-interview/behavioral", icon: Brain, current: location.includes("/behavioral") },
              { name: "Industry Specific", href: "/mock-interview/industry", icon: Building, current: location.includes("/industry") },
            ]
          },
          {
            label: "Live Sessions",
            items: [
              { name: "Start Live Interview", href: "/virtual-interview-start", icon: Users, current: location.startsWith("/virtual-interview") },
              { name: "Interview Assignments", href: "/interview-assignments", icon: Calendar, current: location === "/interview-assignments" },
              { name: "Video Interview", href: "/virtual-interview", icon: Video, current: location === "/virtual-interview" },
              { name: "Interview Complete", href: "/virtual-interview-complete", icon: CheckCircle, current: location === "/virtual-interview-complete" },
            ]
          },
          {
            label: "Performance & Feedback",
            items: [
              { name: "Interview History", href: "/interview-history", icon: Clock, current: location === "/interview-history" },
              { name: "Feedback Analysis", href: "/virtual-interview-feedback", icon: BarChart3, current: location === "/virtual-interview-feedback" },
              { name: "Performance Trends", href: "/interview-trends", icon: TrendingUp, current: location === "/interview-trends" },
              { name: "Improvement Tips", href: "/interview-tips", icon: Lightbulb, current: location === "/interview-tips" },
            ]
          }
        ]
      };
    }

    // Get Referred Section
    if (location === "/referral-marketplace" || location === "/become-referrer" || location === "/my-bookings" || location === "/employee-referral-services") {
      return {
        title: "Get Referred",
        groups: [
          {
            label: "Find Referrals",
            items: [
              { name: "Referral Marketplace", href: "/referral-marketplace", icon: Search, current: location === "/referral-marketplace" },
              { name: "Employee Referrals", href: "/employee-referral-services", icon: Users2, current: location === "/employee-referral-services" },
              { name: "My Bookings", href: "/my-bookings", icon: Calendar, current: location === "/my-bookings" },
              { name: "Request Referral", href: "/request-referral", icon: UserPlus, current: location === "/request-referral" },
              { name: "Referral Status", href: "/referral-status", icon: Eye, current: location === "/referral-status" },
            ]
          },
          {
            label: "Be a Referrer",
            items: [
              { name: "Become Referrer", href: "/become-referrer", icon: Handshake, current: location === "/become-referrer" },
              { name: "Refer Candidates", href: "/refer-candidates", icon: UserPlus, current: location === "/refer-candidates" },
              { name: "Company Network", href: "/company-network", icon: Building2, current: location === "/company-network" },
              { name: "Referral Earnings", href: "/referral-earnings", icon: DollarSign, current: location === "/referral-earnings" },
              { name: "Success Stories", href: "/referral-success", icon: Star, current: location === "/referral-success" },
            ]
          },
          {
            label: "Networking",
            items: [
              { name: "Professional Network", href: "/professional-network", icon: Users, current: location === "/professional-network" },
              { name: "Industry Connections", href: "/industry-connections", icon: Building, current: location === "/industry-connections" },
              { name: "Mentorship Program", href: "/mentorship", icon: GraduationCap, current: location === "/mentorship" },
              { name: "Career Events", href: "/career-events", icon: Calendar, current: location === "/career-events" },
            ]
          }
        ]
      };
    }

    // Profile Section
    if (location === "/profile" || location === "/resumes" || location.startsWith("/resume") || location === "/ranking-tests") {
      return {
        title: "Profile & Skills",
        groups: [
          {
            label: "Profile Management",
            items: [
              { name: "Profile Settings", href: "/profile", icon: Settings, current: location === "/profile" },
              { name: "Personal Info", href: "/profile/personal", icon: UserCheck, current: location === "/profile/personal" },
              { name: "Contact Details", href: "/profile/contact", icon: Phone, current: location === "/profile/contact" },
              { name: "Career Preferences", href: "/profile/preferences", icon: Target, current: location === "/profile/preferences" },
              { name: "Background Check", href: "/background-check-integration", icon: Shield, current: location === "/background-check-integration" },
            ]
          },
          {
            label: "Resume & Documents",
            items: [
              { name: "Resume Manager", href: "/resumes", icon: FileText, current: location === "/resumes" },
              { name: "Resume Builder", href: "/resume-builder", icon: Edit, current: location === "/resume-builder" },
              { name: "ATS Optimizer", href: "/ats-optimizer", icon: Zap, current: location === "/ats-optimizer" },
              { name: "Resume Analysis", href: "/resume-analysis", icon: BarChart3, current: location === "/resume-analysis" },
              { name: "Portfolio Upload", href: "/portfolio", icon: Upload, current: location === "/portfolio" },
              { name: "Cover Letters", href: "/cover-letters", icon: Mail, current: location === "/cover-letters" },
            ]
          },
          {
            label: "Skills & Assessment",
            items: [
              { name: "Ranking Tests", href: "/ranking-tests", icon: Trophy, current: location === "/ranking-tests" },
              { name: "Job Seeker Tests", href: "/job-seeker-tests", icon: GraduationCap, current: location === "/job-seeker-tests" },
              { name: "Test Assignments", href: "/test-assignments", icon: Code, current: location === "/test-assignments" },
              { name: "Skills Verification", href: "/skill-verification", icon: Award, current: location === "/skill-verification" },
              { name: "Certification Tracker", href: "/certifications", icon: Star, current: location === "/certifications" },
              { name: "Learning Path", href: "/learning-path", icon: BookOpen, current: location === "/learning-path" },
            ]
          },
          {
            label: "Performance Analytics",
            items: [
              { name: "Profile Score", href: "/profile-score", icon: Target, current: location === "/profile-score" },
              { name: "Test History", href: "/test-history", icon: Clock, current: location === "/test-history" },
              { name: "Skill Progress", href: "/skill-progress", icon: TrendingUp, current: location === "/skill-progress" },
            ]
          }
        ]
      };
    }

    // Premium Section
    if (location === "/job-seeker-premium" || location.startsWith("/premium") || location === "/subscription") {
      return {
        title: "Premium Features",
        groups: [
          {
            label: "Premium Dashboard",
            items: [
              { name: "Premium Overview", href: "/job-seeker-premium", icon: Crown, current: location === "/job-seeker-premium" },
              { name: "Subscription Manager", href: "/subscription", icon: CreditCard, current: location === "/subscription" },
              { name: "Billing History", href: "/billing-history", icon: Receipt, current: location === "/billing-history" },
              { name: "Usage Analytics", href: "/usage-analytics", icon: Activity, current: location === "/usage-analytics" },
            ]
          },
          {
            label: "Premium AI Tools",
            items: [
              { name: "Premium AI Tools Hub", href: "/premium-ai-tools", icon: Zap, current: location === "/premium-ai-tools" },
              { name: "AI Cover Letter Generator", href: "/premium-ai-tools?tab=cover-letter", icon: FileText, current: location.includes("tab=cover-letter") },
              { name: "Salary Negotiation Coach", href: "/premium-ai-tools?tab=salary", icon: DollarSign, current: location.includes("tab=salary") },
              { name: "Interview Answer Generator", href: "/premium-ai-tools?tab=interview", icon: MessageCircle, current: location.includes("tab=interview") },
              { name: "Career Path Planner", href: "/premium-ai-tools?tab=career", icon: TrendingUp, current: location.includes("tab=career") },
            ]
          },
          {
            label: "Premium Tools",
            items: [
              { name: "AI Career Coach", href: "/career-ai-assistant", icon: Brain, current: location === "/career-ai-assistant" },
              { name: "Premium Chat", href: "/premium-chat", icon: MessageCircle, current: location === "/premium-chat" },
              { name: "Priority Support", href: "/premium-support", icon: Headphones, current: location === "/premium-support" },
              { name: "Exclusive Jobs", href: "/premium-jobs", icon: Star, current: location === "/premium-jobs" },
              { name: "Premium Targeting", href: "/premium-targeting", icon: Target, current: location === "/premium-targeting" },
            ]
          },
          {
            label: "Advanced Features",
            items: [
              { name: "Enhanced Chat", href: "/enhanced-chat", icon: Sparkles, current: location === "/enhanced-chat" },
              { name: "Task Management", href: "/task-management", icon: CheckCircle, current: location === "/task-management" },
              { name: "Job Seeker Tasks", href: "/job-seeker-tasks", icon: Clock, current: location === "/job-seeker-tasks" },
              { name: "Custom Branding", href: "/custom-branding", icon: Megaphone, current: location === "/custom-branding" },
            ]
          }
        ]
      };
    }

    // Messages & Communication
    if (location === "/chat" || location === "/messaging" || location === "/simple-chat" || location.startsWith("/message")) {
      return {
        title: "Messages & Communication",
        groups: [
          {
            label: "Messaging",
            items: [
              { name: "Chat Dashboard", href: "/chat", icon: MessageCircle, current: location === "/chat" },
              { name: "Simple Chat", href: "/simple-chat", icon: Users, current: location === "/simple-chat" },
              { name: "Enhanced Chat", href: "/enhanced-chat", icon: Sparkles, current: location === "/enhanced-chat" },
              { name: "Premium Chat", href: "/premium-chat", icon: Crown, current: location === "/premium-chat" },
              { name: "Messaging Center", href: "/messaging", icon: Mail, current: location === "/messaging" },
            ]
          },
          {
            label: "Communication Tools",
            items: [
              { name: "AI Career Assistant", href: "/career-ai-assistant", icon: Brain, current: location === "/career-ai-assistant" },
              { name: "Video Calls", href: "/video-calls", icon: Video, current: location === "/video-calls" },
              { name: "Email Templates", href: "/email-templates", icon: Mail, current: location === "/email-templates" },
              { name: "Contact Manager", href: "/contact-manager", icon: Phone, current: location === "/contact-manager" },
            ]
          },
          {
            label: "Notifications",
            items: [
              { name: "Notification Center", href: "/notifications", icon: Bell, current: location === "/notifications" },
              { name: "Email Settings", href: "/email-settings", icon: Settings, current: location === "/email-settings" },
              { name: "Communication Preferences", href: "/communication-preferences", icon: Users, current: location === "/communication-preferences" },
            ]
          }
        ]
      };
    }

    // Tools & Extensions
    if (location === "/chrome-extension" || location === "/tools" || location.startsWith("/extension")) {
      return {
        title: "Tools & Extensions",
        groups: [
          {
            label: "Browser Extensions",
            items: [
              { name: "Chrome Extension", href: "/chrome-extension", icon: Chrome, current: location === "/chrome-extension" },
              { name: "Extension Setup", href: "/extension-setup", icon: Settings, current: location === "/extension-setup" },
              { name: "Auto-Fill Settings", href: "/auto-fill-settings", icon: Edit, current: location === "/auto-fill-settings" },
              { name: "Quick Apply", href: "/quick-apply", icon: Zap, current: location === "/quick-apply" },
            ]
          },
          {
            label: "Productivity Tools",
            items: [
              { name: "ATS Optimizer", href: "/ats-optimizer", icon: Target, current: location === "/ats-optimizer" },
              { name: "Resume Scanner", href: "/resume-scanner", icon: ScanLine, current: location === "/resume-scanner" },
              { name: "Job Matcher", href: "/job-matcher", icon: Filter, current: location === "/job-matcher" },
              { name: "Salary Calculator", href: "/salary-calculator", icon: DollarSign, current: location === "/salary-calculator" },
            ]
          },
          {
            label: "Integrations",
            items: [
              { name: "LinkedIn Integration", href: "/linkedin-integration", icon: Users, current: location === "/linkedin-integration" },
              { name: "GitHub Integration", href: "/github-integration", icon: Code, current: location === "/github-integration" },
              { name: "API Access", href: "/api-access", icon: Key, current: location === "/api-access" },
              { name: "SSO Configuration", href: "/sso-configuration", icon: Lock, current: location === "/sso-configuration" },
            ]
          }
        ]
      };
    }

    // For Recruiters Section
    if (location === "/post-job" || location.startsWith("/recruiter")) {
      return {
        title: "Recruiting Tools",
        groups: [
          {
            label: "Job Posting",
            items: [
              { name: "Post New Job", href: "/post-job", icon: PlusCircle, current: location === "/post-job" },
              { name: "Job Promotion", href: "/job-promotion-payment", icon: Megaphone, current: location === "/job-promotion-payment" },
              { name: "Premium Targeting", href: "/premium-targeting-payment", icon: Target, current: location === "/premium-targeting-payment" },

            ]
          },
          {
            label: "Candidate Management",
            items: [
              { name: "TouchBase CRM", href: "/enhanced-crm", icon: Users, current: location === "/enhanced-crm" || location.startsWith("/enhanced-crm") },
              { name: "Applicant Pipeline", href: "/pipeline-management", icon: Users, current: location === "/pipeline-management" },
              { name: "Enhanced Pipeline", href: "/enhanced-pipeline-management", icon: Layers, current: location === "/enhanced-pipeline-management" },
              { name: "Test Management", href: "/test-management", icon: Code, current: location === "/test-management" },
              { name: "Interview Assignments", href: "/interview-assignments", icon: Calendar, current: location === "/interview-assignments" },
            ]
          },
          {
            label: "Recruiter Premium",
            items: [
              { name: "Recruiter Premium", href: "/recruiter-premium", icon: Crown, current: location === "/recruiter-premium" },
              { name: "Recruiter Features", href: "/recruiter-features", icon: Star, current: location === "/recruiter-features" },
              { name: "Subscription Manager", href: "/recruiter-subscription", icon: CreditCard, current: location === "/recruiter-subscription" },
            ]
          }
        ]
      };
    }

    // Default Dashboard sidebar
    return {
      title: "Dashboard",
      groups: [
        {
          label: "Quick Actions",
          items: [
            { name: "Find Jobs", href: "/jobs", icon: Briefcase, current: false },
            { name: "Find Internships", href: "/internships", icon: Users, current: false },
            { name: "View Applications", href: "/applications", icon: FileText, current: false },
            { name: "Practice Interview", href: "/mock-interview", icon: Video, current: false },
            { name: "Get Referred", href: "/referral-marketplace", icon: Handshake, current: false },
            { name: "AI Career Coach", href: "/career-ai-assistant", icon: Brain, current: false },
            { name: "Chrome Extension", href: "/chrome-extension", icon: Chrome, current: false },
          ]
        },
        {
          label: "Your Progress",
          items: [
            { name: "Profile Score", href: "/profile", icon: Target, current: false },
            { name: "Skill Tests", href: "/ranking-tests", icon: Trophy, current: false },
            { name: "Resume Analysis", href: "/resumes", icon: FileText, current: false },
            { name: "Analytics", href: "/advanced-analytics-dashboard", icon: BarChart3, current: false },
          ]
        },
        {
          label: "Recent Activity",
          items: [
            { name: "Messages", href: "/chat", icon: MessageCircle, current: false },
            { name: "Notifications", href: "/notifications", icon: Bell, current: false },
            { name: "Task Management", href: "/task-management", icon: CheckCircle, current: false },
            { name: "Job Alerts", href: "/job-alerts", icon: AlertCircle, current: false },
          ]
        },
        {
          label: "Premium Features",
          items: [
            { name: "Upgrade to Premium", href: "/job-seeker-premium", icon: Crown, current: false },
            { name: "Premium Features", href: "/premium-features", icon: Star, current: false },
          ]
        }
      ]
    };
  };

  const sidebarContent = getSidebarContent();

  return (
    <Sidebar collapsible="offcanvas" className="border-r">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Target className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{sidebarContent.title}</span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
          <SidebarTrigger className="ml-auto" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sidebarContent.groups.map((group, index) => (
          <SidebarGroup key={index}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.current}
                        tooltip={item.name}
                      >
                        <Link href={item.href}>
                          <Icon className="size-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}