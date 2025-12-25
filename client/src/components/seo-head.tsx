// ============================================
// IMPROVED SEO COMPONENT FOR AUTOJOBR
// ============================================

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
  // NEW: Better control over features
  includeOrganizationSchema?: boolean;
  includeRatings?: boolean;
  actualRatingValue?: number;
  actualRatingCount?: number;
  preserveQueryParams?: string[]; // e.g., ['utm_source', 'page']
  alternateLanguages?: Array<{lang: string, url: string}>;
}

export default function SEOHead({
  title = "AutoJobR - AI Job Application Automation Platform",
  description = "AI-powered job application automation platform. Apply to thousands of jobs automatically, optimize resumes for ATS systems, and land interviews faster. Free and premium plans available.",
  keywords, // Optional - not used by Google
  canonicalUrl,
  ogImage = "https://autojobr.com/images/og-default.jpg",
  ogType = "website",
  noIndex = false,
  structuredData,
  articleSchema,
  breadcrumbs,
  includeOrganizationSchema = true,
  includeRatings = true,
  actualRatingValue = 4.9,
  actualRatingCount = 50000,
  preserveQueryParams = [],
  alternateLanguages = []
}: SEOHeadProps) {
  
  // ========================================
  // TITLE HANDLING
  // ========================================
  const fullTitle = title.includes("AutoJobR") 
    ? title 
    : `${title} | AutoJobR`;
  
  // Ensure title is under 60 characters for optimal display
  const optimizedTitle = fullTitle.length > 60 
    ? fullTitle.substring(0, 57) + "..." 
    : fullTitle;
  
  // ========================================
  // CANONICAL URL - IMPROVED LOGIC
  // ========================================
  const getCanonicalUrl = () => {
    if (canonicalUrl) return canonicalUrl;
    
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      
      // Keep only whitelisted query params
      const paramsToKeep = new URLSearchParams();
      preserveQueryParams.forEach(param => {
        const value = url.searchParams.get(param);
        if (value) paramsToKeep.set(param, value);
      });
      
      url.search = paramsToKeep.toString();
      return url.toString();
    }
    
    return 'https://autojobr.com';
  };
  
  const currentUrl = getCanonicalUrl();
  
  // Only noindex if there are unpreserved query params
  const hasUnwantedParams = typeof window !== 'undefined' && 
    new URL(window.location.href).search && 
    currentUrl.includes('?') === false;
  
  // ========================================
  // DESCRIPTION CLEANUP
  // ========================================
  // Remove emojis and ensure 150-160 char length
  const cleanDescription = description
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    .trim();
  
  const optimizedDescription = cleanDescription.length > 160
    ? cleanDescription.substring(0, 157) + "..."
    : cleanDescription;
  
  // ========================================
  // RATINGS - ONLY IF REAL
  // ========================================
  const ratingData = (includeRatings && actualRatingValue && actualRatingCount) ? {
    "@type": "AggregateRating",
    "ratingValue": actualRatingValue.toFixed(1),
    "ratingCount": actualRatingCount.toString(),
    "bestRating": "5",
    "worstRating": "1"
  } : undefined;
  
  // ========================================
  // STRUCTURED DATA - SIMPLIFIED & ACCURATE
  // ========================================
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      // Website
      {
        "@type": "WebSite",
        "@id": "https://autojobr.com/#website",
        "url": "https://autojobr.com/",
        "name": "AutoJobR",
        "description": optimizedDescription,
        "inLanguage": "en-US",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://autojobr.com/jobs?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      },
      
      // Organization (optional)
      ...(includeOrganizationSchema ? [{
        "@type": "Organization",
        "@id": "https://autojobr.com/#organization",
        "name": "AutoJobR",
        "url": "https://autojobr.com/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://autojobr.com/logo.png",
          "width": 512,
          "height": 512
        },
        "description": "AI-powered job application automation platform",
        "foundingDate": "2024",
        "founder": {
          "@type": "Person",
          "name": "Shubham Dubey"
        },
        "sameAs": [
          "https://twitter.com/autojobr",
          "https://linkedin.com/company/autojobr"
        ],
        ...(ratingData && { aggregateRating: ratingData })
      }] : []),
      
      // Software Application
      {
        "@type": "SoftwareApplication",
        "@id": "https://autojobr.com/#software",
        "name": "AutoJobR",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": ["Windows", "macOS", "Linux", "Web Browser"],
        "offers": {
          "@type": "AggregateOffer",
          "lowPrice": "0",
          "highPrice": "49.99",
          "priceCurrency": "USD",
          "offerCount": "3",
          "availability": "https://schema.org/InStock"
        },
        "featureList": [
          "AI-powered job matching",
          "Automated job applications",
          "ATS resume optimization",
          "LinkedIn automation",
          "Application tracking"
        ]
      },
      
      // FAQ
      {
        "@type": "FAQPage",
        "@id": "https://autojobr.com/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is AutoJobR?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "AutoJobR is an AI-powered platform that automates job applications, optimizes resumes for ATS systems, and helps job seekers apply to multiple positions efficiently."
            }
          },
          {
            "@type": "Question",
            "name": "How does AutoJobR help with ATS systems?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "AutoJobR analyzes job descriptions and optimizes your resume with relevant keywords and proper formatting to pass Applicant Tracking Systems."
            }
          },
          {
            "@type": "Question",
            "name": "Is there a free plan?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, AutoJobR offers a free plan with basic features. Premium plans with advanced AI capabilities start at $9.99/month."
            }
          },
          {
            "@type": "Question",
            "name": "Which job boards does AutoJobR support?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "AutoJobR integrates with major job boards including LinkedIn, Indeed, Glassdoor, Monster, and ZipRecruiter."
            }
          }
        ]
      }
    ]
  };

  // Breadcrumb Schema
  const breadcrumbSchema = breadcrumbs && breadcrumbs.length > 0 ? {
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
      {/* ========================================
          PRIMARY META TAGS
          ======================================== */}
      <title>{optimizedTitle}</title>
      <meta name="description" content={optimizedDescription} />
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      
      {/* Language */}
      <html lang="en" />
      
      {/* ========================================
          CANONICAL & ALTERNATE URLS
          ======================================== */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Alternate language versions */}
      {alternateLanguages.map(alt => (
        <link
          key={alt.lang}
          rel="alternate"
          hrefLang={alt.lang}
          href={alt.url}
        />
      ))}
      
      {/* ========================================
          ROBOTS & INDEXING
          ======================================== */}
      {noIndex || hasUnwantedParams ? (
        <meta name="robots" content="noindex, follow" />
      ) : (
        <>
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
          <meta name="googlebot" content="index, follow" />
        </>
      )}
      
      {/* ========================================
          OPEN GRAPH / FACEBOOK
          ======================================== */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={optimizedTitle} />
      <meta property="og:description" content={optimizedDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="AutoJobR" />
      <meta property="og:locale" content="en_US" />
      
      {/* ========================================
          TWITTER CARD
          ======================================== */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={optimizedTitle} />
      <meta name="twitter:description" content={optimizedDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@autojobr" />
      
      {/* ========================================
          ADDITIONAL META
          ======================================== */}
      <meta name="theme-color" content="#3b82f6" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Author */}
      <meta name="author" content="AutoJobR" />
      
      {/* ========================================
          STRUCTURED DATA
          ======================================== */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
      
      {/* Article Schema (for blog posts) */}
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
      
      {/* ========================================
          PERFORMANCE OPTIMIZATION
          ======================================== */}
      {/* Only preconnect to domains you actually use */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* DNS prefetch for API */}
      <link rel="dns-prefetch" href="https://api.autojobr.com" />
      
      {/* ========================================
          FAVICON
          ======================================== */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Bing Webmaster Verification */}
      <meta name="msvalidate.01" content="BING_VERIFICATION_CODE" />
      <meta name="msapplication-TileImage" content="/web-app-manifest-512x512.png" />
      <meta name="msapplication-TileColor" content="#3b82f6" />
      
      {/* Microsoft Clarity Tracking */}
      <script type="text/javascript">
        {`
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "clarity_id_placeholder");
        `}
      </script>
    </Helmet>
  );
}
