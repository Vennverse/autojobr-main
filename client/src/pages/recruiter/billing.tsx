import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Crown, 
  Star, 
  Calendar, 
  DollarSign, 
  Download, 
  ArrowUpCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Subscription {
  id: string;
  planType: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  downloadUrl: string;
}

export default function RecruiterBilling() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get subscription data
  const { data: subscription, isLoading: subLoading } = useQuery<Subscription>({
    queryKey: ['/api/recruiter/subscription'],
  });

  // Get billing history
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/recruiter/invoices'],
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/recruiter/subscription/cancel', 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recruiter/subscription'] });
      toast({
        title: "Subscription cancelled",
        description: "Your subscription will end at the current period.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    }
  });

  const getPlanBadge = (planType: string) => {
    switch (planType) {
      case 'premium':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"><Crown className="w-3 h-3 mr-1" />Premium</Badge>;
      case 'enterprise':
        return <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"><Star className="w-3 h-3 mr-1" />Enterprise</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-6 h-6 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Plans</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your subscription and view billing history
        </p>
      </div>

      <div className="space-y-6">
        {/* Current Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-600" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getPlanBadge(subscription.planType)}
                      {getStatusBadge(subscription.status)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(subscription.amount, subscription.currency)} per month
                    </p>
                  </div>
                  {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                    <Button
                      variant="outline"
                      onClick={() => cancelSubscriptionMutation.mutate()}
                      disabled={cancelSubscriptionMutation.isPending}
                      data-testid="button-cancel-subscription"
                    >
                      {cancelSubscriptionMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
                    </Button>
                  )}
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Period</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Billing</Label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {subscription.cancelAtPeriodEnd ? 'Subscription ending' : formatDate(subscription.currentPeriodEnd)}
                      </span>
                    </div>
                  </div>
                </div>

                {subscription.cancelAtPeriodEnd && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      Your subscription will end on {formatDate(subscription.currentPeriodEnd)}. 
                      You'll still have access to premium features until then.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Crown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No active subscription</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Upgrade to premium to unlock advanced recruiting features
                </p>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" data-testid="button-upgrade-premium">
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              Billing History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : invoices.length > 0 ? (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">{formatDate(invoice.date)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Invoice #{invoice.id.slice(-8)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(invoice.downloadUrl, '_blank')}
                      data-testid={`button-download-invoice-${invoice.id}`}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Download className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No billing history</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your invoices will appear here once you have an active subscription
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Free</h3>
                <p className="text-2xl font-bold mb-4">$0<span className="text-sm text-gray-600">/month</span></p>
                <ul className="text-sm space-y-2 text-gray-600">
                  <li>• 5 job posts per month</li>
                  <li>• Basic candidate search</li>
                  <li>• Email support</li>
                </ul>
              </div>
              
              <div className="p-4 border-2 border-purple-500 rounded-lg relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white">Most Popular</Badge>
                </div>
                <h3 className="font-semibold mb-2">Premium</h3>
                <p className="text-2xl font-bold mb-4">$99<span className="text-sm text-gray-600">/month</span></p>
                <ul className="text-sm space-y-2 text-gray-600 mb-4">
                  <li>• Unlimited job posts</li>
                  <li>• Advanced candidate search</li>
                  <li>• Analytics & reporting</li>
                  <li>• Priority support</li>
                </ul>
                <Button className="w-full bg-purple-500 hover:bg-purple-600" data-testid="button-select-premium">
                  Select Plan
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Enterprise</h3>
                <p className="text-2xl font-bold mb-4">$299<span className="text-sm text-gray-600">/month</span></p>
                <ul className="text-sm space-y-2 text-gray-600 mb-4">
                  <li>• Everything in Premium</li>
                  <li>• Custom integrations</li>
                  <li>• Dedicated support</li>
                  <li>• White-label solution</li>
                </ul>
                <Button variant="outline" className="w-full" data-testid="button-contact-sales">
                  Contact Sales
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  function Label({ children, className }: { children: React.ReactNode; className?: string }) {
    return <label className={className}>{children}</label>;
  }
}