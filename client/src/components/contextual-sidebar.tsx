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

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
  current?: boolean;
  premium?: boolean;
  description?: string;
}

export function ContextualSidebar() {
  const [location] = useLocation();
  const { user } = useAuth() as { user: any };
  const isPremium = user?.isPremium;

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
              { name: "Search Jobs", href: "/jobs", icon: Search, current: location === "/jobs", description: "Find job openings based on your criteria" },
              { name: "Job Discovery", href: "/job-discovery", icon: Globe, current: location === "/job-discovery", description: "Discover new job opportunities and trends" },
              { name: "Saved Jobs", href: "/jobs?filter=saved", icon: Bookmark, current: location.includes("saved"), description: "View jobs you've saved for later" },
              { name: "Recommendations", href: "/jobs?filter=recommended", icon: TrendingUp, current: location.includes("recommended"), description: "See personalized job recommendations" },
              { name: "Remote Jobs", href: "/jobs?remote=true", icon: Wifi, current: location.includes("remote"), description: "Filter for remote job opportunities" },
              { name: "Urgent Hiring", href: "/jobs?urgent=true", icon: Clock, current: location.includes("urgent"), description: "Find jobs with immediate hiring needs" },
            ]
          },
          {
            label: "Job Tools",
            items: [

              { name: "Salary Insights", href: "/salary-insights", icon: DollarSign, current: location === "/salary-insights", description: "Get insights into salary ranges for different roles and locations" },
              { name: "Company Research", href: "/company-research", icon: Building2, current: location === "/company-research", description: "Research companies to understand their culture and opportunities" },
              { name: "Job Alerts", href: "/job-alerts", icon: Bell, current: location === "/job-alerts", description: "Set up alerts for new job postings matching your preferences" },
              { name: "Chrome Extension", href: "/chrome-extension", icon: Chrome, current: location === "/chrome-extension", description: "Enhance your job search with our browser extension" },
            ]
          },
          {
            label: "Application Tools",
            items: [
              { name: "Quick Apply", href: "/quick-apply", icon: Zap, current: location === "/quick-apply", description: "Quickly apply to jobs with pre-filled information" },
              { name: "Auto Fill", href: "/auto-fill", icon: Edit, current: location === "/auto-fill", description: "Automatically fill application forms with your details" },
              { name: "ATS Optimizer", href: "/ats-optimizer", icon: Target, current: location === "/ats-optimizer", description: "Optimize your resume for Applicant Tracking Systems (ATS)" },
              { name: "Cover Letter AI", href: "/cover-letter-ai", icon: Brain, current: location === "/cover-letter-ai", description: "Generate AI-powered cover letters" },
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
              { name: "Search Internships", href: "/internships", icon: Search, current: location === "/internships", description: "Find internship opportunities" },
              { name: "Saved Internships", href: "/internships?filter=saved", icon: Bookmark, current: location.includes("saved"), description: "View internships you've saved" },
              { name: "Summer 2026", href: "/internships?season=summer", icon: Calendar, current: location.includes("summer"), description: "Find summer internships" },
              { name: "Remote Internships", href: "/internships?remote=true", icon: Wifi, current: location.includes("remote"), description: "Filter for remote internship opportunities" },
              { name: "Tech Companies", href: "/internships?category=tech", icon: Monitor, current: location.includes("tech"), description: "Internships at top tech companies" },
              { name: "Recent Postings", href: "/internships?recent=true", icon: Clock, current: location.includes("recent"), description: "View recently posted internships" },
            ]
          },
          {
            label: "Top Companies",
            items: [
              { name: "Apple Internships", href: "/internships?company=apple", icon: Building2, current: location.includes("apple"), description: "Internships at Apple" },
              { name: "Google Internships", href: "/internships?company=google", icon: Building2, current: location.includes("google"), description: "Internships at Google" },
              { name: "Netflix Internships", href: "/internships?company=netflix", icon: Building2, current: location.includes("netflix"), description: "Internships at Netflix" },
              { name: "OpenAI Internships", href: "/internships?company=openai", icon: Building2, current: location.includes("openai"), description: "Internships at OpenAI" },
              { name: "NVIDIA Internships", href: "/internships?company=nvidia", icon: Building2, current: location.includes("nvidia"), description: "Internships at NVIDIA" },
            ]
          },
          {
            label: "Application Tools",
            items: [
              { name: "Quick Apply", href: "/quick-apply", icon: Zap, current: location === "/quick-apply", description: "Quickly apply to internships with pre-filled information" },
              { name: "Resume Optimizer", href: "/ats-optimizer", icon: Target, current: location === "/ats-optimizer", description: "Optimize your resume for internship applications" },
              { name: "Cover Letter AI", href: "/cover-letter-ai", icon: Brain, current: location === "/cover-letter-ai", description: "Generate AI-powered cover letters for internships" },
              { name: "Application Tracker", href: "/applications", icon: FileText, current: location === "/applications", description: "Track your internship applications" },
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
              { name: "All Applications", href: "/applications", icon: FileText, current: location === "/applications", description: "View all your submitted job applications" },
              { name: "In Progress", href: "/applications?status=pending", icon: Clock, current: location.includes("pending"), description: "See applications currently in progress" },
              { name: "Interviews Scheduled", href: "/applications?status=interview", icon: Calendar, current: location.includes("interview"), description: "View applications with scheduled interviews" },
              { name: "Offers Received", href: "/applications?status=offer", icon: Star, current: location.includes("offer"), description: "See job offers you have received" },
              { name: "Rejected", href: "/applications?status=rejected", icon: AlertCircle, current: location.includes("rejected"), description: "View applications that were rejected" },
              { name: "Application Backup", href: "/applications-backup", icon: Archive, current: location === "/applications-backup", description: "Backup and restore your application data" },
            ]
          },
          {
            label: "Analytics & Tracking",
            items: [
              { name: "Application Stats", href: "/applications/stats", icon: BarChart3, current: location.includes("stats"), description: "Analyze your application statistics and trends" },
              { name: "Success Rate", href: "/application-success", icon: TrendingUp, current: location === "/application-success", description: "Track your application success rate" },
              { name: "Response Timeline", href: "/response-timeline", icon: Clock, current: location === "/response-timeline", description: "Analyze the time it takes for companies to respond" },
            ]
          },
          {
            label: "Templates & Tools",
            items: [
              { name: "Cover Letter Builder", href: "/cover-letter-builder", icon: Edit, current: location === "/cover-letter-builder", description: "Build professional cover letters" },
              { name: "Application Tracker", href: "/application-tracker", icon: Target, current: location === "/application-tracker", description: "Track your job applications in detail" },
              { name: "Follow-up Templates", href: "/follow-up-templates", icon: Mail, current: location === "/follow-up-templates", description: "Use templates for professional follow-up emails" },
              { name: "Thank You Notes", href: "/thank-you-notes", icon: Heart, current: location === "/thank-you-notes", description: "Craft effective thank you notes after interviews" },
            ]
          }
        ]
      };
    }

    // Interviews Section
    if (location === "/mock-interview" || location.startsWith("/virtual-interview") || location === "/chat-interview" || location === "/video-practice") {
      return {
        title: "Interviews",
        groups: [
          {
            label: "AI Practice",
            items: [
              { name: "Virtual AI Interview", href: "/virtual-interview/new", icon: MessageCircle, current: location === "/virtual-interview/new" || location.startsWith("/virtual-interview"), description: "Practice conversational AI interviews" },
              { name: "Video Interview Practice", href: "/video-practice", icon: Video, current: location === "/video-practice", description: "Record yourself and get feedback on video interviews" },
              { name: "AI Chat Interview", href: "/chat-interview", icon: MessageCircle, current: location === "/chat-interview", description: "Practice technical questions in a chat format" },
              { name: "Technical Practice", href: "/mock-interview/technical", icon: Code, current: location.includes("/technical"), description: "Practice technical interview questions" },
              { name: "Behavioral Questions", href: "/mock-interview/behavioral", icon: Brain, current: location.includes("/behavioral"), description: "Prepare for behavioral interview questions" },
              { name: "Industry Specific", href: "/mock-interview/industry", icon: Building, current: location.includes("/industry"), description: "Practice interviews tailored to specific industries" },
            ]
          },
          {
            label: "Live Sessions",
            items: [
              { name: "Start Live Interview", href: "/virtual-interview-start", icon: Users, current: location.startsWith("/virtual-interview"), description: "Initiate a live interview session" },
              { name: "Interview Assignments", href: "/interview-assignments", icon: Calendar, current: location === "/interview-assignments", description: "Manage interview assignments" },
              { name: "Mock Interview", href: "/mock-interview", icon: Users, current: location === "/mock-interview", description: "Practice mock interviews with peers or mentors" },
              { name: "Interview Complete", href: "/virtual-interview-complete", icon: CheckCircle, current: location === "/virtual-interview-complete", description: "Mark an interview session as complete" },
            ]
          },
          {
            label: "Performance & Feedback",
            items: [
              { name: "Interview History", href: "/interview-history", icon: Clock, current: location === "/interview-history", description: "Review your past interview sessions" },
              { name: "Feedback Analysis", href: "/virtual-interview-feedback", icon: BarChart3, current: location === "/virtual-interview-feedback", description: "Analyze feedback from your interview practice" },
              { name: "Performance Trends", href: "/interview-trends", icon: TrendingUp, current: location === "/interview-trends", description: "Track your interview performance over time" },
              { name: "Improvement Tips", href: "/interview-tips", icon: Lightbulb, current: location === "/interview-tips", description: "Get personalized tips for interview improvement" },
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
              { name: "Referral Marketplace", href: "/referral-marketplace", icon: Search, current: location === "/referral-marketplace", description: "Explore and request referrals from a network of professionals" },
              { name: "Employee Referrals", href: "/employee-referral-services", icon: Users2, current: location === "/employee-referral-services", description: "Utilize employee referral programs for job opportunities" },
              { name: "My Bookings", href: "/my-bookings", icon: Calendar, current: location === "/my-bookings", description: "View your scheduled referral requests and meetings" },
              { name: "Request Referral", href: "/request-referral", icon: UserPlus, current: location === "/request-referral", description: "Submit a request for a referral" },
              { name: "Referral Status", href: "/referral-status", icon: Eye, current: location === "/referral-status", description: "Track the status of your referral requests" },
            ]
          },
          {
            label: "Be a Referrer",
            items: [
              { name: "Become Referrer", href: "/become-referrer", icon: Handshake, current: location === "/become-referrer", description: "Sign up to become a referrer and help others" },
              { name: "Refer Candidates", href: "/refer-candidates", icon: UserPlus, current: location === "/refer-candidates", description: "Refer qualified candidates for job openings" },
              { name: "Company Network", href: "/company-network", icon: Building2, current: location === "/company-network", description: "View companies with active referral programs" },
              { name: "Referral Earnings", href: "/referral-earnings", icon: DollarSign, current: location === "/referral-earnings", description: "Track your earnings from successful referrals" },
              { name: "Success Stories", href: "/referral-success", icon: Star, current: location === "/referral-success", description: "Read success stories from referrers and candidates" },
            ]
          },
          {
            label: "Networking",
            items: [
              { name: "Professional Network", href: "/professional-network", icon: Users, current: location === "/professional-network", description: "Connect with professionals in your field" },
              { name: "Industry Connections", href: "/industry-connections", icon: Building, current: location === "/industry-connections", description: "Build connections within your industry" },
              { name: "Mentorship Program", href: "/mentorship", icon: GraduationCap, current: location === "/mentorship", description: "Join a mentorship program for career guidance" },
              { name: "Career Events", href: "/career-events", icon: Calendar, current: location === "/career-events", description: "Discover and register for career-related events" },
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
              { name: "Profile Settings", href: "/profile", icon: Settings, current: location === "/profile", description: "Manage your profile settings and preferences" },
              { name: "Personal Info", href: "/profile/personal", icon: UserCheck, current: location === "/profile/personal", description: "Update your personal information" },
              { name: "Contact Details", href: "/profile/contact", icon: Phone, current: location === "/profile/contact", description: "Manage your contact information" },
              { name: "Career Preferences", href: "/profile/preferences", icon: Target, current: location === "/profile/preferences", description: "Set your career preferences and goals" },
              { name: "Background Check", href: "/background-check-integration", icon: Shield, current: location === "/background-check-integration", description: "Integrate background check services" },
            ]
          },
          {
            label: "Resume & Documents",
            items: [
              { name: "Resume Manager", href: "/resumes", icon: FileText, current: location === "/resumes", description: "Manage and organize your resumes" },
              { name: "Resume Builder", href: "/resume-builder", icon: Edit, current: location === "/resume-builder", description: "Create professional resumes with our builder" },
              { name: "ATS Optimizer", href: "/ats-optimizer", icon: Zap, current: location === "/ats-optimizer", description: "Optimize your resume for ATS compatibility" },
              { name: "Resume Analysis", href: "/resume-analysis", icon: BarChart3, current: location === "/resume-analysis", description: "Get an in-depth analysis of your resume" },
              { name: "Portfolio Upload", href: "/portfolio", icon: Upload, current: location === "/portfolio", description: "Upload your portfolio to showcase your work" },
              { name: "Cover Letters", href: "/cover-letters", icon: Mail, current: location === "/cover-letters", description: "Manage your cover letters" },
            ]
          },
          {
            label: "Skills & Assessment",
            items: [
              { name: "Ranking Tests", href: "/ranking-tests", icon: Trophy, current: location === "/ranking-tests", description: "Take tests to assess and rank your skills" },
              { name: "Job Seeker Tests", href: "/job-seeker-tests", icon: GraduationCap, current: location === "/job-seeker-tests", description: "View tests relevant to job seekers" },
              { name: "Test Assignments", href: "/test-assignments", icon: Code, current: location === "/test-assignments", description: "Manage your test assignments" },
              { name: "Skills Verification", href: "/skill-verification", icon: Award, current: location === "/skill-verification", description: "Verify your skills with assessments" },
              { name: "Certification Tracker", href: "/certifications", icon: Star, current: location === "/certifications", description: "Track your professional certifications" },
              { name: "Learning Path", href: "/learning-path", icon: BookOpen, current: location === "/learning-path", description: "Follow personalized learning paths" },
            ]
          },
          {
            label: "Performance Analytics",
            items: [
              { name: "Profile Score", href: "/profile-score", icon: Target, current: location === "/profile-score", description: "View your overall profile score" },
              { name: "Test History", href: "/test-history", icon: Clock, current: location === "/test-history", description: "Review your past test results" },
              { name: "Skill Progress", href: "/skill-progress", icon: TrendingUp, current: location === "/skill-progress", description: "Track your skill development progress" },
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
              { name: "Premium Overview", href: "/job-seeker-premium", icon: Crown, current: location === "/job-seeker-premium", description: "Overview of premium features and benefits" },
              { name: "Subscription Manager", href: "/subscription", icon: CreditCard, current: location === "/subscription", description: "Manage your premium subscription" },
              { name: "Billing History", href: "/billing-history", icon: Receipt, current: location === "/billing-history", description: "View your billing history" },
              { name: "Usage Analytics", href: "/usage-analytics", icon: Activity, current: location === "/usage-analytics", description: "Analyze your usage of premium features" },
            ]
          },
          {
            label: "Premium AI Tools",
            items: [
              { name: "Premium AI Tools Hub", href: "/premium-ai-tools", icon: Zap, current: location === "/premium-ai-tools" || location.startsWith("/premium-ai-tools"), description: "Access all premium AI-powered career tools" },
              { name: "AI Cover Letter Generator", href: "/premium-ai-tools?tab=cover-letter", icon: FileText, current: location.includes("tab=cover-letter"), description: "Generate premium AI-powered cover letters" },
              { name: "Salary Negotiation Coach", href: "/premium-ai-tools?tab=salary", icon: DollarSign, current: location.includes("tab=salary"), description: "Get AI-driven advice for salary negotiation" },
              { name: "Interview Answer Generator", href: "/premium-ai-tools?tab=interview", icon: MessageCircle, current: location.includes("tab=interview"), description: "Generate AI-powered answers for interview questions" },
              { name: "Career Path Planner", href: "/premium-ai-tools?tab=career", icon: TrendingUp, current: location.includes("tab=career"), description: "Plan your career path with AI assistance" },
            ]
          },
          {
            label: "Premium Tools",
            items: [
              { name: "AI Career Coach", href: "/career-ai-assistant", icon: Brain, current: location === "/career-ai-assistant", description: "Get personalized career coaching from an AI assistant" },
              { name: "Premium Chat", href: "/premium-chat", icon: MessageCircle, current: location === "/premium-chat", description: "Access enhanced chat features" },
              { name: "Priority Support", href: "/premium-support", icon: Headphones, current: location === "/premium-support", description: "Receive priority customer support" },
              { name: "Exclusive Jobs", href: "/premium-jobs", icon: Star, current: location === "/premium-jobs", description: "Access exclusive job listings for premium members" },
              { name: "Premium Targeting", href: "/premium-targeting", icon: Target, current: location === "/premium-targeting", description: "Utilize premium job targeting features" },
            ]
          },
          {
            label: "Advanced Features",
            items: [
              { name: "Enhanced Chat", href: "/enhanced-chat", icon: Sparkles, current: location === "/enhanced-chat", description: "Experience an enhanced chat interface" },
              { name: "Task Management", href: "/task-management", icon: CheckCircle, current: location === "/task-management", description: "Manage your tasks and to-do lists" },
              { name: "Job Seeker Tasks", href: "/job-seeker-tasks", icon: Clock, current: location === "/job-seeker-tasks", description: "View and manage tasks specific to job seekers" },
              { name: "Custom Branding", href: "/custom-branding", icon: Megaphone, current: location === "/custom-branding", description: "Customize your profile with branding options" },
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
              { name: "Chat Dashboard", href: "/chat", icon: MessageCircle, current: location === "/chat", description: "Access your main chat dashboard" },
              { name: "Simple Chat", href: "/simple-chat", icon: Users, current: location === "/simple-chat", description: "Engage in simple chat conversations" },
              { name: "Enhanced Chat", href: "/enhanced-chat", icon: Sparkles, current: location === "/enhanced-chat", description: "Use the enhanced chat features" },
              { name: "Premium Chat", href: "/premium-chat", icon: Crown, current: location === "/premium-chat", description: "Access premium chat functionalities" },
              { name: "Messaging Center", href: "/messaging", icon: Mail, current: location === "/messaging", description: "Manage all your messages in one place" },
            ]
          },
          {
            label: "Communication Tools",
            items: [
              { name: "AI Career Assistant", href: "/career-ai-assistant", icon: Brain, current: location === "/career-ai-assistant", description: "Get AI-powered career advice and support" },
              { name: "Video Calls", href: "/video-calls", icon: Video, current: location === "/video-calls", description: "Make video calls with contacts" },
              { name: "Email Templates", href: "/email-templates", icon: Mail, current: location === "/email-templates", description: "Use templates for professional emails" },
              { name: "Contact Manager", href: "/contact-manager", icon: Phone, current: location === "/contact-manager", description: "Manage your professional contacts" },
            ]
          },
          {
            label: "Notifications",
            items: [
              { name: "Notification Center", href: "/notifications", icon: Bell, current: location === "/notifications", description: "View and manage your notifications" },
              { name: "Email Settings", href: "/email-settings", icon: Settings, current: location === "/email-settings", description: "Configure your email notification settings" },
              { name: "Communication Preferences", href: "/communication-preferences", icon: Users, current: location === "/communication-preferences", description: "Set your communication preferences" },
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
              { name: "Chrome Extension", href: "/chrome-extension", icon: Chrome, current: location === "/chrome-extension", description: "Install and manage the Chrome extension for job searching" },
              { name: "Extension Setup", href: "/extension-setup", icon: Settings, current: location === "/extension-setup", description: "Set up and configure the Chrome extension" },
              { name: "Auto-Fill Settings", href: "/auto-fill-settings", icon: Edit, current: location === "/auto-fill-settings", description: "Configure auto-fill settings for applications" },
              { name: "Quick Apply", href: "/quick-apply", icon: Zap, current: location === "/quick-apply", description: "Use the quick apply feature from the extension" },
            ]
          },
          {
            label: "Productivity Tools",
            items: [
              { name: "ATS Optimizer", href: "/ats-optimizer", icon: Target, current: location === "/ats-optimizer", description: "Optimize your resume for Applicant Tracking Systems" },
              { name: "Resume Scanner", href: "/resume-scanner", icon: ScanLine, current: location === "/resume-scanner", description: "Scan and analyze your resume for improvements" },
              { name: "Job Matcher", href: "/job-matcher", icon: Filter, current: location === "/job-matcher", description: "Find jobs that best match your profile" },
              { name: "Salary Calculator", href: "/salary-calculator", icon: DollarSign, current: location === "/salary-calculator", description: "Calculate expected salaries based on your profile" },
            ]
          },
          {
            label: "Integrations",
            items: [
              { name: "LinkedIn Integration", href: "/linkedin-integration", icon: Users, current: location === "/linkedin-integration", description: "Connect your LinkedIn profile for enhanced features" },
              { name: "GitHub Integration", href: "/github-integration", icon: Code, current: location === "/github-integration", description: "Integrate your GitHub profile" },
              { name: "API Access", href: "/api-access", icon: Key, current: location === "/api-access", description: "Get access to our API" },
              { name: "SSO Configuration", href: "/sso-configuration", icon: Lock, current: location === "/sso-configuration", description: "Configure Single Sign-On (SSO)" },
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
              { name: "Post New Job", href: "/post-job", icon: PlusCircle, current: location === "/post-job", description: "Post a new job opening" },
              { name: "Job Promotion", href: "/job-promotion-payment", icon: Megaphone, current: location === "/job-promotion-payment", description: "Promote your job postings" },
              { name: "Premium Targeting", href: "/premium-targeting-payment", icon: Target, current: location === "/premium-targeting-payment", description: "Utilize premium targeting for job ads" },

            ]
          },
          {
            label: "Candidate Management",
            items: [
              { name: "TouchBase CRM", href: "/enhanced-crm", icon: Users, current: location === "/enhanced-crm" || location.startsWith("/enhanced-crm"), description: "Manage your candidate relationships with CRM" },
              { name: "Applicant Pipeline", href: "/pipeline-management", icon: Users, current: location === "/pipeline-management", description: "Track applicants through the hiring pipeline" },
              { name: "Enhanced Pipeline", href: "/enhanced-pipeline-management", icon: Layers, current: location === "/enhanced-pipeline-management", description: "Advanced candidate pipeline management" },
              { name: "Test Management", href: "/test-management", icon: Code, current: location === "/test-management", description: "Manage candidate assessments and tests" },
              { name: "Interview Assignments", href: "/interview-assignments", icon: Calendar, current: location === "/interview-assignments", description: "Assign and schedule interviews" },
            ]
          },
          {
            label: "Recruiter Premium",
            items: [
              { name: "Recruiter Premium", href: "/recruiter-premium", icon: Crown, current: location === "/recruiter-premium", description: "Access premium features for recruiters" },
              { name: "Recruiter Features", href: "/employer-features", icon: Star, current: location === "/employer-features", description: "Explore features designed for employers" },
              { name: "Subscription Manager", href: "/recruiter-subscription", icon: CreditCard, current: location === "/recruiter-subscription", description: "Manage your recruiter subscription" },
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
            { name: "Find Jobs", href: "/jobs", icon: Briefcase, current: false, description: "Search for job opportunities" },
            { name: "Find Internships", href: "/internships", icon: Users, current: false, description: "Search for internship positions" },
            { name: "View Applications", href: "/applications", icon: FileText, current: false, description: "Track your job applications" },
            { name: "Practice Interview", href: "/mock-interview", icon: Video, current: false, description: "Prepare for interviews with practice sessions" },
            { name: "Get Referred", href: "/referral-marketplace", icon: Handshake, current: false, description: "Find referral opportunities" },
            { name: "AI Career Coach", href: "/career-ai-assistant", icon: Brain, current: false, description: "Get AI-powered career advice" },
            { name: "Chrome Extension", href: "/chrome-extension", icon: Chrome, current: false, description: "Install our job search browser extension" },
          ]
        },
        {
          label: "Your Progress",
          items: [
            { name: "Profile Score", href: "/profile", icon: Target, current: false, description: "Check your profile completion score" },
            { name: "Skill Tests", href: "/ranking-tests", icon: Trophy, current: false, description: "Take skill assessment tests" },
            { name: "Resume Analysis", href: "/resumes", icon: FileText, current: false, description: "Analyze your resume for improvements" },
            { name: "Analytics", href: "/advanced-analytics-dashboard", icon: BarChart3, current: false, description: "View your career analytics dashboard" },
          ]
        },
        {
          label: "Recent Activity",
          items: [
            { name: "Messages", href: "/chat", icon: MessageCircle, current: false, description: "View your recent messages" },
            { name: "Notifications", href: "/notifications", icon: Bell, current: false, description: "Check your latest notifications" },
            { name: "My Tasks", href: "/job-seeker-tasks", icon: CheckCircle, current: false, description: "View your assigned tasks" },
            { name: "Job Alerts", href: "/job-alerts", icon: AlertCircle, current: false, description: "Manage your job alert preferences" },
          ]
        },
        {
          label: "Premium Features",
          items: [
            { name: "Upgrade to Premium", href: "/job-seeker-premium", icon: Crown, current: false, description: "Upgrade to access premium features" },
            { name: "Premium Features", href: "/premium-features", icon: Star, current: false, description: "Explore all available premium features" },
          ]
        },
        {
          label: "Tools & Resources",
          items: [
            { name: "Resume & ATS Score", href: "/resume", icon: FileText, current: location === "/resume", description: "Upload and analyze your resume with ATS scoring" },
            { name: "LinkedIn Optimizer", href: "/linkedin-optimizer", icon: TrendingUp, current: location === "/linkedin-optimizer", description: "AI-powered LinkedIn profile optimization for maximum recruiter visibility" },
            { name: "Premium AI Tools", href: "/premium-ai-tools", icon: Zap, current: location === "/premium-ai-tools", premium: true, description: "Access all premium AI-powered career tools" },
            { name: "Chrome Extension", href: "/chrome-extension", icon: Chrome, current: location === "/chrome-extension", description: "Auto-apply to jobs across LinkedIn, Indeed, and 50+ job boards" },
            { name: "Cover Letter Generator", href: "/cover-letter-generator", icon: FileText, current: location === "/cover-letter-generator", description: "Generate personalized cover letters for any job" },
          ]
        },
        {
          label: "Interview Prep",
          items: [
            { name: "Virtual AI Interview", href: "/virtual-interview/new", icon: MessageCircle, current: location.startsWith("/virtual-interview"), description: "Practice with AI interviewer through conversational text-based interviews" },
            { name: "Video Interview Practice", href: "/video-practice", icon: Video, current: location === "/video-practice", description: "Record yourself answering questions with real-time video & audio feedback" },
            { name: "Interview Prep Tools", href: "/interview-prep-tools", icon: Target, current: location === "/interview-prep-tools", description: "Access interview question banks and preparation resources" },
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
                        <Link
                          href={item.href}
                          className={`${
                            item.current
                              ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300"
                              : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          } group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            item.premium && !isPremium ? "opacity-50" : ""
                          } relative`}
                          title={item.description || item.name}
                        >
                          <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                          <span className="flex-1">{item.name}</span>
                          {item.premium && !isPremium && <Crown className="h-4 w-4 text-amber-500" />}
                          {item.description && (
                            <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 max-w-xs">
                              {item.description}
                            </div>
                          )}
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