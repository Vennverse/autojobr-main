import { db } from './server/db.ts';
import { users, testAssignments } from './shared/schema.ts';
import { eq } from 'drizzle-orm';
import { sendEmail } from './server/emailService.ts';

async function sendRetakeApprovalEmail() {
  try {
    console.log('📧 Sending retake approval email to aadluri@gmail.com...\n');

    // Get user details
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, 'aadluri@gmail.com'))
      .limit(1);

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    // Get test assignment details
    const [assignment] = await db.select()
      .from(testAssignments)
      .where(eq(testAssignments.id, 18))
      .limit(1);

    if (!assignment) {
      console.log('❌ Test assignment not found');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.email}`);
    console.log(`✅ Found test assignment: ID ${assignment.id}, Score: ${assignment.score}\n`);

    // Create email content
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
    
    <p>Great news! Your request for a test retake has been <strong>approved</strong>.</p>
    
    <div class="notice-box">
      <strong>📋 Review Process Completed</strong><br>
      We've carefully reviewed your test session for any serious violations. After thorough verification, you are now cleared to retake the test.
    </div>
    
    <p><strong>Test Details:</strong></p>
    <ul>
      <li>Previous Score: ${assignment.score}%</li>
      <li>Retake Status: ✅ Approved</li>
      <li>Interview Link: https://autojobr.com/interview-link/link_1760040400971_3d9hswhtz</li>
    </ul>
    
    <p>You can now retake the test using the same interview link you received initially. Click the button below to get started:</p>
    
    <center>
      <a href="https://autojobr.com/interview-link/link_1760040400971_3d9hswhtz" class="button">Start Your Retake</a>
    </center>
    
    <p><strong>Important Notes:</strong></p>
    <ul>
      <li>Please ensure you have a stable internet connection</li>
      <li>Find a quiet environment with good lighting</li>
      <li>Have your webcam and microphone ready</li>
      <li>Complete the test in one session</li>
    </ul>
    
    <p>We appreciate your patience during the review process. Good luck on your retake!</p>
    
    <p>Best regards,<br>
    <strong>AutoJobr Team</strong></p>
  </div>
  <div class="footer">
    <p>This is an automated email from AutoJobr. If you have any questions, please contact support.</p>
  </div>
</body>
</html>
    `;

    // Send the email
    const success = await sendEmail({
      to: user.email,
      subject: '✅ Test Retake Approved - You Can Now Retake Your Assessment',
      html: emailHtml
    });

    if (success) {
      console.log('✅ Email sent successfully to', user.email);
      console.log('\n════════════════════════════════════════════════════════════');
      console.log('📊 RETAKE APPROVAL SUMMARY:');
      console.log('User: aadluri@gmail.com');
      console.log('Test Assignment ID: 18');
      console.log('Retake Allowed: ✅ YES');
      console.log('Email Sent: ✅ YES');
      console.log('Interview Link: https://autojobr.com/interview-link/link_1760040400971_3d9hswhtz');
      console.log('════════════════════════════════════════════════════════════\n');
    } else {
      console.log('⚠️ Email may not have been sent (check email service logs above)');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

sendRetakeApprovalEmail();
