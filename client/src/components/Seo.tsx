import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description?: string;
  canonicalUrl?: string;
  type?: "website" | "article";
  imageUrl?: string;
  publishedTime?: string;
  modifiedTime?: string;
  breadcrumb?: Array<{
    position: number;
    name: string;
    item: string;
  }>;
}

export function Seo({
  title,
  description = "Blog içeriklerini keşfedin",
  canonicalUrl,
  type = "website",
  imageUrl,
  publishedTime,
  modifiedTime,
  breadcrumb
}: SeoProps) {
  const siteUrl = window.location.origin;
  const url = canonicalUrl || window.location.href;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}

      {/* Article specific */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}

      {/* Schema.org markup */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === "article" ? "BlogPosting" : "WebSite",
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": url
          },
          "headline": title,
          "description": description,
          "image": imageUrl,
          "url": url,
          ...(type === "article" && publishedTime && {
            "datePublished": publishedTime,
            "dateModified": modifiedTime || publishedTime,
          }),
          "publisher": {
            "@type": "Organization",
            "name": title, // Changed to use the provided title
            "url": siteUrl
          }
        })}
      </script>

      {/* Breadcrumb Schema */}
      {breadcrumb && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumb.map((item) => ({
              "@type": "ListItem",
              "position": item.position,
              "name": item.name,
              "item": item.item
            }))
          })}
        </script>
      )}
    </Helmet>
  );
}