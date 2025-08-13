import { Router } from "express";

const router = Router();

// SEO sitemap generation
router.get("/sitemap.xml", (req, res) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://autojobr.com' 
    : `http://localhost:${process.env.PORT || 5000}`;
    
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>${baseUrl}/about</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${baseUrl}/contact</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${baseUrl}/blog</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>${baseUrl}/chrome-extension</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${baseUrl}/ats-optimizer</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${baseUrl}/free-job-application-automation</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.95</priority>
    </url>
    <url>
        <loc>${baseUrl}/beat-ats-systems-free</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.95</priority>
    </url>
    <url>
        <loc>${baseUrl}/auto-apply-1000-jobs-daily</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.95</priority>
    </url>
    <url>
        <loc>${baseUrl}/linkedin-auto-apply-bot</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>${baseUrl}/indeed-auto-apply-tool</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.send(sitemap);
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

// Robots.txt
router.get("/robots.txt", (req, res) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://autojobr.com' 
    : `http://localhost:${process.env.PORT || 5000}`;
    
  const robots = `User-agent: *
Allow: /

# High priority public pages for search engines
Allow: /jobs
Allow: /about
Allow: /contact
Allow: /blog
Allow: /features
Allow: /pricing
Allow: /chrome-extension
Allow: /ats-optimizer
Allow: /free-job-application-automation
Allow: /beat-ats-systems-free
Allow: /auto-apply-1000-jobs-daily
Allow: /linkedin-auto-apply-bot
Allow: /indeed-auto-apply-tool

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