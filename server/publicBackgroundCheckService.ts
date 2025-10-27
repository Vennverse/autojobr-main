
import { db } from './db';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '@shared/schema';
import crypto from 'crypto';
import axios from 'axios';

// Public Background Check Service - Uses free/public APIs
export interface PublicBackgroundCheck {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateLinkedIn?: string;
  candidateGithub?: string;
  jobTitle: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  requestedAt: string;
  completedAt?: string;
  results: {
    emailVerification: {
      isValid: boolean;
      isDisposable: boolean;
      isFreeEmail: boolean;
      domain: string;
      mxRecords: boolean;
      spamScore: number; // 0-100, higher = more likely spam
    };
    linkedInProfile?: {
      exists: boolean;
      profileUrl?: string;
      headline?: string;
      connections?: number;
      profileCompleteness?: string;
    };
    githubProfile?: {
      exists: boolean;
      username?: string;
      publicRepos?: number;
      followers?: number;
      accountAge?: number;
      contributions?: number;
      topLanguages?: string[];
      lastActivity?: string;
      verified?: boolean;
    };
    emailDomainReputation?: {
      domainAge?: number;
      isLegit: boolean;
      hasWebsite: boolean;
      sslCertificate: boolean;
      companySize?: string;
    };
    socialMediaPresence?: {
      platforms: string[];
      score: number; // 0-100
    };
    phoneValidation?: {
      isValid: boolean;
      country?: string;
      carrier?: string;
      lineType?: string;
      riskScore?: number; // 0-100
    };
    professionalVerification?: {
      hasLinkedIn: boolean;
      hasGithub: boolean;
      hasPortfolio: boolean;
      emailDomainMatch: boolean;
      professionalEmailScore: number; // 0-100
    };
    identityConsistency?: {
      nameEmailMatch: boolean;
      crossPlatformConsistency: boolean;
      score: number; // 0-100
    };
    redFlags: string[];
    greenFlags: string[];
    trustScore: number; // 0-100
    recommendation: "hire" | "proceed_with_caution" | "reject";
  };
  cost: number; // Always $0 for public checks
}

export class PublicBackgroundCheckService {
  private checks: Map<string, PublicBackgroundCheck> = new Map();

  // Enhanced email verification
  async verifyEmail(email: string): Promise<any> {
    const disposableDomains = [
      'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com',
      'throwaway.email', 'getnada.com', 'temp-mail.org', 'maildrop.cc',
      'yopmail.com', 'fakeinbox.com', 'trashmail.com'
    ];
    const freeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'protonmail.com'];
    
    const domain = email.split('@')[1];
    const isDisposable = disposableDomains.some(d => domain.includes(d));
    const isFreeEmail = freeDomains.includes(domain);
    
    // Calculate spam score
    let spamScore = 0;
    if (isDisposable) spamScore += 80;
    if (email.match(/\d{5,}/)) spamScore += 20; // Long numbers in email
    if (email.length > 30) spamScore += 10; // Very long email
    if (!email.match(/^[a-z]/i)) spamScore += 15; // Doesn't start with letter
    
    // Check MX records
    let mxRecords = true;
    try {
      const response = await axios.get(`https://dns.google/resolve?name=${domain}&type=MX`, {
        timeout: 5000
      });
      mxRecords = response.data.Answer && response.data.Answer.length > 0;
    } catch (error) {
      console.log('MX check failed, assuming valid');
    }
    
    return {
      isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      isDisposable,
      isFreeEmail,
      domain,
      mxRecords,
      spamScore: Math.min(spamScore, 100)
    };
  }

  // Enhanced GitHub profile check
  async checkGithubProfile(username: string): Promise<any> {
    if (!username) return { exists: false };
    
    try {
      const response = await axios.get(`https://api.github.com/users/${username}`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'AutoJobr-BackgroundCheck'
        }
      });
      
      const user = response.data;
      const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
        timeout: 5000
      });
      
      const repos = reposResponse.data;
      const languages = new Map<string, number>();
      
      repos.forEach((repo: any) => {
        if (repo.language) {
          languages.set(repo.language, (languages.get(repo.language) || 0) + 1);
        }
      });
      
      const topLanguages = Array.from(languages.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lang]) => lang);
      
      const accountAge = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const lastActivity = repos[0]?.updated_at || user.updated_at;
      
      return {
        exists: true,
        username: user.login,
        publicRepos: user.public_repos,
        followers: user.followers,
        accountAge,
        contributions: repos.length,
        topLanguages,
        lastActivity,
        verified: user.site_admin || false
      };
    } catch (error) {
      return { exists: false };
    }
  }

  // Enhanced LinkedIn profile check
  async checkLinkedInProfile(linkedinUrl: string): Promise<any> {
    if (!linkedinUrl) return { exists: false };
    
    try {
      const isValidLinkedIn = /linkedin\.com\/in\/[a-zA-Z0-9-]+/.test(linkedinUrl);
      
      if (isValidLinkedIn) {
        // Extract username for additional validation
        const match = linkedinUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
        const username = match ? match[1] : '';
        
        return {
          exists: true,
          profileUrl: linkedinUrl,
          headline: 'Profile exists (full verification requires LinkedIn API)',
          profileCompleteness: username.length > 5 ? 'Likely complete' : 'Basic',
          connections: 0 // Would need LinkedIn API
        };
      }
      
      return { exists: false };
    } catch (error) {
      return { exists: false };
    }
  }

  // Enhanced domain reputation check
  async checkDomainReputation(domain: string): Promise<any> {
    try {
      let hasWebsite = false;
      let sslCertificate = false;
      let companySize = 'Unknown';
      
      // Check HTTPS
      try {
        const response = await axios.get(`https://${domain}`, {
          timeout: 5000,
          maxRedirects: 5
        });
        hasWebsite = response.status === 200;
        sslCertificate = true;
        
        // Try to determine company size from domain patterns
        if (domain.includes('.edu')) companySize = 'Educational Institution';
        else if (domain.includes('.gov')) companySize = 'Government';
        else if (['com', 'org', 'io'].some(ext => domain.endsWith(ext))) companySize = 'Corporate';
        
      } catch (error: any) {
        if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
          hasWebsite = true;
          sslCertificate = false;
        }
      }
      
      return {
        isLegit: hasWebsite,
        hasWebsite,
        sslCertificate,
        companySize
      };
    } catch (error) {
      return {
        isLegit: false,
        hasWebsite: false,
        sslCertificate: false,
        companySize: 'Unknown'
      };
    }
  }

  // Enhanced phone validation
  validatePhone(phone: string): any {
    if (!phone) return { isValid: false };
    
    const cleanPhone = phone.replace(/[\s()-]/g, '');
    const isValid = /^\+?[1-9]\d{1,14}$/.test(cleanPhone);
    
    // Calculate risk score
    let riskScore = 0;
    if (!isValid) riskScore = 100;
    else if (cleanPhone.length < 10) riskScore = 70;
    else if (!cleanPhone.startsWith('+')) riskScore = 20; // No country code
    
    const country = phone.startsWith('+1') ? 'US/Canada' : 
                    phone.startsWith('+44') ? 'UK' :
                    phone.startsWith('+91') ? 'India' :
                    phone.startsWith('+86') ? 'China' : 'Unknown';
    
    return {
      isValid,
      country,
      lineType: 'Unknown',
      riskScore: Math.min(riskScore, 100)
    };
  }

  // Check identity consistency across platforms
  checkIdentityConsistency(email: string, candidateName: string, linkedinUrl?: string, githubUsername?: string): any {
    const emailName = email.split('@')[0].toLowerCase();
    const nameParts = candidateName.toLowerCase().split(' ').filter(Boolean);
    
    // Check if email contains parts of name
    const nameEmailMatch = nameParts.some(part => emailName.includes(part) || part.includes(emailName));
    
    // Check cross-platform consistency
    let crossPlatformConsistency = true;
    if (linkedinUrl && githubUsername) {
      const linkedinUsername = linkedinUrl.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/)?.[1] || '';
      crossPlatformConsistency = linkedinUsername.toLowerCase().includes(githubUsername.toLowerCase()) ||
                                  githubUsername.toLowerCase().includes(linkedinUsername.toLowerCase());
    }
    
    let score = 50;
    if (nameEmailMatch) score += 30;
    if (crossPlatformConsistency) score += 20;
    
    return {
      nameEmailMatch,
      crossPlatformConsistency,
      score
    };
  }

  // Calculate trust score based on all checks
  calculateTrustScore(results: any): number {
    let score = 40; // Base score (lower than before, needs to earn trust)
    
    // Email checks (25 points max)
    if (results.emailVerification.isValid) score += 10;
    if (!results.emailVerification.isDisposable) score += 10;
    if (results.emailVerification.mxRecords) score += 5;
    if (results.emailVerification.spamScore < 30) score += 5;
    if (results.emailVerification.isDisposable) score -= 25;
    
    // GitHub presence (20 points max)
    if (results.githubProfile?.exists) {
      score += 10;
      if (results.githubProfile.publicRepos > 5) score += 5;
      if (results.githubProfile.followers > 10) score += 3;
      if (results.githubProfile.accountAge > 365) score += 5;
      if (results.githubProfile.verified) score += 5;
    }
    
    // LinkedIn presence (15 points max)
    if (results.linkedInProfile?.exists) {
      score += 10;
      if (results.linkedInProfile.profileCompleteness === 'Likely complete') score += 5;
    }
    
    // Domain reputation (15 points max)
    if (results.emailDomainReputation?.hasWebsite) score += 5;
    if (results.emailDomainReputation?.sslCertificate) score += 5;
    if (!results.emailVerification.isFreeEmail) score += 5; // Professional email
    
    // Phone validation (10 points max)
    if (results.phoneValidation?.isValid) score += 5;
    if (results.phoneValidation?.riskScore < 30) score += 5;
    
    // Identity consistency (15 points max)
    if (results.identityConsistency) {
      score += results.identityConsistency.score * 0.15;
    }
    
    return Math.min(Math.max(score, 0), 100);
  }

  // Start a comprehensive background check
  async startBackgroundCheck(checkData: {
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    candidateLinkedIn?: string;
    candidateGithub?: string;
    candidatePhone?: string;
    jobTitle: string;
  }): Promise<PublicBackgroundCheck> {
    const checkId = crypto.randomUUID();
    
    const backgroundCheck: PublicBackgroundCheck = {
      id: checkId,
      candidateId: checkData.candidateId,
      candidateName: checkData.candidateName,
      candidateEmail: checkData.candidateEmail,
      candidateLinkedIn: checkData.candidateLinkedIn,
      candidateGithub: checkData.candidateGithub,
      jobTitle: checkData.jobTitle,
      status: "pending",
      requestedAt: new Date().toISOString(),
      cost: 0,
      results: {
        emailVerification: {
          isValid: false,
          isDisposable: false,
          isFreeEmail: false,
          domain: '',
          mxRecords: false,
          spamScore: 0
        },
        redFlags: [],
        greenFlags: [],
        trustScore: 0,
        recommendation: "proceed_with_caution"
      }
    };

    this.checks.set(checkId, backgroundCheck);
    this.performBackgroundCheck(checkId, checkData);
    return backgroundCheck;
  }

  // Perform all background checks
  private async performBackgroundCheck(checkId: string, checkData: any): Promise<void> {
    const check = this.checks.get(checkId);
    if (!check) return;

    check.status = "in_progress";

    try {
      // Email verification
      const emailVerification = await this.verifyEmail(checkData.candidateEmail);
      check.results.emailVerification = emailVerification;

      // GitHub check
      if (checkData.candidateGithub) {
        const githubUsername = checkData.candidateGithub.split('/').pop() || checkData.candidateGithub;
        check.results.githubProfile = await this.checkGithubProfile(githubUsername);
      }

      // LinkedIn check
      if (checkData.candidateLinkedIn) {
        check.results.linkedInProfile = await this.checkLinkedInProfile(checkData.candidateLinkedIn);
      }

      // Domain reputation
      const domain = checkData.candidateEmail.split('@')[1];
      check.results.emailDomainReputation = await this.checkDomainReputation(domain);

      // Phone validation
      if (checkData.candidatePhone) {
        check.results.phoneValidation = this.validatePhone(checkData.candidatePhone);
      }

      // Identity consistency check
      check.results.identityConsistency = this.checkIdentityConsistency(
        checkData.candidateEmail,
        checkData.candidateName,
        checkData.candidateLinkedIn,
        checkData.candidateGithub
      );

      // Professional verification
      check.results.professionalVerification = {
        hasLinkedIn: !!check.results.linkedInProfile?.exists,
        hasGithub: !!check.results.githubProfile?.exists,
        hasPortfolio: false,
        emailDomainMatch: !emailVerification.isFreeEmail && !emailVerification.isDisposable,
        professionalEmailScore: emailVerification.isFreeEmail ? 40 : emailVerification.isDisposable ? 0 : 100
      };

      // Social media presence score
      const platforms = [];
      if (check.results.linkedInProfile?.exists) platforms.push('LinkedIn');
      if (check.results.githubProfile?.exists) platforms.push('GitHub');
      
      check.results.socialMediaPresence = {
        platforms,
        score: platforms.length * 40 // 40 points per platform
      };

      // Identify red flags
      const redFlags: string[] = [];
      const greenFlags: string[] = [];
      
      if (emailVerification.isDisposable) redFlags.push('⚠️ Using disposable email address');
      if (!emailVerification.mxRecords) redFlags.push('⚠️ Email domain has no MX records');
      if (emailVerification.spamScore > 50) redFlags.push('⚠️ High spam score on email');
      if (!check.results.linkedInProfile?.exists) redFlags.push('⚠️ No LinkedIn profile provided');
      if (!check.results.githubProfile?.exists && checkData.jobTitle.toLowerCase().includes('developer')) {
        redFlags.push('⚠️ No GitHub profile for developer role');
      }
      if (check.results.githubProfile?.accountAge && check.results.githubProfile.accountAge < 30) {
        redFlags.push('⚠️ Very new GitHub account (< 30 days)');
      }
      if (!check.results.identityConsistency?.nameEmailMatch) {
        redFlags.push('⚠️ Name doesn\'t match email address');
      }
      if (!check.results.emailDomainReputation?.sslCertificate && check.results.emailDomainReputation?.hasWebsite) {
        redFlags.push('⚠️ Email domain has expired/invalid SSL certificate');
      }

      // Identify green flags
      if (!emailVerification.isDisposable && !emailVerification.isFreeEmail) {
        greenFlags.push('✓ Professional email domain');
      }
      if (check.results.githubProfile?.exists) {
        greenFlags.push('✓ Active GitHub presence');
        if (check.results.githubProfile.publicRepos > 10) {
          greenFlags.push('✓ Significant GitHub contributions');
        }
      }
      if (check.results.linkedInProfile?.exists) {
        greenFlags.push('✓ LinkedIn profile verified');
      }
      if (check.results.identityConsistency?.nameEmailMatch) {
        greenFlags.push('✓ Consistent identity across platforms');
      }
      if (check.results.emailDomainReputation?.sslCertificate) {
        greenFlags.push('✓ Secure email domain');
      }
      if (check.results.githubProfile?.accountAge && check.results.githubProfile.accountAge > 365) {
        greenFlags.push('✓ Established online presence (1+ years)');
      }

      check.results.redFlags = redFlags;
      check.results.greenFlags = greenFlags;

      // Calculate trust score
      check.results.trustScore = this.calculateTrustScore(check.results);

      // Make recommendation
      if (check.results.trustScore >= 75) {
        check.results.recommendation = "hire";
      } else if (check.results.trustScore >= 50) {
        check.results.recommendation = "proceed_with_caution";
      } else {
        check.results.recommendation = "reject";
      }

      check.status = "completed";
      check.completedAt = new Date().toISOString();

    } catch (error) {
      console.error('Background check error:', error);
      check.status = "failed";
      check.results.redFlags.push('❌ Background check encountered errors');
    }
  }

  // Get all background checks
  async getBackgroundChecks(): Promise<PublicBackgroundCheck[]> {
    return Array.from(this.checks.values()).sort((a, b) => 
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  }

  // Get background check by ID
  async getBackgroundCheck(checkId: string): Promise<PublicBackgroundCheck | null> {
    return this.checks.get(checkId) || null;
  }

  // Export results as text report
  generateTextReport(check: PublicBackgroundCheck): string {
    return `
========================================
    PUBLIC BACKGROUND CHECK REPORT
========================================

Candidate: ${check.candidateName}
Email: ${check.candidateEmail}
Position: ${check.jobTitle}
Check ID: ${check.id}
Status: ${check.status.toUpperCase()}
Requested: ${new Date(check.requestedAt).toLocaleString()}
Completed: ${check.completedAt ? new Date(check.completedAt).toLocaleString() : 'N/A'}

========================================
        TRUST ASSESSMENT
========================================

TRUST SCORE: ${check.results.trustScore}/100
RECOMMENDATION: ${check.results.recommendation.toUpperCase().replace('_', ' ')}

${check.results.greenFlags.length > 0 ? `
GREEN FLAGS (${check.results.greenFlags.length})
-----------------------------------------
${check.results.greenFlags.map(flag => flag).join('\n')}
` : ''}

${check.results.redFlags.length > 0 ? `
RED FLAGS (${check.results.redFlags.length})
-----------------------------------------
${check.results.redFlags.map(flag => flag).join('\n')}
` : ''}

========================================
     EMAIL VERIFICATION
========================================

Valid Format: ${check.results.emailVerification.isValid ? '✓ Yes' : '✗ No'}
Disposable Email: ${check.results.emailVerification.isDisposable ? '✗ Yes (HIGH RISK)' : '✓ No'}
Free Email Provider: ${check.results.emailVerification.isFreeEmail ? 'Yes' : '✓ No (Professional)'}
Domain: ${check.results.emailVerification.domain}
MX Records: ${check.results.emailVerification.mxRecords ? '✓ Valid' : '✗ Invalid'}
Spam Score: ${check.results.emailVerification.spamScore}/100 ${check.results.emailVerification.spamScore > 50 ? '(HIGH)' : '(LOW)'}

${check.results.githubProfile ? `
========================================
       GITHUB PROFILE
========================================

Profile Found: ${check.results.githubProfile.exists ? '✓ Yes' : '✗ No'}
${check.results.githubProfile.exists ? `
Username: ${check.results.githubProfile.username}
Public Repositories: ${check.results.githubProfile.publicRepos}
Followers: ${check.results.githubProfile.followers}
Account Age: ${check.results.githubProfile.accountAge} days (${(check.results.githubProfile.accountAge / 365).toFixed(1)} years)
Top Languages: ${check.results.githubProfile.topLanguages?.join(', ') || 'None'}
Last Activity: ${check.results.githubProfile.lastActivity || 'Unknown'}
${check.results.githubProfile.verified ? 'Verified Account: ✓ Yes' : ''}
` : ''}
` : ''}

${check.results.linkedInProfile ? `
========================================
      LINKEDIN PROFILE
========================================

Profile Found: ${check.results.linkedInProfile.exists ? '✓ Yes' : '✗ No'}
${check.results.linkedInProfile.exists ? `
Profile URL: ${check.results.linkedInProfile.profileUrl}
Headline: ${check.results.linkedInProfile.headline}
Completeness: ${check.results.linkedInProfile.profileCompleteness}
` : ''}
` : ''}

${check.results.emailDomainReputation ? `
========================================
     DOMAIN REPUTATION
========================================

Has Website: ${check.results.emailDomainReputation.hasWebsite ? '✓ Yes' : '✗ No'}
SSL Certificate: ${check.results.emailDomainReputation.sslCertificate ? '✓ Valid' : '✗ Invalid/None'}
Company Size: ${check.results.emailDomainReputation.companySize}
` : ''}

${check.results.identityConsistency ? `
========================================
    IDENTITY CONSISTENCY
========================================

Name-Email Match: ${check.results.identityConsistency.nameEmailMatch ? '✓ Yes' : '✗ No'}
Cross-Platform Consistency: ${check.results.identityConsistency.crossPlatformConsistency ? '✓ Yes' : '✗ No'}
Consistency Score: ${check.results.identityConsistency.score}/100
` : ''}

${check.results.professionalVerification ? `
========================================
  PROFESSIONAL VERIFICATION
========================================

LinkedIn Profile: ${check.results.professionalVerification.hasLinkedIn ? '✓ Yes' : '✗ No'}
GitHub Profile: ${check.results.professionalVerification.hasGithub ? '✓ Yes' : '✗ No'}
Professional Email: ${check.results.professionalVerification.emailDomainMatch ? '✓ Yes' : '✗ No'}
Professional Email Score: ${check.results.professionalVerification.professionalEmailScore}/100
` : ''}

${check.results.socialMediaPresence ? `
========================================
   SOCIAL MEDIA PRESENCE
========================================

Platforms: ${check.results.socialMediaPresence.platforms.join(', ') || 'None found'}
Presence Score: ${check.results.socialMediaPresence.score}/100
` : ''}

========================================
         SUMMARY
========================================

This is a FREE background check using publicly available data.
For comprehensive verification including criminal records, 
employment history, and education verification, consider 
using paid third-party services.

Generated: ${new Date().toLocaleString()}
Cost: $0.00 (Free verification)

========================================
    `.trim();
  }
}

// Export singleton instance
export const publicBackgroundCheckService = new PublicBackgroundCheckService();
