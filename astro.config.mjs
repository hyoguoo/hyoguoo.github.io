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
					autogenerate: { directory: 'computer-architecture' },
				},
				{
					label: 'Operating System',
					autogenerate: { directory: 'operating-system' },
				},
				{
					label: 'Network',
					autogenerate: { directory: 'network' },
				},
				{
					label: 'Secure',
					autogenerate: { directory: 'secure' },
				},
				{
					label: 'Java',
					autogenerate: { directory: 'java' },
				},
				{
					label: 'Spring',
					autogenerate: { directory: 'spring' },
				},
				{
					label: 'OOP',
					autogenerate: { directory: 'oop' },
				},
				{
					label: 'MySQL',
					autogenerate: { directory: 'mysql' },
				},
				{
					label: 'Redis',
					autogenerate: { directory: 'redis' },
				},
				{
					label: 'Kafka',
					autogenerate: { directory: 'kafka' },
				},
				{
					label: 'Docker',
					autogenerate: { directory: 'docker' },
				},
				{
					label: 'Large-Scale System',
					autogenerate: { directory: 'large-scale-system' },
				},
				{
					label: 'Test',
					autogenerate: { directory: 'test' },
				},
				{
					label: 'AI-Assisted Development',
					autogenerate: { directory: 'ai-assisted-development' },
				},
				{
					label: 'Setting',
					autogenerate: { directory: 'setting' },
				},
			],
			components: {
				Footer: './src/components/Footer.astro',
			},
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
