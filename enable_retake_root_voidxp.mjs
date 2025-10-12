import { db } from './server/db.ts';
import { users, testAssignments } from './shared/schema.ts';
import { eq } from 'drizzle-orm';
import { sendEmail } from './server/emailService.ts';

async function enableRetakeForRootVoidxp() {
  try {
    console.log('📧 Processing retake approval for root@voidxp.com...\n');

    const userEmail = 'root@voidxp.com';
    const userId = 'user-1760157350478-achs9gzk1';
    const assignmentId = 25;
    const interviewLink = 'https://autojobr.com/interview-link/link_1760040400971_3d9hswhtz';
    const ccEmail = 'admin@vennverse.com';

    // Get user details
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   User Type: ${user.userType}`);

    // Get test assignment details
    const [assignment] = await db.select()
      .from(testAssignments)
      .where(eq(testAssignments.id, assignmentId))
      .limit(1);

    if (!assignment) {
      console.log('❌ Test assignment not found');
      process.exit(1);
    }

    console.log(`✅ Test Assignment ID: ${assignment.id}`);
    console.log(`   Status: ${assignment.status}`);
    console.log(`   Current retake_allowed: ${assignment.retakeAllowed}`);

    // Enable retake
    if (!assignment.retakeAllowed) {
      console.log(`\n🔄 Enabling retake...`);
      await db.update(testAssignments)
        .set({ retakeAllowed: true })
        .where(eq(testAssignments.id, assignmentId));
      console.log(`✅ Retake enabled`);
    } else {
      console.log(`✅ Retake already enabled`);
    }

    // Create email content with warning about developer tools
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .content {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .notice-box {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-box {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .danger-box {
      background: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Test Retake Approved</h1>
  </div>
  <div class="content">
    <p>Hello ${user.firstName || 'there'},</p>
    
    <p>Your request for a test retake has been <strong>approved</strong>.</p>
    
    <div class="notice-box">
      <strong>📋 Review Process Completed</strong><br>
      We've reviewed your test session. You are now cleared to retake the test.
    </div>

    <div class="danger-box">
      <strong>⚠️ IMPORTANT: Test Integrity Requirements</strong><br><br>
      To ensure fair testing, you MUST follow these rules:
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li><strong>DO NOT use browser developer tools</strong> (F12, Inspect Element, Console)</li>
        <li><strong>DO NOT use any browser extensions</strong> that might interfere with the test</li>
        <li><strong>DO NOT attempt to manipulate the test interface</strong> in any way</li>
        <li><strong>DO NOT open multiple tabs or windows</strong> during the test</li>
      </ul>
      <strong style="color: #dc3545;">Any violations will result in immediate test termination and permanent disqualification.</strong>
    </div>

    <div class="warning-box">
      <strong>🔒 Recommended: Use Incognito/Private Browsing Mode</strong><br>
      We strongly recommend taking the test in an incognito or private browsing window. This ensures:
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>No browser extensions interfere with the test</li>
        <li>Clean session without cached data</li>
        <li>Better test integrity</li>
      </ul>
      <strong>To open incognito mode:</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Chrome/Edge: Press Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)</li>
        <li>Firefox: Press Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)</li>
        <li>Safari: File → New Private Window</li>
      </ul>
    </div>
    
    <p><strong>Test Details:</strong></p>
    <ul>
      <li>Role: Data Scientist</li>
      <li>Company: Vennverse</li>
      <li>Retake Status: ✅ Approved</li>
    </ul>
    
    <p>Click the button below to start your test retake:</p>
    
    <center>
      <a href="${interviewLink}" class="button">Start Your Retake</a>
    </center>
    
    <p><strong>Additional Requirements:</strong></p>
    <ul>
      <li>Ensure you have a stable internet connection</li>
      <li>Find a quiet environment with good lighting</li>
      <li>Have your webcam and microphone ready</li>
      <li>Complete the test in one session</li>
      <li>Do not refresh the page during the test</li>
    </ul>
    
    <p>Please take this retake seriously and follow all guidelines. Good luck!</p>
    
    <p>Best regards,<br>
    <strong>AutoJobr Team</strong></p>
  </div>
  <div class="footer">
    <p>This is an automated email from AutoJobr. If you have any questions, please contact support.</p>
  </div>
</body>
</html>
    `;

    // Send the email with CC
    console.log(`\n📧 Sending email to ${user.email} (CC: ${ccEmail})...`);
    const success = await sendEmail({
      to: user.email,
      cc: ccEmail,
      subject: '✅ Test Retake Approved - IMPORTANT: Read Test Rules Carefully',
      html: emailHtml
    });

    if (success) {
      console.log(`✅ Email sent successfully to ${user.email}`);
      console.log(`   CC: ${ccEmail}`);
    } else {
      console.log(`⚠️ Email may not have been sent`);
    }

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('📊 RETAKE APPROVAL SUMMARY:');
    console.log('════════════════════════════════════════════════════════════');
    console.log(`Recipient: ${user.email}`);
    console.log(`CC: ${ccEmail}`);
    console.log(`User Type: ${user.userType} (already job_seeker)`);
    console.log('Retake Allowed: ✅ YES');
    console.log('Email Sent: ✅ YES (with developer tools warning)');
    console.log(`Interview Link: ${interviewLink}`);
    console.log('════════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

enableRetakeForRootVoidxp();
