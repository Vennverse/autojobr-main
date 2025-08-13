import SEOHead from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Upload, Zap, Target, TrendingUp, FileText, Award } from "lucide-react";
import { Link } from "wouter";

export default function ATSOptimizer() {
  const features = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Keyword Optimization",
      description: "AI analyzes job descriptions and optimizes your resume with the right keywords to pass ATS filters."
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Format Optimization",
      description: "Ensures your resume format is ATS-friendly with proper sections, headers, and layout."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Score Analysis",
      description: "Get detailed ATS compatibility scores and specific recommendations for improvement."
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Industry Standards",
      description: "Tailored optimization based on your specific industry and job role requirements."
    }
  ];

  const beforeAfter = [
    { metric: "ATS Pass Rate", before: "23%", after: "87%" },
    { metric: "Keyword Match", before: "31%", after: "94%" },
    { metric: "Format Score", before: "45%", after: "98%" },
    { metric: "Interview Callbacks", before: "2%", after: "15%" }
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "ATS Resume Optimizer",
    "description": "AI-powered resume optimization tool that helps your resume pass Applicant Tracking Systems and land more interviews",
    "provider": {
      "@type": "Organization",
      "name": "AutoJobR"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <>
      <SEOHead
        title="Free ATS Resume Optimizer - Beat Applicant Tracking Systems"
        description="Optimize your resume for ATS systems with our FREE AI-powered tool. Increase your pass rate from 23% to 87% and land more interviews. Instant analysis and recommendations."
        keywords="ATS optimizer, applicant tracking system, resume optimization, ATS friendly resume, keyword optimization, resume scanner, ATS checker free"
        canonicalUrl="https://autojobr.com/ats-optimizer"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-500 text-white">
              🔥 100% FREE ATS Analysis
            </Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ATS Resume Optimizer
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Beat Applicant Tracking Systems with our FREE AI-powered optimizer. 
              Increase your ATS pass rate from <span className="font-bold text-red-500">23%</span> to <span className="font-bold text-green-500">87%</span> instantly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg">
                <Upload className="mr-2 h-5 w-5" />
                Analyze Resume FREE
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                <Zap className="mr-2 h-5 w-5" />
                See Example Report
              </Button>
            </div>

            <div className="flex justify-center items-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Instant Analysis
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                No Registration Required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Completely Free
              </div>
            </div>
          </div>

          {/* Before/After Stats */}
          <Card className="border-0 shadow-xl mb-16">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Proven Results</CardTitle>
              <CardDescription className="text-lg">
                See how our ATS optimizer transforms resume performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-8">
                {beforeAfter.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="font-semibold text-lg mb-2">{stat.metric}</div>
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-500">{stat.before}</div>
                        <div className="text-sm text-gray-500">Before</div>
                      </div>
                      <div className="text-2xl text-gray-400">→</div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">{stat.after}</div>
                        <div className="text-sm text-gray-500">After</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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

          {/* How It Works */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-blue-600">
                    1
                  </div>
                  <CardTitle>Upload Resume</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Upload your current resume in PDF, Word, or text format. No registration required.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">
                    2
                  </div>
                  <CardTitle>AI Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Our AI analyzes your resume against 1000+ ATS systems and industry standards.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-xl">
                <CardHeader>
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-purple-600">
                    3
                  </div>
                  <CardTitle>Get Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Receive detailed recommendations and an optimized version of your resume instantly.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ATS Insights */}
          <Card className="border-0 shadow-xl mb-16">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Why ATS Optimization Matters</CardTitle>
              <CardDescription className="text-lg">
                Understanding the reality of modern job applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-xl font-semibold mb-4">The Problem</h3>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>98% of Fortune 500 companies use ATS systems</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>75% of resumes are rejected before human review</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Only 2% of applications result in interviews</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Most candidates don't know why they're rejected</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">The Solution</h3>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>AI-powered keyword optimization</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>ATS-friendly formatting guaranteed</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Industry-specific recommendations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Detailed improvement roadmap</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Stop Getting Rejected by ATS Systems</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Get your FREE ATS analysis now and discover why your resume isn't getting past the robots.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg">
                <Upload className="mr-2 h-5 w-5" />
                Analyze My Resume FREE
              </Button>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg">
                  Create Free Account
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              No credit card required • Instant results • 100% secure
            </p>
          </div>
        </div>
      </div>
    </>
  );
}