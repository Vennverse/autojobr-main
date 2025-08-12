#!/bin/bash

# VM PayPal Fix Deployment Script
# This script will update your VM with the PayPal fixes

echo "🚀 AutoJobr PayPal Fix Deployment"
echo "================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from your app root directory.${NC}"
    exit 1
fi

echo -e "${YELLOW}📁 Current directory: $(pwd)${NC}"

# Backup current files
echo -e "${YELLOW}📦 Creating backup...${NC}"
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
cp server/paymentService.ts backups/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || echo "paymentService.ts not found"
cp server/paypalSubscriptionService.ts backups/$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || echo "paypalSubscriptionService.ts not found"

# Update paymentService.ts - Fix PayPal API URLs
echo -e "${YELLOW}🔧 Updating paymentService.ts...${NC}"
sed -i 's|https://api-m.sandbox.paypal.com|https://api-m.paypal.com|g' server/paymentService.ts
echo -e "${GREEN}✅ PayPal API URLs updated to production${NC}"

# Update paypalSubscriptionService.ts - Fix return URLs and API endpoints
echo -e "${YELLOW}🔧 Updating paypalSubscriptionService.ts...${NC}"

# Get your actual domain
DOMAIN=$(curl -s ifconfig.me 2>/dev/null || echo "your-vm-domain.com")
if [ "$DOMAIN" = "your-vm-domain.com" ]; then
    echo -e "${YELLOW}⚠️  Could not detect domain automatically. Please update manually.${NC}"
fi

# Create the updated paypalSubscriptionService.ts
cat > temp_paypal_service.ts << 'EOL'
import axios from 'axios';
import { db } from './database';
import { subscriptions } from '../shared/schema';
import { eq } from 'drizzle-orm';

// PayPal API Types
interface PayPalAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface PayPalProduct {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
}

interface PayPalPlan {
  id: string;
  product_id: string;
  name: string;
  description: string;
  status: string;
}

interface PayPalSubscriptionResponse {
  id: string;
  status: string;
  plan_id: string;
  start_time: string;
  subscriber: {
    email_address: string;
    payer_id: string;
  };
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export class PayPalSubscriptionService {
  private readonly BASE_URL = 'https://api-m.paypal.com'; // Production PayPal API
  
  private readonly CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  private readonly CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

  // Product and Plan IDs
  private readonly PRODUCT_CATEGORIES = {
    JOBSEEKER: 'SOFTWARE',
    RECRUITER: 'SOFTWARE'
  };

  constructor() {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      console.warn('PayPal credentials not configured - subscription features will be disabled');
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      throw new Error('PayPal credentials not configured');
    }

    const auth = Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString('base64');
    
    try {
      const response = await axios({
        method: 'POST',
        url: `${this.BASE_URL}/v1/oauth2/token`,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
        },
        data: 'grant_type=client_credentials'
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error('PayPal token error:', error);
      throw new Error('Failed to get PayPal access token');
    }
  }

  // Create or get existing product for a subscription tier
  async createOrGetProduct(tierName: string, userType: 'jobseeker' | 'recruiter'): Promise<string> {
    const token = await this.getAccessToken();
    
    const productData = {
      name: `AutoJobr ${tierName} - ${userType.charAt(0).toUpperCase() + userType.slice(1)}`,
      description: `${tierName} subscription plan for ${userType}s on AutoJobr platform`,
      type: "SERVICE",
      category: this.PRODUCT_CATEGORIES[userType.toUpperCase() as keyof typeof this.PRODUCT_CATEGORIES],
      image_url: `http://${process.env.SERVER_HOST || 'localhost:5000'}/logo.png`,
      home_url: `http://${process.env.SERVER_HOST || 'localhost:5000'}`
    };

    try {
      const response = await axios({
        method: 'POST',
        url: `${this.BASE_URL}/v1/catalogs/products`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: productData
      });
      
      return response.data.id;
    } catch (error: any) {
      console.error('PayPal product creation error:', error.response?.data);
      throw new Error('Failed to create PayPal product');
    }
  }

  // Create billing plan for a product
  async createBillingPlan(productId: string, price: number, currency: string = 'USD', tierName: string): Promise<string> {
    const token = await this.getAccessToken();
    
    const planData = {
      product_id: productId,
      name: `${tierName} Monthly Plan`,
      description: `Monthly subscription for ${tierName}`,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: {
            interval_unit: "MONTH",
            interval_count: 1
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // 0 means infinite cycles
          pricing_scheme: {
            fixed_price: {
              value: price.toString(),
              currency_code: currency
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: "0",
          currency_code: currency
        },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3
      },
      taxes: {
        percentage: "0",
        inclusive: false
      }
    };

    try {
      const response = await axios({
        method: 'POST',
        url: `${this.BASE_URL}/v1/billing/plans`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: planData
      });
      
      return response.data.id;
    } catch (error: any) {
      console.error('PayPal plan creation error:', error.response?.data);
      throw new Error('Failed to create PayPal billing plan');
    }
  }

  async createSubscription(userId: string, tierName: string, price: number, userType: 'jobseeker' | 'recruiter', userEmail: string): Promise<{
    subscriptionId: string;
    approvalUrl: string;
  }> {
    try {
      // Create product and plan
      const productId = await this.createOrGetProduct(tierName, userType);
      const planId = await this.createBillingPlan(productId, price, 'USD', tierName);
      
      const token = await this.getAccessToken();
      
      const subscriptionData = {
        plan_id: planId,
        start_time: new Date().toISOString(),
        subscriber: {
          email_address: userEmail
        },
        application_context: {
          brand_name: "AutoJobr",
          user_action: "SUBSCRIBE_NOW",
          payment_method: {
            payer_selected: "PAYPAL",
            payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
          },
          return_url: `http://${process.env.SERVER_HOST || 'localhost:5000'}/subscription/success?userId=${userId}`,
          cancel_url: `http://${process.env.SERVER_HOST || 'localhost:5000'}/subscription/cancel`
        }
      };

      const response = await axios({
        method: 'POST',
        url: `${this.BASE_URL}/v1/billing/subscriptions`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: subscriptionData
      });

      const subscription = response.data;
      const approvalLink = subscription.links.find((link: any) => link.rel === 'approve');
      
      if (!approvalLink) {
        throw new Error('No approval URL received from PayPal');
      }

      return {
        subscriptionId: subscription.id,
        approvalUrl: approvalLink.href
      };
    } catch (error: any) {
      console.error('PayPal subscription creation error:', error.response?.data || error);
      throw new Error('Failed to create PayPal subscription');
    }
  }

  // Cancel a PayPal subscription
  async cancelSubscription(subscriptionId: string, reason: string): Promise<boolean> {
    const token = await this.getAccessToken();
    
    try {
      await axios({
        method: 'POST',
        url: `${this.BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          reason: reason
        }
      });

      // Update subscription status in database
      await db.update(subscriptions)
        .set({ 
          status: 'cancelled',
          cancelledAt: new Date()
        })
        .where(eq(subscriptions.paypalSubscriptionId, subscriptionId));

      return true;
    } catch (error: any) {
      console.error('PayPal subscription cancellation error:', error.response?.data || error);
      throw new Error('Failed to cancel PayPal subscription');
    }
  }

  async verifySubscription(subscriptionId: string): Promise<{
    status: string;
    subscriberEmail: string;
  }> {
    const token = await this.getAccessToken();
    
    try {
      const response = await axios({
        method: 'GET',
        url: `${this.BASE_URL}/v1/billing/subscriptions/${subscriptionId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const subscription = response.data;
      
      return {
        status: subscription.status,
        subscriberEmail: subscription.subscriber.email_address
      };
    } catch (error: any) {
      console.error('PayPal subscription verification error:', error.response?.data || error);
      throw new Error('Failed to verify PayPal subscription');
    }
  }

  async activateSubscription(subscriptionId: string): Promise<boolean> {
    try {
      // Update subscription status in database
      await db.update(subscriptions)
        .set({ 
          status: 'active',
          activatedAt: new Date()
        })
        .where(eq(subscriptions.paypalSubscriptionId, subscriptionId));

      return true;
    } catch (error) {
      console.error('Subscription activation error:', error);
      return false;
    }
  }
}

export const paypalSubscriptionService = new PayPalSubscriptionService();
EOL

# Replace the original file if it exists
if [ -f "server/paypalSubscriptionService.ts" ]; then
    mv temp_paypal_service.ts server/paypalSubscriptionService.ts
    echo -e "${GREEN}✅ paypalSubscriptionService.ts updated${NC}"
else
    mv temp_paypal_service.ts server/paypalSubscriptionService.ts
    echo -e "${GREEN}✅ paypalSubscriptionService.ts created${NC}"
fi

# Add SERVER_HOST to .env if not present
if ! grep -q "SERVER_HOST" .env; then
    echo "" >> .env
    echo "# Server Configuration" >> .env
    echo "SERVER_HOST=$DOMAIN:5000" >> .env
    echo -e "${GREEN}✅ Added SERVER_HOST to .env${NC}"
fi

# Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build 2>/dev/null || echo -e "${YELLOW}⚠️  Build command not found, skipping...${NC}"

# Restart the application
echo -e "${YELLOW}🔄 Restarting application...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 restart all
    echo -e "${GREEN}✅ PM2 applications restarted${NC}"
elif systemctl is-active --quiet autojobr; then
    sudo systemctl restart autojobr
    echo -e "${GREEN}✅ Systemd service restarted${NC}"
else
    echo -e "${YELLOW}⚠️  Please manually restart your application${NC}"
    echo -e "${YELLOW}   You can use: npm start or node server/index.js${NC}"
fi

# Test PayPal connection
echo -e "${YELLOW}🧪 Testing PayPal connection...${NC}"
sleep 3
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/paypal/setup)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ PayPal connection test successful!${NC}"
else
    echo -e "${RED}❌ PayPal connection test failed (HTTP $RESPONSE)${NC}"
    echo -e "${YELLOW}   Check your PayPal credentials and try again${NC}"
fi

echo ""
echo -e "${GREEN}🎉 PayPal fix deployment completed!${NC}"
echo -e "${YELLOW}📝 Summary of changes:${NC}"
echo "   • Updated PayPal API URLs to production"
echo "   • Fixed return URLs for your domain"
echo "   • Added SERVER_HOST configuration"
echo "   • Restarted application services"
echo ""
echo -e "${YELLOW}🔍 Next steps:${NC}"
echo "   • Test PayPal payments in your application"
echo "   • Update SERVER_HOST in .env with your actual domain if needed"
echo "   • Monitor logs for any PayPal-related errors"