
import { db } from './server/db.js';
import { testAssignments, users } from './shared/schema.js';
import { eq, or, like, isNotNull } from 'drizzle-orm';

async function getTerminatedTests() {
  try {
    console.log('🔍 Fetching all tests terminated due to violations...\n');

    // Query for tests that were terminated or have violation-related termination reasons
    const terminatedTests = await db
      .select({
        id: testAssignments.id,
        jobSeekerId: testAssignments.jobSeekerId,
        testTemplateId: testAssignments.testTemplateId,
        status: testAssignments.status,
        terminationReason: testAssignments.terminationReason,
        score: testAssignments.score,
        startedAt: testAssignments.startedAt,
        completedAt: testAssignments.completedAt,
        assignedAt: testAssignments.assignedAt,
        dueDate: testAssignments.dueDate,
        username: users.username,
        email: users.email,
        fullName: users.fullName
      })
      .from(testAssignments)
      .leftJoin(users, eq(testAssignments.jobSeekerId, users.id))
      .where(
        or(
          eq(testAssignments.status, 'terminated'),
          isNotNull(testAssignments.terminationReason)
        )
      );

    if (terminatedTests.length === 0) {
      console.log('✅ No tests found that were terminated due to violations.');
      process.exit(0);
      return;
    }

    console.log(`📊 Found ${terminatedTests.length} test(s) terminated due to violations:\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    terminatedTests.forEach((test, index) => {
      console.log(`${index + 1}. TEST ID: ${test.id}`);
      console.log(`   Username: ${test.username || 'N/A'}`);
      console.log(`   Email: ${test.email || 'N/A'}`);
      console.log(`   Full Name: ${test.fullName || 'N/A'}`);
      console.log(`   Job Seeker ID: ${test.jobSeekerId}`);
      console.log(`   Test Template ID: ${test.testTemplateId}`);
      console.log(`   Status: ${test.status}`);
      console.log(`   Termination Reason: ${test.terminationReason || 'Not specified'}`);
      console.log(`   Score: ${test.score !== null ? test.score + '%' : 'N/A'}`);
      console.log(`   Started At: ${test.startedAt || 'Not started'}`);
      console.log(`   Completed At: ${test.completedAt || 'Not completed'}`);
      console.log(`   Assigned At: ${test.assignedAt}`);
      console.log(`   Due Date: ${test.dueDate}`);
      console.log('   ───────────────────────────────────────────────────────────\n');
    });

    // Summary statistics
    const totalTerminated = terminatedTests.length;
    const withReasons = terminatedTests.filter(t => t.terminationReason).length;
    const withScores = terminatedTests.filter(t => t.score !== null).length;

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📈 SUMMARY:');
    console.log(`   Total terminated tests: ${totalTerminated}`);
    console.log(`   With termination reason: ${withReasons}`);
    console.log(`   With scores recorded: ${withScores}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Group by termination reason
    const reasonGroups = {};
    terminatedTests.forEach(test => {
      const reason = test.terminationReason || 'Unknown';
      if (!reasonGroups[reason]) {
        reasonGroups[reason] = [];
      }
      reasonGroups[reason].push(test);
    });

    console.log('📋 GROUPED BY TERMINATION REASON:');
    Object.entries(reasonGroups).forEach(([reason, tests]) => {
      console.log(`\n   ${reason}: ${tests.length} test(s)`);
      tests.forEach(test => {
        const userInfo = test.username || test.email || test.jobSeekerId;
        console.log(`      - Test ID ${test.id} (User: ${userInfo})`);
      });
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching terminated tests:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

getTerminatedTests();
