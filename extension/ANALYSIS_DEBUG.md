# AutoJobr Analysis Debug Guide

## Common Issues with 16% Score

### Issue: Always Shows 16% Match
This happens when:
1. **No User Skills Data**: If the extension can't load user skills from the platform
2. **Authentication Problems**: User not properly logged into AutoJobr platform
3. **API Connection Issues**: Extension can't fetch user profile data
4. **Empty Skills Array**: User hasn't added skills to their profile

### Debugging Steps

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for AutoJobr logs starting with 🔍, 🎯, 📊
   - Check for authentication errors or API failures

2. **Verify User Profile**
   - Ensure you're logged into the AutoJobr platform
   - Check that your profile has skills added
   - Verify work experience is filled out

3. **Check Extension Logs**
   Look for these specific debug messages:
   ```
   🔍 Analysis Debug: {skillsCount: X, experienceCount: Y}
   🎯 Processing: {userSkillsCount: X}
   📈 Experience Analysis: X years = Y% score
   🎯 Skill Analysis: {matched: [...], score: X}
   ```

### Expected Behavior

**With Complete Profile:**
- Skills: 5+ skills → Should get 40-100% match depending on job relevance
- Experience: 3+ years → Should get 70%+ experience score
- Final Score: Weighted combination (50% skills + 30% experience + 20% resume)

**With Minimal Profile:**
- No skills → Gets base score of 25%
- No experience → Gets base score of 20%
- Empty profile → Gets fallback scores

### Fix Instructions

1. **Complete Your AutoJobr Profile**
   - Add at least 5-10 relevant skills
   - Fill out work experience with dates
   - Complete your job title and summary

2. **Reload Extension**
   - Go to chrome://extensions/
   - Click refresh button on AutoJobr extension
   - Clear extension cache if needed

3. **Test on Job Pages**
   - Navigate to a job posting
   - Click the AutoJobr extension icon
   - Click "AI Job Analysis" button
   - Check console for detailed logs

### Manual Testing

Use the test file: `extension/test-analysis.html`
- Open in browser to test analysis logic
- Modify mock data to test different scenarios
- Verify scoring calculations work correctly