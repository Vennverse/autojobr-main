
import { Router } from 'express';
import { db } from '../db';
import { linkedinProfiles, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { aiService } from '../aiService';
import { cacheService } from '../cacheService';
import { isAuthenticated } from '../auth';

const router = Router();

// Helper to check premium status
const isPremiumUser = (user: any): boolean => {
  return user?.planType === 'premium' || user?.planType === 'enterprise' || user?.planType === 'ultra_premium';
};

// GET /api/linkedin-optimizer - Get current profile
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;

    // Check cache first - 5 minute cache for better UX
    const cacheKey = `linkedin_profile_${userId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`✅ [CACHE HIT] LinkedIn profile for user ${userId}`);
      return res.json(cached.data);
    }
    
    console.log(`🔍 [CACHE MISS] Fetching fresh LinkedIn profile for user ${userId}`);

    const [profile] = await db
      .select()
      .from(linkedinProfiles)
      .where(eq(linkedinProfiles.userId, userId))
      .limit(1);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    const isPremium = isPremiumUser(user);

    // Calculate profile completeness
    let completenessScore = 0;
    const missingElements = [];

    if (!profile) {
      completenessScore = 0;
      missingElements.push('Headline', 'About Section', 'Keywords');
    } else {
      if (profile.generatedHeadline) completenessScore += 33;
      else missingElements.push('Headline');

      if (profile.generatedAbout) completenessScore += 34;
      else missingElements.push('About Section');

      if (profile.topKeywords && profile.topKeywords.length > 0) completenessScore += 33;
      else missingElements.push('Keywords');
    }

    const result = {
      ...profile,
      isPremium,
      profileCompletenessScore: completenessScore,
      missingElements,
      generationsThisMonth: profile?.generationsThisMonth || 0,
      freeGenerationsRemaining: isPremium ? -1 : Math.max(0, 1 - (profile?.generationsThisMonth || 0))
    };

    // Cache for 5 minutes for better UX
    cacheService.set(cacheKey, result, { ttl: 5 * 60 * 1000 }, [`user:${userId}`]);

    res.json(result);
  } catch (error: any) {
    console.error('❌ Error fetching LinkedIn profile:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/linkedin-optimizer/generate - Generate optimized profile (selective regeneration)
router.post('/generate', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { regenerate } = req.body; // { headline: true, about: false, keywords: true }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const isPremium = isPremiumUser(user);

    // Get existing profile
    const [existingProfile] = await db
      .select()
      .from(linkedinProfiles)
      .where(eq(linkedinProfiles.userId, userId));

    // Check free tier limits
    const generationsThisMonth = existingProfile?.generationsThisMonth || 0;
    if (!isPremium && generationsThisMonth >= 1 && !existingProfile?.generatedHeadline) {
      return res.status(403).json({
        error: 'Free tier limit reached',
        message: 'You have used your free generation. Upgrade to Premium for unlimited access.',
        requiresUpgrade: true
      });
    }

    // Prepare user data
    const userData = {
      title: user.professionalTitle || user.headline || 'Professional',
      skills: user.skills?.slice(0, isPremium ? 10 : 3) || [],
      yearsExp: user.yearsExperience || 0,
      resumeText: user.resumeText?.substring(0, isPremium ? 500 : 200) || '',
      summary: user.professionalSummary || '',
      goals: 'career growth'
    };

    // Selective regeneration (only generate what's requested or missing)
    let headline = existingProfile?.generatedHeadline;
    let about = existingProfile?.generatedAbout;
    let keywords = existingProfile?.topKeywords || [];

    // CRITICAL: Only generate on first time OR explicit regeneration request
    const isFirstGeneration = !existingProfile || !existingProfile.generatedHeadline;
    const shouldGenerateHeadline = isFirstGeneration || regenerate?.headline === true;
    const shouldGenerateAbout = isPremium && (isFirstGeneration || regenerate?.about === true);
    const shouldGenerateKeywords = isFirstGeneration || regenerate?.keywords === true;

    console.log(`📊 Generation flags:`, {
      isFirstGeneration,
      shouldGenerateHeadline,
      shouldGenerateAbout,
      shouldGenerateKeywords,
      regenerateRequest: regenerate
    });

    // Generate only what's needed
    if (shouldGenerateHeadline) {
      console.log('🔄 Generating headline...');
      headline = await aiService.generateLinkedInHeadline(userData, user);
    }

    if (shouldGenerateAbout) {
      console.log('🔄 Generating about section...');
      about = await aiService.generateLinkedInAbout(userData);
    }

    if (shouldGenerateKeywords) {
      console.log('🔄 Generating keywords...');
      const keywordData = await aiService.analyzeLinkedInKeywords({
        title: userData.title,
        industry: 'tech',
        resumeText: userData.resumeText
      });
      keywords = keywordData.topKeywords.slice(0, isPremium ? 10 : 5);
    }

    // Save to database
    const profileData = {
      userId,
      generatedHeadline: headline || null,
      generatedAbout: isPremium ? (about || null) : null,
      topKeywords: keywords,
      generationsThisMonth: existingProfile ? (existingProfile.generationsThisMonth || 0) + 1 : 1,
      lastGeneratedAt: new Date(),
      updatedAt: new Date()
    };

    if (existingProfile) {
      await db
        .update(linkedinProfiles)
        .set(profileData)
        .where(eq(linkedinProfiles.userId, userId));
    } else {
      await db.insert(linkedinProfiles).values({
        ...profileData,
        createdAt: new Date()
      });
    }

    // Invalidate cache
    cacheService.invalidateUser(userId);

    res.json({
      success: true,
      headline,
      about: isPremium ? about : null,
      keywords,
      isPremium,
      message: isPremium ? 'Profile generated successfully' : 'Free tier: Headline and 5 keywords generated'
    });
  } catch (error) {
    console.error('Error generating LinkedIn profile:', error);
    res.status(500).json({ error: 'Failed to generate profile' });
  }
});

// POST /api/linkedin-optimizer/save-edits - Save user edits
router.post('/save-edits', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { headline, about } = req.body;

    await db
      .update(linkedinProfiles)
      .set({
        generatedHeadline: headline || null,
        generatedAbout: about || null,
        updatedAt: new Date()
      })
      .where(eq(linkedinProfiles.userId, userId));

    // Invalidate cache
    cacheService.invalidateUser(userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving edits:', error);
    res.status(500).json({ error: 'Failed to save edits' });
  }
});

export default router;
