import SEOHead from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Home, Clock, DollarSign, MapPin, Users, BookOpen, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function RemoteJobsStudents() {
  const jobCategories = [
    {
      title: "Software Development",
      jobs: "15,000+",
      salaryRange: "$40k-$120k",
      icon: <BookOpen className="h-6 w-6" />,
      description: "Frontend, backend, full-stack development roles"
    },
    {
      title: "Digital Marketing", 
      jobs: "8,500+",
      salaryRange: "$30k-$80k",
      icon: <TrendingUp className="h-6 w-6" />,
      description: "SEO, social media, content marketing positions"
    },
    {
      title: "Customer Support",
      jobs: "12,000+", 
      salaryRange: "$25k-$60k",
      icon: <Users className="h-6 w-6" />,
      description: "Technical support, customer success roles"
    },
    {
      title: "Data Analysis",
      jobs: "6,200+",
      salaryRange: "$45k-$100k", 
      icon: <TrendingUp className="h-6 w-6" />,
      description: "Data science, analytics, research positions"
    }
  ];

  const topCompanies = [
    "Shopify", "GitLab", "Buffer", "Zapier", "Automattic", "InVision", 
    "Toptal", "FlexJobs", "We Work Remotely", "Remote.co", "AngelList", "Upwork"
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Best Remote Jobs for Students 2025 - Entry Level Work From Home",
    "description": "Find the best remote jobs for students and freshers in 2025. Entry-level work from home opportunities with flexible schedules and competitive salaries.",
    "author": {
      "@type": "Organization", 
      "name": "AutoJobR"
    },
    "datePublished": "2025-08-13",
    "dateModified": "2025-08-13"
  };

  return (
    <>
      <SEOHead
        title="Best Remote Jobs for Students 2025 | Entry Level Work From Home Jobs"
        description="Discover 40,000+ remote jobs perfect for students and freshers in 2025. Entry-level work from home opportunities, flexible part-time positions, and student-friendly remote careers with top companies."
        keywords="remote jobs for students 2025, work from home jobs students, entry level remote jobs, part time remote work students, freshers remote jobs, student remote internships, online jobs for college students, work from home entry level, remote student jobs, flexible jobs students, virtual jobs freshers, home based jobs students, remote work opportunities students, online part time jobs, student friendly remote jobs"
        canonicalUrl="https://autojobr.com/remote-jobs-students-2025"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-500 text-white">
              🎓 Student Special 2025
            </Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Remote Jobs for Students 2025
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Find <span className="font-bold text-green-600">40,000+ entry-level remote jobs</span> perfect for students and fresh graduates. 
              Work from anywhere with flexible schedules and competitive pay.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/auth">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 text-lg">
                  <Home className="mr-2 h-5 w-5" />
                  Find Remote Jobs
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                <BookOpen className="mr-2 h-5 w-5" />
                Student Guide
              </Button>
            </div>

            <div className="flex justify-center items-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                500K+ Students
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Entry-Level Friendly
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Flexible Hours
              </div>
            </div>
          </div>

          {/* Job Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {jobCategories.map((category, index) => (
              <Card key={index} className="text-center border-0 shadow-xl hover:shadow-2xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <div className="text-green-600">{category.icon}</div>
                  </div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <div className="text-2xl font-bold text-green-600">{category.jobs}</div>
                  <div className="text-lg font-semibold text-blue-600">{category.salaryRange}</div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Student Benefits */}
          <Card className="border-0 shadow-xl mb-16">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Why Remote Work is Perfect for Students</CardTitle>
              <CardDescription className="text-lg">
                Flexible opportunities that fit your academic schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Flexible Schedule</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Work around your class schedule and exam periods. Many positions offer part-time and project-based work.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Earn While Learning</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Gain real work experience and build your resume while earning money to support your education.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Work From Anywhere</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    No commute required. Work from your dorm, home, or anywhere with internet connection.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Remote Companies */}
          <Card className="border-0 shadow-xl mb-16">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Top Companies Hiring Remote Students</CardTitle>
              <CardDescription className="text-lg">
                Student-friendly companies with remote-first culture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap justify-center gap-4">
                {topCompanies.map((company, index) => (
                  <Badge key={index} variant="secondary" className="px-4 py-2 text-base hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer">
                    {company}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Getting Started Guide */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">How to Land Your First Remote Job</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                    1
                  </div>
                  <CardTitle>Build Your Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Create a strong remote-focused resume highlighting your skills, projects, and any online experience.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
                    2
                  </div>
                  <CardTitle>Apply Strategically</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Use AutoJobR to automatically apply to hundreds of entry-level remote positions daily.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                    3
                  </div>
                  <CardTitle>Ace Remote Interviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Practice virtual interviews and demonstrate your remote work skills and communication abilities.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Success Statistics */}
          <div className="grid md:grid-cols-4 gap-8 mb-16 text-center">
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">40K+</div>
              <div className="text-gray-600 dark:text-gray-300">Remote Jobs Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">500K+</div>
              <div className="text-gray-600 dark:text-gray-300">Students Using Platform</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">85%</div>
              <div className="text-gray-600 dark:text-gray-300">Success Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">$45k</div>
              <div className="text-gray-600 dark:text-gray-300">Average Starting Salary</div>
            </div>
          </div>

          {/* Latest Remote Job Trends */}
          <Card className="border-0 shadow-xl mb-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">2025 Remote Job Trends for Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Hot Remote Skills</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>AI & Machine Learning basics</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Digital marketing & SEO</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Social media management</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Data analysis & Excel</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Content creation & writing</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Growing Remote Sectors</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>EdTech & Online Education</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>E-commerce & Digital Retail</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>FinTech & Digital Banking</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>HealthTech & Telemedicine</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>SaaS & Cloud Services</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Start Your Remote Career Journey Today</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join 500,000+ students who have found remote jobs using AutoJobR's AI-powered job matching platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-4 text-lg">
                  <Home className="mr-2 h-5 w-5" />
                  Find Remote Jobs Now
                </Button>
              </Link>
              <Link href="/chrome-extension">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                  Download Extension
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Free forever • Student-friendly • No experience required for many positions
            </p>
          </div>
        </div>
      </div>
    </>
  );
}