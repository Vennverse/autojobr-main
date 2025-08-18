# AutoJobR - AI-Powered Job Application Platform

## Project Overview
AutoJobR is a comprehensive full-stack JavaScript application designed to streamline job applications using AI technology. The platform supports both job seekers and recruiters with features including automated job matching, AI-powered interviews, resume analysis, and premium subscription services.

## Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS, Radix UI components
- **Backend**: Express.js with TypeScript, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with Google OAuth and local strategies
- **Payment Processing**: Stripe and PayPal integration
- **AI Services**: Groq, OpenAI, and custom NLP services
- **Real-time Communication**: WebSocket for chat features
- **File Storage**: Local file system with multer

### Project Structure
```
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route-specific pages
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions and configurations
├── server/              # Express backend API
│   ├── routes/          # API route handlers
│   ├── middleware/      # Custom middleware functions
│   └── services/        # Business logic services
├── shared/              # Shared TypeScript schemas and types
└── migrations/          # Database migration files
```

### Key Features
1. **Job Discovery & Matching**: AI-powered job recommendations
2. **Resume Analysis**: Automated resume parsing and optimization
3. **Virtual Interviews**: AI-conducted interview sessions
4. **Chat System**: Real-time messaging between users
5. **Premium Features**: Subscription-based advanced functionality
6. **Chrome Extension**: Browser integration for job applications
7. **Recruiter Dashboard**: Tools for managing candidates and job postings
8. **Payment Integration**: Stripe and PayPal for subscriptions and one-time payments

## Development Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (automatically configured by Replit)
- `STRIPE_SECRET_KEY`: Stripe payment processing (optional)
- `GROQ_API_KEY`: AI service integration (optional)
- `PAYPAL_CLIENT_ID` & `PAYPAL_CLIENT_SECRET`: PayPal integration (optional)

### Running the Application
The project uses a single command to start both frontend and backend:
```bash
npm run dev
```
This serves the application on port 5000 with both API and client routes.

## Database Schema
The application uses Drizzle ORM with PostgreSQL. Schema is defined in `shared/schema.ts` with automatic type generation for both insert and select operations.

## Recent Changes

### Simplified PayPal Subscription System (August 18, 2025)
- ✅ **SIMPLIFIED TIERS**: Reduced job seeker subscription tiers from 4 to only 2: Premium Monthly ($5) and Ultra Premium Monthly ($15)
- ✅ **PAYPAL-ONLY PAYMENTS**: Removed all other payment options (Stripe, Razorpay) for cleaner, simpler checkout experience
- ✅ **DIRECT PAYPAL INTEGRATION**: Implemented PayPal subscription buttons with specific plan IDs: P-9SC66893530757807NCRWYCI (Premium) and P-5JM23618R75865735NCRXOLY (Ultra Premium)
- ✅ **PAYMENT VERIFICATION SYSTEM**: Added backend endpoint `/api/paypal/verify-subscription` for secure payment verification and premium access control
- ✅ **AUTOMATIC PREMIUM ACTIVATION**: Users get instant premium access after PayPal payment approval with automatic database updates
- ✅ **CLEAN UI REDESIGN**: Completely redesigned premium page with only essential features, removed cluttered payment method selections
- ✅ **SUBSCRIPTION MANAGEMENT**: Proper subscription record storage with PayPal subscription IDs, billing cycles, and expiration dates
- ✅ **PREMIUM ACCESS CONTROL**: Backend properly updates user planType (premium/ultra_premium) and subscription status for feature access
- ✅ **USER EXPERIENCE**: Streamlined checkout flow with instant activation notifications and cache invalidation for real-time updates

### Resume Upload & Task Management System (August 18, 2025)
- ✅ **RESUME UPLOAD AUTOMATION**: Implemented comprehensive resume management system with PostgreSQL database storage
- ✅ **CHROME EXTENSION INTEGRATION**: Enhanced Chrome extension with automatic resume field detection and file upload capabilities
- ✅ **TASK MANAGEMENT WITH REMINDERS**: Built complete task management system with Chrome extension popup notifications
- ✅ **DATATRANSFER API IMPLEMENTATION**: Used DataTransfer API to programmatically upload resumes to job application forms
- ✅ **COMPREHENSIVE API ROUTES**: Added full CRUD operations for both resume and task management (/api/resumes/*, /api/tasks/*)
- ✅ **DATABASE SCHEMA ENHANCEMENT**: Extended schema with userResumes, tasks, and taskReminders tables with proper relationships
- ✅ **BACKGROUND SERVICE UPGRADE**: Enhanced extension background.js with resume upload, task creation, and reminder notification methods
- ✅ **CONTENT SCRIPT ENHANCEMENT**: Added 100+ job board support for automatic resume field detection and upload
- ✅ **NOTIFICATION SYSTEM**: Implemented Chrome extension alarm-based task reminders with complete/snooze functionality
- ✅ **FILE STORAGE INTEGRATION**: Integrated with existing file storage system for resume persistence and retrieval

### Chat Interview Assignment System Integration (August 17, 2025)
- ✅ **MAJOR UPDATE**: Fixed recruiter assignment system to use new AI chat interview system
- ✅ **API ENDPOINT MIGRATION**: Changed virtual interview assignments from `/api/interviews/virtual/assign` to `/api/chat-interview/assign`
- ✅ **UNIFIED SYSTEM**: Recruiters now assign modern conversational AI interviews instead of legacy question-based interviews
- ✅ **ENHANCED EMAIL NOTIFICATIONS**: Updated assignment emails with chat interview details and proper links
- ✅ **SEAMLESS EXPERIENCE**: Candidates now receive links directly to the AI chat interview system
- ✅ **TYPE SAFETY**: Fixed TypeScript errors in assignment logic for better reliability
- ✅ **BACKWARD COMPATIBILITY**: Maintained all existing assignment functionality while upgrading to new system
- ✅ **RECRUITER WORKFLOW**: Assignment modal now creates chat interviews with AI conversational flow
- ✅ **CANDIDATE EXPERIENCE**: Assigned interviews use the advanced AI chat system with real-time responses

### Recruiter Dashboard Authentication Fix (August 16, 2025)
- ✅ **CRITICAL FIX**: Resolved recruiter dashboard not loading after login
- ✅ Fixed TypeError: Cannot read properties of undefined (reading 'filter') errors
- ✅ Implemented safe array handling for all dashboard data (jobs, applications, conversations)
- ✅ Updated user role routing logic to handle all recruiter variations (currentRole, userType)
- ✅ Fixed authentication fallback data to include both userType and currentRole
- ✅ Added loading state protection to prevent rendering before user data loads
- ✅ Created missing recruiter user accounts in database for immediate access
- ✅ Updated database user roles from 'autojobr' to proper 'recruiter' role
- ✅ **FUTURE USERS CONFIRMED**: All new recruiter users will get 'recruiter' role instead of 'autojobr'
- ✅ **AUTOMATIC ROLE DETECTION**: Company email users (@vennverse.com, etc.) automatically get recruiter access
- ✅ **SEAMLESS REGISTRATION**: New users automatically get appropriate roles with proper database values
- ✅ **ROBUST ROUTING**: App.tsx handles all role combinations and authentication states perfectly
- ✅ **SESSION MANAGEMENT**: Both userType and currentRole properly preserved across sessions
- ✅ **DATABASE INTEGRATION**: User roles properly stored and updated in PostgreSQL with correct values
- ✅ **GOOGLE OAUTH + EMAIL**: Both authentication methods work seamlessly for future users
- ✅ **DASHBOARD ACCESS**: Future recruiters automatically access recruiter dashboard without issues
- ✅ **BULK JOB CREATION**: Authentication system supports job creation scripts and API access

## Recent Changes

### Google OAuth Authentication Fix (August 12, 2025)
- ✅ Fixed Google OAuth redirect URI issues by using autojobr.com domain
- ✅ Configured GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables
- ✅ Added support for both .repl.co and .replit.dev domain detection
- ✅ Resolved 404 errors during OAuth callback process
- ✅ Authentication system now supports both email/password and Google OAuth

### Comprehensive Resume Analysis Enhancements (August 14, 2025)
- ✅ Implemented 5 major resume analysis improvements for superior user experience
- ✅ **Real-time Score Breakdown**: Detailed scoring across keywords, formatting, content, and ATS compatibility
- ✅ **Interactive Improvement Wizard**: One-click fixes with AI-powered rewrite suggestions
- ✅ **Before/After Comparison**: Visual progress tracking showing score improvements and metrics
- ✅ **Job-Specific Optimization**: Target role analysis with industry-specific recommendations
- ✅ **AI-Powered Rewrite Suggestions**: Specific text improvements with explanations and metrics
- ✅ Enhanced ResumeAnalysis interface with comprehensive scoring breakdown
- ✅ Created advanced ResumeAnalysisModal with tabbed interface and interactive components
- ✅ Added support for detailed keyword optimization, formatting analysis, and content enhancement
- ✅ Integrated framer-motion animations for smooth user experience

### Migration from Replit Agent (August 14, 2025)
- ✅ Successfully completed migration from Replit Agent to standard Replit environment
- ✅ PostgreSQL database configured and connected properly
- ✅ All dependencies verified and working correctly
- ✅ Secure client/server separation maintained
- ✅ Application running successfully on port 5000
- ✅ All services initialized: AI, payments, authentication, file storage
- ✅ Fixed Google OAuth configuration for HTTPS production deployment
- ✅ Updated callback URLs to properly support autojobr.com domain with HTTPS
- ✅ Resolved TypeScript errors in both job seeker and recruiter dashboards
- ✅ Authentication working across all pages and Chrome extension
- ✅ Migration checklist completed successfully

### Replit Migration Completion (August 13, 2025)
- ✅ Successfully migrated AutoJobR from Replit Agent to standard Replit environment
- ✅ PostgreSQL database provisioned and connected successfully
- ✅ All dependencies installed and verified working
- ✅ Server running on port 5000 with all services initialized
- ✅ Authentication system properly configured (Google OAuth requires credentials)
- ✅ Client/server separation maintained with security best practices
- ✅ Google OAuth functionality configured with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- ✅ Google OAuth callback route `/api/auth/google/callback` working properly

### Google Indexing Issues Fixed (August 13, 2025)
- ✅ Fixed robots.txt blocking important pages - now allows about, contact, blog, chrome-extension, ats-optimizer
- ✅ Updated sitemap.xml with current dates (2025-08-13) and all important pages
- ✅ Created RSS feed (feed.xml) for better content discovery
- ✅ Implemented SEO meta tags component with proper Open Graph and Twitter cards
- ✅ Created missing pages that were causing "currently not indexed" errors:
  - /about - Company information and mission
  - /contact - Contact form and support information  
  - /blog - Career automation tips and insights
  - /chrome-extension - Browser extension download page
  - /ats-optimizer - Resume optimization tool
- ✅ Updated routing to make all SEO pages accessible to search engines
- ✅ All pages now have proper meta descriptions, keywords, and structured data

### Strategic SEO Keyword Optimization (August 13, 2025)
- ✅ Implemented comprehensive high-traffic, low-competition keyword strategy
- ✅ Created targeted landing pages for student and job seeker keywords:
  - /best-job-application-tools-2025 - Tool comparison and reviews
  - /remote-jobs-students-2025 - Remote work opportunities for students
  - /1-click-apply-jobs - Instant job application automation
  - /job-application-autofill-extension - Chrome extension autofill features
- ✅ Added long-tail keyword routes for maximum search coverage:
  - /freshers-remote-jobs-2025
  - /linkedin-job-application-autofill-tool
  - /ai-job-application-tracker-free
  - /how-to-apply-jobs-faster-online
- ✅ Enhanced sitemap.xml with 40+ strategic keyword URLs
- ✅ Each page optimized with:
  - High-value target keywords in titles and descriptions
  - Structured data for rich snippets
  - Student and college-focused content
  - Geographic targeting for major cities
  - Feature comparisons and tool reviews
- ✅ Targeting keywords with high search volume but low competition
- ✅ Focus on job seekers, students, freshers, and remote work themes

## Security Features
- CORS configuration for multiple domains including job sites
- Session management with secure cookie handling
- Input validation using Zod schemas
- File upload restrictions and security
- API rate limiting and performance monitoring

## User Preferences
*To be updated based on user interactions and preferences*

## Future User Access
The authentication system is fully configured to handle future users:

### Automatic Role Assignment
- **Job Seekers**: Default role for most new registrations
- **Recruiters**: Auto-detected based on email patterns (hr@, talent@, recruiting@, etc.)
- **Google OAuth**: Seamlessly creates accounts with appropriate roles
- **Email Login**: Works with role detection and proper dashboard routing

### Role Detection Logic  
- Email domain analysis for corporate/recruiting patterns
- Keyword detection in email addresses (hr, talent, recruiting, careers)
- Fallback to job_seeker for ambiguous cases
- Manual role switching available via API endpoint

### Database Schema
- `userType`: Primary role (job_seeker, recruiter, admin)
- `currentRole`: Active role (supports future role switching)
- Proper PostgreSQL storage with Drizzle ORM integration
- Session persistence across browser restarts

## Notes
- The application is designed to work with multiple AI providers with graceful fallbacks
- Payment features are optional and can be enabled with proper API keys
- Chrome extension integration allows seamless job application automation
- Real-time features use WebSocket connections for optimal performance