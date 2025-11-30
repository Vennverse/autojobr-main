import SEOHead from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  GraduationCap, 
  Rocket, 
  Users, 
  CheckCircle2, 
  Building2, 
  Award,
  FileText,
  Briefcase,
  Target,
  TrendingUp,
  Handshake,
  Mail,
  Clock,
  Star,
  Zap,
  Shield,
  Brain,
  Heart,
  MessageSquare,
  Video,
  BarChart3,
  Network,
  UserCheck,
  Crown,
  Sparkles,
  Globe,
  Phone,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";

export default function UniversityPartnership() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "University Partnership Program - AutoJobR",
    "description": "Partner with AutoJobR to accelerate your students' career success. We actively recruit for FAANG, Fortune 500, and top companies - bulk hiring to executive-level headhunting.",
    "url": "https://autojobr.com/university-partnership",
    "publisher": {
      "@type": "Organization",
      "name": "AutoJobR"
    }
  };

  const coreFeatures = [
    {
      icon: Zap,
      title: "One-Click Mass Applications",
      description: "Students apply to 10-20x more positions instantly, dramatically boosting interview chances"
    },
    {
      icon: FileText,
      title: "AI Resume & Cover Letter Engine",
      description: "Intelligent tailoring for each role - personalized resumes and cover letters in seconds"
    },
    {
      icon: Target,
      title: "ATS Score Optimization",
      description: "Real-time scoring ensures resumes pass Applicant Tracking Systems every time"
    },
    {
      icon: Brain,
      title: "AI Career Coach",
      description: "24/7 personalized career guidance, interview tips, and skill recommendations"
    },
    {
      icon: Video,
      title: "AI Mock Interviews",
      description: "Practice interviews with AI feedback - video, audio, and chat formats available"
    },
    {
      icon: BarChart3,
      title: "Application Analytics Dashboard",
      description: "Track every application, response, and interview in one centralized hub"
    }
  ];

  const recruitmentServices = [
    {
      icon: Building2,
      title: "Bulk Campus Hiring",
      description: "We partner with Fortune 500 companies seeking fresh talent. Direct pipeline from your campus to top employers for volume hiring."
    },
    {
      icon: Crown,
      title: "Executive Headhunting",
      description: "For exceptional students - direct referrals to C-suite and senior leadership positions at top-tier companies."
    },
    {
      icon: Network,
      title: "Exclusive Referral Network",
      description: "Access to 500+ employee referrals from Google, Amazon, Microsoft, Nvidia, Meta, Apple, Deloitte, McKinsey and more."
    },
    {
      icon: UserCheck,
      title: "Performance-Based Shortlisting",
      description: "Top performers on our assessments get directly shortlisted or referred, bypassing traditional application queues."
    }
  ];

  const hiringPartners = [
    { name: "Google", type: "FAANG" },
    { name: "Amazon", type: "FAANG" },
    { name: "Microsoft", type: "Tech Giant" },
    { name: "Nvidia", type: "AI Leader" },
    { name: "Meta", type: "FAANG" },
    { name: "Apple", type: "FAANG" },
    { name: "Deloitte", type: "Big 4" },
    { name: "McKinsey", type: "MBB" },
    { name: "Goldman Sachs", type: "Finance" },
    { name: "JPMorgan", type: "Finance" },
    { name: "Netflix", type: "Entertainment" },
    { name: "Tesla", type: "Innovation" }
  ];

  const mentalWellnessFeatures = [
    {
      icon: Heart,
      title: "Stress-Free Job Search",
      description: "Automation removes the anxiety of manual applications. Students focus on what matters - their growth."
    },
    {
      icon: MessageSquare,
      title: "24/7 AI Support",
      description: "Always available guidance for career questions, reducing uncertainty and boosting confidence."
    },
    {
      icon: Shield,
      title: "Progress Visibility",
      description: "Real-time tracking eliminates the black hole effect. Students always know where they stand."
    },
    {
      icon: Star,
      title: "Confidence Building",
      description: "AI mock interviews and feedback help students feel prepared and confident before real interviews."
    }
  ];

  const allServices = [
    "One-Click Job Applications (10-20x faster)",
    "AI-Powered Resume Builder & Optimizer",
    "Smart Cover Letter Generator",
    "ATS Score Checker & Improvement",
    "AI Mock Interviews (Video, Audio, Chat)",
    "Personalized Job Matching Algorithm",
    "Application Tracking Dashboard",
    "AI Career Coach & Guidance",
    "LinkedIn Profile Optimizer",
    "Salary Calculator & Negotiation Tips",
    "Employee Referral Marketplace",
    "Skills Assessment & Certifications",
    "Interview Preparation Suite",
    "Company Research & Insights",
    "Networking Event Access",
    "Resume Templates Library"
  ];

  const studentBenefits = [
    {
      icon: Sparkles,
      title: "30-Day Free Premium",
      description: "Full platform access at absolutely no cost for partnered students"
    },
    {
      icon: Award,
      title: "Exclusive Student Pricing",
      description: "Up to 70% discount on premium plans for continued access"
    },
    {
      icon: Users,
      title: "Priority Job Matching",
      description: "Partner students get priority matching with exclusive opportunities"
    },
    {
      icon: Globe,
      title: "Global Opportunities",
      description: "Access to remote and international positions from top companies worldwide"
    }
  ];

  return (
    <>
      <SEOHead
        title="University Partnership Program - AutoJobR | Bulk Hiring & Executive Headhunting"
        description="Partner with AutoJobR for bulk campus hiring and executive headhunting. We actively recruit for FAANG, Fortune 500, and top companies. Boost student placement rates with AI-powered career tools."
        keywords="university partnership, campus recruitment, bulk hiring, executive headhunting, FAANG recruitment, student placement, career services, university career center"
        canonicalUrl="https://autojobr.com/university-partnership"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16">
          
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <GraduationCap className="h-4 w-4" />
              University Partnership Program
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Your Students Deserve Top Careers
            </h1>
            <p className="text-xl text-muted-foreground mb-4 max-w-4xl mx-auto leading-relaxed">
              We don't just provide tools - we <span className="font-semibold text-foreground">actively recruit your students</span> for 
              FAANG, Fortune 500, and high-growth companies. From <span className="font-semibold text-foreground">bulk campus hiring</span> to 
              <span className="font-semibold text-foreground"> executive-level headhunting</span>, we're your complete placement partner.
            </p>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
              One subscription gives your students access to all career tools, mental peace, and direct pathways to dream jobs.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8" data-testid="button-schedule-demo">
                  <Phone className="mr-2 h-5 w-5" />
                  Schedule Partnership Call
                </Button>
              </Link>
              <a href="mailto:shubham.dubey@autojobr.com?subject=University Partnership Inquiry">
                <Button size="lg" variant="outline" className="px-8" data-testid="button-email-direct">
                  <Mail className="mr-2 h-5 w-5" />
                  Email Us Directly
                </Button>
              </a>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-20">
            <Card className="text-center border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
                <div className="text-muted-foreground font-medium">Partner Companies</div>
                <div className="text-xs text-muted-foreground mt-1">Actively Hiring</div>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-green-600 mb-2">85%</div>
                <div className="text-muted-foreground font-medium">Placement Success</div>
                <div className="text-xs text-muted-foreground mt-1">Interview Conversion</div>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-purple-600 mb-2">10-20x</div>
                <div className="text-muted-foreground font-medium">Faster Applications</div>
                <div className="text-xs text-muted-foreground mt-1">vs Manual Process</div>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-orange-600 mb-2">7 Days</div>
                <div className="text-muted-foreground font-medium">Avg. First Interview</div>
                <div className="text-xs text-muted-foreground mt-1">From Signup</div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-20">
            <Card className="border-0 shadow-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <div className="text-center mb-10">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">We Actively Recruit For Top Companies</h2>
                  <p className="text-white/90 text-lg max-w-2xl mx-auto">
                    Not just a job board - we are your direct pipeline to FAANG, Fortune 500, and elite companies
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  {recruitmentServices.map((service, index) => (
                    <div key={index} className="flex gap-4 items-start bg-white/10 backdrop-blur rounded-xl p-5">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <service.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-2">{service.title}</h3>
                        <p className="text-white/80 text-sm">{service.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-20">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">Companies We Recruit For</h2>
              <p className="text-muted-foreground">Top performers get directly referred to these organizations</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {hiringPartners.map((partner, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-gray-800 shadow-md rounded-full px-6 py-3 flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{partner.name}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{partner.type}</span>
                </div>
              ))}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md rounded-full px-6 py-3">
                <span className="font-semibold">+ 500 More Companies</span>
              </div>
            </div>
          </div>

          <div id="services" className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Complete Career Toolkit</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                One subscription unlocks everything students need for career success
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreFeatures.map((feature, index) => (
                <Card key={index} className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="mb-20">
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">All Services Included</h2>
                  <p className="text-muted-foreground">Everything your students need under one roof</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {allServices.map((service, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Mental Assurance & Peace of Mind</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Job searching shouldn't cause stress. Our platform provides confidence and clarity throughout the journey.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mentalWellnessFeatures.map((feature, index) => (
                <Card key={index} className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-center">
                  <CardHeader>
                    <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <feature.icon className="h-7 w-7 text-green-600" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="mb-20">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-3xl font-bold mb-6">Why Universities Choose AutoJobR</h2>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">Active Recruitment Partner</span>
                          <p className="text-muted-foreground text-sm">We bring companies to your campus, not just tools</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">Bulk Hiring Capabilities</span>
                          <p className="text-muted-foreground text-sm">Efficient pipeline for volume campus recruitment</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">Executive Headhunting</span>
                          <p className="text-muted-foreground text-sm">Direct referrals to leadership roles for top talent</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">Improved Placement Metrics</span>
                          <p className="text-muted-foreground text-sm">Measurable increase in student placement rates</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">Reduced Team Workload</span>
                          <p className="text-muted-foreground text-sm">Automation handles repetitive placement tasks</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl p-8 text-center">
                    <Handshake className="h-20 w-20 mx-auto mb-4 text-primary" />
                    <div className="text-3xl font-bold mb-2">100+</div>
                    <div className="text-muted-foreground mb-4">University Partners Worldwide</div>
                    <div className="text-sm text-muted-foreground">
                      Join the growing network of institutions accelerating student success
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Exclusive Student Benefits</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Partner university students receive premium perks
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {studentBenefits.map((benefit, index) => (
                <Card key={index} className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur text-center">
                  <CardHeader>
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <benefit.icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="mb-20">
            <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur">
              <CardContent className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">Simple Onboarding Process</h2>
                  <p className="text-muted-foreground">Get started in minutes - minimal effort required</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-blue-600">1</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Schedule a Call</h3>
                    <p className="text-muted-foreground text-sm">
                      15-minute discovery call to understand your placement goals
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-purple-600">2</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Get Exclusive Link</h3>
                    <p className="text-muted-foreground text-sm">
                      Receive unique signup URL with 30-day premium for all students
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-green-600">3</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Watch Placements Soar</h3>
                    <p className="text-muted-foreground text-sm">
                      Students start getting interviews within 7 days of joining
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Placement Program?</h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Join 100+ universities already partnering with us for bulk hiring, executive headhunting, and student career success
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" variant="secondary" className="px-8" data-testid="button-contact-partnership">
                  <Phone className="mr-2 h-5 w-5" />
                  Schedule Partnership Call
                </Button>
              </Link>
              <a href="mailto:shubham.dubey@autojobr.com?subject=University Partnership Inquiry">
                <Button size="lg" variant="outline" className="px-8 border-white/30 text-white" data-testid="button-email-team">
                  <Mail className="mr-2 h-5 w-5" />
                  shubham.dubey@autojobr.com
                </Button>
              </a>
            </div>
            <p className="mt-6 text-white/70 text-sm">
              We respond within 24 hours. Let's discuss how we can help your students succeed.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
