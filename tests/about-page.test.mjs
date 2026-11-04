import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const bytes=p=>fs.readFileSync(new URL('../'+p,import.meta.url));

test('About page uses the real agency, verified founding date, and actual photos',()=>{
  const html=read('za-nas/index.html');
  assert.match(html,/<main id="main-content" class="about-v2">/);
  assert.match(html,/03\.02\.2017 г\./);
  assert.match(html,/3 февруари 2017 г\./);
  assert.match(html,/href="\/assets\/about\/about\.css\?v=2"/);
  assert.match(html,/href="tel:\+359893646668"/);
  for(const name of ['agency-entrance','agency-showroom','agency-storefront']){
    const uri='/assets/about/'+name+'.avif';
    assert.ok(html.includes(uri),'Photo not used: '+uri);
    const b=bytes(uri.slice(1));
    assert.ok(b.length>5000, 'Real photographic asset too small: '+name);
    assert.equal(b.toString('ascii',4,12).startsWith('ftypavif'),true,'Not an AVIF image: '+name);
  }
  assert.ok(!html.includes('placeholder.com'));
});

test('About visuals are scoped and do not interfere with shared site styles',()=>{
  const css=read('assets/about/about.css');
  assert.match(css,/\.about-v2-hero-grid/);
  assert.match(css,/@media\(max-width:640px\)/);
  assert.match(css,/\.about-v2-gallery/);
  assert.ok(css.split(/\n/).filter(s=>s.includes('{')).every(s=>s.startsWith('.about-v2')||s.startsWith('@media')||s.startsWith('}')||s.startsWith('/*')||s.startsWith('  ')||s.startsWith('(')),'Unexpected non-scoped style');
  const html=read('za-nas/index.html');
  assert.match(html,/<link rel="canonical" href="https:\/\/deninosht\.bg\/za-nas\/"/);
  assert.match(html,/src="script\.js\?v=1\.52"/);
  assert.match(html,/src="analytics\.js\?v=1\.70"/);
});
