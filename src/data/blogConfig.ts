import type { StarlightBlogUserConfig } from 'starlight-blog';
import { SITE_PROFILE } from './siteProfile';

export const BLOG_CONFIG = {
  title: 'Blog',
  postCount: 5,
  recentPostCount: 10,
  navigation: 'none',
  structuredData: false, // Head.astro owns article and breadcrumb metadata.
  authors: {
    hyoguoo: { name: 'hyoguoo', title: SITE_PROFILE.role, url: 'https://github.com/hyoguoo' },
  },
} satisfies StarlightBlogUserConfig;
