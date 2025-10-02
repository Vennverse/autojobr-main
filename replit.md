# AutoJobr - Job Application Automation Platform

## Overview
AutoJobr is a full-stack web application that automates job applications, helping users apply to thousands of jobs efficiently. The platform includes ATS (Applicant Tracking System) resume optimization, AI-powered cover letter generation, interview preparation, and a Chrome extension for one-click job applications.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui components, Wouter (routing)
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Neon/Replit Database)
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js (Google OAuth, Local)
- **AI Integration**: Groq, OpenRouter, OpenAI, Anthropic
- **Payments**: Stripe, PayPal, Razorpay
- **Email**: Resend, SendGrid, Nodemailer
- **Real-time**: WebSocket (ws)

## Project Structure
```
├── client/                # Frontend React application
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable UI components
│   │   └── lib/          # Client utilities
│   └── index.html
├── server/               # Backend Express server
│   ├── index.ts         # Main server entry point
│   ├── routes.ts        # API route handlers
│   ├── storage.ts       # Database interface
│   ├── vite.ts          # Vite dev server setup
│   └── [services]/      # Business logic services
├── shared/              # Shared code between frontend/backend
│   └── schema.ts        # Database schema (Drizzle)
├── migrations/          # Database migration files
└── attached_assets/     # Static assets

```

## Environment Setup

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-provided by Replit)
- `NODE_ENV`: Set to "development" for dev mode, "production" for prod
- `PORT`: Server port (always 5000 in Replit)
- `SESSION_SECRET`: Random secret for session encryption

### Optional API Keys
- `GROQ_API_KEY`: For AI-powered features
- `STRIPE_SECRET_KEY`: For payment processing
- `PAYPAL_CLIENT_ID` & `PAYPAL_CLIENT_SECRET`: PayPal integration
- `RESEND_API_KEY`: For email notifications
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth

## Development

### Running Locally
```bash
npm run dev
```
This starts:
- Express server on port 5000
- Vite dev server with HMR
- Frontend served at http://localhost:5000

### Database Operations
```bash
# Push schema changes to database
npm run db:push

# Force push (if warnings appear)
npm run db:push -- --force
```

### Building for Production
```bash
npm run build  # Builds both frontend and backend
npm run start  # Runs production server
```

## Key Features
1. **Job Search & Auto-Apply**: Automated job application submission
2. **ATS Resume Optimization**: AI-powered resume analysis and optimization
3. **Cover Letter Generation**: Personalized cover letters using AI
4. **Interview Preparation**: Mock interviews with AI feedback
5. **Chrome Extension**: One-click job applications
6. **Job Tracking**: Dashboard to manage applications
7. **Subscription Management**: Stripe/PayPal integration
8. **Real-time Chat**: WebSocket-based communication

## Database Schema
The application uses a comprehensive PostgreSQL schema with tables for:
- Users & authentication
- Job postings & applications
- Resumes & cover letters
- Interview data & feedback
- Subscription & payment info
- Test assignments & rankings

See `shared/schema.ts` for the complete schema definition.

## Replit Configuration
- **Workflow**: "Start application" runs `npm run dev` on port 5000
- **Database**: Uses Replit PostgreSQL (Neon-backed)
- **Deployment**: Configured for Replit Autoscale deployment
- **Host**: Frontend binds to 0.0.0.0:5000 for proper proxy handling

## Recent Changes

### Oct 02, 2025 - Chrome Extension CORS & Button Fixes
- ✅ **Fixed CORS configuration** in `server/index.ts` to allow Chrome extension requests
  - Extension can now make API calls from job sites (LinkedIn, Indeed, etc.)
  - Added support for `chrome-extension://` and `moz-extension://` protocols
  - Allows requests from 20+ job board domains where extension runs
- ✅ **Updated extension API URL handling** in `extension/popup.js`
  - Now uses `chrome.storage` for flexible API URL configuration
  - Background script auto-detects correct API URL (localhost → Replit → Production)
- ✅ **Verified all button handlers** are properly implemented:
  - Interview Prep, Salary Intel, Find Referrals, Profile, Resume, History, Dashboard
  - All features properly integrated with background script message handlers
- ✅ **Created comprehensive setup guide** at `extension/DEVELOPMENT_SETUP.md`
  - Installation instructions for developers
  - Troubleshooting guide for common issues
  - API endpoint documentation

### Oct 02, 2025 - GitHub Import Setup Complete
- ✅ GitHub repository successfully imported and verified in Replit environment
- ✅ All dependencies installed and working (nodejs-20 module)
- ✅ Workflow "Start application" confirmed running with webview output type on port 5000
- ✅ Vite dev server properly configured with `host: 0.0.0.0` and `allowedHosts: true`
- ✅ PostgreSQL database connected and operational (using Replit DATABASE_URL)
- ✅ All backend services initialized: AI service, WebSocket, file storage, session management
- ✅ Frontend verified loading correctly - homepage displays "Land Your Dream Job" banner
- ✅ Deployment configuration verified in .replit file (autoscale target with build/run commands)
- ✅ Application fully functional and accessible

### Oct 01, 2025 - Platform Jobs Endpoint Fixed
- ✅ Moved `/api/jobs/postings` route to early registration to prevent shadowing
- ✅ 122 platform jobs accessible via API for all users
- ✅ Frontend displaying 147 total jobs (122 platform + ~25 scraped)

## Architecture Notes
- The app uses a monolithic architecture with frontend and backend in one repo
- Vite dev server runs in middleware mode during development
- Production build outputs to `dist/` directory
- Session storage uses PostgreSQL for multi-instance support
- WebSocket server runs on same port as HTTP server
