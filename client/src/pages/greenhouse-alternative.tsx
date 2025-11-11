import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Zap, DollarSign, Clock, Users, Sparkles, Target, Crown } from "lucide-react";
import { Link } from "wouter";

export default function GreenhouseAlternative() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Helmet>
        <title>Greenhouse Alternative - Save 90% on ATS Software | AutoJobr</title>
        <meta name="description" content="Switch from Greenhouse to AutoJobr and save $6,000/year. Get AI-powered interviews, automated candidate screening, and all ATS features at 1/10th the cost. Free trial available." />
        <meta name="keywords" content="greenhouse alternative, affordable ats, recruiting software, applicant tracking system, greenhouse pricing, ats for startups" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Greenhouse Alternative - Save 90% | AutoJobr" />
        <meta property="og:description" content="All the features of Greenhouse at 1/10th the price. AI interviews, automated screening, and seamless hiring workflows." />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Greenhouse Alternative - Save 90% | AutoJobr" />
        <meta name="twitter:description" content="Get enterprise ATS features without enterprise pricing" />
        
        <link rel="canonical" href="https://autojobr.com/greenhouse-alternative" />
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16" data-testid="hero-section">
          <div className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            💰 Save $6,000+ per year vs Greenhouse
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            The Smart Alternative to Greenhouse
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Get all the features you need at <span className="font-bold text-blue-600">1/10th the cost</span>. 
            Plus AI-powered interviews, automated screening, and features Greenhouse doesn't have.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg" data-testid="button-start-free-trial">
                <Sparkles className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg" data-testid="button-watch-demo">
                Watch Demo
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ✅ No credit card required • ✅ Setup in 5 minutes • ✅ Cancel anytime
          </p>
        </div>

        {/* Pricing Comparison */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Pricing Comparison</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 border-gray-200 dark:border-gray-700">
              <CardHeader className="bg-gray-50 dark:bg-gray-800">
                <CardTitle className="flex items-center gap-2">
                  <X className="w-6 h-6 text-red-500" />
                  Greenhouse
                </CardTitle>
                <CardDescription>Enterprise ATS - Expensive</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-4xl font-bold mb-2">$6,500+</div>
                <div className="text-gray-600 dark:text-gray-400 mb-6">per year</div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-400">Expensive for startups & SMBs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-400">No AI interviewer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-400">Manual job posting required</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-400">Complex setup & onboarding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-400">Limited automation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500 dark:border-blue-400 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  AutoJobr
                </CardTitle>
                <CardDescription>Modern ATS with AI - Affordable</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-4xl font-bold mb-2 text-blue-600">$49</div>
                <div className="text-gray-600 dark:text-gray-400 mb-6">per month</div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold">90% cheaper than Greenhouse</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold">AI-powered interviews & screening</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold">Auto-populate jobs from major sites</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold">Setup in 5 minutes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold">Full automation & workflows</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Feature Comparison</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-center p-4 font-semibold">Greenhouse</th>
                      <th className="text-center p-4 font-semibold bg-blue-50 dark:bg-blue-900">AutoJobr</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    <tr>
                      <td className="p-4">Applicant Tracking</td>
                      <td className="text-center p-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="text-center p-4 bg-blue-50 dark:bg-blue-900/30"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4">Interview Scheduling</td>
                      <td className="text-center p-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="text-center p-4 bg-blue-50 dark:bg-blue-900/30"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4">Collaborative Hiring</td>
                      <td className="text-center p-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="text-center p-4 bg-blue-50 dark:bg-blue-900/30"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">AI-Powered Interviews</td>
                      <td className="text-center p-4"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="text-center p-4 bg-blue-50 dark:bg-blue-900/30"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">Automated Candidate Screening</td>
                      <td className="text-center p-4"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="text-center p-4 bg-blue-50 dark:bg-blue-900/30"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">Job Aggregation (Auto-populate)</td>
                      <td className="text-center p-4"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="text-center p-4 bg-blue-50 dark:bg-blue-900/30"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">Bidder Marketplace</td>
                      <td className="text-center p-4"><X className="w-5 h-5 text-red-500 mx-auto" /></td>
                      <td className="text-center p-4 bg-blue-50 dark:bg-blue-900/30"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold">AI Resume Analysis</td>
                      <td className="text-center p-4">Basic</td>
                      <td className="text-center p-4 bg-blue-50 dark:bg-blue-900/30">Advanced AI</td>
                    </tr>
                    <tr className="bg-yellow-50 dark:bg-yellow-900/20">
                      <td className="p-4 font-bold">Annual Cost</td>
                      <td className="text-center p-4 font-bold text-red-600">$6,500+</td>
                      <td className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 font-bold text-green-600">$588</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Companies Switch from Greenhouse</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card data-testid="card-benefit-cost">
              <CardHeader>
                <DollarSign className="w-12 h-12 text-green-500 mb-4" />
                <CardTitle>90% Cost Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Save over $6,000 per year while getting more features. Perfect for startups and SMBs who can't justify Greenhouse pricing.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-benefit-ai">
              <CardHeader>
                <Zap className="w-12 h-12 text-blue-500 mb-4" />
                <CardTitle>AI-Powered Automation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Our AI conducts initial interviews, screens resumes, and ranks candidates automatically - features Greenhouse doesn't offer.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-benefit-setup">
              <CardHeader>
                <Clock className="w-12 h-12 text-purple-500 mb-4" />
                <CardTitle>Quick Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Start recruiting in 5 minutes, not weeks. No complex onboarding or lengthy implementation process required.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Save $6,000+ Per Year?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of companies who switched from Greenhouse to AutoJobr
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" data-testid="button-cta-signup">
                <Crown className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 px-8 py-6 text-lg" data-testid="button-cta-contact">
                Talk to Sales
              </Button>
            </Link>
          </div>
          <p className="text-sm mt-6 opacity-75">
            💳 No credit card required • 🚀 Setup in 5 minutes • ✅ 30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}
