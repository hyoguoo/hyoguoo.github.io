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
					// Synchronous: detect blog pages and remove sidebar data attribute before render
					tag: 'script',
					content: `(function(){if(window.location.pathname.startsWith('/blog')){document.documentElement.setAttribute('data-no-sidebar','');document.documentElement.removeAttribute('data-has-sidebar');}})();`,
				},
				{
					tag: 'script',
					attrs: { type: 'module' },
					content: [
						`import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';`,
						`mermaid.initialize({ startOnLoad: false, theme: document.documentElement.dataset.theme === 'light' ? 'default' : 'dark' });`,
						`async function renderMermaid() {`,
						`  const blocks = document.querySelectorAll('pre[data-language="mermaid"] code');`,
						`  if (!blocks.length) return;`,
						`  for (const code of blocks) {`,
						`    const ecLines = code.querySelectorAll('.ec-line');`,
						`    const source = ecLines.length > 0`,
						`      ? Array.from(ecLines).map(l => (l.textContent || '').replace(/\\n$/, '')).join('\\n').trim()`,
						`      : (code.textContent || '').trim();`,
						`    if (!source) continue;`,
						`    const wrapper = document.createElement('div');`,
						`    wrapper.className = 'mermaid-diagram not-content';`,
						`    wrapper.style.cssText = 'overflow-x:auto;padding:1rem;text-align:center;';`,
						`    try {`,
						`      const { svg } = await mermaid.render('mermaid-' + Math.random().toString(36).slice(2), source);`,
						`      wrapper.innerHTML = svg;`,
						`      const pre = code.closest('pre');`,
						`      const expressive = pre && pre.closest('.expressive-code');`,
						`      if (expressive) {`,
						`        expressive.querySelectorAll('link[rel="stylesheet"], script[src]').forEach(el => document.head.appendChild(el));`,
						`      }`,
						`      (expressive || pre).replaceWith(wrapper);`,
						`    } catch (e) { console.error('Mermaid render error:', e); }`,
						`  }`,
						`}`,
						`renderMermaid();`,
					].join('\n'),
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
				Pagination: './src/components/Pagination.astro',
				SocialIcons: './src/components/SocialIcons.astro',
				ThemeSelect: './src/components/ThemeSelect.astro',
				SiteTitle: './src/components/SiteTitle.astro',
			},
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
