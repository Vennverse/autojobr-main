
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Package, Clock, Globe, CreditCard } from "lucide-react";

export default function ShippingPolicy() {
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
            Shipping & Delivery Policy
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
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                Digital Service Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                AutoJobr is a 100% digital platform. All our services are delivered electronically with instant access. There is no physical shipping involved.
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li><strong>Instant Access:</strong> All subscriptions and features are activated immediately upon successful payment</li>
                <li><strong>No Shipping Costs:</strong> As a digital service, there are no shipping or delivery charges</li>
                <li><strong>Global Availability:</strong> Access AutoJobr from anywhere in the world with an internet connection</li>
                <li><strong>24/7 Access:</strong> Your account and all features are available round-the-clock</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-green-600" />
                Service Activation Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li><strong>Free Account:</strong> Instant activation - start using immediately after signup</li>
                <li><strong>Premium Subscription:</strong> Activated within seconds of payment confirmation</li>
                <li><strong>Mock Interviews:</strong> Credits added to your account instantly after purchase</li>
                <li><strong>Test Retakes:</strong> Available immediately after payment processing</li>
                <li><strong>AI Features:</strong> Enabled in real-time once subscription is active</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2 text-purple-600" />
                Access & Delivery Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>All services are delivered through:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li><strong>Web Platform:</strong> Access via autojobr.com from any modern browser</li>
                <li><strong>Chrome Extension:</strong> Download directly from Chrome Web Store</li>
                <li><strong>Email Notifications:</strong> Confirmation and updates sent to your registered email</li>
                <li><strong>Dashboard Access:</strong> All features available through your user dashboard</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-orange-600" />
                Payment & Activation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li>Payments are processed securely through PayPal, Razorpay, and Stripe</li>
                <li>Service activation occurs automatically upon payment confirmation</li>
                <li>You'll receive email confirmation with access details</li>
                <li>No waiting period - start using premium features immediately</li>
                <li>For subscription renewals, access continues uninterrupted</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Technical Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="mb-4">
                To access AutoJobr services, you need:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li>Stable internet connection</li>
                <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                <li>Valid email address for account access</li>
                <li>For Chrome Extension: Google Chrome browser</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support & Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                If you experience any issues accessing your services:
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p><strong>Email:</strong> support@autojobr.com</p>
                <p><strong>Response Time:</strong> Within 24 hours</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Our support team will assist with any access or delivery issues immediately.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            For questions about service delivery, contact us at support@autojobr.com
          </p>
        </div>
      </div>
    </div>
  );
}
