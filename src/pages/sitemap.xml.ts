import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { projects } from '../data/projects';
export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection('insights');
  const paths = ['/', '/insights/', '/contact/', '/privacy/', ...projects.map(p=>`/projects/${p.slug}/`), ...posts.map(p=>`/insights/${p.id}/`)];
  const escape = (s:string) => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const urls = site ? paths.map(path=>`<url><loc>${escape(new URL(path,site).href)}</loc></url>`).join('') : '';
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
};
