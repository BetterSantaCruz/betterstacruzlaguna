#!/usr/bin/env node

/**
 * Generate a sitemap only after an intentional public domain is configured.
 * The local foundation deliberately does not emit a placeholder sitemap.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(
  fs.readFileSync(path.join(root, 'config', 'lgu.config.json'), 'utf8')
);
const baseUrl = String(config.portal?.baseUrl || '').replace(/\/$/, '');

if (!baseUrl) {
  console.log('Sitemap not generated: portal.baseUrl is not configured.');
  process.exit(0);
}

const routes = [
  '/',
  '/about',
  '/contact',
  '/accessibility',
  '/search',
  '/ideas',
  '/join-us',
  '/terms-of-service',
  '/sitemap',
  '/sources',
  '/services',
  '/government',
  '/contribute',
];

if (config.features?.transparency) routes.push('/transparency');
if (config.features?.statistics) routes.push('/statistics');
if (config.features?.tourism) routes.push('/tourism');
if (config.features?.weather) routes.push('/data/weather');
if (config.features?.forex) routes.push('/data/forex');

const escapeXml = value =>
  value.replace(
    /[<>&'\"]/g,
    character =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      })[character]
  );
const lastmod = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    route =>
      `  <url><loc>${escapeXml(`${baseUrl}${route}`)}</loc><lastmod>${lastmod}</lastmod></url>`
  )
  .join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(root, 'public', 'sitemap.xml'), xml);
console.log(`Generated sitemap with ${routes.length} route(s).`);
