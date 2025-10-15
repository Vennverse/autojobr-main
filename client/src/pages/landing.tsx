import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
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
  Search
} from "lucide-react";
import logoImage from "@assets/generated_images/AutoJobr_professional_logo_17c702fa_optimized.png";

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

export default function LandingPage() {
  const { user } = useAuth();
  const [companySearch, setCompanySearch] = useState("");
  const [liveApplications, setLiveApplications] = useState(14789);
  const [filteredCompanies, setFilteredCompanies] = useState<string[]>([]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      
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

      {/* Hero Section - Referral Network Focus */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            {/* Live Stats Badge */}
            <Badge className="mb-6 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800 px-4 py-2 text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              {liveApplications.toLocaleString()} applications submitted today
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Get <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Referred</span> to Your
              <br />Dream Company
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-4xl mx-auto">
              Skip HR. Get <strong>direct referrals</strong> from {metrics.referralPartners} employees at {metrics.companies} top companies.
              <br />
              <strong className="text-green-600 dark:text-green-400">{metrics.interviewRate} higher interview rate</strong> than regular applications.
            </p>

            {/* Interactive Company Search */}
            <div className="max-w-2xl mx-auto mb-8">
              <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Search className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-lg">Find Your Referral Partner</h3>
                  </div>
                  <Input
                    placeholder="Search companies (Google, Microsoft, Amazon...)"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="text-lg p-6"
                    data-testid="input-company-search"
                  />
                  {filteredCompanies.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {filteredCompanies.map((company) => (
                        <Link key={company} href="/referral-marketplace">
                          <Badge 
                            className="cursor-pointer hover:scale-105 transition-transform w-full justify-center py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                            data-testid={`badge-company-${company.toLowerCase()}`}
                          >
                            <Building2 className="w-3 h-3 mr-1" />
                            {company}
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                  {companySearch && filteredCompanies.length === 0 && (
                    <p className="mt-4 text-sm text-slate-500">No matches found. Try: {topCompanies.slice(0, 3).join(", ")}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link href="/referral-marketplace">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl px-8 py-6 text-lg group" data-testid="button-browse-referrals">
                  <Handshake className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Browse {metrics.referralPartners} Referral Partners
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/auth">
                <Button variant="outline" size="lg" className="border-2 px-8 py-6 text-lg hover:bg-slate-50 dark:hover:bg-slate-800 group" data-testid="button-start-free">
                  Start Free - No Credit Card
                  <Sparkles className="w-4 h-4 ml-2 group-hover:rotate-12 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="flex justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Free forever plan
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                {metrics.avgTimeToInterview} to first interview
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                No spam, guaranteed
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Referrals Work - Social Proof */}
      <section className="py-16 bg-white/50 dark:bg-slate-800/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="group hover:scale-105 transition-transform">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{metrics.interviewRate}</div>
              <div className="text-slate-600 dark:text-slate-300">Higher Interview Rate</div>
            </div>
            <div className="group hover:scale-105 transition-transform">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">{metrics.referralPartners}</div>
              <div className="text-slate-600 dark:text-slate-300">Active Referral Partners</div>
            </div>
            <div className="group hover:scale-105 transition-transform">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">{metrics.companies}</div>
              <div className="text-slate-600 dark:text-slate-300">Top Companies</div>
            </div>
            <div className="group hover:scale-105 transition-transform">
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">{metrics.avgTimeToInterview}</div>
              <div className="text-slate-600 dark:text-slate-300">Avg. Time to Interview</div>
            </div>
          </div>
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

      {/* Simple Pricing - Focus on Value */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Start Free, Upgrade When Ready
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Try everything free. Upgrade for unlimited access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <Card className="border-2">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">Free Forever</h3>
                <div className="text-4xl font-bold mb-4">$0<span className="text-lg text-slate-500">/month</span></div>
                <ul className="space-y-3 mb-6">
                  {[
                    "Access to referral network",
                    "2 AI interviews/day",
                    "3 resume uploads",
                    "Chrome extension basic",
                    "Browse freelance projects"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth">
                  <Button className="w-full" variant="outline" size="lg" data-testid="button-start-free-plan">
                    Start Free
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-2 border-blue-500 relative shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1">
                  <Crown className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <div className="text-4xl font-bold mb-4">$10<span className="text-lg text-slate-500">/month</span></div>
                <ul className="space-y-3 mb-6">
                  {[
                    "Everything in Free",
                    "Unlimited AI interviews",
                    "Unlimited resumes & analysis",
                    "Priority referral matching",
                    "Advanced Chrome extension",
                    "Freelance project priority",
                    "Interview preparation AI",
                    "Priority support"
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/subscription">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white" size="lg" data-testid="button-upgrade-premium">
                    Upgrade to Premium
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
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
