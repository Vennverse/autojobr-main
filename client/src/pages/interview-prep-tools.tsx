
import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  Video,
  Brain,
  FileText,
  Mail,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  Users,
  Calendar,
  Code,
  Globe,
  Award,
  Zap,
  BarChart3,
  Phone,
  Rocket,
  Star,
  ChevronDown
} from "lucide-react";

const jobSearchStages = [
  {
    stage: "1. Prepare",
    icon: FileText,
    color: "from-blue-600 to-cyan-600",
    bgGradient: "from-blue-50 to-cyan-50",
    darkBgGradient: "from-blue-950/30 to-cyan-950/30",
    accentColor: "blue",
    emoji: "📝",
    tools: [
      {
        name: "Resume Optimizer",
        description: "AI analyzes your resume for ATS compatibility and provides instant feedback",
        icon: FileText,
        link: "/resumes",
        benefit: "95% ATS Pass Rate",
        features: ["ATS Score", "Keyword Optimization", "Format Check"],
        visual: "📄",
        gradient: "from-blue-500 to-blue-700"
      },
      {
        name: "LinkedIn Optimizer",
        description: "Generate compelling headlines, about sections, and keyword-rich profiles",
        icon: Globe,
        link: "/premium-ai-tools?tab=linkedin-optimizer",
        benefit: "3x More Profile Views",
        features: ["Headline Generator", "About Section", "Keyword Research"],
        visual: "💼",
        gradient: "from-cyan-500 to-cyan-700"
      },
      {
        name: "Cover Letter Generator",
        description: "AI creates personalized cover letters matching job descriptions",
        icon: Mail,
        link: "/premium-ai-tools?tab=cover-letter",
        benefit: "10x Faster Applications",
        features: ["AI Personalization", "Job Matching", "Multiple Versions"],
        visual: "✉️",
        gradient: "from-blue-600 to-cyan-600"
      }
    ]
  },
  {
    stage: "2. Apply",
    icon: Rocket,
    color: "from-purple-600 to-pink-600",
    bgGradient: "from-purple-50 to-pink-50",
    darkBgGradient: "from-purple-950/30 to-pink-950/30",
    accentColor: "purple",
    emoji: "🚀",
    tools: [
      {
        name: "Smart Job Search",
        description: "AI-powered job matching across 100+ boards with quality scoring",
        icon: Target,
        link: "/jobs",
        benefit: "1000+ Jobs Daily",
        features: ["Multi-Board Search", "AI Matching", "Quality Score"],
        visual: "🎯",
        gradient: "from-purple-500 to-purple-700"
      },
      {
        name: "Auto-Apply Extension",
        description: "One-click applications with human-like autofill across all platforms",
        icon: Zap,
        link: "/chrome-extension",
        benefit: "Apply 10x Faster",
        features: ["Auto-Fill", "Multi-Platform", "Smart Detection"],
        visual: "⚡",
        gradient: "from-pink-500 to-pink-700"
      },
      {
        name: "Application CRM",
        description: "Track all applications, deadlines, and follow-ups in one dashboard",
        icon: BarChart3,
        link: "/enhanced-crm",
        benefit: "Never Miss Deadlines",
        features: ["Status Tracking", "Reminders", "Analytics"],
        visual: "📊",
        gradient: "from-purple-600 to-pink-600"
      }
    ]
  },
  {
    stage: "3. Prepare for Interview",
    icon: Brain,
    color: "from-green-600 to-emerald-600",
    bgGradient: "from-green-50 to-emerald-50",
    darkBgGradient: "from-green-950/30 to-emerald-950/30",
    accentColor: "green",
    emoji: "🧠",
    tools: [
      {
        name: "Virtual AI Interview",
        description: "Practice with conversational AI interviewer - real-time chat with instant feedback",
        icon: MessageCircle,
        link: "/virtual-interview-start",
        benefit: "Real Interview Experience",
        features: ["AI Conversation", "Instant Feedback", "Hiring Probability"],
        visual: "💬",
        gradient: "from-green-500 to-green-700"
      },
      {
        name: "Video Interview Practice",
        description: "Record yourself answering questions with video & audio analysis",
        icon: Video,
        link: "/video-practice",
        benefit: "Perfect Your Presence",
        features: ["Body Language Analysis", "Speech Patterns", "Confidence Score"],
        visual: "🎥",
        gradient: "from-teal-500 to-teal-700"
      },
      {
        name: "Mock Coding Tests",
        description: "Practice technical questions with live code execution and feedback",
        icon: Code,
        link: "/mock-interview",
        benefit: "Master Technical Skills",
        features: ["12+ Languages", "Live Testing", "Detailed Feedback"],
        visual: "💻",
        gradient: "from-emerald-500 to-emerald-700"
      },
      {
        name: "AI Interview Coach",
        description: "Get personalized interview answers using the STAR method",
        icon: Brain,
        link: "/premium-ai-tools?tab=interview",
        benefit: "STAR Method Mastery",
        features: ["Question Bank", "Answer Templates", "Behavioral Prep"],
        visual: "🧠",
        gradient: "from-green-600 to-emerald-600"
      }
    ]
  },
  {
    stage: "4. Network & Follow Up",
    icon: Users,
    color: "from-orange-600 to-red-600",
    bgGradient: "from-orange-50 to-red-50",
    darkBgGradient: "from-orange-950/30 to-red-950/30",
    accentColor: "orange",
    emoji: "🤝",
    tools: [
      {
        name: "Referral Network",
        description: "Get direct referrals from employees at 500+ top companies",
        icon: Users,
        link: "/referral-marketplace",
        benefit: "300% Higher Interview Rate",
        features: ["Employee Network", "Direct Referrals", "FAANG Access"],
        visual: "🤝",
        gradient: "from-orange-500 to-orange-700"
      },
      {
        name: "Smart Follow-Up CRM",
        description: "Automated reminders and AI-generated follow-up messages",
        icon: MessageSquare,
        link: "/enhanced-crm",
        benefit: "Stay Top of Mind",
        features: ["Auto Reminders", "Message Templates", "Engagement Tracking"],
        visual: "💬",
        gradient: "from-red-500 to-red-700"
      },
      {
        name: "Networking Outreach",
        description: "AI crafts personalized LinkedIn messages and emails",
        icon: Phone,
        link: "/premium-ai-tools",
        benefit: "Professional Networking",
        features: ["Message Crafting", "LinkedIn Integration", "Email Templates"],
        visual: "📞",
        gradient: "from-orange-600 to-red-600"
      }
    ]
  }
];

const successMetrics = [
  { metric: "1M+", label: "Users Hired", icon: Users },
  { metric: "95%", label: "ATS Pass Rate", icon: CheckCircle },
  { metric: "300%", label: "More Interviews", icon: TrendingUp },
  { metric: "7 Days", label: "To First Interview", icon: Calendar }
];

function StageSection({ stage, index }: { stage: typeof jobSearchStages[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  const Icon = stage.icon;

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0.3 }}
      transition={{ duration: 0.8 }}
      className={`min-h-screen flex items-center py-20 bg-gradient-to-br ${stage.bgGradient} dark:${stage.darkBgGradient}`}
    >
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Stage Header */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-16"
        >
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${stage.color} mb-6 shadow-2xl`}>
            <span className="text-5xl">{stage.emoji}</span>
          </div>
          <h2 className={`text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r ${stage.color} bg-clip-text text-transparent`}>
            {stage.stage}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {stage.tools.length} powerful AI tools to accelerate this stage
          </p>
        </motion.div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {stage.tools.map((tool, toolIndex) => {
            const ToolIcon = tool.icon;
            return (
              <motion.div
                key={toolIndex}
                initial={{ y: 100, opacity: 0, scale: 0.8 }}
                animate={isInView ? { y: 0, opacity: 1, scale: 1 } : { y: 100, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.6, delay: 0.3 + toolIndex * 0.1 }}
              >
                <Card className="group h-full hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border-2 overflow-hidden relative">
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-20 h-20 bg-gradient-to-br ${tool.gradient} rounded-2xl flex items-center justify-center text-5xl shadow-lg transform group-hover:scale-110 transition-transform duration-500`}>
                        {tool.visual}
                      </div>
                      <Badge className={`bg-${stage.accentColor}-100 text-${stage.accentColor}-700 dark:bg-${stage.accentColor}-900 dark:text-${stage.accentColor}-100 border-${stage.accentColor}-300`}>
                        <Star className="w-3 h-3 mr-1" />
                        {tool.benefit}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                      {tool.name}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-6">
                      {tool.features.map((feature, fidx) => (
                        <motion.div
                          key={fidx}
                          initial={{ x: -20, opacity: 0 }}
                          animate={isInView ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
                          transition={{ delay: 0.5 + fidx * 0.1 }}
                          className="flex items-center gap-3 text-sm"
                        >
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${tool.gradient} flex items-center justify-center flex-shrink-0`}>
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                    <Link href={tool.link}>
                      <Button className={`w-full bg-gradient-to-r ${tool.gradient} text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
                        Try {tool.name} Free
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Scroll indicator for next stage */}
        {index < jobSearchStages.length - 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            className="text-center mt-16"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400"
            >
              <span className="text-sm font-medium">Next Stage</span>
              <ChevronDown className="w-6 h-6" />
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

export default function InterviewPrepTools() {
  const { scrollYProgress } = useScroll();
  const [activeStage, setActiveStage] = useState(0);

  // Update active stage based on scroll
  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((latest) => {
      const stageIndex = Math.floor(latest * jobSearchStages.length);
      setActiveStage(Math.min(stageIndex, jobSearchStages.length - 1));
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Helmet>
        <title>AI Interview Prep Tools - Virtual Interviews, Mock Tests & Resume Optimizer | AutoJobR</title>
        <meta name="description" content="Complete AI-powered interview preparation suite: Virtual AI interviews, mock coding tests, resume optimizer, LinkedIn optimization, cover letter generator, and job search automation. Land your dream job 10x faster." />
        <meta name="keywords" content="AI interview prep, virtual interview practice, mock coding test, resume optimizer, ATS optimizer, LinkedIn profile optimization, cover letter generator, job search tools, interview coaching, technical interview practice, behavioral interview prep, job application automation" />
        
        <meta property="og:title" content="AI Interview Prep Tools - Complete Job Search Solution | AutoJobR" />
        <meta property="og:description" content="Master every stage of job search with AI tools: Resume optimization, virtual interviews, mock tests, LinkedIn optimization, and smart job search. Join 1M+ users landing jobs faster." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${window.location.origin}/interview-prep-tools`} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Interview Prep Tools - Virtual Interviews, Mock Tests & More" />
        <meta name="twitter:description" content="Complete AI-powered job search toolkit. Practice interviews, optimize resume, auto-apply to jobs." />
        
        <link rel="canonical" href={`${window.location.origin}/interview-prep-tools`} />
      </Helmet>

      {/* Fixed Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white py-32 px-4"
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <Badge className="mb-6 bg-white/20 text-white border-0 px-8 py-3 text-lg backdrop-blur">
              <Sparkles className="w-5 h-5 mr-2" />
              100% Free Tools - No Credit Card Required
            </Badge>
            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
              Your Complete AI-Powered
              <br />
              <span className="text-yellow-300">Job Search Toolkit</span>
            </h1>
            <p className="text-2xl md:text-3xl mb-12 text-white/90 max-w-4xl mx-auto leading-relaxed">
              From resume optimization to interview practice - master every step of your job search journey with enterprise-grade AI tools
            </p>
            
            {/* Quick Access Tools */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-8">
              <Link href="/chrome-extension">
                <button className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all duration-300 text-left">
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="font-bold text-sm">Chrome Extension</div>
                  <div className="text-xs text-white/70">Auto-Apply Jobs</div>
                </button>
              </Link>
              <Link href="/virtual-interview-start">
                <button className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all duration-300 text-left">
                  <div className="text-3xl mb-2">💬</div>
                  <div className="font-bold text-sm">AI Interview</div>
                  <div className="text-xs text-white/70">Chat Practice</div>
                </button>
              </Link>
              <Link href="/video-practice">
                <button className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all duration-300 text-left">
                  <div className="text-3xl mb-2">🎥</div>
                  <div className="font-bold text-sm">Video Interview</div>
                  <div className="text-xs text-white/70">Record & Analyze</div>
                </button>
              </Link>
              <Link href="/mock-interview">
                <button className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all duration-300 text-left">
                  <div className="text-3xl mb-2">💻</div>
                  <div className="font-bold text-sm">Coding Tests</div>
                  <div className="text-xs text-white/70">12+ Languages</div>
                </button>
              </Link>
            </div>
            
            {/* Success Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {successMetrics.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
                    className="text-center p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300"
                  >
                    <Icon className="w-10 h-10 mx-auto mb-3" />
                    <div className="text-4xl font-bold mb-2">{item.metric}</div>
                    <div className="text-sm text-white/80">{item.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
        
        {/* Animated scroll indicator */}
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <ChevronDown className="w-10 h-10 text-white/70" />
        </motion.div>
      </motion.div>

      {/* Scroll-Triggered Stages */}
      {jobSearchStages.map((stage, index) => (
        <StageSection key={index} stage={stage} index={index} />
      ))}

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="py-32 px-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
      >
        <div className="container mx-auto max-w-5xl text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-16 text-white shadow-2xl">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">Ready to Transform Your Job Search?</h2>
            <p className="text-2xl mb-12 text-white/90 max-w-3xl mx-auto">
              Join 1M+ job seekers using AI to land interviews 10x faster
            </p>
            <div className="flex gap-6 justify-center flex-wrap">
              <Link href="/auth">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-12 py-8 text-xl font-bold shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                  <Rocket className="w-6 h-6 mr-3" />
                  Start Free - No Credit Card
                </Button>
              </Link>
              <Link href="/jobs">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-12 py-8 text-xl font-bold backdrop-blur">
                  Browse Jobs First
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </Link>
            </div>
            <p className="mt-8 text-lg text-white/70">
              ✓ Free forever plan  ✓ No credit card required  ✓ Start in 30 seconds
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
