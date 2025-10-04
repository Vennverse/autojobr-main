/**
 * User Role Management Service
 * Handles automatic role assignment and user type management for future users
 */

import { db } from "./db.js";
import { users } from "../shared/schema.js";
import { eq } from "drizzle-orm";

export class UserRoleService {
  static async assignUserRole(email, preferredRole = 'job_seeker') {
    try {
      // Auto-detect role based on email domain or other criteria
      const detectedRole = this.detectUserRole(email);
      const finalRole = preferredRole === 'recruiter' ? 'recruiter' : detectedRole;

      return {
        userType: finalRole,
        currentRole: finalRole
      };
    } catch (error) {
      console.error('Error assigning user role:', error);
      return {
        userType: 'job_seeker',
        currentRole: 'job_seeker'
      };
    }
  }

  static detectUserRole(email) {
    const emailLower = email.toLowerCase();
    const emailDomain = emailLower.split('@')[1] || '';
    const emailPrefix = emailLower.split('@')[0];
    
    // FIRST: Check if email is from a public email provider
    // ALL public email users are ALWAYS job seekers, regardless of username
    const publicEmailProviders = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
      'live.com', 'msn.com', 'icloud.com', 'me.com',
      'aol.com', 'protonmail.com', 'mail.com', 'zoho.com',
      'yandex.com', 'gmx.com', 'inbox.com', 'tutanota.com'
    ];
    
    for (const provider of publicEmailProviders) {
      if (emailDomain === provider) {
        return 'job_seeker';
      }
    }
    
    // SECOND: Check if email is from an educational institution
    // Educational domains: .edu, .ac.in, .edu.*, .ac.*, etc.
    const isEducationalDomain = 
      emailDomain.endsWith('.edu') ||
      emailDomain.endsWith('.ac.in') ||
      emailDomain.includes('.edu.') ||
      emailDomain.includes('.ac.');
    
    if (isEducationalDomain) {
      // Check if it's university HR/hiring staff (they should be recruiters)
      const recruiterKeywords = ['hr', 'talent', 'recruiting', 'careers', 'hiring', 'placement'];
      
      for (const keyword of recruiterKeywords) {
        if (emailPrefix.includes(keyword)) {
          return 'recruiter'; // University career services/HR staff
        }
      }
      
      // Regular students and faculty are job seekers
      return 'job_seeker';
    }
    
    // THIRD: For corporate/company emails, check for recruiter indicators
    const recruiterDomains = [
      'hr.', 'talent.', 'recruiting.', 'careers.',
      'vennverse.com', 'company.com'
    ];
    
    const recruiterKeywords = ['hr', 'talent', 'recruiting', 'careers', 'hiring'];
    
    // Check domain patterns
    for (const domain of recruiterDomains) {
      if (emailLower.includes(domain)) {
        return 'recruiter';
      }
    }
    
    // Check email prefix for recruiting keywords (only for corporate emails)
    for (const keyword of recruiterKeywords) {
      if (emailPrefix.includes(keyword)) {
        return 'recruiter';
      }
    }
    
    // Default to job seeker
    return 'job_seeker';
  }

  static async updateUserRole(userId, newRole) {
    try {
      await db
        .update(users)
        .set({ 
          userType: newRole,
          currentRole: newRole,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      console.log(`✅ Updated user ${userId} role to ${newRole}`);
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  }

  static async getUsersByRole(role) {
    try {
      return await db
        .select()
        .from(users)
        .where(eq(users.userType, role));
    } catch (error) {
      console.error('Error fetching users by role:', error);
      return [];
    }
  }
}