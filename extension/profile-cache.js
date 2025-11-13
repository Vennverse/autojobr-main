class ProfileCache {
  constructor() {
    this.CACHE_KEY = 'autojobr_profile_cache';
    this.METADATA_KEY = 'autojobr_profile_metadata';
    this.CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;
    this.version = '1.0';
  }

  async getProfile({ requireFresh = false } = {}) {
    try {
      const metadata = await this._getMetadata();
      
      if (requireFresh || this._isExpired(metadata)) {
        console.log('📥 Profile cache expired or fresh data required - fetching from server');
        return null;
      }

      const result = await chrome.storage.local.get([this.CACHE_KEY]);
      const cachedProfile = result[this.CACHE_KEY];

      if (!cachedProfile) {
        console.log('📭 No cached profile found');
        return null;
      }

      console.log('✅ Using cached profile', {
        lastUpdated: metadata?.lastUpdated,
        skillsCount: cachedProfile.skills?.length || 0,
        experienceCount: cachedProfile.workExperience?.length || 0
      });

      return cachedProfile;
    } catch (error) {
      console.error('Profile cache get error:', error);
      return null;
    }
  }

  async setProfile(profile) {
    try {
      const normalizedProfile = this._normalizeProfile(profile);
      const hash = this._generateHash(normalizedProfile);
      
      const metadata = {
        version: this.version,
        lastUpdated: Date.now(),
        lastSyncedAt: Date.now(),
        hash: hash,
        profileVersion: normalizedProfile.version || 1
      };

      await chrome.storage.local.set({
        [this.CACHE_KEY]: normalizedProfile
      });

      await chrome.storage.sync.set({
        [this.METADATA_KEY]: metadata
      });

      console.log('💾 Profile cached successfully', {
        hash: hash.substring(0, 8),
        skills: normalizedProfile.skills?.length || 0,
        experience: normalizedProfile.workExperience?.length || 0
      });

      return true;
    } catch (error) {
      console.error('Profile cache set error:', error);
      return false;
    }
  }

  async ensureFresh(apiUrl, forceRefresh = false) {
    try {
      const metadata = await this._getMetadata();
      
      if (!forceRefresh && metadata && !this._isExpired(metadata)) {
        const cachedProfile = await this.getProfile();
        if (cachedProfile) {
          return cachedProfile;
        }
      }

      console.log('🔄 Fetching fresh profile from server');
      const response = await fetch(`${apiUrl}/api/user/profile`, {
        method: 'GET',
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profile = await response.json();
      
      if (profile.authenticated) {
        await this.setProfile(profile);
        return profile;
      }

      return null;
    } catch (error) {
      console.error('Ensure fresh profile error:', error);
      const cachedProfile = await this.getProfile();
      return cachedProfile;
    }
  }

  async invalidate() {
    try {
      await chrome.storage.local.remove([this.CACHE_KEY]);
      await chrome.storage.sync.remove([this.METADATA_KEY]);
      console.log('🗑️ Profile cache invalidated');
      return true;
    } catch (error) {
      console.error('Profile cache invalidate error:', error);
      return false;
    }
  }

  async getHash() {
    try {
      const metadata = await this._getMetadata();
      return metadata?.hash || null;
    } catch (error) {
      console.error('Get hash error:', error);
      return null;
    }
  }

  async _getMetadata() {
    try {
      const result = await chrome.storage.sync.get([this.METADATA_KEY]);
      return result[this.METADATA_KEY] || null;
    } catch (error) {
      console.error('Get metadata error:', error);
      return null;
    }
  }

  _isExpired(metadata) {
    if (!metadata || !metadata.lastUpdated) {
      return true;
    }

    const age = Date.now() - metadata.lastUpdated;
    return age > this.CACHE_EXPIRY_MS;
  }

  _normalizeProfile(profile) {
    const normalized = {
      userId: profile.userId || profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      professionalTitle: profile.professionalTitle || profile.currentTitle,
      yearsExperience: profile.yearsExperience || this._calculateYearsExperience(profile.workExperience),
      
      skills: this._normalizeSkills(profile.skills),
      workExperience: this._normalizeWorkExperience(profile.workExperience),
      education: this._normalizeEducation(profile.education),
      
      preferredRoles: profile.preferredRoles || [],
      preferredLocations: profile.preferredLocations || [],
      remotePreference: profile.remotePreference || 'hybrid',
      
      certifications: profile.certifications || [],
      tools: profile.tools || [],
      languages: profile.languages || [],
      
      keywordIndex: this._buildKeywordIndex(profile),
      
      authenticated: profile.authenticated || true,
      version: profile.version || 1,
      lastUpdated: Date.now()
    };

    return normalized;
  }

  _normalizeSkills(skills) {
    if (!skills || !Array.isArray(skills)) return [];
    
    return skills.map(skill => {
      if (typeof skill === 'string') {
        return {
          name: skill,
          proficiency: 'intermediate',
          yearsUsed: 1
        };
      }
      return {
        name: skill.name || skill.skillName || '',
        proficiency: skill.proficiency || skill.level || 'intermediate',
        yearsUsed: skill.yearsUsed || skill.years || 1
      };
    });
  }

  _normalizeWorkExperience(experience) {
    if (!experience || !Array.isArray(experience)) return [];
    
    return experience.map(exp => ({
      title: exp.title || exp.jobTitle || '',
      company: exp.company || exp.companyName || '',
      startDate: exp.startDate || exp.from || '',
      endDate: exp.endDate || exp.to || exp.isCurrent ? 'Present' : '',
      description: exp.description || exp.responsibilities || '',
      isCurrent: exp.isCurrent || exp.endDate === 'Present',
      duration: this._calculateDuration(exp.startDate, exp.endDate)
    }));
  }

  _normalizeEducation(education) {
    if (!education || !Array.isArray(education)) return [];
    
    return education.map(edu => ({
      degree: edu.degree || edu.degreeType || '',
      field: edu.field || edu.major || edu.fieldOfStudy || '',
      institution: edu.institution || edu.school || edu.university || '',
      graduationYear: edu.graduationYear || edu.year || '',
      gpa: edu.gpa || ''
    }));
  }

  _buildKeywordIndex(profile) {
    const keywords = new Set();
    
    if (profile.skills) {
      profile.skills.forEach(skill => {
        const skillName = typeof skill === 'string' ? skill : skill.name;
        if (skillName) {
          keywords.add(skillName.toLowerCase());
        }
      });
    }
    
    if (profile.tools) {
      profile.tools.forEach(tool => {
        keywords.add(tool.toLowerCase());
      });
    }
    
    if (profile.workExperience) {
      profile.workExperience.forEach(exp => {
        const title = exp.title || exp.jobTitle || '';
        if (title) {
          title.toLowerCase().split(/\s+/).forEach(word => {
            if (word.length > 3) keywords.add(word);
          });
        }
      });
    }
    
    if (profile.certifications) {
      profile.certifications.forEach(cert => {
        keywords.add(cert.toLowerCase());
      });
    }

    return Array.from(keywords);
  }

  _calculateYearsExperience(workExperience) {
    if (!workExperience || !Array.isArray(workExperience)) return 0;
    
    let totalMonths = 0;
    workExperience.forEach(exp => {
      const months = this._calculateDuration(exp.startDate, exp.endDate);
      totalMonths += months;
    });
    
    return Math.round(totalMonths / 12 * 10) / 10;
  }

  _calculateDuration(startDate, endDate) {
    if (!startDate) return 0;
    
    const start = new Date(startDate);
    const end = endDate === 'Present' || !endDate ? new Date() : new Date(endDate);
    
    if (isNaN(start.getTime())) return 0;
    if (isNaN(end.getTime())) return 0;
    
    const diffTime = Math.abs(end - start);
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    
    return diffMonths;
  }

  _generateHash(profile) {
    const hashString = JSON.stringify({
      skills: profile.skills,
      workExperience: profile.workExperience,
      education: profile.education,
      yearsExperience: profile.yearsExperience,
      professionalTitle: profile.professionalTitle
    });
    
    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProfileCache;
}
