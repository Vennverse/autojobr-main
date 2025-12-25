import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/seo";
import { SEOMeta } from "@/components/seo-meta";
import { 
  Users, 
  Target, 
  BarChart3, 
  Zap, 
  Clock, 
  Award,
  ArrowRight,
  CheckCircle,
  Star,
  Brain,
  Filter,
  MessageCircle,
  FileText,
  Crown,
  TrendingUp,
  Shield,
  Search,
  Eye,
  Calendar,
  Briefcase,
  UserCheck,
  Globe,
  Rocket,
  Bot,
  Lightbulb,
  ChartBar,
  DollarSign,
  Mail,
  Cpu,
  Layout,
  Layers,
  Activity,
  Workflow,
  Sparkles,
  Play
} from "lucide-react";
import {
  SiGoogle,
  SiApple,
  SiAmazon,
  SiNetflix,
  SiTesla,
  SiNvidia
} from "react-icons/si";
import logoImage from "@assets/generated_images/AutoJobr_professional_logo_17c702fa.png";
import dashboardMockup from "@assets/generated_images/Recruitment_dashboard_mockup_2b680657.png";

// Dummy integration data - replace with actual service call if needed
const integrations = [
  { name: "Gmail", category: "Email", logo: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Gmail_Icon.svg" },
  { name: "Outlook", category: "Email", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Microsoft_Outlook_2013_logo.svg" },
  { name: "Slack", category: "Communication", logo: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon.svg" },
  { name: "Microsoft Teams", category: "Communication", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Microsoft_Teams_logo.svg" },
  { name: "Zoom", category: "Video Conferencing", logo: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Zoom_icon_2020.svg" },
  { name: "Google Calendar", category: "Scheduling", logo: "https://upload.wikimedia.org/wikipedia/commons/d/de/Google_Calendar_icon.svg" },
  { name: "Calendly", category: "Scheduling", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Calendly_logo.svg" },
  { name: "Asana", category: "Project Management", logo: "https://upload.wikimedia.org/wikipedia/commons/c/cb/Asana_logo.svg" },
  { name: "Trello", category: "Project Management", logo: "https://upload.wikimedia.org/wikipedia/commons/0/09/Trello_logo.svg" },
  { name: "Jira", category: "Project Management", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Jira_logo_blue.svg" },
  { name: "Google Drive", category: "Storage", logo: "https://upload.wikimedia.org/wikipedia/commons/1/10/Google_Drive_logo.svg" },
  { name: "Dropbox", category: "Storage", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7c/Dropbox_Icon.svg" },
  { name: "Salesforce", category: "CRM", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Salesforce_logo.svg" },
  { name: "HubSpot", category: "CRM", logo: "https://upload.wikimedia.org/wikipedia/commons/1/19/HubSpot_Logo.svg" },
  { name: "Zapier", category: "Automation", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Zapier_logo.svg" },
  { name: "Workday", category: "HRIS", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Workday_logo.svg" },
];


const recruiterStats = [
  { label: "Time Saved", value: "60%", icon: Clock },
  { label: "Quality Hires", value: "85%", icon: Award },
  { label: "Cost Reduction", value: "40%", icon: TrendingUp },
  { label: "Faster Hiring", value: "3x", icon: Zap }
];

// SEO Keywords: recruiter bidding system, AI recruiter matching, talent marketplace
const recruiterBiddingInfo = {
  description: "AutoJobr's unique recruiter bidding system connects recruiters and hiring managers directly with pre-qualified job seekers. Our AI recruiter matching platform uses advanced algorithms to match top talent with the best opportunities.",
  keywords: ["recruiter bidding system", "AI recruiter matching", "talent marketplace", "recruiter platform", "AI hiring platform"]
};

const aiPoweredFeatures = [
  {
    icon: Brain,
    title: "AI Candidate Scoring & Ranking",
    description: "Advanced AI algorithms automatically score and rank candidates based on job requirements, skills match, and success predictors.",
    benefits: ["95% accuracy in candidate ranking", "Reduce screening time by 80%", "Identify top 10% candidates instantly"],
    premium: true
  },
  {
    icon: Bot,
    title: "Intelligent Job Description Optimization",
    description: "AI analyzes and optimizes your job postings for maximum visibility, candidate attraction, and ATS compatibility.",
    benefits: ["40% increase in applications", "Better keyword optimization", "Inclusive language suggestions"],
    premium: true
  },
  {
    icon: Lightbulb,
    title: "AI Interview Question Generator",
    description: "Generate personalized interview questions based on candidate profiles, job requirements, and behavioral indicators.",
    benefits: ["Custom questions for each candidate", "Behavioral and technical focus", "Interview strategy recommendations"],
    premium: true
  },
  {
    icon: ChartBar,
    title: "Predictive Hiring Analytics",
    description: "AI-powered insights predict candidate success, identify hiring patterns, and recommend process improvements.",
    benefits: ["Predict candidate fit probability", "Identify successful hiring patterns", "Reduce turnover by 30%"],
    premium: true
  },
  {
    icon: DollarSign,
    title: "AI Salary Benchmarking",
    description: "Real-time salary analysis and benchmarking powered by AI to help you make competitive offers.",
    benefits: ["Market-accurate salary ranges", "Competitive analysis", "Offer optimization strategies"],
    premium: true
  },
  {
    icon: Mail,
    title: "Smart Communication Templates",
    description: "AI generates personalized outreach messages, rejection letters, and follow-up communications.",
    benefits: ["50% higher response rates", "Personalized messaging", "Professional tone optimization"],
    premium: true
  }
];

const recruiterFeatures = [
  {
    icon: Brain,
    title: "AI-Powered Candidate Matching",
    description: "Advanced algorithms analyze resumes, skills, and experience to find perfect-fit candidates automatically.",
    benefits: ["90% better matches", "Reduce screening time", "Eliminate bias"]
  },
  {
    icon: Target,
    title: "Premium Candidate Targeting",
    description: "Reach passive candidates and top talent with precision targeting based on skills, location, and career goals.",
    benefits: ["Access hidden talent", "Higher response rates", "Quality over quantity"]
  },
  {
    icon: BarChart3,
    title: "Advanced Recruitment Analytics",
    description: "Real-time insights on hiring funnel, candidate quality, time-to-hire, and ROI across all campaigns.",
    benefits: ["Data-driven decisions", "Optimize hiring process", "Track performance"]
  },
  {
    icon: Zap,
    title: "Automated Screening & Assessment",
    description: "Custom tests, video interviews, and AI-powered screening reduce manual work by 70%.",
    benefits: ["Save 20+ hours/week", "Consistent evaluation", "Objective scoring"]
  },
  {
    icon: MessageCircle,
    title: "Integrated Communication Hub",
    description: "Centralized messaging, interview scheduling, and collaboration tools keep your team aligned.",
    benefits: ["Seamless coordination", "Candidate engagement", "Team collaboration"]
  },
  {
    icon: Shield,
    title: "Compliance & Security",
    description: "GDPR compliance, secure data handling, and audit trails ensure regulatory requirements are met.",
    benefits: ["Risk mitigation", "Legal compliance", "Data protection"]
  }
];

const successStories = [
  {
    company: "TechStartup Inc.",
    industry: "Technology",
    size: "50-200 employees",
    results: {
      timeToHire: "65% reduction",
      qualityHires: "40% increase",
      costSaving: "$150K annually"
    },
    quote: "AutoJobr's AI features transformed our hiring process. We're now filling positions 3x faster with much higher quality candidates.",
    name: "Sarah Johnson",
    role: "Head of Talent"
  },
  {
    company: "Global Corp",
    industry: "Financial Services", 
    size: "1000+ employees",
    results: {
      timeToHire: "50% reduction",
      qualityHires: "60% increase", 
      costSaving: "$500K annually"
    },
    quote: "The AI candidate scoring is incredible. Our hiring managers are consistently impressed with candidate quality.",
    name: "Michael Chen",
    role: "VP of Recruitment"
  },
  {
    company: "Innovation Labs",
    industry: "Healthcare",
    size: "200-500 employees", 
    results: {
      timeToHire: "70% reduction",
      qualityHires: "45% increase",
      costSaving: "$200K annually"
    },
    quote: "AI-powered insights eliminated most manual screening. The platform does the heavy lifting so we can focus on building relationships.",
    name: "Emily Rodriguez",
    role: "Talent Acquisition Lead"
  }
];

const pricingPlans = [
  {
    name: "FREE",
    price: "$0",
    description: "Perfect to get started",
    features: [
      "Platform-maintained career page",
      "1 job posting at a time",
      "Basic candidate search",
      "Standard email support",
      "Core analytics dashboard",
      "Professional branding"
    ],
    cta: "Get Started Free",
    popular: false,
    isFree: true,
    savings: "Always free, no credit card required"
  },
  {
    name: "Starter",
    price: "$10",
    perMonth: true,
    description: "Perfect for small teams",
    features: [
      "Everything in FREE, plus:",
      "Up to 5 job postings/month",
      "Basic AI candidate matching",
      "Priority support",
      "Enhanced analytics"
    ],
    cta: "Start Free Trial",
    popular: false,
    savings: "vs $99/month on other platforms"
  },
  {
    name: "Professional", 
    price: "$20",
    perMonth: true,
    description: "For growing companies",
    features: [
      "Everything in STARTER, plus:",
      "Unlimited job postings",
      "Advanced AI matching & scoring",
      "Job description optimization",
      "Custom assessments",
      "Video interviews",
      "Advanced analytics",
      "AI interview questions",
      "Salary benchmarking",
      "Priority support",
      "Team collaboration"
    ],
    cta: "Start Free Trial",
    popular: true,
    savings: "vs $299/month on other platforms"
  },
  {
    name: "Enterprise",
    price: "$40",
    perMonth: true,
    description: "For large organizations",
    features: [
      "Everything in PROFESSIONAL, plus:",
      "AI-powered hiring predictions",
      "Custom AI model training",
      "Advanced integrations",
      "Dedicated account manager",
      "SLA guarantees",
      "Advanced security",
      "Custom reporting",
      "White-label options",
      "24/7 phone support"
    ],
    cta: "Start Free Trial",
    popular: false,
    savings: "vs $800/month on other platforms"
  }
];

const competitorComparison = [
  { 
    feature: "AI-Powered Matching", 
    autojobr: true, 
    competitor1: false, 
    competitor2: true 
  },
  { 
    feature: "AI Candidate Scoring", 
    autojobr: true, 
    competitor1: false, 
    competitor2: false 
  },
  { 
    feature: "Job Description AI Optimization", 
    autojobr: true, 
    competitor1: false, 
    competitor2: false 
  },
  { 
    feature: "AI Interview Questions", 
    autojobr: true, 
    competitor1: false, 
    competitor2: false 
  },
  { 
    feature: "Unlimited Job Postings", 
    autojobr: true, 
    competitor1: false, 
    competitor2: false 
  },
  { 
    feature: "Custom Assessments", 
    autojobr: true, 
    competitor1: true, 
    competitor2: false 
  },
  { 
    feature: "Real-time Analytics", 
    autojobr: true, 
    competitor1: false, 
    competitor2: true 
  },
  { 
    feature: "Integrated Communication", 
    autojobr: true, 
    competitor1: false, 
    competitor2: false 
  },
  { 
    feature: "Starting price", 
    autojobr: "FREE (then $10/mo)", 
    competitor1: "From $300/mo", 
    competitor2: "From $250/mo" 
  }
];

export default function RecruiterFeaturesPage() {
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Ensure page is visible with slight delay for animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Add error boundary
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Page error:', event.error);
      setHasError(true);
      event.preventDefault();
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Error fallback UI
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md p-6">
          <CardContent>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Please refresh the page to try again.</p>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <SEO 
        title="AI-Powered Recruitment & ATS Platform for Startups"
        description="Streamline your hiring with AutoJobr. AI candidate scoring, virtual video interviews, ATS, pipeline management, and intelligent recruitment workflows for startups."
      />
      <SEOMeta
        title="AI-Powered Recruitment & ATS Platform for Startups"
        description="Automate your hiring process with AI. Video interviews, candidate ranking, and integrated ATS for fast-growing startups. 60% reduction in time-to-hire."
        keywords="recruiter bidding system, AI recruiter matching, talent marketplace, recruiter platform, AI hiring platform, startup recruitment software, virtual video interview platform, ATS for startups, pipeline management tool"
        url="https://autojobr.com/employer-features"
      />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <img src={logoImage} alt="AutoJobr" className="w-8 h-8" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AutoJobr
              </span>
            </Link>

            <nav className="hidden md:flex space-x-8">
              <a href="#ai-features" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                AI Features
              </a>
              <a href="#features" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#success-stories" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                Success Stories
              </a>
              <Link href="/" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                For Job Seekers
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200">
                <Cpu className="w-3 h-3 mr-1" />
                AI-Powered Recruitment Platform
              </Badge>

              <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                Hire Top Talent
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"> 3x Faster</span>
                <br />
                with AI
              </h1>

              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                Transform your recruitment process with AI-powered candidate scoring, automated screening, intelligent job optimization, and predictive hiring analytics. Reduce time-to-hire by 60% while improving hire quality.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link href="/auth">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 px-8 py-4 text-lg">
                    <Rocket className="w-5 h-5 mr-2" />
                    Start Free 14-Day Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="border-2 border-slate-300 hover:border-slate-400 px-8 py-4 text-lg">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book AI Demo
                </Button>
              </div>

              <div className="flex justify-center space-x-8 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  14-day free trial
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  AI-powered features
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Cancel anytime
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Hero Section */}
      <section className="relative pt-32 pb-48 overflow-hidden bg-slate-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-95'}`}>
            <Badge className="mb-8 bg-white/10 text-blue-400 border-white/20 backdrop-blur-md px-6 py-2 text-sm font-medium tracking-wider uppercase">
              <Sparkles className="w-4 h-4 mr-2 animate-spin-slow" />
              The Future of Talent Acquisition
            </Badge>

            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9] animate-in fade-in slide-in-from-bottom-10 duration-1000">
              DOMINATE THE<br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">TALENT MARKET</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Stop searching. Start selecting. Our AI-first platform gives startups the same hiring power as big tech, without the enterprise overhead.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/auth">
                <Button size="lg" className="h-16 px-10 text-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-110 transition-all duration-300 shadow-[0_0_50px_rgba(59,130,246,0.4)] rounded-full group border-0 font-bold uppercase tracking-widest">
                  Start Your Empire
                  <Rocket className="w-6 h-6 ml-3 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-16 px-10 text-xl border-white/20 text-white hover:bg-white/5 backdrop-blur-md rounded-full group">
                Watch AI in Action
                <Play className="w-6 h-6 ml-3 fill-white group-hover:scale-110 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Interactive Features Section */}
      <section id="ai-features" className="relative -mt-24 pb-32 px-4 z-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Video,
                title: "AI Virtual Interviews",
                desc: "Real-time facial & sentiment analysis for deep candidate insight.",
                color: "blue",
                delay: "0ms"
              },
              {
                icon: Brain,
                title: "Predictive Ranking",
                desc: "AI scores candidates based on success patterns of top performers.",
                color: "purple",
                delay: "200ms"
              },
              {
                icon: Workflow,
                title: "Smart Automations",
                desc: "One-click pipeline workflows that eliminate 90% of manual tasks.",
                color: "pink",
                delay: "400ms"
              }
            ].map((f, i) => (
              <Card key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/20 dark:border-slate-800 shadow-2xl hover-elevate transition-all duration-500 overflow-hidden group animate-in fade-in slide-in-from-bottom-10" style={{ animationDelay: f.delay }}>
                <CardContent className="p-10">
                  <div className={`w-16 h-16 rounded-2xl bg-${f.color}-500/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                    <f.icon className={`w-10 h-10 text-${f.color}-500`} />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{f.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xl leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em] mb-12">Trusted by the fastest growing startups</p>
          <div className="flex flex-wrap justify-center items-center gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            <SiGoogle className="w-10 h-10" />
            <SiAmazon className="w-10 h-10" />
            <SiNvidia className="w-10 h-10" />
            <SiNetflix className="w-10 h-10" />
            <SiApple className="w-10 h-10" />
          </div>
        </div>
      </section>

      {/* Detailed Features Section */}
      <section id="features" className="py-32 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-24 items-center mb-32">
            <div>
              <Badge className="mb-6 bg-blue-500/10 text-blue-600 border-blue-500/20 px-4 py-1">Virtual Interview System</Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-8 leading-tight">
                Interviews that <br />
                <span className="text-blue-600">Screen for You</span>
              </h2>
              <div className="space-y-8">
                {[
                  { t: "Live Sentiment Tracking", d: "Detect confidence and emotional engagement in real-time." },
                  { t: "Automated Transcription", d: "Get searchable text logs of every interview session." },
                  { t: "AI Decision Support", d: "Instant scoring based on technical and behavioral answers." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-1">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{item.t}</h4>
                      <p className="text-slate-600 dark:text-slate-400">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500/20 blur-[120px] rounded-full group-hover:bg-blue-500/30 transition-all duration-700"></div>
              <img src={dashboardMockup} alt="AI Interviews" className="relative rounded-2xl shadow-3xl border border-slate-200 dark:border-slate-800 transform group-hover:scale-[1.02] transition-transform duration-700" />
              {/* Floating UI element */}
              <div className="absolute -bottom-10 -right-10 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 animate-bounce-slow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <UserCheck className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Match Score: 98%</p>
                    <p className="text-xs text-slate-500">AI Verified Candidate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-24 items-center direction-rtl">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-6">
                <Card className="p-8 bg-slate-50 dark:bg-slate-800/50 border-none shadow-none hover-elevate">
                  <Layout className="w-10 h-10 text-purple-500 mb-4" />
                  <h4 className="font-bold mb-2">Integrated ATS</h4>
                  <p className="text-sm text-slate-600">Full lifecycle tracking.</p>
                </Card>
                <Card className="p-8 bg-slate-50 dark:bg-slate-800/50 border-none shadow-none hover-elevate">
                  <Users className="w-10 h-10 text-green-500 mb-4" />
                  <h4 className="font-bold mb-2">CRM Integration</h4>
                  <p className="text-sm text-slate-600">Sync with your tools.</p>
                </Card>
                <Card className="p-8 bg-slate-50 dark:bg-slate-800/50 border-none shadow-none hover-elevate">
                  <Workflow className="w-10 h-10 text-orange-500 mb-4" />
                  <h4 className="font-bold mb-2">Automated Tasks</h4>
                  <p className="text-sm text-slate-600">90% faster flows.</p>
                </Card>
                <Card className="p-8 bg-slate-50 dark:bg-slate-800/50 border-none shadow-none hover-elevate">
                  <Activity className="w-10 h-10 text-pink-500 mb-4" />
                  <h4 className="font-bold mb-2">Real-time Analytics</h4>
                  <p className="text-sm text-slate-600">Data-driven decisions.</p>
                </Card>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Badge className="mb-6 bg-purple-500/10 text-purple-600 border-purple-500/20 px-4 py-1">Enterprise Power</Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-8 leading-tight">
                The Most Advanced <br />
                <span className="text-purple-600">Pipeline Management</span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                We've combined ATS, CRM, and task automation into a single powerhouse. Manage thousands of candidates with the ease of a simple to-do list.
              </p>
              <Link href="/auth">
                <Button variant="link" className="text-purple-600 p-0 text-lg group">
                  Explore full feature list
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              The Results Speak for Themselves
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {recruiterStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{stat.value}</div>
                  <div className="text-slate-600 dark:text-slate-300">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI-Powered Features Section */}
      <section id="ai-features" className="py-24 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200">
              <Brain className="w-3 h-3 mr-1" />
              AI-Powered Recruitment
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Advanced AI Features for Modern Recruiters
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Leverage cutting-edge AI technology to revolutionize your hiring process and find the perfect candidates faster than ever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aiPoweredFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur relative overflow-hidden">
                  {feature.premium && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        AI Premium
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need to Hire Smarter
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Advanced recruitment tools designed to streamline your hiring process and deliver exceptional results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recruiterFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
                  <CardContent className="p-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Demo */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                See AI in Action
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Our AI-powered dashboard gives you complete visibility into candidate quality, automated scoring, and predictive insights. Make data-driven hiring decisions that accelerate your recruitment success.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span>AI-powered candidate ranking and scoring</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span>Intelligent job description optimization</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span>Predictive hiring analytics and insights</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span>Automated screening and assessment tools</span>
                </div>
              </div>

              <div className="flex space-x-4">
                <Link href="/auth">
                  <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                    Try AI Features Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-slate-900">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book AI Demo
                </Button>
              </div>
            </div>

            <div className="relative">
              <img 
                src={dashboardMockup} 
                alt="AutoJobr AI-Powered Recruitment Dashboard" 
                className="rounded-lg shadow-2xl w-full transform hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 animate-pulse animation-delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section id="success-stories" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Companies Love AutoJobr AI
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              See how leading companies are transforming their hiring with our AI-powered platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <Card key={index} className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{story.company}</h4>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-1">{story.industry}</p>
                    <p className="text-slate-500 text-sm">{story.size}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mb-6">
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Time to Hire</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{story.results.timeToHire}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Quality Hires</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{story.results.qualityHires}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Cost Savings</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{story.results.costSaving}</span>
                    </div>
                  </div>

                  <blockquote className="text-slate-600 dark:text-slate-300 italic mb-4">
                    "{story.quote}"
                  </blockquote>

                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                      {story.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{story.name}</div>
                      <div className="text-sm text-slate-500">{story.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Simple, AI-Powered Pricing
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Choose the plan that fits your hiring needs. Start with a free trial, upgrade when ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative border-0 ${
                plan.isFree 
                  ? 'ring-2 ring-green-500 bg-green-50/30 dark:bg-green-900/20' 
                  : plan.popular 
                  ? 'ring-2 ring-blue-500 bg-white dark:bg-slate-900' 
                  : 'bg-white/80 dark:bg-slate-800/80'
              } backdrop-blur`}>
                {plan.isFree && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                      <Globe className="w-3 h-3 mr-1" />
                      FREE Forever
                    </Badge>
                  </div>
                )}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      <Brain className="w-3 h-3 mr-1" />
                      AI-Powered
                    </Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                      {plan.price}
                      {plan.perMonth && <span className="text-lg text-slate-500">/month</span>}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mb-2">{plan.description}</p>
                    <p className="text-sm text-green-600 dark:text-green-400 font-semibold">{plan.savings}</p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                        <span className={`text-slate-600 dark:text-slate-300 ${feature.includes('AI') ? 'font-semibold' : ''}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/auth">
                    <Button 
                      className={`w-full ${plan.popular 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'
                      }`}
                      size="lg"
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
              How We Compare - AI Features Included
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-white">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold text-blue-600">AutoJobr</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-500">Competitor A</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-500">Competitor B</th>
                  </tr>
                </thead>
                <tbody>
                  {competitorComparison.map((row, index) => (
                    <tr key={index} className="border-b border-slate-100 dark:border-slate-700">
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{row.feature}</td>
                      <td className="py-3 px-4 text-center">
                        {typeof row.autojobr === 'boolean' ? (
                          row.autojobr ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <div className="w-5 h-5 bg-red-200 rounded-full mx-auto"></div>
                          )
                        ) : (
                          <span className="font-semibold text-blue-600">{row.autojobr}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {typeof row.competitor1 === 'boolean' ? (
                          row.competitor1 ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <div className="w-5 h-5 bg-red-200 rounded-full mx-auto"></div>
                          )
                        ) : (
                          <span className="text-slate-500">{row.competitor1}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {typeof row.competitor2 === 'boolean' ? (
                          row.competitor2 ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <div className="w-5 h-5 bg-red-200 rounded-full mx-auto"></div>
                          )
                        ) : (
                          <span className="text-slate-500">{row.competitor2}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Showcase */}
      <section className="py-24 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200">
              <Globe className="w-3 h-3 mr-1" />
              Seamless Integrations
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Connect Your Favorite Tools
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Integrate AutoJobr with your existing HR stack to streamline your recruitment workflow and enhance productivity.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {integrations.map((integration, idx) => (
              <Card 
                key={idx} 
                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur"
              >
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-12 h-12 mb-3 rounded-lg overflow-hidden flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <img 
                      src={integration.logo} 
                      alt={`${integration.name} logo`}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Fallback to a generic avatar if the image fails to load
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(integration.name)}&background=random&size=128&color=fff`;
                      }}
                    />
                  </div>
                  <h4 className="font-semibold text-sm mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {integration.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {integration.category}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl px-8 py-4 text-lg"
              onClick={() => setLocation('/integrations-marketplace')}
            >
              <Globe className="mr-2 h-5 w-5" />
              Explore Integrations Marketplace
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Hiring with AI?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join 2,500+ companies using AutoJobr's AI-powered recruitment platform to hire faster, smarter, and more effectively. 
            Start your free trial today - no setup fees, no commitments.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/auth">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl px-8 py-4 text-lg">
                <Brain className="w-5 h-5 mr-2" />
                Start AI-Powered Trial
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg">
              <Calendar className="w-5 h-5 mr-2" />
              Schedule AI Demo
            </Button>
          </div>

          <div className="text-blue-100 text-sm">
            <CheckCircle className="w-4 h-4 inline mr-2" />
            14-day free trial • Full AI features • No setup fees • Cancel anytime • Implementation support included
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={logoImage} alt="AutoJobr" className="w-8 h-8" />
                <span className="text-xl font-bold">AutoJobr</span>
              </div>
              <p className="text-slate-400 mb-4">
                AI-powered recruitment platform trusted by 2,500+ companies worldwide.
              </p>
              <div className="flex space-x-4">
                <Badge variant="outline" className="text-slate-400 border-slate-600">
                  AI-Powered
                </Badge>
                <Badge variant="outline" className="text-slate-400 border-slate-600">
                  SOC 2 Compliant
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">AI Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/auth" className="hover:text-white transition-colors">Get Started</Link></li>
                <li><a href="#ai-features" className="hover:text-white transition-colors">AI Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Live Chat</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Schedule Demo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Sales</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/cancellation-refund" className="hover:text-white transition-colors">Cancellation & Refund</Link></li>
                <li><Link href="/shipping-policy" className="hover:text-white transition-colors">Shipping & Delivery</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>&copy; 2025 AutoJobr. All rights reserved. Transforming recruitment with AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}