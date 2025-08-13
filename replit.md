# AutoJobR - AI-Powered Job Application Platform

## Project Overview
AutoJobR is a comprehensive full-stack JavaScript application designed to streamline job applications using AI technology. The platform supports both job seekers and recruiters with features including automated job matching, AI-powered interviews, resume analysis, and premium subscription services.

## Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS, Radix UI components
- **Backend**: Express.js with TypeScript, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with Google OAuth and local strategies
- **Payment Processing**: Stripe and PayPal integration
- **AI Services**: Groq, OpenAI, and custom NLP services
- **Real-time Communication**: WebSocket for chat features
- **File Storage**: Local file system with multer

### Project Structure
```
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route-specific pages
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions and configurations
├── server/              # Express backend API
│   ├── routes/          # API route handlers
│   ├── middleware/      # Custom middleware functions
│   └── services/        # Business logic services
├── shared/              # Shared TypeScript schemas and types
└── migrations/          # Database migration files
```

### Key Features
1. **Job Discovery & Matching**: AI-powered job recommendations
2. **Resume Analysis**: Automated resume parsing and optimization
3. **Virtual Interviews**: AI-conducted interview sessions
4. **Chat System**: Real-time messaging between users
5. **Premium Features**: Subscription-based advanced functionality
6. **Chrome Extension**: Browser integration for job applications
7. **Recruiter Dashboard**: Tools for managing candidates and job postings
8. **Payment Integration**: Stripe and PayPal for subscriptions and one-time payments

## Development Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (automatically configured by Replit)
- `STRIPE_SECRET_KEY`: Stripe payment processing (optional)
- `GROQ_API_KEY`: AI service integration (optional)
- `PAYPAL_CLIENT_ID` & `PAYPAL_CLIENT_SECRET`: PayPal integration (optional)

### Running the Application
The project uses a single command to start both frontend and backend:
```bash
npm run dev
```
This serves the application on port 5000 with both API and client routes.

## Database Schema
The application uses Drizzle ORM with PostgreSQL. Schema is defined in `shared/schema.ts` with automatic type generation for both insert and select operations.

## Recent Changes

### Google OAuth Authentication Fix (August 12, 2025)
- ✅ Fixed Google OAuth redirect URI issues by using autojobr.com domain
- ✅ Configured GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables
- ✅ Added support for both .repl.co and .replit.dev domain detection
- ✅ Resolved 404 errors during OAuth callback process
- ✅ Authentication system now supports both email/password and Google OAuth

### Migration from Replit Agent (January 12, 2025)
- ✅ Migrated project from Replit Agent to standard Replit environment
- ✅ Configured PostgreSQL database with proper connection handling
- ✅ Verified all dependencies are properly installed
- ✅ Ensured secure client/server separation
- ✅ Application successfully running on port 5000

### Replit Migration Completion (August 13, 2025)
- ✅ Successfully migrated AutoJobR from Replit Agent to standard Replit environment
- ✅ PostgreSQL database provisioned and connected successfully
- ✅ All dependencies installed and verified working
- ✅ Server running on port 5000 with all services initialized
- ✅ Authentication system properly configured (Google OAuth requires credentials)
- ✅ Client/server separation maintained with security best practices
- ✅ Google OAuth functionality configured with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- ✅ Google OAuth callback route `/api/auth/google/callback` working properly

### Google Indexing Issues Fixed (August 13, 2025)
- ✅ Fixed robots.txt blocking important pages - now allows about, contact, blog, chrome-extension, ats-optimizer
- ✅ Updated sitemap.xml with current dates (2025-08-13) and all important pages
- ✅ Created RSS feed (feed.xml) for better content discovery
- ✅ Implemented SEO meta tags component with proper Open Graph and Twitter cards
- ✅ Created missing pages that were causing "currently not indexed" errors:
  - /about - Company information and mission
  - /contact - Contact form and support information  
  - /blog - Career automation tips and insights
  - /chrome-extension - Browser extension download page
  - /ats-optimizer - Resume optimization tool
- ✅ Updated routing to make all SEO pages accessible to search engines
- ✅ All pages now have proper meta descriptions, keywords, and structured data

## Security Features
- CORS configuration for multiple domains including job sites
- Session management with secure cookie handling
- Input validation using Zod schemas
- File upload restrictions and security
- API rate limiting and performance monitoring

## User Preferences
*To be updated based on user interactions and preferences*

## Notes
- The application is designed to work with multiple AI providers with graceful fallbacks
- Payment features are optional and can be enabled with proper API keys
- Chrome extension integration allows seamless job application automation
- Real-time features use WebSocket connections for optimal performance