
import { db } from './server/db.js';
import { oneTimePayments, testAssignments } from './shared/schema.js';
import { eq, and } from 'drizzle-orm';

async function fixStuckRetakePayments() {
  try {
    console.log('🔍 Finding stuck retake payments...\n');
    
    // Get all completed test_retake payments
    const payments = await db.select()
      .from(oneTimePayments)
      .where(and(
        eq(oneTimePayments.serviceType, 'test_retake'),
        eq(oneTimePayments.status, 'completed')
      ));
    
    console.log(`📊 Found ${payments.length} completed retake payments\n`);
    
    let fixedCount = 0;
    
    for (const payment of payments) {
      if (!payment.serviceId) {
        console.log(`⚠️  Skipping payment ${payment.id} - no serviceId`);
        continue;
      }
      
      const assignmentId = parseInt(payment.serviceId);
      
      // Check assignment status
      const [assignment] = await db.select()
        .from(testAssignments)
        .where(eq(testAssignments.id, assignmentId));
      
      if (!assignment) {
        console.log(`❌ Assignment ${assignmentId} not found for payment ${payment.id}`);
        continue;
      }
      
      if (assignment.retakeAllowed) {
        console.log(`✅ Assignment ${assignmentId} already has retake access`);
        continue;
      }
      
      // STUCK PAYMENT FOUND - FIX IT
      console.log(`🔧 FIXING stuck payment for assignment ${assignmentId}`);
      console.log(`   User: ${payment.userId}`);
      console.log(`   Payment: $${payment.amount}`);
      console.log(`   PayPal Order: ${payment.paymentId}`);
      
      await db.update(testAssignments)
        .set({
          retakeAllowed: true,
          status: 'assigned',
          retakePaymentId: payment.paymentId,
          score: null,
          answers: [],
          completionTime: null,
          warningCount: 0,
          tabSwitchCount: 0,
          copyAttempts: 0,
          terminationReason: null,
          updatedAt: new Date()
        })
        .where(eq(testAssignments.id, assignmentId));
      
      console.log(`✅ FIXED assignment ${assignmentId} - retake access granted!\n`);
      fixedCount++;
    }
    
    console.log('\n════════════════════════════════════════════════════════════\n');
    console.log(`📊 SUMMARY:`);
    console.log(`Total payments checked: ${payments.length}`);
    console.log(`Stuck payments fixed: ${fixedCount}`);
    console.log('\n✅ All stuck payments have been fixed!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixStuckRetakePayments();
