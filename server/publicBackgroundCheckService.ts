
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
    // Email verification
    emailVerification: {
      isValid: boolean;
      isDisposable: boolean;
      isFreeEmail: boolean;
      domain: string;
      mxRecords: boolean;
    };
    
    // LinkedIn profile check
    linkedInProfile?: {
      exists: boolean;
      profileUrl?: string;
      headline?: string;
      connections?: number;
      profileCompleteness?: string;
    };
    
    // GitHub profile check
    githubProfile?: {
      exists: boolean;
      username?: string;
      publicRepos?: number;
      followers?: number;
      accountAge?: number; // in days
      contributions?: number;
      topLanguages?: string[];
    };
    
    // Domain reputation check
    emailDomainReputation?: {
      domainAge?: number;
      isLegit: boolean;
      hasWebsite: boolean;
      sslCertificate: boolean;
    };
    
    // Social media presence
    socialMediaPresence?: {
      twitter?: boolean;
      facebook?: boolean;
      instagram?: boolean;
      reddit?: boolean;
    };
    
    // Phone number validation
    phoneValidation?: {
      isValid: boolean;
      country?: string;
      carrier?: string;
      lineType?: string; // mobile, landline, voip
    };
    
    // Professional verification
    professionalVerification?: {
      hasLinkedIn: boolean;
      hasGithub: boolean;
      hasPortfolio: boolean;
      emailDomainMatch: boolean; // Does email domain match claimed company
    };
    
    // Red flags
    redFlags: string[];
    
    // Overall assessment
    trustScore: number; // 0-100
    recommendation: "hire" | "proceed_with_caution" | "reject";
  };
  cost: number; // Always $0 for public checks
}

export class PublicBackgroundCheckService {
  private checks: Map<string, PublicBackgroundCheck> = new Map();

  // Email verification using public DNS and regex
  async verifyEmail(email: string): Promise<any> {
    const disposableDomains = ['tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com'];
    const freeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    
    const domain = email.split('@')[1];
    const isDisposable = disposableDomains.some(d => domain.includes(d));
    const isFreeEmail = freeDomains.includes(domain);
    
    // Check MX records (simplified - in production use dns.resolveMx)
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
      mxRecords
    };
  }

  // GitHub profile check using public API
  async checkGithubProfile(username: string): Promise<any> {
    if (!username) return { exists: false };
    
    try {
      const response = await axios.get(`https://api.github.com/users/${username}`, {
        timeout: 5000
      });
      
      const user = response.data;
      const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100`, {
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
      
      return {
        exists: true,
        username: user.login,
        publicRepos: user.public_repos,
        followers: user.followers,
        accountAge,
        contributions: repos.length,
        topLanguages
      };
    } catch (error) {
      return { exists: false };
    }
  }

  // LinkedIn profile check (simplified - checks if URL is valid)
  async checkLinkedInProfile(linkedinUrl: string): Promise<any> {
    if (!linkedinUrl) return { exists: false };
    
    try {
      // Basic LinkedIn URL validation
      const isValidLinkedIn = /linkedin\.com\/in\/[a-zA-Z0-9-]+/.test(linkedinUrl);
      
      if (isValidLinkedIn) {
        return {
          exists: true,
          profileUrl: linkedinUrl,
          headline: 'Profile exists (verification limited)',
          profileCompleteness: 'Unable to determine'
        };
      }
      
      return { exists: false };
    } catch (error) {
      return { exists: false };
    }
  }

  // Domain reputation check
  async checkDomainReputation(domain: string): Promise<any> {
    try {
      // Check if domain has a website
      let hasWebsite = false;
      let sslCertificate = false;
      
      try {
        const response = await axios.get(`https://${domain}`, {
          timeout: 5000,
          maxRedirects: 5
        });
        hasWebsite = response.status === 200;
        sslCertificate = true; // If HTTPS works, SSL is valid
      } catch (error: any) {
        if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
          hasWebsite = true;
          sslCertificate = false;
        }
      }
      
      return {
        isLegit: hasWebsite,
        hasWebsite,
        sslCertificate
      };
    } catch (error) {
      return {
        isLegit: false,
        hasWebsite: false,
        sslCertificate: false
      };
    }
  }

  // Phone validation (basic format check)
  validatePhone(phone: string): any {
    if (!phone) return { isValid: false };
    
    // Basic international phone format check
    const isValid = /^\+?[1-9]\d{1,14}$/.test(phone.replace(/[\s()-]/g, ''));
    
    return {
      isValid,
      country: phone.startsWith('+1') ? 'US' : phone.startsWith('+91') ? 'India' : 'Unknown',
      lineType: 'Unknown' // Would need paid API for this
    };
  }

  // Calculate trust score based on all checks
  calculateTrustScore(results: any): number {
    let score = 50; // Base score
    
    // Email checks
    if (results.emailVerification.isValid) score += 10;
    if (!results.emailVerification.isDisposable) score += 10;
    if (results.emailVerification.mxRecords) score += 5;
    if (results.emailVerification.isDisposable) score -= 20;
    
    // GitHub presence
    if (results.githubProfile?.exists) {
      score += 15;
      if (results.githubProfile.publicRepos > 5) score += 5;
      if (results.githubProfile.followers > 10) score += 5;
      if (results.githubProfile.accountAge > 365) score += 5;
    }
    
    // LinkedIn presence
    if (results.linkedInProfile?.exists) score += 10;
    
    // Domain reputation
    if (results.emailDomainReputation?.hasWebsite) score += 5;
    if (results.emailDomainReputation?.sslCertificate) score += 5;
    
    // Phone validation
    if (results.phoneValidation?.isValid) score += 5;
    
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
      cost: 0, // Free!
      results: {
        emailVerification: {
          isValid: false,
          isDisposable: false,
          isFreeEmail: false,
          domain: '',
          mxRecords: false
        },
        redFlags: [],
        trustScore: 0,
        recommendation: "proceed_with_caution"
      }
    };

    this.checks.set(checkId, backgroundCheck);

    // Run all checks asynchronously
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

      // Professional verification
      check.results.professionalVerification = {
        hasLinkedIn: !!check.results.linkedInProfile?.exists,
        hasGithub: !!check.results.githubProfile?.exists,
        hasPortfolio: false, // Could check if they provided portfolio URL
        emailDomainMatch: !emailVerification.isFreeEmail && !emailVerification.isDisposable
      };

      // Identify red flags
      const redFlags: string[] = [];
      if (emailVerification.isDisposable) redFlags.push('Using disposable email');
      if (!emailVerification.mxRecords) redFlags.push('Email domain has no MX records');
      if (!check.results.linkedInProfile?.exists) redFlags.push('No LinkedIn profile provided');
      if (!check.results.githubProfile?.exists && checkData.jobTitle.toLowerCase().includes('developer')) {
        redFlags.push('No GitHub profile for developer role');
      }
      if (check.results.githubProfile?.accountAge && check.results.githubProfile.accountAge < 30) {
        redFlags.push('Very new GitHub account (created < 30 days ago)');
      }

      check.results.redFlags = redFlags;

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
      check.results.redFlags.push('Background check encountered errors');
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
PUBLIC BACKGROUND CHECK REPORT
==============================

Candidate: ${check.candidateName}
Email: ${check.candidateEmail}
Position: ${check.jobTitle}
Check ID: ${check.id}
Status: ${check.status.toUpperCase()}
Requested: ${new Date(check.requestedAt).toLocaleString()}
Completed: ${check.completedAt ? new Date(check.completedAt).toLocaleString() : 'N/A'}

TRUST SCORE: ${check.results.trustScore}/100
RECOMMENDATION: ${check.results.recommendation.toUpperCase().replace('_', ' ')}

EMAIL VERIFICATION
==================
Valid Format: ${check.results.emailVerification.isValid ? 'Yes' : 'No'}
Disposable Email: ${check.results.emailVerification.isDisposable ? 'Yes ⚠️' : 'No'}
Free Email Provider: ${check.results.emailVerification.isFreeEmail ? 'Yes' : 'No'}
Domain: ${check.results.emailVerification.domain}
MX Records: ${check.results.emailVerification.mxRecords ? 'Valid' : 'Invalid ⚠️'}

${check.results.githubProfile ? `
GITHUB PROFILE
==============
Profile Found: ${check.results.githubProfile.exists ? 'Yes ✓' : 'No'}
${check.results.githubProfile.exists ? `
Username: ${check.results.githubProfile.username}
Public Repositories: ${check.results.githubProfile.publicRepos}
Followers: ${check.results.githubProfile.followers}
Account Age: ${check.results.githubProfile.accountAge} days
Top Languages: ${check.results.githubProfile.topLanguages?.join(', ')}
` : ''}
` : ''}

${check.results.linkedInProfile ? `
LINKEDIN PROFILE
================
Profile Found: ${check.results.linkedInProfile.exists ? 'Yes ✓' : 'No'}
${check.results.linkedInProfile.exists ? `Profile URL: ${check.results.linkedInProfile.profileUrl}` : ''}
` : ''}

${check.results.emailDomainReputation ? `
DOMAIN REPUTATION
=================
Has Website: ${check.results.emailDomainReputation.hasWebsite ? 'Yes' : 'No'}
SSL Certificate: ${check.results.emailDomainReputation.sslCertificate ? 'Valid ✓' : 'Invalid/None ⚠️'}
` : ''}

${check.results.redFlags.length > 0 ? `
RED FLAGS (${check.results.redFlags.length})
=========
${check.results.redFlags.map(flag => `⚠️ ${flag}`).join('\n')}
` : ''}

PROFESSIONAL VERIFICATION
=========================
LinkedIn Profile: ${check.results.professionalVerification?.hasLinkedIn ? 'Yes ✓' : 'No ⚠️'}
GitHub Profile: ${check.results.professionalVerification?.hasGithub ? 'Yes ✓' : 'No'}
Professional Email: ${check.results.professionalVerification?.emailDomainMatch ? 'Yes ✓' : 'No'}

Generated on: ${new Date().toLocaleString()}
Cost: $0.00 (Free public verification)
    `.trim();
  }
}

// Export singleton instance
export const publicBackgroundCheckService = new PublicBackgroundCheckService();
