import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageCircle, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  ExternalLink, 
  Send,
  Settings,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Booking {
  id: number;
  serviceId: number;
  jobSeekerId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  scheduledAt?: Date;
  conversationId: number;
  notes?: string;
  totalAmount: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
  jobSeeker: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  };
  service: {
    id: number;
    title: string;
    serviceType: string;
    sessionDuration: number;
  };
}

interface ReferrerProfile {
  id: number;
  meetingScheduleLink?: string;
  emailTemplate?: string;
}

const MyBookings: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [referrerProfile, setReferrerProfile] = useState<ReferrerProfile | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Schedule meeting modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [defaultMeetingLink, setDefaultMeetingLink] = useState('');
  const [defaultEmailTemplate, setDefaultEmailTemplate] = useState('');

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchReferrerProfile();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/referral-marketplace/bookings/referrer');
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrerProfile = async () => {
    try {
      const response = await fetch('/api/referral-marketplace/profile');
      const data = await response.json();
      
      if (data.success && data.profile) {
        setReferrerProfile(data.profile);
        setDefaultMeetingLink(data.profile.meetingScheduleLink || '');
        setDefaultEmailTemplate(data.profile.emailTemplate || getDefaultEmailTemplate());
      }
    } catch (error) {
      console.error('Error fetching referrer profile:', error);
    }
  };

  const getDefaultEmailTemplate = () => {
    return `Hi {firstName},

Thank you for booking a session with me! I'm excited to help you with your career goals.

I'd like to schedule our meeting. Please use the link below to choose a time that works best for you:

{meetingLink}

Our session will cover:
- Career advice and insights
- Interview preparation tips
- Company-specific guidance
- Next steps in your job search

If you have any specific questions or topics you'd like to discuss, please feel free to reply to this email.

Looking forward to our conversation!

Best regards,
{referrerName}`;
  };

  const handleChatWithUser = (conversationId: number) => {
    // Navigate to chat with the specific conversation
    window.location.href = `/simple-chat?conversation=${conversationId}`;
  };

  const handleScheduleMeeting = (booking: Booking) => {
    setSelectedBooking(booking);
    setMeetingLink(defaultMeetingLink);
    setCustomMessage('');
    setShowScheduleModal(true);
  };

  const sendScheduleEmail = async () => {
    if (!selectedBooking || !meetingLink.trim()) {
      alert('Please provide a meeting link');
      return;
    }

    try {
      setSendingEmail(true);
      
      const emailData = {
        bookingId: selectedBooking.id,
        meetingLink: meetingLink.trim(),
        customMessage: customMessage.trim()
      };

      const response = await fetch('/api/referral-marketplace/send-schedule-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Meeting invitation sent successfully!');
        setShowScheduleModal(false);
        setSelectedBooking(null);
        // Optionally update booking status
        fetchBookings();
      } else {
        alert('Failed to send email: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending schedule email:', error);
      alert('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const updateReferrerSettings = async () => {
    try {
      const response = await fetch('/api/referral-marketplace/profile/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingScheduleLink: defaultMeetingLink.trim(),
          emailTemplate: defaultEmailTemplate.trim()
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Settings updated successfully!');
        setShowSettingsModal(false);
        fetchReferrerProfile();
      } else {
        alert('Failed to update settings: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Confirmed</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Payment Pending</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case 'refunded':
        return <Badge variant="destructive">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Please log in</h1>
        <p>You need to be logged in to view your bookings.</p>
        <Button onClick={() => window.location.href = '/auth-page'} className="mt-4">
          Log In
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
            <p className="text-gray-600">
              Manage your referral service bookings and communicate with job seekers
            </p>
          </div>
          
          {/* Settings Button */}
          <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Referrer Settings</DialogTitle>
                <DialogDescription>
                  Configure your default meeting link and email template
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="defaultMeetingLink">Default Meeting Scheduling Link</Label>
                  <Input
                    id="defaultMeetingLink"
                    value={defaultMeetingLink}
                    onChange={(e) => setDefaultMeetingLink(e.target.value)}
                    placeholder="https://calendly.com/yourusername or https://cal.com/yourusername"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Your Calendly, Cal.com, or other scheduling tool link
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="defaultEmailTemplate">Default Email Template</Label>
                  <Textarea
                    id="defaultEmailTemplate"
                    value={defaultEmailTemplate}
                    onChange={(e) => setDefaultEmailTemplate(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use {"{firstName}"}, {"{meetingLink}"}, and {"{referrerName}"} as placeholders
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
                  Cancel
                </Button>
                <Button onClick={updateReferrerSettings}>
                  Save Settings
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Navigation Submenu */}
        <div className="flex flex-wrap gap-2 mt-6">
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
            Manage Services
          </Button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-6">
        {bookings.map((booking) => (
          <Card key={booking.id} className="w-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {booking.service.title}
                  </CardTitle>
                  <CardDescription>
                    Booking #{booking.id} • {booking.service.serviceType}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  {getStatusBadge(booking.status)}
                  {getPaymentStatusBadge(booking.paymentStatus)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Job Seeker Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {booking.jobSeeker.firstName ? 
                        `${booking.jobSeeker.firstName} ${booking.jobSeeker.lastName || ''}`.trim() :
                        'Job Seeker'
                      }
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {booking.jobSeeker.email}
                      </div>
                      {booking.jobSeeker.phoneNumber && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {booking.jobSeeker.phoneNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{booking.service.sessionDuration} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span>${booking.totalAmount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>
                    {booking.scheduledAt ? 
                      formatDate(booking.scheduledAt) : 
                      'Not scheduled'
                    }
                  </span>
                </div>
              </div>

              {/* Notes */}
              {booking.notes && (
                <div>
                  <h5 className="font-medium mb-2">Job Seeker's Notes:</h5>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {booking.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChatWithUser(booking.conversationId)}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat with User
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleScheduleMeeting(booking)}
                  className="flex items-center gap-2"
                  disabled={booking.paymentStatus !== 'paid'}
                >
                  <Calendar className="w-4 h-4" />
                  Schedule Meeting
                </Button>
                
                {booking.paymentStatus !== 'paid' && (
                  <p className="text-sm text-gray-500 flex items-center">
                    Meeting scheduling available after payment confirmation
                  </p>
                )}
              </div>

              <div className="text-xs text-gray-500">
                Booked on {formatDate(booking.createdAt)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
          <p className="text-gray-600 mb-4">
            When job seekers book your services, they'll appear here.
          </p>
          <Button
            onClick={() => window.location.href = '/referral-marketplace'}
            variant="outline"
          >
            View Marketplace
          </Button>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>
              Send a meeting invitation to {selectedBooking?.jobSeeker.firstName || 'the job seeker'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="meetingLink">Meeting Scheduling Link *</Label>
              <Input
                id="meetingLink"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://calendly.com/yourusername"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Provide your Calendly, Cal.com, or other scheduling tool link
              </p>
            </div>
            
            <div>
              <Label htmlFor="customMessage">Additional Message (Optional)</Label>
              <Textarea
                id="customMessage"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                placeholder="Any additional information for the job seeker..."
              />
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Email Preview:</strong> The job seeker will receive a professional email with your meeting link and instructions for scheduling.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={sendScheduleEmail} 
              disabled={sendingEmail || !meetingLink.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              {sendingEmail ? 'Sending...' : 'Send Meeting Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBookings;