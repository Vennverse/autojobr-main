import { Helmet } from 'react-helmet-async';

export interface SEOMetaProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  schema?: Record<string, any>;
}

export function SEOMeta({
  title,
  description,
  keywords,
  image = 'https://autojobr.com/logo.png',
  url = 'https://autojobr.com',
  type = 'website',
  author,
  publishedDate,
  modifiedDate,
  schema,
}: SEOMetaProps) {
  const fullTitle = `${title} | AutoJobr`;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={author || 'AutoJobr'} />
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="AutoJobr" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@autojobr" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Article Metadata */}
      {type === 'article' && publishedDate && (
        <meta property="article:published_time" content={publishedDate} />
      )}
      {type === 'article' && modifiedDate && (
        <meta property="article:modified_time" content={modifiedDate} />
      )}
      
      <meta name="msvalidate.01" content="BING_VERIFICATION_CODE" />
      
      {/* Schema.org Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}

export const landingPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'AutoJobr - Skip Cold Applications. Get Seen Faster.',
  description: 'AI-powered job search automation platform with referrals, interview prep, and one-click applications',
  url: 'https://autojobr.com',
  logo: 'https://autojobr.com/logo.png',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser, Chrome Extension',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '75000',
    bestRating: '5',
    worstRating: '1',
  },
};

export const faqSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});
