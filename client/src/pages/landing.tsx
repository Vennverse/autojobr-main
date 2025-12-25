import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { SEO } from "@/components/seo";
import { SEOMeta, landingPageSchema, faqSchema, breadcrumbSchema } from "@/components/seo-meta";
import { 
  Rocket, 
  Users, 
  ArrowRight,
  CheckCircle,
  Brain,
  Video,
  Briefcase,
  Sparkles,
  ChevronRight,
  Handshake,
  Play,
  TrendingUp,
  Target,
  Crown,
  Zap,
  Building2,
  Star,
  Search,
  X,
  AlertCircle,
  Clock,
  Shield,
  Lock,
  HelpCircle,
  FileText,
  BookOpen,
  Gift
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SiGoogle,
  SiApple,
  SiAmazon,
  SiNetflix,
  SiTesla,
  SiNvidia
} from "react-icons/si";
import logoImage from "@assets/generated_images/AutoJobr_professional_logo_17c702fa_optimized.png";
import interviewPrepImage from "@assets/image_1766587292974.png";

// Top companies in referral network
const topCompanies = [
  "Google", "Microsoft", "Apple", "Amazon", "Meta", "Netflix", 
  "Tesla", "Nvidia", "Spotify", "Adobe", "Salesforce", "Uber"
];

// Success metrics
const metrics = {
  referralPartners: "10,000+",
  companies: "500+",
  interviewRate: "300%",
  avgTimeToInterview: "7 days"
};

// Hero slides - 3 key value propositions
const heroSlides = [
  {
    badge: "Get Referred to Top Companies",
    title: "Skip Cold Applications. Get Seen Faster.",
    highlight: "Skip Cold Applications",
    subtitle: "Connect with employees at 500+ top companies who provide guaranteed referrals. Get 300% higher interview rates.",
    stat: "300% Higher Interview Rate",
    cta: "Get Started",
    ctaLink: "/auth",
    icon: Handshake,
    color: "from-blue-600 to-purple-600"
  },
  {
    badge: "Direct Referrals",
    title: "Connect with Verified Referrers",
    highlight: "Referrers",
    subtitle: "Get direct access to verified employees at Google, Microsoft, Amazon, Meta, and 500+ other companies ready to refer you.",
    stat: "500+ Top Companies",
    cta: "Join Now",
    ctaLink: "/auth",
    icon: Users,
    color: "from-indigo-600 to-blue-600"
  },
  {
    badge: "AI Interview Prep",
    title: "Ace Interviews with AI Feedback",
    highlight: "Real-Time",
    subtitle: "Practice realistic interviews with AI that analyzes your body language, speech clarity, and answers in real time. Get instant, actionable feedback after every response—so you know exactly what to improve before the real interview.",
    stat: "Video + Voice Analysis",
    cta: "Start Practicing",
    ctaLink: "/auth",
    icon: Video,
    color: "from-purple-600 to-pink-600"
  },
  {
    badge: "One-Click Applications",
    title: "Apply to 10x More Jobs",
    highlight: "Automatically",
    subtitle: "Auto-fill and apply across 100+ job boards with precision. Spend more time preparing, less time applying.",
    stat: "Apply 10x Faster",
    cta: "Install Extension",
    ctaLink: "/auth",
    icon: Zap,
    color: "from-green-600 to-teal-600"
  }
];

export default function LandingPage() {
  const { user } = useAuth();
  const [companySearch, setCompanySearch] = useState("");
  const [liveApplications, setLiveApplications] = useState(14789);
  const [filteredCompanies, setFilteredCompanies] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isStudent, setIsStudent] = useState(false);
  const [isJobless, setIsJobless] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Auto-rotate hero slides with pause on hover (4 slides now)
  useEffect(() => {
    if (isHovering) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 8000); // Change slide every 8 seconds
    return () => clearInterval(interval);
  }, [isHovering, currentSlide]);

  // Live application counter
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveApplications(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Company search filter
  useEffect(() => {
    if (companySearch.trim()) {
      setFilteredCompanies(
        topCompanies.filter(company => 
          company.toLowerCase().includes(companySearch.toLowerCase())
        ).slice(0, 6)
      );
    } else {
      setFilteredCompanies([]);
    }
  }, [companySearch]);

  const currentHeroSlide = heroSlides[currentSlide];

  const faqItems = [
    {
      question: "How much does AutoJobr cost?",
      answer: "AutoJobr is completely free to use with unlimited job applications, AI resume analysis, and access to our referral network. Premium features include advanced interview prep and priority referrals.",
    },
    {
      question: "Does AutoJobr really work?",
      answer: "Yes! 75,000+ users report 300% higher interview rates using AutoJobr. We use AI to optimize your applications and connect you with verified employee referrers at 500+ companies.",
    },
    {
      question: "How do I get started?",
      answer: "Sign up for free in 2 minutes, upload your resume, and start applying. Our Chrome extension auto-fills applications across 100+ job boards.",
    },
    {
      question: "Is my data safe?",
      answer: "Absolutely. We use enterprise-grade encryption, never share your data, and are fully compliant with data privacy regulations.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <SEO 
        title="Skip Cold Applications. Get Seen Faster."
        description="AI-powered job application automation platform. Auto-apply to 1000+ jobs daily, beat ATS systems, get direct referrals from 500+ top companies. 300% higher interview rates. Free forever."
      />
      <SEOMeta
        title="Skip Cold Applications. Get Seen Faster."
        description="AI-powered job application automation platform. Auto-apply to 1000+ jobs daily, beat ATS systems, get direct referrals from 500+ top companies. 300% higher interview rates. Free forever."
        keywords="job application automation, AI job search, auto apply jobs, ATS resume checker, free job automation, LinkedIn auto apply, beat ATS systems, job referrals"
        url="https://autojobr.com"
        image="https://autojobr.com/logo.png"
        schema={landingPageSchema}
      />
      
      {/* SEO Hidden Content for Search Engines - Explains all key services */}
      <div className="sr-only">
        <h2>AutoJobr: Free Job Search Automation, AI Resume Optimization, and Career Coaching</h2>
        <p>
          AutoJobr is the leading job application automation platform offering free chrome extension for auto-apply on LinkedIn and Indeed, 
          AI-powered resume optimization for ATS systems, AI interview prep with mock interviews, and career coaching. Use referral code GREGORY 
          for 7 days free premium access. AutoJobr also features a unique recruiter bidding system connecting job seekers with top recruiters, 
          plus AI-generated connection notes for LinkedIn networking. Apply to 1000+ jobs daily automatically across 500+ job boards.
        </p>
        <h3>AutoJobr Services:</h3>
        <ul>
          <li>Job application automation chrome extension - auto apply on LinkedIn, Indeed, Glassdoor</li>
          <li>AI resume optimizer - beat ATS systems with AI analysis</li>
          <li>AI interview prep - mock interviews with real-time feedback</li>
          <li>AI career coach - personalized job search guidance</li>
          <li>Recruiter bidding marketplace - get discovered by top recruiters</li>
          <li>Referral system - free premium with referral codes like GREGORY</li>
          <li>AI connection notes - LinkedIn networking optimization</li>
        </ul>
      </div>
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <img 
                src={logoImage} 
                alt="AutoJobr" 
                className="w-8 h-8 transition-transform duration-300 group-hover:rotate-12" 
              />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AutoJobr
              </span>
            </div>

            <nav className="hidden md:flex space-x-6">
              <Link href="/interview-prep-tools" className="relative text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all duration-300 group text-sm">
                AI Tools
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="#features" className="relative text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all duration-300 group text-sm">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/referral-marketplace" className="relative text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all duration-300 group text-sm">
                Referral Network
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/employee-referral-services" className="relative text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all duration-300 group text-sm">
                Become Referrer
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/employer-features" className="relative text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all duration-300 group text-sm">
                For Recruiters
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="#pricing" className="relative text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all duration-300 group text-sm">
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth?mode=login">
                <Button variant="ghost" size="sm" data-testid="button-signin">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white" data-testid="button-get-started-header">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Auto-Rotating Slider */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Simplified Background - Reduced animations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            {/* Live Stats Badge */}
            <Badge className="mb-6 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800 px-4 py-2 text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              {liveApplications.toLocaleString()} applications submitted today
            </Badge>
            
            {/* Auto-Rotating Hero Content with hover pause */}
            <div 
              className="relative min-h-[400px] flex items-center justify-center"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {heroSlides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ${
                    index === currentSlide
                      ? 'opacity-100 translate-x-0 scale-100'
                      : index < currentSlide
                      ? 'opacity-0 -translate-x-full scale-95'
                      : 'opacity-0 translate-x-full scale-95'
                  }`}
                >
                  <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                    <Badge className={`mb-6 bg-gradient-to-r ${slide.color} text-white px-4 py-2`}>
                      <slide.icon className="w-3 h-3 mr-2" />
                      {slide.badge}
                    </Badge>
                    
                    <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                      {slide.title.split(slide.highlight)[0]}
                      <span className={`bg-gradient-to-r ${slide.color} bg-clip-text text-transparent`}>
                        {slide.highlight}
                      </span>
                      {slide.title.split(slide.highlight)[1]}
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-6 max-w-4xl mx-auto">
                      {slide.subtitle}
                    </p>
                    
                    <Badge className="mb-8 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-6 py-3 text-lg">
                      <Star className="w-4 h-4 mr-2" />
                      {slide.stat}
                    </Badge>
                    
                    <Link href={slide.ctaLink}>
                      <Button 
                        size="lg" 
                        className={`bg-gradient-to-r ${slide.color} hover:opacity-90 text-white shadow-xl px-8 py-6 text-lg group`}
                        data-testid={`button-hero-${index}`}
                      >
                        <slide.icon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                        {slide.cta}
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Slide Indicators */}
            <div className="flex justify-center gap-2 mt-8">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 scale-125'
                      : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                  }`}
                  data-testid={`slider-indicator-${index}`}
                />
              ))}
            </div>

            {/* Quick Trust Indicators */}
            <div className="flex justify-center gap-6 text-sm text-slate-500 dark:text-slate-400 mt-8">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Free forever plan
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                7 days to first interview
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                No spam, guaranteed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Logos - Referrer Network */}
      <section className="py-16 bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-slate-600 dark:text-slate-300 font-medium mb-8">
              Our premium users have referrers from leading companies
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <div className="flex items-center justify-center" data-testid="logo-google">
              <SiGoogle className="w-10 h-10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors" title="Google" />
            </div>
            <div className="flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors font-bold text-lg" data-testid="logo-microsoft" title="Microsoft">
              M
            </div>
            <div className="flex items-center justify-center" data-testid="logo-apple">
              <SiApple className="w-10 h-10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors" title="Apple" />
            </div>
            <div className="flex items-center justify-center" data-testid="logo-amazon">
              <SiAmazon className="w-10 h-10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors" title="Amazon" />
            </div>
            <div className="flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors font-bold text-lg" data-testid="logo-meta" title="Meta">
              f
            </div>
            <div className="flex items-center justify-center" data-testid="logo-netflix">
              <SiNetflix className="w-10 h-10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors" title="Netflix" />
            </div>
            <div className="flex items-center justify-center" data-testid="logo-tesla">
              <SiTesla className="w-10 h-10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors" title="Tesla" />
            </div>
            <div className="flex items-center justify-center" data-testid="logo-nvidia">
              <SiNvidia className="w-10 h-10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors" title="Nvidia" />
            </div>
          </div>
        </div>
      </section>

      {/* AI Premium Products Section - Main Value Proposition */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Premium AI-Powered Tools
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Why Premium Users Get <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">3X More Interviews</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              AI-powered interview prep, resume optimization, and cover letter generation give you the competitive edge
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-br from-purple-600 to-pink-600">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Interview Prep</h3>
                  <p className="text-slate-600 dark:text-slate-300">Real-time video & voice analysis with personalized feedback for Google, Microsoft, Amazon & more</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-br from-blue-600 to-purple-600">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resume Optimization</h3>
                  <p className="text-slate-600 dark:text-slate-300">AI beats ATS systems and gets past initial screening with keyword optimization</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-br from-green-600 to-teal-600">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cover Letter Generator</h3>
                  <p className="text-slate-600 dark:text-slate-300">AI-generated, personalized cover letters for every job application</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-br from-orange-600 to-red-600">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Premium Referrals</h3>
                  <p className="text-slate-600 dark:text-slate-300">Get priority referrals from verified employees at FAANG companies</p>
                </div>
              </div>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white mt-4" size="lg" data-testid="button-try-premium">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Try Premium Free (7 Days)
                </Button>
              </Link>
            </div>

            <div className="relative">
              <img 
                src={interviewPrepImage} 
                alt="Premium Interview Prep Offerings" 
                className="rounded-lg shadow-2xl w-full h-auto" 
                data-testid="image-premium-offerings"
              />
              <div className="absolute -bottom-4 -right-4 bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Premium Includes:</p>
                <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <li>✓ Video Interview Analysis</li>
                  <li>✓ Real Company Prep</li>
                  <li>✓ Verified Referrals Included</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Social Proof Stats */}
      <section className="py-16 bg-white/50 dark:bg-slate-800/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trusted by Job Seekers Worldwide
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">{metrics.interviewRate}</div>
              <div className="text-slate-600 dark:text-slate-300 font-semibold">Higher Interview Rate</div>
              <div className="text-xs text-slate-500 mt-1">vs. regular applications</div>
            </div>
            <div className="group hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">{metrics.referralPartners}</div>
              <div className="text-slate-600 dark:text-slate-300 font-semibold">Active Referrers</div>
              <div className="text-xs text-slate-500 mt-1">ready to help you</div>
            </div>
            <div className="group hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">{metrics.companies}</div>
              <div className="text-slate-600 dark:text-slate-300 font-semibold">Top Companies</div>
              <div className="text-xs text-slate-500 mt-1">including FAANG</div>
            </div>
            <div className="group hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">{metrics.avgTimeToInterview}</div>
              <div className="text-slate-600 dark:text-slate-300 font-semibold">To First Interview</div>
              <div className="text-xs text-slate-500 mt-1">average time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose AutoJobr - Comparison */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Why AutoJobr Wins Every Time
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Stop wasting time with outdated job search methods
            </p>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700">
                {/* Traditional Way */}
                <div className="p-6 bg-red-50/50 dark:bg-red-900/10">
                  <h3 className="text-xl font-bold mb-6 text-red-700 dark:text-red-400">❌ Traditional Way</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start text-slate-600 dark:text-slate-400">
                      <X className="w-4 h-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Manually apply to 100s of jobs</span>
                    </li>
                    <li className="flex items-start text-slate-600 dark:text-slate-400">
                      <X className="w-4 h-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>2% response rate from cold apps</span>
                    </li>
                    <li className="flex items-start text-slate-600 dark:text-slate-400">
                      <X className="w-4 h-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Resume rejected by ATS</span>
                    </li>
                    <li className="flex items-start text-slate-600 dark:text-slate-400">
                      <X className="w-4 h-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>No interview practice</span>
                    </li>
                    <li className="flex items-start text-slate-600 dark:text-slate-400">
                      <X className="w-4 h-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Weeks to get first interview</span>
                    </li>
                  </ul>
                </div>

                {/* Other Platforms */}
                <div className="p-6 bg-yellow-50/50 dark:bg-yellow-900/10">
                  <h3 className="text-xl font-bold mb-6 text-yellow-700 dark:text-yellow-400">⚠️ Other Platforms</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start text-slate-600 dark:text-slate-400">
                      <AlertCircle className="w-4 h-4 mr-2 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>Generic auto-apply (gets flagged)</span>
                    </li>
                    <li className="flex items-start text-slate-600 dark:text-slate-400">
                      <AlertCircle className="w-4 h-4 mr-2 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>Basic resume scanning only</span>
                    </li>
                    <li className="flex items-start text-slate-600 dark:text-slate-400">
                      <AlertCircle className="w-4 h-4 mr-2 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>No referral network</span>
                    </li>
                    <li className="flex items-start text-slate-600 dark:text-slate-400">
                      <AlertCircle className="w-4 h-4 mr-2 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>Limited AI capabilities</span>
                    </li>
                    <li className="flex items-start text-slate-600 dark:text-slate-400">
                      <AlertCircle className="w-4 h-4 mr-2 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>Expensive ($50-100/month)</span>
                    </li>
                  </ul>
                </div>

                {/* AutoJobr */}
                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                  <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">✅ AutoJobr</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start text-slate-700 dark:text-slate-300 font-medium">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Direct referrals (300% higher rate)</span>
                    </li>
                    <li className="flex items-start text-slate-700 dark:text-slate-300 font-medium">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>AI-powered smart applications</span>
                    </li>
                    <li className="flex items-start text-slate-700 dark:text-slate-300 font-medium">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>ATS optimization + real feedback</span>
                    </li>
                    <li className="flex items-start text-slate-700 dark:text-slate-300 font-medium">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Video AI interview practice</span>
                    </li>
                    <li className="flex items-start text-slate-700 dark:text-slate-300 font-medium">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>7 days to first interview</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Unique Features - Only 4 Key Differentiators */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Your Complete Job Search Arsenal
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Everything you need to land interviews faster
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Referral Network */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-blue-100 dark:border-blue-900">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Handshake className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Direct Referral Network</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Connect with verified employees at Google, Microsoft, Amazon and 500+ companies who provide <strong>guaranteed referrals</strong> that bypass HR.
                </p>
                <Link href="/referral-marketplace">
                  <Button variant="outline" className="group/btn" data-testid="button-explore-referrals">
                    Explore Referral Partners
                    <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Feature 2: AI Cover Letters */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-purple-100 dark:border-purple-900">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">AI Cover Letter Generator</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Generate <strong>personalized, compelling cover letters</strong> in seconds. Tailored to each job using AI that understands what recruiters want to see.
                </p>
                <Link href="/cover-letter-generator">
                  <Button variant="outline" className="group/btn" data-testid="button-generate-cover-letter">
                    Generate Cover Letter
                    <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Feature 3: Resume Analysis */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-green-100 dark:border-green-900">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">ATS Resume Optimizer</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Get instant <strong>ATS score + optimization tips</strong>. Our AI analyzes your resume like real ATS systems and shows exactly what to fix.
                </p>
                <Link href="/resumes">
                  <Button variant="outline" className="group/btn" data-testid="button-analyze-resume">
                    Analyze Resume Free
                    <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Feature 4: AI Video Interview */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-orange-100 dark:border-orange-900">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Video className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">AI Video Interview Practice</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Practice with AI interviewers that analyze your <strong>body language, speech, and answers</strong> in real-time. Get instant feedback.
                </p>
                <Link href="/virtual-interview/new">
                  <Button variant="outline" className="group/btn" data-testid="button-start-practice">
                    <Play className="w-4 h-4 mr-2" />
                    Start Practicing Free
                    <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Feature 5: Smart Job Search */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-indigo-100 dark:border-indigo-900">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Search className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">AI-Powered Job Search</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Find <strong>perfectly matched jobs</strong> from 100+ job boards. Our AI learns your preferences and shows only relevant opportunities.
                </p>
                <Link href="/jobs">
                  <Button variant="outline" className="group/btn" data-testid="button-search-jobs">
                    Search Jobs Now
                    <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Feature 6: Chrome Extension */}
            <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-yellow-100 dark:border-yellow-900">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">One-Click Applications</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  Apply to jobs in <strong>1 click</strong> across 100+ job boards. Human-like applications that pass ATS and never get flagged.
                </p>
                <Button variant="outline" className="group/btn" data-testid="button-install-extension">
                  <Crown className="w-4 h-4 mr-2" />
                  Install Extension
                  <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Success Stories - Compact */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Real People, Real Results
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Alex Chen",
                role: "Software Engineer @ Google",
                quote: "Got my Google referral through AutoJobr. Interviewed within 5 days!",
                avatar: "👨‍💻"
              },
              {
                name: "Sarah Johnson",
                role: "Product Manager @ Microsoft",
                quote: "The video interview practice was a game-changer. Felt so prepared!",
                avatar: "👩‍💼"
              },
              {
                name: "Marcus Williams",
                role: "Data Scientist @ Netflix",
                quote: "Applied to 50 jobs in one day with the Chrome extension. Got 8 interviews.",
                avatar: "🧑‍🔬"
              }
            ].map((testimonial, idx) => (
              <Card key={idx} className="bg-white/10 backdrop-blur border-white/20 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-3xl mr-3">{testimonial.avatar}</div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-blue-100">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-blue-50 italic">"{testimonial.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing with Discounts & Special Offers */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 animate-pulse">
              <Gift className="w-4 h-4 mr-2" />
              Limited Time: Unlock up to 35% discount with our special offers
            </Badge>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-2">
              Choose the plan that fits your needs
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
              <Users className="w-4 h-4" />
              <span>10,000+ users getting hired faster</span>
            </div>
          </div>

          {/* Special Discounts Section */}
          <Card className="mb-12 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left side - Discount Info */}
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Gift className="w-6 h-6 text-green-600" />
                    Special Discounts Available
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border-l-4 border-green-600">
                      <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-slate-900 dark:text-white">Student Discount</span>
                        <Badge className="bg-green-600 text-white">-15%</Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Valid with student email or ID</p>
                    </div>
                    
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border-l-4 border-green-600">
                      <div className="flex items-center gap-3 mb-2">
                        <Briefcase className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-slate-900 dark:text-white">Jobless Discount</span>
                        <Badge className="bg-green-600 text-white">-20%</Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">We support your career transition</p>
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border-l-4 border-green-600">
                      <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-slate-900 dark:text-white">Combine Both</span>
                        <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">-35%</Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Student + Jobless = save the most</p>
                    </div>
                  </div>
                </div>

                {/* Right side - Discount Selector & Examples */}
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Claim Your Discount</h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/30 cursor-pointer transition-colors"
                         onClick={() => setIsStudent(!isStudent)}>
                      <Checkbox 
                        checked={isStudent}
                        onCheckedChange={setIsStudent}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">I'm a Student</span>
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/30 cursor-pointer transition-colors"
                         onClick={() => setIsJobless(!isJobless)}>
                      <Checkbox 
                        checked={isJobless}
                        onCheckedChange={setIsJobless}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Currently Jobless</span>
                    </div>
                  </div>

                  {(isStudent || isJobless) && (
                    <div className="mt-4 p-3 rounded-lg bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                        Your Discount: {(isStudent ? 15 : 0) + (isJobless ? 20 : 0)}% off
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Apply this at checkout on our pricing page
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Free Forever Plan */}
            <Card className="border-2 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="text-center mb-4">
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    🌱 Free Forever
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-center text-slate-900 dark:text-white">FREE PLAN</h3>
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-slate-900 dark:text-white">$0
                    <span className="text-lg text-slate-500 dark:text-slate-400">/mo</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Always free</p>
                </div>
                <p className="text-sm text-center text-slate-600 dark:text-slate-300 mb-6 italic">
                  Perfect for starting your journey.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "100+ Job Applications/mo",
                    "Basic AI Resume Analysis",
                    "Access to Referral Network",
                    "Chrome Extension for Auto-fill",
                    "Community Support"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth">
                  <Button className="w-full group-hover:shadow-lg transition-all" variant="outline" size="lg" data-testid="button-free-plan">
                    Start for Free
                  </Button>
                </Link>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-3">No credit card required</p>
              </CardContent>
            </Card>

            {/* Monthly Access Plan */}
            <Card className="border-2 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="text-center mb-4">
                  <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                    ⚡ Flexible Plan
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-center text-slate-900 dark:text-white">MONTHLY ACCESS</h3>
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-slate-900 dark:text-white">$19
                    <span className="text-lg text-slate-500 dark:text-slate-400">/mo</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">$0.63/day</p>
                </div>
                <p className="text-sm text-center text-slate-600 dark:text-slate-300 mb-6 italic">
                  Try full access for a month — no subscription.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Same AI tools & Resume Builder",
                    "Ideal for quick job hunts",
                    "Upgrade anytime to save 30%",
                    "Full access — no auto-renew"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/job-seeker-premium">
                  <Button className="w-full group-hover:shadow-lg transition-all" variant="outline" size="lg" data-testid="button-monthly-access">
                    Start Monthly — $19
                  </Button>
                </Link>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-3">One-time payment • No auto-renew</p>
              </CardContent>
            </Card>

            {/* Smart Saver Plan - Most Popular */}
            <Card className="border-2 border-green-500 relative shadow-2xl hover:shadow-3xl transition-all duration-300 scale-105 md:scale-100 lg:scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-1 shadow-lg">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  MOST POPULAR
                </Badge>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-4">
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    🏷️ Smart Saver
                  </Badge>
                  <Badge className="mt-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800">
                    💚 Save $26–72/year
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-center text-slate-900 dark:text-white">SMART SAVER</h3>
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-green-600 dark:text-green-400">$13
                    <span className="text-lg text-slate-500 dark:text-slate-400">/mo</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-2">With discount: from $11.05/mo</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">$0.43/day — less than a coffee</p>
                </div>
                <p className="text-sm text-center text-slate-600 dark:text-slate-300 mb-6 italic">
                  Everything you need to get hired — faster.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Unlimited Resumes & Job Tracking",
                    "AI Resume & Cover Letter Builder",
                    "LinkedIn & ATS Optimization",
                    "Chrome Extension - One-Click Apply",
                    "Interview Practice Tools",
                    "72% got interviews in 3 weeks"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/job-seeker-premium">
                  <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all" size="lg" data-testid="button-smart-saver">
                    Get Started — $13/mo
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-3">Auto-renew • Cancel anytime</p>
              </CardContent>
            </Card>

            {/* Ultra Plan */}
            <Card className="border-2 border-blue-500 hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="text-center mb-4">
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    💎 Premium Experience
                  </Badge>
                  <Badge className="mt-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    ✨ Save $48/year
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-center text-slate-900 dark:text-white">ULTRA PLAN</h3>
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">$24
                    <span className="text-lg text-slate-500 dark:text-slate-400">/mo</span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-2">With discount: from $15.60/mo</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">$0.80/day</p>
                </div>
                <p className="text-sm text-center text-slate-600 dark:text-slate-300 mb-6 italic">
                  Go beyond applications — accelerate your entire career.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Everything in Smart Saver, plus:",
                    "Unlimited AI Applications & Interviews",
                    "Video Interview Prep + AI Feedback",
                    "Career Analytics & Salary Coach",
                    "Priority Referrals & Early Job Access",
                    "24-hour Priority Support"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/job-seeker-premium">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white group-hover:shadow-lg transition-all" size="lg" data-testid="button-ultra-plan">
                    Upgrade to Ultra — $24/mo
                    <Crown className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-3">Auto-renew • Cancel anytime</p>
              </CardContent>
            </Card>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 items-center text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-600" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>30-Day Money Back</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-600" />
              <span>Instant Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section with Schema Markup */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        {faqSchema && (
          <script type="application/ld+json">
            {JSON.stringify(faqSchema(faqItems))}
          </script>
        )}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Everything you need to know about AutoJobr
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How does the referral network actually work?",
                a: "Our network consists of verified employees at 500+ top companies who are willing to refer qualified candidates. When you match with a referrer, they review your profile and provide a direct internal referral to the hiring team, bypassing the traditional HR screening process. This increases your interview rate by 300%."
              },
              {
                q: "Will my auto-applications get flagged as spam?",
                a: "No! Unlike other platforms that use obvious bot patterns, our Chrome extension mimics human behavior with randomized timing, natural mouse movements, and personalized responses. We've helped users submit 100,000+ applications with a 0% flag rate."
              },
              {
                q: "How is the AI interview practice different from others?",
                a: "Our AI analyzes not just your words, but your body language, facial expressions, tone of voice, and speaking pace in real-time. You get instant feedback on confidence levels, filler words, eye contact, and more - just like a real interviewer would notice."
              },
              {
                q: "Can I really get interviews in 7 days?",
                a: "Yes! Our users who get referrals typically receive interview requests within 5-10 days. The referral network dramatically speeds up the process because you skip HR screening and go directly to hiring managers."
              },
              {
                q: "What if I don't get results?",
                a: "We offer a 30-day money-back guarantee. If you don't get at least one interview within 30 days of actively using our platform (applying to 20+ jobs, using AI tools, seeking referrals), we'll refund you completely."
              },
              {
                q: "Is my data secure and private?",
                a: "Absolutely. We use bank-level encryption (SSL/TLS), never sell your data, and you control exactly what information is shared with referrers. Your resume and personal details are only visible to people you choose to connect with."
              }
            ].map((faq, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-start">
                    <HelpCircle className="w-5 h-5 mr-3 text-blue-600 mt-0.5 flex-shrink-0" />
                    {faq.q}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 ml-8">
                    {faq.a}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white text-center px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Get Referred?
          </h2>
          <p className="text-xl mb-8 text-blue-50">
            Join {metrics.referralPartners} job seekers who landed interviews through our referral network
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/referral-marketplace">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg group" data-testid="button-final-cta-referrals">
                <Handshake className="w-5 h-5 mr-2" />
                Browse Referral Partners
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg group" data-testid="button-final-cta-start">
                <Rocket className="w-5 h-5 mr-2" />
                Start Free Today
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={logoImage} alt="AutoJobr" className="w-8 h-8" />
                <span className="text-white font-bold">AutoJobr</span>
              </div>
              <p className="text-sm">
                Get referred to your dream company
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/referral-marketplace" className="hover:text-white transition-colors">Referral Network</Link></li>
                <li><Link href="/virtual-interview/new" className="hover:text-white transition-colors">AI Interviews</Link></li>
                <li><Link href="/freelance-marketplace" className="hover:text-white transition-colors">Freelance Projects</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/university-partnership" className="hover:text-white transition-colors">University Partnership</Link></li>
                <li><Link href="/for-recruiters" className="hover:text-white transition-colors">For Recruiters</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-sm">
            <p>&copy; 2025 AutoJobr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
