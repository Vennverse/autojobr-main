class MatchEngine {
  constructor() {
    this.MIN_CONFIDENCE_THRESHOLD = 150;
    this.SKILL_WEIGHT = 0.35;
    this.TITLE_WEIGHT = 0.25;
    this.EXPERIENCE_WEIGHT = 0.20;
    this.EDUCATION_WEIGHT = 0.10;
    this.LOCATION_WEIGHT = 0.10;
    
    this.stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'a', 'an']);
  }

  async analyzeJobMatch(jobData, userProfile) {
    const startTime = performance.now();

    try {
      const sanitizedJob = this._sanitizeJob(jobData);
      const jobKeywords = this._extractJobKeywords(sanitizedJob);
      const jobRequirements = this._extractRequirements(sanitizedJob);

      const skillScore = this._calculateSkillScore(jobKeywords, jobRequirements.skills, userProfile);
      const titleScore = this._calculateTitleScore(sanitizedJob.title, userProfile);
      const experienceScore = this._calculateExperienceScore(jobRequirements.yearsRequired, userProfile);
      const educationScore = this._calculateEducationScore(jobRequirements.education, userProfile);
      const locationScore = this._calculateLocationScore(sanitizedJob.location, userProfile);

      const weightedScore = Math.round(
        (skillScore.score * this.SKILL_WEIGHT) +
        (titleScore.score * this.TITLE_WEIGHT) +
        (experienceScore.score * this.EXPERIENCE_WEIGHT) +
        (educationScore.score * this.EDUCATION_WEIGHT) +
        (locationScore.score * this.LOCATION_WEIGHT)
      );

      const matchScore = Math.min(100, Math.max(0, weightedScore));
      const confidence = sanitizedJob.description.length;
      const isHighConfidence = confidence >= this.MIN_CONFIDENCE_THRESHOLD;

      const missingKeywords = this._findMissingKeywords(
        jobKeywords,
        userProfile.keywordIndex || []
      );

      const factors = this._buildFactors({
        skillScore,
        titleScore,
        experienceScore,
        educationScore,
        locationScore
      });

      const executionTime = Math.round(performance.now() - startTime);

      console.log('🎯 Local job match complete', {
        score: matchScore,
        confidence: isHighConfidence ? 'high' : 'low',
        executionMs: executionTime,
        skillMatches: skillScore.matchedSkills,
        missingSkills: missingKeywords.length
      });

      return {
        matchScore,
        confidence: isHighConfidence ? 'high' : 'low',
        confidenceLevel: confidence,
        source: 'local',
        executionTimeMs: executionTime,
        breakdown: {
          skills: skillScore,
          title: titleScore,
          experience: experienceScore,
          education: educationScore,
          location: locationScore
        },
        factors,
        missingKeywords: missingKeywords.slice(0, 10),
        recommendations: this._generateRecommendations(missingKeywords, userProfile),
        analyzedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Match engine error:', error);
      return {
        matchScore: 0,
        confidence: 'error',
        source: 'local',
        error: error.message
      };
    }
  }

  _sanitizeJob(jobData) {
    return {
      title: (jobData.title || '').trim(),
      company: (jobData.company || '').trim(),
      location: (jobData.location || '').trim(),
      description: (jobData.description || jobData.requirements || jobData.qualifications || '').trim(),
      salary: jobData.salary || '',
      url: jobData.url || ''
    };
  }

  _extractJobKeywords(job) {
    const text = `${job.title} ${job.description}`.toLowerCase();
    
    const words = text
      .replace(/[^\w\s+#.-]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && 
        !this.stopWords.has(word) &&
        !word.match(/^\d+$/)
      );

    const wordFreq = new Map();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    const keywords = Array.from(wordFreq.entries())
      .map(([word, freq]) => ({
        word,
        freq,
        tfIdf: freq * Math.log(1 + (words.length / freq))
      }))
      .sort((a, b) => b.tfIdf - a.tfIdf)
      .slice(0, 50)
      .map(item => item.word);

    return keywords;
  }

  _extractRequirements(job) {
    const description = job.description.toLowerCase();
    
    const yearsMatch = description.match(/(\d+)\+?\s*(year|yr)s?\s*(of)?\s*(experience|exp)/i);
    const yearsRequired = yearsMatch ? parseInt(yearsMatch[1]) : 0;

    const degreeMatch = description.match(/(bachelor|master|phd|doctorate|associate|b\.?s\.?|m\.?s\.?|m\.?b\.?a\.?)/i);
    const educationLevel = degreeMatch ? degreeMatch[1].toLowerCase() : null;

    const skills = this._extractSkillsFromDescription(description);

    return {
      yearsRequired,
      education: educationLevel,
      skills
    };
  }

  _extractSkillsFromDescription(description) {
    const commonSkills = [
      'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'typescript', 'php', 'swift', 'kotlin',
      'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'rails', 'laravel',
      'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'git', 'ci/cd',
      'rest', 'graphql', 'api', 'microservices', 'agile', 'scrum', 'jira',
      'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch', 'pandas', 'numpy',
      'html', 'css', 'sass', 'tailwind', 'bootstrap', 'webpack', 'vite',
      'testing', 'jest', 'cypress', 'selenium', 'unit testing', 'tdd', 'bdd'
    ];

    const foundSkills = commonSkills.filter(skill => {
      const pattern = new RegExp(`\\b${skill.replace(/[+#.]/g, '\\$&')}\\b`, 'i');
      return pattern.test(description);
    });

    return foundSkills;
  }

  _calculateSkillScore(jobKeywords, requiredSkills, userProfile) {
    const userSkills = (userProfile.skills || []).map(s => 
      (typeof s === 'string' ? s : s.name).toLowerCase()
    );
    const userKeywords = userProfile.keywordIndex || [];

    const matchedSkills = requiredSkills.filter(skill => 
      userSkills.some(us => us.includes(skill) || skill.includes(us))
    );

    const keywordMatches = jobKeywords.filter(keyword =>
      userKeywords.includes(keyword) || userSkills.some(skill => skill.includes(keyword))
    );

    const skillMatchRatio = requiredSkills.length > 0
      ? matchedSkills.length / requiredSkills.length
      : 0.5;

    const keywordMatchRatio = jobKeywords.length > 0
      ? keywordMatches.length / Math.min(jobKeywords.length, 20)
      : 0;

    const score = Math.round(
      (skillMatchRatio * 60) + (keywordMatchRatio * 40)
    );

    return {
      score: Math.min(100, score),
      matchedSkills,
      totalRequired: requiredSkills.length,
      matchRatio: skillMatchRatio,
      keywordMatches: keywordMatches.length
    };
  }

  _calculateTitleScore(jobTitle, userProfile) {
    const normalizedJobTitle = jobTitle.toLowerCase();
    const userTitle = (userProfile.professionalTitle || '').toLowerCase();
    const userRoles = (userProfile.preferredRoles || []).map(r => r.toLowerCase());

    if (!userTitle && userRoles.length === 0) {
      return { score: 50, similarity: 0, matches: [] };
    }

    const titleSimilarity = this._calculateStringSimilarity(normalizedJobTitle, userTitle);

    const roleMatches = userRoles.filter(role =>
      normalizedJobTitle.includes(role) || role.includes(normalizedJobTitle)
    );

    const experienceMatches = userProfile.workExperience || [];
    const historyMatches = experienceMatches.filter(exp => {
      const expTitle = (exp.title || '').toLowerCase();
      return this._calculateStringSimilarity(normalizedJobTitle, expTitle) > 0.5;
    });

    const score = Math.round(
      (titleSimilarity * 50) +
      (roleMatches.length > 0 ? 30 : 0) +
      (historyMatches.length > 0 ? 20 : 0)
    );

    return {
      score: Math.min(100, score),
      similarity: titleSimilarity,
      matches: [...roleMatches, ...historyMatches.map(h => h.title)]
    };
  }

  _calculateExperienceScore(yearsRequired, userProfile) {
    const userYears = userProfile.yearsExperience || 0;

    if (yearsRequired === 0) {
      return { score: 100, userYears, required: 0, difference: 0 };
    }

    const difference = userYears - yearsRequired;
    
    let score = 100;
    if (difference < 0) {
      score = Math.max(0, 100 + (difference * 15));
    } else if (difference > yearsRequired * 2) {
      score = Math.max(70, 100 - (difference - yearsRequired * 2) * 5);
    }

    return {
      score: Math.round(score),
      userYears,
      required: yearsRequired,
      difference
    };
  }

  _calculateEducationScore(requiredEducation, userProfile) {
    if (!requiredEducation) {
      return { score: 100, matches: true, level: 'none required' };
    }

    const educationLevels = {
      'associate': 1,
      'bachelor': 2,
      'b.s': 2,
      'b.a': 2,
      'master': 3,
      'm.s': 3,
      'm.b.a': 3,
      'phd': 4,
      'doctorate': 4
    };

    const requiredLevel = educationLevels[requiredEducation.toLowerCase()] || 2;
    
    const userEducation = userProfile.education || [];
    const userHighestLevel = Math.max(0, ...userEducation.map(edu => {
      const degree = (edu.degree || '').toLowerCase();
      return Object.entries(educationLevels).find(([key]) => degree.includes(key))?.[1] || 0;
    }));

    const score = userHighestLevel >= requiredLevel ? 100 
      : userHighestLevel === requiredLevel - 1 ? 70 
      : 50;

    return {
      score,
      matches: userHighestLevel >= requiredLevel,
      level: requiredEducation
    };
  }

  _calculateLocationScore(jobLocation, userProfile) {
    const normalizedJobLoc = jobLocation.toLowerCase();
    
    if (normalizedJobLoc.includes('remote') || normalizedJobLoc.includes('anywhere')) {
      return { score: 100, isRemote: true, matches: true };
    }

    const userPreference = (userProfile.remotePreference || '').toLowerCase();
    const userLocations = (userProfile.preferredLocations || []).map(l => l.toLowerCase());

    if (userPreference === 'remote' && !normalizedJobLoc.includes('remote')) {
      return { score: 30, isRemote: false, matches: false };
    }

    const locationMatch = userLocations.some(loc => 
      normalizedJobLoc.includes(loc) || loc.includes(normalizedJobLoc)
    );

    const score = locationMatch ? 100
      : userPreference === 'hybrid' ? 70
      : 50;

    return {
      score,
      isRemote: normalizedJobLoc.includes('remote'),
      matches: locationMatch
    };
  }

  _calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    const trigrams1 = this._getTrigrams(s1);
    const trigrams2 = this._getTrigrams(s2);
    
    const intersection = trigrams1.filter(t => trigrams2.includes(t));
    const union = new Set([...trigrams1, ...trigrams2]);
    
    return intersection.length / union.size;
  }

  _getTrigrams(str) {
    const padded = `  ${str}  `;
    const trigrams = [];
    for (let i = 0; i < padded.length - 2; i++) {
      trigrams.push(padded.substring(i, i + 3));
    }
    return trigrams;
  }

  _findMissingKeywords(jobKeywords, userKeywords) {
    return jobKeywords.filter(keyword => 
      !userKeywords.includes(keyword) &&
      keyword.length > 3 &&
      !this.stopWords.has(keyword)
    );
  }

  _buildFactors(scores) {
    const factors = [];

    if (scores.skillScore.score >= 70) {
      factors.push({
        type: 'positive',
        category: 'skills',
        description: `Strong skill match (${scores.skillScore.matchedSkills.length} of ${scores.skillScore.totalRequired} required skills)`,
        weight: this.SKILL_WEIGHT
      });
    } else if (scores.skillScore.score < 50) {
      factors.push({
        type: 'negative',
        category: 'skills',
        description: `Skills gap detected - ${scores.skillScore.totalRequired - scores.skillScore.matchedSkills.length} skills missing`,
        weight: this.SKILL_WEIGHT
      });
    }

    if (scores.titleScore.score >= 70) {
      factors.push({
        type: 'positive',
        category: 'title',
        description: 'Job title aligns with your experience',
        weight: this.TITLE_WEIGHT
      });
    }

    if (scores.experienceScore.difference < 0) {
      factors.push({
        type: 'negative',
        category: 'experience',
        description: `Requires ${Math.abs(scores.experienceScore.difference)} more years of experience`,
        weight: this.EXPERIENCE_WEIGHT
      });
    }

    if (scores.locationScore.score >= 80) {
      factors.push({
        type: 'positive',
        category: 'location',
        description: 'Location matches your preferences',
        weight: this.LOCATION_WEIGHT
      });
    }

    return factors;
  }

  _generateRecommendations(missingKeywords, userProfile) {
    const recommendations = [];

    if (missingKeywords.length > 0) {
      const topMissing = missingKeywords.slice(0, 5);
      recommendations.push({
        type: 'skill-gap',
        priority: 'high',
        message: `Consider learning: ${topMissing.join(', ')}`,
        action: 'Add these skills to your profile or resume'
      });
    }

    const userSkillCount = (userProfile.skills || []).length;
    if (userSkillCount < 5) {
      recommendations.push({
        type: 'profile-improvement',
        priority: 'medium',
        message: 'Add more skills to your profile',
        action: 'Complete your skills section with at least 10 skills'
      });
    }

    return recommendations;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatchEngine;
}
