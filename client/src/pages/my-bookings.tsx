import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  User, 
  Mail, 
  MessageCircle, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Booking {
  id: number;
  serviceId: number;
  status: 'pending_payment' | 'paid' | 'scheduled' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  totalAmount: number;
  notes?: string;
  scheduledAt?: string;
  createdAt: string;
  service: {
    title: string;
    serviceType: string;
    description: string;
    sessionDuration: number;
    basePrice: number;
    includesReferral: boolean;
  };
  referrer: {
    id: number;
    displayName: string;
    companyName: string;
    jobTitle: string;
    isAnonymous: boolean;
  };
  jobSeeker?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const MyBookings: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [referrerBookings, setReferrerBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('job_seeker');

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user, activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/referral-marketplace/my-bookings?role=${activeTab}`);
      const data = await response.json();
      
      if (data.success) {
        if (activeTab === 'job_seeker') {
          setBookings(data.bookings);
        } else {
          setReferrerBookings(data.bookings);
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (bookingId: number, amount: number) => {
    try {
      // Create PayPal order
      const response = await fetch('/api/referral-marketplace/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          amount
        }),
      });

      const data = await response.json();
      
      if (data.success && data.approvalUrl) {
        // Redirect to PayPal
        window.location.href = data.approvalUrl;
      } else {
        alert('Failed to create payment: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to create payment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">⏳ Pending Payment</Badge>;
      case 'paid':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">💳 Paid</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="text-purple-600 border-purple-600">📅 Scheduled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600">✅ Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600 border-red-600">❌ Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Pending</Badge>;
      case 'paid':
        return <Badge variant="outline" className="text-green-600 border-green-600">Paid</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-600 border-red-600">Failed</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="text-gray-600 border-gray-600">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const BookingCard = ({ booking, isReferrer = false }: { booking: Booking; isReferrer?: boolean }) => (
    <Card key={booking.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.service.title}</CardTitle>
            <CardDescription>
              {isReferrer ? (
                booking.jobSeeker ? 
                  `Booking by ${booking.jobSeeker.firstName} ${booking.jobSeeker.lastName}` :
                  'Job Seeker Booking'
              ) : (
                `${booking.referrer.displayName} at ${booking.referrer.companyName}`
              )}
            </CardDescription>
          </div>
          <div className="text-right">
            {getStatusBadge(booking.status)}
            <div className="mt-1">
              {getPaymentStatusBadge(booking.paymentStatus)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>Booked: {formatDate(booking.createdAt)}</span>
            </div>
            
            {booking.scheduledAt && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>Scheduled: {formatDate(booking.scheduledAt)}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="font-medium">${booking.totalAmount}</span>
            </div>
          </div>

          <div className="space-y-2">
            {isReferrer && booking.jobSeeker && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{booking.jobSeeker.email}</span>
              </div>
            )}
            
            <div className="text-sm text-gray-600">
              Duration: {booking.service.sessionDuration} minutes
            </div>
            
            {booking.service.includesReferral && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Includes Referral
              </Badge>
            )}
          </div>
        </div>

        {booking.notes && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-1">Notes:</h4>
            <p className="text-sm text-gray-700">{booking.notes}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {booking.status === 'pending_payment' && booking.paymentStatus === 'pending' && !isReferrer && (
            <Button
              onClick={() => handlePayment(booking.id, booking.totalAmount)}
              className="bg-green-600 hover:bg-green-700"
            >
              Pay Now ${booking.totalAmount}
            </Button>
          )}
          
          {booking.status === 'paid' && (
            <Button variant="outline" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Contact {isReferrer ? 'Job Seeker' : 'Referrer'}
            </Button>
          )}
          
          {booking.status === 'completed' && !isReferrer && (
            <Button variant="outline" className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Leave Feedback
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = `/referral-marketplace/booking/${booking.id}`}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>Please login to view your bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/auth-page'}
              className="w-full"
            >
              Login / Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-gray-600 mb-4">
          Manage your referral marketplace bookings and payments
        </p>
        
        {/* Navigation Submenu */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/referral-marketplace'}
          >
            Browse Services
          </Button>
          <Button
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/my-bookings'}
            className="bg-blue-50 border-blue-200 text-blue-700"
          >
            My Bookings
          </Button>
          <Button
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/become-referrer'}
          >
            Become a Referrer
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="job_seeker">As Job Seeker</TabsTrigger>
          <TabsTrigger value="referrer">As Referrer</TabsTrigger>
        </TabsList>

        <TabsContent value="job_seeker" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Services You've Booked</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBookings}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p>Loading your bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-4">
                  Start by booking a referral service from our marketplace
                </p>
                <Button 
                  onClick={() => window.location.href = '/referral-marketplace'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Browse Services
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div>
              {bookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} isReferrer={false} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="referrer" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Bookings for Your Services</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBookings}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p>Loading your bookings...</p>
            </div>
          ) : referrerBookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-4">
                  Once people book your services, they'll appear here
                </p>
                <Button 
                  onClick={() => window.location.href = '/become-referrer'}
                  variant="outline"
                  className="mr-2"
                >
                  Create Services
                </Button>
                <Button 
                  onClick={() => window.location.href = '/referral-marketplace'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  View Marketplace
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div>
              {referrerBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} isReferrer={true} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyBookings;