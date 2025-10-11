
import { db } from './server/db.ts';
import { oneTimePayments, testAssignments } from './shared/schema.ts';
import { eq, and, sql } from 'drizzle-orm';

async function fixRetakePayments() {
  try {
    console.log('🔍 Finding users affected by retake payment bug...\n');
    
    // Get all test_retake payments
    const retakePayments = await db.select()
      .from(oneTimePayments)
      .where(eq(oneTimePayments.serviceType, 'test_retake'))
      .orderBy(sql`${oneTimePayments.createdAt} DESC`);
    
    console.log(`📊 Found ${retakePayments.length} test retake payments\n`);
    
    const affectedUsers = [];
    const fixedUsers = [];
    
    for (const payment of retakePayments) {
      console.log('─'.repeat(60));
      console.log(`💳 Payment ID: ${payment.id}`);
      console.log(`👤 User: ${payment.userId}`);
      console.log(`📝 Assignment ID: ${payment.serviceId}`);
      console.log(`💰 Amount: $${payment.amount / 100} ${payment.currency}`);
      console.log(`✅ Status: ${payment.status}`);
      
      if (!payment.serviceId) {
        console.log('⚠️  WARNING: No serviceId - cannot fix this payment');
        affectedUsers.push({
          paymentId: payment.id,
          userId: payment.userId,
          issue: 'Missing serviceId',
          canFix: false
        });
        continue;
      }
      
      // Check assignment status
      const assignment = await db.select()
        .from(testAssignments)
        .where(eq(testAssignments.id, parseInt(payment.serviceId)))
        .then(rows => rows[0]);
      
      if (!assignment) {
        console.log('❌ Assignment not found - invalid serviceId');
        affectedUsers.push({
          paymentId: payment.id,
          userId: payment.userId,
          serviceId: payment.serviceId,
          issue: 'Assignment not found',
          canFix: false
        });
        continue;
      }
      
      console.log(`📋 Assignment Status: ${assignment.status}`);
      console.log(`🔄 Retake Allowed: ${assignment.retakeAllowed}`);
      
      // Check if user paid but retake is NOT allowed
      if (payment.status === 'completed' && !assignment.retakeAllowed) {
        console.log('🚨 BUG DETECTED: Payment completed but retake NOT enabled!');
        console.log('🔧 Attempting to fix...');
        
        // Fix the assignment
        const result = await db.update(testAssignments)
          .set({
            retakeAllowed: true,
            status: 'assigned', // Reset to assigned
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
          console.log('✅ FIXED: Retake enabled for user');
          fixedUsers.push({
            paymentId: payment.id,
            userId: payment.userId,
            serviceId: payment.serviceId,
            assignmentId: assignment.id,
            fixed: true
          });
        } else {
          console.log('❌ FAILED to fix');
          affectedUsers.push({
            paymentId: payment.id,
            userId: payment.userId,
            serviceId: payment.serviceId,
            issue: 'Update failed',
            canFix: false
          });
        }
      } else {
        console.log('✓ No fix needed - retake already enabled or payment pending');
      }
      
      console.log('');
    }
    
    console.log('═'.repeat(60));
    console.log('\n📊 SUMMARY:');
    console.log(`Total payments checked: ${retakePayments.length}`);
    console.log(`Affected users: ${affectedUsers.length}`);
    console.log(`Fixed users: ${fixedUsers.length}`);
    
    if (affectedUsers.length > 0) {
      console.log('\n⚠️  AFFECTED USERS (Need manual review):');
      console.table(affectedUsers);
    }
    
    if (fixedUsers.length > 0) {
      console.log('\n✅ FIXED USERS:');
      console.table(fixedUsers);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixRetakePayments();
