import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { isBlogArchive } from './lib/blog';

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  if (isBlogArchive(context.url.pathname)) {
    route.hasSidebar = false;
    route.toc = undefined;
    route.entry.data.pagefind = context.url.pathname === '/blog/';
  }
  if ((route.entry.id === 'docs' || route.entry.id.startsWith('docs/')) && route.entry.id.split('/').length <= 2) route.toc = undefined;
});
