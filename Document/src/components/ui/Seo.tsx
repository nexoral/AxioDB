import React from "react";
import { Head } from "vite-react-ssg";
import { getBreadcrumbSchema } from "../../data/breadcrumbs";

interface SeoProps {
  /** Full page title, e.g. "API Reference | AxioDB Documentation" */
  title: string;
  /** One or two sentence page-specific summary, used for meta description and social previews */
  description: string;
  /** Route path starting with "/", e.g. "/api-reference" */
  path: string;
  /** Open Graph type — "website" (default) for index pages, "article" for content pages */
  ogType?: "website" | "article";
  /** ISO date string for when this page's content was first published */
  datePublished?: string;
  /** ISO date string for when this page's content was last meaningfully updated */
  dateModified?: string;
  /** Additional JSON-LD schema object(s) to include alongside the auto-generated BreadcrumbList */
  schema?: object | object[];
}

const SITE_URL = "https://axiodb.in";
const DEFAULT_OG_IMAGE = `${SITE_URL}/AXioDB.png`;

/**
 * Per-route metadata, rendered into <head> via vite-react-ssg's built-in Head
 * component - this is what makes title/description/canonical/OG/Twitter tags
 * actually differ per page in the prerendered static HTML, instead of every
 * route shipping the same homepage tags from index.html.
 *
 * Also emits BreadcrumbList JSON-LD (rendered in the body since
 * vite-react-ssg's Head doesn't support dangerouslySetInnerHTML on scripts)
 * and any page-specific structured data.
 */
const Seo: React.FC<SeoProps> = ({
  title,
  description,
  path,
  ogType = "website",
  datePublished,
  dateModified,
  schema,
}) => {
  const url = `${SITE_URL}${path}`;
  const breadcrumbSchema = getBreadcrumbSchema(path);
  const schemas = [
    breadcrumbSchema,
    ...(Array.isArray(schema) ? schema : schema ? [schema] : []),
  ];

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content={ogType} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="twitter:url" content={url} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
        {datePublished && (
          <meta property="article:published_time" content={datePublished} />
        )}
        {dateModified && (
          <meta property="article:modified_time" content={dateModified} />
        )}
      </Head>
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
    </>
  );
};

export default Seo;