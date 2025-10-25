import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Rocket, Zap, DollarSign, Users, TrendingUp, Sparkles, Target } from "lucide-react";
import { Link } from "wouter";

export default function AtsForStartups() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Helmet>
        <title>Best ATS for Startups - Affordable Recruiting Software | AutoJobr</title>
        <meta name="description" content="Applicant tracking system built for startups. Get AI-powered hiring, automated interviews, and full ATS features for $49/month. Scale from 1 to 100+ employees affordably." />
        <meta name="keywords" content="ats for startups, startup recruiting software, affordable ats, applicant tracking system startups, hiring software early stage" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Best ATS for Startups | AutoJobr" />
        <meta property="og:description" content="Built for fast-growing startups. AI interviews, automated screening, and enterprise features without enterprise pricing." />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Best ATS for Startups | AutoJobr" />
        <meta name="twitter:description" content="Affordable ATS that scales with your startup" />
        
        <link rel="canonical" href="https://autojobr.com/ats-for-startups" />
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16" data-testid="hero-section">
          <div className="inline-block bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            🚀 Trusted by 500+ Startups
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            The ATS Built for Startups
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Scale your hiring from 0 to 100+ employees without breaking the bank. 
            Get <span className="font-bold text-purple-600">enterprise features</span> at startup pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg" data-testid="button-start-free">
                <Rocket className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg" data-testid="button-see-demo">
                See How It Works
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ✅ Free for first 30 days • ✅ No credit card required • ✅ Setup in 5 minutes
          </p>
        </div>

        {/* Problem Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">The Startup Hiring Challenge</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Traditional ATS Systems</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">❌</span>
                    <span>Enterprise pricing ($3K-10K/year) kills startup budgets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">❌</span>
                    <span>Complex setup takes weeks, you need to hire NOW</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">❌</span>
                    <span>Manual screening wastes founder time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">❌</span>
                    <span>Overkill features you'll never use</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">❌</span>
                    <span>Pay per user - expensive as you scale</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
              <CardHeader>
                <CardTitle className="text-green-600 dark:text-green-400">AutoJobr for Startups</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✅</span>
                    <span className="font-semibold">$49/month flat - no per-user fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✅</span>
                    <span className="font-semibold">Setup in 5 minutes, start hiring today</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✅</span>
                    <span className="font-semibold">AI screens candidates automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✅</span>
                    <span className="font-semibold">Only features startups actually need</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✅</span>
                    <span className="font-semibold">Unlimited users - scale freely</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features for Startup Stages */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Grow from 1 to 100+ Employees</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card data-testid="card-stage-early">
              <CardHeader>
                <Target className="w-12 h-12 text-purple-500 mb-4" />
                <CardTitle>Pre-Seed / Seed</CardTitle>
                <CardDescription>Making your first hires (1-10 employees)</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>AI-powered resume screening</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Automated interview scheduling</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Collaborative hiring scorecards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Job board integrations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-stage-growth" className="border-2 border-purple-500">
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-blue-500 mb-4" />
                <CardTitle>Series A / B</CardTitle>
                <CardDescription>Scaling fast (10-50 employees)</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Bulk candidate management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Multi-stage interview pipelines</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Team collaboration & permissions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Analytics & reporting dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Email automation & templates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card data-testid="card-stage-scale">
              <CardHeader>
                <Zap className="w-12 h-12 text-amber-500 mb-4" />
                <CardTitle>Series C+</CardTitle>
                <CardDescription>Enterprise scale (50+ employees)</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Advanced CRM & sourcing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Custom workflows & automation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>API access & integrations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Compliance & audit trails</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Dedicated support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Unique Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Features Built for Fast-Moving Startups</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card data-testid="feature-ai-interviews">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-purple-500" />
                  <div>
                    <CardTitle>AI Virtual Interviews</CardTitle>
                    <CardDescription>Screen 100 candidates in the time it takes to interview 1</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Our AI conducts initial video or chat interviews 24/7. Get detailed candidate assessments without spending founder time on screening calls.
                </p>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                    💡 Typical ROI: Save 15+ hours per week on screening
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="feature-job-aggregation">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Target className="w-8 h-8 text-blue-500" />
                  <div>
                    <CardTitle>Auto Job Aggregation</CardTitle>
                    <CardDescription>Post once, appear everywhere</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Automatically sync your jobs to Indeed, LinkedIn, Naukri, and 50+ job boards. Plus scrape relevant candidates from major platforms.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    💡 Typical ROI: 5x more candidate applications
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="feature-chrome-extension">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 text-amber-500" />
                  <div>
                    <CardTitle>Chrome Extension for Sourcing</CardTitle>
                    <CardDescription>Find candidates anywhere on the web</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Browse LinkedIn, GitHub, or any site and add candidates to your pipeline with one click. Build your talent pool while you browse.
                </p>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    💡 Typical ROI: Build 200+ candidate pipeline in 1 week
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="feature-referrals">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-green-500" />
                  <div>
                    <CardTitle>Referral Marketplace</CardTitle>
                    <CardDescription>Tap into 10,000+ employee networks</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Access our marketplace of employees at top companies who can refer you. Get warm introductions to qualified candidates.
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                    💡 Typical ROI: 3x higher interview-to-offer ratio
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Simple, Startup-Friendly Pricing</h2>
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-purple-500 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30">
                <CardTitle className="text-2xl">Startup Plan</CardTitle>
                <CardDescription>Everything you need to scale hiring</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold mb-2">$49</div>
                  <div className="text-gray-600 dark:text-gray-400">per month</div>
                  <div className="text-sm text-green-600 dark:text-green-400 font-semibold mt-2">
                    First 30 days FREE
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Unlimited users & candidates</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>AI-powered interviews</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Auto job board posting</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Chrome extension</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Referral marketplace access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>Email & chat support</span>
                  </li>
                </ul>
                <Link href="/signup">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white" size="lg" data-testid="button-pricing-signup">
                    Start Free Trial
                  </Button>
                </Link>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                  No credit card required • Cancel anytime
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join 500+ Startups Growing with AutoJobr
          </h2>
          <p className="text-xl mb-8 opacity-90">
            From YC-backed startups to bootstrapped SaaS companies
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" data-testid="button-final-cta">
              <Rocket className="w-5 h-5 mr-2" />
              Start Hiring Today - Free for 30 Days
            </Button>
          </Link>
          <p className="text-sm mt-6 opacity-75">
            💳 No credit card required • 🚀 Setup in 5 minutes • ✅ Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
