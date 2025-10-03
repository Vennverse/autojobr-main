
import { z } from 'zod';

// Validation schema
export const salaryInsightsSchema = z.object({
  jobTitle: z.string(),
  company: z.string().optional(),
  location: z.string().optional(),
  experienceLevel: z.number().optional(),
  skills: z.array(z.string()).optional()
});

// Role-based salary database (in USD)
const SALARY_DATABASE: Record<string, { base: number; locations: Record<string, number> }> = {
  'software engineer': { 
    base: 95000, 
    locations: { 'us': 1.0, 'india': 0.25, 'europe': 0.85, 'uk': 0.90, 'canada': 0.85 } 
  },
  'senior software engineer': { 
    base: 135000, 
    locations: { 'us': 1.0, 'india': 0.30, 'europe': 0.88, 'uk': 0.92, 'canada': 0.87 } 
  },
  'ai engineer': { 
    base: 145000, 
    locations: { 'us': 1.0, 'india': 0.28, 'europe': 0.87, 'uk': 0.91, 'canada': 0.86 } 
  },
  'ml engineer': { 
    base: 140000, 
    locations: { 'us': 1.0, 'india': 0.28, 'europe': 0.87, 'uk': 0.91, 'canada': 0.86 } 
  },
  'data scientist': { 
    base: 120000, 
    locations: { 'us': 1.0, 'india': 0.26, 'europe': 0.86, 'uk': 0.90, 'canada': 0.85 } 
  },
  'frontend developer': { 
    base: 90000, 
    locations: { 'us': 1.0, 'india': 0.24, 'europe': 0.84, 'uk': 0.89, 'canada': 0.84 } 
  },
  'backend developer': { 
    base: 98000, 
    locations: { 'us': 1.0, 'india': 0.25, 'europe': 0.85, 'uk': 0.90, 'canada': 0.85 } 
  },
  'full stack developer': { 
    base: 105000, 
    locations: { 'us': 1.0, 'india': 0.26, 'europe': 0.86, 'uk': 0.90, 'canada': 0.85 } 
  },
  'devops engineer': { 
    base: 115000, 
    locations: { 'us': 1.0, 'india': 0.27, 'europe': 0.87, 'uk': 0.91, 'canada': 0.86 } 
  },
  'product manager': { 
    base: 125000, 
    locations: { 'us': 1.0, 'india': 0.30, 'europe': 0.88, 'uk': 0.92, 'canada': 0.87 } 
  },
  'data analyst': { 
    base: 75000, 
    locations: { 'us': 1.0, 'india': 0.22, 'europe': 0.82, 'uk': 0.87, 'canada': 0.82 } 
  },
  'business analyst': { 
    base: 80000, 
    locations: { 'us': 1.0, 'india': 0.23, 'europe': 0.83, 'uk': 0.88, 'canada': 0.83 } 
  },
  'ui/ux designer': { 
    base: 85000, 
    locations: { 'us': 1.0, 'india': 0.24, 'europe': 0.84, 'uk': 0.89, 'canada': 0.84 } 
  },
  'qa engineer': { 
    base: 78000, 
    locations: { 'us': 1.0, 'india': 0.23, 'europe': 0.83, 'uk': 0.88, 'canada': 0.83 } 
  },
  'mobile developer': { 
    base: 102000, 
    locations: { 'us': 1.0, 'india': 0.26, 'europe': 0.86, 'uk': 0.90, 'canada': 0.85 } 
  },
  'cloud architect': { 
    base: 145000, 
    locations: { 'us': 1.0, 'india': 0.30, 'europe': 0.88, 'uk': 0.92, 'canada': 0.87 } 
  },
  'security engineer': { 
    base: 125000, 
    locations: { 'us': 1.0, 'india': 0.28, 'europe': 0.87, 'uk': 0.91, 'canada': 0.86 } 
  },
  'solutions architect': { 
    base: 135000, 
    locations: { 'us': 1.0, 'india': 0.29, 'europe': 0.88, 'uk': 0.92, 'canada': 0.87 } 
  },
  'technical lead': { 
    base: 140000, 
    locations: { 'us': 1.0, 'india': 0.30, 'europe': 0.88, 'uk': 0.92, 'canada': 0.87 } 
  },
  'engineering manager': { 
    base: 155000, 
    locations: { 'us': 1.0, 'india': 0.32, 'europe': 0.89, 'uk': 0.93, 'canada': 0.88 } 
  }
};

// Top tech companies with salary multipliers
const TOP_COMPANIES = ['google', 'meta', 'amazon', 'microsoft', 'apple', 'netflix', 'uber', 'airbnb'];

// High-demand skills bonus
const SKILLS_BONUS: Record<string, number> = {
  'ai': 8000, 'machine learning': 8000, 'deep learning': 8000,
  'aws': 6000, 'azure': 6000, 'gcp': 6000,
  'kubernetes': 7000, 'docker': 5000,
  'react': 5000, 'angular': 5000, 'vue': 5000,
  'python': 4000, 'java': 4000, 'go': 6000, 'rust': 7000,
  'blockchain': 10000, 'web3': 10000
};

export class SalaryInsightsService {
  
  generateInsights(data: z.infer<typeof salaryInsightsSchema>) {
    const { jobTitle, company, location, experienceLevel = 0, skills = [] } = data;
    
    // Find matching role (fuzzy match)
    const normalizedTitle = jobTitle.toLowerCase();
    let roleData = SALARY_DATABASE[normalizedTitle];
    
    // Fuzzy match if exact match not found
    if (!roleData) {
      for (const [role, data] of Object.entries(SALARY_DATABASE)) {
        if (normalizedTitle.includes(role) || role.includes(normalizedTitle)) {
          roleData = data;
          break;
        }
      }
    }
    
    // Default to software engineer if no match
    if (!roleData) {
      roleData = SALARY_DATABASE['software engineer'];
    }
    
    // Calculate base salary
    let baseSalary = roleData.base;
    
    // Apply experience multiplier (exponential growth)
    const experienceMultiplier = 1 + (experienceLevel * 0.08); // 8% per year
    baseSalary *= experienceMultiplier;
    
    // Detect location and apply regional adjustment
    const locationLower = location?.toLowerCase() || '';
    let locationMultiplier = 1.0;
    let detectedRegion = 'us';
    let currency = 'USD';
    
    if (locationLower.includes('india') || locationLower.includes('bangalore') || 
        locationLower.includes('mumbai') || locationLower.includes('delhi')) {
      locationMultiplier = roleData.locations['india'];
      detectedRegion = 'india';
      currency = 'INR';
    } else if (locationLower.includes('uk') || locationLower.includes('london') || 
               locationLower.includes('manchester')) {
      locationMultiplier = roleData.locations['uk'];
      detectedRegion = 'uk';
      currency = 'GBP';
    } else if (locationLower.includes('europe') || locationLower.includes('berlin') || 
               locationLower.includes('paris') || locationLower.includes('amsterdam')) {
      locationMultiplier = roleData.locations['europe'];
      detectedRegion = 'europe';
      currency = 'EUR';
    } else if (locationLower.includes('canada') || locationLower.includes('toronto') || 
               locationLower.includes('vancouver')) {
      locationMultiplier = roleData.locations['canada'];
      detectedRegion = 'canada';
      currency = 'CAD';
    }
    
    baseSalary *= locationMultiplier;
    
    // Apply company tier bonus
    const isTopCompany = company && TOP_COMPANIES.some(tc => company.toLowerCase().includes(tc));
    if (isTopCompany) {
      baseSalary *= 1.5; // 50% bonus for FAANG
    }
    
    // Calculate skills bonus
    let skillsBonus = 0;
    skills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      for (const [bonusSkill, bonus] of Object.entries(SKILLS_BONUS)) {
        if (skillLower.includes(bonusSkill)) {
          skillsBonus += bonus * locationMultiplier;
        }
      }
    });
    
    // Calculate total compensation
    const totalComp = Math.round(baseSalary + skillsBonus);
    
    // Convert to local currency if needed
    const currencyRates: Record<string, number> = {
      'USD': 1,
      'INR': 83,
      'EUR': 0.92,
      'GBP': 0.79,
      'CAD': 1.35
    };
    
    const localTotal = Math.round(totalComp * currencyRates[currency]);
    
    // Calculate salary range
    const salaryRange = {
      min: Math.round(localTotal * 0.85),
      median: localTotal,
      max: Math.round(localTotal * 1.15)
    };
    
    // Generate market insights
    const marketInsights = this.generateMarketInsights(
      detectedRegion,
      jobTitle,
      experienceLevel,
      isTopCompany
    );
    
    // Generate negotiation tips
    const negotiationTips = this.generateNegotiationTips(
      detectedRegion,
      experienceLevel,
      skills
    );
    
    return {
      salaryRange,
      currency,
      totalCompensation: localTotal,
      breakdown: {
        baseSalary: Math.round(baseSalary),
        skillsBonus: Math.round(skillsBonus),
        equityEstimate: isTopCompany ? Math.round(totalComp * 0.25) : 0,
        bonusEstimate: Math.round(totalComp * 0.15)
      },
      marketInsights,
      negotiationTips,
      locationAdjustment: `${detectedRegion.toUpperCase()} salary adjusted by ${Math.round((locationMultiplier - 1) * 100)}%`,
      companyTier: isTopCompany ? 'Top Tier (FAANG)' : 'Standard',
      experienceImpact: `+${Math.round((experienceMultiplier - 1) * 100)}% for ${experienceLevel} years experience`
    };
  }
  
  private generateMarketInsights(region: string, role: string, experience: number, isTopCompany: boolean): string {
    const insights = {
      us: `Strong demand in US tech hubs. ${isTopCompany ? 'Top companies offer 50% premium.' : 'Growing startup ecosystem.'} ${experience > 5 ? 'Senior roles command premium.' : 'Entry-level competition is high.'}`,
      india: `Rapidly growing tech market in India. ${isTopCompany ? 'MNCs offer competitive packages.' : 'Startups offering equity compensation.'} Remote work increasing salaries by 20-30%.`,
      europe: `European tech scene expanding. ${isTopCompany ? 'FAANG presence strong in major cities.' : 'Strong work-life balance culture.'} ${experience > 3 ? 'Senior talent shortage.' : 'Growing junior market.'}`,
      uk: `London remains tech hub. ${isTopCompany ? 'Competitive with US salaries.' : 'Fintech sector booming.'} Brexit impacting hiring patterns.`,
      canada: `Toronto and Vancouver leading. ${isTopCompany ? 'US companies expanding north.' : 'Growing AI/ML sector.'} Immigration-friendly policies.`
    };
    
    return insights[region as keyof typeof insights] || insights.us;
  }
  
  private generateNegotiationTips(region: string, experience: number, skills: string[]): string[] {
    const tips = [
      'Research company salary bands on Glassdoor and Levels.fyi',
      'Highlight your unique skill combinations during negotiation',
      'Consider total compensation (base + equity + bonus) not just base salary',
      'Use competing offers as leverage if available'
    ];
    
    if (experience > 5) {
      tips.push('Emphasize leadership experience and team impact');
      tips.push('Negotiate for sign-on bonus to bridge gap');
    }
    
    if (skills.some(s => ['ai', 'ml', 'blockchain', 'web3'].includes(s.toLowerCase()))) {
      tips.push('High-demand skills - aim for 15-20% above market rate');
    }
    
    if (region === 'india') {
      tips.push('Negotiate for stock options if joining startup');
      tips.push('Consider relocation bonus for tier-1 cities');
    }
    
    return tips;
  }
}

export const salaryInsightsService = new SalaryInsightsService();
