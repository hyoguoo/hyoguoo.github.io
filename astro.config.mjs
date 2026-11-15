// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import starlightBlog from 'starlight-blog';
import { blogIndexPlugin } from './src/build/blog-index-plugin.ts';
import { SITE_PROFILE } from './src/data/siteProfile.ts';
import { BLOG_CONFIG } from './src/data/blogConfig.ts';
import { buildLastModMap } from './src/build/sitemap.mjs';
import { sitemapMirrors } from './src/build/sitemap-mirrors.mjs';

const lastModMap = buildLastModMap(new URL('./src/content/docs/', import.meta.url));

// https://astro.build/config
export default defineConfig({
	output: 'static',
	redirects: {
		'/docs/java/object-class/string-class': '/docs/java/string-class/#string-클래스의-equals',
		'/docs/java/variable/wrapper-class': '/docs/java/wrapper-class/',
		'/docs/java/effective-java/item33/item28': '/docs/java/effective-java/item28/',
	},
	trailingSlash: 'always',
	site: 'https://hyoguoo.github.io',
	server: {
		port: 4322,
		host: true,
	},
	integrations: [
		starlight({
			disable404Route: true, // Local 404 page keeps GitHub Pages output without a duplicate route.
			title: "hyoguoo.log",
			routeMiddleware: './src/routeMiddleware.ts',
			expressiveCode: { shiki: { langAlias: { gradle: 'groovy', redis: 'shellsession' } } },
			description: SITE_PROFILE.description,
			defaultLocale: 'root',
			locales: {
				root: { label: '한국어', lang: 'ko' },
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/hyoguoo' },
			],
			head: [
				{
					tag: 'meta',
					attrs: { name: 'google-site-verification', content: 'zQ7fN1J9KvTYUQHViHtn7XF6uQ1y6Q8WqrDdul-exu0' },
				},
				{
					tag: 'link',
					attrs: {
						rel: 'stylesheet',
						href: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.css',
					},
				},
				{
					tag: 'meta',
					attrs: { property: 'og:image', content: 'https://hyoguoo.github.io/og.png' },
				},
				{
					tag: 'meta',
					attrs: { name: 'twitter:card', content: 'summary_large_image' },
				},
				{
					tag: 'meta',
					attrs: { name: 'twitter:image', content: 'https://hyoguoo.github.io/og.png' },
				},
			],
			plugins: [
				starlightBlog(BLOG_CONFIG),
				blogIndexPlugin(),
			],
			sidebar: [
				{
					label: 'Computer Architecture',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/computer-architecture', collapsed: true } }],
				},
				{
					label: 'Operating System',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/operating-system', collapsed: true } }],
				},
				{
					label: 'Network',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/network', collapsed: true } }],
				},
				{
					label: 'Secure',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/secure', collapsed: true } }],
				},
				{
					label: 'Java',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/java', collapsed: true } }],
				},
				{
					label: 'Node.js',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/nodejs', collapsed: true } }],
				},
				{
					label: 'Spring',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/spring', collapsed: true } }],
				},
				{
					label: 'OOP',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/oop', collapsed: true } }],
				},
				{
					label: 'MySQL',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/mysql', collapsed: true } }],
				},
				{
					label: 'Redis',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/redis', collapsed: true } }],
				},
				{
					label: 'Kafka',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/kafka', collapsed: true } }],
				},
				{
					label: 'ELK',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/elk', collapsed: true } }],
				},
				{
					label: 'Docker',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/docker', collapsed: true } }],
				},
				{
					label: 'Large-Scale System',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/large-scale-system', collapsed: true } }],
				},
				{
					label: 'Test',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/test', collapsed: true } }],
				},
				{
					label: 'AI-Assisted Development',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/ai-assisted-development', collapsed: true } }],
				},
				{
					label: 'Setting',
					collapsed: true,
					items: [{ autogenerate: { directory: 'docs/setting', collapsed: true } }],
				},
			],
			components: {
				Head: './src/components/Head.astro',
				ThemeProvider: './src/components/ThemeProvider.astro',
				ThemeSelect: './src/components/ThemeSelect.astro',
				Footer: './src/components/Footer.astro',
				Header: './src/components/Header.astro',
				MobileMenuFooter: './src/components/MobileMenuFooter.astro',
				Sidebar: './src/components/Sidebar.astro',
				PageTitle: './src/components/PageTitle.astro',
				Pagination: './src/components/Pagination.astro',
				SocialIcons: './src/components/SocialIcons.astro',
				SiteTitle: './src/components/SiteTitle.astro',
			},
			customCss: ['./src/styles/custom.css'],
		}),
		sitemap({
			serialize(item) {
				const pathname = new URL(item.url).pathname;
				const lastmod = lastModMap.get(pathname);
				if (lastmod) item.lastmod = lastmod;
				return item;
			},
		}),
		sitemapMirrors(),
	],
});
