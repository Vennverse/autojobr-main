import { z } from 'zod';

// Validation schema
export const salaryInsightsSchema = z.object({
  jobTitle: z.string(),
  company: z.string().optional(),
  location: z.string().optional(),
  experienceLevel: z.number().optional(),
  skills: z.array(z.string()).optional()
});

// Type definitions for better type safety
type LocationKey = 'us' | 'india' | 'europe' | 'uk' | 'canada' | 'singapore' | 'australia' | 'uae';
type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'CAD' | 'SGD' | 'AUD' | 'AED';

interface RoleData {
  base: number;
  locations: Record<LocationKey, number>;
  category: 'engineering' | 'product' | 'design' | 'data' | 'management' | 'operations' | 'sales' | 'executive' | 'finance' | 'marketing' | 'hr' | 'legal' | 'consulting';
}

interface SalaryBreakdown {
  baseSalary: number;
  skillsBonus: number;
  equityEstimate: number;
  bonusEstimate: number;
  signingBonus?: number;
}

interface SalaryRange {
  min: number;
  median: number;
  max: number;
}

interface SalaryInsights {
  salaryRange: SalaryRange;
  currency: CurrencyCode;
  totalCompensation: number;
  breakdown: SalaryBreakdown;
  marketInsights: string;
  negotiationTips: string[];
  locationAdjustment: string;
  companyTier: string;
  experienceImpact: string;
  careerProgression?: string[];
  industryTrends?: string[];
}

// Comprehensive role-based salary database (in USD)
const SALARY_DATABASE: Record<string, RoleData> = {
  // Engineering Roles
  'software engineer': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'engineering'
  },
  'senior software engineer': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'engineering'
  },
  'staff software engineer': { 
    base: 185000, 
    locations: { us: 1.0, india: 0.35, europe: 0.90, uk: 0.94, canada: 0.89, singapore: 0.82, australia: 0.86, uae: 0.76 },
    category: 'engineering'
  },
  'principal engineer': { 
    base: 225000, 
    locations: { us: 1.0, india: 0.38, europe: 0.92, uk: 0.95, canada: 0.90, singapore: 0.85, australia: 0.88, uae: 0.78 },
    category: 'engineering'
  },
  'distinguished engineer': { 
    base: 300000, 
    locations: { us: 1.0, india: 0.40, europe: 0.93, uk: 0.96, canada: 0.91, singapore: 0.87, australia: 0.90, uae: 0.80 },
    category: 'engineering'
  },
  'ai engineer': { 
    base: 145000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'ml engineer': { 
    base: 140000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'mlops engineer': { 
    base: 150000, 
    locations: { us: 1.0, india: 0.29, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'engineering'
  },
  'data scientist': { 
    base: 120000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'data'
  },
  'senior data scientist': { 
    base: 160000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'data'
  },
  'research scientist': { 
    base: 155000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'data'
  },
  'frontend developer': { 
    base: 90000, 
    locations: { us: 1.0, india: 0.24, europe: 0.84, uk: 0.89, canada: 0.84, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'engineering'
  },
  'backend developer': { 
    base: 98000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'full stack developer': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'devops engineer': { 
    base: 115000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'site reliability engineer': { 
    base: 130000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'platform engineer': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.29, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'engineering'
  },
  'mobile developer': { 
    base: 102000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'ios developer': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'android developer': { 
    base: 102000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'embedded systems engineer': { 
    base: 110000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'firmware engineer': { 
    base: 108000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'cloud architect': { 
    base: 145000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'engineering'
  },
  'security engineer': { 
    base: 125000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'cybersecurity analyst': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'penetration tester': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'solutions architect': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.29, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'engineering'
  },
  'technical lead': { 
    base: 140000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'engineering'
  },
  'engineering manager': { 
    base: 155000, 
    locations: { us: 1.0, india: 0.32, europe: 0.89, uk: 0.93, canada: 0.88, singapore: 0.79, australia: 0.84, uae: 0.74 },
    category: 'management'
  },
  'senior engineering manager': { 
    base: 195000, 
    locations: { us: 1.0, india: 0.35, europe: 0.90, uk: 0.94, canada: 0.89, singapore: 0.82, australia: 0.86, uae: 0.76 },
    category: 'management'
  },
  'director of engineering': { 
    base: 235000, 
    locations: { us: 1.0, india: 0.38, europe: 0.92, uk: 0.95, canada: 0.90, singapore: 0.85, australia: 0.88, uae: 0.78 },
    category: 'management'
  },
  'vp of engineering': { 
    base: 300000, 
    locations: { us: 1.0, india: 0.42, europe: 0.93, uk: 0.96, canada: 0.91, singapore: 0.87, australia: 0.90, uae: 0.80 },
    category: 'executive'
  },
  'cto': { 
    base: 400000, 
    locations: { us: 1.0, india: 0.45, europe: 0.94, uk: 0.97, canada: 0.92, singapore: 0.90, australia: 0.92, uae: 0.82 },
    category: 'executive'
  },

  // Product & Design
  'product manager': { 
    base: 125000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'product'
  },
  'senior product manager': { 
    base: 165000, 
    locations: { us: 1.0, india: 0.33, europe: 0.89, uk: 0.93, canada: 0.88, singapore: 0.80, australia: 0.84, uae: 0.74 },
    category: 'product'
  },
  'product lead': { 
    base: 185000, 
    locations: { us: 1.0, india: 0.35, europe: 0.90, uk: 0.94, canada: 0.89, singapore: 0.82, australia: 0.86, uae: 0.76 },
    category: 'product'
  },
  'group product manager': { 
    base: 210000, 
    locations: { us: 1.0, india: 0.37, europe: 0.91, uk: 0.95, canada: 0.90, singapore: 0.84, australia: 0.87, uae: 0.77 },
    category: 'product'
  },
  'director of product': { 
    base: 245000, 
    locations: { us: 1.0, india: 0.40, europe: 0.92, uk: 0.95, canada: 0.90, singapore: 0.85, australia: 0.88, uae: 0.78 },
    category: 'management'
  },
  'vp of product': { 
    base: 310000, 
    locations: { us: 1.0, india: 0.42, europe: 0.93, uk: 0.96, canada: 0.91, singapore: 0.87, australia: 0.90, uae: 0.80 },
    category: 'executive'
  },
  'cpo': { 
    base: 420000, 
    locations: { us: 1.0, india: 0.45, europe: 0.94, uk: 0.97, canada: 0.92, singapore: 0.90, australia: 0.92, uae: 0.82 },
    category: 'executive'
  },
  'product designer': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'design'
  },
  'ui/ux designer': { 
    base: 85000, 
    locations: { us: 1.0, india: 0.24, europe: 0.84, uk: 0.89, canada: 0.84, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'design'
  },
  'senior product designer': { 
    base: 130000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'design'
  },
  'design lead': { 
    base: 150000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'design'
  },
  'head of design': { 
    base: 190000, 
    locations: { us: 1.0, india: 0.35, europe: 0.90, uk: 0.94, canada: 0.89, singapore: 0.82, australia: 0.86, uae: 0.76 },
    category: 'management'
  },

  // Data & Analytics
  'data analyst': { 
    base: 75000, 
    locations: { us: 1.0, india: 0.22, europe: 0.82, uk: 0.87, canada: 0.82, singapore: 0.74, australia: 0.79, uae: 0.69 },
    category: 'data'
  },
  'senior data analyst': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'data'
  },
  'data engineer': { 
    base: 115000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'data'
  },
  'senior data engineer': { 
    base: 145000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'data'
  },
  'analytics engineer': { 
    base: 110000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'data'
  },
  'business intelligence analyst': { 
    base: 82000, 
    locations: { us: 1.0, india: 0.23, europe: 0.83, uk: 0.88, canada: 0.83, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'data'
  },
  'business analyst': { 
    base: 80000, 
    locations: { us: 1.0, india: 0.23, europe: 0.83, uk: 0.88, canada: 0.83, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'data'
  },

  // QA & Testing
  'qa engineer': { 
    base: 78000, 
    locations: { us: 1.0, india: 0.23, europe: 0.83, uk: 0.88, canada: 0.83, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'engineering'
  },
  'senior qa engineer': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'qa automation engineer': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'sdet': { 
    base: 102000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },

  // Sales & Business
  'sales engineer': { 
    base: 110000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'sales'
  },
  'solutions consultant': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'sales'
  },
  'account executive': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'sales'
  },
  'enterprise account executive': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.35, europe: 0.90, uk: 0.94, canada: 0.89, singapore: 0.82, australia: 0.86, uae: 0.76 },
    category: 'sales'
  },
  'customer success manager': { 
    base: 85000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'operations'
  },
  'technical account manager': { 
    base: 98000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'operations'
  },

  // Specialized Roles
  'blockchain developer': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.29, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'engineering'
  },
  'smart contract developer': { 
    base: 140000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'engineering'
  },
  'quantitative analyst': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'data'
  },
  'game developer': { 
    base: 92000, 
    locations: { us: 1.0, india: 0.24, europe: 0.84, uk: 0.89, canada: 0.84, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'engineering'
  },
  'graphics engineer': { 
    base: 115000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'computer vision engineer': { 
    base: 145000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'nlp engineer': { 
    base: 145000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'robotics engineer': { 
    base: 125000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'technical writer': { 
    base: 75000, 
    locations: { us: 1.0, india: 0.22, europe: 0.82, uk: 0.87, canada: 0.82, singapore: 0.74, australia: 0.79, uae: 0.69 },
    category: 'operations'
  },
  'developer advocate': { 
    base: 115000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'operations'
  },
  'technical program manager': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'management'
  },
  'program manager': { 
    base: 110000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'management'
  },
  'scrum master': { 
    base: 90000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'management'
  },
  'agile coach': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'management'
  },

// Executive & C-Suite
  'ceo': { 
    base: 500000, 
    locations: { us: 1.0, india: 0.50, europe: 0.95, uk: 0.98, canada: 0.93, singapore: 0.92, australia: 0.94, uae: 0.85 },
    category: 'executive'
  },
  'cfo': { 
    base: 380000, 
    locations: { us: 1.0, india: 0.45, europe: 0.94, uk: 0.97, canada: 0.92, singapore: 0.90, australia: 0.92, uae: 0.82 },
    category: 'executive'
  },
  'coo': { 
    base: 360000, 
    locations: { us: 1.0, india: 0.45, europe: 0.94, uk: 0.97, canada: 0.92, singapore: 0.90, australia: 0.92, uae: 0.82 },
    category: 'executive'
  },
  'ciso': { 
    base: 350000, 
    locations: { us: 1.0, india: 0.42, europe: 0.93, uk: 0.96, canada: 0.91, singapore: 0.87, australia: 0.90, uae: 0.80 },
    category: 'executive'
  },
  'cmo': { 
    base: 340000, 
    locations: { us: 1.0, india: 0.42, europe: 0.93, uk: 0.96, canada: 0.91, singapore: 0.87, australia: 0.90, uae: 0.80 },
    category: 'executive'
  },

  // Finance Roles
  'financial analyst': { 
    base: 70000, 
    locations: { us: 1.0, india: 0.22, europe: 0.82, uk: 0.87, canada: 0.82, singapore: 0.74, australia: 0.79, uae: 0.69 },
    category: 'finance'
  },
  'senior financial analyst': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'finance'
  },
  'financial controller': { 
    base: 110000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'finance'
  },
  'finance manager': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'finance'
  },
  'senior finance manager': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'finance'
  },
  'director of finance': { 
    base: 175000, 
    locations: { us: 1.0, india: 0.35, europe: 0.90, uk: 0.94, canada: 0.89, singapore: 0.82, australia: 0.86, uae: 0.76 },
    category: 'finance'
  },
  'vp of finance': { 
    base: 240000, 
    locations: { us: 1.0, india: 0.40, europe: 0.92, uk: 0.95, canada: 0.90, singapore: 0.85, australia: 0.88, uae: 0.78 },
    category: 'finance'
  },
  'accountant': { 
    base: 60000, 
    locations: { us: 1.0, india: 0.20, europe: 0.80, uk: 0.85, canada: 0.80, singapore: 0.72, australia: 0.77, uae: 0.67 },
    category: 'finance'
  },
  'senior accountant': { 
    base: 75000, 
    locations: { us: 1.0, india: 0.22, europe: 0.82, uk: 0.87, canada: 0.82, singapore: 0.74, australia: 0.79, uae: 0.69 },
    category: 'finance'
  },
  'accounting manager': { 
    base: 90000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'finance'
  },
  'tax analyst': { 
    base: 68000, 
    locations: { us: 1.0, india: 0.22, europe: 0.82, uk: 0.87, canada: 0.82, singapore: 0.74, australia: 0.79, uae: 0.69 },
    category: 'finance'
  },
  'tax manager': { 
    base: 100000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'finance'
  },
  'treasury analyst': { 
    base: 75000, 
    locations: { us: 1.0, india: 0.23, europe: 0.83, uk: 0.88, canada: 0.83, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'finance'
  },
  'fp&a analyst': { 
    base: 80000, 
    locations: { us: 1.0, india: 0.24, europe: 0.84, uk: 0.89, canada: 0.84, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'finance'
  },
  'fp&a manager': { 
    base: 120000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'finance'
  },
  'investment banker': { 
    base: 125000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'finance'
  },
  'equity research analyst': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'finance'
  },
  'portfolio manager': { 
    base: 150000, 
    locations: { us: 1.0, india: 0.32, europe: 0.89, uk: 0.93, canada: 0.88, singapore: 0.79, australia: 0.84, uae: 0.74 },
    category: 'finance'
  },
  'risk analyst': { 
    base: 80000, 
    locations: { us: 1.0, india: 0.24, europe: 0.84, uk: 0.89, canada: 0.84, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'finance'
  },
  'risk manager': { 
    base: 110000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'finance'
  },
  'compliance officer': { 
    base: 85000, 
    locations: { us: 1.0, india: 0.24, europe: 0.84, uk: 0.89, canada: 0.84, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'finance'
  },
  'audit manager': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'finance'
  },

  // Marketing Roles
  'marketing coordinator': { 
    base: 50000, 
    locations: { us: 1.0, india: 0.18, europe: 0.78, uk: 0.83, canada: 0.78, singapore: 0.70, australia: 0.75, uae: 0.65 },
    category: 'marketing'
  },
  'marketing specialist': { 
    base: 60000, 
    locations: { us: 1.0, india: 0.20, europe: 0.80, uk: 0.85, canada: 0.80, singapore: 0.72, australia: 0.77, uae: 0.67 },
    category: 'marketing'
  },
  'digital marketing manager': { 
    base: 75000, 
    locations: { us: 1.0, india: 0.22, europe: 0.82, uk: 0.87, canada: 0.82, singapore: 0.74, australia: 0.79, uae: 0.69 },
    category: 'marketing'
  },
  'content marketing manager': { 
    base: 78000, 
    locations: { us: 1.0, india: 0.23, europe: 0.83, uk: 0.88, canada: 0.83, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'marketing'
  },
  'product marketing manager': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'marketing'
  },
  'senior product marketing manager': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'marketing'
  },
  'growth marketing manager': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'marketing'
  },
  'performance marketing manager': { 
    base: 90000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'marketing'
  },
  'seo specialist': { 
    base: 60000, 
    locations: { us: 1.0, india: 0.20, europe: 0.80, uk: 0.85, canada: 0.80, singapore: 0.72, australia: 0.77, uae: 0.67 },
    category: 'marketing'
  },
  'seo manager': { 
    base: 80000, 
    locations: { us: 1.0, india: 0.24, europe: 0.84, uk: 0.89, canada: 0.84, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'marketing'
  },
  'social media manager': { 
    base: 65000, 
    locations: { us: 1.0, india: 0.21, europe: 0.81, uk: 0.86, canada: 0.81, singapore: 0.73, australia: 0.78, uae: 0.68 },
    category: 'marketing'
  },
  'brand manager': { 
    base: 85000, 
    locations: { us: 1.0, india: 0.24, europe: 0.84, uk: 0.89, canada: 0.84, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'marketing'
  },
  'marketing manager': { 
    base: 90000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'marketing'
  },
  'senior marketing manager': { 
    base: 115000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'marketing'
  },
  'marketing director': { 
    base: 145000, 
    locations: { us: 1.0, india: 0.32, europe: 0.89, uk: 0.93, canada: 0.88, singapore: 0.79, australia: 0.84, uae: 0.74 },
    category: 'marketing'
  },
  'vp of marketing': { 
    base: 210000, 
    locations: { us: 1.0, india: 0.38, europe: 0.92, uk: 0.95, canada: 0.90, singapore: 0.85, australia: 0.88, uae: 0.78 },
    category: 'marketing'
  },
  'demand generation manager': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'marketing'
  },
  'email marketing manager': { 
    base: 70000, 
    locations: { us: 1.0, india: 0.22, europe: 0.82, uk: 0.87, canada: 0.82, singapore: 0.74, australia: 0.79, uae: 0.69 },
    category: 'marketing'
  },
  'marketing analyst': { 
    base: 65000, 
    locations: { us: 1.0, india: 0.21, europe: 0.81, uk: 0.86, canada: 0.81, singapore: 0.73, australia: 0.78, uae: 0.68 },
    category: 'marketing'
  },
  'marketing operations manager': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'marketing'
  },
  'copywriter': { 
    base: 58000, 
    locations: { us: 1.0, india: 0.19, europe: 0.79, uk: 0.84, canada: 0.79, singapore: 0.71, australia: 0.76, uae: 0.66 },
    category: 'marketing'
  },
  'senior copywriter': { 
    base: 78000, 
    locations: { us: 1.0, india: 0.23, europe: 0.83, uk: 0.88, canada: 0.83, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'marketing'
  },
  'content strategist': { 
    base: 75000, 
    locations: { us: 1.0, india: 0.22, europe: 0.82, uk: 0.87, canada: 0.82, singapore: 0.74, australia: 0.79, uae: 0.69 },
    category: 'marketing'
  },

  // Sales Roles (Expanded)
  'sales development representative': { 
    base: 55000, 
    locations: { us: 1.0, india: 0.20, europe: 0.80, uk: 0.85, canada: 0.80, singapore: 0.72, australia: 0.77, uae: 0.67 },
    category: 'sales'
  },
  'business development representative': { 
    base: 58000, 
    locations: { us: 1.0, india: 0.20, europe: 0.80, uk: 0.85, canada: 0.80, singapore: 0.72, australia: 0.77, uae: 0.67 },
    category: 'sales'
  },
  'account executive': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'sales'
  },
  'senior account executive': { 
    base: 120000, 
    locations: { us: 1.0, india: 0.33, europe: 0.89, uk: 0.93, canada: 0.88, singapore: 0.80, australia: 0.84, uae: 0.74 },
    category: 'sales'
  },
  'enterprise account executive': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.35, europe: 0.90, uk: 0.94, canada: 0.89, singapore: 0.82, australia: 0.86, uae: 0.76 },
    category: 'sales'
  },
  'strategic account executive': { 
    base: 150000, 
    locations: { us: 1.0, india: 0.37, europe: 0.91, uk: 0.95, canada: 0.90, singapore: 0.84, australia: 0.87, uae: 0.77 },
    category: 'sales'
  },
  'sales manager': { 
    base: 110000, 
    locations: { us: 1.0, india: 0.32, europe: 0.89, uk: 0.93, canada: 0.88, singapore: 0.79, australia: 0.84, uae: 0.74 },
    category: 'sales'
  },
  'regional sales manager': { 
    base: 125000, 
    locations: { us: 1.0, india: 0.33, europe: 0.89, uk: 0.93, canada: 0.88, singapore: 0.80, australia: 0.84, uae: 0.74 },
    category: 'sales'
  },
  'director of sales': { 
    base: 165000, 
    locations: { us: 1.0, india: 0.37, europe: 0.91, uk: 0.95, canada: 0.90, singapore: 0.84, australia: 0.87, uae: 0.77 },
    category: 'sales'
  },
  'vp of sales': { 
    base: 235000, 
    locations: { us: 1.0, india: 0.40, europe: 0.92, uk: 0.95, canada: 0.90, singapore: 0.85, australia: 0.88, uae: 0.78 },
    category: 'sales'
  },
  'chief revenue officer': { 
    base: 350000, 
    locations: { us: 1.0, india: 0.45, europe: 0.94, uk: 0.97, canada: 0.92, singapore: 0.90, australia: 0.92, uae: 0.82 },
    category: 'executive'
  },
  'sales engineer 1': { 
    base: 110000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'sales'
  },
  'solutions consultant': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'sales'
  },
  'channel sales manager': { 
    base: 115000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'sales'
  },
  'partnerships manager': { 
    base: 100000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'sales'
  },

  // Human Resources Roles
  'hr coordinator': { 
    base: 48000, 
    locations: { us: 1.0, india: 0.18, europe: 0.78, uk: 0.83, canada: 0.78, singapore: 0.70, australia: 0.75, uae: 0.65 },
    category: 'hr'
  },
  'hr generalist': { 
    base: 60000, 
    locations: { us: 1.0, india: 0.20, europe: 0.80, uk: 0.85, canada: 0.80, singapore: 0.72, australia: 0.77, uae: 0.67 },
    category: 'hr'
  },
  'recruiter': { 
    base: 62000, 
    locations: { us: 1.0, india: 0.21, europe: 0.81, uk: 0.86, canada: 0.81, singapore: 0.73, australia: 0.78, uae: 0.68 },
    category: 'hr'
  },
  'technical recruiter': { 
    base: 75000, 
    locations: { us: 1.0, india: 0.23, europe: 0.83, uk: 0.88, canada: 0.83, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'hr'
  },
  'senior recruiter': { 
    base: 85000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'hr'
  },
  'recruiting manager': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'hr'
  },
  'hr manager': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'hr'
  },
  'hr business partner': { 
    base: 100000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'hr'
  },
  'senior hr business partner': { 
    base: 125000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'hr'
  },
  'compensation analyst': { 
    base: 70000, 
    locations: { us: 1.0, india: 0.22, europe: 0.82, uk: 0.87, canada: 0.82, singapore: 0.74, australia: 0.79, uae: 0.69 },
    category: 'hr'
  },
  'total rewards manager': { 
    base: 110000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'hr'
  },
  'people operations manager': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'hr'
  },
  'director of hr': { 
    base: 145000, 
    locations: { us: 1.0, india: 0.32, europe: 0.89, uk: 0.93, canada: 0.88, singapore: 0.79, australia: 0.84, uae: 0.74 },
    category: 'hr'
  },
  'vp of people': { 
    base: 210000, 
    locations: { us: 1.0, india: 0.38, europe: 0.92, uk: 0.95, canada: 0.90, singapore: 0.85, australia: 0.88, uae: 0.78 },
    category: 'hr'
  },
  'chief people officer': { 
    base: 320000, 
    locations: { us: 1.0, india: 0.42, europe: 0.93, uk: 0.96, canada: 0.91, singapore: 0.87, australia: 0.90, uae: 0.80 },
    category: 'executive'
  },
  'talent acquisition manager': { 
    base: 100000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'hr'
  },
  'learning and development manager': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'hr'
  },

  // Legal Roles
  'legal counsel': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'legal'
  },
  'senior legal counsel': { 
    base: 175000, 
    locations: { us: 1.0, india: 0.32, europe: 0.89, uk: 0.93, canada: 0.88, singapore: 0.79, australia: 0.84, uae: 0.74 },
    category: 'legal'
  },
  'corporate lawyer': { 
    base: 145000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'legal'
  },
  'general counsel': { 
    base: 245000, 
    locations: { us: 1.0, india: 0.38, europe: 0.92, uk: 0.95, canada: 0.90, singapore: 0.85, australia: 0.88, uae: 0.78 },
    category: 'legal'
  },
  'contract manager': { 
    base: 85000, 
    locations: { us: 1.0, india: 0.24, europe: 0.84, uk: 0.89, canada: 0.84, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'legal'
  },
  'paralegal': { 
    base: 55000, 
    locations: { us: 1.0, india: 0.19, europe: 0.79, uk: 0.84, canada: 0.79, singapore: 0.71, australia: 0.76, uae: 0.66 },
    category: 'legal'
  },
  'compliance manager': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'legal'
  },
  'intellectual property lawyer': { 
    base: 155000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'legal'
  },

  // Consulting Roles
  'management consultant': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'consulting'
  },
  'senior consultant': { 
    base: 125000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'consulting'
  },
  'principal consultant': { 
    base: 165000, 
    locations: { us: 1.0, india: 0.35, europe: 0.90, uk: 0.94, canada: 0.89, singapore: 0.82, australia: 0.86, uae: 0.76 },
    category: 'consulting'
  },
  'strategy consultant': { 
    base: 110000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'consulting'
  },
  'it consultant': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'consulting'
  },
  'business consultant': { 
    base: 88000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'consulting'
  },

  // Operations & Supply Chain
  'operations manager': { 
    base: 85000, 
    locations: { us: 1.0, india: 0.24, europe: 0.84, uk: 0.89, canada: 0.84, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'operations'
  },
  'senior operations manager': { 
    base: 115000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'operations'
  },
  'director of operations': { 
    base: 155000, 
    locations: { us: 1.0, india: 0.32, europe: 0.89, uk: 0.93, canada: 0.88, singapore: 0.79, australia: 0.84, uae: 0.74 },
    category: 'operations'
  },
  'vp of operations': { 
    base: 215000, 
    locations: { us: 1.0, india: 0.38, europe: 0.92, uk: 0.95, canada: 0.90, singapore: 0.85, australia: 0.88, uae: 0.78 },
    category: 'operations'
  },
  'supply chain manager': { 
    base: 90000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'operations'
  },
  'logistics manager': { 
    base: 80000, 
    locations: { us: 1.0, india: 0.24, europe: 0.84, uk: 0.89, canada: 0.84, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'operations'
  },
  'procurement manager': { 
    base: 85000, 
    locations: { us: 1.0, india: 0.24, europe: 0.84, uk: 0.89, canada: 0.84, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'operations'
  },
  'project coordinator': { 
    base: 55000, 
    locations: { us: 1.0, india: 0.19, europe: 0.79, uk: 0.84, canada: 0.79, singapore: 0.71, australia: 0.76, uae: 0.66 },
    category: 'operations'
  },
  'office manager': { 
    base: 52000, 
    locations: { us: 1.0, india: 0.18, europe: 0.78, uk: 0.83, canada: 0.78, singapore: 0.70, australia: 0.75, uae: 0.65 },
    category: 'operations'
  },
  'facilities manager': { 
    base: 70000, 
    locations: { us: 1.0, india: 0.22, europe: 0.82, uk: 0.87, canada: 0.82, singapore: 0.74, australia: 0.79, uae: 0.69 },
    category: 'operations'
  }
} as const;import { z } from 'zod';

// Validation schema
export const salaryInsightsSchema = z.object({
  jobTitle: z.string(),
  company: z.string().optional(),
  location: z.string().optional(),
  experienceLevel: z.number().optional(),
  skills: z.array(z.string()).optional()
});

// Type definitions for better type safety
type LocationKey = 'us' | 'india' | 'europe' | 'uk' | 'canada' | 'singapore' | 'australia' | 'uae';
type CurrencyCode = 'USD' | 'INR' | 'EUR' | 'GBP' | 'CAD' | 'SGD' | 'AUD' | 'AED';

interface RoleData {
  base: number;
  locations: Record<LocationKey, number>;
  category: 'engineering' | 'product' | 'design' | 'data' | 'management' | 'operations' | 'sales' | 'executive' | 'finance' | 'marketing' | 'hr' | 'legal' | 'consulting';
}

interface SalaryBreakdown {
  baseSalary: number;
  skillsBonus: number;
  equityEstimate: number;
  bonusEstimate: number;
  signingBonus?: number;
}

interface SalaryRange {
  min: number;
  median: number;
  max: number;
}

interface SalaryInsights {
  salaryRange: SalaryRange;
  currency: CurrencyCode;
  totalCompensation: number;
  breakdown: SalaryBreakdown;
  marketInsights: string;
  negotiationTips: string[];
  locationAdjustment: string;
  companyTier: string;
  experienceImpact: string;
  careerProgression?: string[];
  industryTrends?: string[];
}

// Comprehensive role-based salary database (in USD)
const SALARY_DATABASE: Record<string, RoleData> = {
  // Engineering Roles
  'software engineer': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'engineering'
  },
  'senior software engineer': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'engineering'
  },
  'staff software engineer': { 
    base: 185000, 
    locations: { us: 1.0, india: 0.35, europe: 0.90, uk: 0.94, canada: 0.89, singapore: 0.82, australia: 0.86, uae: 0.76 },
    category: 'engineering'
  },
  'principal engineer': { 
    base: 225000, 
    locations: { us: 1.0, india: 0.38, europe: 0.92, uk: 0.95, canada: 0.90, singapore: 0.85, australia: 0.88, uae: 0.78 },
    category: 'engineering'
  },
  'distinguished engineer': { 
    base: 300000, 
    locations: { us: 1.0, india: 0.40, europe: 0.93, uk: 0.96, canada: 0.91, singapore: 0.87, australia: 0.90, uae: 0.80 },
    category: 'engineering'
  },
  'ai engineer': { 
    base: 145000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'ml engineer': { 
    base: 140000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'mlops engineer': { 
    base: 150000, 
    locations: { us: 1.0, india: 0.29, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'engineering'
  },
  'data scientist': { 
    base: 120000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'data'
  },
  'senior data scientist': { 
    base: 160000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'data'
  },
  'research scientist': { 
    base: 155000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'data'
  },
  'frontend developer': { 
    base: 90000, 
    locations: { us: 1.0, india: 0.24, europe: 0.84, uk: 0.89, canada: 0.84, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'engineering'
  },
  'backend developer': { 
    base: 98000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'full stack developer': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'devops engineer': { 
    base: 115000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'site reliability engineer': { 
    base: 130000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'platform engineer': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.29, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'engineering'
  },
  'mobile developer': { 
    base: 102000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'ios developer': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'android developer': { 
    base: 102000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'embedded systems engineer': { 
    base: 110000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'firmware engineer': { 
    base: 108000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'cloud architect': { 
    base: 145000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'engineering'
  },
  'security engineer': { 
    base: 125000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'cybersecurity analyst': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'penetration tester': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'solutions architect': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.29, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'engineering'
  },
  'technical lead': { 
    base: 140000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'engineering'
  },
  'engineering manager': { 
    base: 155000, 
    locations: { us: 1.0, india: 0.32, europe: 0.89, uk: 0.93, canada: 0.88, singapore: 0.79, australia: 0.84, uae: 0.74 },
    category: 'management'
  },
  'senior engineering manager': { 
    base: 195000, 
    locations: { us: 1.0, india: 0.35, europe: 0.90, uk: 0.94, canada: 0.89, singapore: 0.82, australia: 0.86, uae: 0.76 },
    category: 'management'
  },
  'director of engineering': { 
    base: 235000, 
    locations: { us: 1.0, india: 0.38, europe: 0.92, uk: 0.95, canada: 0.90, singapore: 0.85, australia: 0.88, uae: 0.78 },
    category: 'management'
  },
  'vp of engineering': { 
    base: 300000, 
    locations: { us: 1.0, india: 0.42, europe: 0.93, uk: 0.96, canada: 0.91, singapore: 0.87, australia: 0.90, uae: 0.80 },
    category: 'executive'
  },
  'cto': { 
    base: 400000, 
    locations: { us: 1.0, india: 0.45, europe: 0.94, uk: 0.97, canada: 0.92, singapore: 0.90, australia: 0.92, uae: 0.82 },
    category: 'executive'
  },

  // Product & Design
  'product manager': { 
    base: 125000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'product'
  },
  'senior product manager': { 
    base: 165000, 
    locations: { us: 1.0, india: 0.33, europe: 0.89, uk: 0.93, canada: 0.88, singapore: 0.80, australia: 0.84, uae: 0.74 },
    category: 'product'
  },
  'product lead': { 
    base: 185000, 
    locations: { us: 1.0, india: 0.35, europe: 0.90, uk: 0.94, canada: 0.89, singapore: 0.82, australia: 0.86, uae: 0.76 },
    category: 'product'
  },
  'group product manager': { 
    base: 210000, 
    locations: { us: 1.0, india: 0.37, europe: 0.91, uk: 0.95, canada: 0.90, singapore: 0.84, australia: 0.87, uae: 0.77 },
    category: 'product'
  },
  'director of product': { 
    base: 245000, 
    locations: { us: 1.0, india: 0.40, europe: 0.92, uk: 0.95, canada: 0.90, singapore: 0.85, australia: 0.88, uae: 0.78 },
    category: 'management'
  },
  'vp of product': { 
    base: 310000, 
    locations: { us: 1.0, india: 0.42, europe: 0.93, uk: 0.96, canada: 0.91, singapore: 0.87, australia: 0.90, uae: 0.80 },
    category: 'executive'
  },
  'cpo': { 
    base: 420000, 
    locations: { us: 1.0, india: 0.45, europe: 0.94, uk: 0.97, canada: 0.92, singapore: 0.90, australia: 0.92, uae: 0.82 },
    category: 'executive'
  },
  'product designer': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'design'
  },
  'ui/ux designer': { 
    base: 85000, 
    locations: { us: 1.0, india: 0.24, europe: 0.84, uk: 0.89, canada: 0.84, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'design'
  },
  'senior product designer': { 
    base: 130000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'design'
  },
  'design lead': { 
    base: 150000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'design'
  },
  'head of design': { 
    base: 190000, 
    locations: { us: 1.0, india: 0.35, europe: 0.90, uk: 0.94, canada: 0.89, singapore: 0.82, australia: 0.86, uae: 0.76 },
    category: 'management'
  },

  // Data & Analytics
  'data analyst': { 
    base: 75000, 
    locations: { us: 1.0, india: 0.22, europe: 0.82, uk: 0.87, canada: 0.82, singapore: 0.74, australia: 0.79, uae: 0.69 },
    category: 'data'
  },
  'senior data analyst': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'data'
  },
  'data engineer': { 
    base: 115000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'data'
  },
  'senior data engineer': { 
    base: 145000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'data'
  },
  'analytics engineer': { 
    base: 110000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'data'
  },
  'business intelligence analyst': { 
    base: 82000, 
    locations: { us: 1.0, india: 0.23, europe: 0.83, uk: 0.88, canada: 0.83, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'data'
  },
  'business analyst': { 
    base: 80000, 
    locations: { us: 1.0, india: 0.23, europe: 0.83, uk: 0.88, canada: 0.83, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'data'
  },

  // QA & Testing
  'qa engineer': { 
    base: 78000, 
    locations: { us: 1.0, india: 0.23, europe: 0.83, uk: 0.88, canada: 0.83, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'engineering'
  },
  'senior qa engineer': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'qa automation engineer': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },
  'sdet': { 
    base: 102000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'engineering'
  },

  // Sales & Business
  'sales engineer': { 
    base: 110000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'sales'
  },
  'solutions consultant': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'sales'
  },
  'account executive': { 
    base: 95000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'sales'
  },
  'enterprise account executive': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.35, europe: 0.90, uk: 0.94, canada: 0.89, singapore: 0.82, australia: 0.86, uae: 0.76 },
    category: 'sales'
  },
  'customer success manager': { 
    base: 85000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'operations'
  },
  'technical account manager': { 
    base: 98000, 
    locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'operations'
  },

  // Specialized Roles
  'blockchain developer': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.29, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'engineering'
  },
  'smart contract developer': { 
    base: 140000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'engineering'
  },
  'quantitative analyst': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'data'
  },
  'game developer': { 
    base: 92000, 
    locations: { us: 1.0, india: 0.24, europe: 0.84, uk: 0.89, canada: 0.84, singapore: 0.75, australia: 0.80, uae: 0.70 },
    category: 'engineering'
  },
  'graphics engineer': { 
    base: 115000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'computer vision engineer': { 
    base: 145000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'nlp engineer': { 
    base: 145000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'robotics engineer': { 
    base: 125000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'engineering'
  },
  'technical writer': { 
    base: 75000, 
    locations: { us: 1.0, india: 0.22, europe: 0.82, uk: 0.87, canada: 0.82, singapore: 0.74, australia: 0.79, uae: 0.69 },
    category: 'operations'
  },
  'developer advocate': { 
    base: 115000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'operations'
  },
  'technical program manager': { 
    base: 135000, 
    locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 },
    category: 'management'
  },
  'program manager': { 
    base: 110000, 
    locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'management'
  },
  'scrum master': { 
    base: 90000, 
    locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 },
    category: 'management'
  },
  'agile coach': { 
    base: 105000, 
    locations: { us: 1.0, india: 0.27, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 },
    category: 'management'
  },

  // Executive & C-Suite
  'ceo': { 
    base: 500000, 
    locations: { us: 1.0, india: 0.50, europe: 0.95, uk: 0.98, canada: 0.93, singapore: 0.92, australia: 0.94, uae: 0.85 },
    category: 'executive'
  },
  'cfo': { 
    base: 380000, 
    locations: { us: 1.0, india: 0.45, europe: 0.94, uk: 0.97, canada: 0.92, singapore: 0.90, australia: 0.92, uae: 0.82 },
    category: 'executive'
  },
  'coo': { 
    base: 360000, 
    locations: { us: 1.0, india: 0.45, europe: 0.94, uk: 0.97, canada: 0.92, singapore: 0.90, australia: 0.92, uae: 0.82 },
    category: 'executive'
  },
  'ciso': { 
    base: 350000, 
    locations: { us: 1.0, india: 0.42, europe: 0.93, uk: 0.96, canada: 0.91, singapore: 0.87, australia: 0.90, uae: 0.80 },
    category: 'executive'
  },
  'cmo': { 
    base: 340000, 
    locations: { us: 1.0, india: 0.42, europe: 0.93, uk: 0.96, canada: 0.91, singapore: 0.87, australia: 0.90, uae: 0.80 },
    category: 'executive'
  }
} as const;

// Expanded top tech companies
const TOP_COMPANIES = [
  'google', 'meta', 'facebook', 'amazon', 'microsoft', 'apple', 'netflix', 'uber', 'airbnb',
  'tesla', 'nvidia', 'spacex', 'stripe', 'databricks', 'openai', 'anthropic', 'deepmind',
  'salesforce', 'oracle', 'adobe', 'shopify', 'snap', 'twitter', 'x corp', 'coinbase',
  'bytedance', 'tiktok', 'linkedin', 'pinterest', 'reddit', 'discord', 'roblox', 'epic games'
] as const;

// Comprehensive high-demand skills bonus
const SKILLS_BONUS: Record<string, number> = {
  // AI/ML
  'ai': 8000, 
  'machine learning': 8000, 
  'deep learning': 8000,
  'pytorch': 7000,
  'tensorflow': 7000,
  'llm': 10000,
  'large language models': 10000,
  'gpt': 9000,
  'transformers': 8000,
  'computer vision': 8000,
  'nlp': 8000,
  'reinforcement learning': 9000,

  // Cloud
  'aws': 6000, 
  'azure': 6000, 
  'gcp': 6000,
  'cloud': 5000,

  // DevOps/Infrastructure
  'kubernetes': 7000, 
  'docker': 5000,
  'terraform': 6000,
  'ansible': 5000,
  'jenkins': 4000,
  'ci/cd': 5000,
  'microservices': 6000,

  // Frontend
  'react': 5000, 
  'angular': 5000, 
  'vue': 5000,
  'nextjs': 6000,
  'typescript': 5000,
  'graphql': 5000,
  'tailwind': 4000,

  // Backend
  'python': 4000, 
  'java': 4000, 
  'go': 6000, 
  'rust': 7000,
  'scala': 6000,
  'kotlin': 5000,
  'nodejs': 5000,
  'express': 4000,
  'django': 5000,
  'flask': 4000,
  'spring': 5000,

  // Blockchain/Web3
  'blockchain': 10000, 
  'web3': 10000,
  'solidity': 11000,
  'ethereum': 10000,
  'smart contracts': 10000,
  'defi': 11000,

  // Data
  'spark': 6000,
  'hadoop': 5000,
  'kafka': 6000,
  'airflow': 5000,
  'dbt': 5000,
  'snowflake': 6000,
  'databricks': 6000,
  'bigquery': 5000,

  // Databases
  'postgresql': 4000,
  'mongodb': 4000,
  'redis': 4000,
  'elasticsearch': 5000,
  'cassandra': 5000,

  // Security
  'security': 6000,
  'penetration testing': 7000,
  'cryptography': 7000,
  'zero trust': 6000,

  // Specialized
  'quantitative': 8000,
  'high frequency trading': 10000,
  'embedded': 6000,
  'fpga': 7000,
  'cuda': 7000,
  'webgl': 6000,
  'webassembly': 7000,

  // Finance & Business Skills
  'financial modeling': 6000,
  'valuation': 5000,
  'excel': 3000,
  'power bi': 4000,
  'tableau': 4000,
  'sap': 5000,
  'quickbooks': 3000,
  'gaap': 4000,
  'ifrs': 4000,
  'cfa': 7000,
  'cpa': 6000,
  'investment banking': 8000,
  'private equity': 9000,
  'venture capital': 8000,

  // Marketing Skills
  'seo': 4000,
  'sem': 4000,
  'google analytics': 3000,
  'google ads': 4000,
  'facebook ads': 4000,
  'hubspot': 4000,
  'salesforce': 5000,
  'marketo': 4000,
  'content strategy': 4000,
  'social media marketing': 3000,
  'growth hacking': 5000,
  'a/b testing': 4000,
  'conversion optimization': 5000,

  // Sales Skills
  'crm': 3000,
  'salesforce crm': 4000,
  'enterprise sales': 6000,
  'b2b sales': 5000,
  'saas sales': 6000,
  'account management': 4000,

  // HR Skills
  'workday': 4000,
  'adp': 3000,
  'hris': 4000,
  'talent acquisition': 4000,
  'organizational development': 4000,

  // Legal Skills
  'contract law': 5000,
  'intellectual property': 6000,
  'litigation': 6000,
  'corporate law': 5000,
  'regulatory compliance': 5000
} as const;

// Constants for better maintainability
const CONSTANTS = {
  EXPERIENCE_MULTIPLIER: 0.08,
  TOP_COMPANY_BONUS: 1.5,
  STARTUP_EQUITY_MULTIPLIER: 0.35,
  SALARY_RANGE_MIN: 0.85,
  SALARY_RANGE_MAX: 1.15,
  EQUITY_MULTIPLIER: 0.25,
  BONUS_MULTIPLIER: 0.15,
  SIGNING_BONUS_SENIOR: 0.20,
  REMOTE_WORK_PREMIUM: 1.10
} as const;

// Currency conversion rates
const CURRENCY_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  INR: 83,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.35,
  SGD: 1.34,
  AUD: 1.52,
  AED: 3.67
} as const;

// Location detection config
const LOCATION_MAPPINGS: Array<{
  keywords: string[];
  region: LocationKey;
  currency: CurrencyCode;
}> = [
  {
    keywords: ['india', 'bangalore', 'mumbai', 'delhi', 'hyderabad', 'pune', 'chennai', 'kolkata', 'bengaluru'],
    region: 'india',
    currency: 'INR'
  },
  {
    keywords: ['uk', 'london', 'manchester', 'edinburgh', 'birmingham', 'bristol', 'cambridge'],
    region: 'uk',
    currency: 'GBP'
  },
  {
    keywords: ['europe', 'berlin', 'paris', 'amsterdam', 'madrid', 'barcelona', 'munich', 'dublin', 'zurich'],
    region: 'europe',
    currency: 'EUR'
  },
  {
    keywords: ['canada', 'toronto', 'vancouver', 'montreal', 'calgary', 'ottawa'],
    region: 'canada',
    currency: 'CAD'
  },
  {
    keywords: ['singapore', 'sg'],
    region: 'singapore',
    currency: 'SGD'
  },
  {
    keywords: ['australia', 'sydney', 'melbourne', 'brisbane', 'perth'],
    region: 'australia',
    currency: 'AUD'
  },
  {
    keywords: ['uae', 'dubai', 'abu dhabi', 'emirates'],
    region: 'uae',
    currency: 'AED'
  }
];

// Career progression paths
const CAREER_PATHS: Record<string, string[]> = {
  'software engineer': [
    'Senior Software Engineer (3-5 years)',
    'Staff Software Engineer (5-8 years)',
    'Principal Engineer (8-12 years)',
    'Distinguished Engineer (12+ years)'
  ],
  'data scientist': [
    'Senior Data Scientist (3-5 years)',
    'Lead Data Scientist (5-8 years)',
    'Principal Data Scientist (8-12 years)',
    'Director of Data Science (10+ years)'
  ],
  'product manager': [
    'Senior Product Manager (3-5 years)',
    'Lead Product Manager (5-7 years)',
    'Group Product Manager (7-10 years)',
    'Director of Product (10+ years)',
    'VP of Product (12+ years)'
  ],
  'engineering manager': [
    'Senior Engineering Manager (3-5 years)',
    'Director of Engineering (5-8 years)',
    'VP of Engineering (8-12 years)',
    'CTO (12+ years)'
  ],
  'financial analyst': [
    'Senior Financial Analyst (3-5 years)',
    'Finance Manager (5-7 years)',
    'Senior Finance Manager (7-10 years)',
    'Director of Finance (10+ years)',
    'VP of Finance / CFO (12+ years)'
  ],
  'accountant': [
    'Senior Accountant (3-5 years)',
    'Accounting Manager (5-7 years)',
    'Controller (7-10 years)',
    'Director of Finance (10+ years)',
    'CFO (12+ years)'
  ],
  'marketing coordinator': [
    'Marketing Specialist (2-3 years)',
    'Marketing Manager (4-6 years)',
    'Senior Marketing Manager (6-9 years)',
    'Marketing Director (9-12 years)',
    'VP of Marketing (12+ years)'
  ],
  'sales development representative': [
    'Account Executive (2-3 years)',
    'Senior Account Executive (4-6 years)',
    'Sales Manager (6-8 years)',
    'Director of Sales (8-11 years)',
    'VP of Sales (11+ years)'
  ],
  'hr coordinator': [
    'HR Generalist (2-3 years)',
    'HR Manager (4-6 years)',
    'Senior HR Manager (6-9 years)',
    'Director of HR (9-12 years)',
    'VP of People / CHRO (12+ years)'
  ],
  'recruiter': [
    'Senior Recruiter (3-5 years)',
    'Recruiting Manager (5-7 years)',
    'Talent Acquisition Manager (7-10 years)',
    'Director of Talent (10+ years)'
  ],
  'designer': [
    'Senior Designer (3-5 years)',
    'Lead Designer (5-7 years)',
    'Design Manager (7-10 years)',
    'Head of Design (10+ years)'
  ],
  'legal counsel': [
    'Senior Legal Counsel (3-5 years)',
    'Lead Counsel (5-8 years)',
    'General Counsel (8+ years)'
  ],
  'management consultant': [
    'Senior Consultant (3-4 years)',
    'Principal Consultant (5-7 years)',
    'Partner (8+ years)'
  ]
};

export class SalaryInsightsService {

  generateInsights(data: z.infer<typeof salaryInsightsSchema>): SalaryInsights {
    const { jobTitle, company, location, experienceLevel = 0, skills = [] } = data;

    const roleData = this.findRoleData(jobTitle);
    let baseSalary = this.calculateBaseSalary(roleData, experienceLevel);

    const { region, currency, multiplier } = this.detectLocation(location, roleData);
    baseSalary *= multiplier;

    const isTopCompany = this.isTopTierCompany(company);
    if (isTopCompany) {
      baseSalary *= CONSTANTS.TOP_COMPANY_BONUS;
    }

    const skillsBonus = this.calculateSkillsBonus(skills, multiplier);
    const totalComp = Math.round(baseSalary + skillsBonus);
    const localTotal = Math.round(totalComp * CURRENCY_RATES[currency]);

    const salaryRange = this.calculateSalaryRange(localTotal);
    const breakdown = this.createBreakdown(baseSalary, skillsBonus, totalComp, isTopCompany, experienceLevel);
    const marketInsights = this.generateMarketInsights(region, jobTitle, experienceLevel, isTopCompany, roleData.category);
    const negotiationTips = this.generateNegotiationTips(region, experienceLevel, skills, roleData.category);
    const careerProgression = this.getCareerProgression(jobTitle);
    const industryTrends = this.getIndustryTrends(roleData.category, skills);

    const experienceMultiplier = 1 + (experienceLevel * CONSTANTS.EXPERIENCE_MULTIPLIER);

    return {
      salaryRange,
      currency,
      totalCompensation: localTotal,
      breakdown,
      marketInsights,
      negotiationTips,
      careerProgression,
      industryTrends,
      locationAdjustment: `${region.toUpperCase()} salary adjusted by ${this.formatPercentage(multiplier - 1)}`,
      companyTier: isTopCompany ? 'Top Tier (FAANG+)' : 'Standard',
      experienceImpact: `+${this.formatPercentage(experienceMultiplier - 1)} for ${experienceLevel} years experience`
    };
  }

  private findRoleData(jobTitle: string): RoleData {
    const normalizedTitle = jobTitle.toLowerCase().trim();

    // Exact match
    if (SALARY_DATABASE[normalizedTitle]) {
      return SALARY_DATABASE[normalizedTitle];
    }

    // Fuzzy match
    for (const [role, data] of Object.entries(SALARY_DATABASE)) {
      if (normalizedTitle.includes(role) || role.includes(normalizedTitle)) {
        return data;
      }
    }

    // Default fallback
    return SALARY_DATABASE['software engineer'];
  }

  private calculateBaseSalary(roleData: RoleData, experienceLevel: number): number {
    const experienceMultiplier = 1 + (experienceLevel * CONSTANTS.EXPERIENCE_MULTIPLIER);
    return roleData.base * experienceMultiplier;
  }

  private detectLocation(location: string | undefined, roleData: RoleData): {
    region: LocationKey;
    currency: CurrencyCode;
    multiplier: number;
  } {
    const locationLower = location?.toLowerCase().trim() || '';

    for (const mapping of LOCATION_MAPPINGS) {
      if (mapping.keywords.some(keyword => locationLower.includes(keyword))) {
        return {
          region: mapping.region,
          currency: mapping.currency,
          multiplier: roleData.locations[mapping.region]
        };
      }
    }

    // Default to US
    return {
      region: 'us',
      currency: 'USD',
      multiplier: 1.0
    };
  }

  private isTopTierCompany(company: string | undefined): boolean {
    if (!company) return false;
    const companyLower = company.toLowerCase().trim();
    return TOP_COMPANIES.some(tc => companyLower.includes(tc));
  }

  private calculateSkillsBonus(skills: string[], locationMultiplier: number): number {
    let bonus = 0;
    const processedSkills = new Set<string>();

    for (const skill of skills) {
      const skillLower = skill.toLowerCase().trim();

      for (const [bonusSkill, bonusAmount] of Object.entries(SKILLS_BONUS)) {
        if (skillLower.includes(bonusSkill) && !processedSkills.has(bonusSkill)) {
          bonus += bonusAmount * locationMultiplier;
          processedSkills.add(bonusSkill);
        }
      }
    }

    return bonus;
  }

  private calculateSalaryRange(median: number): SalaryRange {
    return {
      min: Math.round(median * CONSTANTS.SALARY_RANGE_MIN),
      median,
      max: Math.round(median * CONSTANTS.SALARY_RANGE_MAX)
    };
  }

  private createBreakdown(
    baseSalary: number, 
    skillsBonus: number, 
    totalComp: number, 
    isTopCompany: boolean,
    experienceLevel: number
  ): SalaryBreakdown {
    const breakdown: SalaryBreakdown = {
      baseSalary: Math.round(baseSalary),
      skillsBonus: Math.round(skillsBonus),
      equityEstimate: isTopCompany ? Math.round(totalComp * CONSTANTS.EQUITY_MULTIPLIER) : 0,
      bonusEstimate: Math.round(totalComp * CONSTANTS.BONUS_MULTIPLIER)
    };

    if (experienceLevel >= 5) {
      breakdown.signingBonus = Math.round(totalComp * CONSTANTS.SIGNING_BONUS_SENIOR);
    }

    return breakdown;
  }

  private formatPercentage(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  private getCareerProgression(jobTitle: string): string[] | undefined {
    const normalizedTitle = jobTitle.toLowerCase().trim();

    for (const [path, progression] of Object.entries(CAREER_PATHS)) {
      if (normalizedTitle.includes(path) || path.includes(normalizedTitle)) {
        return progression;
      }
    }

    return undefined;
  }

  private getIndustryTrends(category: string, skills: string[]): string[] {
    const trends: string[] = [];

    const skillsLower = skills.map(s => s.toLowerCase());

    // AI/ML trends
    if (skillsLower.some(s => ['ai', 'ml', 'llm', 'deep learning'].some(k => s.includes(k)))) {
      trends.push('AI/ML roles seeing 30-40% salary growth year-over-year');
      trends.push('LLM expertise in extremely high demand with limited talent pool');
    }

    // Blockchain trends
    if (skillsLower.some(s => ['blockchain', 'web3', 'solidity'].some(k => s.includes(k)))) {
      trends.push('Web3 market stabilizing with focus on real-world applications');
      trends.push('DeFi and smart contract auditing roles commanding premium');
    }

    // Cloud trends
    if (skillsLower.some(s => ['aws', 'azure', 'gcp', 'kubernetes'].some(k => s.includes(k)))) {
      trends.push('Multi-cloud expertise increasingly valuable');
      trends.push('FinOps and cloud cost optimization in high demand');
    }

    // Category-specific trends
    switch (category) {
      case 'engineering':
        trends.push('Remote-first engineering roles offering 10-15% premium');
        trends.push('Full-stack developers with cloud skills most sought after');
        break;
      case 'data':
        trends.push('Data engineering outpacing data science in demand');
        trends.push('Real-time analytics and streaming platforms critical');
        break;
      case 'product':
        trends.push('AI product managers commanding 20% premium');
        trends.push('B2B SaaS product experience highly valued');
        break;
      case 'executive':
        trends.push('Executive compensation increasingly equity-heavy');
        trends.push('Experience scaling 0-to-1 products premium skill');
        break;
      case 'finance':
        trends.push('FP&A and strategic finance roles in high demand');
        trends.push('Fintech experience commanding 15-20% premium');
        trends.push('Automation and data analytics skills increasingly important');
        break;
      case 'marketing':
        trends.push('Growth marketing and performance marketing leading demand');
        trends.push('AI-powered marketing tools expertise valued');
        trends.push('Content marketing ROI measurement critical');
        break;
      case 'sales':
        trends.push('SaaS and enterprise sales roles seeing 20% growth');
        trends.push('Product-led growth changing traditional sales models');
        trends.push('Revenue operations roles emerging as critical');
        break;
      case 'hr':
        trends.push('People analytics and data-driven HR in high demand');
        trends.push('Remote work policies creating new specializations');
        trends.push('DEI roles seeing increased investment');
        break;
      case 'legal':
        trends.push('Privacy and data protection expertise premium');
        trends.push('Tech-focused legal counsel in high demand');
        trends.push('Contract automation and legal tech adoption growing');
        break;
      case 'consulting':
        trends.push('Digital transformation consulting driving growth');
        trends.push('Industry-specific expertise commanding premium');
        trends.push('Hybrid consulting models (remote + on-site) emerging');
        break;
    }

    return trends.length > 0 ? trends : ['Market conditions stable with steady growth'];
  }

  private generateMarketInsights(
    region: string, 
    role: string, 
    experience: number, 
    isTopCompany: boolean,
    category: string
  ): string {
    const insights: Record<string, string> = {
      us: `Strong demand in US tech hubs (SF, NYC, Seattle, Austin). ${isTopCompany ? 'Top companies offer 50% premium.' : 'Growing startup ecosystem with competitive equity.'} ${experience > 5 ? 'Senior roles command significant premium.' : 'Entry-level competition high but improving.'}`,
      india: `Rapidly growing tech market in India. ${isTopCompany ? 'MNCs offer competitive packages with global parity increasing.' : 'Startups offering equity compensation and ESOPs.'} Remote work increasing salaries by 20-30%. Tier-1 cities seeing salary inflation.`,
      europe: `European tech scene expanding rapidly. ${isTopCompany ? 'FAANG presence strong in major cities with competitive packages.' : 'Strong work-life balance culture valued over pure compensation.'} ${experience > 3 ? 'Senior talent shortage driving up salaries.' : 'Growing junior market with emphasis on fundamentals.'}`,
      uk: `London remains European tech hub with fintech dominance. ${isTopCompany ? 'Competitive with US salaries post-Brexit.' : 'Fintech and AI sectors booming.'} Brexit creating hiring challenges but also opportunities.`,
      canada: `Toronto and Vancouver leading North American growth. ${isTopCompany ? 'US companies expanding north with near-parity compensation.' : 'Growing AI/ML sector driven by research institutions.'} Immigration-friendly policies attracting global talent.`,
      singapore: `Southeast Asia's tech hub with strong fintech presence. ${isTopCompany ? 'Regional HQs offering competitive packages.' : 'Growing startup ecosystem backed by government.'} Tax advantages make total comp attractive.`,
      australia: `Tech market growing with focus on fintech and e-commerce. ${isTopCompany ? 'Global companies establishing presence.' : 'Strong domestic tech scene emerging.'} Remote work bridging salary gaps with US.`,
      uae: `Dubai emerging as Middle East tech hub. ${isTopCompany ? 'Global expansion driving competitive packages.' : 'Tax-free salaries attractive for expats.'} Growing focus on AI and smart city initiatives.`
    };

    return insights[region] || insights.us;
  }

  private generateNegotiationTips(region: string, experience: number, skills: string[], category: string): string[] {
    const tips = [
      'Research company salary bands on Glassdoor, Levels.fyi, and Blind',
      'Highlight your unique skill combinations and measurable impact',
      'Consider total compensation (base + equity + bonus + benefits) not just base salary',
      'Use competing offers as leverage but maintain professionalism'
    ];

    // Experience-based tips
    if (experience > 5) {
      tips.push('Emphasize leadership experience, mentorship, and cross-team impact');
      tips.push('Negotiate for sign-on bonus to bridge gap between current and target comp');
      tips.push('Consider title negotiation alongside compensation for senior roles');
    } else if (experience < 2) {
      tips.push('Focus on growth potential and learning opportunities alongside salary');
      tips.push('Negotiate for professional development budget and conference attendance');
    }

    // Skills-based tips
    const skillsLower = skills.map(s => s.toLowerCase());
    const hasHighDemandSkills = skillsLower.some(s => 
      ['ai', 'ml', 'llm', 'blockchain', 'web3', 'rust', 'go'].some(keyword => s.includes(keyword))
    );

    if (hasHighDemandSkills) {
      tips.push('High-demand skills - aim for 15-25% above standard market rate');
      tips.push('Leverage scarcity of your skill set in current market');
    }

    // Region-specific tips
    switch (region) {
      case 'india':
        tips.push('Negotiate for stock options/ESOPs if joining startup');
        tips.push('Consider relocation bonus and housing allowance for tier-1 cities');
        tips.push('Ask about variable pay structure and performance bonuses');
        break;
      case 'us':
        tips.push('Equity refresh grants are negotiable for senior positions');
        tips.push('Request relocation package if moving to high-cost area');
        break;
      case 'singapore':
      case 'uae':
        tips.push('Factor in tax advantages when comparing offers');
        tips.push('Negotiate for annual flight allowances for expat packages');
        break;
    }

    // Category-specific tips
    if (category === 'executive') {
      tips.push('Executive comp heavily weighted toward equity - negotiate for better strike price');
      tips.push('Request board seat or observer rights for strategic roles');
    } else if (category === 'sales') {
      tips.push('Negotiate commission structure and accelerators carefully');
      tips.push('Clarify quota setting process and historical attainment rates');
    } else if (category === 'finance') {
      tips.push('Certifications like CPA/CFA can justify 10-15% premium');
      tips.push('Negotiate for professional development and certification reimbursement');
    } else if (category === 'marketing') {
      tips.push('Demonstrate ROI impact with concrete metrics and case studies');
      tips.push('Growth marketing expertise can command significant premium');
    } else if (category === 'hr') {
      tips.push('SHRM or HRCI certifications add negotiating leverage');
      tips.push('People analytics skills increasingly valuable');
    } else if (category === 'legal') {
      tips.push('Specialized expertise (IP, privacy, M&A) commands premium');
      tips.push('Bar admission in multiple jurisdictions increases value');
    } else if (category === 'consulting') {
      tips.push('MBA from top school can justify 20-30% premium');
      tips.push('Industry certifications and specializations valued');
    }

    return tips;
  }
}

export const salaryInsightsService = new SalaryInsightsService();