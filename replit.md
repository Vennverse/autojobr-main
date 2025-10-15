# AutoJobr - Job Application Automation Platform

## Overview
AutoJobr is a full-stack web application designed to automate and streamline the job application process. Its primary purpose is to help users efficiently apply to a large volume of jobs by providing features such as ATS resume optimization, AI-powered cover letter generation, interview preparation, and a Chrome extension for one-click applications. The platform aims to simplify job searching, enhance application quality, and provide tools for career advancement, positioning itself as a comprehensive solution for job seekers.

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

## External Dependencies
-   **Databases**: PostgreSQL (via Neon/Replit Database)
-   **ORM**: Drizzle ORM
-   **Authentication Providers**: Google OAuth
-   **AI Services**: Groq, OpenRouter, OpenAI, Anthropic
-   **Payment Gateways**: Stripe, PayPal, Razorpay
-   **Email Services**: Resend, SendGrid, Nodemailer
-   **Real-time Communication Libraries**: `ws` (WebSocket)