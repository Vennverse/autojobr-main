
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Cpu
} from "lucide-react";
import logoImage from "@assets/generated_images/AutoJobr_professional_logo_17c702fa.png";
import dashboardMockup from "@assets/generated_images/Recruitment_dashboard_mockup_2b680657.png";

const recruiterStats = [
  { label: "Time Saved", value: "60%", icon: Clock },
  { label: "Quality Hires", value: "85%", icon: Award },
  { label: "Cost Reduction", value: "40%", icon: TrendingUp },
  { label: "Faster Hiring", value: "3x", icon: Zap }
];

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
    name: "Starter",
    price: "$99",
    description: "Perfect for small teams",
    features: [
      "Up to 5 job postings/month",
      "Basic candidate matching",
      "Standard support",
      "Core analytics",
      "Email integration"
    ],
    cta: "Start Free Trial",
    popular: false,
    savings: "vs $300/month on other platforms"
  },
  {
    name: "Professional", 
    price: "$299",
    description: "For growing companies",
    features: [
      "Unlimited job postings",
      "Advanced AI matching",
      "AI candidate scoring & ranking",
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
    savings: "vs $800/month on other platforms"
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations",
    features: [
      "Everything in Professional",
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
    cta: "Contact Sales",
    popular: false,
    savings: "50-70% cost reduction typical"
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
    autojobr: "From $99/mo", 
    competitor1: "From $300/mo", 
    competitor2: "From $250/mo" 
  }
];

export default function RecruiterFeaturesPage() {
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Ensure page is visible
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Add error boundary
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Page error:', event.error);
      event.preventDefault();
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative border-0 ${plan.popular ? 'ring-2 ring-blue-500 bg-white dark:bg-slate-900' : 'bg-white/80 dark:bg-slate-800/80'} backdrop-blur`}>
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
                      {plan.price !== "Custom" && <span className="text-lg text-slate-500">/month</span>}
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
