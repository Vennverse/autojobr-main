import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  Users, 
  Zap, 
  Award, 
  TrendingUp, 
  Clock, 
  Target,
  ArrowRight,
  CheckCircle,
  Star,
  Brain,
  Shield,
  BarChart3,
  MessageCircle,
  FileText,
  Crown,
  ChevronRight,
  Briefcase,
  Search,
  Filter,
  Eye
} from "lucide-react";
import logoImage from "@assets/generated_images/AutoJobr_professional_logo_17c702fa.png";
import heroBackground from "@assets/generated_images/Professional_hero_background_15f13bf2.png";
import dashboardMockup from "@assets/generated_images/Recruitment_dashboard_mockup_2b680657.png";

const stats = [
  { label: "Active Users", value: "50K+", icon: Users },
  { label: "Jobs Posted", value: "25K+", icon: Briefcase },
  { label: "Successful Hires", value: "15K+", icon: Award },
  { label: "Companies", value: "2.5K+", icon: Target }
];

const features = [
  {
    icon: Brain,
    title: "AI-Powered Matching",
    description: "Advanced algorithms match candidates with perfect-fit opportunities based on skills, experience, and culture."
  },
  {
    icon: Zap,
    title: "Lightning Fast Hiring", 
    description: "Reduce time-to-hire by 60% with automated screening, instant notifications, and streamlined workflows."
  },
  {
    icon: Shield,
    title: "ATS Score Optimization",
    description: "Our AI analyzes and optimizes resumes for maximum ATS compatibility and recruiter visibility."
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Real-time insights on application performance, hiring metrics, and market trends to drive decisions."
  },
  {
    icon: MessageCircle,
    title: "Seamless Communication",
    description: "Built-in messaging, video interviews, and collaboration tools keep everyone connected."
  },
  {
    icon: Crown,
    title: "Premium Features",
    description: "Unlock unlimited applications, priority support, and exclusive tools for career acceleration."
  }
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Senior Software Engineer",
    company: "TechCorp",
    image: "👩‍💻",
    quote: "AutoJobr's AI matching landed me 3 interviews in my first week. The resume optimization feature increased my response rate by 400%!"
  },
  {
    name: "Michael Rodriguez", 
    role: "Talent Acquisition Lead",
    company: "StartupXYZ",
    image: "👨‍💼",
    quote: "We've cut our hiring time in half and improved candidate quality dramatically. The analytics dashboard is a game-changer."
  },
  {
    name: "Emily Johnson",
    role: "Product Manager",
    company: "InnovateCo",
    image: "👩‍🎨",
    quote: "The platform's insights helped me negotiate a 25% salary increase. The mock interview feature was incredibly valuable."
  }
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "50 job applications/month",
      "Basic resume analysis", 
      "Standard support",
      "Job search filters"
    ],
    cta: "Start Free",
    popular: false
  },
  {
    name: "Premium",
    price: "$29",
    description: "For serious job seekers",
    features: [
      "Unlimited job applications",
      "Advanced AI analysis",
      "Priority support",
      "Premium job recommendations",
      "Interview preparation",
      "Salary insights"
    ],
    cta: "Go Premium",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For teams and companies",
    features: [
      "Everything in Premium",
      "Team collaboration",
      "Advanced analytics",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee"
    ],
    cta: "Contact Sales",
    popular: false
  }
];

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src={logoImage} alt="AutoJobr" className="w-8 h-8" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AutoJobr
              </span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="#features" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/recruiter-features" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                For Recruiters
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-5"
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200">
                <Rocket className="w-3 h-3 mr-1" />
                #1 AI-Powered Job Platform
              </Badge>
              
              <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                Land Your
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"> Dream Job</span>
                <br />
                3x Faster
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                Join 50,000+ professionals using AI-powered job matching, resume optimization, and career acceleration tools to transform their careers.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link href="/auth">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 px-8 py-4 text-lg">
                    <Zap className="w-5 h-5 mr-2" />
                    Start Your Career Journey
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/recruiter-features">
                  <Button variant="outline" size="lg" className="border-2 border-slate-300 hover:border-slate-400 px-8 py-4 text-lg">
                    <Users className="w-5 h-5 mr-2" />
                    For Recruiters
                  </Button>
                </Link>
              </div>
              
              <div className="flex justify-center space-x-8 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Free to start
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Setup in 2 minutes
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{stat.value}</div>
                  <div className="text-slate-600 dark:text-slate-300">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Why Choose AutoJobr?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Powerful AI technology meets intuitive design to create the ultimate job search and recruitment platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
                  <CardContent className="p-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Preview */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Experience the Future of Hiring
              </h2>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Our advanced dashboard provides real-time insights, AI-powered recommendations, and seamless collaboration tools that transform how you hire and get hired.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span>Real-time candidate matching and job recommendations</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span>Advanced analytics and performance tracking</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span>Integrated communication and collaboration tools</span>
                </div>
              </div>
              
              <Link href="/auth">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                  Try the Platform Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <img 
                src={dashboardMockup} 
                alt="AutoJobr Dashboard" 
                className="rounded-lg shadow-2xl w-full transform hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 animate-pulse animation-delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              See how AutoJobr is transforming careers and companies worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl mr-4">
                      {testimonial.image}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">{testimonial.role}</div>
                      <div className="text-sm text-slate-500">{testimonial.company}</div>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 italic">"{testimonial.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Start free and upgrade when you're ready to accelerate your career
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative border-0 ${plan.popular ? 'ring-2 ring-blue-500 bg-white dark:bg-slate-900' : 'bg-white/80 dark:bg-slate-800/80'} backdrop-blur`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                    <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                      {plan.price}
                      {plan.price !== "Custom" && <span className="text-lg text-slate-500">/month</span>}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{plan.description}</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                        <span className="text-slate-600 dark:text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/auth">
                    <Button 
                      className={`w-full ${plan.popular 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600'
                      }`}
                      size="lg"
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of professionals who've accelerated their careers with AutoJobr. 
            Start your journey today - it's free!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl px-8 py-4 text-lg">
                <Rocket className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </Link>
            <Link href="/recruiter-features">
              <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg">
                <Users className="w-5 h-5 mr-2" />
                For Recruiters
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 text-blue-100 text-sm">
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Free forever plan available • No credit card required • Setup in minutes
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={logoImage} alt="AutoJobr" className="w-8 h-8" />
                <span className="text-xl font-bold">AutoJobr</span>
              </div>
              <p className="text-slate-400 mb-4">
                AI-powered job platform connecting talent with opportunity.
              </p>
              <div className="flex space-x-4">
                <Badge variant="outline" className="text-slate-400 border-slate-600">
                  Trusted by 50K+ users
                </Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/auth" className="hover:text-white transition-colors">Job Search</Link></li>
                <li><Link href="/recruiter-features" className="hover:text-white transition-colors">For Recruiters</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>&copy; 2025 AutoJobr. All rights reserved. Built with ❤️ for the future of work.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}