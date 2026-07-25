import { siteConfig } from "@/config/site";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";
import { JsonLd } from "@/components/seo/json-ld";

export function SiteJsonLd() {
  const url = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: siteConfig.name,
        url,
        logo: absoluteUrl("/logo.png"),
        description: siteConfig.description,
      },
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        name: siteConfig.name,
        url,
        publisher: { "@id": `${url}/#organization` },
        inLanguage: ["pt-PT", "en"],
      },
      {
        "@type": "AutoDealer",
        "@id": `${url}/#dealer`,
        name: siteConfig.name,
        url,
        description: siteConfig.description,
        image: absoluteUrl("/logo.png"),
      },
    ],
  };

  return <JsonLd data={data} />;
}
