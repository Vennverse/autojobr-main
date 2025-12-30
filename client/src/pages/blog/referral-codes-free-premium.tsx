import SEOHead from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowLeft, CheckCircle, Gift, TrendingUp, Users, Award } from "lucide-react";
import { Link } from "wouter";

export default function ReferralCodesPremiumGuide() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "How to Get Free Premium Job Search Features with Referral Codes",
    "description": "Complete guide to using referral codes like GREGORY to unlock free premium access to job search automation, AI tools, and career coaching without a subscription.",
    "author": {
      "@type": "Organization",
      "name": "AutoJobR Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "AutoJobR",
      "logo": {
        "@type": "ImageObject",
        "url": "https://autojobr.com/logo.png"
      }
    },
    "datePublished": "2025-12-19",
    "dateModified": "2025-12-19",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://autojobr.com/blog/referral-codes-free-premium"
    }
  };

  return (
    <>
      <SEOHead
        title="Get Free Premium Job Search with Referral Codes | GREGORY & GREGORY30"
        description="Learn how to get free premium access with AutoJobr referral codes like GREGORY (7 days) and GREGORY30 (30 days). No subscription needed. Unlimited job applications, AI resume optimization, career coaching - all free."
        keywords="referral codes free premium, GREGORY code AutoJobr, GREGORY30 code, free job search premium, referral code jobs, unlimited job applications free, premium features free, job referral program"
        canonicalUrl="https://autojobr.com/blog/referral-codes-free-premium"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          {/* Back Button */}
          <Link href="/blog">
            <Button variant="outline" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>

          {/* Article Header */}
          <div className="mb-12">
            <Badge className="mb-4">Free Premium Access</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              How to Get Free Premium with Referral Codes
            </h1>
            <div className="flex items-center gap-6 text-gray-600 dark:text-gray-300 mb-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>AutoJobR Team</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>December 19, 2025</span>
              </div>
              <div>5 min read</div>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Unlock premium job search features completely free using AutoJobr's unique referral code system. 
              Get unlimited applications, AI tools, and career coaching without paying for a subscription.
            </p>
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none dark:prose-invert space-y-8">
            
            {/* What are Referral Codes Section */}
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <Gift className="h-8 w-8 text-blue-600" />
                  What Are AutoJobr Referral Codes?
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  AutoJobr's referral code system is our way of rewarding users and helping job seekers access premium features 
                  for free. Unlike other job application platforms, we believe everyone should have access to premium job search 
                  automation tools without paying expensive subscriptions. Referral codes unlock full premium access for 7 days - 
                  completely free, no credit card required.
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Each referral code grants temporary premium access that includes unlimited job applications across 500+ job boards, 
                  AI-powered resume optimization, career coaching, mock interviews, and advanced job matching algorithms.
                </p>
              </CardContent>
            </Card>

            {/* How to Use Referral Codes */}
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  How to Use Referral Codes for Free Premium Access
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center font-bold text-green-600 dark:text-green-400">1</div>
                    <div>
                      <h3 className="font-semibold text-lg">Sign up or log into AutoJobr</h3>
                      <p className="text-gray-600 dark:text-gray-300">Visit autojobr.com and create your free account or log in.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center font-bold text-green-600 dark:text-green-400">2</div>
                    <div>
                      <h3 className="font-semibold text-lg">Go to your profile settings</h3>
                      <p className="text-gray-600 dark:text-gray-300">Navigate to Profile → Referral Code tab.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center font-bold text-green-600 dark:text-green-400">3</div>
                    <div>
                      <h3 className="font-semibold text-lg">Enter a referral code</h3>
                      <p className="text-gray-600 dark:text-gray-300">Paste a valid referral code (like GREGORY) and click activate.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center font-bold text-green-600 dark:text-green-400">4</div>
                    <div>
                      <h3 className="font-semibold text-lg">Enjoy premium features</h3>
                      <p className="text-gray-600 dark:text-gray-300">Your account is instantly upgraded to premium! Start applying to jobs with unlimited automation.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Referral Codes */}
            <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <Award className="h-8 w-8 text-purple-600" />
                  Active Referral Codes
                </h2>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-purple-600">GREGORY30</h3>
                        <p className="text-gray-600 dark:text-gray-300">New 30-Day Launch Special Code</p>
                      </div>
                      <Badge className="bg-purple-500">New & Recommended</Badge>
                    </div>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <strong>30 days</strong> free premium access
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Full access to all premium features
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-purple-600">GREGORY</h3>
                        <p className="text-gray-600 dark:text-gray-300">Official AutoJobr Referral Code</p>
                      </div>
                      <Badge className="bg-green-500">Active</Badge>
                    </div>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <strong>7 days</strong> free premium access
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Unlimited job applications (1000+ daily)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        AI resume optimization & ATS checker
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Career AI coaching & interview prep
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Unlimited uses (no limit on how many times you can use it)
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium Features Section */}
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-600" />
                  What Premium Features Do You Get?
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Job Application Automation</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                      <li>✓ 1000+ automatic applications daily</li>
                      <li>✓ Apply to 500+ job boards</li>
                      <li>✓ AI-powered job matching</li>
                      <li>✓ Auto-fill applications</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">AI Career Tools</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                      <li>✓ Resume ATS optimization</li>
                      <li>✓ AI resume scorer</li>
                      <li>✓ Career AI coaching</li>
                      <li>✓ Cover letter generator</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Interview Preparation</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                      <li>✓ AI mock interviews</li>
                      <li>✓ Real-time feedback</li>
                      <li>✓ Video interview analysis</li>
                      <li>✓ Interview question database</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Advanced Features</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                      <li>✓ LinkedIn optimization</li>
                      <li>✓ Referral network access</li>
                      <li>✓ Job market analytics</li>
                      <li>✓ Salary negotiation tools</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Can I use the GREGORY or GREGORY30 referral codes multiple times?</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Yes! These codes have unlimited uses. Every time you enter them, you get 7 or 30 more days of premium access respectively.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">How long does the free premium access last?</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      It depends on the code. GREGORY grants 7 days, while GREGORY30 grants 30 days of premium access. After that, you can use another code to extend your access.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Do referral codes expire?</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Active codes like GREGORY never expire. They're available indefinitely for all users.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">What happens when my referral code premium expires?</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      You'll be downgraded back to our free plan, but you can use another referral code to get premium again.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Are there other ways to get premium access?</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Yes! You can purchase premium directly or use any active referral code. We also have special offers for students and educators.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white p-12 rounded-lg">
              <h2 className="text-3xl font-bold mb-4">Start Getting Free Premium Today</h2>
              <p className="text-lg mb-6 text-blue-100">Use code GREGORY for 7 days or GREGORY30 for 30 days of unlimited job applications and AI tools</p>
              <Link href="/auth">
                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                  Get Started Free - Use GREGORY30 Code
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
