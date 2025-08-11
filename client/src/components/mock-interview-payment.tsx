import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Shield,
  Star,
  MessageSquare,
  Brain,
  Trophy,
  DollarSign
} from "lucide-react";

interface MockInterviewPaymentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MockInterviewPayment({ onSuccess, onCancel }: MockInterviewPaymentProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'amazon_pay'>('paypal');
  const [isProcessing, setIsProcessing] = useState(false);

  // Create payment intent mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (method: string) => {
      const response = await apiRequest('POST', '/api/mock-interview/payment', {
        amount: 2.00,
        currency: 'USD',
        method: method,
        item: 'mock_interview'
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Successful!",
        description: "You can now start your mock interview.",
        duration: 3000,
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      if (paymentMethod === 'paypal') {
        // Handle PayPal payment
        const response = await createPaymentMutation.mutateAsync('paypal');
        if (response.approvalUrl) {
          // Redirect to PayPal
          window.location.href = response.approvalUrl;
        }
      } else if (paymentMethod === 'amazon_pay') {
        // Handle Amazon Pay payment
        const response = await createPaymentMutation.mutateAsync('amazon_pay');
        if (response.orderId) {
          toast({
            title: "Amazon Pay Payment",
            description: "Amazon Pay integration coming soon. Please use PayPal for now.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 mx-auto mb-4">
            <MessageSquare className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Mock Interview Practice
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Unlock unlimited mock interview practice sessions
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
              <Brain className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI-Powered Questions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Dynamic technical and behavioral questions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Real-time Feedback</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Instant scoring and improvement suggestions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
              <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Multiple Formats</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Technical, behavioral, and system design</p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">$2.00</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">per interview</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Or get unlimited access with Premium
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              One-time
            </Badge>
          </div>
        </div>

        {/* Payment Method Selection */}
        <Tabs value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paypal">PayPal</TabsTrigger>
            <TabsTrigger value="amazon_pay">Amazon Pay</TabsTrigger>
          </TabsList>
          
          <TabsContent value="paypal" className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Pay with PayPal</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PayPal balance, bank account, or credit card
            </p>
          </TabsContent>
          
          <TabsContent value="amazon_pay" className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Pay with Amazon Pay</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Amazon account payment methods (coming soon)
            </p>
          </TabsContent>
        </Tabs>

        {/* Security Notice */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Secure & Encrypted</span>
          </div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            All payments are processed securely. We don't store your payment information.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePayment}
            disabled={isProcessing}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pay $2.00
              </div>
            )}
          </Button>
        </div>

        {/* Alternative Option */}
        <div className="text-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Want unlimited interviews?
          </p>
          <Button 
            variant="link" 
            onClick={() => window.open('/subscription', '_blank')}
            className="text-blue-600 hover:text-blue-700"
          >
            <Star className="w-4 h-4 mr-1" />
            Upgrade to Premium
          </Button>
        </div>
      </div>
    </div>
  );
}