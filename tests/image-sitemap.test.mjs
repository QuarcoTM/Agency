import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../'+path, import.meta.url), 'utf8');
const indexedSlugs = ['kovchezi','urni','ventsi-i-tsvetya','krastove','ritualni-prinadlezhnosti'];

test('Image sitemap includes active real catalog photographs and excludes obituary examples', () => {
  const xml = read('image-sitemap.xml');
  assert.match(xml,/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml,/<urlset [^>]*xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/);
  assert.equal((xml.match(/<url>/g) || []).length, 6);
  const images = [...xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(m=>m[1]);
  assert.ok(images.length >= 55, 'Expected public catalog images and homepage assets');
  assert.equal(new Set(images).size, images.length, 'Duplicate image URLs');
  assert.ok(images.every(src=>src.startsWith('https://') && !src.includes('<')));
  for (const slug of indexedSlugs) {
    assert.ok(xml.includes('<loc>https://deninosht.bg/traurni-stoki/'+slug+'/</loc>'),slug);
  }
  for (const slug of ['nekrolozi','pametnitsi']) {
    assert.ok(!xml.includes('<loc>https://deninosht.bg/traurni-stoki/'+slug+'/</loc>'));
  }
  assert.doesNotMatch(xml,/\/products\/[^\s<]*nekrolog/i);
  assert.match(read('robots.txt'),/Sitemap: https:\/\/deninosht\.bg\/image-sitemap\.xml/);
});

test('Catalog image alt text derives from actual product name', () => {
  const js = read('catalog.js');
  assert.match(js,/img\.alt = product\.name \|\| 'Траурна стока'/);
  assert.match(js,/img\.src = product\.image_url/);
});
