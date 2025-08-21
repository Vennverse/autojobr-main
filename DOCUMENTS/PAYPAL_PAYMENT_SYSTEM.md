# PayPal Hosted Button Payment System Documentation

## Overview

AutoJobR now uses PayPal hosted buttons for secure payment processing for specific services:
- **Virtual Interview Retakes**: $5
- **Test Retakes**: $5  
- **Mock Interviews**: $10
- **Ranking Tests**: Variable pricing

This system replaces the previous custom PayPal integration with a more secure, PCI-compliant hosted solution.

## Architecture

### Payment Flow
1. User clicks "Pay" button on service page
2. PayPal hosted button loads in secure iframe
3. User completes payment on PayPal
4. PayPal sends success message via postMessage API
5. Client calls server to verify and record payment
6. Server grants immediate access to paid service

### Components

#### Frontend Components
- **PayPalHostedButton** (`client/src/components/PayPalHostedButton.tsx`)
  - Renders secure PayPal payment interface
  - Handles payment success/error callbacks
  - Verifies payment with server

#### Backend Services
- **PaymentVerificationService** (`server/paymentVerificationService.ts`)
  - Records completed payments in database
  - Verifies user access to paid services
  - Manages payment history

- **Payment Routes** (`server/paymentRoutes.ts`)
  - `/api/payments/verify-paypal` - Verify and record payment
  - `/api/payments/check-access/:serviceType` - Check user access
  - `/api/payments/history` - Get payment history
  - `/api/payments/webhook/paypal` - PayPal webhook handler

## Database Schema

### oneTimePayments Table
```sql
CREATE TABLE one_time_payments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  service_type VARCHAR NOT NULL, -- 'virtual_interview', 'test_retake', etc.
  service_id VARCHAR, -- Optional service instance ID
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'USD' NOT NULL,
  payment_provider VARCHAR NOT NULL, -- 'paypal'
  payment_id VARCHAR NOT NULL, -- PayPal transaction ID
  status VARCHAR DEFAULT 'pending' NOT NULL, -- 'completed', 'failed', etc.
  description TEXT,
  transaction_data JSONB, -- PayPal-specific data
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

## Implementation Guide

### 1. Adding PayPal Payment to a Page

```tsx
import PayPalHostedButton from '@/components/PayPalHostedButton';

// In your component
<PayPalHostedButton
  purpose="virtual_interview"
  amount={5}
  itemName="Virtual Interview Retake"
  onPaymentSuccess={(data) => {
    toast({ title: "Payment Successful!" });
    // Grant access or redirect to service
  }}
  onPaymentError={(error) => {
    toast({ title: "Payment Failed", variant: "destructive" });
  }}
  description="Complete payment to access virtual interview retake"
/>
```

### 2. Verifying Payment on Server

The PayPal hosted button automatically calls the verification endpoint:

```typescript
// Called automatically by PayPalHostedButton component
POST /api/payments/verify-paypal
{
  "serviceType": "virtual_interview",
  "amount": 5,
  "paymentData": { "orderID": "...", "id": "..." },
  "itemName": "Virtual Interview Retake"
}
```

### 3. Checking User Access

```typescript
// Check if user has paid for service recently
const response = await fetch('/api/payments/check-access/virtual_interview?withinMinutes=30');
const { hasAccess } = await response.json();
```

## Service Integration

### Chat Interview System

**VirtualInterviewStart.tsx** - Shows payment button when user needs to pay for retake:
```tsx
{eligibility?.needsPayment && showPayment && (
  <PayPalHostedButton
    purpose="virtual_interview"
    amount={5}
    itemName="Virtual Interview Retake"
    onPaymentSuccess={() => {
      // Update eligibility and start interview
      setEligibility(prev => ({ ...prev, eligible: true, needsPayment: false }));
      startChatInterview();
    }}
  />
)}
```

**VirtualInterviewFeedback.tsx** - Shows retake option for low scores:
```tsx
{interview.overallScore < 70 && (
  <PayPalHostedButton
    purpose="virtual_interview"
    amount={5}
    itemName={`${interview.role} Interview Retake`}
    onPaymentSuccess={() => {
      // Redirect to new interview
      setLocation('/virtual-interview-start');
    }}
  />
)}
```

### Test Retake System

Similar integration for ranking tests and other assessments with $5 retake fee.

## Payment Verification Methods

### 1. Client-Side Verification (Current)
- PayPal hosted button fires success callback
- Client calls server to record payment
- Server grants immediate access

### 2. PayPal Webhooks (Production Recommended)
- PayPal sends webhook to `/api/payments/webhook/paypal`
- Server verifies webhook signature
- Payment recorded without client interaction

### 3. Payment Status Polling (Alternative)
- Client polls server for payment confirmation
- Useful when webhooks are unreliable

## Security Features

### Client Security
- PayPal hosted button runs in secure iframe
- Only accepts messages from PayPal domains
- All payment processing happens on PayPal servers

### Server Security
- Authentication required for all payment endpoints
- Payment amounts validated against service pricing
- Transaction IDs tracked to prevent duplicate processing

## Configuration

### Environment Variables
```env
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_secret_here
```

### PayPal Hosted Button ID
Current button ID: `XRDMZMHE93YDS`
- Configured for $5 and $10 payments
- Production-ready button

## Testing

### Development Testing
1. Use PayPal sandbox environment
2. Test with sandbox accounts
3. Verify payment recording in database
4. Test access granting functionality

### Test Scenarios
- [ ] Successful payment flow
- [ ] Payment cancellation
- [ ] Network errors during payment
- [ ] Multiple rapid payment attempts
- [ ] User access verification

## Monitoring

### Payment Metrics
- Track payment success rates
- Monitor failed payments
- Track service access patterns

### Database Queries
```sql
-- Recent payments by service type
SELECT service_type, COUNT(*), SUM(amount::numeric)
FROM one_time_payments 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY service_type;

-- User payment history
SELECT * FROM one_time_payments 
WHERE user_id = 'user_id_here' 
ORDER BY created_at DESC;
```

## Troubleshooting

### Common Issues

**PayPal Button Not Loading**
- Check network connectivity
- Verify PayPal SDK script loading
- Check browser console for errors

**Payment Not Recording**
- Verify server endpoint `/api/payments/verify-paypal`
- Check database connection
- Review server logs for errors

**Access Not Granted**
- Check payment verification service
- Verify user authentication
- Check service-specific access logic

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development`:
```javascript
console.log('✅ Payment verified:', paymentData);
console.log('❌ Payment failed:', error);
```

## Migration Notes

### From Custom PayPal Integration
1. Replace custom PayPal buttons with PayPalHostedButton component
2. Update payment verification to use new service
3. Migrate existing payment records to new schema
4. Test all payment flows thoroughly

### Database Migration
```sql
-- Update existing payment records if needed
UPDATE one_time_payments 
SET payment_provider = 'paypal' 
WHERE payment_provider IS NULL;
```

## Production Deployment

### Pre-deployment Checklist
- [ ] PayPal production credentials configured
- [ ] Hosted button ID updated for production
- [ ] Webhook endpoints configured
- [ ] SSL certificates valid
- [ ] Payment flows tested end-to-end

### Post-deployment Monitoring
- Monitor payment success rates
- Check error logs for payment issues
- Verify webhook delivery (if enabled)
- Test user access granting

## Future Enhancements

### Planned Features
1. **Multiple Payment Methods**: Add Stripe, Apple Pay support
2. **Payment Analytics**: Detailed reporting dashboard
3. **Refund System**: Automated refund processing
4. **Subscription Integration**: Monthly/annual plans
5. **Payment Recovery**: Failed payment retry logic

### API Extensions
```typescript
// Future payment verification API
interface PaymentVerification {
  method: 'paypal' | 'stripe' | 'apple_pay';
  amount: number;
  currency: string;
  metadata: Record<string, any>;
}
```

This system provides a secure, scalable foundation for handling payments across all AutoJobR services while maintaining excellent user experience and robust error handling.