# AutoJobr - Job Application Automation Platform

## Overview
AutoJobr is a full-stack web application designed to automate and streamline the job application process. Its primary purpose is to help users efficiently apply to a large volume of jobs by providing features such as ATS resume optimization, AI-powered cover letter generation, interview preparation, and a Chrome extension for one-click applications. The platform aims to simplify job searching, enhance application quality, and provide tools for career advancement, positioning itself as a comprehensive solution for job seekers.

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
-   **UI/UX Decisions**: Employs a modern design approach using Tailwind CSS and shadcn/ui components for a consistent and responsive user interface, including an auto-rotating hero slider for key features. SEO optimization is integrated across landing pages.
-   **Feature Specifications**:
    -   Job Search & Auto-Apply with automated submission.
    -   ATS Resume Optimization for AI-powered analysis.
    -   Personalized Cover Letter Generation.
    -   AI-powered Interview Preparation with feedback.
    -   Chrome Extension for one-click applications with BYOK (Bring Your Own Key) support.
    -   Dashboard for Job Tracking.
    -   Subscription Management.
    -   WebSocket-based Real-time Chat.
    -   Employee Referral Marketplace with dual-party confirmation and escrow protection.
    -   Unified ATS Platform for recruiters with candidate management, filtering, bulk emailing, and interview scheduling.
    -   LinkedIn Profile Optimizer.
    -   LinkedIn Connection Note Generator with AI (web app: 5 free/month, unlimited premium; extension: BYOK supported).
    -   Networking Events platform with CRUD operations and registration system.
    -   Test retake system with LinkedIn share or payment options.
-   **System Design Choices**:
    -   Vite dev server operates in middleware mode during development.
    -   Production builds output to a `dist/` directory.
    -   Session storage is handled via PostgreSQL.
    -   The WebSocket server runs on the same port as the HTTP server.
    -   Replit-specific configurations include running `npm run dev` on port 5000, utilizing Replit PostgreSQL, and configured for Replit Autoscale deployment.
    -   Performance enhancements include database indexing and caching for frequently accessed endpoints.

## AI Usage Quotas & BYOK Implementation

### Web App AI Quotas
- **Connection Note Generator**: 5 free generations per month, unlimited for premium users
- **Resume Optimization**: 3 free per month, unlimited for premium
- **Cover Letter Generation**: 3 free per month, unlimited for premium  
- **Interview Practice**: 2 free per month, unlimited for premium
- Quota tracking uses existing `aiUsageTracking` table with monthly reset (YYYY-MM format)
- Service layer: `server/aiUsageService.ts` handles quota checks and enforcement

### Chrome Extension BYOK (Bring Your Own Key)
- **CRITICAL**: When users add their own Groq API key in the Chrome Extension, the extension MUST use the user's key for ALL AI service calls
- BYOK is EXTENSION-ONLY feature (not available in web app)
- Extension should call Groq API directly with user-provided key or pass key to backend
- Users with BYOK bypass all quota limits (unlimited usage with their own key)
- Stored securely in extension's local storage, encrypted

## External Dependencies
-   **Databases**: PostgreSQL (via Neon/Replit Database)
-   **ORM**: Drizzle ORM
-   **Authentication Providers**: Google OAuth, LinkedIn OAuth
-   **AI Services**: Groq, OpenRouter, OpenAI, Anthropic
-   **Payment Gateways**: Stripe, PayPal, Razorpay
-   **Email Services**: Resend, SendGrid, Nodemailer
-   **Real-time Communication Libraries**: `ws` (WebSocket)
-   **Scheduling**: Calendly/Cal.com