import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard'], // Keep dashboards and protected API routes out of search results
    },
    sitemap: 'https://pr-agent-test.vercel.app/sitemap.xml',
  };
}