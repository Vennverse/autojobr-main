import SEOHead from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MousePointer, Clock, Target, Zap, Users, Award, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function OneClickApplyJobs() {
  const cities = [
    "New York", "San Francisco", "Austin", "Seattle", "Denver", "Atlanta",
    "Boston", "Chicago", "Los Angeles", "Miami", "Portland", "Nashville",
    "Toronto", "Vancouver", "London", "Berlin", "Amsterdam", "Sydney"
  ];

  const jobBoards = [
    { name: "LinkedIn", applications: "2.5M+", time: "1 second" },
    { name: "Indeed", applications: "1.8M+", time: "1 second" },
    { name: "Glassdoor", applications: "950K+", time: "1 second" },
    { name: "AngelList", applications: "500K+", time: "1 second" },
    { name: "ZipRecruiter", applications: "750K+", time: "1 second" },
    { name: "Monster", applications: "650K+", time: "1 second" }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "1 Click Apply Jobs Tool",
    "description": "Apply to jobs instantly with one click across LinkedIn, Indeed, Glassdoor and 50+ job boards. AI-powered application automation.",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, Chrome Extension",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <SEOHead
        title="1 Click Apply Jobs | Instant Job Applications on LinkedIn, Indeed & More"
        description="Apply to jobs instantly with 1 click! Auto-fill applications on LinkedIn, Indeed, Glassdoor & 50+ job boards. AI-powered job application automation tool. Apply to 1000+ jobs daily."
        keywords="1 click apply jobs, one click job application, instant job apply, auto apply jobs, job application automation, LinkedIn one click apply, Indeed quick apply, automatic job applications, job autofill tool, apply jobs faster, instant application tool, job search automation, quick job apply"
        canonicalUrl="https://autojobr.com/1-click-apply-jobs"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500 text-white">
              ⚡ Instant Applications
            </Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              1 Click Apply Jobs
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Apply to jobs instantly with <span className="font-bold text-purple-600">one click</span> across LinkedIn, Indeed, Glassdoor, and 50+ job boards. 
              Turn hours of application work into <span className="font-bold text-blue-600">seconds</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/auth">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg">
                  <MousePointer className="mr-2 h-5 w-5" />
                  Start 1-Click Applying
                </Button>
              </Link>
              <Link href="/chrome-extension">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                  <Zap className="mr-2 h-5 w-5" />
                  Get Chrome Extension
                </Button>
              </Link>
            </div>

            <div className="flex justify-center items-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                1 Second Per Application
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                50+ Job Boards
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                2M+ Applications Daily
              </div>
            </div>
          </div>

          {/* Speed Comparison */}
          <Card className="border-0 shadow-xl mb-16">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Manual vs 1-Click Application Speed</CardTitle>
              <CardDescription className="text-lg">
                See the dramatic time savings with automated applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="text-center">
                  <div className="text-6xl font-bold text-red-500 mb-4">15 min</div>
                  <h3 className="text-xl font-semibold mb-4">Manual Application</h3>
                  <ul className="text-left space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• Find job posting</li>
                    <li>• Read job description</li>
                    <li>• Fill out application form</li>
                    <li>• Upload resume & cover letter</li>
                    <li>• Answer screening questions</li>
                    <li>• Submit application</li>
                  </ul>
                </div>
                <div className="text-center">
                  <div className="text-6xl font-bold text-green-500 mb-4">1 sec</div>
                  <h3 className="text-xl font-semibold mb-4">1-Click Application</h3>
                  <ul className="text-left space-y-2 text-gray-600 dark:text-gray-300">
                    <li>• AI finds relevant jobs</li>
                    <li>• Auto-fills all forms</li>
                    <li>• Optimizes for ATS systems</li>
                    <li>• Customizes cover letter</li>
                    <li>• Answers questions intelligently</li>
                    <li>• Submits instantly</li>
                  </ul>
                </div>
              </div>
              <div className="text-center mt-8">
                <div className="text-3xl font-bold text-purple-600">900x Faster</div>
                <div className="text-gray-600 dark:text-gray-300">Apply to 900 jobs in the time it takes to apply to 1 manually</div>
              </div>
            </CardContent>
          </Card>

          {/* Supported Job Boards */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Works on All Major Job Boards</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobBoards.map((board, index) => (
                <Card key={index} className="border-0 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{board.name}</CardTitle>
                      <Badge variant="secondary">{board.time}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600 mb-2">{board.applications}</div>
                    <div className="text-gray-600 dark:text-gray-300">applications processed</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cities Section */}
          <Card className="border-0 shadow-xl mb-16">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">1-Click Apply in Any City</CardTitle>
              <CardDescription className="text-lg">
                Find jobs instantly in major cities worldwide
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {cities.map((city, index) => (
                  <Link key={index} href={`/jobs?location=${city.toLowerCase()}`}>
                    <Badge variant="outline" className="w-full justify-center py-2 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer">
                      {city}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">How 1-Click Apply Works</h2>
            <div className="grid md:grid-cols-4 gap-8">
              <Card className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                    1
                  </div>
                  <CardTitle>Setup Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Add your resume, preferences, and target job criteria once. Our AI learns your profile.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                    2
                  </div>
                  <CardTitle>Browse Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Visit any job board normally. Our extension detects relevant job postings automatically.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
                    3
                  </div>
                  <CardTitle>Click to Apply</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    One click applies to the job with optimized resume, cover letter, and responses.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-orange-600">
                    4
                  </div>
                  <CardTitle>Track Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Monitor all applications in your dashboard with status updates and response tracking.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <Card className="text-center border-0 shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Save 99% Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Apply to 1000+ jobs in the time it takes to apply to 1 manually. Massive time savings.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Higher Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  AI optimizes each application for ATS systems and job requirements, increasing response rates.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Professional Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Every application is customized and professional, maintaining quality at scale.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Better Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Apply to more jobs = more opportunities = better chances of landing your dream role.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Success Stats */}
          <div className="grid md:grid-cols-4 gap-8 mb-16 text-center">
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">1 sec</div>
              <div className="text-gray-600 dark:text-gray-300">Per Application</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">2M+</div>
              <div className="text-gray-600 dark:text-gray-300">Daily Applications</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">50+</div>
              <div className="text-gray-600 dark:text-gray-300">Job Boards Supported</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">94%</div>
              <div className="text-gray-600 dark:text-gray-300">User Satisfaction</div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Apply 900x Faster?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join 2 million users who have revolutionized their job search with 1-click applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg">
                  <MousePointer className="mr-2 h-5 w-5" />
                  Start 1-Click Applying
                </Button>
              </Link>
              <Link href="/chrome-extension">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                  <Zap className="mr-2 h-5 w-5" />
                  Install Extension
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Free to start • No credit card required • Works on all job boards
            </p>
          </div>
        </div>
      </div>
    </>
  );
}