
import { db } from './server/db';
import { oneTimePayments, testRetakePayments, testAssignments } from './shared/schema';
import { eq, sql } from 'drizzle-orm';

async function findAllRetakePayments() {
  try {
    console.log('🔍 Searching for ALL retake-related payments...\n');
    
    // Check one_time_payments table
    console.log('📋 Checking one_time_payments table...');
    const oneTimeRetakes = await db.select()
      .from(oneTimePayments)
      .where(eq(oneTimePayments.serviceType, 'test_retake'))
      .orderBy(sql`${oneTimePayments.createdAt} DESC`);
    
    console.log(`Found ${oneTimeRetakes.length} payments in one_time_payments`);
    if (oneTimeRetakes.length > 0) {
      console.table(oneTimeRetakes.map(p => ({
        id: p.id,
        userId: p.userId,
        serviceId: p.serviceId,
        amount: `$${p.amount / 100}`,
        status: p.status,
        createdAt: p.createdAt
      })));
    }
    
    // Check test_retake_payments table
    console.log('\n📋 Checking test_retake_payments table...');
    const retakePayments = await db.select()
      .from(testRetakePayments)
      .orderBy(sql`${testRetakePayments.createdAt} DESC`);
    
    console.log(`Found ${retakePayments.length} payments in test_retake_payments`);
    if (retakePayments.length > 0) {
      console.table(retakePayments.map(p => ({
        id: p.id,
        userId: p.userId,
        assignmentId: p.testAssignmentId,
        amount: `$${p.amount / 100}`,
        status: p.paymentStatus,
        provider: p.paymentProvider,
        createdAt: p.createdAt
      })));
    }
    
    // Check for assignments that might be stuck
    console.log('\n📋 Checking for completed tests with retake_payment_id but retake_allowed=false...');
    const stuckAssignments = await db.select()
      .from(testAssignments)
      .where(sql`${testAssignments.retakePaymentId} IS NOT NULL AND ${testAssignments.retakeAllowed} = false`)
      .orderBy(sql`${testAssignments.updatedAt} DESC`);
    
    console.log(`Found ${stuckAssignments.length} stuck assignments with payment but no retake access`);
    if (stuckAssignments.length > 0) {
      console.log('\n🚨 FOUND AFFECTED USERS:');
      console.table(stuckAssignments.map(a => ({
        id: a.id,
        userId: a.userId,
        status: a.status,
        score: a.score,
        retakePaymentId: a.retakePaymentId,
        retakeAllowed: a.retakeAllowed
      })));
      
      // Now fix them
      console.log('\n🔧 FIXING stuck assignments...');
      for (const assignment of stuckAssignments) {
        const result = await db.update(testAssignments)
          .set({
            retakeAllowed: true,
            status: 'assigned',
            score: null,
            answers: [],
            completionTime: null,
            warningCount: 0,
            tabSwitchCount: 0,
            copyAttempts: 0,
            terminationReason: null
          })
          .where(eq(testAssignments.id, assignment.id))
          .returning();
        
        if (result && result.length > 0) {
          console.log(`✅ Fixed assignment ${assignment.id} for user ${assignment.userId}`);
        }
      }
    }
    
    // Check PayPal payments that might not be in our tables
    console.log('\n📋 Checking for recent PayPal payments in one_time_payments...');
    const recentPayPal = await db.select()
      .from(oneTimePayments)
      .where(sql`${oneTimePayments.paymentProvider} = 'paypal' AND ${oneTimePayments.createdAt} > NOW() - INTERVAL '7 days'`)
      .orderBy(sql`${oneTimePayments.createdAt} DESC`);
    
    console.log(`Found ${recentPayPal.length} recent PayPal payments`);
    if (recentPayPal.length > 0) {
      console.table(recentPayPal.map(p => ({
        id: p.id,
        userId: p.userId,
        serviceType: p.serviceType,
        serviceId: p.serviceId,
        amount: `$${p.amount / 100}`,
        status: p.status,
        createdAt: p.createdAt
      })));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findAllRetakePayments();
