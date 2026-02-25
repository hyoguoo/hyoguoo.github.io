// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';

// https://astro.build/config
export default defineConfig({
	site: 'https://hyoguoo.github.io',
	integrations: [
		starlight({
			title: "hyoguoo's notes",
			description: 'Backend Developer, Java & Spring',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/hyoguoo' },
			],
			head: [
				{
					tag: 'script',
					attrs: {
						src: 'https://www.googletagmanager.com/gtag/js?id=G-KBCBB0D7H8',
						async: true,
					},
				},
				{
					tag: 'script',
					content: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-KBCBB0D7H8');`,
				},
			],
			plugins: [
				starlightBlog({
					title: 'Blog',
					postCount: 5,
					recentPostCount: 10,
					authors: {
						hyoguoo: {
							name: 'hyoguoo',
							title: 'Backend Developer',
							url: 'https://github.com/hyoguoo',
						},
					},
				}),
			],
			sidebar: [
				{
					label: 'Computer Architecture',
					autogenerate: { directory: 'docs/computer-architecture' },
				},
				{
					label: 'Operating System',
					autogenerate: { directory: 'docs/operating-system' },
				},
				{
					label: 'Network',
					autogenerate: { directory: 'docs/network' },
				},
				{
					label: 'Secure',
					autogenerate: { directory: 'docs/secure' },
				},
				{
					label: 'Java',
					autogenerate: { directory: 'docs/java' },
				},
				{
					label: 'Spring',
					autogenerate: { directory: 'docs/spring' },
				},
				{
					label: 'OOP',
					autogenerate: { directory: 'docs/oop' },
				},
				{
					label: 'MySQL',
					autogenerate: { directory: 'docs/mysql' },
				},
				{
					label: 'Redis',
					autogenerate: { directory: 'docs/redis' },
				},
				{
					label: 'Kafka',
					autogenerate: { directory: 'docs/kafka' },
				},
				{
					label: 'Docker',
					autogenerate: { directory: 'docs/docker' },
				},
				{
					label: 'Large-Scale System',
					autogenerate: { directory: 'docs/large-scale-system' },
				},
				{
					label: 'Test',
					autogenerate: { directory: 'docs/test' },
				},
				{
					label: 'AI-Assisted Development',
					autogenerate: { directory: 'docs/ai-assisted-development' },
				},
				{
					label: 'Setting',
					autogenerate: { directory: 'docs/setting' },
				},
			],
			components: {
				Footer: './src/components/Footer.astro',
			},
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
