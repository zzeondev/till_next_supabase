import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/reset-password', '/api/'],
      },
    ],
    sitemap: 'https://sns.devgr.kr/sitemap.xml',
  };
}
