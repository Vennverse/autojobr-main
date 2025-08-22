# AutoJobr - AI-Powered Job Application Platform

## Overview

AutoJobr is a comprehensive job application automation platform that combines AI-powered resume analysis, intelligent form filling, and professional networking features. The platform serves both job seekers and recruiters, offering tools for job matching, application tracking, interview preparation, and talent acquisition. Built as a full-stack application with a Chrome extension for automated job applications, AutoJobr streamlines the entire job search and hiring process.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Build System**: Vite for fast development and optimized production builds
- **UI Library**: Radix UI components with Tailwind CSS for professional styling
- **State Management**: React Query (TanStack Query) for server state management and caching
- **Real-time Communication**: WebSocket integration with custom hooks for chat and notifications
- **Routing**: React Router for single-page application navigation
- **Form Handling**: React Hook Form with Zod validation for robust form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework using ES modules
- **Language**: TypeScript for type safety across the entire stack
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Custom session-based authentication with multiple OAuth providers (Google, GitHub, LinkedIn)
- **Real-time Features**: WebSocket server for live chat, notifications, and collaborative features
- **File Handling**: Custom file storage service with compression for resume and document management
- **Process Management**: PM2 for production deployment with clustering and automatic restarts

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM for structured data
- **Schema Design**: Comprehensive schema supporting users, jobs, applications, resumes, skills, work experience, education, and subscription management
- **File Storage**: Local file system with gzip compression for resume and document storage
- **Session Storage**: In-memory sessions with Redis-compatible structure
- **Caching**: LRU cache implementation for frequently accessed data and API responses

### Authentication and Authorization
- **Multi-Provider Auth**: Support for email/password, Google OAuth, GitHub OAuth, and LinkedIn OAuth
- **Session Management**: Express sessions with secure HTTP-only cookies
- **Role-Based Access**: Separate user types (job_seeker, recruiter) with role-specific features
- **Security**: CORS configuration, security headers, and input validation
- **Demo Mode**: Instant demo access for testing and onboarding

### AI and External Integrations
- **AI Models**: Groq AI integration using llama-3.3-70b-versatile for resume analysis, job matching, and cover letter generation
- **Email Services**: Dual email provider support (Resend API and Nodemailer with SMTP)
- **Payment Processing**: PayPal SDK integration for subscription management
- **Resume Parsing**: Custom NLP-based resume parsing with AI fallback for structured data extraction

### Chrome Extension Architecture
- **Manifest V3**: Modern Chrome extension using service workers
- **Content Scripts**: Universal content script for form detection and auto-filling across job sites
- **Background Service**: API communication and data synchronization with backend
- **Popup Interface**: React-based popup for job analysis, application tracking, and quick actions
- **Form Compatibility**: Multi-platform support for Workday, LinkedIn, Greenhouse, Lever, and other ATS systems

### Deployment and Infrastructure
- **Production Deployment**: Docker containerization with PM2 process management
- **Reverse Proxy**: Nginx configuration for SSL termination and static asset serving
- **Database**: External PostgreSQL providers (Neon, Supabase, PlanetScale) support
- **Environment Management**: Comprehensive environment variable configuration for different deployment scenarios
- **Monitoring**: Application health checks and performance monitoring

## External Dependencies

### Core Infrastructure
- **Database**: PostgreSQL (via Neon, Supabase, or PlanetScale)
- **File Storage**: Local filesystem with plans for cloud storage integration
- **Process Management**: PM2 for production deployment and clustering

### AI and Machine Learning
- **Groq API**: Primary AI provider for resume analysis, job matching, and content generation using llama-3.3-70b-versatile model
- **Fallback AI**: Support for multiple AI providers with automatic failover

### Authentication Providers
- **Google OAuth**: Google Identity Platform for social login
- **GitHub OAuth**: GitHub Apps for developer-focused authentication
- **LinkedIn OAuth**: LinkedIn API for professional network integration

### Communication Services
- **Resend API**: Modern transactional email service for notifications and marketing
- **Nodemailer**: SMTP email sending with custom SMTP server support
- **WebSocket**: Real-time communication for chat and live updates

### Payment and Subscription
- **PayPal SDK**: Payment processing and subscription management
- **Stripe Integration**: Alternative payment processor (configured but not primary)

### Development and Monitoring
- **TypeScript**: Type safety across frontend and backend
- **ESLint/Prettier**: Code quality and formatting
- **Vite**: Build system and development server
- **Docker**: Containerization for consistent deployments

### Browser Extension APIs
- **Chrome Extension APIs**: Storage, tabs, notifications, and content script APIs
- **WebRTC**: Potential future integration for video interviews

### Third-Party Libraries
- **Frontend**: React Query, Framer Motion, React Hook Form, Zod validation
- **Backend**: Express.js, Drizzle ORM, Winston logging, Passport.js
- **Utilities**: Date-fns, Lodash, UUID generation, PDF parsing libraries