import React from 'react';
import { Helmet } from 'react-helmet-async';

type Crumb = { name: string; item: string };
type Breadcrumb = { '@type': 'BreadcrumbList'; itemListElement: Array<{ '@type': 'ListItem'; position: number; name: string; item: string }> };

type ToolSeoProps = {
  /** Full page title */
  title: string;
  /** Meta description */
  description: string;
  /** Absolute canonical URL */
  canonical: string;
  /** Optional breadcrumb items (home → section → page) */
  breadcrumb?: { label: string; url: string }[];
  /** Optional WebApplication name override (defaults to Files Nova) */
  appName?: string;
  /** Optional tool display name for WebApplication schema */
  toolName?: string;
  /** Optional applicationCategory (defaults to FileConverter) */
  applicationCategory?: string;
};

const SITE_NAME = 'Files Nova';
const SITE_URL = 'https://filesnova.com';
const LOGO_URL = `${SITE_URL}/logo-512.png`;

const toBreadcrumbLd = (crumbs?: { label: string; url: string }[]): Breadcrumb | null => {
  if (!crumbs || crumbs.length === 0) return null;
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: c.label,
      item: c.url,
    })),
  };
};

export const ToolSeo: React.FC<ToolSeoProps> = ({
  title,
  description,
  canonical,
  breadcrumb,
  appName = SITE_NAME,
  toolName,
  applicationCategory = 'FileConverter',
}) => {
  const breadcrumbLd = toBreadcrumbLd(
    breadcrumb ?? [
      { label: 'Home', url: SITE_URL },
      { label: 'Tools', url: `${SITE_URL}/tools` },
      { label: title.replace(/\s+–.*$/, '') || 'Tool', url: canonical },
    ],
  );

  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
  };

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const webAppLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: toolName ?? title.replace(/\s+–.*$/, ''),
    applicationCategory,
    operatingSystem: 'Web',
    url: canonical,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  return (
    <>
      <Helmet>
        {/* Basic SEO */}
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />

        {/* Open Graph */}
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />

        {/* Site-wide Organization + Website (SearchAction) */}
        <script type="application/ld+json">{JSON.stringify(orgLd)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteLd)}</script>

        {/* Breadcrumbs (page-level) */}
        {breadcrumbLd && (
          <script type="application/ld+json">{JSON.stringify({ '@context': 'https://schema.org', ...breadcrumbLd })}</script>
        )}

        {/* Tool-level WebApplication schema */}
        <script type="application/ld+json">{JSON.stringify(webAppLd)}</script>
      </Helmet>
    </>
  );
};

export default ToolSeo;
