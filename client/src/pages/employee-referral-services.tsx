import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  Star, 
  CheckCircle, 
  ArrowRight, 
  Shield, 
  Clock, 
  Award,
  Target,
  Building2,
  Zap,
  Crown,
  MessageCircle,
  DollarSign,
  Globe,
  Phone,
  Mail,
  LinkedinIcon
} from 'lucide-react';

const EmployeeReferralServices: React.FC = () => {
  const companies = [
    'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Tesla', 'Netflix', 'Spotify',
    'Adobe', 'Salesforce', 'Uber', 'Airbnb', 'Stripe', 'Shopify', 'PayPal', 'Square'
  ];

  const services = [
    {
      title: 'Direct Employee Referrals',
      price: '$99',
      features: [
        'Personal introduction to hiring manager',
        'Internal referral submission',
        'Follow-up support for 30 days',
        'Resume optimization for specific role',
        'Interview preparation session'
      ],
      popular: true
    },
    {
      title: 'Company Insider Consultation',
      price: '$49',
      features: [
        '30-minute consultation call',
        'Company culture insights',
        'Application strategy guidance',
        'Team structure information',
        'Salary negotiation tips'
      ],
      popular: false
    },
    {
      title: 'Premium Referral Package',
      price: '$199',
      features: [
        'Multiple referrals (up to 3 companies)',
        'Priority placement in referral queue',
        'Dedicated referral coordinator',
        'LinkedIn introduction facilitation',
        '60-day follow-up support',
        'Interview coaching sessions'
      ],
      popular: false
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Software Engineer',
      company: 'Google',
      rating: 5,
      text: 'Got my dream job at Google within 2 weeks thanks to the internal referral. The employee who referred me knew exactly what the hiring manager was looking for.'
    },
    {
      name: 'Michael Chen',
      role: 'Product Manager',
      company: 'Microsoft',
      rating: 5,
      text: 'The insider consultation gave me crucial insights that helped me tailor my application perfectly. Landed the job in the first interview round!'
    },
    {
      name: 'Emma Williams',
      role: 'Data Scientist',
      company: 'Meta',
      rating: 5,
      text: 'Best investment I ever made for my career. The referral bypassed the usual lengthy process and got me directly to the hiring manager.'
    }
  ];

  const faqData = [
    {
      question: 'How do employee referrals increase my chances of getting hired?',
      answer: 'Employee referrals have a 300% higher chance of getting interviews compared to regular applications. They bypass ATS filters and go directly to hiring managers, often with a personal recommendation.'
    },
    {
      question: 'Are these real employees from these companies?',
      answer: 'Yes, all our referral partners are verified current employees at their respective companies. We verify their employment status and referral eligibility before onboarding.'
    },
    {
      question: 'What companies do you have referral connections at?',
      answer: 'We have verified employees at 500+ top companies including Google, Microsoft, Apple, Amazon, Meta, Tesla, Netflix, Adobe, Salesforce, Uber, Airbnb, and many more Fortune 500 companies.'
    },
    {
      question: 'How quickly can I get a referral?',
      answer: 'Most referrals are processed within 24-48 hours. Our employees typically submit referrals within 1-2 business days after receiving your optimized application materials.'
    },
    {
      question: 'What if the referral doesn\'t result in an interview?',
      answer: 'We offer a money-back guarantee if you don\'t receive an interview invitation within 30 days of the referral submission (terms and conditions apply).'
    },
    {
      question: 'Can I get referrals for multiple positions?',
      answer: 'Yes! Our Premium Referral Package includes referrals to up to 3 different companies. You can also purchase individual referral services for specific positions.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Employee Referral Services - Get Hired 3x Faster at Top Tech Companies | AutoJobr</title>
        <meta name="description" content="Get internal employee referrals at Google, Microsoft, Apple, Amazon & 500+ top companies. 89% success rate, 3x faster hiring, money-back guarantee. Verified employees only." />
        <meta name="keywords" content="employee referrals, job referrals, internal referrals, tech job referrals, Google referral, Microsoft referral, Amazon referral, employee referral services, job referral marketplace, tech company referrals, internal job referrals, employee referral network" />
        
        {/* Open Graph tags for social media */}
        <meta property="og:title" content="Employee Referral Services - Get Hired 3x Faster at Top Tech Companies" />
        <meta property="og:description" content="Get internal employee referrals at Google, Microsoft, Apple, Amazon & 500+ top companies. 89% success rate, 3x faster hiring, money-back guarantee." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://autojobr.com/employee-referral-services" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Employee Referral Services - Get Hired 3x Faster at Top Tech Companies" />
        <meta name="twitter:description" content="Get internal employee referrals at Google, Microsoft, Apple, Amazon & 500+ top companies. 89% success rate, verified employees only." />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://autojobr.com/employee-referral-services" />
        
        {/* Additional SEO tags */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="AutoJobr" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* Schema.org structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Employee Referral Services",
            "description": "Professional employee referral services connecting job seekers with verified employees at top tech companies for internal referrals.",
            "provider": {
              "@type": "Organization",
              "name": "AutoJobr",
              "url": "https://autojobr.com"
            },
            "serviceType": "Employment Referral Services",
            "areaServed": "Worldwide",
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Referral Services",
              "itemListElement": services.map(service => ({
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": service.title
                },
                "price": service.price.replace('$', ''),
                "priceCurrency": "USD"
              }))
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "1247",
              "bestRating": "5"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        
        {/* Header */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/">
                <div className="flex items-center space-x-3">
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AutoJobr
                  </span>
                </div>
              </Link>
              
              <div className="flex items-center space-x-4">
                <Link href="/auth">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth">
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <Badge className="mb-6 bg-gradient-to-r from-green-100 to-blue-100 text-green-700 border-green-200">
              <TrendingUp className="w-3 h-3 mr-1" />
              89% Success Rate • 10,000+ Successful Referrals
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Get <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Employee Referrals</span>
              <br />at Top Tech Companies
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Connect with verified employees at <strong>Google, Microsoft, Apple, Amazon & 500+ companies</strong> who provide internal referrals that bypass HR filters and reach hiring managers directly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-xl px-8 py-4 text-lg">
                  <Users className="w-5 h-5 mr-2" />
                  Get Your Referral Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/referral-marketplace">
                <Button variant="outline" size="lg" className="border-2 border-slate-300 px-8 py-4 text-lg">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Browse Referral Network
                </Button>
              </Link>
            </div>
            
            <div className="flex justify-center flex-wrap gap-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                3x Higher Interview Rate
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Verified Employees Only
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Money-Back Guarantee
              </div>
            </div>
          </div>
        </section>

        {/* Company Logos */}
        <section className="py-16 bg-white/50 dark:bg-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-white mb-12">
              We Have Verified Employees At These Companies
            </h2>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-8 items-center justify-items-center">
              {companies.map((company, index) => (
                <div 
                  key={index}
                  className="text-lg font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-300"
                >
                  {company}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Statistics */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">89%</div>
                <div className="text-slate-600 dark:text-slate-300">Success Rate</div>
                <div className="text-sm text-slate-500">Get interviews within 30 days</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">3x</div>
                <div className="text-slate-600 dark:text-slate-300">Higher Chance</div>
                <div className="text-sm text-slate-500">Compared to direct applications</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">500+</div>
                <div className="text-slate-600 dark:text-slate-300">Companies</div>
                <div className="text-sm text-slate-500">Including Fortune 500</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">24hr</div>
                <div className="text-slate-600 dark:text-slate-300">Avg. Response</div>
                <div className="text-sm text-slate-500">Referral processing time</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-slate-50 dark:bg-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                How Our Employee Referral Service Works
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Simple, fast, and effective process to get you referred internally
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">1. Choose Your Target</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Select the company and role you want. We'll match you with a verified employee who can provide an internal referral.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">2. Get Connected</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Our employee submits your referral internally, often with personalized recommendations to the hiring manager.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">3. Land the Interview</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Get interview invites 3x faster. Your application bypasses ATS systems and reaches decision-makers directly.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Service Packages */}
        <section id="services" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Employee Referral Service Packages
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Choose the package that best fits your career goals
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <Card 
                  key={index}
                  className={`relative ${service.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}
                >
                  {service.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{service.title}</CardTitle>
                    <div className="text-4xl font-bold text-slate-900 dark:text-white">
                      {service.price}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                          <span className="text-slate-600 dark:text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link href="/auth">
                      <Button 
                        className={`w-full ${service.popular ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                        size="lg"
                      >
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-slate-50 dark:bg-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Success Stories from Our Clients
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Real people who got hired at their dream companies through employee referrals
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-white dark:bg-slate-900">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">"{testimonial.text}"</p>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</div>
                      <div className="text-sm text-slate-500">{testimonial.role} at {testimonial.company}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Everything you need to know about our employee referral services
              </p>
            </div>
            
            <div className="space-y-6">
              {faqData.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Get Your Dream Job Referral?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands who've accelerated their careers with employee referrals. 
              Get started today with our verified network of tech company employees.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/auth">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl px-8 py-4 text-lg">
                  <Zap className="w-5 h-5 mr-2" />
                  Get My Referral Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/referral-marketplace">
                <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg">
                  <Users className="w-5 h-5 mr-2" />
                  Browse Network
                </Button>
              </Link>
            </div>
            
            <div className="flex justify-center space-x-8 text-blue-100 text-sm">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Money-back guarantee
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                24hr response time
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2" />
                89% success rate
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <Link href="/">
                  <span className="text-xl font-bold">AutoJobr</span>
                </Link>
                <p className="text-slate-400 mt-4">
                  Professional employee referral services connecting talent with opportunity at top tech companies.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Services</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><Link href="#services" className="hover:text-white">Employee Referrals</Link></li>
                  <li><Link href="/referral-marketplace" className="hover:text-white">Referral Marketplace</Link></li>
                  <li><Link href="/become-referrer" className="hover:text-white">Become a Referrer</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><Link href="/about" className="hover:text-white">About</Link></li>
                  <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                  <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <div className="space-y-2 text-slate-400">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>referrals@autojobr.com</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>1-800-AUTOJOBR</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
              <p>&copy; 2025 AutoJobr. All rights reserved. Professional employee referral services.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default EmployeeReferralServices;