# AutoJobr - Job Application Platform

## Overview
AutoJobr is a comprehensive job application platform connecting job seekers with recruiters. It offers AI-powered resume analysis, intelligent job matching, and a robust recruitment management system. The platform aims to streamline the job application process for candidates and provide efficient hiring tools for recruiters, fostering a seamless talent acquisition ecosystem with high market potential.

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
- **AI-Powered Matching**: Utilizes AI for resume analysis, ATS scoring, and job matching, prioritizing NLP with Groq AI as a fallback.
- **Scalable Backend**: Built with Express.js and TypeScript for high performance.
- **Modern Frontend**: React-based UI with a strong emphasis on responsive design and user experience, featuring a LinkedIn-style jobs page and enhanced pipeline management with Kanban views.
- **Robust Data Management**: Employs PostgreSQL for reliable data storage, with consistent resume handling using file IDs and gzip compression.
- **Security First**: Implements session-based authentication, secure API practices, and user-scoped caching.
- **Subscription Enforcement**: Comprehensive system with Free and Premium tiers, enforcing limits and integrating middleware for real-time usage monitoring.
- **Messaging System**: Fully functional chat with optimistic updates, read status tracking, and notifications.
- **Public Job Viewing**: Enhanced public job viewing route (`/jobs/:id`) for professional design and user acquisition.

### Technical Implementation
- **Backend**: Express.js with TypeScript, Passport.js for authentication, Groq SDK for AI, Stripe and PayPal for payments, Resend and Nodemailer for email services. Includes LRU caching, ETag-based conditional requests, and optimized database queries.
- **Frontend**: React with TypeScript, Wouter for routing, Tailwind CSS and shadcn/ui for styling, React Query for state management, Vite as the build tool. Features include resume viewing, various application view modes (Cards, Table, Kanban), enhanced statistics, and empty state management.
- **Chrome Extension**: Supports auto-fill for 500+ job board platforms, real-time job compatibility scoring, application tracking, and AI cover letter generation via a simplified circular floating button.
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
- Comprehensive interview feedback system with performance analysis and detailed insights.

## External Dependencies
- **Database**: Replit PostgreSQL
- **AI/NLP**: Groq SDK
- **Payment Gateways**: Stripe, PayPal
- **Email Services**: Resend, Nodemailer
- **Authentication**: Passport.js, Google OAuth
- **Cloud Hosting**: Replit