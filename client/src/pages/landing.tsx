import { useState, useEffect, useRef } from "react";

// Performance optimized - removed lazy loading for faster initial render
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  Users, 
  Zap, 
  Award, 
  TrendingUp, 
  Clock, 
  Target,
  ArrowRight,
  CheckCircle,
  Star,
  Brain,
  Shield,
  BarChart3,
  MessageCircle,
  FileText,
  Crown,
  ChevronRight,
  Briefcase,
  Search,
  Filter,
  Eye,
  Sparkles,
  Globe,
  Layers,
  ChevronLeft,
  Building2
} from "lucide-react";
import logoImage from "@assets/generated_images/AutoJobr_professional_logo_17c702fa_optimized.png";
import heroBackground from "@assets/generated_images/Professional_hero_background_15f13bf2_optimized.png";
import dashboardMockup from "@assets/generated_images/Recruitment_dashboard_mockup_2b680657_optimized.png";
import referralMarketplace from "@assets/generated_images/Referral_marketplace_interface_design_86e419f3_optimized.png";
import atsComparisonImage from "@assets/generated_images/Extension_ATS_bypass_comparison_6bd77ec6_optimized.png";
import bundlesImage from "@assets/generated_images/Subscription_bundles_showcase_design_d57dc5e6_optimized.png";
import genuineApplicationImage from "@assets/generated_images/Genuine_application_creation_illustration_3166e23e_optimized.png";
// Removed unused emotional struggle images for better performance

// Removed stats array - replaced with more compelling social proof section

const features = [
  {
    icon: Brain,
    title: "AI-Powered Matching",
    description: "Advanced algorithms match candidates with perfect-fit opportunities based on skills, experience, and culture."
  },
  {
    icon: Zap,
    title: "Lightning Fast Hiring", 
    description: "Reduce time-to-hire by 60% with automated screening, instant notifications, and streamlined workflows."
  },
  {
    icon: Shield,
    title: "Genuine Applications That Pass ATS",
    description: "Unlike other bots that get cancelled, our system creates authentic applications that bypass ATS detection and reach real recruiters."
  },
  {
    icon: Users,
    title: "Employee Referral Network",
    description: "Tap into our exclusive network of 10,000+ employees at Fortune 500 companies who provide internal referrals, increasing your interview chances by 300%."
  },
  {
    icon: Layers,
    title: "Verified Referral Partners",
    description: "Work with verified employees at Google, Microsoft, Apple, and 500+ top companies who guarantee genuine referrals that bypass HR filters and reach hiring managers directly."
  },
  {
    icon: Crown,
    title: "Chrome Extension Advantage",
    description: "Our intelligent extension creates human-like applications across 100+ job boards, ensuring you never get flagged as a bot."
  }
];

const testimonials = [
  {
    name: "Alex Thompson",
    role: "Software Engineer",
    company: "Google",
    image: "👨‍💻",
    quote: "Landed my dream internship at Google through AutoJobr's referral network. The AI interview prep was incredibly realistic and helped me ace the technical rounds!"
  },
  {
    name: "Maya Patel", 
    role: "Product Manager",
    company: "Meta",
    image: "👩‍💼",
    quote: "As a new grad, I was overwhelmed by job applications. AutoJobr's Chrome extension saved me hours and their task management kept me organized. Got 5 interviews in my first week!"
  },
  {
    name: "Jordan Kim",
    role: "Data Analyst",
    company: "Netflix",
    image: "🧑‍🔬",
    quote: "The virtual interviews feature was a game-changer. I practiced until I felt confident, then landed my first job at Netflix. The referral marketplace connected me with the hiring manager directly!"
  }
];

const jobSeekerPlans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "Unlimited job applications",
      "2 AI cover letter generations/day",
      "3 resume uploads",
      "Basic Chrome extension auto-fill",
      "Standard support"
    ],
    cta: "Start Free",
    popular: false,
    href: "/auth"
  },
  {
    name: "Premium",
    price: "$10",
    description: "For serious job seekers",
    features: [
      "Everything in Free",
      "Unlimited AI cover letter generations",
      "Unlimited resume uploads & analysis",
      "Advanced resume optimization",
      "Premium job recommendations",
      "Interview preparation & mock sessions",
      "Salary insights & negotiation tips",
      "Priority support"
    ],
    cta: "Upgrade to Premium",
    popular: true,
    href: "/subscription"
  }
];

const recruiterPlans = [
  {
    name: "Basic",
    price: "$0",
    description: "Get started with hiring",
    features: [
      "2 active job postings",
      "20 applicants per job",
      "Basic resume viewing",
      "Standard candidate screening",
      "Email support"
    ],
    cta: "Start Free",
    popular: false,
    href: "/auth"
  },
  {
    name: "Premium",
    price: "$49",
    description: "For professional recruiters",
    features: [
      "Unlimited job postings",
      "Unlimited applicants per job",
      "Premium AI candidate matching",
      "Advanced resume analytics",
      "Custom assessment creation",
      "Background check integration",
      "Advanced analytics dashboard",
      "API access & integrations",
      "Priority support"
    ],
    cta: "Upgrade to Premium",
    popular: true,
    href: "/recruiter/premium"
  }
];

// Removed AnimatedCounter component - no longer needed

// Floating Particles Component
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-float"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

// Typing Animation Component
interface TypingAnimationProps {
  texts: string[];
  speed?: number;
  deleteSpeed?: number;
  pauseTime?: number;
}

const TypingAnimation = ({ texts, speed = 100, deleteSpeed = 50, pauseTime = 2000 }: TypingAnimationProps) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[currentIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentText.length) {
          setDisplayText(currentText.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentIndex((prev) => (prev + 1) % texts.length);
        }
      }
    }, isDeleting ? deleteSpeed : speed);

    return () => clearTimeout(timeout);
  }, [displayText, currentIndex, isDeleting, texts, speed, deleteSpeed, pauseTime]);

  return (
    <span className="inline-block">
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
    
    // Mouse tracking for parallax effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <FloatingParticles />
      
      {/* Morphing Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-purple-400/5 to-pink-400/5 animate-gradient-shift"></div>
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 group">
              <img 
                src={logoImage} 
                alt="AutoJobr" 
                className="w-8 h-8 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" 
              />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-purple-600 hover:to-pink-600 transition-all duration-300">
                AutoJobr
              </span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="#features" className="relative text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all duration-300 group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/employee-referral-services" className="relative text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all duration-300 group">
                Referrals
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="#pricing" className="relative text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all duration-300 group">
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/recruiter-features" className="relative text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all duration-300 group">
                For Recruiters
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="ghost" size="sm" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 hover:scale-105">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden group">
                  <span className="relative z-10">Get Started Free</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Parallax Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-5 transition-transform duration-1000"
          style={{ 
            backgroundImage: `url(${heroBackground})`,
            transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * 10}px)`
          }}
        />
        
        {/* Floating Geometric Shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full animate-bounce-slow"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-lg rotate-45 animate-spin-slow"></div>
          <div className="absolute bottom-40 left-20 w-12 h-12 bg-gradient-to-r from-pink-400/10 to-blue-400/10 rounded-full animate-pulse"></div>
          <div className="absolute top-60 right-40 w-8 h-8 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full animate-ping"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200 hover:scale-105 transition-transform duration-300 cursor-pointer">
                <Rocket className="w-3 h-3 mr-1 animate-bounce" />
                #1 AI-Powered Job Platform
                <Sparkles className="w-3 h-3 ml-1 animate-pulse" />
              </Badge>
              
              <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                Land Your
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x"> Dream Job</span>
                <br />
                In Days, Not Months
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Skip the endless applications. Get <strong>referred directly</strong> to hiring managers at top companies. Our AI tools + referral network = your fast track to internships and full-time roles.
              </p>
              
              {/* Key Features Preview */}
              <div className="mb-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300 hover:scale-105">
                  <Users className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Referral Network</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Get referred by employees at 500+ top companies</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300 hover:scale-105">
                  <Brain className="w-8 h-8 mx-auto mb-3 text-purple-500" />
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">AI Interview Prep</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Virtual interviews with real-time feedback</p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300 hover:scale-105">
                  <Target className="w-8 h-8 mx-auto mb-3 text-green-500" />
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Smart Job Tracking</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Manage applications with AI-powered insights</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link href="/auth">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg relative overflow-hidden group" data-testid="button-get-started">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Rocket className="w-5 h-5 mr-2 relative z-10 group-hover:animate-bounce" />
                    <span className="relative z-10">Start Landing Interviews</span>
                    <ArrowRight className="w-5 h-5 ml-2 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
                <Link href="/referral-marketplace">
                  <Button variant="outline" size="lg" className="border-2 border-slate-300 hover:border-slate-400 px-8 py-4 text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 hover:scale-105 group" data-testid="button-referral-marketplace">
                    <Users className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                    Referral Marketplace
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
              </div>
              
              <div className="flex justify-center space-x-8 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Free to start
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Setup in 2 minutes
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof & Signup Incentive Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-400/5 to-pink-400/5"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Urgency Banner */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg animate-pulse mb-6">
              <Clock className="w-4 h-4 mr-2" />
              <span className="font-semibold">Limited Time: Free Premium Trial for First 1000 Users!</span>
              <Sparkles className="w-4 h-4 ml-2" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              "Got 5 Interviews in My First Week Using AutoJobr"
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-8">
              Skip the black hole of online applications. Get direct access to hiring managers through our verified referral network.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mb-12 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Crown className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
              <h3 className="font-semibold mb-2">Chrome Extension</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Auto-fill applications across 100+ job boards</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
              <MessageCircle className="w-8 h-8 mx-auto mb-3 text-blue-500" />
              <h3 className="font-semibold mb-2">AI Interviews</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Practice with virtual interviewers</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
              <BarChart3 className="w-8 h-8 mx-auto mb-3 text-green-500" />
              <h3 className="font-semibold mb-2">Task Management</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Track applications and follow-ups</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Users className="w-8 h-8 mx-auto mb-3 text-purple-500" />
              <h3 className="font-semibold mb-2">Referral Network</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Connect with 10K+ employees</p>
            </div>
          </div>
          
          {/* Success Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Average Time to Job */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">14 Days</div>
              <div className="text-slate-600 dark:text-slate-300 mb-4">From broke to breakthrough</div>
              <div className="text-sm text-slate-500 italic">vs years of rejection and despair</div>
            </div>

            {/* Success Rate */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform duration-300">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-blue-600 mb-2">89%</div>
              <div className="text-slate-600 dark:text-slate-300 mb-4">Finally escape job search hell</div>
              <div className="text-sm text-slate-500 italic">Your nightmare ends here</div>
            </div>

            {/* Salary Increase */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform duration-300">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-purple-600 mb-2">+35%</div>
              <div className="text-slate-600 dark:text-slate-300 mb-4">More money for your family</div>
              <div className="text-sm text-slate-500 italic">Finally afford that life you deserve</div>
            </div>
          </div>

          {/* Success Stats - No Image */}
          <div className="mb-8 max-w-5xl mx-auto text-center">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">Join 50,000+ Students & New Grads Who Landed Jobs</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
                <div>
                  <div className="text-3xl font-bold">2.3x</div>
                  <div className="text-blue-100">Faster Interview Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">89%</div>
                  <div className="text-blue-100">Job Offer Success</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">14 days</div>
                  <div className="text-blue-100">Average Time to Offer</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Live Activity Feed */}
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-2xl p-8 shadow-xl mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
                <Globe className="w-6 h-6 mr-2 text-green-500 animate-pulse" />
                Live Activity
              </h3>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live
              </Badge>
            </div>
            
            <div className="space-y-4">
              {[
                { name: "Sarah M.", action: "escaped 6 months of unemployment", time: "2 min ago", location: "San Francisco", emotion: "😭→😊" },
                { name: "Mike R.", action: "finally got his confidence back", time: "5 min ago", location: "New York", emotion: "💪" },
                { name: "Lisa K.", action: "can finally afford her daughter's college", time: "8 min ago", location: "Austin", emotion: "🙏" },
                { name: "David L.", action: "proved his family wrong at Microsoft", time: "12 min ago", location: "Seattle", emotion: "🎉" },
              ].map((activity, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 rounded-lg hover:scale-102 transition-all duration-300"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                      {activity.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center">
                        {activity.name} {activity.action} <span className="ml-2">{activity.emotion}</span>
                      </div>
                      <div className="text-sm text-slate-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {activity.time} • {activity.location}
                      </div>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Modern Call to Action */}
          <div className="mb-12 max-w-4xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Start Your Career Journey Today</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">Join thousands of students and new grads who've fast-tracked their careers</p>
              <Link href="/auth">
                <Button size="lg" className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Rocket className="w-5 h-5 mr-2" />
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl">
              <h3 className="text-3xl font-bold text-white mb-4">
                Ready to Be Next? Start Your Success Story Today!
              </h3>
              <p className="text-blue-100 mb-6 text-lg">
                Join now and get instant access to our AI job matching, resume optimization, and interview prep tools.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <Link href="/auth">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl px-8 py-4 text-lg transition-all duration-300 hover:scale-105 group">
                    <Rocket className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                    Start Free Trial Now
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
                <div className="text-white/80 text-sm">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  No credit card required • Cancel anytime
                </div>
              </div>

              {/* Trust indicators */}
              <div className="flex justify-center items-center space-x-6 text-white/60 text-sm">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  SSL Secured
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  50K+ Active Users
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 fill-current text-yellow-400" />
                  4.9/5 Rating
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ATS Bypass Advantage Section */}
      <section className="py-20 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 dark:from-red-900/10 dark:via-orange-900/10 dark:to-yellow-900/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-6 bg-red-100 text-red-700 border-red-200 hover:scale-105 transition-transform duration-300">
                <Shield className="w-3 h-3 mr-1" />
                Critical Advantage
              </Badge>
              
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                Why Other Bots 
                <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent"> Fail</span>
              </h2>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">✗</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Other Automation Tools Get Cancelled</h3>
                    <p className="text-slate-600 dark:text-slate-300">Most job boards and ATS systems detect and automatically reject applications from bots, wasting your time and burning bridges.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">AutoJobr Creates Genuine Applications</h3>
                    <p className="text-slate-600 dark:text-slate-300">Our intelligent system mimics human behavior, ensuring your applications pass all ATS filters and reach real recruiters.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">⚡</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Smart Extension Technology</h3>
                    <p className="text-slate-600 dark:text-slate-300">Works seamlessly across 100+ job boards including LinkedIn, Indeed, Glassdoor, and company career pages.</p>
                  </div>
                </div>
              </div>
              
              <Link href="/chrome-extension">
                <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Shield className="w-5 h-5 mr-2" />
                  Download Chrome Extension
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={atsComparisonImage} 
                  alt="ATS Bypass Comparison" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              {/* Floating success indicators */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold animate-bounce">
                ✓ ATS Approved
              </div>
              <div className="absolute bottom-4 -left-4 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold animate-pulse">
                🔒 Human-Like Applications
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Marketplace Section */}
      <section className="py-20 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/10 dark:via-blue-900/10 dark:to-indigo-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={referralMarketplace} 
                  alt="Referral Marketplace" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              {/* Floating network indicators */}
              <div className="absolute -top-4 -left-4 bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold animate-bounce">
                🤝 50K+ Referrers
              </div>
              <div className="absolute bottom-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold animate-pulse">
                💰 Earn Rewards
              </div>
            </div>
            
            <div>
              <Badge className="mb-6 bg-purple-100 text-purple-700 border-purple-200 hover:scale-105 transition-transform duration-300">
                <Users className="w-3 h-3 mr-1" />
                Referral Marketplace
              </Badge>
              
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                Get Referred by 
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> Insiders</span>
              </h2>
              
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
                Connect with employees at your dream companies who can refer you internally. Referred candidates are 5x more likely to get hired!
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-slate-700 dark:text-slate-300">Access 50,000+ employee referrers at top companies</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-slate-700 dark:text-slate-300">Automated matching based on your skills and target roles</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-slate-700 dark:text-slate-300">Secure messaging and collaboration tools</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-slate-700 dark:text-slate-300">Earn rewards by referring other candidates</span>
                </div>
              </div>
              
              <Link href="/referral-marketplace">
                <Button className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Users className="w-5 h-5 mr-2" />
                  Explore Referral Network
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Why Choose AutoJobr?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Powerful AI technology meets intuitive design to create the ultimate job search and recruitment platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="group hover:shadow-xl transition-all duration-500 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur hover:bg-white/90 dark:hover:bg-slate-800/90 hover:scale-105 hover:-translate-y-2"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: isVisible ? 'fadeInUp 0.6s ease-out forwards' : 'none'
                  }}
                >
                  <CardContent className="p-8 relative overflow-hidden">
                    {/* Hover gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/25">
                        <Icon className="w-6 h-6 text-white group-hover:animate-pulse" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{feature.title}</h3>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">{feature.description}</p>
                    </div>
                    
                    {/* Animated border */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ padding: '1px' }}>
                      <div className="w-full h-full bg-white dark:bg-slate-800 rounded-lg"></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Preview */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Experience the Future of Hiring
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Our advanced dashboard provides real-time insights, AI-powered recommendations, and seamless collaboration tools that transform how you hire and get hired.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span>Real-time candidate matching and job recommendations</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span>Advanced analytics and performance tracking</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span>Integrated communication and collaboration tools</span>
                </div>
              </div>
              
              <Link href="/auth">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                  Try the Platform Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-300"></div>
              <img 
                src={dashboardMockup} 
                alt="AutoJobr Dashboard" 
                className="relative rounded-lg shadow-2xl w-full transform hover:scale-105 transition-all duration-500 hover:shadow-3xl"
                style={{
                  transform: `perspective(1000px) rotateY(${mousePosition.x * 5}deg) rotateX(${mousePosition.y * -5}deg)`
                }}
              />
              
              {/* Floating elements around the dashboard */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 animate-pulse group-hover:animate-bounce"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 animate-pulse group-hover:animate-spin-slow" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-10 -left-6 w-16 h-16 bg-gradient-to-r from-pink-500 to-blue-500 rounded-lg opacity-15 animate-float group-hover:animate-bounce" style={{ animationDelay: '2s' }}></div>
              <div className="absolute -top-6 left-1/3 w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-25 animate-ping group-hover:animate-pulse"></div>
              
              {/* Interactive overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              See how AutoJobr is transforming careers and companies worldwide
            </p>
          </div>
          
          {/* Testimonial Carousel */}
          <div className="relative">
            <div className="flex justify-center mb-8">
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentTestimonial 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 scale-125' 
                        : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card 
                  key={index} 
                  className={`border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur transition-all duration-500 hover:scale-105 hover:shadow-xl ${
                    index === currentTestimonial 
                      ? 'ring-2 ring-blue-500 shadow-xl scale-105' 
                      : 'hover:shadow-lg'
                  }`}
                >
                  <CardContent className="p-8 relative overflow-hidden">
                    {/* Highlight effect for current testimonial */}
                    {index === currentTestimonial && (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
                    )}
                    
                    <div className="relative z-10">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl mr-4 hover:scale-110 transition-transform duration-300">
                          {testimonial.image}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-300">{testimonial.role}</div>
                          <div className="text-sm text-slate-500">{testimonial.company}</div>
                        </div>
                      </div>
                      <div className="flex mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className="w-4 h-4 text-yellow-400 fill-current hover:scale-125 transition-transform duration-200" 
                            style={{ animationDelay: `${i * 100}ms` }}
                          />
                        ))}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed">"{testimonial.quote}"</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Navigation arrows */}
            <button
              onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 hover:shadow-xl"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <button
              onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 hover:shadow-xl"
            >
              <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Separate plans designed specifically for job seekers and recruiters
            </p>
          </div>
          
          {/* Job Seeker Plans */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-center gap-2">
                <Users className="w-6 h-6 text-blue-500" />
                For Job Seekers
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Find your dream job faster with AI-powered tools
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {jobSeekerPlans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`relative border-0 transition-all duration-500 hover:scale-105 hover:-translate-y-2 group ${
                    plan.popular 
                      ? 'ring-2 ring-blue-500 bg-white dark:bg-slate-900 shadow-xl hover:shadow-2xl' 
                      : 'bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl'
                  } backdrop-blur`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white animate-pulse hover:animate-bounce">
                        <Crown className="w-3 h-3 mr-1" />
                        Most Popular
                        <Sparkles className="w-3 h-3 ml-1" />
                      </Badge>
                    </div>
                  )}
                  
                  <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-500/10 to-purple-600/10' 
                      : 'bg-gradient-to-r from-slate-500/5 to-slate-600/5'
                  }`}></div>
                  
                  <CardContent className="p-8 relative z-10">
                    <div className="text-center mb-8">
                      <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        {plan.name}
                      </h4>
                      <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                        {plan.price}
                        {plan.price !== "$0" && <span className="text-lg text-slate-500">/month</span>}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">
                        {plan.description}
                      </p>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li 
                          key={featureIndex} 
                          className="flex items-center group-hover:translate-x-1 transition-transform duration-300"
                          style={{ transitionDelay: `${featureIndex * 50}ms` }}
                        >
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-slate-600 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link href={plan.href}>
                      <Button 
                        className={`w-full transition-all duration-300 hover:scale-105 relative overflow-hidden group/btn ${
                          plan.popular 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl' 
                            : 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 hover:shadow-lg'
                        }`}
                        size="lg"
                      >
                        {plan.popular && (
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                        )}
                        <span className="relative z-10 flex items-center justify-center">
                          {plan.cta}
                          <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
                        </span>
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recruiter Plans */}
          <div>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-center gap-2">
                <Building2 className="w-6 h-6 text-purple-500" />
                For Recruiters
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Find the best talent with advanced recruiting tools
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {recruiterPlans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`relative border-0 transition-all duration-500 hover:scale-105 hover:-translate-y-2 group ${
                    plan.popular 
                      ? 'ring-2 ring-purple-500 bg-white dark:bg-slate-900 shadow-xl hover:shadow-2xl' 
                      : 'bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl'
                  } backdrop-blur`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white animate-pulse hover:animate-bounce">
                        <Crown className="w-3 h-3 mr-1" />
                        Most Popular
                        <Sparkles className="w-3 h-3 ml-1" />
                      </Badge>
                    </div>
                  )}
                  
                  <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-purple-500/10 to-pink-600/10' 
                      : 'bg-gradient-to-r from-slate-500/5 to-slate-600/5'
                  }`}></div>
                  
                  <CardContent className="p-8 relative z-10">
                    <div className="text-center mb-8">
                      <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                        {plan.name}
                      </h4>
                      <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                        {plan.price}
                        {plan.price !== "$0" && <span className="text-lg text-slate-500">/month</span>}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">
                        {plan.description}
                      </p>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li 
                          key={featureIndex} 
                          className="flex items-center group-hover:translate-x-1 transition-transform duration-300"
                          style={{ transitionDelay: `${featureIndex * 50}ms` }}
                        >
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-slate-600 dark:text-slate-300 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors duration-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link href={plan.href}>
                      <Button 
                        className={`w-full transition-all duration-300 hover:scale-105 relative overflow-hidden group/btn ${
                          plan.popular 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl' 
                            : 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 hover:shadow-lg'
                        }`}
                        size="lg"
                      >
                        {plan.popular && (
                          <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                        )}
                        <span className="relative z-10 flex items-center justify-center">
                          {plan.cta}
                          <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
                        </span>
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute top-20 right-20 w-24 h-24 bg-white/5 rounded-lg rotate-45 animate-spin-slow"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-white/10 rounded-full animate-bounce-slow"></div>
          <div className="absolute bottom-10 right-1/3 w-20 h-20 bg-white/5 rounded-full animate-pulse"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 animate-fade-in">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed animate-fade-in-delay">
            Join thousands of professionals who've accelerated their careers with AutoJobr. 
            Start your journey today - it's free!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/auth">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl px-8 py-4 text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
                <Rocket className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            <Link href="/recruiter-features">
              <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg transition-all duration-300 hover:scale-105 group">
                <Users className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                For Recruiters
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </div>
          
          <div className="flex justify-center space-x-8 text-blue-100 text-sm">
            <div className="flex items-center hover:scale-105 transition-transform duration-300">
              <CheckCircle className="w-4 h-4 mr-2 animate-pulse" />
              Free forever plan available
            </div>
            <div className="flex items-center hover:scale-105 transition-transform duration-300">
              <CheckCircle className="w-4 h-4 mr-2 animate-pulse" style={{ animationDelay: '0.5s' }} />
              No credit card required
            </div>
            <div className="flex items-center hover:scale-105 transition-transform duration-300">
              <CheckCircle className="w-4 h-4 mr-2 animate-pulse" style={{ animationDelay: '1s' }} />
              Setup in minutes
            </div>
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
                AI-powered job platform connecting talent with opportunity.
              </p>
              <div className="flex space-x-4">
                <Badge variant="outline" className="text-slate-400 border-slate-600">
                  Trusted by 50K+ users
                </Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/auth" className="hover:text-white transition-colors">Job Search</Link></li>
                <li><Link href="/recruiter-features" className="hover:text-white transition-colors">For Recruiters</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>&copy; 2025 AutoJobr. All rights reserved. Built with ❤️ for the future of work.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}