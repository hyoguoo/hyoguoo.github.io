import type { StarlightPlugin } from '@astrojs/starlight/types';

/** Compose after starlight-blog so its post renderer and routes stay registered. */
export function blogIndexPlugin(): StarlightPlugin {
  return {
    name: 'blog-index',
    hooks: {
      setup({ config, updateConfig }) {
        updateConfig({ components: { ...config.components, MarkdownContent: './src/components/MarkdownContent.astro' } });
      },
    },
  };
}
