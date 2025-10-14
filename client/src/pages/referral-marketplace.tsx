import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, Users, Shield, MessageCircle, ExternalLink, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SEOHead from '@/components/seo-head';

interface ReferralService {
  serviceId: number;
  serviceType: string;
  title: string;
  description: string;
  basePrice: number;
  referralBonusPrice: number;
  sessionDuration: number;
  sessionsIncluded: number;
  includesReferral: boolean;
  features: string[];
  deliverables: string[];
  requirements: string[];
  targetRoles: string[];
  availableSlots: number;
  bookedSlots: number;
  referrer: {
    id: number;
    companyName: string;
    jobTitle: string;
    department: string;
    displayName: string;
    isAnonymous: boolean;
    yearsAtCompany: number;
    bio: string;
    specialties: string[];
    verificationLevel: string;
    stats: {
      totalServices: number;
      completedServices: number;
      averageRating: number;
      totalReviews: number;
      successRate: number;
    };
  };
}

const ReferralMarketplace: React.FC = () => {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [services, setServices] = useState<ReferralService[]>([]);
  const [loading, setLoading] = useState(true);

  // Debug authentication state
  useEffect(() => {
    console.log('🔍 [Referral Marketplace] Auth State:', {
      user: user ? { id: user.id, email: user.email } : null,
      isAuthenticated,
      authLoading
    });
  }, [user, isAuthenticated, authLoading]);
  const [expandedServices, setExpandedServices] = useState<Record<number, boolean>>({});
  const [filter, setFilter] = useState({
    serviceType: '',
    includesReferral: '',
    companyName: ''
  });

  useEffect(() => {
    fetchServices();
  }, [filter]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filter.serviceType) queryParams.append('serviceType', filter.serviceType);
      if (filter.includesReferral) queryParams.append('includesReferral', filter.includesReferral);
      if (filter.companyName) queryParams.append('companyName', filter.companyName);

      const response = await fetch(`/api/referral-marketplace/services?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = async (serviceId: number, servicePrice: number) => {
    // Check authentication status first
    if (!user || !user.id) {
      console.log('❌ User not authenticated, redirecting to auth page');
      const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/auth-page?redirect=${currentUrl}`;
      return;
    }

    console.log('✅ User authenticated:', user.email);

    try {
      // First create the booking
      const bookingResponse = await fetch(`/api/referral-marketplace/book/${serviceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: 'Booking from marketplace'
        }),
      });

      const bookingData = await bookingResponse.json();
      
      if (bookingData.success) {
        // Create PayPal payment order
        const paymentResponse = await fetch('/api/referral-marketplace/payment/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId: bookingData.booking.id,
            amount: servicePrice
          }),
        });

        const paymentData = await paymentResponse.json();
        
        if (paymentData.success && paymentData.approvalUrl) {
          // Redirect to PayPal payment
          window.location.href = paymentData.approvalUrl;
        } else {
          alert('Failed to create payment: ' + (paymentData.error || 'Unknown error'));
        }
      } else {
        alert('Failed to create booking: ' + bookingData.error);
      }
    } catch (error) {
      console.error('Error booking service:', error);
      alert('Failed to book service');
    }
  };

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'intro_meeting': return 'Intro Meeting + Optional Referral';
      case 'interview_prep': return 'Interview Preparation';
      case 'ongoing_mentorship': return 'Ongoing Mentorship';
      default: return type;
    }
  };

  const toggleServiceExpansion = (serviceId: number) => {
    setExpandedServices(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
  };

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case 'verified': return <Badge variant="default" className="bg-green-100 text-green-800">✓ Verified</Badge>;
      case 'premium': return <Badge variant="default" className="bg-blue-100 text-blue-800">⭐ Premium</Badge>;
      default: return <Badge variant="secondary">Basic</Badge>;
    }
  };

  const renderStarRating = (rating: number, reviews: number) => {
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">
          {rating.toFixed(1)} ({reviews} reviews)
        </span>
      </div>
    );
  };

  if (loading || authLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          {authLoading ? 'Checking authentication...' : 'Loading services...'}
        </div>
      </div>
    );
  }

  // Enhanced structured data for referral marketplace with rich snippets
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Marketplace",
        "@id": "https://autojobr.com/referral-marketplace#marketplace",
        "name": "AutoJobR Employee Referral Marketplace",
        "description": "Professional employee referral services connecting job seekers with verified employees at top tech companies for internal referrals and career guidance.",
        "url": "https://autojobr.com/referral-marketplace",
        "provider": {
          "@type": "Organization",
          "@id": "https://autojobr.com/#organization",
          "name": "AutoJobR",
          "url": "https://autojobr.com"
        },
        "offers": {
          "@type": "AggregateOffer",
          "availability": "https://schema.org/InStock",
          "priceCurrency": "USD",
          "lowPrice": "50",
          "highPrice": "500",
          "offerCount": services.length
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": "1247",
          "bestRating": "5"
        }
      },
      {
        "@type": "Service",
        "@id": "https://autojobr.com/referral-marketplace#service",
        "serviceType": "Employment Referral Service",
        "name": "Employee Referral & Career Mentorship",
        "description": "Get internal job referrals from verified company employees, receive expert career advice, and prepare for interviews with industry insiders.",
        "provider": {
          "@id": "https://autojobr.com/#organization"
        },
        "areaServed": "Worldwide",
        "audience": {
          "@type": "Audience",
          "audienceType": "Job Seekers, Career Changers, Recent Graduates"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How does the employee referral marketplace work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Browse verified employee services, book a session, get expert career advice and interview prep, and receive an internal job referral to bypass HR filters and land interviews 3x faster."
            }
          },
          {
            "@type": "Question",
            "name": "Are the referrers verified employees?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, all referrers verify their employment through company email verification and LinkedIn profile checks to ensure authenticity."
            }
          },
          {
            "@type": "Question",
            "name": "What payment methods are accepted?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We accept secure payments through PayPal with buyer protection. Funds are held in escrow until service delivery is confirmed."
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
      <SEOHead 
        title="Employee Referral Marketplace 2025 - Get Internal Referrals from Verified Employees | 3x Faster Hiring | AutoJobR"
        description="🔥 #1 Employee Referral Marketplace! Get internal job referrals from verified employees at Google, Microsoft, Apple, Amazon & 500+ top companies. 89% success rate, 3x faster hiring, escrow-protected payments. Connect with company insiders for career advice, interview prep & guaranteed referrals. Join 50K+ job seekers landing dream jobs through employee referrals!"
        keywords="employee referrals 2025, internal job referrals, company employee referrals, get job referral, referral marketplace, employee referral service, internal referral network, job referral platform, verified employee referrals, tech company referrals, Google referrals, Microsoft referrals, Amazon referrals, career mentorship, interview preparation, job placement service, employee network, professional referrals, career coaching, job search help, employee insider referrals, guaranteed job referrals, escrow payment referrals, safe referral marketplace"
        canonicalUrl="https://autojobr.com/referral-marketplace"
        structuredData={structuredData}
        ogType="website"
        ogImage="https://autojobr.com/referral-marketplace-og.png"
      />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-12 mb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Authentication Status Debug Banner - Remove after fixing */}
          {!authLoading && (
            <div className={`text-center py-2 mb-4 rounded-lg ${isAuthenticated ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <p className="text-sm">
                {isAuthenticated ? `✅ Logged in as ${user?.email}` : '❌ Not logged in - Please sign in to book services'}
              </p>
            </div>
          )}
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Referral Marketplace
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Connect with verified company employees for career advice, interview prep, and internal referrals
            </p>
          </div>
        
        {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => window.location.href = '/referral-marketplace'}
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg font-semibold px-6"
            >
              <Target className="w-4 h-4 mr-2" />
              Browse Services
            </Button>
            <Button
              variant="outline" 
              size="lg"
              onClick={() => window.location.href = '/my-bookings'}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm font-semibold px-6"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              My Bookings
            </Button>
            <Button
              variant="outline" 
              size="lg"
              onClick={() => window.location.href = '/become-referrer'}
              className="bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600 border-0 font-semibold px-6 shadow-lg"
            >
              <Users className="w-4 h-4 mr-2" />
              Become a Referrer
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Trust Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-blue-600 mb-1">50K+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Job Seekers Helped</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-green-600 mb-1">89%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-purple-600 mb-1">500+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Top Companies</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-orange-600 mb-1">3x</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Faster Hiring</div>
          </div>
        </div>
        
        {/* How It Works - Step by Step Process */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 mb-8 shadow-xl border border-gray-100 dark:border-slate-700">
          <h2 className="text-3xl font-bold text-center mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            How Our Referral Program Works
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-10">Simple 4-step process to get your dream job</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center relative group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white text-lg">Browse & Select</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Choose from verified employees at top companies</p>
              {/* Connector Arrow */}
              <div className="hidden md:block absolute top-10 -right-4 w-8 h-8 text-blue-400">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="text-center relative group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white text-lg">Book & Pay</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Secure payment with escrow protection</p>
              {/* Connector Arrow */}
              <div className="hidden md:block absolute top-10 -right-4 w-8 h-8 text-green-400">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="text-center relative group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white text-lg">Get Mentored</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">1-on-1 career advice & interview prep</p>
              {/* Connector Arrow */}
              <div className="hidden md:block absolute top-10 -right-4 w-8 h-8 text-purple-400">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            {/* Step 4 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform">
                4
              </div>
              <h3 className="font-bold mb-2 text-gray-900 dark:text-white text-lg">Get Referred</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Internal referral to land interviews</p>
            </div>
          </div>
          
          {/* What You Get */}
          <div className="mt-8 pt-8 border-t border-blue-200">
            <h3 className="text-lg font-bold text-center mb-6 text-gray-900">What You Receive:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium">Expert Career Advice</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium">Internal Company Referral</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-sm font-medium">Interview Preparation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-8 shadow-lg border border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Filter Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Type</label>
              <select
                value={filter.serviceType}
                onChange={(e) => setFilter(prev => ({ ...prev, serviceType: e.target.value }))}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Service Types</option>
                <option value="intro_meeting">Intro Meeting + Referral</option>
                <option value="interview_prep">Interview Preparation</option>
                <option value="ongoing_mentorship">Ongoing Mentorship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Referral Status</label>
              <select
                value={filter.includesReferral}
                onChange={(e) => setFilter(prev => ({ ...prev, includesReferral: e.target.value }))}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Services</option>
                <option value="true">Includes Referral</option>
                <option value="false">No Referral</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company</label>
              <input
                type="text"
                placeholder="Search company..."
                value={filter.companyName}
                onChange={(e) => setFilter(prev => ({ ...prev, companyName: e.target.value }))}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Service Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service) => (
          <Card key={service.serviceId} className="h-fit hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-slate-800 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative">
              <div className="flex justify-between items-start mb-3">
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">{service.title}</CardTitle>
                {service.includesReferral && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">
                    ⭐ Referral Included
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm font-medium text-gray-600 dark:text-gray-400">{getServiceTypeLabel(service.serviceType)}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Referrer Info */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800 p-4 rounded-xl border border-blue-100 dark:border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Company Logo Placeholder */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-lg font-bold text-white">
                        {service.referrer.companyName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{service.referrer.displayName}</h4>
                      {getVerificationBadge(service.referrer.verificationLevel)}
                    </div>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {service.referrer.jobTitle} at <span className="text-blue-600 dark:text-blue-400">{service.referrer.companyName}</span>
                </p>
                {service.referrer.yearsAtCompany && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    🎯 {service.referrer.yearsAtCompany} years at company
                  </p>
                )}
              </div>

              {/* Rating */}
              {service.referrer.stats.totalReviews > 0 && (
                <div>
                  {renderStarRating(
                    service.referrer.stats.averageRating,
                    service.referrer.stats.totalReviews
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>{service.referrer.stats.completedServices} completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span>{service.referrer.stats.successRate}% success rate</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700">{service.description}</p>

              {/* Features */}
              <div>
                <h5 className="font-medium mb-2">What's included:</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  {(expandedServices[service.serviceId] 
                    ? service.features 
                    : service.features.slice(0, 3)
                  ).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      {feature}
                    </li>
                  ))}
                  {service.features.length > 3 && (
                    <li>
                      <button
                        onClick={() => toggleServiceExpansion(service.serviceId)}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        data-testid={`button-expand-features-${service.serviceId}`}
                      >
                        {expandedServices[service.serviceId] 
                          ? 'Show less...' 
                          : `+${service.features.length - 3} more...`
                        }
                      </button>
                    </li>
                  )}
                </ul>
              </div>

              {/* Session Info */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{service.sessionDuration} min</span>
                </div>
                <div>
                  {service.sessionsIncluded} session{service.sessionsIncluded > 1 ? 's' : ''}
                </div>
              </div>

              {/* Pricing */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      ${service.basePrice}
                      {service.includesReferral && (
                        <span className="text-sm text-green-600 dark:text-green-400 ml-2 font-normal">
                          + Referral ✨
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {service.availableSlots - service.bookedSlots} slots left
                    </div>
                  </div>
                  <Button
                    onClick={() => handleBookService(service.serviceId, service.basePrice)}
                    disabled={service.bookedSlots >= service.availableSlots}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-3 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid={`button-book-service-${service.serviceId}`}
                  >
                    {service.bookedSlots >= service.availableSlots ? '🔒 Fully Booked' : '🚀 Book Now'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-600">Try adjusting your filters or check back later.</p>
        </div>
      )}

      {/* Call to Action for Becoming a Referrer */}
      <div className="mt-12 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-10 rounded-3xl shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            💼 Work at a company? Start earning by helping others!
          </h2>
          <p className="text-green-50 text-lg mb-8 max-w-2xl mx-auto">
            Join our marketplace as a referrer and monetize your company knowledge and network. Help job seekers while earning extra income!
          </p>
          <Button
            onClick={() => window.location.href = '/become-referrer'}
            className="bg-white text-green-600 hover:bg-green-50 font-bold text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all"
          >
            <Users className="w-5 h-5 mr-2" />
            Become a Referrer Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReferralMarketplace;