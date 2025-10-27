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
  title = "AutoJobR - AI-Powered Job Application Automation | Apply to 1000+ Jobs Daily",
  description = "🔥 #1 FREE Job Application Automation Platform! Auto-apply to 1000+ jobs daily, beat ATS systems, get instant interviews. Join 1M+ users landing dream jobs 10x faster.",
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
  
  // Enhanced structured data for better SEO
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://autojobr.com/#website",
        "url": "https://autojobr.com/",
        "name": "AutoJobR - AI Job Application Automation",
        "description": description,
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://autojobr.com/jobs?search={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        },
        "inLanguage": "en-US"
      },
      {
        "@type": "Organization",
        "@id": "https://autojobr.com/#organization",
        "name": "AutoJobR",
        "url": "https://autojobr.com/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://autojobr.com/favicon.png",
          "width": 512,
          "height": 512
        },
        "sameAs": [
          "https://twitter.com/autojobr",
          "https://linkedin.com/company/autojobr"
        ]
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