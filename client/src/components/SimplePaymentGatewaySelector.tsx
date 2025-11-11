import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { SiPaypal, SiStripe } from "react-icons/si";

interface SimplePaymentGatewaySelectorProps {
  selectedGateway: 'stripe' | 'paypal' | 'razorpay' | null;
  onGatewayChange: (gateway: 'stripe' | 'paypal' | 'razorpay') => void;
}

export default function SimplePaymentGatewaySelector({
  selectedGateway,
  onGatewayChange
}: SimplePaymentGatewaySelectorProps) {
  const paymentGateways = [
    {
      id: 'stripe',
      name: 'Stripe',
      icon: <SiStripe className="w-6 h-6 text-blue-600" />,
      description: 'Credit/Debit Cards (International)',
      status: 'active',
      badge: 'Most Secure',
      badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <SiPaypal className="w-6 h-6 text-blue-600" />,
      description: 'Pay securely with PayPal (International)',
      status: 'active',
      badge: 'Recommended',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    },
    {
      id: 'razorpay',
      name: 'Razorpay',
      icon: <CreditCard className="w-6 h-6 text-purple-600" />,
      description: 'Cards, UPI, Netbanking (India)',
      status: 'active',
      badge: 'Popular in India',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    }
  ];

  return (
    <Card className="border-none shadow-none" data-testid="payment-gateway-selector">
      <CardContent className="p-0 space-y-3">
        {paymentGateways.map((gateway) => (
          <div
            key={gateway.id}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedGateway === gateway.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onGatewayChange(gateway.id as 'stripe' | 'paypal' | 'razorpay')}
            data-testid={`gateway-option-${gateway.id}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {gateway.icon}
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {gateway.name}
                    <Badge className={`text-xs ${gateway.badgeColor}`}>
                      {gateway.badge}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {gateway.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {gateway.status === 'active' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                )}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedGateway === gateway.id
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`}>
                  {selectedGateway === gateway.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
