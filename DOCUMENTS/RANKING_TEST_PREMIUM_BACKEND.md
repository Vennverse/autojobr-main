# Backend Implementation for Premium Monthly Free Ranking Tests

## Overview
This document outlines the backend changes needed to implement monthly free ranking tests for premium users.

## Database Schema Changes

### 1. Add to User table (if not exists):
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS ranking_test_usage_month VARCHAR(7); -- Format: YYYY-MM
ALTER TABLE users ADD COLUMN IF NOT EXISTS ranking_test_free_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ranking_test_free_limit INTEGER DEFAULT 1;
```

### 2. Add to ranking_tests table (if not exists):
```sql
ALTER TABLE ranking_tests ADD COLUMN IF NOT EXISTS is_free_test BOOLEAN DEFAULT FALSE;
ALTER TABLE ranking_tests ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
```

## API Endpoints to Implement/Update

### 1. UPDATE /api/usage/report (Existing endpoint)
**Purpose**: Include ranking test data in the main usage report

**Updated Response** (add these fields to existing response):
```json
{
  "subscription": { /* existing subscription data */ },
  "usage": {
    "jobAnalyses": 5,
    "resumeAnalyses": 2,
    "applications": 10,
    "autoFills": 3,
    "rankingTests": 2,
    "freeRankingTests": 1  // NEW: Free ranking tests used this month
  },
  "limits": {
    "jobAnalyses": 10,
    "resumeAnalyses": 5,
    "applications": -1,
    "autoFills": 10,
    "rankingTests": -1,
    "freeRankingTests": 1  // NEW: Free ranking tests limit (1 for premium, 0 for free)
  },
  "percentages": {
    "jobAnalyses": 50,
    "resumeAnalyses": 40,
    "applications": 0,
    "autoFills": 30,
    "rankingTests": 0,
    "freeRankingTests": 100  // NEW: Percentage of free tests used
  },
  "upgradeRecommended": false
}
```

### 2. GET /api/ranking-tests/usage (Optional - for fallback)
**Purpose**: Get user's monthly usage statistics (fallback endpoint)

**Response**:
```json
{
  "monthlyFreeUsed": 1,
  "monthlyFreeLimit": 1,
  "currentMonth": "2024-01",
  "isPremium": true,
  "canUseFree": false,
  "nextResetDate": "2024-02-01T00:00:00.000Z"
}
```

**Logic for /api/usage/report update**:
```javascript
// In your existing /api/usage/report endpoint, add this logic:

// Check if current month is different from stored month
const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
const userMonth = user.ranking_test_usage_month;

// Reset if new month
if (userMonth !== currentMonth) {
  await db.user.update({
    where: { id: userId },
    data: {
      ranking_test_usage_month: currentMonth,
      ranking_test_free_used: 0
    }
  });
  user.ranking_test_free_used = 0; // Update local variable
}

const isPremium = user.planType === 'premium' || user.planType === 'enterprise';
const freeLimit = isPremium ? 1 : 0;
const freeUsed = user.ranking_test_free_used || 0;

// Count paid ranking tests this month
const paidRankingTests = await db.rankingTest.count({
  where: {
    userId,
    is_free_test: false,
    createdAt: {
      gte: new Date(currentMonth + '-01'),
      lt: new Date(new Date(currentMonth + '-01').setMonth(new Date(currentMonth + '-01').getMonth() + 1))
    }
  }
});

// Add to existing usage report response:
const existingUsageReport = {
  // ... your existing usage data
};

// Add ranking test data
existingUsageReport.usage.rankingTests = paidRankingTests;
existingUsageReport.usage.freeRankingTests = freeUsed;

existingUsageReport.limits.rankingTests = -1; // Unlimited paid tests
existingUsageReport.limits.freeRankingTests = freeLimit;

existingUsageReport.percentages.rankingTests = 0; // Always 0 for unlimited
existingUsageReport.percentages.freeRankingTests = freeLimit > 0 ? (freeUsed / freeLimit) * 100 : 0;

return existingUsageReport;
```

### 2. POST /api/ranking-tests/create (Update existing)
**Purpose**: Create ranking test with free test support

**Request Body**:
```json
{
  "category": "technical",
  "domain": "general",
  "difficultyLevel": "expert",
  "useFreeTest": true
}
```

**Logic**:
```javascript
// Check if user wants to use free test
if (useFreeTest) {
  // Verify user is premium
  const isPremium = user.planType === 'premium' || user.planType === 'enterprise';
  if (!isPremium) {
    throw new Error('Free tests are only available for premium users');
  }

  // Check monthly usage
  const currentMonth = new Date().toISOString().slice(0, 7);
  if (user.ranking_test_usage_month !== currentMonth) {
    // Reset monthly usage
    await db.user.update({
      where: { id: userId },
      data: {
        ranking_test_usage_month: currentMonth,
        ranking_test_free_used: 0
      }
    });
    user.ranking_test_free_used = 0;
  }

  if (user.ranking_test_free_used >= 1) {
    throw new Error('Monthly free test already used');
  }

  // Create test with free status
  const test = await db.rankingTest.create({
    data: {
      userId,
      category,
      domain,
      difficultyLevel,
      is_free_test: true,
      payment_status: 'completed', // Skip payment for free tests
      status: 'active'
    }
  });

  // Increment free usage
  await db.user.update({
    where: { id: userId },
    data: {
      ranking_test_free_used: user.ranking_test_free_used + 1
    }
  });

  return test;
} else {
  // Regular paid test logic (existing)
  const test = await db.rankingTest.create({
    data: {
      userId,
      category,
      domain,
      difficultyLevel,
      is_free_test: false,
      payment_status: 'pending',
      status: 'pending_payment'
    }
  });

  return test;
}
```

### 3. GET /api/ranking-tests/history (Update existing)
**Purpose**: Include free test information in history

**Update the response to include**:
```json
{
  "id": 123,
  "testTitle": "Technical - General",
  "percentageScore": 85,
  "rank": 5,
  "timeSpent": 1800,
  "status": "completed",
  "paymentStatus": "completed",
  "isFreeTest": true,
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

## Frontend Integration Points

### 1. Usage Hook
The `useRankingTestUsage` hook is already created and will call the `/api/ranking-tests/usage` endpoint.

### 2. Test Creation
The ranking tests page now supports:
- Premium users see their monthly free test count
- Free test button for eligible premium users
- Upgrade prompt for free users
- Automatic handling of free vs paid tests

### 3. Visual Indicators
- Premium benefits section showing remaining free tests
- Reset date display
- Different button styles for free vs paid tests

## Testing Scenarios

### 1. Premium User - First Free Test
- User should see "1 remaining" free test
- Free test button should be enabled
- After using free test, should show "0 remaining"

### 2. Premium User - Free Test Used
- User should see "0 remaining" free tests
- Free test button should be disabled
- Only paid test option available

### 3. Month Reset
- On first day of new month, free test count should reset to 1
- User should be able to use free test again

### 4. Free User
- Should not see premium benefits section
- Should see upgrade prompt
- Only paid test option available

## Security Considerations

1. **Server-side validation**: Always verify premium status on backend
2. **Usage tracking**: Prevent manipulation of free test counts
3. **Month reset**: Handle timezone considerations for month boundaries
4. **Payment bypass**: Ensure free tests don't bypass necessary validations

## Migration Script

```sql
-- Add new columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS ranking_test_usage_month VARCHAR(7);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ranking_test_free_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ranking_test_free_limit INTEGER DEFAULT 1;

ALTER TABLE ranking_tests ADD COLUMN IF NOT EXISTS is_free_test BOOLEAN DEFAULT FALSE;
ALTER TABLE ranking_tests ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- Update existing tests to have payment_status
UPDATE ranking_tests SET payment_status = 'completed' WHERE status = 'completed';
UPDATE ranking_tests SET payment_status = 'pending' WHERE status = 'pending_payment';
```

## Premium Status Detection & Updates

### Critical: User Plan Type Updates

When a user subscribes to premium, the backend MUST update the user's `planType` field:

```javascript
// In your subscription activation/payment success handler:
await db.user.update({
  where: { id: userId },
  data: {
    planType: 'premium', // or 'enterprise'
    // Reset ranking test usage for new premium users
    ranking_test_usage_month: new Date().toISOString().slice(0, 7),
    ranking_test_free_used: 0
  }
});
```

### API Endpoint Updates Required:

#### 1. GET /api/user
**Must return updated planType immediately after subscription:**
```json
{
  "id": "user123",
  "email": "user@example.com",
  "planType": "premium",  // This must be updated immediately
  "userType": "jobseeker"
}
```

#### 2. Subscription Webhook/Callback Handler
**When payment is successful, update user planType:**
```javascript
// PayPal/Stripe webhook handler
app.post('/api/webhooks/subscription-success', async (req, res) => {
  const { userId, subscriptionId, planType } = req.body;
  
  // Update user plan type
  await db.user.update({
    where: { id: userId },
    data: {
      planType: planType, // 'premium' or 'enterprise'
      ranking_test_usage_month: new Date().toISOString().slice(0, 7),
      ranking_test_free_used: 0
    }
  });
  
  // Update subscription record
  await db.subscription.create({
    data: {
      userId,
      subscriptionId,
      status: 'active',
      planType
    }
  });
  
  res.json({ success: true });
});
```

### Frontend Query Invalidation

The frontend automatically invalidates these queries after payment success:
- `/api/user` - Updates planType
- `/api/usage/report` - Updates usage limits  
- `/api/subscription/current` - Updates subscription status
- `/api/ranking-tests/usage` - Updates ranking test limits

### Real-time Premium Detection

The app detects premium status through:
1. **User planType**: `user.planType === 'premium' || user.planType === 'enterprise'`
2. **Subscription Status**: Active subscription in `/api/subscription/current`
3. **Usage Limits**: Premium limits in `/api/usage/report`

## Implementation Priority

1. **CRITICAL**: Update subscription success handler to set user `planType`
2. **High Priority**: Database schema updates and usage endpoint
3. **Medium Priority**: Test creation endpoint updates
4. **Low Priority**: History endpoint updates and additional features

## Testing Premium Status Updates

### Test Scenario:
1. User starts as free tier (`planType: null` or `planType: 'free'`)
2. User subscribes to premium
3. Payment webhook updates `planType: 'premium'`
4. Frontend queries are invalidated
5. User immediately sees premium features and free ranking test

### Verification Points:
- [ ] `/api/user` returns `planType: 'premium'`
- [ ] `/api/usage/report` shows `freeRankingTests: { limit: 1, used: 0 }`
- [ ] Ranking tests page shows free test button
- [ ] Usage widget shows premium benefits

The frontend is already implemented and ready to work with these backend changes.