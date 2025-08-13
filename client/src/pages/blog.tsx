import SEOHead from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight, TrendingUp, Target, Briefcase } from "lucide-react";
import { Link } from "wouter";

export default function Blog() {
  const blogPosts = [
    {
      id: 1,
      title: "How to Beat ATS Systems in 2025: Complete Guide",
      excerpt: "Learn the latest strategies to optimize your resume and applications for Applicant Tracking Systems.",
      author: "AutoJobR Team",
      date: "2025-08-13",
      category: "ATS Optimization",
      slug: "beat-ats-systems-2025-guide",
      readTime: "8 min read"
    },
    {
      id: 2,
      title: "Automate Your LinkedIn Job Applications: Step-by-Step",
      excerpt: "Master LinkedIn automation with our comprehensive guide to applying to hundreds of jobs daily.",
      author: "Career Expert",
      date: "2025-08-12",
      category: "Automation",
      slug: "linkedin-automation-guide",
      readTime: "6 min read"
    },
    {
      id: 3,
      title: "AI-Powered Cover Letters That Get Results",
      excerpt: "Discover how AI can create personalized cover letters that stand out to hiring managers.",
      author: "AI Specialist",
      date: "2025-08-11",
      category: "AI Tools",
      slug: "ai-cover-letters-guide",
      readTime: "5 min read"
    },
    {
      id: 4,
      title: "Remote Job Search Strategies for 2025",
      excerpt: "Complete guide to landing high-paying remote positions using automation and proven strategies.",
      author: "Remote Work Expert",
      date: "2025-08-13",
      category: "Remote Work",
      slug: "remote-job-search-2025",
      readTime: "12 min read"
    },
    {
      id: 5,
      title: "Salary Negotiation with AI Assistance",
      excerpt: "Use AI tools to research, prepare, and negotiate better salaries in your job search.",
      author: "Salary Expert",
      date: "2025-08-09",
      category: "Career Growth",
      slug: "ai-salary-negotiation",
      readTime: "10 min read"
    },
    {
      id: 6,
      title: "The Future of Job Applications: AI Trends",
      excerpt: "Explore upcoming AI trends that will revolutionize how we search and apply for jobs.",
      author: "Tech Analyst",
      date: "2025-08-08",
      category: "Industry Insights",
      slug: "future-ai-job-applications",
      readTime: "9 min read"
    }
  ];

  const categories = ["All", "ATS Optimization", "Automation", "AI Tools", "Remote Work", "Career Growth", "Industry Insights"];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "AutoJobR Career Blog",
    "description": "Latest insights, tips, and strategies for job search automation, ATS optimization, and career advancement",
    "url": "https://autojobr.com/blog",
    "publisher": {
      "@type": "Organization",
      "name": "AutoJobR"
    }
  };

  return (
    <>
      <SEOHead
        title="AutoJobR Blog - Job Search Automation Tips & Career Insights"
        description="Get the latest tips on job search automation, ATS optimization, AI-powered applications, and career advancement strategies. Expert insights for modern job seekers."
        keywords="job search blog, career automation tips, ATS optimization guide, LinkedIn automation, AI job applications, resume optimization, career advice 2025"
        canonicalUrl="https://autojobr.com/blog"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Career Automation Blog
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Expert insights, proven strategies, and the latest tips for automating your job search and landing your dream career faster.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={category === "All" ? "default" : "secondary"}
                className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Featured Post */}
          <Card className="border-0 shadow-xl mb-12">
            <div className="md:flex">
              <div className="md:w-1/3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-l-lg flex items-center justify-center p-8">
                <div className="text-center text-white">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4" />
                  <div className="text-lg font-semibold">Featured Article</div>
                </div>
              </div>
              <div className="md:w-2/3 p-8">
                <Badge className="mb-4">Featured</Badge>
                <h2 className="text-2xl font-bold mb-4">
                  How to Beat ATS Systems in 2025: Complete Guide
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Learn the latest strategies to optimize your resume and applications for Applicant Tracking Systems. 
                  This comprehensive guide covers everything from keyword optimization to formatting best practices.
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    AutoJobR Team
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Aug 13, 2025
                  </div>
                  <div>8 min read</div>
                </div>
                <Link href="/blog/beat-ats-systems-2025-guide">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Read Article <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Blog Posts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {blogPosts.slice(1).map((post) => (
              <Card key={post.id} className="border-0 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary">{post.category}</Badge>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{post.readTime}</div>
                  </div>
                  <CardTitle className="text-xl hover:text-blue-600 transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.date).toLocaleDateString()}
                    </div>
                  </div>
                  <Link href={`/blog/${post.slug}`}>
                    <Button variant="outline" className="w-full">
                      Read More <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Newsletter Signup */}
          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="text-center p-12">
              <h3 className="text-3xl font-bold mb-4">Stay Updated</h3>
              <p className="text-xl mb-8 opacity-90">
                Get the latest job search automation tips delivered to your inbox weekly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 border-0"
                />
                <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3">
                  Subscribe
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <h2 className="text-3xl font-bold mb-6">Ready to Automate Your Job Search?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Stop reading about automation and start using it. Join thousands of successful job seekers.
            </p>
            <Link href="/auth">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg">
                <Briefcase className="mr-2 h-5 w-5" />
                Start Automating Today
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}