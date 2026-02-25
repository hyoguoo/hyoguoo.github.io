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
				{
					tag: 'script',
					attrs: { type: 'module' },
					content: `
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
mermaid.initialize({ startOnLoad: false, theme: document.documentElement.dataset.theme === 'light' ? 'default' : 'dark' });
async function renderMermaid() {
  const blocks = document.querySelectorAll('pre[data-language="mermaid"] code');
  if (!blocks.length) return;
  for (const code of blocks) {
    const source = code.textContent ?? '';
    const wrapper = document.createElement('div');
    wrapper.className = 'mermaid-diagram not-content';
    try {
      const { svg } = await mermaid.render('mermaid-' + Math.random().toString(36).slice(2), source);
      wrapper.innerHTML = svg;
      const pre = code.closest('pre');
      const expressive = pre?.closest('.expressive-code');
      (expressive ?? pre)?.replaceWith(wrapper);
    } catch (e) {
      console.error('Mermaid render error:', e);
    }
  }
}
document.addEventListener('DOMContentLoaded', renderMermaid);
`,
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
				Sidebar: './src/components/Sidebar.astro',
				PageTitle: './src/components/PageTitle.astro',
			},
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
