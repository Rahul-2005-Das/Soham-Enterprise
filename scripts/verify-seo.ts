import 'dotenv/config';
import { renderSeoHtml, renderSitemap } from '../lib/seo';
import { readFile } from 'fs/promises';
import path from 'path';

async function testSeo() {
  const template = await readFile(path.join(process.cwd(), 'index.html'), 'utf8');
  const mockReq = {
    get: (header: string) => header === 'host' ? 'sohomenterprises.com' : undefined,
    protocol: 'https',
    path: '/',
    url: '/',
  } as any;

  const html = await renderSeoHtml(template, mockReq);

  const checks = [
    { name: 'Has Title Tag', pass: html.includes('<title>') && html.includes('Soham Enterprises') },
    { name: 'Has Meta Description', pass: html.includes('<meta name="description"') },
    { name: 'Has Canonical Link', pass: html.includes('<link rel="canonical" href="https://sohomenterprises.com/"') },
    { name: 'Has OpenGraph Tags', pass: html.includes('<meta property="og:title"') && html.includes('<meta property="og:type"') },
    { name: 'Has Twitter Tags', pass: html.includes('<meta name="twitter:title"') },
    { name: 'Has Schema.org JSON-LD', pass: html.includes('<script type="application/ld+json">') && html.includes('HomeAndConstructionBusiness') },
    { name: 'No [object Object] artifacts', pass: !html.includes('[object Object]') },
  ];

  console.log('--- SEO HTML Render Verification ---');
  let allPass = true;
  for (const c of checks) {
    console.log(`${c.pass ? '✓' : '✗'} ${c.name}`);
    if (!c.pass) allPass = false;
  }

  // Test Sitemap
  const sitemap = await renderSitemap(mockReq);
  const sitemapPass = sitemap.startsWith('<?xml') && sitemap.includes('<urlset') && sitemap.includes('https://sohomenterprises.com/');
  console.log(`${sitemapPass ? '✓' : '✗'} Sitemap XML generation`);

  if (!allPass || !sitemapPass) {
    throw new Error('SEO verification failed.');
  }
}

testSeo().catch((err) => {
  console.error(err);
  process.exit(1);
});
