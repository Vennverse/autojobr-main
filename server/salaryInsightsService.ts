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

// Constants
const CONSTANTS = {
  EXPERIENCE_MULTIPLIER: 0.08,
  TOP_COMPANY_BONUS: 1.5,
  EQUITY_MULTIPLIER: 0.4,
  BONUS_MULTIPLIER: 0.15,
  SIGNING_BONUS_SENIOR: 0.2,
  SALARY_RANGE_MIN: 0.85,
  SALARY_RANGE_MAX: 1.15
};

const CURRENCY_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  INR: 83,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  SGD: 1.34,
  AUD: 1.53,
  AED: 3.67
};

const TOP_COMPANIES = [
  'google', 'facebook', 'meta', 'amazon', 'apple', 'microsoft', 'netflix',
  'uber', 'airbnb', 'stripe', 'tesla', 'spacex', 'openai', 'anthropic'
];

const SKILLS_BONUS: Record<string, number> = {
  'ai': 15000, 'ml': 12000, 'llm': 18000, 'deep learning': 14000,
  'react': 5000, 'typescript': 5000, 'node': 5000, 'python': 4000,
  'aws': 8000, 'kubernetes': 10000, 'docker': 5000,
  'blockchain': 12000, 'web3': 12000, 'rust': 10000, 'go': 8000
};

const LOCATION_MAPPINGS = [
  { region: 'india' as LocationKey, currency: 'INR' as CurrencyCode, keywords: ['india', 'bangalore', 'mumbai', 'delhi', 'hyderabad', 'pune', 'chennai'] },
  { region: 'uk' as LocationKey, currency: 'GBP' as CurrencyCode, keywords: ['uk', 'london', 'manchester', 'edinburgh', 'united kingdom'] },
  { region: 'europe' as LocationKey, currency: 'EUR' as CurrencyCode, keywords: ['berlin', 'paris', 'amsterdam', 'madrid', 'barcelona', 'munich', 'zurich'] },
  { region: 'canada' as LocationKey, currency: 'CAD' as CurrencyCode, keywords: ['canada', 'toronto', 'vancouver', 'montreal', 'ottawa'] },
  { region: 'singapore' as LocationKey, currency: 'SGD' as CurrencyCode, keywords: ['singapore'] },
  { region: 'australia' as LocationKey, currency: 'AUD' as CurrencyCode, keywords: ['australia', 'sydney', 'melbourne', 'brisbane'] },
  { region: 'uae' as LocationKey, currency: 'AED' as CurrencyCode, keywords: ['uae', 'dubai', 'abu dhabi'] },
  { region: 'us' as LocationKey, currency: 'USD' as CurrencyCode, keywords: ['us', 'usa', 'united states', 'san francisco', 'new york', 'seattle', 'austin'] }
];

const SALARY_DATABASE: Record<string, RoleData> = {
  'software engineer': { base: 95000, locations: { us: 1.0, india: 0.25, europe: 0.85, uk: 0.90, canada: 0.85, singapore: 0.75, australia: 0.80, uae: 0.70 }, category: 'engineering' },
  'senior software engineer': { base: 135000, locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 }, category: 'engineering' },
  'ai engineer': { base: 145000, locations: { us: 1.0, india: 0.28, europe: 0.87, uk: 0.91, canada: 0.86, singapore: 0.77, australia: 0.82, uae: 0.72 }, category: 'engineering' },
  'data scientist': { base: 120000, locations: { us: 1.0, india: 0.26, europe: 0.86, uk: 0.90, canada: 0.85, singapore: 0.76, australia: 0.81, uae: 0.71 }, category: 'data' },
  'product manager': { base: 125000, locations: { us: 1.0, india: 0.30, europe: 0.88, uk: 0.92, canada: 0.87, singapore: 0.78, australia: 0.83, uae: 0.73 }, category: 'product' }
};

const CAREER_PATHS: Record<string, string[]> = {
  'software engineer': ['Senior Software Engineer', 'Staff Engineer', 'Principal Engineer', 'Engineering Manager'],
  'data scientist': ['Senior Data Scientist', 'Lead Data Scientist', 'Principal Data Scientist', 'Director of Data Science']
};

export class SalaryInsightsService {
  generateInsights(data: z.infer<typeof salaryInsightsSchema>): SalaryInsights {
    const { jobTitle, company, location, experienceLevel = 0, skills = [] } = data;

    let roleData = this.findRoleData(jobTitle);

    // If no role data found, use software engineer as fallback
    if (!roleData) {
      console.log(`Role data not found for: ${jobTitle}, using fallback`);
      roleData = SALARY_DATABASE['software engineer'];
    }

    // Ensure we have valid role data
    if (!roleData) {
      // Ultimate fallback with explicit default values
      const defaultSalary = 85000;
      const salaryRange = {
        min: Math.round(defaultSalary * 0.85),
        median: defaultSalary,
        max: Math.round(defaultSalary * 1.15)
      };
      return {
        salaryRange,
        currency: 'USD',
        totalCompensation: defaultSalary,
        breakdown: {
          baseSalary: defaultSalary,
          skillsBonus: 0,
          equityEstimate: 0,
          bonusEstimate: Math.round(defaultSalary * 0.15)
        },
        marketInsights: `Based on general market data for similar positions. The role "${jobTitle}" is not in our database, so we're providing estimated ranges based on comparable positions. Actual salary may vary significantly based on company size, location, industry, and specific requirements.`,
        negotiationTips: this.generateNegotiationTips('us', experienceLevel, skills, 'engineering'),
        locationAdjustment: 'US national average (estimated)',
        companyTier: company ? 'Standard' : 'Unknown',
        experienceImpact: `${experienceLevel} years experience considered`
      };
    }

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

  private findRoleData(jobTitle: string): RoleData | null {
    const normalizedTitle = jobTitle.toLowerCase().trim();

    // Direct match
    if (SALARY_DATABASE[normalizedTitle]) {
      return SALARY_DATABASE[normalizedTitle];
    }

    // Partial match
    for (const [role, data] of Object.entries(SALARY_DATABASE)) {
      if (normalizedTitle.includes(role) || role.includes(normalizedTitle)) {
        return data;
      }
    }

    // No match found - return null to trigger fallback
    return null;
  }

  private calculateBaseSalary(roleData: RoleData, experienceLevel: number): number {
    return roleData.base * (1 + experienceLevel * CONSTANTS.EXPERIENCE_MULTIPLIER);
  }

  private calculateSkillsBonus(skills: string[], locationMultiplier: number): number {
    // Edge case: Invalid or empty skills array
    if (!Array.isArray(skills) || skills.length === 0) {
      return 0;
    }

    let bonus = 0;
    const processedSkills = new Set<string>();

    for (const skill of skills) {
      // Edge case: Null, undefined, or non-string skill
      if (!skill || typeof skill !== 'string') continue;

      const skillLower = skill.toLowerCase().trim();

      // Edge case: Empty string after trim
      if (!skillLower) continue;

      // Edge case: Skill name too long (potential spam/injection)
      if (skillLower.length > 100) continue;

      for (const [bonusSkill, bonusAmount] of Object.entries(SKILLS_BONUS)) {
        if (skillLower.includes(bonusSkill) && !processedSkills.has(bonusSkill)) {
          // Edge case: Invalid bonus amount
          const validBonus = bonusAmount && !isNaN(bonusAmount) ? bonusAmount : 0;
          bonus += validBonus * locationMultiplier;
          processedSkills.add(bonusSkill);
        }
      }
    }

    // Edge case: Bonus calculation overflow or unrealistic value
    return Math.min(bonus, 100000); // Cap skills bonus at $100k
  }

  private detectLocation(location: string | undefined, roleData: RoleData) {
    // Edge case: No location provided
    if (!location) {
      return { region: 'us' as LocationKey, currency: 'USD' as CurrencyCode, multiplier: 1.0 };
    }

    // Edge case: Invalid location type
    if (typeof location !== 'string') {
      return { region: 'us' as LocationKey, currency: 'USD' as CurrencyCode, multiplier: 1.0 };
    }

    const locationLower = location.toLowerCase().trim();

    // Edge case: Empty location after trim
    if (!locationLower) {
      return { region: 'us' as LocationKey, currency: 'USD' as CurrencyCode, multiplier: 1.0 };
    }

    // Edge case: Location string too long (potential injection)
    if (locationLower.length > 200) {
      return { region: 'us' as LocationKey, currency: 'USD' as CurrencyCode, multiplier: 1.0 };
    }

    for (const mapping of LOCATION_MAPPINGS) {
      if (mapping.keywords.some(k => locationLower.includes(k))) {
        const multiplier = roleData.locations[mapping.region];

        // Edge case: Missing or invalid multiplier
        const validMultiplier = multiplier && !isNaN(multiplier) && multiplier > 0 ? multiplier : 1.0;

        return { 
          region: mapping.region, 
          currency: mapping.currency, 
          multiplier: validMultiplier 
        };
      }
    }

    return { region: 'us' as LocationKey, currency: 'USD' as CurrencyCode, multiplier: 1.0 };
  }

  private isTopTierCompany(company: string | undefined): boolean {
    return company ? TOP_COMPANIES.some(tc => company.toLowerCase().includes(tc)) : false;
  }

  private calculateSalaryRange(median: number): SalaryRange {
    // Ensure median is a valid number
    const validMedian = median && !isNaN(median) ? median : 80000;
    return {
      min: Math.round(validMedian * CONSTANTS.SALARY_RANGE_MIN),
      median: validMedian,
      max: Math.round(validMedian * CONSTANTS.SALARY_RANGE_MAX)
    };
  }

  private createBreakdown(baseSalary: number, skillsBonus: number, totalComp: number, isTopCompany: boolean, experienceLevel: number): SalaryBreakdown {
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
      if (normalizedTitle.includes(path)) return progression;
    }
    return undefined;
  }

  private getIndustryTrends(category: string, skills: string[]): string[] {
    const trends: string[] = ['Market conditions stable with steady growth'];
    const skillsLower = skills.map(s => s.toLowerCase());
    if (skillsLower.some(s => ['ai', 'ml', 'llm'].some(k => s.includes(k)))) {
      trends.push('AI/ML roles seeing 30-40% salary growth year-over-year');
    }
    return trends;
  }

  private generateMarketInsights(region: string, role: string, experience: number, isTopCompany: boolean, category: string): string {
    return `Strong demand in ${region.toUpperCase()} market. ${isTopCompany ? 'Top companies offer significant premium.' : 'Growing opportunities with competitive packages.'}`;
  }

  private generateNegotiationTips(region: string, experience: number, skills: string[], category: string): string[] {
    return [
      'Research company salary bands on Glassdoor and Levels.fyi',
      'Highlight your unique skill combinations and measurable impact',
      'Consider total compensation (base + equity + bonus)',
      'Use competing offers as leverage professionally'
    ];
  }
}

export const salaryInsightsService = new SalaryInsightsService();