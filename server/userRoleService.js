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
    // Business/corporate email domains suggest recruiter role
    const recruiterDomains = [
      'hr.', 'talent.', 'recruiting.', 'careers.',
      'vennverse.com', 'company.com'
    ];
    
    // Check if email contains recruiting keywords
    const recruiterKeywords = ['hr', 'talent', 'recruiting', 'careers', 'hiring'];
    
    const emailLower = email.toLowerCase();
    
    // Check domain patterns
    for (const domain of recruiterDomains) {
      if (emailLower.includes(domain)) {
        return 'recruiter';
      }
    }
    
    // Check email prefix for recruiting keywords
    const emailPrefix = emailLower.split('@')[0];
    for (const keyword of recruiterKeywords) {
      if (emailPrefix.includes(keyword)) {
        return 'recruiter';
      }
    }
    
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