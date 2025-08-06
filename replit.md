# AutoJobr - Job Application Platform

## Overview
AutoJobr is a comprehensive job application platform designed to connect job seekers with recruiters. It provides AI-powered resume analysis, intelligent job matching, and a robust recruitment management system. The platform aims to streamline the job application process for candidates and offer efficient hiring tools for recruiters, fostering a seamless talent acquisition ecosystem with high market potential.

## User Preferences
- **UI/UX Focus**: User prefers "BEST OF BEST" modern, beautiful UI/UX implementations
- **Feature Simplification**: Requested removal of AI recommendations tab for cleaner job browsing experience
- **Visual Quality**: Emphasis on premium, professional visual design and user experience
- **User Profile**: Main test user is Shubham Dubey (shubhamdubeyskd2001@gmail.com) - Job Seeker, password: 12345678
- **Test Recruiter**: shubhamdubexskd2001@gmail.com - Senior Technical Recruiter at TechCorp Solutions, password: 123456
- **Navigation Preferences**: 
  - Removed Applications tab from recruiter navbar (empty/unused)
  - Messages navigation should point to /chat instead of /messaging
  - Pipeline chat links should use format: /chat?user=userId
  - Removed "Revenue Generator" text from Premium Candidate Targeting for cleaner UI

## System Architecture

### Core Design Principles
- **AI-Powered Matching**: Utilizes AI for resume analysis, ATS scoring, and job matching.
- **Scalable Backend**: Built with Express.js and TypeScript, designed for high performance.
- **Modern Frontend**: React-based UI with strong emphasis on responsive design and user experience.
- **Robust Data Management**: Employs PostgreSQL for reliable data storage with comprehensive question bank.
- **Security First**: Implements session-based authentication and secure API practices.

### Recent Updates (August 2025)
- **Platform Migration**: ✅ COMPLETED - Successfully migrated from Replit Agent to standard Replit environment with PostgreSQL database integration, session-based authentication, and GROQ API integration for AI features. All critical premium API endpoints added: `/api/user` (with planType), `/api/usage/report`, `/api/subscription/current`, `/api/ranking-tests/usage`, `/api/ranking-tests/create`, `/api/premium/access/:feature`, `/api/premium/usage`. Premium feature handling fully implemented. Database schema fully synchronized with restored `freeRankingTestsRemaining` column and proper migration safety.
- **✅ CHAT SYSTEM COMPLETELY FIXED**: Fixed critical database schema issues preventing chat messages from being sent. Added missing `encrypted_content` column, corrected `sender_id` data type from integer to varchar, added required columns (`message_hash`, `compression_type`, `message_type`, `updated_at`), and made legacy `content` column nullable. Resolved SimpleChatService schema mismatches between field names (`content` vs `encryptedContent`, `conversationId` mapping). Chat messaging system now fully functional with PostgreSQL database - both sending messages and retrieving conversation history working perfectly. Optimistic updates now work instantly - messages appear immediately when sent and stay visible permanently. Disabled auto-refresh intervals and WebSocket invalidation that was causing sent messages to disappear after 1 second.
- **✅ PUBLIC JOB VIEWING WITH SIGNUP FLOW**: Enhanced `/jobs/:id` route to be publicly accessible without authentication for job discovery. Unauthenticated users see full job details with "Sign Up & Apply" button that redirects to `/auth?redirect=/jobs/{id}&action=apply`. After signup/login and onboarding completion, users are automatically redirected back to the original job to apply. Complete funnel: discover job → sign up → complete profile → return to job → apply. Perfect user acquisition flow.
- **Pipeline Status Fix**: ✅ COMPLETED - Fixed critical issue where changing applicant status in pipeline management wasn't moving applicants between columns. Resolved database field mismatch between frontend (`stage`) and backend (`status`) fields, ensuring proper status updates and UI synchronization.
- **Jobs Page Redesign**: Completely redesigned jobs page with LinkedIn-style UI/UX, featuring proper compatibility scoring (65-95% range), pagination (25 jobs per page), and side-by-side job detail view.
- **Analysis Score Fix**: Fixed calculation issues that were showing static scores (55/75) - now uses dynamic compatibility algorithm based user profile skills, experience level, and location preferences.
- **Enhanced Navigation**: Implemented comprehensive job browsing with search, filters, save functionality, and seamless job detail navigation with proper pagination controls.
- **Question Bank Enhancement**: Successfully populated database with 15 premium difficulty questions covering general aptitude, verbal reasoning, technical coding, case studies, behavioral scenarios, and domain-specific content.
- **Test Template System**: Fixed initialization issues and enabled "Initialize Platform Templates" functionality for recruiters.
- **Authentication System**: Resolved session management and crypto/ETag generation errors affecting mock interviews.
- **Database Optimization**: Questions now properly categorized with difficulty levels (hard/extreme) and comprehensive metadata including tags, keywords, and detailed explanations.
- **Messaging System Overhaul**: Fixed all critical messaging bugs including notification bell showing real unread counts, proper message read status tracking, and added chat navigation for both user types.
- **Landing Page Enhancement**: Created professional landing page and /for-recruiters page with compelling CTAs, generated professional logo and hero assets, implemented LinkedIn-style design with pricing sections, testimonials, and conversion optimization features.
- **Recruiter Applicants Page Migration**: Successfully replaced all mock/demo data with real API integration, connected functional recruiter tools (messaging, email, pipeline navigation), implemented proper loading states, empty states, and status update functionality for real-world applicant management.
- **Interview Assignment System**: Fixed SQL syntax errors in virtual interview assignment service, replaced raw SQL with proper Drizzle ORM operations, and verified functionality through `/recruiter/interview-assignments` page.
- **✅ COMPREHENSIVE SUBSCRIPTION LIMITS SYSTEM**: Implemented complete subscription enforcement across all recruiter features with detailed plan restrictions:
  - **Free Tier Limits**: Max 2 active job posts, 20 applicants per job, 10 combined test/interview assignments, 1 pre-built test template, basic AI scoring only, no chat access, basic analytics only
  - **Premium Tier Benefits**: Unlimited jobs and applicants, unlimited tests/interviews, full test library + custom tests, unlimited chat, advanced AI analytics, premium targeting, API integrations, background checks
  - **Middleware Integration**: Added subscription checking to all critical API endpoints (`/api/recruiter/jobs`, `/api/test-assignments`, `/api/interviews/*/assign`) with proper error messages and upgrade prompts
  - **Real-time Usage Monitoring**: Comprehensive usage tracking with live limit checking and remaining quota display
  - **Automatic Upgrade Flow**: Once recruiters purchase premium, they immediately get full system access with all restrictions removed

### Technical Implementation
- **Backend**: Express.js with TypeScript, session-based authentication using Passport.js, AI integration via Groq SDK, payment processing with Stripe and PayPal, email services with Resend and Nodemailer. Enhanced with LRU caching system using dependency tracking for reduced compute usage and improved performance.
- **Frontend**: React with TypeScript, Wouter for routing, Tailwind CSS and shadcn/ui for styling, React Query for state management, Vite as the build tool. Pipeline management includes resume viewing functionality with small icon buttons.
- **Chrome Extension**: Comprehensive extension with manifest.json, popup interface, content scripts, and background service worker. Supports auto-fill for 500+ job board platforms (LinkedIn, Indeed, Workday, Greenhouse, Lever, AshbyHQ, etc.), real-time job compatibility scoring, application tracking, and AI cover letter generation. Features a simplified circular floating button for access and advanced form detection.
- **UI/UX Decisions**: "BEST OF BEST" modern and beautiful UI/UX, premium professional visual design, simplified floating button interface, multiple view modes (Cards, Table, Kanban) for applications, enhanced statistics dashboard, and comprehensive empty state management. Features engaging elements like streaks, achievements, and progress tracking.
- **Performance Optimizations**: Comprehensive compute optimization strategy implemented including enhanced caching service with optimized LRU implementation, frequency-based eviction, automatic cleanup, real hit-rate tracking, file compression for resume storage, dependency-based cache invalidation, smart conditional requests with ETags, optimized messaging with WebSocket connections, reduced polling frequencies, database query optimization with proper indexing, frontend query batching, smart invalidation patterns, user session caching to reduce database calls, and performance monitoring to minimize system resource usage for 1M+ user scalability.

### Feature Specifications
- Resume upload and AI-powered ATS scoring with compression for storage optimization.
- Job posting and application management for recruiters with enhanced caching system and subscription limits.
- Real-time messaging between recruiters and candidates (premium feature for recruiters).
- Payment processing for premium features and services (e.g., test retakes, job promotion).
- Virtual AI interviews and coding tests with AI detection (limited by subscription tier).
- Comprehensive application tracking and analytics for job seekers.
- Role-based access and consistent user type management (job seeker, recruiter).
- Advanced API key rotation system for Groq and Resend.
- Resume viewing functionality with new tab opening for recruiters (with AI scoring restrictions).
- LRU-based caching system with dependency tracking for improved performance.
- **Comprehensive Subscription Enforcement System**: All recruiter features properly gated by subscription limits with automatic premium access after payment.
- **Two-Tier Plan Structure**: Free tier with specific limits (2 jobs, 20 applicants per job, 10 test assignments, basic features only) and Premium tier with unlimited access to all features.
- **Real-time Limit Checking**: API routes validate current usage against subscription limits before allowing actions, with informative error messages and upgrade prompts.

## External Dependencies
- **Database**: Neon PostgreSQL
- **AI/NLP**: Groq SDK (for resume analysis, job matching, cover letter generation)
- **Payment Gateways**: Stripe, PayPal
- **Email Services**: Resend, Nodemailer (with Postal SMTP fallback)
- **Authentication**: Passport.js
- **Cloud Hosting**: Replit