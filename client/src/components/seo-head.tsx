import { Helmet } from "react-helmet";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  structuredData?: object;
  articleSchema?: object;
  breadcrumbs?: Array<{name: string, url: string}>;
}

export default function SEOHead({
  title = "AutoJobR - AI That Connects Talent and Opportunity | Apply Faster, Hire Smarter",
  description = "🔥 #1 AI Platform for Job Seekers & Recruiters! Founded by Shubham Dubey. Auto-apply to jobs, beat ATS, smart hiring tools. Free & Premium plans from $9.99/month. Join 1M+ users!",
  keywords = "job application automation, AI job search, automatic job applications, ATS optimizer, LinkedIn auto apply, Indeed auto apply, job search bot, resume optimizer, career automation",
  canonicalUrl,
  ogImage = "https://autojobr.com/og-image.png",
  ogType = "website",
  noIndex = false,
  structuredData,
  articleSchema,
  breadcrumbs
}: SEOHeadProps) {
  const fullTitle = title.includes("AutoJobR") ? title : `${title} | AutoJobR`;
  const currentUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : 'https://autojobr.com');
  
  // Enhanced structured data for AI Engine Optimization (AEO) and Generative Engine Optimization (GEO)
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://autojobr.com/#website",
        "url": "https://autojobr.com/",
        "name": "AutoJobR - AI Job Application Automation",
        "alternateName": ["AutoJobR", "Auto Job R", "AI Job Application Tool"],
        "description": description,
        "about": {
          "@type": "Thing",
          "name": "Job Application Automation",
          "description": "AI-powered platform that automates job applications, optimizes resumes for ATS systems, and helps job seekers land interviews faster"
        },
        "keywords": "job application automation, AI job search, ATS optimizer, resume builder, career automation, LinkedIn automation, Indeed auto apply, job search bot, free job applications, AI resume optimizer",
        "inLanguage": "en-US",
        "isAccessibleForFree": "True",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://autojobr.com/jobs?search={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "@id": "https://autojobr.com/#organization",
        "name": "AutoJobR Inc.",
        "legalName": "AutoJobR Incorporated",
        "url": "https://autojobr.com/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://autojobr.com/favicon.png",
          "width": 512,
          "height": 512,
          "caption": "AutoJobR Logo - AI That Connects Talent and Opportunity"
        },
        "description": "AI That Connects Talent and Opportunity — Apply Faster, Hire Smarter. Leading platform for job seekers and recruiters with 1M+ users worldwide.",
        "slogan": "AI That Connects Talent and Opportunity — Apply Faster, Hire Smarter",
        "foundingDate": "2024",
        "founder": {
          "@type": "Person",
          "name": "Shubham Dubey",
          "jobTitle": "Founder & CEO",
          "description": "Visionary entrepreneur revolutionizing job search and recruitment through AI automation"
        },
        "email": "support@autojobr.com",
        "knowsAbout": [
          "Artificial Intelligence",
          "Job Application Automation",
          "Applicant Tracking Systems (ATS)",
          "Resume Optimization",
          "Career Development",
          "Job Search Optimization",
          "LinkedIn Automation",
          "Indeed Integration",
          "Chrome Extensions",
          "Natural Language Processing",
          "Machine Learning",
          "Career Coaching"
        ],
        "areaServed": "Worldwide",
        "sameAs": [
          "https://twitter.com/autojobr",
          "https://linkedin.com/company/autojobr",
          "https://facebook.com/autojobr",
          "https://instagram.com/autojobr"
        ],
        "brand": {
          "@type": "Brand",
          "name": "AutoJobR",
          "description": "AI That Connects Talent and Opportunity — Apply Faster, Hire Smarter"
        },
        "mainEntityOfPage": "https://autojobr.com",
        "keywords": [
          "AI job automation",
          "talent acquisition",
          "recruitment technology",
          "applicant tracking system",
          "resume optimization AI",
          "interview automation",
          "hiring platform",
          "job matching algorithm"
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "50000",
          "bestRating": "5",
          "worstRating": "1"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://autojobr.com/#software",
        "name": "AutoJobR - Job Application Automation Software",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": ["Windows", "macOS", "Linux", "Chrome OS", "Web Browser"],
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "priceValidUntil": "2030-12-31",
          "description": "Free job application automation with premium features available"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "50000",
          "bestRating": "5",
          "worstRating": "1"
        },
        "featureList": [
          "AI-powered job matching",
          "Automated job applications",
          "ATS resume optimization",
          "LinkedIn automation",
          "Indeed auto-apply",
          "Chrome extension",
          "Cover letter generator",
          "Interview preparation",
          "Application tracking",
          "AI career coaching"
        ],
        "screenshot": "https://autojobr.com/og-image.png",
        "softwareVersion": "2.0",
        "datePublished": "2024-01-01",
        "description": "Comprehensive AI platform that automates job applications, optimizes resumes for ATS, and helps users get hired 10x faster"
      },
      {
        "@type": "FAQPage",
        "@id": "https://autojobr.com/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is AutoJobR?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "AutoJobR is a free AI-powered job application automation platform that helps job seekers apply to 1000+ jobs daily, beat ATS systems, and get hired 10x faster. It uses advanced AI to match candidates with relevant jobs, optimize resumes, and automate the entire application process."
            }
          },
          {
            "@type": "Question",
            "name": "How does AutoJobR help beat ATS systems?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "AutoJobR uses AI to analyze job descriptions and optimize your resume with the right keywords, formatting, and content structure that ATS systems look for. It ensures your resume passes automated screening and reaches human recruiters."
            }
          },
          {
            "@type": "Question",
            "name": "Is AutoJobR really free?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, AutoJobR offers a completely free plan that includes job search automation, basic ATS optimization, and application tracking. Premium features with advanced AI tools are available for users who want enhanced capabilities."
            }
          },
          {
            "@type": "Question",
            "name": "Which job boards does AutoJobR support?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "AutoJobR integrates with major job boards including LinkedIn, Indeed, Glassdoor, Monster, ZipRecruiter, and 100+ other platforms. Our Chrome extension works across all job sites."
            }
          }
        ]
      },
      {
        "@type": "HowTo",
        "@id": "https://autojobr.com/#howto",
        "name": "How to Use AutoJobR for Job Search Automation",
        "description": "Step-by-step guide to automate your job search with AutoJobR",
        "step": [
          {
            "@type": "HowToStep",
            "position": 1,
            "name": "Sign Up Free",
            "text": "Create a free AutoJobR account in 30 seconds"
          },
          {
            "@type": "HowToStep",
            "position": 2,
            "name": "Upload Resume",
            "text": "Upload your resume and let AI optimize it for ATS systems"
          },
          {
            "@type": "HowToStep",
            "position": 3,
            "name": "Set Preferences",
            "text": "Set your job preferences, location, salary range, and desired roles"
          },
          {
            "@type": "HowToStep",
            "position": 4,
            "name": "Install Extension",
            "text": "Install the free Chrome extension for one-click applications"
          },
          {
            "@type": "HowToStep",
            "position": 5,
            "name": "Apply Automatically",
            "text": "AI automatically applies to matching jobs across all platforms"
          }
        ]
      },
      {
        "@type": "Service",
        "@id": "https://autojobr.com/#service",
        "name": "Job Application Automation Service",
        "provider": {
          "@id": "https://autojobr.com/#organization"
        },
        "serviceType": "Career Services",
        "areaServed": "Worldwide",
        "audience": {
          "@type": "Audience",
          "audienceType": "Job Seekers, Recent Graduates, Career Changers, Software Engineers, Students"
        },
        "category": "Employment and Career Services",
        "description": "AI-powered job application automation that applies to hundreds of jobs on your behalf, optimizes resumes for ATS, and helps you get interviews faster"
      }
    ]
  };

  // Breadcrumb structured data
  const breadcrumbSchema = breadcrumbs ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  } : null;
  
  return (
    <Helmet>
      {/* Enhanced Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Enhanced Viewport for mobile-first indexing */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      
      {/* Language and region */}
      <meta httpEquiv="content-language" content="en-US" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      
      {/* Canonical URL - Stronger enforcement */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Prevent duplicate indexing */}
      {currentUrl.includes('?') && (
        <>
          <meta name="robots" content="noindex, follow" />
          <link rel="canonical" href={currentUrl.split('?')[0]} />
        </>
      )}
      
      {/* Enhanced Robots directives */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      
      {/* Open Graph Enhanced */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${title} - AutoJobR Platform`} />
      <meta property="og:site_name" content="AutoJobR" />
      <meta property="og:locale" content="en_US" />
      <meta property="article:publisher" content="https://facebook.com/autojobr" />
      
      {/* Twitter Card Enhanced */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={`${title} - AutoJobR Platform`} />
      <meta name="twitter:site" content="@autojobr" />
      <meta name="twitter:creator" content="@autojobr" />
      
      {/* Additional Enhanced SEO */}
      <meta name="author" content="AutoJobR Team" />
      <meta name="generator" content="AutoJobR Platform" />
      <meta name="theme-color" content="#3b82f6" />
      <meta name="msapplication-TileColor" content="#3b82f6" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* Core Web Vitals optimization */}
      <link rel="preload" href="/favicon.svg" as="image" type="image/svg+xml" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="dns-prefetch" href="//api.autojobr.com" />
      
      {/* Enhanced Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
      
      {/* Article Schema if provided */}
      {articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      )}
      
      {/* Breadcrumb Schema */}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.autojobr.com" />
      
      {/* Enhanced Favicon */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" href="/favicon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Search Engine Verification */}
      <meta name="google-site-verification" content="your-google-verification-code" />
      <meta name="msvalidate.01" content="your-bing-verification-code" />
      <meta name="yandex-verification" content="your-yandex-verification-code" />
      
      {/* Performance hints */}
      <link rel="preload" href="/api/jobs/postings" as="fetch" crossOrigin="anonymous" />
      
      {/* Security headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      
      {/* Mobile optimization */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      
      {/* Rich snippets support */}
      <meta property="business:contact_data:street_address" content="AutoJobR HQ" />
      <meta property="business:contact_data:locality" content="San Francisco" />
      <meta property="business:contact_data:region" content="CA" />
      <meta property="business:contact_data:postal_code" content="94102" />
      <meta property="business:contact_data:country_name" content="USA" />
    </Helmet>
  );
}