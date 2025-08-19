# AutoJobR - AI-Powered Job Application Platform

## Overview
AutoJobR is a comprehensive full-stack JavaScript application designed to streamline job applications using AI technology. Its main purpose is to assist both job seekers and recruiters with automated job matching, AI-powered interviews, resume analysis, and premium subscription services. The project aims to become a leading platform for AI-driven career management, offering significant market potential by automating and optimizing the job search and recruitment processes.

## User Preferences
*To be updated based on user interactions and preferences*

## System Architecture
The application is built on a full-stack JavaScript architecture.

**Technology Stack:**
- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS, Radix UI components
- **Backend**: Express.js with TypeScript, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with Google OAuth and local strategies
- **File Storage**: Local file system with multer

**Key Features & Technical Implementations:**
- **Job Discovery & Matching**: AI-powered job recommendations and resume analysis are core to the platform, involving automated parsing and optimization.
- **Virtual Interviews**: AI-conducted interview sessions provide an automated and consistent experience.
- **Chat System**: Real-time messaging is implemented using WebSockets.
- **Premium Features**: Subscription-based advanced functionality is supported through payment integrations.
- **Chrome Extension**: Browser integration allows for automated job applications and resume field detection using the DataTransfer API, along with task management and reminder notifications.
- **Recruiter Dashboard**: Tools for managing candidates and job postings are provided, with robust authentication ensuring proper access based on user roles (job_seeker, recruiter, admin) using email patterns for automatic assignment.
- **UI/UX Decisions**: The design emphasizes a clean, essential feature-focused interface, particularly for the premium page. Interactive components and animations (e.g., framer-motion) are used for enhanced user experience, especially in resume analysis.
- **Security Features**: Includes CORS configuration, secure session handling, Zod schema-based input validation, file upload restrictions, and API rate limiting.
- **System Design Choices**: The project maintains a secure client/server separation. Database schema uses Drizzle ORM with automatic type generation. The application is designed to work with multiple AI providers and allows for graceful fallbacks.

## External Dependencies
- **Payment Processing**: Stripe and PayPal integration for subscriptions and one-time payments.
- **AI Services**: Groq, OpenAI, and custom NLP services are integrated for AI functionalities.
- **Authentication**: Google OAuth is used for user authentication.