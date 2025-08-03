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
- **Platform Migration**: Successfully migrated from Replit Agent to standard Replit environment with PostgreSQL database integration and session-based authentication.
- **Jobs Page Redesign**: Completely redesigned jobs page with LinkedIn-style UI/UX, featuring proper compatibility scoring (65-95% range), pagination (25 jobs per page), and side-by-side job detail view.
- **Analysis Score Fix**: Fixed calculation issues that were showing static scores (55/75) - now uses dynamic compatibility algorithm based on user profile skills, experience level, and location preferences.
- **Enhanced Navigation**: Implemented comprehensive job browsing with search, filters, save functionality, and seamless job detail navigation with proper pagination controls.
- **Question Bank Enhancement**: Successfully populated database with 15 premium difficulty questions covering general aptitude, verbal reasoning, technical coding, case studies, behavioral scenarios, and domain-specific content.
- **Test Template System**: Fixed initialization issues and enabled "Initialize Platform Templates" functionality for recruiters.
- **Authentication System**: Resolved session management and crypto/ETag generation errors affecting mock interviews.
- **Database Optimization**: Questions now properly categorized with difficulty levels (hard/extreme) and comprehensive metadata including tags, keywords, and detailed explanations.
- **Messaging System Overhaul**: Fixed all critical messaging bugs including notification bell showing real unread counts, proper message read status tracking, and added chat navigation for both user types.
- **Landing Page Enhancement**: Created professional landing page and /for-recruiters page with compelling CTAs, generated professional logo and hero assets, implemented LinkedIn-style design with pricing sections, testimonials, and conversion optimization features.

### Technical Implementation
- **Backend**: Express.js with TypeScript, session-based authentication using Passport.js, AI integration via Groq SDK, payment processing with Stripe and PayPal, email services with Resend and Nodemailer. Enhanced with LRU caching system using dependency tracking for reduced compute usage and improved performance.
- **Frontend**: React with TypeScript, Wouter for routing, Tailwind CSS and shadcn/ui for styling, React Query for state management, Vite as the build tool. Pipeline management includes resume viewing functionality with small icon buttons.
- **Chrome Extension**: Comprehensive extension with manifest.json, popup interface, content scripts, and background service worker. Supports auto-fill for 500+ job board platforms (LinkedIn, Indeed, Workday, Greenhouse, Lever, AshbyHQ, etc.), real-time job compatibility scoring, application tracking, and AI cover letter generation. Features a simplified circular floating button for access and advanced form detection.
- **UI/UX Decisions**: "BEST OF BEST" modern and beautiful UI/UX, premium professional visual design, simplified floating button interface, multiple view modes (Cards, Table, Kanban) for applications, enhanced statistics dashboard, and comprehensive empty state management. Features engaging elements like streaks, achievements, and progress tracking.
- **Performance Optimizations**: Comprehensive compute optimization strategy implemented including enhanced caching service with optimized LRU implementation, frequency-based eviction, automatic cleanup, real hit-rate tracking, file compression for resume storage, dependency-based cache invalidation, smart conditional requests with ETags, optimized messaging with WebSocket connections, reduced polling frequencies, database query optimization with proper indexing, frontend query batching, smart invalidation patterns, user session caching to reduce database calls, and performance monitoring to minimize system resource usage for 1M+ user scalability.

### Feature Specifications
- Resume upload and AI-powered ATS scoring with compression for storage optimization.
- Job posting and application management for recruiters with enhanced caching system.
- Real-time messaging between recruiters and candidates.
- Payment processing for premium features and services (e.g., test retakes, job promotion).
- Virtual AI interviews and coding tests with AI detection.
- Comprehensive application tracking and analytics for job seekers.
- Role-based access and consistent user type management (job seeker, recruiter).
- Advanced API key rotation system for Groq and Resend.
- Resume viewing functionality with new tab opening for recruiters.
- LRU-based caching system with dependency tracking for improved performance.

## External Dependencies
- **Database**: Neon PostgreSQL
- **AI/NLP**: Groq SDK (for resume analysis, job matching, cover letter generation)
- **Payment Gateways**: Stripe, PayPal
- **Email Services**: Resend, Nodemailer (with Postal SMTP fallback)
- **Authentication**: Passport.js
- **Cloud Hosting**: Replit