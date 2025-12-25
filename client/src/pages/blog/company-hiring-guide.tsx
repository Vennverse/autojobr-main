import { SEO } from "@/components/seo";
import SEOHead from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle2,
  Users,
  Target,
  FileText,
  MessageSquare,
  Star,
  ArrowRight,
  Lightbulb,
  TrendingUp,
  Award,
  BookOpen,
  Code
} from "lucide-react";
import { Link } from "wouter";

export interface CompanyData {
  name: string;
  slug: string;
  logo?: string;
  description: string;
  industry: string;
  founded: string;
  headquarters: string;
  employees: string;
  culture: string[];
  interviewProcess: {
    stage: string;
    description: string;
    duration: string;
    tips: string[];
  }[];
  popularRoles: {
    title: string;
    salaryRange: string;
    requirements: string[];
  }[];
  technicalSkills: string[];
  softSkills: string[];
  interviewTips: string[];
  applicationTips: string[];
  commonQuestions: {
    question: string;
    answer: string;
  }[];
  salaryRange: {
    entry: string;
    mid: string;
    senior: string;
  };
  benefits: string[];
  hiringTimeline: string;
  applicationUrl?: string;
}

interface CompanyHiringGuideProps {
  company: CompanyData;
}

export default function CompanyHiringGuide({ company }: CompanyHiringGuideProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `How to Get Hired at ${company.name} in 2025 - Complete Interview Guide`,
    "description": `Complete guide to getting hired at ${company.name}. Learn about the interview process, salary ranges, required skills, and insider tips from successful candidates.`,
    "author": {
      "@type": "Organization",
      "name": "AutoJobr"
    },
    "publisher": {
      "@type": "Organization",
      "name": "AutoJobr",
      "logo": {
        "@type": "ImageObject",
        "url": "https://autojobr.com/favicon.png"
      }
    },
    "datePublished": "2025-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://autojobr.com/blog/how-to-get-hired-at-${company.slug}`
    }
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": company.commonQuestions.map(q => ({
      "@type": "Question",
      "name": q.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.answer
      }
    }))
  };

  const howToStructuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `How to Get Hired at ${company.name}`,
    "description": `Step-by-step guide to landing a job at ${company.name}`,
    "step": company.interviewProcess.map((stage, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": stage.stage,
      "text": stage.description
    }))
  };

  return (
    <>
      <SEO 
        title={`How to Get Hired at ${company.name} in 2025`}
        description={`Complete guide to getting hired at ${company.name}. Learn the ${company.interviewProcess.length}-step interview process, salary ranges, and required skills.`}
      />
      <SEOHead
        title={`How to Get Hired at ${company.name} in 2025 - Interview Guide & Tips | AutoJobr`}
        description={`Complete guide to getting hired at ${company.name}. Learn the ${company.interviewProcess.length}-step interview process, salary ranges (${company.salaryRange.entry} - ${company.salaryRange.senior}), required skills, and insider tips. Updated for 2025.`}
        keywords={`how to get hired at ${company.name.toLowerCase()}, ${company.name.toLowerCase()} interview process, ${company.name.toLowerCase()} salary, ${company.name.toLowerCase()} jobs, ${company.name.toLowerCase()} careers, ${company.name.toLowerCase()} interview questions, work at ${company.name.toLowerCase()}`}
        canonicalUrl={`https://autojobr.com/blog/how-to-get-hired-at-${company.slug}`}
        structuredData={structuredData}
        articleSchema={faqStructuredData}
        breadcrumbs={[
          { name: "Home", url: "https://autojobr.com" },
          { name: "Blog", url: "https://autojobr.com/blog" },
          { name: `How to Get Hired at ${company.name}`, url: `https://autojobr.com/blog/how-to-get-hired-at-${company.slug}` }
        ]}
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToStructuredData) }} />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8 md:py-16">
          
          <header className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              <span>2025 Hiring Guide</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              How to Get Hired at {company.name}
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              {company.description}
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {company.employees} Employees
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {company.headquarters}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {company.hiringTimeline} Hiring Process
              </Badge>
            </div>
          </header>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-2 space-y-8">
              
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Interview Process at {company.name}
                  </CardTitle>
                  <CardDescription>
                    The typical hiring process takes {company.hiringTimeline}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {company.interviewProcess.map((stage, index) => (
                    <div key={index} className="relative pl-8 pb-6 last:pb-0">
                      <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      {index < company.interviewProcess.length - 1 && (
                        <div className="absolute left-3 top-6 w-0.5 h-full bg-blue-100 dark:bg-blue-900/30" />
                      )}
                      <div className="ml-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{stage.stage}</h3>
                          <Badge variant="outline" className="text-xs">{stage.duration}</Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-3">{stage.description}</p>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Tips for this stage:</p>
                          <ul className="space-y-1">
                            {stage.tips.map((tip, tipIndex) => (
                              <li key={tipIndex} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                    Popular Roles at {company.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {company.popularRoles.map((role, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{role.title}</h3>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          {role.salaryRange}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {role.requirements.map((req, reqIndex) => (
                          <Badge key={reqIndex} variant="outline" className="text-xs">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    Common Interview Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {company.commonQuestions.map((q, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-medium mb-2 text-indigo-600 dark:text-indigo-400">{q.question}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{q.answer}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-0 shadow-xl sticky top-4">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Industry</span>
                    <span className="font-medium">{company.industry}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Founded</span>
                    <span className="font-medium">{company.founded}</span>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block mb-2">Salary Ranges</span>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Entry Level</span>
                        <span className="font-medium text-green-600">{company.salaryRange.entry}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mid Level</span>
                        <span className="font-medium text-green-600">{company.salaryRange.mid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Senior Level</span>
                        <span className="font-medium text-green-600">{company.salaryRange.senior}</span>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block mb-2">Top Benefits</span>
                    <div className="flex flex-wrap gap-1">
                      {company.benefits.slice(0, 5).map((benefit, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Code className="w-5 h-5 text-orange-600" />
                    Required Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Technical Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {company.technicalSkills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Soft Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {company.softSkills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="w-5 h-5 text-yellow-600" />
                    Company Culture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {company.culture.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Application Tips for {company.name}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {company.applicationTips.map((tip, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 mb-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{tip}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Interview Success Tips</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {company.interviewTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{tip}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="text-center">
            <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold mb-4">Ready to Apply at {company.name}?</h2>
                <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                  Let AutoJobr help you optimize your resume, prepare for interviews, and auto-apply to matching positions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/resumes">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" data-testid="button-optimize-resume">
                      <FileText className="w-5 h-5 mr-2" />
                      Optimize Resume for {company.name}
                    </Button>
                  </Link>
                  <Link href="/interview-prep-tools">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" data-testid="button-practice-interview">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Practice Interview Questions
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-6">More Company Hiring Guides</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {["google", "amazon", "meta", "microsoft", "apple", "netflix", "uber", "airbnb", "stripe", "openai"].filter(c => c !== company.slug).map((comp) => (
                <Link key={comp} href={`/blog/how-to-get-hired-at-${comp}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    {comp.charAt(0).toUpperCase() + comp.slice(1)}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}