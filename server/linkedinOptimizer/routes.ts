import { Router, type Request, type Response } from 'express';
import { db } from '../db';
import { linkedinProfiles, userProfiles, workExperience, userSkills, resumes, users } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { aiService } from '../aiService';

const router = Router();

// Middleware to check authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Check if user is premium
const isPremium = (user: any): boolean => {
  return user?.planType === 'premium' || user?.planType === 'enterprise';
};

// GET /api/linkedin-optimizer - Get saved LinkedIn profile or create new
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user.id;
    
    // Get user to check premium status
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const premium = isPremium(user[0]);
    
    // Get existing profile
    const existing = await db
      .select()
      .from(linkedinProfiles)
      .where(eq(linkedinProfiles.userId, userId))
      .limit(1);
    
    if (existing.length > 0) {
      return res.json({ ...existing[0], isPremium: premium });
    }
    
    // Return empty state for new users
    res.json({ userId, generationCount: 0, isPremium: premium });
  } catch (error) {
    console.error('Error fetching LinkedIn profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /api/linkedin-optimizer/generate - Generate LinkedIn profile content
router.post('/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user.id;
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const premium = isPremium(user[0]);
    
    // Check limits for free users
    const existing = await db
      .select()
      .from(linkedinProfiles)
      .where(eq(linkedinProfiles.userId, userId))
      .limit(1);
    
    if (!premium && existing.length > 0 && existing[0].generationCount! >= 1) {
      return res.status(403).json({ 
        error: 'Free tier limit reached. Upgrade to Premium for unlimited generations.',
        requiresUpgrade: true 
      });
    }
    
    // Fetch user data
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    const experiences = await db.select().from(workExperience).where(eq(workExperience.userId, userId)).limit(5);
    const skills = await db.select().from(userSkills).where(eq(userSkills.userId, userId)).limit(10);
    const [resume] = await db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.createdAt)).limit(1);
    
    // Generate headline
    const headline = await aiService.generateLinkedInHeadline({
      title: profile?.professionalTitle || undefined,
      skills: skills.map(s => s.skillName),
      yearsExp: profile?.yearsExperience || undefined
    });
    
    // Generate About section (only for premium)
    let about = null;
    if (premium) {
      about = await aiService.generateLinkedInAbout({
        resumeText: resume?.resumeText || undefined,
        summary: profile?.summary || undefined,
        title: profile?.professionalTitle || undefined,
        goals: profile?.careerGoals || undefined
      });
    }
    
    // Optimize experiences (only for premium)
    let optimizedExps = [];
    if (premium && experiences.length > 0) {
      for (const exp of experiences.slice(0, 3)) {
        const optimized = await aiService.optimizeLinkedInExperience({
          company: exp.company,
          position: exp.position,
          description: exp.description || undefined
        });
        optimizedExps.push({ ...exp, optimized });
      }
    }
    
    // Analyze keywords (basic for free, full for premium)
    const keywordData = await aiService.analyzeLinkedInKeywords({
      title: profile?.professionalTitle || undefined,
      industry: 'tech',
      resumeText: resume?.resumeText || undefined
    });
    
    const topKeywords = premium ? keywordData.topKeywords : keywordData.topKeywords.slice(0, 5);
    
    // Calculate completeness score
    let score = 0;
    if (profile?.fullName) score += 10;
    if (profile?.professionalTitle) score += 15;
    if (profile?.summary) score += 15;
    if (profile?.linkedinUrl) score += 10;
    if (experiences.length > 0) score += 20;
    if (skills.length >= 5) score += 15;
    if (resume) score += 15;
    
    const missingElements = [];
    if (!profile?.linkedinUrl) missingElements.push('LinkedIn URL');
    if (skills.length < 5) missingElements.push('At least 5 skills');
    if (experiences.length === 0) missingElements.push('Work experience');
    if (!resume) missingElements.push('Resume');
    
    // Save to database
    if (existing.length > 0) {
      await db.update(linkedinProfiles)
        .set({
          generatedHeadline: headline,
          generatedAbout: about,
          optimizedExperiences: optimizedExps,
          topKeywords,
          profileCompletenessScore: score,
          missingElements,
          generationCount: (existing[0].generationCount || 0) + 1,
          lastGenerated: new Date(),
          updatedAt: new Date()
        })
        .where(eq(linkedinProfiles.userId, userId));
    } else {
      await db.insert(linkedinProfiles).values({
        userId,
        generatedHeadline: headline,
        generatedAbout: about,
        optimizedExperiences: optimizedExps,
        topKeywords,
        profileCompletenessScore: score,
        missingElements,
        generationCount: 1,
        lastGenerated: new Date()
      });
    }
    
    res.json({
      success: true,
      headline,
      about: premium ? about : '🔒 Upgrade to Premium to unlock AI-generated About section',
      optimizedExperiences: premium ? optimizedExps : [],
      topKeywords,
      profileCompletenessScore: score,
      missingElements,
      isPremium: premium
    });
  } catch (error) {
    console.error('Error generating LinkedIn profile:', error);
    res.status(500).json({ error: 'Failed to generate profile' });
  }
});

// POST /api/linkedin-optimizer/save-edits - Save user edits
router.post('/save-edits', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user.id;
    const { headline, about } = req.body;
    
    await db.update(linkedinProfiles)
      .set({
        userEditedHeadline: headline,
        userEditedAbout: about,
        updatedAt: new Date()
      })
      .where(eq(linkedinProfiles.userId, userId));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving edits:', error);
    res.status(500).json({ error: 'Failed to save edits' });
  }
});

export default router;
