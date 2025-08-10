import React from "react";
import { Helmet } from "react-helmet-async";

type ToolSeoProps = {
  title: string;                 // e.g., "JPG to PDF – Files Nova"
  name: string;                  // e.g., "JPG to PDF"
  slug: string;                  // e.g., "/tools/jpg-to-pdf"
  description: string;
  keywords?: string[];
  fromFormats?: string[];        // e.g., ["JPG", "JPEG"]
  toFormats?: string[];          // e.g., ["PDF"]
  imageUrl?: string;             // OG image if you want to override
};

const SITE = "https://filesnova.com";

const ToolSeo: React.FC<ToolSeoProps> = ({
  title,
  name,
  slug,
  description,
  keywords = [],
  fromFormats = [],
  toFormats = [],
  imageUrl = "https://filesnova.com/filesnova-og-image.jpg",
}) => {
  const url = `${SITE}${slug}`;
  const kw = keywords.join(", ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      // Breadcrumb
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/" },
          { "@type": "ListItem", "position": 2, "name": name, "item": url }
        ]
      },
      // WebPage
      {
        "@type": "WebPage",
        "name": title,
        "url": url,
        "description": description,
        "isPartOf": { "@type": "WebSite", "name": "Files Nova", "url": SITE },
        "inLanguage": "en",
        ...(kw ? { "keywords": kw } : {}),
        "primaryImageOfPage": imageUrl
      },
      // SoftwareApplication (the tool)
      {
        "@type": "SoftwareApplication",
        "name": name,
        "operatingSystem": "Web",
        "applicationCategory": "UtilitiesApplication",
        "applicationSubCategory": "File Converter",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "url": url,
        "description": description,
        ...(fromFormats.length || toFormats.length
          ? {
              "featureList": [
                ...(fromFormats.length ? [`Input: ${fromFormats.join(", ")}`] : []),
                ...(toFormats.length ? [`Output: ${toFormats.join(", ")}`] : []),
                "Free, private, runs in-browser"
              ]
            }
          : {})
      }
    ]
  };

  return (
    <Helmet>
      {/* Basic meta for the page */}
      <title>{title}</title>
      <link rel="canonical" href={url} />
      <meta name="description" content={description} />
      {kw && <meta name="keywords" content={kw} />}

      {/* Open Graph / Twitter fallback */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};

export default ToolSeo;
