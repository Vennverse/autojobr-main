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
}

export default function SEOHead({
  title = "AutoJobR - AI-Powered Job Application Automation | Apply to 1000+ Jobs Daily",
  description = "🔥 #1 FREE Job Application Automation Platform! Auto-apply to 1000+ jobs daily, beat ATS systems, get instant interviews. Join 1M+ users landing dream jobs 10x faster.",
  keywords = "job application automation, AI job search, automatic job applications, ATS optimizer, LinkedIn auto apply, Indeed auto apply, job search bot, resume optimizer, career automation",
  canonicalUrl,
  ogImage = "https://autojobr.com/og-image.png",
  ogType = "website",
  noIndex = false,
  structuredData
}: SEOHeadProps) {
  const fullTitle = title.includes("AutoJobR") ? title : `${title} | AutoJobR`;
  const currentUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : 'https://autojobr.com');
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />
      
      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="AutoJobR" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@autojobr" />
      <meta name="twitter:creator" content="@autojobr" />
      
      {/* Additional SEO */}
      <meta name="author" content="AutoJobR" />
      <meta name="generator" content="AutoJobR Platform" />
      <meta name="theme-color" content="#3b82f6" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Favicon */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" href="/favicon.png" />
      
      {/* Additional Meta for Google */}
      <meta name="google-site-verification" content="your-google-verification-code" />
      <meta name="msvalidate.01" content="your-bing-verification-code" />
    </Helmet>
  );
}