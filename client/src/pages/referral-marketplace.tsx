import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, Users, Shield, MessageCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();
  const [services, setServices] = useState<ReferralService[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleBookService = async (serviceId: number) => {
    if (!user) {
      window.location.href = '/auth-page';
      return;
    }

    try {
      const response = await fetch(`/api/referral-marketplace/book/${serviceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: 'Booking from marketplace'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect to payment page or show payment modal
        alert('Booking created! Redirecting to payment...');
        // Here you would integrate with your payment system
      } else {
        alert('Failed to create booking: ' + data.error);
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading services...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Referral Marketplace</h1>
        <p className="text-gray-600 mb-6">
          Connect with company employees for career advice, interview prep, and referral opportunities
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={filter.serviceType}
            onChange={(e) => setFilter(prev => ({ ...prev, serviceType: e.target.value }))}
            className="border rounded px-3 py-2"
          >
            <option value="">All Service Types</option>
            <option value="intro_meeting">Intro Meeting + Referral</option>
            <option value="interview_prep">Interview Preparation</option>
            <option value="ongoing_mentorship">Ongoing Mentorship</option>
          </select>

          <select
            value={filter.includesReferral}
            onChange={(e) => setFilter(prev => ({ ...prev, includesReferral: e.target.value }))}
            className="border rounded px-3 py-2"
          >
            <option value="">All Services</option>
            <option value="true">Includes Referral</option>
            <option value="false">No Referral</option>
          </select>

          <input
            type="text"
            placeholder="Company name..."
            value={filter.companyName}
            onChange={(e) => setFilter(prev => ({ ...prev, companyName: e.target.value }))}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Service Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.serviceId} className="h-fit">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="text-lg">{service.title}</CardTitle>
                {service.includesReferral && (
                  <Badge variant="default" className="bg-orange-100 text-orange-800">
                    Referral Included
                  </Badge>
                )}
              </div>
              <CardDescription>{getServiceTypeLabel(service.serviceType)}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Referrer Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{service.referrer.displayName}</h4>
                  {getVerificationBadge(service.referrer.verificationLevel)}
                </div>
                <p className="text-sm text-gray-600">
                  {service.referrer.jobTitle} at {service.referrer.companyName}
                </p>
                {service.referrer.yearsAtCompany && (
                  <p className="text-xs text-gray-500">
                    {service.referrer.yearsAtCompany} years at company
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
                  {service.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      {feature}
                    </li>
                  ))}
                  {service.features.length > 3 && (
                    <li className="text-xs text-gray-500">
                      +{service.features.length - 3} more...
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
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold">
                      ${service.basePrice}
                      {service.includesReferral && service.referralBonusPrice > 0 && (
                        <span className="text-sm text-gray-600 ml-1">
                          + ${service.referralBonusPrice} bonus
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {service.availableSlots - service.bookedSlots} slots available
                    </div>
                  </div>
                  <Button
                    onClick={() => handleBookService(service.serviceId)}
                    disabled={service.bookedSlots >= service.availableSlots}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {service.bookedSlots >= service.availableSlots ? 'Fully Booked' : 'Book Now'}
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
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Work at a company? Start earning by helping others!
          </h2>
          <p className="text-gray-600 mb-6">
            Join our marketplace as a referrer and monetize your company knowledge and network.
          </p>
          <Button
            onClick={() => window.location.href = '/become-referrer'}
            className="bg-green-600 hover:bg-green-700"
          >
            Become a Referrer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReferralMarketplace;