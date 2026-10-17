import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const output = path.join(root, 'preview/onyul-preview.html');
const embedded = new Map();
const mimeTypes = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.js': 'text/javascript', '.css': 'text/css' };
const decodeAttribute = value => value.replaceAll('&amp;', '&').replaceAll('&#38;', '&').replaceAll('&#x26;', '&');
const escapeAttribute = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

async function embed(url) {
  url = decodeAttribute(url);
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  if (embedded.has(url)) return embedded.get(url);
  const filename = path.resolve(dist, `.${decodeURIComponent(new URL(url, 'https://preview.invalid').pathname)}`);
  if (!filename.startsWith(dist + path.sep)) throw new Error('Asset path escapes dist');
  const bytes = await readFile(filename);
  const data = `data:${mimeTypes[path.extname(filename)] || 'application/octet-stream'};base64,${bytes.toString('base64')}`;
  embedded.set(url, data);
  return data;
}

async function replaceAsync(text, pattern, callback) {
  const matches = [...text.matchAll(pattern)];
  const values = await Promise.all(matches.map(callback));
  let index = 0;
  return text.replace(pattern, () => values[index++]);
}

function offlineLink(href) {
  href = decodeAttribute(href);
  if (!href.startsWith('/') || href.startsWith('//')) return escapeAttribute(href);
  const url = new URL(href, 'https://preview.invalid');
  const query = new URLSearchParams([['page', url.pathname], ...url.searchParams]);
  return escapeAttribute(`?${query}${url.hash}`);
}

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? filesIn(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
}

const files = await filesIn(dist);
let css = (await Promise.all(files.filter(file => file.endsWith('.css')).sort().map(file => readFile(file, 'utf8')))).join('\n');
css = await replaceAsync(css, /url\((["']?)(\/[^)"']+)\1\)/g, async match => `url("${await embed(match[2])}")`);
const pages = {};
for (const file of files.filter(file => file.endsWith('.html')).sort()) {
  const relative = path.relative(dist, file).split(path.sep).join('/');
  const route = '/' + (relative.endsWith('index.html') ? relative.slice(0, -10) : relative);
  let html = (await readFile(file, 'utf8')).replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, '');
  html = await replaceAsync(html, /(<(?:img|script)\b[^>]*\bsrc=")(\/[^\"]+)(")/g, async match => match[1] + await embed(match[2]) + match[3]);
  html = await replaceAsync(html, /(<link\b[^>]*\bhref=")(\/[^\"]+)(")/g, async match => match[1] + await embed(match[2]) + match[3]);
  html = html.replace(/(<a\b[^>]*\bhref=")([^\"]+)(")/g, (_, before, href, after) => before + offlineLink(href) + after);
  pages[route] = html;
}
const licenses = (await Promise.all(['noto-sans-kr.txt', 'cormorant-garamond.txt'].map(name => readFile(path.join(dist, 'licenses', name), 'utf8')))).join('\n\n').replaceAll('--', '- -');
const payload = JSON.stringify({ css, pages }).replaceAll('<', '\\u003c');
const document = `<!doctype html>
<!-- Bundled font licenses: Noto Sans KR and Cormorant Garamond.\n${licenses}\n-->
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>온율 개인 홈페이지 미리보기</title><link rel="icon" href="data:,"></head><body><script>
const preview = ${payload};
const route = new URLSearchParams(location.search).get('page') || '/';
const chosen = preview.pages[route] || preview.pages['/404.html'];
document.open();
document.write(chosen.replace('</head>', '<style>' + preview.css + '</style></head>'));
document.close();
</script></body></html>`;
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, document);
console.log(`Exported ${Object.keys(pages).length} pages and ${embedded.size} embedded assets to preview/onyul-preview.html.`);
