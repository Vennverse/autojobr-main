# Recruiter Workflow: How Pipeline, Applicants, Scorecards, Interviews & Tests Connect

## Overview
The AutoJobr recruiter workflow connects three main pages with integrated features for interviews, tests, and collaborative scorecards.

## Page Connections

### 1. **Enhanced Pipeline Management** (`/recruiter/enhanced-pipeline`)
**Primary Use**: Visual kanban board + list view for managing candidates through hiring stages

**Connected Features**:
- ✅ **AI Interview Assignment** - Button assigns virtual/chat interviews to candidates
  - Endpoint: `/api/virtual-interview/assign` or `/api/chat-interview/assign`
  - Opens dialog to configure interview type, difficulty, due date
  - Sends automated interview invite to candidate
  
- ✅ **Technical Test Assignment** - Button assigns coding/technical tests
  - Same dialog as interviews, with `assignmentType: "test"`
  - Sends test link to candidate
  
- ✅ **Interview Scheduling** - Schedule phone/technical/final interviews
  - Three quick-schedule buttons in candidate detail view
  - Endpoint: `/api/interviews/schedule`
  - Can also use appointment scheduler with Calendly-style email templates
  
- ✅ **NLP Analysis** - Opens AI-powered candidate analysis dialog
  - Shows ATS score, skills match, experience analysis
  - Displays strengths, risk factors, interview focus areas
  
- ✅ **Communication** - Direct email and chat with candidates
  - Email: Opens mailto with pre-filled template
  - Chat: Creates/opens conversation via `/api/simple-chat/conversations`

**Data Flow**:
1. Applications auto-populate from `/api/recruiter/applications`
2. Each application includes `applicantAtsScore`, `applicantResumeAnalysis` from linked resumes
3. Buttons trigger mutations that update application status and create related records

---

### 2. **Applicants Page** (`/recruiter/applicants`)
**Primary Use**: List view of all candidates with filtering and quick actions

**Connected Features**:
- ✅ **Chat Button** - Opens 1-on-1 chat with candidate
  - Redirects to `/chat?user=${candidateId}`
  
- ✅ **Email Button** - Opens default email client
  - Pre-fills candidate email address
  
- ✅ **View in Pipeline Button** - Navigates to Enhanced Pipeline
  - Redirects to `/recruiter/pipeline`
  - Shows candidate in their current stage

**Data Flow**:
1. Fetches from same `/api/recruiter/applications` endpoint
2. Calculates match scores using NLP analysis
3. Filters by job position and status
4. Clicking candidate card shows detailed modal

---

### 3. **Collaborative Hiring Scorecard** (`/collaborative-hiring-scorecard` or `/recruiter/scorecards`)
**Primary Use**: Team-based candidate evaluation with structured criteria

**Connected Features**:
- ✅ **Interview Feedback Submission**
  - Endpoint: `/api/recruiter/scorecard-feedback`
  - Stores ratings, comments, recommendation in `job_posting_applications.scorecard_data` (JSONB)
  
- ✅ **Multi-Criteria Ratings**
  - Technical Skills (30% weight)
  - Communication (20% weight)
  - Culture Fit (20% weight)
  - Relevant Experience (15% weight)
  - Problem Solving (15% weight)
  
- ✅ **Team Collaboration**
  - Multiple interviewers can submit feedback for same candidate
  - Calculates average scores across all feedback
  - Shows ATS score alongside interview feedback

**Data Flow**:
1. Lists all applications from `/api/recruiter/applications`
2. Shows ATS scores from `applicantAtsScore` field
3. On submission, updates `scorecard_data` column with:
   ```json
   {
     "ratings": { "technical": 4, "communication": 5, ... },
     "comments": "Strong candidate with...",
     "recommendation": "hire",
     "interviewerId": "user-123",
     "interviewerName": "Jane Smith",
     "submittedAt": "2025-10-27T21:49:00Z"
   }
   ```

---

## Database Schema Connections

### Core Tables:
1. **`job_posting_applications`** - Central table linking everything
   - `id` - Primary key
   - `applicantId` → links to `users` table
   - `jobPostingId` → links to `job_postings` table
   - `resumeId` → links to `resumes` table (NEW: auto-attached on apply)
   - `scorecardData` → JSONB storing all scorecard feedback (NEW)
   - `status` - Current pipeline stage

2. **`resumes`** - Candidate resume data
   - `atsScore` - AI-calculated ATS compatibility score
   - `analysis` - JSONB with AI resume analysis (skills, experience, etc.)

3. **`interviews`** - Scheduled interviews
   - `applicationId` → links back to applications
   - `interviewType` - phone, video, technical, etc.
   - `scheduledDate`, `meetingLink`, etc.

---

## Complete Workflow Example

### Scenario: Hiring a Software Engineer

1. **Application Received** → Enhanced Pipeline
   - Candidate applies to "Senior Software Engineer" job
   - System auto-attaches their active resume (`resumeId`)
   - ATS score (70) and analysis populated from resume

2. **Initial Screening** → Enhanced Pipeline
   - Recruiter views in "Applied" stage
   - Clicks NLP Analysis button → sees skills match, experience
   - Decides to proceed → drags to "Screening" stage

3. **Assign AI Interview** → Enhanced Pipeline
   - Clicks "Assign AI Interview" button (Video icon)
   - Selects: Virtual Interview, Medium difficulty, Due in 3 days
   - System sends email with interview link to candidate

4. **Schedule Phone Screen** → Enhanced Pipeline
   - Clicks "Schedule Phone Screen" button
   - Email sent with Calendly link
   - Once scheduled, moves to "Phone Screen" stage

5. **Team Scorecard** → Collaborative Scorecard Page
   - After phone screen, 3 team members access scorecard
   - Each rates candidate on 5 criteria (1-5 stars)
   - Leave comments and recommendation (hire/no hire)
   - System stores all feedback in `scorecard_data`

6. **Technical Test** → Enhanced Pipeline
   - Clicks "Assign Test" button (Code icon)
   - Sends coding challenge link
   - Candidate completes test

7. **Final Decision** → Any Page
   - Reviews:
     - ATS Score: 70
     - AI Interview: Passed
     - Phone Screen: Good
     - Team Scorecards: Avg 4.2/5, all "hire" recommendations
     - Technical Test: 85%
   - Drags to "Offer Extended" stage

---

## Current Implementation Status

✅ **Fully Working**:
- Enhanced Pipeline with all buttons functional
- Applicants page with chat, email, pipeline view
- Collaborative scorecard with database storage
- Interview assignment (virtual + chat)
- Test assignment
- Schedule appointments with email templates
- NLP analysis display
- ATS scoring from resumes

🔄 **Partially Connected**:
- Scorecard data is stored but not yet displayed back in Pipeline view
- Interview completion status not reflected in Pipeline
- Test results not automatically scored

💡 **Future Enhancements**:
- Display scorecard average scores in Pipeline cards
- Show "Interview Completed ✓" badges
- Auto-advance stages based on interview/test completion
- Aggregate team scorecard ratings into overall match score
- Email notifications when scorecards submitted

---

## API Endpoints Reference

| Endpoint | Method | Purpose | Connected From |
|----------|--------|---------|----------------|
| `/api/recruiter/applications` | GET | Fetch all applications | All pages |
| `/api/recruiter/candidate-profiles` | GET | Fetch ATS scores & analysis | Pipeline, Scorecard |
| `/api/recruiter/scorecard-feedback` | POST | Submit interview feedback | Scorecard page |
| `/api/virtual-interview/assign` | POST | Assign AI video interview | Pipeline |
| `/api/chat-interview/assign` | POST | Assign AI chat interview | Pipeline |
| `/api/interviews/schedule` | POST | Schedule traditional interview | Pipeline |
| `/api/recruiter/schedule-appointment` | POST | Send appointment email | Pipeline |
| `/api/simple-chat/conversations` | POST | Start chat with candidate | Pipeline, Applicants |
| `/api/recruiter/applications/{id}/status` | PATCH | Update candidate stage | Pipeline |

---

## Key Features That Make This Unique

1. **Auto-Resume Linking**: When candidates apply, their active resume is automatically attached, so ATS scores are immediately available in Pipeline
2. **Unified Data Model**: All features (interviews, tests, scorecards) link to the same `job_posting_applications` table
3. **AI-Powered Insights**: Every candidate has NLP analysis showing skills match, experience, education
4. **Team Collaboration**: Multiple team members can submit scorecards for same candidate
5. **Multi-Channel Communication**: Email, chat, and scheduling all integrated in one place
