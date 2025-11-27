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
  Shield
} from "lucide-react";
import { Link } from "wouter";

export default function UniversityPartnership() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "University Partnership Program - AutoJobR",
    "description": "Partner with AutoJobR to accelerate your students' career success with AI-powered job application automation, resume optimization, and exclusive access to top-tier company referrals.",
    "url": "https://autojobr.com/university-partnership",
    "publisher": {
      "@type": "Organization",
      "name": "AutoJobR"
    }
  };

  const features = [
    {
      icon: Zap,
      title: "One-Click Applications",
      description: "Students apply to 10-20x more positions in the same time, dramatically increasing interview opportunities"
    },
    {
      icon: FileText,
      title: "AI Resume & Cover Letters",
      description: "Intelligent resume tailoring and cover letter generation optimized for each specific role"
    },
    {
      icon: Target,
      title: "ATS Score Optimization",
      description: "Ensure resumes pass Applicant Tracking Systems with real-time scoring and suggestions"
    },
    {
      icon: Briefcase,
      title: "Smart Job Matching",
      description: "AI-powered matching connects students with opportunities aligned to their skills and goals"
    },
    {
      icon: TrendingUp,
      title: "Application Dashboard",
      description: "Track all applications, responses, and interviews in one centralized dashboard"
    },
    {
      icon: Building2,
      title: "Exclusive Referral Network",
      description: "Direct access to employee referrals from Google, Amazon, Microsoft, Nvidia, Deloitte, and 500+ companies"
    }
  ];

  const hiringPartners = [
    "Google",
    "Amazon",
    "Microsoft",
    "Nvidia",
    "Meta",
    "Apple",
    "Deloitte",
    "McKinsey"
  ];

  const studentBenefits = [
    {
      icon: Star,
      title: "30-Day Premium Access",
      description: "Full platform access at no cost for partnered students"
    },
    {
      icon: Award,
      title: "Exclusive Student Pricing",
      description: "Heavily discounted plans for continued premium access"
    },
    {
      icon: Users,
      title: "Interview Preparation Suite",
      description: "AI mock interviews, feedback, and coaching tools"
    },
    {
      icon: Shield,
      title: "Resume & Networking Support",
      description: "Expert optimization and professional networking guidance"
    }
  ];

  return (
    <>
      <SEOHead
        title="University Partnership Program - AutoJobR | Accelerate Student Career Success"
        description="Partner with AutoJobR to boost your students' placement rates with AI-powered job automation, resume optimization, and exclusive Fortune 500 referral network access."
        keywords="university partnership, campus recruitment, student placement, career services, job automation for students, university career center, campus hiring"
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
              Empower Your Students for Career Success
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Partner with AutoJobR to give your students a competitive edge in today's job market with 
              AI-powered automation, premium tools, and exclusive access to top-tier hiring networks.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8" data-testid="button-schedule-demo">
                  <Mail className="mr-2 h-5 w-5" />
                  Schedule a Demo
                </Button>
              </Link>
              <a href="#benefits">
                <Button size="lg" variant="outline" className="px-8" data-testid="button-learn-more">
                  Learn More
                </Button>
              </a>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-20">
            <Card className="text-center border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">85%</div>
                <div className="text-muted-foreground">Interview Success Rate</div>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-green-600 mb-2">10-20x</div>
                <div className="text-muted-foreground">Faster Applications</div>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-purple-600 mb-2">500+</div>
                <div className="text-muted-foreground">Partner Companies</div>
              </CardContent>
            </Card>
            <Card className="text-center border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="pt-6">
                <div className="text-4xl font-bold text-orange-600 mb-2">7 Days</div>
                <div className="text-muted-foreground">Avg. to First Interview</div>
              </CardContent>
            </Card>
          </div>

          <div id="benefits" className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">What AutoJobR Offers Your Students</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Comprehensive career acceleration tools designed specifically for emerging professionals
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
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
            <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-3xl font-bold mb-4">Why Universities Partner With Us</h2>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
                        <span>Accelerate students to interview-ready status in days, not months</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
                        <span>Significantly improve placement rates and campus recruitment metrics</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
                        <span>Reduce workload for placement teams with automated processes</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
                        <span>Connect students directly with premium hiring networks</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
                        <span>Support both internship seekers and full-time candidates</span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex justify-center">
                    <div className="bg-white/20 backdrop-blur rounded-2xl p-8 text-center">
                      <Handshake className="h-16 w-16 mx-auto mb-4" />
                      <div className="text-2xl font-bold mb-2">Trusted Partner</div>
                      <div className="text-white/80">Supporting 100+ Universities</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Direct Hiring & Referral Network</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                High-performing students gain direct access to opportunities at world-class companies
              </p>
            </div>
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">We Actively Recruit For:</h3>
                    <div className="flex flex-wrap gap-3">
                      {hiringPartners.map((partner, index) => (
                        <span 
                          key={index}
                          className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium"
                        >
                          {partner}
                        </span>
                      ))}
                    </div>
                    <p className="text-muted-foreground mt-4">
                      Plus 500+ Fortune 500 companies and high-growth startups in tech, finance, and consulting
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 text-green-700 dark:text-green-400">
                      Performance-Based Shortlisting
                    </h3>
                    <p className="text-muted-foreground">
                      Students who excel on AutoJobR assessments and demonstrate strong skills are 
                      <span className="font-semibold text-foreground"> directly shortlisted or referred </span>
                      to our partner companies, bypassing traditional application queues.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Exclusive Student Benefits</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Special perks designed to maximize student success at partnered institutions
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
                  <h2 className="text-3xl font-bold mb-4">Getting Started is Simple</h2>
                  <p className="text-muted-foreground">Minimal setup required from your institution</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">1. Designate a Contact</h3>
                    <p className="text-muted-foreground text-sm">
                      Assign one point of contact from your placement or career services team
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">2. Share Access Link</h3>
                    <p className="text-muted-foreground text-sm">
                      Distribute the exclusive student signup link through your preferred channels
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">3. Optional Demo Session</h3>
                    <p className="text-muted-foreground text-sm">
                      We offer a 15-minute intro session to help students get started effectively
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Partner With AutoJobR?</h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Join the growing network of universities accelerating their students' career success
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" variant="secondary" className="px-8" data-testid="button-contact-partnership">
                  <Mail className="mr-2 h-5 w-5" />
                  Contact Our Partnership Team
                </Button>
              </Link>
              <a href="mailto:partnerships@autojobr.com">
                <Button size="lg" variant="outline" className="px-8 border-white/30 text-white" data-testid="button-email-direct">
                  partnerships@autojobr.com
                </Button>
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
