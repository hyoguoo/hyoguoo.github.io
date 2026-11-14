import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

export const onRequest = defineRouteMiddleware((context) => {
  if (context.url.pathname === '/blog/') {
    context.locals.starlightRoute.hasSidebar = false;
    context.locals.starlightRoute.entry.data.pagefind = true;
  }
});
