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

## Recent Changes (Oct 01, 2025)
- ✅ GitHub import successfully configured for Replit environment
- ✅ Workflow configured: "Start application" runs `npm run dev` on port 5000 with webview output type
- ✅ Vite server already configured with `host: 0.0.0.0` and `allowedHosts: true` for Replit proxy compatibility
- ✅ PostgreSQL database connected and verified (using DATABASE_URL environment variable)
- ✅ All backend services initialized successfully (AI, WebSocket, file storage, payment integrations)
- ✅ Frontend loading correctly with React + Vite HMR working
- ✅ Deployment configured for Replit Autoscale with build and start commands in .replit file
- ✅ No LSP errors or TypeScript issues detected
- ✅ Application fully functional and running on port 5000

## Architecture Notes
- The app uses a monolithic architecture with frontend and backend in one repo
- Vite dev server runs in middleware mode during development
- Production build outputs to `dist/` directory
- Session storage uses PostgreSQL for multi-instance support
- WebSocket server runs on same port as HTTP server
