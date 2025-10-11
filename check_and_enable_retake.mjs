
import { db } from './server/db.js';
import { users, interviewInvitations, virtualInterviews, testAssignments, testRetakePayments, oneTimePayments } from './shared/schema.js';
import { eq, and } from 'drizzle-orm';

async function checkAndEnableRetake() {
  try {
    console.log('🔍 Checking retake status for a.adluri@gmail.com...\n');

    // Find user
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, 'a.adluri@gmail.com'))
      .limit(1);

    if (!user) {
      console.log('❌ User not found: a.adluri@gmail.com');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})\n`);

    // Check interview invitation
    const [invitation] = await db.select()
      .from(interviewInvitations)
      .where(eq(interviewInvitations.token, 'link_1760040400971_3d9hswhtz'))
      .limit(1);

    if (!invitation) {
      console.log('❌ Interview invitation not found: link_1760040400971_3d9hswhtz');
      process.exit(1);
    }

    console.log(`✅ Found interview invitation:`);
    console.log(`   - Type: ${invitation.interviewType}`);
    console.log(`   - Role: ${invitation.role}`);
    console.log(`   - Recruiter ID: ${invitation.recruiterId}\n`);

    // Check if user has any virtual interviews related to this
    const userInterviews = await db.select()
      .from(virtualInterviews)
      .where(eq(virtualInterviews.userId, user.id));

    console.log(`📊 User has ${userInterviews.length} virtual interview(s)\n`);

    if (userInterviews.length > 0) {
      console.log('Virtual Interviews:');
      userInterviews.forEach((interview, index) => {
        console.log(`\n${index + 1}. Interview ID: ${interview.id}`);
        console.log(`   - Session ID: ${interview.sessionId}`);
        console.log(`   - Status: ${interview.status}`);
        console.log(`   - Score: ${interview.overallScore}`);
        console.log(`   - Retake Count: ${interview.retakeCount}/${interview.maxRetakes}`);
        console.log(`   - Retake Allowed: Currently at ${interview.retakeCount} of ${interview.maxRetakes} max`);
      });
    }

    // Check for any test retake payments
    const retakePayments = await db.select()
      .from(oneTimePayments)
      .where(and(
        eq(oneTimePayments.userId, user.id),
        eq(oneTimePayments.serviceType, 'virtual_interview')
      ));

    console.log(`\n💰 Found ${retakePayments.length} virtual interview payment(s)`);
    
    if (retakePayments.length > 0) {
      console.log('\nPayment Details:');
      retakePayments.forEach((payment, index) => {
        console.log(`\n${index + 1}. Payment ID: ${payment.id}`);
        console.log(`   - Amount: $${payment.amount}`);
        console.log(`   - Status: ${payment.status}`);
        console.log(`   - Provider: ${payment.paymentProvider}`);
        console.log(`   - Created: ${payment.createdAt}`);
      });
    }

    // Check test assignments (if using test system)
    const testAssignmentsData = await db.select()
      .from(testAssignments)
      .where(eq(testAssignments.jobSeekerId, user.id));

    console.log(`\n📝 Found ${testAssignmentsData.length} test assignment(s)\n`);

    if (testAssignmentsData.length > 0) {
      console.log('Test Assignments:');
      testAssignmentsData.forEach((assignment, index) => {
        console.log(`\n${index + 1}. Assignment ID: ${assignment.id}`);
        console.log(`   - Status: ${assignment.status}`);
        console.log(`   - Score: ${assignment.score}`);
        console.log(`   - Retake Allowed: ${assignment.retakeAllowed}`);
        console.log(`   - Retake Payment ID: ${assignment.retakePaymentId}`);
      });
    }

    // Enable retake for all completed interviews with low scores
    let updatedCount = 0;
    
    for (const interview of userInterviews) {
      if (interview.status === 'completed' && 
          (interview.overallScore < 70 || interview.overallScore === null) &&
          interview.retakeCount < interview.maxRetakes) {
        
        // Allow one more retake
        const [updated] = await db.update(virtualInterviews)
          .set({
            maxRetakes: (interview.maxRetakes || 2) + 1,
            updatedAt: new Date()
          })
          .where(eq(virtualInterviews.id, interview.id))
          .returning();

        if (updated) {
          console.log(`\n✅ ENABLED RETAKE for Interview ID ${interview.id}`);
          console.log(`   - Previous max retakes: ${interview.maxRetakes}`);
          console.log(`   - New max retakes: ${updated.maxRetakes}`);
          console.log(`   - User can now retake this interview`);
          updatedCount++;
        }
      }
    }

    console.log('\n════════════════════════════════════════════════════════════');
    console.log(`\n📊 SUMMARY:`);
    console.log(`User: ${user.email}`);
    console.log(`Interview Link: link_1760040400971_3d9hswhtz`);
    console.log(`Total Interviews: ${userInterviews.length}`);
    console.log(`Retakes Enabled: ${updatedCount}`);
    console.log(`\n✅ All eligible interviews now have retake enabled!\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAndEnableRetake();
