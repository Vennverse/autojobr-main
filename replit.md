# AutoJobr - Job Application Automation Platform

## Overview
AutoJobr is a full-stack web application designed to automate and streamline the job application process. Its primary purpose is to help users efficiently apply to a large volume of jobs by providing features such as ATS resume optimization, AI-powered cover letter generation, interview preparation, and a Chrome extension for one-click applications. The platform aims to simplify job searching, enhance application quality, and provide tools for career advancement, positioning itself as a comprehensive solution for job seekers.

## Recent Changes (October 25, 2025)
- **Unified ATS Platform Bug Fixes** (Latest): Fixed critical issues in the unified ATS platform:
  - **Backend Data Fixes**: 
    - Added `candidateName` and `jobTitle` fields to storage.ts query response (previously only returned `applicantName` and `jobPostingTitle`)
    - Fixed unifiedAtsService.ts join condition from incorrect `userId` to correct `applicantId`, resolving "Unknown Candidate" display issue
  - **Filtering Functionality**: 
    - Added filter dropdowns for Job Position and Application Status on Applications tab
    - Implemented client-side filtering logic with proper state management
    - Updated "Select All" checkbox to work with filtered results
    - Added contextual empty states for filtered vs unfiltered views
  - **Feature Verification**: 
    - Confirmed bulk email system works with template selection (rejection, acceptance, interview invite, custom)
    - Verified interview scheduling through "Schedule" button on each application row
    - Confirmed calendar integration auto-syncs scheduled interviews to Google Calendar
    - Verified scorecards redirect to dedicated collaborative hiring scorecard page

- **SEO Landing Pages & Feature Enhancements**: Created world-class competitive landing pages and strategic improvements:
  - **Greenhouse Alternative Page** (`/greenhouse-alternative`): Comprehensive comparison page targeting companies considering Greenhouse alternatives, highlighting 90% cost savings ($6,500/year → $588/year), AI features Greenhouse lacks, and detailed feature comparison table
  - **ATS for Startups Page** (`/ats-for-startups`): Startup-focused landing page addressing pain points of expensive enterprise ATS systems, with stage-specific features (Pre-Seed to Series C+), unique value props, and simple pricing
  - **AI Interview Platform Page** (`/ai-interview-platform`): Showcase of AI-powered virtual interview capabilities with video and chat options, industry templates, anti-cheating features, and 80% time-saving ROI metrics
  - **Enhanced RecruiterNavbar**: Added "More Tools" dropdown organizing all recruiter features into categories (Hiring & Interviews, Sourcing & Targeting, Management Tools) with icons and premium indicators
  - **SEO Routing Strategy**: Multiple URL variants for each page targeting different search queries (e.g., /applicant-tracking-system, /affordable-ats-software, /recruiting-software-startups all route to ATS for Startups page)
  - **Competitive Analysis Documentation**: Created COMPETITIVE_ADVANTAGES.md outlining 12 unique features AutoJobr has that Greenhouse/Workday/Lever don't have, market positioning strategy, and SEO content roadmap

## Recent Changes (October 19, 2025)
- **LinkedIn Optimizer Integration & Platform Improvements**: Enhanced the LinkedIn Profile Optimizer feature and fixed critical platform issues:
  - **OAuth Fixes**: Fixed Google and LinkedIn OAuth callback URLs to use dynamic baseUrl instead of hard-coded autojobr.com, enabling OAuth to work in all environments (development, staging, production)
  - **LinkedIn Optimizer Routes**: Added /linkedin-optimizer route to App.tsx for all user roles (recruiters, job seekers, default users)
  - **Premium AI Tools Enhancement**: Added LinkedIn Optimizer tab to Premium AI Tools page with Globe icon and feature cards showcasing headline generation, About section optimization, and keyword analysis
  - **Demo Data Removal**: Removed all placeholder analytics data from LinkedIn Optimizer (profileViews, searchAppearances, engagementRate, connectionGrowth, contentPerformance) to show only real user data
  - **SEO Implementation**: Added comprehensive SEO meta tags to LinkedIn Optimizer and Premium AI Tools pages including title, description, keywords, Open Graph, Twitter Card, and canonical URL tags
  - **404 Page Enhancement**: Updated NotFound page to show login prompt with redirect for unauthenticated users instead of generic 404 error, improving user experience
  - **WebSocket Fix**: Fixed critical Vite HMR WebSocket error by implementing conditional protocol selection (wss for Replit HTTPS, ws for local HTTP development), resolving "Failed to construct 'WebSocket'" browser security errors
  
## Recent Changes (October 18, 2025)
- **Referral Marketplace Trust & Verification System**: Transformed the employee referral marketplace into a professional, trustworthy platform with industry best practices:
  - **Database Schema**: Added meeting scheduling, dual-party confirmation fields (meetingConfirmedByJobSeeker, meetingConfirmedByReferrer, deliveryConfirmedByJobSeeker, deliveryConfirmedByReferrer), dispute handling, and completion tracking
  - **Backend API**: Created 3 new endpoints for meeting/delivery confirmation and email domain verification
  - **Service Methods**: Implemented confirmDelivery(), confirmMeeting(), and verifyCompanyEmail() with dual-party confirmation logic that releases escrow payment only when both parties confirm service delivery
  - **Trust Indicators**: Added prominent disclaimer on marketplace homepage explaining: (1) No job offer guarantee, (2) Escrow protection, (3) Verified company emails only, (4) Meeting confirmation required from both parties
  - **Meeting Scheduling**: Integrated Calendly/Cal.com link collection in become-referrer form with optional email template customization
  - **Confirmation Flow**: Added meeting and delivery confirmation buttons to my-bookings page with visual status tracking for both job seekers and referrers
  - **Email Domain Verification**: Backend service validates that referrers use official company emails (blocks Gmail, Yahoo, etc.)
  - **Payment Protection**: Dual-party confirmation ensures payments held in escrow until both parties verify service completion

- **Performance Optimization & Bug Fixes**: Addressed critical performance issues and glitches identified by users:
  - Fixed Vite HMR WebSocket errors by properly configuring HMR for Replit environment
  - Fixed TypeScript errors in PWA service (pwa.ts) for better type safety
  - Added caching to slow API endpoints (/api/applications, /api/resumes) reducing response times from 800-1200ms to near-instant on cache hits
  - Fixed redundant API calls on dashboard pages by adding `enabled` flag to queries, preventing calls before authentication is ready
  - Eliminated duplicate 401 errors and retry loops that were doubling server load

## Recent Changes (October 15, 2025)
- **LinkedIn Share Verification for Test Retakes**: Implemented dual-option retake system allowing users to unlock test retakes by either:
  - **Payment Option**: $5 one-time payment via PayPal or Amazon Pay
  - **LinkedIn Share Option**: Share test experience on LinkedIn and verify post URL for free retake access
  - Backend API validates LinkedIn posts using LinkedIn oEmbed API
  - Database tracking for retake method, LinkedIn share URL, and verification status
  - User-friendly tabbed interface with clear step-by-step instructions
  - Real-time verification and instant retake access upon successful validation
- **Landing Page Hero Redesign**: Implemented auto-rotating hero slider (8 slides, 5-second intervals) showcasing AI-powered tools and features:
  1. AI Career Coach - personalized guidance
  2. AI Interview Practice - real-time video + voice analysis
  3. AI Cover Letter Generator - instant personalization
  4. AI Resume Optimizer - ATS score analysis
  5. AI Job Search - smart matching
  6. Chrome Extension - 1-click applications
  7. Referral Network - 10K+ employees at 500+ companies
  8. AI Recruiter Tools - for hiring managers
- **Navigation Enhancement**: Added navbar links to Referral Network, Become Referrer, For Recruiters, Features, and Pricing
- **Content Balance**: Reordered hero slides to prioritize AI-powered tools over referral network, addressing user feedback about over-emphasis on referrals
- **Interactive Elements**: Added clickable slide indicators for manual navigation, live application counter, and smooth slide transitions
- **Conversion Optimization**: Enhanced landing page for higher conversion rates:
  - Added dynamic social proof stats with gradient styling and hover effects
  - Created 3-column comparison table (Traditional vs Other Platforms vs AutoJobr)
  - Enhanced pricing section with urgency badges, social proof, and trust indicators
  - Added comprehensive FAQ section (6 questions) addressing common objections
  - Included trust badges: SSL Encrypted, Secure Payments, 30-Day Money Back, Instant Access
  - Added limited-time offer badge: "First 1,000 users get Premium FREE for 30 days"
  - Enhanced testimonials with 5-star ratings and employee credentials

## User Preferences
I prefer detailed explanations. I want iterative development. Ask before making major changes. Focus on AI-powered tools as primary value proposition, with referral network as a unique differentiator.

## System Architecture
The project employs a monolithic architecture, combining the frontend and backend within a single repository.
-   **Frontend**: Built with React 18, TypeScript, Vite, Tailwind CSS for styling, shadcn/ui for components, and Wouter for routing.
-   **Backend**: Developed using Express.js and Node.js.
-   **Database**: PostgreSQL, utilizing Drizzle ORM for schema definition and interaction.
-   **Authentication**: Implemented with Passport.js, supporting Google OAuth and local strategies.
-   **AI Integration**: Leverages multiple AI providers including Groq, OpenRouter, OpenAI, and Anthropic for features like resume optimization and cover letter generation.
-   **Payments**: Integrates with Stripe, PayPal, and Razorpay for subscription management.
-   **Email Services**: Uses Resend, SendGrid, and Nodemailer for notifications and communication.
-   **Real-time Communication**: Utilizes WebSockets (`ws`) for features like real-time chat.
-   **UI/UX Decisions**: Employs a modern design approach using Tailwind CSS and shadcn/ui components for a consistent and responsive user interface.
-   **Feature Specifications**:
    -   Job Search & Auto-Apply with automated submission.
    -   ATS Resume Optimization for AI-powered analysis.
    -   Personalized Cover Letter Generation.
    -   AI-powered Interview Preparation with feedback.
    -   Chrome Extension for one-click applications.
    -   Dashboard for Job Tracking.
    -   Subscription Management.
    -   WebSocket-based Real-time Chat.
-   **System Design Choices**:
    -   Vite dev server operates in middleware mode during development.
    -   Production builds output to a `dist/` directory.
    -   Session storage is handled via PostgreSQL to support multi-instance deployments.
    -   The WebSocket server runs on the same port as the HTTP server.
    -   Replit-specific configurations include running `npm run dev` on port 5000, utilizing Replit PostgreSQL, and being configured for Replit Autoscale deployment.

## Known Technical Debt (October 18, 2025)
**CRITICAL - Requires Future Refactoring:**
- **server/routes.ts God File**: Nearly 8000 lines with 67 LSP errors, duplicate route registrations, and fragile routing order
  - Multiple definitions of same endpoints (e.g., /api/user defined twice at lines 515 and 5234)
  - Duplicate CRM, auth, and other routes causing handler shadowing issues
  - Should be refactored into domain-specific routers (auth, users, jobs, applications, CRM, etc.)
- **Performance Issues**: 
  - No pagination on list endpoints - fetches full result sets causing slow queries as data grows
  - Missing database indexes on frequently queried foreign keys
  - Some endpoints still lack caching
- **Authentication Flow**: 
  - Inconsistent auth middleware - some routes use req.user, others use req.session.user
  - Session fingerprint recovery mode triggered frequently indicating session management issues
  - Frontend makes redundant auth checks before session is fully hydrated
- **Code Quality**:
  - Multiple backup files in server/ directory (routes.ts.backup, routes.ts.original.backup, routes.ts.fixed)
  - Deduplication middleware ineffective due to duplicate route registrations

**Recommendations for Future:**
1. Break server/routes.ts into modular routers by domain
2. Add pagination to all list endpoints
3. Audit and add database indexes for foreign keys
4. Standardize authentication middleware across all routes
5. Clean up backup files and duplicate code

## External Dependencies
-   **Databases**: PostgreSQL (via Neon/Replit Database)
-   **ORM**: Drizzle ORM
-   **Authentication Providers**: Google OAuth
-   **AI Services**: Groq, OpenRouter, OpenAI, Anthropic
-   **Payment Gateways**: Stripe, PayPal, Razorpay
-   **Email Services**: Resend, SendGrid, Nodemailer
-   **Real-time Communication Libraries**: `ws` (WebSocket)