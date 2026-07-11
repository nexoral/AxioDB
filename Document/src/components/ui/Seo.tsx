import React from "react";
import { Head } from "vite-react-ssg";

interface SeoProps {
  /** Full page title, e.g. "API Reference | AxioDB Documentation" */
  title: string;
  /** One or two sentence page-specific summary, used for meta description and social previews */
  description: string;
  /** Route path starting with "/", e.g. "/api-reference" */
  path: string;
}

const SITE_URL = "https://axiodb.in";

/**
 * Per-route metadata, rendered into <head> via vite-react-ssg's built-in Head
 * component - this is what makes title/description/canonical/OG/Twitter tags
 * actually differ per page in the prerendered static HTML, instead of every
 * route shipping the same homepage tags from index.html.
 */
const Seo: React.FC<SeoProps> = ({ title, description, path }) => {
  const url = `${SITE_URL}${path}`;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Head>
  );
};

export default Seo;
