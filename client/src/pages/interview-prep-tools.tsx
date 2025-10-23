
import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Building2,
  Rocket,
  Star
} from "lucide-react";

const jobSearchStages = [
  {
    stage: "1. Prepare",
    icon: FileText,
    color: "from-blue-600 to-cyan-600",
    tools: [
      {
        name: "Resume Optimizer",
        description: "AI analyzes your resume for ATS compatibility and provides instant feedback",
        icon: FileText,
        link: "/resumes",
        benefit: "95% ATS Pass Rate",
        features: ["ATS Score", "Keyword Optimization", "Format Check"],
        visual: "📄"
      },
      {
        name: "LinkedIn Optimizer",
        description: "Generate compelling headlines, about sections, and keyword-rich profiles",
        icon: Globe,
        link: "/linkedin-optimizer",
        benefit: "3x More Profile Views",
        features: ["Headline Generator", "About Section", "Keyword Research"],
        visual: "💼"
      },
      {
        name: "Cover Letter Generator",
        description: "AI creates personalized cover letters matching job descriptions",
        icon: Mail,
        link: "/premium-ai-tools",
        benefit: "10x Faster Applications",
        features: ["AI Personalization", "Job Matching", "Multiple Versions"],
        visual: "✉️"
      }
    ]
  },
  {
    stage: "2. Apply",
    icon: Rocket,
    color: "from-purple-600 to-pink-600",
    tools: [
      {
        name: "Smart Job Search",
        description: "AI-powered job matching across 100+ boards with quality scoring",
        icon: Target,
        link: "/jobs",
        benefit: "1000+ Jobs Daily",
        features: ["Multi-Board Search", "AI Matching", "Quality Score"],
        visual: "🎯"
      },
      {
        name: "Auto-Apply Extension",
        description: "One-click applications with human-like autofill across all platforms",
        icon: Zap,
        link: "/chrome-extension",
        benefit: "Apply 10x Faster",
        features: ["Auto-Fill", "Multi-Platform", "Smart Detection"],
        visual: "⚡"
      },
      {
        name: "Application CRM",
        description: "Track all applications, deadlines, and follow-ups in one dashboard",
        icon: BarChart3,
        link: "/enhanced-crm",
        benefit: "Never Miss Deadlines",
        features: ["Status Tracking", "Reminders", "Analytics"],
        visual: "📊"
      }
    ]
  },
  {
    stage: "3. Prepare for Interview",
    icon: Brain,
    color: "from-green-600 to-emerald-600",
    tools: [
      {
        name: "Virtual AI Interview",
        description: "Practice with AI interviewers that analyze body language & speech",
        icon: Video,
        link: "/virtual-interview/new",
        benefit: "Real Interview Experience",
        features: ["AI Feedback", "Video Analysis", "Speech Recognition"],
        visual: "🎥"
      },
      {
        name: "Mock Coding Tests",
        description: "Practice technical questions with live code execution and feedback",
        icon: Code,
        link: "/mock-interview",
        benefit: "Master Technical Skills",
        features: ["Multiple Languages", "Live Testing", "Detailed Feedback"],
        visual: "💻"
      },
      {
        name: "AI Interview Coach",
        description: "Get personalized interview answers using the STAR method",
        icon: Brain,
        link: "/premium-ai-tools",
        benefit: "STAR Method Mastery",
        features: ["Question Bank", "Answer Templates", "Behavioral Prep"],
        visual: "🧠"
      }
    ]
  },
  {
    stage: "4. Network & Follow Up",
    icon: Users,
    color: "from-orange-600 to-red-600",
    tools: [
      {
        name: "Referral Network",
        description: "Get direct referrals from employees at 500+ top companies",
        icon: Users,
        link: "/referral-marketplace",
        benefit: "300% Higher Interview Rate",
        features: ["Employee Network", "Direct Referrals", "FAANG Access"],
        visual: "🤝"
      },
      {
        name: "Smart Follow-Up CRM",
        description: "Automated reminders and AI-generated follow-up messages",
        icon: MessageSquare,
        link: "/enhanced-crm",
        benefit: "Stay Top of Mind",
        features: ["Auto Reminders", "Message Templates", "Engagement Tracking"],
        visual: "💬"
      },
      {
        name: "Networking Outreach",
        description: "AI crafts personalized LinkedIn messages and emails",
        icon: Phone,
        link: "/premium-ai-tools",
        benefit: "Professional Networking",
        features: ["Message Crafting", "LinkedIn Integration", "Email Templates"],
        visual: "📞"
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

export default function InterviewPrepTools() {
  const [activeStage, setActiveStage] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "AutoJobR Interview Prep Tools",
            "applicationCategory": "BusinessApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "15000"
            }
          })}
        </script>
      </Helmet>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-20 px-4">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-white/20 text-white border-0 px-6 py-2 text-lg">
              <Sparkles className="w-4 h-4 mr-2" />
              100% Free Tools - No Credit Card Required
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Your Complete AI-Powered
              <br />
              <span className="text-yellow-300">Job Search Toolkit</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-4xl mx-auto">
              From resume optimization to interview practice - master every step of your job search journey with enterprise-grade AI tools
            </p>
            
            {/* Success Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {successMetrics.map((item, idx) => (
                <div key={idx} className="text-center p-4 bg-white/10 backdrop-blur rounded-xl">
                  <item.icon className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-3xl font-bold mb-1">{item.metric}</div>
                  <div className="text-sm text-white/80">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Job Search Journey */}
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Your Job Search Journey - Simplified
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            AI tools for every step - from preparation to landing the offer
          </p>
        </div>

        {/* Timeline Navigation */}
        <div className="flex justify-center mb-12 overflow-x-auto">
          <div className="flex gap-4 p-2">
            {jobSearchStages.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <Button
                  key={idx}
                  onClick={() => setActiveStage(idx)}
                  variant={activeStage === idx ? "default" : "outline"}
                  className={`${activeStage === idx ? `bg-gradient-to-r ${stage.color} text-white` : ''} min-w-[150px]`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {stage.stage}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Tools Grid for Active Stage */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {jobSearchStages[activeStage].tools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <Card key={idx} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${jobSearchStages[activeStage].color} rounded-2xl flex items-center justify-center text-4xl`}>
                      {tool.visual}
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      <Star className="w-3 h-3 mr-1" />
                      {tool.benefit}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl mb-2">{tool.name}</CardTitle>
                  <CardDescription className="text-base">{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {tool.features.map((feature, fidx) => (
                      <div key={fidx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Link href={tool.link}>
                    <Button className={`w-full bg-gradient-to-r ${jobSearchStages[activeStage].color} text-white`}>
                      Try {tool.name} Free
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Visual Process Flow */}
        <div className="relative py-12">
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transform -translate-y-1/2 hidden md:block"></div>
          <div className="grid md:grid-cols-4 gap-8 relative z-10">
            {jobSearchStages.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <div key={idx} className="text-center">
                  <div className={`w-20 h-20 mx-auto bg-gradient-to-r ${stage.color} rounded-full flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{stage.stage}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stage.tools.length} AI Tools
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* All Tools Overview */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">All AI Tools at a Glance</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              12 powerful tools to accelerate your job search
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobSearchStages.flatMap(stage => 
              stage.tools.map((tool, idx) => {
                const Icon = tool.icon;
                return (
                  <Link key={`${stage.stage}-${idx}`} href={tool.link}>
                    <Card className="h-full hover:shadow-xl transition-all cursor-pointer border-l-4 border-l-blue-600">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">{tool.visual}</div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2">{tool.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {tool.description}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {tool.benefit}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Job Search?</h2>
          <p className="text-xl mb-8 text-white/90">
            Join 1M+ job seekers using AI to land interviews 10x faster
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg">
                <Rocket className="w-5 h-5 mr-2" />
                Start Free - No Credit Card
              </Button>
            </Link>
            <Link href="/jobs">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                Browse Jobs First
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/70">
            ✓ Free forever plan  ✓ No credit card required  ✓ Start in 30 seconds
          </p>
        </div>
      </div>
    </div>
  );
}
