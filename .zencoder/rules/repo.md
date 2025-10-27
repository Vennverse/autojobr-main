---
description: Repository Information Overview
alwaysApply: true
---

# AutoJobr Information

## Summary
AutoJobr is a comprehensive job application automation platform with a web application and Chrome extension. It helps job seekers automate their job search process with AI-powered tools for resume optimization, application tracking, and interview preparation. The platform also serves recruiters with candidate management features.

## Structure
- **client/**: React frontend application with TypeScript
- **server/**: Express.js backend API with TypeScript
- **extension/**: Chrome extension for job application automation
- **shared/**: Shared code and database schema
- **migrations/**: Database migration files
- **uploads/**: User-uploaded files (resumes, profile images)
- **nginx/**: Nginx configuration for production deployment

## Language & Runtime
**Language**: TypeScript/JavaScript
**Version**: Node.js 20.x
**Build System**: npm scripts with esbuild and Vite
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- **Frontend**: React 18, TanStack Query, Wouter, Radix UI components
- **Backend**: Express 4, PostgreSQL (via Drizzle ORM), Redis
- **AI**: Groq SDK, Anthropic SDK, OpenAI SDK
- **Authentication**: Passport, JWT, Express-session
- **Payment**: Stripe, PayPal, Razorpay
- **Database**: PostgreSQL 15 with Drizzle ORM
- **Caching**: Redis 7

**Development Dependencies**:
- TypeScript 5.9
- Vite 7.1
- Tailwind CSS 3.4
- Drizzle Kit (for migrations)
- ESBuild

## Build & Installation
```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Docker
**Dockerfile**: Dockerfile (multi-stage build)
**Compose**: docker-compose.yml
**Configuration**: 
- Node.js application container
- PostgreSQL 15 database
- Redis 7 for caching
- Nginx for reverse proxy
- Optional Prometheus/Grafana for monitoring

## Main Components

### Web Application
**Entry Point**: server/index.ts
**Frontend Entry**: client/src/main.tsx
**Key Features**:
- Job application tracking
- Resume management and optimization
- AI-powered interview preparation (virtual, mock, and chat interviews)
- Subscription management
- Recruiter dashboard

### Interview System
**Types**: 
- Chat interviews (conversational AI interviews)
- Virtual interviews (structured AI interviews)
- Mock interviews (coding/technical assessments)
- Video interviews (recorded responses)

**Chat Interview Components**:
- Frontend: client/src/pages/ChatInterview.tsx
- Backend: server/chatInterviewRoutes.ts, server/chatInterviewService.ts
- Database: virtualInterviews and virtualInterviewMessages tables
- API Endpoints: /api/chat-interview/* routes

### Chrome Extension
**Entry Point**: extension/background.js
**Key Features**:
- Auto-fill job applications
- Job analysis with match scoring
- Resume upload automation
- AI cover letter generation
- Application tracking

### Database
**Schema**: shared/schema.ts
**ORM**: Drizzle ORM
**Key Tables**:
- users: User accounts and authentication
- userProfiles: Detailed user information
- jobApplications: Job application tracking
- resumes: Resume storage and analysis
- workExperience: User work history
- education: User education history

## Testing
**Framework**: No formal testing framework identified
**Test Files**: Various test scripts in root directory
**Run Command**:
```bash
# Video interview testing
npm run test:video-interview

# API verification
npm run verify:video-apis
```

## Deployment
**Production**: Docker-based deployment with Nginx
**Environment**: NODE_ENV=production
**Configuration**: Environment variables via .env file
**Scaling**: PM2 process manager (ecosystem.config.js)
```