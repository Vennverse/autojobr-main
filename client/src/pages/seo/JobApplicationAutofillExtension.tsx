import SEOHead from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Chrome, Zap, Upload, Users, Clock, Star, Target } from "lucide-react";
import { Link } from "wouter";

export default function JobApplicationAutofillExtension() {
  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Auto-Fill All Fields",
      description: "Instantly fills name, contact info, experience, education, and skills across any job board."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Smart Field Detection",
      description: "AI recognizes form fields regardless of layout and fills them with appropriate information."
    },
    {
      icon: <Upload className="h-6 w-6" />,
      title: "Resume Upload",
      description: "Automatically uploads your resume and cover letter to application forms when required."
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Save 15+ Minutes",
      description: "Reduce application time from 15 minutes to 30 seconds with intelligent automation."
    }
  ];

  const supportedSites = [
    "LinkedIn", "Indeed", "Glassdoor", "Monster", "ZipRecruiter", "CareerBuilder",
    "Dice", "AngelList", "Wellfound", "FlexJobs", "Remote.co", "We Work Remotely"
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Job Application Autofill Chrome Extension",
    "description": "Free Chrome extension that automatically fills job application forms on LinkedIn, Indeed, Glassdoor and other job boards",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Chrome",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "25000"
    }
  };

  return (
    <>
      <SEOHead
        title="Job Application Autofill Chrome Extension | Auto-Fill LinkedIn, Indeed Forms"
        description="Free Chrome extension that automatically fills job application forms on LinkedIn, Indeed, Glassdoor & 50+ job boards. Save 15+ minutes per application with smart autofill."
        keywords="job application autofill extension, chrome extension autofill jobs, LinkedIn autofill extension, Indeed form filler, automatic job application forms, job board autofill tool, application form automation, resume autofill chrome, job search autofill, career form filler"
        canonicalUrl="https://autojobr.com/job-application-autofill-extension"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-500 text-white">
              🚀 #1 Autofill Extension
            </Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Job Application Autofill Extension
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              <span className="font-bold text-blue-600">FREE Chrome extension</span> that automatically fills job application forms on LinkedIn, Indeed, Glassdoor, and 50+ job boards. 
              Save <span className="font-bold text-green-600">15+ minutes per application</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-4 text-lg">
                <Chrome className="mr-2 h-5 w-5" />
                Add to Chrome FREE
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                <Zap className="mr-2 h-5 w-5" />
                See Demo
              </Button>
            </div>

            <div className="flex justify-center items-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                4.8/5 Rating
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                250K+ Users
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                100% Free
              </div>
            </div>
          </div>

          {/* Before/After Comparison */}
          <Card className="border-0 shadow-xl mb-16">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Manual vs Autofill Comparison</CardTitle>
              <CardDescription className="text-lg">
                See how much time you save with automatic form filling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="text-center">
                  <div className="text-6xl font-bold text-red-500 mb-4">15-20 min</div>
                  <h3 className="text-xl font-semibold mb-4">Manual Application</h3>
                  <ul className="text-left space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• Type personal information</li>
                    <li>• Upload resume file</li>
                    <li>• Fill education details</li>
                    <li>• Enter work experience</li>
                    <li>• List skills and certifications</li>
                    <li>• Write cover letter</li>
                    <li>• Answer screening questions</li>
                  </ul>
                </div>
                <div className="text-center">
                  <div className="text-6xl font-bold text-green-500 mb-4">30 sec</div>
                  <h3 className="text-xl font-semibold mb-4">With Autofill Extension</h3>
                  <ul className="text-left space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• Auto-fills all personal info</li>
                    <li>• Uploads resume automatically</li>
                    <li>• Populates education instantly</li>
                    <li>• Fills experience details</li>
                    <li>• Auto-adds relevant skills</li>
                    <li>• Generates cover letter</li>
                    <li>• Smart screening responses</li>
                  </ul>
                </div>
              </div>
              <div className="text-center mt-8">
                <div className="text-3xl font-bold text-blue-600">30x Faster Application Process</div>
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
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
                Universal compatibility with all major job sites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {supportedSites.map((site, index) => (
                  <Badge key={index} variant="secondary" className="px-4 py-3 text-base justify-center">
                    {site}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">How the Autofill Extension Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                    1
                  </div>
                  <CardTitle>Install & Setup</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Install the extension from Chrome Web Store and set up your profile with resume and preferences.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
                    2
                  </div>
                  <CardTitle>Visit Job Sites</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Browse jobs normally on LinkedIn, Indeed, or any supported job board. Extension activates automatically.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                    3
                  </div>
                  <CardTitle>Auto-Fill Forms</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Click the autofill button and watch as all form fields are populated instantly with your information.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center border-0 shadow-xl">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Save Hours Daily</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Apply to 30+ jobs in the time it takes to manually complete 1 application. Massive productivity boost.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-xl">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>Perfect Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  No more typos or missed fields. AI ensures every application is filled accurately and completely.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-xl">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>Instant Setup</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Ready to use in under 2 minutes. No complex configuration or learning curve required.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Success Statistics */}
          <div className="grid md:grid-cols-4 gap-8 mb-16 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">250K+</div>
              <div className="text-gray-600 dark:text-gray-300">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">15 min</div>
              <div className="text-gray-600 dark:text-gray-300">Time Saved Per App</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-gray-600 dark:text-gray-300">Supported Sites</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">4.8/5</div>
              <div className="text-gray-600 dark:text-gray-300">User Rating</div>
            </div>
          </div>

          {/* User Testimonials */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">What Users Are Saying</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    "This extension is a game changer! I used to spend 20 minutes per application, now it takes 30 seconds. Applied to 50 jobs yesterday!"
                  </p>
                  <div className="font-semibold">Alex K., Software Developer</div>
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
                    "Perfect for students like me! Fills out all the boring form fields instantly. Got 3 interview calls this week."
                  </p>
                  <div className="font-semibold">Maria S., College Student</div>
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
                    "Works flawlessly on every job site. No more repetitive typing. This extension paid for itself in time savings on day one."
                  </p>
                  <div className="font-semibold">Robert L., Marketing Manager</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Automate Your Job Applications?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join 250,000+ job seekers who save hours every day with our autofill extension.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-4 text-lg">
                <Chrome className="mr-2 h-5 w-5" />
                Install Extension FREE
              </Button>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                  Create Account
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              No payment required • Works on all job boards • 2-minute setup
            </p>
          </div>
        </div>
      </div>
    </>
  );
}