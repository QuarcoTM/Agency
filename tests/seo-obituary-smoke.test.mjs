import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');

const categories = [
  {slug:'kovchezi',indexable:true},
  {slug:'urni',indexable:true},
  {slug:'ventsi-i-tsvetya',indexable:true},
  {slug:'krastove',indexable:true},
  {slug:'ritualni-prinadlezhnosti',indexable:true},
  {slug:'nekrolozi',indexable:false},
  {slug:'pametnitsi',indexable:false}
];

test('SEO: seven independent static pages have canonical titles and breadcrumbs', () => {
  const pageTitles = new Set();
  for(const c of categories){
    const page = read('traurni-stoki/'+c.slug+'/index.html');
    const url = 'https://deninosht.bg/traurni-stoki/'+c.slug+'/';
    const title = page.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title,'No title on '+c.slug);
    assert.ok(!pageTitles.has(title),'Duplicate title on '+c.slug);
    pageTitles.add(title);
    assert.match(page,new RegExp('data-category-slug="'+c.slug+'"'));
    assert.ok(page.includes('<link rel="canonical" href="'+url+'"/>'));
    assert.ok(page.includes('<meta property="og:url" content="'+url+'"/>'));
    assert.match(page,/<meta name="description" content="[^"]{40,}"/);
    assert.match(page,/<h1 id="category-page-title">[^<]{5,}<\/h1>/);
    assert.match(page,/<script type="application\/ld\+json">/);
    assert.match(page,/src="catalog\.js\?v=2\.21"/);
    assert.match(page,new RegExp('name="robots" content="'+(c.indexable?'index,follow':'noindex,follow')));
    assert.ok(page.includes('class="goods-catalog"'),'Live category catalog missing on '+c.slug);
  }
});

test('SEO: old query-based pages work but do not compete in search', () => {
  const legacy = read('kategoriya/index.html');
  const catalog = read('catalog.js');
  const landing = read('traurni-stoki/index.html');
  assert.match(legacy,/name="robots" content="noindex,follow"/);
  assert.match(catalog,/const dedicatedSlug = isCategoryPage \? \(document\.body\.dataset\.categorySlug/);
  assert.match(catalog,/setCategoryIndexability\(products\.length > 0\)/);
  assert.match(catalog,/setCategoryIndexability\(false\)/);
  assert.match(catalog,/setCategoryCanonical\(category\.slug\)/);
  assert.match(catalog,/const categoryPath = \(slug\)=>'\/traurni-stoki\/'/);
  assert.match(catalog,/const canIndex = isDedicatedCategoryPage && selectedSlug !== 'nekrolozi'/);
  assert.match(catalog,/meta\[property="og:url"\]/);
  assert.doesNotMatch(catalog,/\/kategoriya\/\?category=/);
  assert.match(landing,/<nav aria-label="Категории траурни стоки" class="goods-category-nav"><a href="\/traurni-stoki\/kovchezi\/"/);
});

test('Sitemap indexes only five nonempty, non-obituary product categories', () => {
  const sitemap = read('sitemap.xml');
  assert.doesNotMatch(sitemap, /<lastmod>/);
  for(const c of categories){
    const url='https://deninosht.bg/traurni-stoki/'+c.slug+'/';
    assert.equal(sitemap.includes('<loc>'+url+'</loc>'),c.indexable,c.slug);
  }
  assert.ok(sitemap.includes('<loc>https://deninosht.bg/</loc>'));
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
