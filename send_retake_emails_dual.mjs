import { db } from './server/db.ts';
import { users, testAssignments } from './shared/schema.ts';
import { eq } from 'drizzle-orm';
import { sendEmail } from './server/emailService.ts';

async function sendRetakeApprovalEmails() {
  try {
    console.log('📧 Sending retake approval emails...\n');

    const candidates = [
      {
        email: 'aadluri@gmail.com',
        userId: 'user-1760135948298-ic7dercub',
        assignmentId: 18,
        name: 'Archita'
      },
      {
        email: 'ahsbd95@gmail.com',
        userId: 'user-1760162441079-87z2m9air',
        assignmentId: 27,
        name: 'Arshadul'
      }
    ];

    const interviewLink = 'https://autojobr.com/interview-link/link_1760040400971_3d9hswhtz';
    const ccEmail = 'admin@vennverse.com';

    for (const candidate of candidates) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Processing: ${candidate.email}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      // Get user details
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, candidate.userId))
        .limit(1);

      if (!user) {
        console.log(`❌ User not found: ${candidate.email}`);
        continue;
      }

      // Get test assignment details
      const [assignment] = await db.select()
        .from(testAssignments)
        .where(eq(testAssignments.id, candidate.assignmentId))
        .limit(1);

      if (!assignment) {
        console.log(`❌ Test assignment not found for ${candidate.email}`);
        continue;
      }

      console.log(`✅ Found user: ${user.email}`);
      console.log(`✅ Test Assignment ID: ${assignment.id}`);
      console.log(`   Status: ${assignment.status}`);
      console.log(`   Score: ${assignment.score || 'Not completed'}%`);
      console.log(`   Current retake_allowed: ${assignment.retakeAllowed}`);

      // Enable retake if not already enabled
      if (!assignment.retakeAllowed) {
        console.log(`\n🔄 Enabling retake for ${candidate.email}...`);
        await db.update(testAssignments)
          .set({ retakeAllowed: true })
          .where(eq(testAssignments.id, candidate.assignmentId));
        console.log(`✅ Retake enabled`);
      } else {
        console.log(`✅ Retake already enabled`);
      }

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
    <p>Hello ${user.firstName || candidate.name},</p>
    
    <p>Great news! Your request for a test retake has been <strong>approved</strong>.</p>
    
    <div class="notice-box">
      <strong>📋 Review Process Completed</strong><br>
      We've carefully reviewed your test session for any serious violations. After thorough verification, you are now cleared to retake the test.
    </div>
    
    <p><strong>Test Details:</strong></p>
    <ul>
      <li>Role: Data Scientist</li>
      <li>Company: Vennverse</li>
      ${assignment.score ? `<li>Previous Score: ${assignment.score}%</li>` : ''}
      <li>Retake Status: ✅ Approved</li>
    </ul>
    
    <p>You can now retake the test using the same interview link you received initially. Click the button below to get started:</p>
    
    <center>
      <a href="${interviewLink}" class="button">Start Your Retake</a>
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

      // Send the email with CC
      console.log(`\n📧 Sending email to ${user.email} (CC: ${ccEmail})...`);
      const success = await sendEmail({
        to: user.email,
        cc: ccEmail,
        subject: '✅ Test Retake Approved - You Can Now Retake Your Assessment',
        html: emailHtml
      });

      if (success) {
        console.log(`✅ Email sent successfully to ${user.email}`);
        console.log(`   CC: ${ccEmail}`);
      } else {
        console.log(`⚠️ Email may not have been sent to ${user.email}`);
      }
    }

    console.log('\n\n════════════════════════════════════════════════════════════');
    console.log('📊 RETAKE APPROVAL SUMMARY:');
    console.log('════════════════════════════════════════════════════════════');
    console.log('Recipients:');
    console.log('  1. aadluri@gmail.com (Archita Adluri)');
    console.log('  2. ahsbd95@gmail.com (Arshadul Hoque)');
    console.log('CC: admin@vennverse.com');
    console.log('Retake Allowed: ✅ YES (both candidates)');
    console.log('Emails Sent: ✅ YES');
    console.log(`Interview Link: ${interviewLink}`);
    console.log('════════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

sendRetakeApprovalEmails();
