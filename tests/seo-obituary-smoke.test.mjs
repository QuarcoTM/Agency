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

test('Obituary examples: anonymous and revertible independently', () => {
  const html = read('nekrolozi/index.html');
  const js = read('obituary-examples.js');
  const css = read('obituary-examples.css');
  const block = html.split('<!-- Изолиран блок:')[1]?.split('<!-- Край на изолирания блок -->')[0];
  assert.ok(block, 'Missing isolated sample block');
  assert.equal((block.match(/class="obex-card obex-card--/g) || []).length, 3);
  assert.equal((block.match(/ИМЕ И ФАМИЛИЯ/g) || []).length, 3);
  assert.ok(block.includes('id="obituary-examples"'));
  assert.ok(block.includes(' hidden>'));
  assert.ok(html.includes('obituary-examples.css?v=1'));
  assert.ok(html.includes('obituary-examples.js?v=1'));
  assert.match(js, /const ENABLE_OBITUARY_EXAMPLES = true;/);
  assert.match(js, /if \(!ENABLE_OBITUARY_EXAMPLES\) return;/);
  assert.match(css, /\.obituary-examples\[hidden\]\{display:none!important\}/);
  for (const name of ['Иван Иванов', 'Мария Петрова', 'Георги Георгиев']) {
    assert.ok(!block.includes(name), 'No real-looking names in previews');
  }
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
