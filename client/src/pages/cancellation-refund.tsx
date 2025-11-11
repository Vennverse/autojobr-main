
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, RefreshCw, CreditCard, Clock, AlertCircle } from "lucide-react";

export default function CancellationRefund() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Cancellation & Refund Policy
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Policy Content */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="w-5 h-5 mr-2 text-blue-600" />
                Subscription Cancellation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                You can cancel your AutoJobr subscription at any time. Here's how our cancellation policy works:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li><strong>Immediate Cancellation:</strong> Cancel your subscription anytime from your account settings</li>
                <li><strong>Access Until Period End:</strong> You'll retain access to premium features until the end of your current billing cycle</li>
                <li><strong>No Auto-Renewal:</strong> Once cancelled, your subscription will not auto-renew</li>
                <li><strong>Reactivation:</strong> You can reactivate your subscription at any time</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                Refund Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We want you to be completely satisfied with AutoJobr. Our refund policy is as follows:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li><strong>7-Day Money-Back Guarantee:</strong> Full refund if you cancel within 7 days of first purchase</li>
                <li><strong>Service Issues:</strong> Refunds available if technical issues prevent service usage</li>
                <li><strong>Pro-rated Refunds:</strong> Not available for partial billing periods after 7-day window</li>
                <li><strong>One-Time Payments:</strong> Mock interviews and test retakes are refundable within 24 hours if unused</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-purple-600" />
                Refund Processing Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li><strong>Processing Time:</strong> Refunds are processed within 5-7 business days</li>
                <li><strong>Payment Method:</strong> Refunds are credited to the original payment method</li>
                <li><strong>Bank Processing:</strong> Banks may take additional 3-5 days to reflect the refund</li>
                <li><strong>Notification:</strong> You'll receive an email confirmation once refund is processed</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                Non-Refundable Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>The following are non-refundable after use:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li>Completed mock interviews or assessments</li>
                <li>Used test retake attempts</li>
                <li>Consumed AI credits or job applications</li>
                <li>Premium features used for more than 7 days</li>
                <li>Promotional or discounted subscriptions (unless stated otherwise)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Request a Refund</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="mb-4">
                To request a refund, please contact our support team:
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p><strong>Email:</strong> support@autojobr.com</p>
                <p><strong>Subject:</strong> Refund Request - [Your Order ID]</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Please include your order details and reason for refund request.
                  We typically respond within 24 hours.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                For questions about our cancellation and refund policy:
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p><strong>Email:</strong> support@autojobr.com</p>
                <p><strong>Phone:</strong> Available Monday-Friday, 9 AM - 6 PM IST</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  We're committed to resolving any concerns promptly and fairly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            This Cancellation & Refund Policy is effective as of the date listed above and may be updated from time to time.
          </p>
        </div>
      </div>
    </div>
  );
}
