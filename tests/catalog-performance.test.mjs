import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const cats=['kovchezi','urni','ventsi-i-tsvetya','krastove','ritualni-prinadlezhnosti','nekrolozi','pametnitsi'];

test('responsive catalog uses static WebP variants for existing photos, safe fallback for new photos',()=>{
  const js=read('catalog.js');
  assert.match(js,/window\.DENINOSHT_CATALOG_IMAGES/);
  assert.match(js,/img\.srcset = versions\.small/);
  assert.match(js,/img\.src = product\.image_url/);
  assert.match(js,/img\.loading = first \? 'eager' : 'lazy'/);
  assert.match(js,/img\.fetchPriority = first \? 'high' : 'low'/);
  assert.match(js,/img\.width = 960/);
  assert.match(js,/img\.height = 960/);
  assert.match(js,/renderLoadingSkeleton\(\)/);
  assert.match(read('styles.css'),/\.catalog-skeleton-grid/);
});

test('all catalog routes load one common thumbnails manifest before catalog script',()=>{
  for(const p of ['traurni-stoki/index.html','kategoriya/index.html',...cats.map(s=>'traurni-stoki/'+s+'/index.html')]){
    const html=read(p);
    const first=html.indexOf('src="/catalog-thumbnails.js?v=2.21"');
    const next=html.indexOf('src="catalog.js?v=2.21"');
    assert.ok(first>0 && next>first,p+' manifest missing/order wrong');
    assert.ok(html.includes('styles.css?v=2.21'),p+' CSS not cache-busted');
  }
});

test('new admin uploads are automatically WebP and bounded without paid image API',()=>{
  const admin=read('admin/admin.js');
  assert.match(admin,/const maxSide = 1100/);
  assert.match(admin,/canvasBlob\(canvas, 'image\/webp', 0\.78\)/);
  assert.match(admin,/320 \* 1024/);
  assert.match(admin,/const optimized = await optimizeImage\(file\)/);
  assert.ok(read('admin/index.html').includes('admin.js?v=2.25'));
});

test('static thumbnail manifest contains real image pairs and excludes obituaries',()=>{
  const manifestPath=path.join(new URL(root).pathname,'catalog-thumbnails.js');
  assert.ok(fs.existsSync(manifestPath),'Catalog preview build was not run');
  const match=read('catalog-thumbnails.js').match(/window\.DENINOSHT_CATALOG_IMAGES = (\{[^\n]+\});/);
  assert.ok(match,'Manifest JSON missing');
  const manifest=JSON.parse(match[1]);
  assert.equal(Object.keys(manifest).length,55,'Expected 55 real publicly indexable product photos');
  for(const [source, variants] of Object.entries(manifest)){
    assert.match(source,/^https:\/\/beflewauiyexpmvcxjat\.supabase\.co\/storage\/v1\/object\/public\/product-images\/products\//);
    assert.ok(!source.includes('nekrolog'));
    for(const key of ['small','large']){
      assert.match(variants[key],/^\/assets\/catalog-thumbnails\/[0-9a-f]{18}-(480|960)\.webp$/);
      const file=path.join(new URL(root).pathname,variants[key].slice(1));
      assert.ok(fs.existsSync(file),'Missing image '+variants[key]);
      assert.ok(fs.statSync(file).size>300,'Empty image '+file);
    }
  }
});

test('catalog categories keep loading message out of layout and preload their first optimized image',()=>{
  const categorySlugs=['kovchezi','urni','ventsi-i-tsvetya','krastove','ritualni-prinadlezhnosti'];
  const pages=['traurni-stoki/index.html','kategoriya/index.html',...['nekrolozi','pametnitsi',...categorySlugs].map(s=>'traurni-stoki/'+s+'/index.html')];
  const manifest=JSON.parse(read('catalog-thumbnails.js').match(/window\.DENINOSHT_CATALOG_IMAGES = (\{[^\n]+\});/)[1]);
  const allPaths=new Set(Object.values(manifest).flatMap(x=>[x.small,x.large]));
  for(const p of pages){
    const html=read(p);
    assert.ok(html.includes('class="goods-catalog-status" role="status" aria-live="polite" hidden'),p+' initial status would shift content');
    assert.ok(!html.includes('>Зареждане на каталога…</div>'),p+' old loading banner still present');
    const preconnects=html.split('\n').filter(x=>x.includes('beflewauiyexpmvcxjat.supabase.co')&&x.includes('rel="preconnect"'));
    assert.equal(preconnects.length,1,p+' needs exactly one preconnect');
    if(categorySlugs.some(slug=>p==='traurni-stoki/'+slug+'/index.html')){
      const src=html.match(/<link rel="preload" as="image" href="([^"]+)"/)?.[1];
      assert.ok(src && allPaths.has(src),p+' missing valid preloaded existing WebP');
      assert.match(html,/imagesrcset="[^"]+480w, [^"]+960w"/);
      assert.match(html,/fetchpriority="high"/);
    }
  }
});
