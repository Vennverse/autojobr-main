import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import SEOHead from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp, 
  MapPin, 
  Briefcase, 
  Calculator, 
  Target,
  Building2,
  Award,
  Lightbulb,
  ArrowRight,
  ChevronRight,
  Sparkles,
  BarChart3,
  Users,
  Globe,
  CheckCircle2
} from "lucide-react";
import { Link } from "wouter";

interface SalaryInsights {
  salaryRange: {
    min: number;
    median: number;
    max: number;
  };
  currency: string;
  totalCompensation: number;
  breakdown: {
    baseSalary: number;
    skillsBonus: number;
    equityEstimate: number;
    bonusEstimate: number;
    signingBonus?: number;
  };
  marketInsights: string;
  negotiationTips: string[];
  locationAdjustment: string;
  companyTier: string;
  experienceImpact: string;
  careerProgression?: string[];
  industryTrends?: string[];
}

const POPULAR_ROLES = [
  "Software Engineer",
  "Senior Software Engineer",
  "Data Scientist",
  "Product Manager",
  "AI Engineer",
  "Machine Learning Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Data Analyst",
  "UX Designer",
  "Engineering Manager",
  "Technical Lead"
];

const LOCATIONS = [
  { value: "San Francisco, USA", label: "San Francisco, USA" },
  { value: "New York, USA", label: "New York, USA" },
  { value: "Seattle, USA", label: "Seattle, USA" },
  { value: "Austin, USA", label: "Austin, USA" },
  { value: "Remote, USA", label: "Remote (USA)" },
  { value: "London, UK", label: "London, UK" },
  { value: "Berlin, Germany", label: "Berlin, Germany" },
  { value: "Amsterdam, Netherlands", label: "Amsterdam, Netherlands" },
  { value: "Toronto, Canada", label: "Toronto, Canada" },
  { value: "Vancouver, Canada", label: "Vancouver, Canada" },
  { value: "Sydney, Australia", label: "Sydney, Australia" },
  { value: "Singapore", label: "Singapore" },
  { value: "Bangalore, India", label: "Bangalore, India" },
  { value: "Mumbai, India", label: "Mumbai, India" },
  { value: "Dubai, UAE", label: "Dubai, UAE" }
];

const EXPERIENCE_LEVELS = [
  { value: "0", label: "Entry Level (0-1 years)" },
  { value: "2", label: "Junior (2-3 years)" },
  { value: "4", label: "Mid-Level (4-5 years)" },
  { value: "6", label: "Senior (6-8 years)" },
  { value: "10", label: "Staff/Principal (10+ years)" },
  { value: "15", label: "Director/Executive (15+ years)" }
];

const SKILLS = [
  "Python", "JavaScript", "TypeScript", "React", "Node.js", "AWS", "Docker", "Kubernetes",
  "AI", "Machine Learning", "Deep Learning", "LLM", "Go", "Rust", "Java", "SQL",
  "GraphQL", "MongoDB", "PostgreSQL", "Redis", "Terraform", "CI/CD"
];

export default function SalaryCalculator() {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("4");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [results, setResults] = useState<SalaryInsights | null>(null);

  const calculateMutation = useMutation({
    mutationFn: async (data: {
      jobTitle: string;
      company?: string;
      location?: string;
      experienceLevel?: number;
      skills?: string[];
    }) => {
      const response = await fetch("/api/public/salary-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to calculate salary");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const handleCalculate = () => {
    if (!jobTitle.trim()) return;
    calculateMutation.mutate({
      jobTitle,
      company: company || undefined,
      location: location || undefined,
      experienceLevel: parseInt(experienceLevel),
      skills: selectedSkills,
    });
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      USD: "$",
      INR: "₹",
      GBP: "£",
      EUR: "€",
      CAD: "C$",
      SGD: "S$",
      AUD: "A$",
      AED: "AED ",
    };
    return `${symbols[currency] || "$"}${amount.toLocaleString()}`;
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Salary Calculator - AutoJobr",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Free AI-powered salary calculator. Get accurate salary estimates for any job role, location, and experience level. Compare salaries across companies and industries.",
    "featureList": [
      "Real-time salary data for 500+ job roles",
      "Location-based salary adjustments",
      "Skills-based compensation analysis",
      "Company tier comparison",
      "Career progression insights",
      "Negotiation tips"
    ]
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How accurate is this salary calculator?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our salary calculator uses real-time market data aggregated from millions of job postings, salary surveys, and employer reports. We update our data monthly to ensure accuracy within 5-10% of actual market rates."
        }
      },
      {
        "@type": "Question",
        "name": "What factors affect salary calculations?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Key factors include job title, years of experience, location (cost of living adjustments), specific skills and certifications, company size and tier (FAANG vs startups), and industry sector."
        }
      },
      {
        "@type": "Question",
        "name": "How do I use this to negotiate my salary?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Use the salary range (min, median, max) to set your expectations. The median represents market rate, while the max is achievable with strong negotiation and in-demand skills. Our tool provides specific negotiation tips based on your profile."
        }
      },
      {
        "@type": "Question",
        "name": "Does location really affect salary that much?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, location significantly impacts salary. A software engineer in San Francisco earns 40-60% more than the same role in India or Eastern Europe, reflecting cost of living and local market demand."
        }
      }
    ]
  };

  return (
    <>
      <SEOHead
        title="Free Salary Calculator 2025 - Know Your Worth | AutoJobr"
        description="Free AI-powered salary calculator for 500+ job roles. Get accurate salary estimates based on role, location, skills, and experience. Compare salaries at Google, Amazon, Meta, Microsoft, and more. Updated monthly with real market data."
        keywords="salary calculator, salary estimator, tech salary calculator, software engineer salary, data scientist salary, product manager salary, salary comparison, salary negotiation, compensation calculator, how much should I earn, salary by location, salary by experience, FAANG salaries"
        canonicalUrl="https://autojobr.com/salary-calculator"
        structuredData={structuredData}
      />
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8 md:py-16">
          
          <header className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Free Tool - No Login Required</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Free Salary Calculator
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4 max-w-3xl mx-auto">
              Know your worth. Get accurate salary estimates for any role, location, and experience level. 
              Updated monthly with real market data from millions of job postings.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>500+ Job Roles</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>50+ Locations</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Real-Time Data</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>100% Free</span>
              </div>
            </div>
          </header>

          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-6 h-6" />
                  <span>Calculate Your Salary</span>
                </CardTitle>
                <CardDescription className="text-emerald-100">
                  Enter your details to get personalized salary insights
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle" className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Job Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g., Software Engineer, Data Scientist"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    list="popular-roles"
                    data-testid="input-job-title"
                  />
                  <datalist id="popular-roles">
                    {POPULAR_ROLES.map((role) => (
                      <option key={role} value={role} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_ROLES.slice(0, 5).map((role) => (
                      <Badge
                        key={role}
                        variant="outline"
                        className="cursor-pointer text-xs"
                        onClick={() => setJobTitle(role)}
                        data-testid={`badge-role-${role.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company (Optional)
                  </Label>
                  <Input
                    id="company"
                    placeholder="e.g., Google, Amazon, Startup"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    data-testid="input-company"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger data-testid="select-location">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc.value} value={loc.value}>
                          {loc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Experience Level
                  </Label>
                  <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                    <SelectTrigger data-testid="select-experience">
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((exp) => (
                        <SelectItem key={exp.value} value={exp.value}>
                          {exp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Skills (Select all that apply)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map((skill) => (
                      <Badge
                        key={skill}
                        variant={selectedSkills.includes(skill) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleSkill(skill)}
                        data-testid={`badge-skill-${skill.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  size="lg"
                  onClick={handleCalculate}
                  disabled={!jobTitle.trim() || calculateMutation.isPending}
                  data-testid="button-calculate"
                >
                  {calculateMutation.isPending ? (
                    <>Calculating...</>
                  ) : (
                    <>
                      <Calculator className="w-5 h-5 mr-2" />
                      Calculate My Salary
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {results ? (
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-6 h-6" />
                    <span>Your Salary Insights</span>
                  </CardTitle>
                  <CardDescription className="text-teal-100">
                    Based on real market data for {jobTitle}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Estimated Total Compensation</p>
                    <p className="text-4xl md:text-5xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(results.totalCompensation, results.currency)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">per year</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Salary Range
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Minimum</p>
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                          {formatCurrency(results.salaryRange.min, results.currency)}
                        </p>
                      </div>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border-2 border-emerald-200 dark:border-emerald-800">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">Median</p>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(results.salaryRange.median, results.currency)}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Maximum</p>
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                          {formatCurrency(results.salaryRange.max, results.currency)}
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={((results.salaryRange.median - results.salaryRange.min) / (results.salaryRange.max - results.salaryRange.min)) * 100}
                      className="h-2"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold">Compensation Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Base Salary</span>
                        <span className="font-medium">{formatCurrency(results.breakdown.baseSalary, results.currency)}</span>
                      </div>
                      {results.breakdown.skillsBonus > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Skills Premium</span>
                          <span className="font-medium text-emerald-600">+{formatCurrency(results.breakdown.skillsBonus, results.currency)}</span>
                        </div>
                      )}
                      {results.breakdown.equityEstimate > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Equity (Est.)</span>
                          <span className="font-medium">{formatCurrency(results.breakdown.equityEstimate, results.currency)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Bonus (Est.)</span>
                        <span className="font-medium">{formatCurrency(results.breakdown.bonusEstimate, results.currency)}</span>
                      </div>
                      {results.breakdown.signingBonus && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Signing Bonus</span>
                          <span className="font-medium text-blue-600">{formatCurrency(results.breakdown.signingBonus, results.currency)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Company Tier</p>
                      <p className="font-medium text-sm">{results.companyTier}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Experience Impact</p>
                      <p className="font-medium text-sm">{results.experienceImpact}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      Market Insights
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{results.marketInsights}</p>
                  </div>

                  {results.negotiationTips && results.negotiationTips.length > 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-amber-600" />
                        Negotiation Tips
                      </h4>
                      <ul className="space-y-1">
                        {results.negotiationTips.map((tip, index) => (
                          <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {results.careerProgression && results.careerProgression.length > 0 && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        Career Progression
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {results.careerProgression.map((role, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Link href="/auth">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" data-testid="button-get-more-insights">
                        Get More Career Insights
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl flex items-center justify-center">
                <CardContent className="text-center p-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center">
                    <DollarSign className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Enter Your Details</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Fill in the form to get personalized salary insights based on real market data.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Globe className="w-3 h-3 mr-1" />
                      Global Data
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      1M+ Data Points
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Updated Monthly
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Popular Salary Searches</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { role: "Software Engineer", location: "San Francisco", salary: "$165,000" },
                { role: "Data Scientist", location: "New York", salary: "$145,000" },
                { role: "Product Manager", location: "Seattle", salary: "$155,000" },
                { role: "DevOps Engineer", location: "Austin", salary: "$140,000" },
                { role: "AI Engineer", location: "San Francisco", salary: "$195,000" },
                { role: "Frontend Developer", location: "Remote, USA", salary: "$120,000" },
              ].map((item, index) => (
                <Card 
                  key={index} 
                  className="border cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setJobTitle(item.role);
                    setLocation(LOCATIONS.find(l => l.label.includes(item.location))?.value || "");
                    handleCalculate();
                  }}
                  data-testid={`card-popular-${index}`}
                >
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.role}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{item.salary}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">avg/year</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">How Our Salary Calculator Works</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  icon: Briefcase,
                  title: "Enter Job Details",
                  description: "Input your job title, company, and location for personalized results."
                },
                {
                  icon: TrendingUp,
                  title: "AI Analysis",
                  description: "Our AI analyzes millions of salary data points from real job postings."
                },
                {
                  icon: Award,
                  title: "Skills Impact",
                  description: "See how your specific skills affect your earning potential."
                },
                {
                  icon: Target,
                  title: "Get Insights",
                  description: "Receive salary range, negotiation tips, and career progression paths."
                }
              ].map((step, index) => (
                <Card key={index} className="border-0 shadow-lg text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mb-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                {
                  q: "How accurate is this salary calculator?",
                  a: "Our salary calculator uses real-time market data aggregated from millions of job postings, salary surveys, and employer reports. We update our data monthly to ensure accuracy within 5-10% of actual market rates."
                },
                {
                  q: "What factors affect salary calculations?",
                  a: "Key factors include job title, years of experience, location (cost of living adjustments), specific skills and certifications, company size and tier (FAANG vs startups), and industry sector."
                },
                {
                  q: "How do I use this to negotiate my salary?",
                  a: "Use the salary range (min, median, max) to set your expectations. The median represents market rate, while the max is achievable with strong negotiation and in-demand skills."
                },
                {
                  q: "Does location really affect salary that much?",
                  a: "Yes, location significantly impacts salary. A software engineer in San Francisco earns 40-60% more than the same role in India or Eastern Europe, reflecting cost of living and local market demand."
                }
              ].map((faq, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="text-center">
            <Card className="border-0 shadow-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold mb-4">Ready to Land Your Dream Job?</h2>
                <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                  Now that you know your worth, let AutoJobr help you find jobs that match your expectations and auto-apply with AI-powered tools.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth">
                    <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-100" data-testid="button-start-free">
                      Start Free - Auto Apply to Jobs
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/ats-optimizer">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" data-testid="button-optimize-resume">
                      Optimize Your Resume for ATS
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
}