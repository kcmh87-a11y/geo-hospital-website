import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) => new Response(site
  ? `User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', site).href}\n`
  : 'User-agent: *\nDisallow: /\n# Set SITE_URL to your real HTTPS origin and rebuild before publishing.\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
