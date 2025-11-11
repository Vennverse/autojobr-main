
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, FileText, Shield, Users, AlertTriangle, Scale, Globe } from "lucide-react";

export default function TermsConditions() {
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
            Terms & Conditions
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Terms Content */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                By accessing and using AutoJobr ("the Service"), you accept and agree to be bound by the terms and conditions of this agreement. If you do not agree to these terms, please do not use our Service.
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li>These terms apply to all users, including job seekers and recruiters</li>
                <li>You must be at least 18 years old to use our Service</li>
                <li>You agree to provide accurate and complete information</li>
                <li>You are responsible for maintaining the confidentiality of your account</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-600" />
                User Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>When you create an account with us, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li><strong>Account Security:</strong> Keep your password secure and confidential</li>
                <li><strong>Accurate Information:</strong> Provide truthful and up-to-date information</li>
                <li><strong>Single Account:</strong> Maintain only one account per individual</li>
                <li><strong>Prohibited Activities:</strong> Not engage in fraudulent or illegal activities</li>
                <li><strong>Account Termination:</strong> We reserve the right to terminate accounts that violate our terms</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-purple-600" />
                Service Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>AutoJobr provides job search automation and recruitment tools. You agree to:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li><strong>Legitimate Use:</strong> Use the Service only for lawful job search or recruitment purposes</li>
                <li><strong>No Spam:</strong> Not send unsolicited communications through our platform</li>
                <li><strong>Respect Limits:</strong> Adhere to usage limits based on your subscription tier</li>
                <li><strong>Content Rights:</strong> You retain ownership of content you upload (resumes, job postings)</li>
                <li><strong>AI Features:</strong> Understand that AI-generated content is for assistance only</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                Prohibited Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>You must not:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li>Use automated systems to abuse or overload our Service</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Submit false or misleading information</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Reverse engineer or copy our software</li>
                <li>Resell or redistribute our Service without permission</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scale className="w-5 h-5 mr-2 text-red-600" />
                Payment & Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li><strong>Pricing:</strong> Subscription prices are as displayed on our website</li>
                <li><strong>Billing:</strong> Subscriptions are billed in advance on a monthly or annual basis</li>
                <li><strong>Auto-Renewal:</strong> Subscriptions auto-renew unless cancelled</li>
                <li><strong>Payment Methods:</strong> We accept credit cards, PayPal, and Razorpay</li>
                <li><strong>Refunds:</strong> Subject to our Cancellation & Refund Policy</li>
                <li><strong>Price Changes:</strong> We reserve the right to modify pricing with 30 days notice</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2 text-indigo-600" />
                Intellectual Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li>AutoJobr and its content are protected by copyright and trademark laws</li>
                <li>You may not use our trademarks without written permission</li>
                <li>User-generated content remains the property of the user</li>
                <li>By uploading content, you grant us a license to use it to provide our Service</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                AutoJobr provides the Service "as is" without warranties. We are not liable for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
                <li>Job application outcomes or hiring decisions</li>
                <li>Third-party actions or content</li>
                <li>Service interruptions or data loss</li>
                <li>Indirect, incidental, or consequential damages</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Continued use of the Service constitutes acceptance of modified terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                For questions about these Terms & Conditions:
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p><strong>Email:</strong> legal@autojobr.com</p>
                <p><strong>Address:</strong> AutoJobr Legal Team</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  We will respond to inquiries within 48 hours.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            By using AutoJobr, you acknowledge that you have read and understood these Terms & Conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
