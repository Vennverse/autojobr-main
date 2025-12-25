import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
}

export function SEO({ 
  title, 
  description, 
  canonical, 
  ogType = "website",
  ogImage = "https://autojobr.com/og-image.png"
}: SEOProps) {
  const [location] = useLocation();
  const baseDomain = "https://autojobr.com";
  
  // Default canonical to current path on autojobr.com (non-www)
  const canonicalUrl = canonical || `${baseDomain}${location}`;

  const defaultTitle = "AutoJobr - Automate Your Job Applications with AI";
  const defaultDescription = "AutoJobr helps you find and apply to jobs automatically using AI. Optimize your resume, generate cover letters, and track applications in one place.";

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title ? `${title} | AutoJobr` : defaultTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title || defaultTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={title || defaultTitle} />
      <meta property="twitter:description" content={description || defaultDescription} />
      <meta property="twitter:image" content={ogImage} />
    </Helmet>
  );
}
