# AutoJobr - Job Application Platform

## Overview
AutoJobr is a comprehensive job application platform designed to connect job seekers with recruiters. It provides AI-powered resume analysis, intelligent job matching, and a robust recruitment management system. The platform aims to streamline the job application process for candidates and offer efficient hiring tools for recruiters, fostering a seamless talent acquisition ecosystem with high market potential.

## User Preferences
- **UI/UX Focus**: User prefers "BEST OF BEST" modern, beautiful UI/UX implementations
- **Feature Simplification**: Requested removal of AI recommendations tab for cleaner job browsing experience
- **Visual Quality**: Emphasis on premium, professional visual design and user experience
- **User Profile**: Main test user is Shubham Dubey (shubhamdubexskd2001@gmail.com) - Senior Technical Recruiter at TechCorp Solutions

## System Architecture

### Core Design Principles
- **AI-Powered Matching**: Utilizes AI for resume analysis, ATS scoring, and job matching.
- **Scalable Backend**: Built with Express.js and TypeScript, designed for high performance.
- **Modern Frontend**: React-based UI with strong emphasis on responsive design and user experience.
- **Robust Data Management**: Employs PostgreSQL for reliable data storage.
- **Security First**: Implements session-based authentication and secure API practices.

### Technical Implementation
- **Backend**: Express.js with TypeScript, session-based authentication using Passport.js, AI integration via Groq SDK, payment processing with Stripe and PayPal, email services with Resend and Nodemailer. Enhanced with LRU caching system using dependency tracking for reduced compute usage and improved performance.
- **Frontend**: React with TypeScript, Wouter for routing, Tailwind CSS and shadcn/ui for styling, React Query for state management, Vite as the build tool. Pipeline management includes resume viewing functionality with small icon buttons.
- **Chrome Extension**: Comprehensive extension with manifest.json, popup interface, content scripts, and background service worker. Supports auto-fill for 500+ job board platforms (LinkedIn, Indeed, Workday, Greenhouse, Lever, AshbyHQ, etc.), real-time job compatibility scoring, application tracking, and AI cover letter generation. Features a simplified circular floating button for access and advanced form detection.
- **UI/UX Decisions**: "BEST OF BEST" modern and beautiful UI/UX, premium professional visual design, simplified floating button interface, multiple view modes (Cards, Table, Kanban) for applications, enhanced statistics dashboard, and comprehensive empty state management. Features engaging elements like streaks, achievements, and progress tracking.
- **Performance Optimizations**: Enhanced caching service with LRU cache, file compression for resume storage, dependency-based cache invalidation, and smart conditional requests with ETags.

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