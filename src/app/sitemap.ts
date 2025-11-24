import type { MetadataRoute } from 'next';
import { listPublicPosts, listPublicProfiles } from '@/lib/sitemap';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [profiles, posts] = await Promise.all([
    listPublicProfiles(),
    listPublicPosts(),
  ]);

  return [
    { url: 'https://sns.devgr.kr/', changeFrequency: 'daily', priority: 1 },
    { url: 'https://sns.devgr.kr/signin', changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://sns.devgr.kr/signup', changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://sns.devgr.kr/forget-password', changeFrequency: 'daily', priority: 0.5 },
    { url: 'https://sns.devgr.kr/todo-list', changeFrequency: 'daily', priority: 0.7 },
    ...profiles.map(profile => ({
      url: `https://sns.devgr.kr/profile/${profile.id}`,
      lastModified: profile.created_at ?? new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.5,
    })),
    ...posts.map(post => ({
      url: `https://sns.devgr.kr/post/${post.id}`,
      lastModified: post.created_at ?? new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.5,
    })),
  ];
}
