import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap, Crown, Star, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function HowToUse() {
  const [activeTab, setActiveTab] = useState("job-seeker");

  const jobSeekerFeatures = [
    {
      title: "Smart Job Discovery",
      description: "Find jobs tailored to your skills and experience with our AI-powered matching engine",
      steps: [
        "1. Log in to AutoJobR and complete your profile",
        "2. Browse the Jobs section for AI-recommended opportunities",
        "3. Save jobs to your favorites for later review",
        "4. Get weekly job recommendations based on your preferences"
      ],
      premium: false,
      icon: "🔍"
    },
    {
      title: "Resume ATS Optimization",
      description: "Optimize your resume to beat applicant tracking systems and increase visibility",
      steps: [
        "1. Upload your resume to the Resumes section",
        "2. View your ATS score (0-100) and improvement suggestions",
        "3. Follow keyword recommendations for each job description",
        "4. Compare your resume against target job descriptions"
      ],
      premium: false,
      icon: "📄"
    },
    {
      title: "Chrome Extension - LinkedIn Job Applications",
      description: "Apply to multiple LinkedIn jobs seamlessly without manual form filling or detection",
      steps: [
        "1. Install the AutoJobR Chrome Extension from the Chrome Web Store",
        "2. Set your application preferences and default answers",
        "3. Browse LinkedIn job listings and click 'Quick Apply' on any job",
        "4. The extension intelligently applies with natural pacing to avoid flags",
        "5. Track all applications in your AutoJobR dashboard"
      ],
      premium: false,
      icon: "🔗",
      highlight: true
    },
    {
      title: "Referral Marketplace - Get Hired Faster",
      description: "Skip the application queue and get direct referrals from company employees",
      steps: [
        "1. Browse the Referral Marketplace to see available referrals",
        "2. Search for employees at your target companies",
        "3. Purchase a referral to get your application directly to a hiring manager",
        "4. Support early-career professionals earning referral commissions",
        "5. 3-5x higher interview callback rate vs. cold applications"
      ],
      premium: true,
      icon: "🤝",
      highlight: true
    },
    {
      title: "Interview Mastery Program",
      description: "Practice unlimited interviews with AI and get detailed feedback to build confidence",
      steps: [
        "1. Navigate to the Interviews section",
        "2. Choose interview type: Behavioral, Technical, or Case Studies",
        "3. Conduct the AI-powered mock interview with real-time questions",
        "4. Review performance feedback and video analysis",
        "5. Track improvement trends over time",
        "6. Enter real interviews with proven strategies"
      ],
      premium: true,
      icon: "🎯"
    },
    {
      title: "Cover Letter AI Generator",
      description: "Generate personalized, ATS-optimized cover letters in seconds",
      steps: [
        "1. Select the job you're applying to",
        "2. Click 'Generate Cover Letter' in the application tools",
        "3. Review and customize the AI-generated letter",
        "4. Optimize keyword suggestions for maximum impact",
        "5. Export and attach to your application"
      ],
      premium: true,
      icon: "✍️"
    },
    {
      title: "LinkedIn Profile Optimization",
      description: "Get actionable suggestions to improve your LinkedIn profile for recruiter visibility",
      steps: [
        "1. Navigate to LinkedIn Optimizer in Premium Tools",
        "2. Connect your LinkedIn profile (secure OAuth)",
        "3. Receive personalized recommendations for headline, summary, and skills",
        "4. Apply AI suggestions to boost recruiter visibility",
        "5. Track profile view improvements"
      ],
      premium: true,
      icon: "💼"
    },
    {
      title: "Application Tracker & Analytics",
      description: "Monitor all applications and analyze your job search success metrics",
      steps: [
        "1. View all applications in the Applications section",
        "2. Filter by status: In Progress, Interviews, Offers, Rejected",
        "3. Track response rates and callback metrics",
        "4. Identify top performing companies and job types",
        "5. Optimize your job search strategy based on data"
      ],
      premium: false,
      icon: "📊"
    }
  ];

  const recruiterFeatures = [
    {
      title: "AI-Powered Candidate Matching",
      description: "Find top talent instantly with intelligent candidate matching and scoring",
      steps: [
        "1. Post a job opening from the Recruiter Dashboard",
        "2. Applications automatically scored and ranked by AI",
        "3. View top candidates with compatibility scores",
        "4. Filter candidates by skills, experience, and fit",
        "5. See predicted success rate for each candidate"
      ],
      premium: false,
      icon: "🤖"
    },
    {
      title: "Pipeline Management System",
      description: "Organize and track candidates through your entire hiring workflow",
      steps: [
        "1. Create custom pipeline stages in settings",
        "2. Drag candidates between stages (Applied → Interview → Offer)",
        "3. Add notes and feedback for each candidate",
        "4. Set reminders for follow-ups and interview scheduling",
        "5. Get visual overview of your hiring progress"
      ],
      premium: false,
      icon: "📋"
    },
    {
      title: "Video Interview Platform",
      description: "Conduct one-way and live video interviews with integrated recording and analysis",
      steps: [
        "1. Send interview links to candidates via email",
        "2. Candidates record responses to your custom questions",
        "3. Review video recordings with AI-powered analysis",
        "4. Score candidates on communication, clarity, and fit",
        "5. Share feedback with your hiring team"
      ],
      premium: true,
      icon: "🎬",
      highlight: true
    },
    {
      title: "Collaborative Hiring Scorecards",
      description: "Get input from multiple team members on each candidate with structured feedback",
      steps: [
        "1. Create custom evaluation scorecards with your team",
        "2. Invite interviewers to provide feedback",
        "3. Score candidates on key competencies and skills",
        "4. Compare evaluations across multiple reviewers",
        "5. Make data-driven hiring decisions"
      ],
      premium: true,
      icon: "⭐"
    },
    {
      title: "Automated Candidate Screening",
      description: "AI automatically screens applications and identifies qualified candidates",
      steps: [
        "1. Set screening criteria for your job posting",
        "2. AI automatically ranks applications by fit",
        "3. Review top 20% of candidates (pre-screened)",
        "4. Save time reviewing unqualified applications",
        "5. Focus on high-potential candidates only"
      ],
      premium: true,
      icon: "✅"
    },
    {
      title: "Advanced Analytics & Reporting",
      description: "Get insights into your hiring process with comprehensive analytics",
      steps: [
        "1. View hiring funnel metrics and conversion rates",
        "2. Track time-to-hire for each position",
        "3. Analyze hiring source effectiveness",
        "4. Compare candidate quality metrics",
        "5. Export reports for stakeholder presentations"
      ],
      premium: true,
      icon: "📈"
    },
    {
      title: "Job Board Integration",
      description: "Post jobs to multiple job boards simultaneously with one click",
      steps: [
        "1. Create a job posting in AutoJobR",
        "2. Select job boards to post to (Indeed, LinkedIn, etc.)",
        "3. All applications funnel into your AutoJobR pipeline",
        "4. Manage candidates from all sources in one place",
        "5. Track which boards deliver best candidates"
      ],
      premium: false,
      icon: "🌐"
    },
    {
      title: "Background Check Integration",
      description: "Run background checks directly from AutoJobR with trusted providers",
      steps: [
        "1. Select a candidate in your pipeline",
        "2. Initiate background check with one click",
        "3. Candidate receives secure background check link",
        "4. Results automatically update in AutoJobR",
        "5. Flag any concerns for final review"
      ],
      premium: true,
      icon: "🔒"
    },
    {
      title: "Team Collaboration & Permissions",
      description: "Invite team members and control access to specific pipelines and features",
      steps: [
        "1. Go to Team Settings in your dashboard",
        "2. Invite team members via email",
        "3. Assign roles: Admin, Hiring Manager, Interviewer",
        "4. Control access to specific job postings and candidates",
        "5. Track all actions with audit logs"
      ],
      premium: true,
      icon: "👥"
    }
  ];

  const FeatureCard = ({ feature, index }: { feature: any; index: number }) => (
    <Card className={`${feature.highlight ? "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-950" : ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{feature.icon}</span>
              {feature.premium && (
                <Badge variant="default" className="bg-gradient-to-r from-amber-600 to-orange-600">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg">{feature.title}</CardTitle>
            <CardDescription>{feature.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {feature.steps.map((step: string, i: number) => (
            <div key={i} className="flex gap-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">How to Use AutoJobR</h1>
          <p className="text-blue-100 text-lg">Master every feature to land your dream role or build your dream team</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mb-8">
            <TabsTrigger value="job-seeker">For Job Seekers</TabsTrigger>
            <TabsTrigger value="recruiter">For Recruiters</TabsTrigger>
          </TabsList>

          {/* Job Seeker Section */}
          <TabsContent value="job-seeker" className="space-y-8">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                <Star className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">Get Premium Features for Maximum Impact</h2>
                  <p className="text-blue-800 dark:text-blue-200 mb-4">Unlock Referral Marketplace, Interview Coaching, and Premium Tools to dramatically improve your chances of landing interviews and offers.</p>
                  <Link href="/subscription">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Upgrade to Premium
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {jobSeekerFeatures.map((feature, index) => (
                <FeatureCard key={index} feature={feature} index={index} />
              ))}
            </div>

            {/* Premium CTA */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-8 h-8 text-amber-600" />
                  <CardTitle className="text-2xl">Supercharge Your Job Search</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg font-semibold">Premium users get:</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Direct referrals from company employees (3-5x better callback rate)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Unlimited AI interview practice with detailed feedback</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>AI-generated cover letters optimized for each job</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>LinkedIn profile optimization and recruiter visibility boost</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Priority support and personalized career coaching</span>
                  </li>
                </ul>
                <Link href="/subscription">
                  <Button className="w-full mt-6 bg-amber-600 hover:bg-amber-700 text-white" size="lg">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recruiter Section */}
          <TabsContent value="recruiter" className="space-y-8">
            <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Reduce Hiring Time by 60%</h2>
                  <p className="text-indigo-800 dark:text-indigo-200 mb-4">Our enterprise recruiting platform with AI screening, video interviews, and collaborative scorecards transforms your entire hiring process.</p>
                  <Link href="/recruiter-premium">
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      Explore Premium Recruiting
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {recruiterFeatures.map((feature, index) => (
                <FeatureCard key={index} feature={feature} index={index} />
              ))}
            </div>

            {/* Premium CTA */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-indigo-200 dark:border-indigo-800">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-8 h-8 text-indigo-600" />
                  <CardTitle className="text-2xl">Enterprise Recruiting Power</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg font-semibold">Premium Recruiting includes:</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>AI-powered candidate screening and scoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Video interview platform with analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Collaborative hiring scorecards for team feedback</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Background check integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Advanced analytics and reporting</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Unlimited team members and full integrations</span>
                  </li>
                </ul>
                <Link href="/recruiter-premium">
                  <Button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white" size="lg">
                    <Crown className="w-4 h-4 mr-2" />
                    Start Your Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer CTA */}
      <div className="bg-gray-100 dark:bg-gray-900 py-12 px-4 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">Join thousands of job seekers and recruiters transforming their careers and hiring.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/jobs">
              <Button size="lg" variant="default">
                Start Job Search
              </Button>
            </Link>
            <Link href="/post-job">
              <Button size="lg" variant="outline">
                Post a Job
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
