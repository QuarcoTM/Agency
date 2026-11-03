import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('SEO: category pages can be indexed only with published products', () => {
  const page = read('kategoriya/index.html');
  const catalog = read('catalog.js');
  assert.match(page, /name="robots" content="index,follow/);
  assert.doesNotMatch(page, /noindex,follow,noarchive/);
  assert.match(catalog, /setCategoryIndexability\(products\.length > 0\)/);
  assert.match(catalog, /setCategoryIndexability\(false\)/);
  assert.match(catalog, /setCategoryCanonical\(category\.slug\)/);
  assert.match(catalog, /https:\/\/deninosht\.bg\/kategoriya\/\?category=/);
  assert.match(catalog, /meta\[property="og:url"\]/);
});

test('Obituary page: inaccurate demo gallery and white background are absent', () => {
  const html = read('nekrolozi/index.html');
  assert.ok(html.includes('<h1>Некролози в Кюстендил</h1>'));
  assert.doesNotMatch(html, /obituary-examples|obex-card|obex-paper/);
  assert.doesNotMatch(html, /obituary-examples\.css|obituary-examples\.js/);
});

test('Analytics: new and old contact URLs are both counted in SQL', () => {
  for (const file of ['supabase-analytics-v1.52.sql','supabase-analytics-contact-path-fix.sql']) {
    const content=read(file);
    assert.match(content, /page_path in \('\/kontakti\/', '\/kontakti\.html'\)/);
  }
});

test('Sitemap: no outdated unverified last modification dates', () => {
  const sitemap=read('sitemap.xml');
  assert.doesNotMatch(sitemap, /<lastmod>/);
  assert.ok(sitemap.includes('<loc>https://deninosht.bg/</loc>'));
});
