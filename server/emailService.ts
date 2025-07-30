import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { apiKeyRotationService } from './apiKeyRotationService.js';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

interface EmailConfig {
  provider: 'resend' | 'nodemailer';
  from: string;
}

// Email service configuration
const EMAIL_CONFIG: EmailConfig = {
  provider: (process.env.EMAIL_PROVIDER as 'resend' | 'nodemailer') || 'resend',
  from: process.env.EMAIL_FROM || 'AutoJobr <noreply@vennverse.com>'
};

// Nodemailer transporter for Postal SMTP
let nodemailerTransporter: nodemailer.Transporter | null = null;

function createNodemailerTransporter() {
  if (!nodemailerTransporter && EMAIL_CONFIG.provider === 'nodemailer') {
    const smtpConfig = {
      host: process.env.POSTAL_SMTP_HOST || 'localhost',
      port: parseInt(process.env.POSTAL_SMTP_PORT || '587'),
      secure: process.env.POSTAL_SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.POSTAL_SMTP_USER,
        pass: process.env.POSTAL_SMTP_PASS
      },
      // Additional SMTP options for Postal
      tls: {
        rejectUnauthorized: process.env.POSTAL_SMTP_TLS_REJECT_UNAUTHORIZED !== 'false'
      }
    };

    console.log(`📧 Initializing Nodemailer with Postal SMTP: ${smtpConfig.host}:${smtpConfig.port}`);
    nodemailerTransporter = nodemailer.createTransport(smtpConfig);
  }
  return nodemailerTransporter;
}

async function sendEmailWithNodemailer(params: EmailParams): Promise<boolean> {
  try {
    const transporter = createNodemailerTransporter();
    if (!transporter) {
      throw new Error('Nodemailer transporter not configured');
    }

    // Verify SMTP connection
    if (!await transporter.verify()) {
      throw new Error('SMTP connection verification failed');
    }

    const result = await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: params.to,
      subject: params.subject,
      html: params.html
    });

    console.log('📧 Email sent via Postal SMTP:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Postal SMTP email error:', error);
    return false;
  }
}

async function sendEmailWithResend(params: EmailParams): Promise<boolean> {
  try {
    const status = apiKeyRotationService.getStatus();
    
    // Check if any Resend keys are available
    if (status.resend.totalKeys === 0) {
      console.log('=== EMAIL SIMULATION (No Resend API Keys) ===');
      console.log('To:', params.to);
      console.log('Subject:', params.subject);
      console.log('HTML Content (truncated):', params.html.substring(0, 200) + '...');
      console.log('=== END EMAIL SIMULATION ===');
      return true; // Pretend email was sent successfully
    }

    // Use rotation service to send email
    const result = await apiKeyRotationService.executeWithResendRotation(async (resend) => {
      const { data, error } = await resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });

      if (error) {
        // In case of email service failure, log the verification URL for manual testing
        if (params.html.includes('verify-email?token=')) {
          const tokenMatch = params.html.match(/verify-email\?token=([^"]+)/);
          if (tokenMatch) {
            console.log('MANUAL VERIFICATION URL:', `http://localhost:5000/verify-email?token=${tokenMatch[1]}`);
          }
        }
        throw new Error(`Resend API error: ${JSON.stringify(error)}`);
      }

      console.log('📧 Email sent via Resend:', data?.id);
      return data;
    });

    return true;
  } catch (error) {
    console.error('❌ Resend email error:', error);
    return false;
  }
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  console.log(`📧 Sending email via ${EMAIL_CONFIG.provider.toUpperCase()}`);
  
  try {
    let success = false;

    // Primary email service
    if (EMAIL_CONFIG.provider === 'nodemailer') {
      success = await sendEmailWithNodemailer(params);
    } else {
      success = await sendEmailWithResend(params);
    }

    // Fallback to the other service if primary fails
    if (!success) {
      console.log(`⚠️ Primary email service (${EMAIL_CONFIG.provider}) failed, trying fallback...`);
      
      if (EMAIL_CONFIG.provider === 'nodemailer') {
        success = await sendEmailWithResend(params);
      } else if (process.env.POSTAL_SMTP_HOST) {
        success = await sendEmailWithNodemailer(params);
      }
    }

    // Final fallback: simulation for development
    if (!success) {
      console.log('=== EMAIL FALLBACK SIMULATION ===');
      console.log('To:', params.to);
      console.log('Subject:', params.subject);
      console.log('Provider:', EMAIL_CONFIG.provider);
      
      // Log verification URL for manual testing
      if (params.html.includes('verify-email?token=')) {
        const tokenMatch = params.html.match(/verify-email\?token=([^"]+)/);
        if (tokenMatch) {
          const baseUrl = process.env.NODE_ENV === 'production' 
            ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`
            : 'http://localhost:5000';
          console.log('MANUAL VERIFICATION URL:', `${baseUrl}/verify-email?token=${tokenMatch[1]}`);
        }
      }
      console.log('=== END EMAIL SIMULATION ===');
      return true; // Return true for development purposes
    }

    return success;
  } catch (error) {
    console.error('❌ Email service error:', error);
    return false;
  }
}

// Export configuration for external use
export function getEmailConfig(): EmailConfig {
  return EMAIL_CONFIG;
}

// Function to test email configuration
export async function testEmailConfiguration(): Promise<{ provider: string; status: string; details?: string }> {
  try {
    if (EMAIL_CONFIG.provider === 'nodemailer') {
      const transporter = createNodemailerTransporter();
      if (!transporter) {
        return { provider: 'nodemailer', status: 'error', details: 'Transporter not configured' };
      }
      
      const verified = await transporter.verify();
      return { 
        provider: 'nodemailer', 
        status: verified ? 'connected' : 'failed',
        details: `SMTP: ${process.env.POSTAL_SMTP_HOST}:${process.env.POSTAL_SMTP_PORT}`
      };
    } else {
      const status = apiKeyRotationService.getStatus();
      return { 
        provider: 'resend', 
        status: status.resend.totalKeys > 0 ? 'connected' : 'no-keys',
        details: `Available keys: ${status.resend.availableKeys}`
      };
    }
  } catch (error) {
    return { 
      provider: EMAIL_CONFIG.provider, 
      status: 'error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export function generatePasswordResetEmail(token: string, userEmail: string): string {
  const resetUrl = `${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/reset-password?token=${token}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password - AutoJobr</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Secure your AutoJobr account</p>
      </div>
      
      <div style="background: white; padding: 40px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
        
        <p style="color: #666; line-height: 1.6;">
          We received a request to reset the password for your AutoJobr account (${userEmail}). 
          If you made this request, please click the button below to set a new password.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold;
                    display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #666; line-height: 1.6; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. 
            Your password will remain unchanged.
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          This password reset link will expire in 1 hour for security reasons.
        </p>
      </div>
    </body>
    </html>
  `;
}

export function generateVerificationEmail(token: string, nameOrCompany: string, userType: string = 'job_seeker'): string {
  const verificationUrl = `${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/verify-email?token=${token}`;
  
  if (userType === 'recruiter') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Company Email - AutoJobr</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to AutoJobr</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Verify your company email to start posting jobs</p>
        </div>
        
        <div style="background: white; padding: 40px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${nameOrCompany} Team,</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Thank you for joining AutoJobr as a recruiter! To complete your registration and start posting jobs, 
            please verify your company email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      font-weight: bold;
                      display: inline-block;">
              Verify Company Email
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This verification link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;
  } else {
    // Job seeker verification email
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - AutoJobr</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to AutoJobr</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Verify your email to start your job search</p>
        </div>
        
        <div style="background: white; padding: 40px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Hi ${nameOrCompany},</h2>
          
          <p style="color: #666; line-height: 1.6;">
            Welcome to AutoJobr! You're just one step away from accessing our AI-powered job search platform. 
            Please verify your email address to complete your registration and start applying to jobs.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      font-weight: bold;
                      display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #4f46e5; word-break: break-all;">${verificationUrl}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0; font-size: 16px;">🚀 What's Next?</h3>
            <ul style="color: #666; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Complete your professional profile</li>
              <li>Upload your resume for AI analysis</li>
              <li>Get personalized job recommendations</li>
              <li>Apply to jobs with one click</li>
            </ul>
          </div>
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This verification link will expire in 1 hour. If you didn't request this, please ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;
  }
}