import SEOHead from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Download, Chrome, Zap, Shield, Star, Users, Target } from "lucide-react";
import { Link } from "wouter";

export default function ChromeExtension() {
  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "One-Click Applications",
      description: "Apply to jobs instantly with a single click on LinkedIn, Indeed, and other job boards."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Smart Job Matching",
      description: "AI automatically identifies jobs that match your profile and career goals."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "ATS Optimization",
      description: "Automatically optimizes your applications to pass Applicant Tracking Systems."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Auto-Fill Forms",
      description: "Instantly fills job application forms with your profile information."
    }
  ];

  const supportedSites = [
    "LinkedIn", "Indeed", "Glassdoor", "Monster", "ZipRecruiter", 
    "AngelList", "Wellfound", "Stack Overflow Jobs", "Dice", 
    "CareerBuilder", "SimplyHired", "FlexJobs"
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AutoJobR Chrome Extension",
    "description": "Chrome extension for automated job applications on LinkedIn, Indeed, and other job boards",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Chrome",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "15000"
    }
  };

  return (
    <>
      <SEOHead
        title="AutoJobR Chrome Extension - Auto-Apply to Jobs on LinkedIn & Indeed"
        description="Download the FREE AutoJobR Chrome Extension to automatically apply to jobs on LinkedIn, Indeed, Glassdoor, and 50+ job boards. One-click applications with ATS optimization."
        keywords="chrome extension, linkedin auto apply, indeed auto apply, job application automation, browser extension, automatic job applications, job search extension"
        canonicalUrl="https://autojobr.com/chrome-extension"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-500 text-white">
              🔥 Most Popular Extension
            </Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AutoJobR Chrome Extension
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Apply to <span className="font-bold text-blue-600">1000+ jobs daily</span> with our FREE Chrome extension. 
              One-click applications on LinkedIn, Indeed, Glassdoor, and 50+ job boards.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
                onClick={() => window.open('https://chromewebstore.google.com/detail/mmldcjloipcifbkacnkmllkkjhdaghgk?utm_source=item-share-cb', '_blank')}
                data-testid="button-download-extension"
              >
                <Chrome className="mr-2 h-5 w-5" />
                Add to Chrome - FREE
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                <Download className="mr-2 h-5 w-5" />
                View Demo
              </Button>
            </div>

            <div className="flex justify-center items-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                4.9/5 Rating
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                100K+ Users
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                100% Free
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <div className="text-blue-600">{feature.icon}</div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Supported Job Boards */}
          <Card className="border-0 shadow-xl mb-16">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Works on 50+ Job Boards</CardTitle>
              <CardDescription className="text-lg">
                Automatically apply to jobs across all major platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap justify-center gap-4">
                {supportedSites.map((site) => (
                  <Badge key={site} variant="secondary" className="px-4 py-2 text-base">
                    {site}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                    1
                  </div>
                  <CardTitle>Install Extension</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Add the AutoJobR extension to Chrome in seconds. It's completely free with no hidden costs.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
                    2
                  </div>
                  <CardTitle>Set Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Configure your job preferences, salary range, and target companies. Our AI learns your preferences.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                    3
                  </div>
                  <CardTitle>Auto-Apply</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Browse job boards normally. The extension automatically identifies and applies to matching jobs.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid md:grid-cols-4 gap-8 mb-16 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">100K+</div>
              <div className="text-gray-600 dark:text-gray-300">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">5M+</div>
              <div className="text-gray-600 dark:text-gray-300">Applications Sent</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">250K+</div>
              <div className="text-gray-600 dark:text-gray-300">Jobs Landed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">92%</div>
              <div className="text-gray-600 dark:text-gray-300">Success Rate</div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">What Users Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    "This extension saved me hours every day. I went from applying to 5 jobs manually to 100+ automatically!"
                  </p>
                  <div className="font-semibold">Sarah M., Software Engineer</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    "Landed my dream job in 2 weeks thanks to this extension. The ATS optimization really works!"
                  </p>
                  <div className="font-semibold">Mike R., Marketing Manager</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    "Game changer for my job search. The one-click applications are incredibly smooth and professional."
                  </p>
                  <div className="font-semibold">Jessica L., Data Analyst</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to 10x Your Job Applications?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join 100,000+ job seekers who have automated their way to career success with our Chrome extension.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
                onClick={() => window.open('https://chromewebstore.google.com/detail/mmldcjloipcifbkacnkmllkkjhdaghgk?utm_source=item-share-cb', '_blank')}
                data-testid="button-install-extension"
              >
                <Chrome className="mr-2 h-5 w-5" />
                Install Extension FREE
              </Button>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}