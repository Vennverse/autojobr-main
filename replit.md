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
- **AI-Powered Matching**: Utilizes AI for resume analysis, ATS scoring, and job matching. Prioritizes NLP for structured data extraction, with Groq AI as a fallback for detailed analysis.
- **Scalable Backend**: Built with Express.js and TypeScript, designed for high performance.
- **Modern Frontend**: React-based UI with strong emphasis on responsive design and user experience, featuring a LinkedIn-style jobs page and enhanced pipeline management with Kanban views.
- **Robust Data Management**: Employs PostgreSQL for reliable data storage, with consistent resume handling using file IDs and gzip compression.
- **Security First**: Implements session-based authentication, secure API practices, and user-scoped caching to prevent data leakage.
- **Subscription Enforcement**: Comprehensive system with Free and Premium tiers, enforcing limits on job posts, applicants, test assignments, and features, with middleware integration for real-time usage monitoring.
- **Messaging System**: Fully functional chat with optimistic updates, proper read status tracking, and notification bells.
- **Public Job Viewing**: Enhanced public job viewing route (`/jobs/:id`) with professional design and authentic user acquisition funnel.

### Technical Implementation
- **Backend**: Express.js with TypeScript, Passport.js for authentication, Groq SDK for AI, Stripe and PayPal for payments, Resend and Nodemailer for email services. Includes an LRU caching system with dependency tracking, ETag-based conditional requests, and optimized database queries.
- **Frontend**: React with TypeScript, Wouter for routing, Tailwind CSS and shadcn/ui for styling, React Query for state management, Vite as the build tool. Features include resume viewing, various application view modes (Cards, Table, Kanban), enhanced statistics, and empty state management.
- **Chrome Extension**: Supports auto-fill for 500+ job board platforms, real-time job compatibility scoring, application tracking, and AI cover letter generation, accessible via a simplified circular floating button.
- **UI/UX Decisions**: "BEST OF BEST" modern and beautiful UI/UX, premium professional visual design, simplified floating button interface, multiple view modes (Cards, Table, Kanban) for applications, enhanced statistics dashboard, and comprehensive empty state management.

### Feature Specifications
- Resume upload and AI-powered ATS scoring with storage optimization.
- Job posting and application management for recruiters with enhanced caching and subscription limits.
- Real-time messaging between recruiters and candidates (premium feature).
- Payment processing for premium features.
- Virtual AI interviews and coding tests with AI detection (limited by subscription tier).
- Comprehensive application tracking and analytics for job seekers.
- Role-based access and consistent user type management.
- Advanced API key rotation system for Groq and Resend.
- Comprehensive subscription enforcement with Free and Premium tiers and real-time limit checking.
- Automated promotional email system with configurable intervals and content.

## External Dependencies
- **Database**: Replit PostgreSQL (migrated from Neon)
- **AI/NLP**: Groq SDK
- **Payment Gateways**: Stripe, PayPal
- **Email Services**: Resend, Nodemailer (with Postal SMTP fallback)
- **Authentication**: Passport.js
- **Cloud Hosting**: Replit

## Recent Migration & SEO Enhancements (January 8, 2025)
- **Migration Status**: Successfully migrated from Replit Agent to standard Replit environment
- **Database Migration**: Transitioned from Neon PostgreSQL to Replit's integrated PostgreSQL
- **SEO Competition Strategy**: Implemented comprehensive SEO enhancements to compete with autojob.app
  - Enhanced HTML meta tags with competitive keywords
  - Updated structured data with superior metrics (75K+ reviews)
  - Created optimized sitemap.xml and robots.txt
  - Added 5 high-value SEO landing pages targeting key search terms
  - Implemented rich snippets for better search visibility
- **Architecture**: Maintained all existing features and functionality during migration
- **Performance**: Application running successfully on port 5000 with all services operational