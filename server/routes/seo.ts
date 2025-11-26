import { Router } from "express";
import { db } from "../db.js";
import { jobPostings, scrapedJobs } from "../../shared/schema.js";
import { eq, desc, and, isNotNull, sql } from "drizzle-orm";

const router = Router();

// Job categories for clean URLs
const JOB_CATEGORIES = [
  'technology', 'engineering', 'marketing', 'sales', 'design', 
  'data-science', 'product-management', 'finance', 'operations', 
  'human-resources', 'customer-success', 'remote'
];

// Job locations for clean URLs
const JOB_LOCATIONS = [
  'san-francisco', 'new-york', 'austin', 'seattle', 'los-angeles', 
  'chicago', 'atlanta', 'boston', 'denver', 'dallas', 'london', 
  'toronto', 'sydney', 'berlin', 'amsterdam', 'singapore', 'mumbai', 
  'bangalore', 'dublin', 'stockholm'
];

// Country-level job pages
const JOB_COUNTRIES = [
  'usa', 'canada', 'uk', 'germany', 'australia', 'india', 
  'singapore-country', 'netherlands', 'sweden'
];

// Dynamic SEO sitemap generation with enhanced structure
router.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://autojobr.com' 
      : `http://localhost:${process.env.PORT || 5000}`;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Get active job postings for individual job pages
    const activeJobs = await db
      .select({ 
        id: jobPostings.id, 
        createdAt: jobPostings.createdAt,
        updatedAt: jobPostings.updatedAt 
      })
      .from(jobPostings)
      .where(eq(jobPostings.isActive, true))
      .orderBy(desc(jobPostings.createdAt))
      .limit(2000); // Increased limit for better coverage

    // Also get scraped jobs
    const scrapedJobsData = await db
      .select({ 
        id: scrapedJobs.id, 
        createdAt: scrapedJobs.createdAt 
      })
      .from(scrapedJobs)
      .orderBy(desc(scrapedJobs.createdAt))
      .limit(1000); // Increased limit

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
    
    <!-- TIER 1: Core Landing Pages (Priority 1.0) -->
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
        <image:image>
            <image:loc>${baseUrl}/og-image.png</image:loc>
            <image:title>AutoJobR - AI Job Application Automation</image:title>
        </image:image>
    </url>
    
    <!-- TIER 2: High-Value Service Pages (Priority 0.95) -->
    <url>
        <loc>${baseUrl}/free-job-application-automation</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.95</priority>
    </url>
    <url>
        <loc>${baseUrl}/beat-ats-systems-free</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.95</priority>
    </url>
    <url>
        <loc>${baseUrl}/auto-apply-1000-jobs-daily</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.95</priority>
    </url>
    
    <!-- TIER 3: Primary Job Search Pages (Priority 0.9) -->
    <url>
        <loc>${baseUrl}/jobs</loc>
        <lastmod>${today}</lastmod>
        <changefreq>hourly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${baseUrl}/linkedin-auto-apply-bot</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${baseUrl}/indeed-auto-apply-tool</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${baseUrl}/chrome-extension</loc>
        <lastmod>${today}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>`;

    // Add job category pages
    JOB_CATEGORIES.forEach(category => {
      sitemap += `
    <url>
        <loc>${baseUrl}/jobs/${category}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>`;
    });

    // Add job location pages
    JOB_LOCATIONS.forEach(location => {
      sitemap += `
    <url>
        <loc>${baseUrl}/jobs/${location}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>`;
    });

    // Add country-level job pages
    JOB_COUNTRIES.forEach(country => {
      sitemap += `
    <url>
        <loc>${baseUrl}/jobs/${country}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>`;
    });

    // Add individual job posting pages with proper structure
    activeJobs.forEach(job => {
      const lastmod = job.updatedAt ? 
        new Date(job.updatedAt).toISOString().split('T')[0] : 
        (job.createdAt ? new Date(job.createdAt).toISOString().split('T')[0] : today);
      
      sitemap += `
    <url>
        <loc>${baseUrl}/jobs/${job.id}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
        <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/jobs/${job.id}"/>
    </url>`;
    });

    // Add scraped job pages with canonical reference
    scrapedJobsData.forEach(job => {
      const lastmod = job.createdAt ? 
        new Date(job.createdAt).toISOString().split('T')[0] : today;
      
      sitemap += `
    <url>
        <loc>${baseUrl}/jobs/scraped/${job.id}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
        <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/jobs/scraped/${job.id}"/>
    </url>`;
    });

    // Add static high-value SEO pages
    const staticPages = [
      { path: '/interview-prep-tools', priority: '0.95', changefreq: 'daily' },
      { path: '/about', priority: '0.8', changefreq: 'monthly' },
      { path: '/contact', priority: '0.8', changefreq: 'monthly' },
      { path: '/blog', priority: '0.8', changefreq: 'weekly' },
      { path: '/chrome-extension', priority: '0.9', changefreq: 'weekly' },
      { path: '/ats-optimizer', priority: '0.9', changefreq: 'weekly' },
      { path: '/salary-calculator', priority: '0.9', changefreq: 'weekly' },
      { path: '/free-job-application-automation', priority: '0.95', changefreq: 'daily' },
      { path: '/beat-ats-systems-free', priority: '0.95', changefreq: 'daily' },
      { path: '/auto-apply-1000-jobs-daily', priority: '0.95', changefreq: 'daily' },
      { path: '/linkedin-auto-apply-bot', priority: '0.9', changefreq: 'daily' },
      { path: '/indeed-auto-apply-tool', priority: '0.9', changefreq: 'daily' },
      { path: '/best-job-application-tools-2025', priority: '0.9', changefreq: 'weekly' },
      { path: '/remote-jobs-students-2025', priority: '0.9', changefreq: 'daily' },
      { path: '/1-click-apply-jobs', priority: '0.9', changefreq: 'daily' },
      { path: '/job-application-autofill-extension', priority: '0.85', changefreq: 'weekly' },
      { path: '/privacy-policy', priority: '0.5', changefreq: 'monthly' },
      // Company Hiring Guides
      { path: '/blog/how-to-get-hired-at-google', priority: '0.9', changefreq: 'weekly' },
      { path: '/blog/how-to-get-hired-at-amazon', priority: '0.9', changefreq: 'weekly' },
      { path: '/blog/how-to-get-hired-at-meta', priority: '0.9', changefreq: 'weekly' },
      { path: '/blog/how-to-get-hired-at-microsoft', priority: '0.9', changefreq: 'weekly' },
      { path: '/blog/how-to-get-hired-at-apple', priority: '0.9', changefreq: 'weekly' },
      { path: '/blog/how-to-get-hired-at-netflix', priority: '0.9', changefreq: 'weekly' },
      // Blog Articles
      { path: '/blog/beat-ats-systems-2025-guide', priority: '0.85', changefreq: 'weekly' },
      { path: '/blog/linkedin-automation-guide', priority: '0.85', changefreq: 'weekly' },
      { path: '/blog/ai-cover-letters-guide', priority: '0.85', changefreq: 'weekly' },
      { path: '/blog/remote-job-search-2025', priority: '0.85', changefreq: 'weekly' }
    ];

    staticPages.forEach(page => {
      sitemap += `
    <url>
        <loc>${baseUrl}${page.path}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`;
    });

    sitemap += `
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// RSS Feed
router.get("/feed.xml", (req, res) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://autojobr.com' 
    : `http://localhost:${process.env.PORT || 5000}`;
    
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
    <channel>
        <title>AutoJobR - AI-Powered Job Application Automation</title>
        <description>The ultimate AI-powered platform for automating job applications, beating ATS systems, and landing your dream job faster.</description>
        <link>${baseUrl}</link>
        <language>en-us</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <item>
            <title>AutoJobR Platform Updated - Enhanced AI Job Matching</title>
            <description>We've enhanced our AI job matching algorithm to provide even better job recommendations and automated application features.</description>
            <link>${baseUrl}/blog/enhanced-ai-job-matching</link>
            <guid>${baseUrl}/blog/enhanced-ai-job-matching</guid>
            <pubDate>${new Date().toUTCString()}</pubDate>
        </item>
    </channel>
</rss>`;

  res.set('Content-Type', 'application/xml');
  res.send(feed);
});

// AI Engine Discovery Endpoints
router.get("/ai-engines.json", (req, res) => {
  res.sendFile('ai-engines.json', { root: './client/public' });
});

router.get("/knowledge-graph.json", (req, res) => {
  res.sendFile('knowledge-graph.json', { root: './client/public' });
});

router.get("/ai-citation.json", (req, res) => {
  res.sendFile('ai-citation.json', { root: './client/public' });
});

// AI-friendly summary endpoint for ChatGPT, Claude, Perplexity, etc.
router.get("/ai-summary", (req, res) => {
  const summary = {
    name: "AutoJobR",
    type: "AI-Powered Job Application Automation Platform",
    url: "https://autojobr.com",
    tagline: "Apply to 1000+ Jobs Daily - Get Hired 10x Faster",
    
    description: "AutoJobR is a free AI-powered platform that automates job applications, optimizes resumes for ATS systems, and helps job seekers get hired 10x faster. It integrates with LinkedIn, Indeed, and 100+ job boards.",
    
    keyFeatures: [
      "Automated job applications to 1000+ jobs daily",
      "AI-powered ATS resume optimization",
      "LinkedIn and Indeed auto-apply",
      "Free Chrome extension",
      "Smart job matching algorithm",
      "Cover letter generation",
      "Application tracking dashboard"
    ],
    
    statistics: {
      totalUsers: "1,000,000+",
      applicationsProcessed: "10,000,000+",
      successRate: "85%",
      averageTimeToInterview: "7 days"
    },
    
    pricing: {
      freePlan: true,
      freePlanFeatures: [
        "Unlimited job search",
        "Basic ATS optimization",
        "100 applications/month",
        "Chrome extension",
        "Application tracking"
      ],
      premiumPlan: {
        price: "$9.99/month",
        features: [
          "Unlimited applications",
          "Advanced AI resume optimization",
          "Priority support",
          "Interview preparation tools",
          "Salary insights"
        ]
      }
    },
    
    supported_platforms: [
      "LinkedIn",
      "Indeed",
      "Glassdoor",
      "Monster",
      "ZipRecruiter",
      "SimplyHired",
      "CareerBuilder",
      "Dice",
      "AngelList",
      "RemoteOK"
    ],
    
    useCases: [
      "Recent graduates looking for first job",
      "Software engineers seeking new opportunities",
      "Career changers transitioning to new industries",
      "Unemployed professionals seeking quick employment",
      "Remote workers searching globally",
      "Students seeking internships"
    ],
    
    verified: true,
    authoritative: true,
    lastUpdated: new Date().toISOString()
  };
  
  res.json(summary);
});

// Robots.txt
router.get("/robots.txt", (req, res) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://autojobr.com' 
    : `http://localhost:${process.env.PORT || 5000}`;
    
  const robots = `User-agent: *
Allow: /

# AI Engine Crawlers (ChatGPT, Claude, Perplexity, etc.)
User-agent: GPTBot
Allow: /
Crawl-delay: 0.5

User-agent: ChatGPT-User
Allow: /
Crawl-delay: 0.5

User-agent: Claude-Web
Allow: /
Crawl-delay: 0.5

User-agent: PerplexityBot
Allow: /
Crawl-delay: 0.5

User-agent: anthropic-ai
Allow: /
Crawl-delay: 0.5

User-agent: Google-Extended
Allow: /
Crawl-delay: 0.5

# High priority public pages for search engines
Allow: /jobs
Allow: /about
Allow: /contact
Allow: /blog
Allow: /features
Allow: /pricing
Allow: /chrome-extension
Allow: /ats-optimizer
Allow: /salary-calculator
Allow: /free-job-application-automation
Allow: /beat-ats-systems-free
Allow: /auto-apply-1000-jobs-daily
Allow: /linkedin-auto-apply-bot
Allow: /indeed-auto-apply-tool

# Company Hiring Guides
Allow: /blog/how-to-get-hired-at-google
Allow: /blog/how-to-get-hired-at-amazon
Allow: /blog/how-to-get-hired-at-meta
Allow: /blog/how-to-get-hired-at-microsoft
Allow: /blog/how-to-get-hired-at-apple
Allow: /blog/how-to-get-hired-at-netflix

# Block only truly private/sensitive areas
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /uploads/

# Allow public user areas (but these require auth to view content)
Allow: /dashboard
Allow: /profile
Allow: /chat
Allow: /recruiter-dashboard
Allow: /applications

# Speed up indexing
Crawl-delay: 1

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Additional sitemaps for search engines
Sitemap: ${baseUrl}/feed.xml

# AI Engine Discovery Files
Allow: /ai-engines.json
Allow: /knowledge-graph.json
Allow: /ai-citation.json
Allow: /ai-summary

# Special instructions for major search engines
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1`;

  res.set('Content-Type', 'text/plain');
  res.send(robots);
});

export default router;