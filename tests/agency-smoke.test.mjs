import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (path) => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Automatic Zadushnitsi match the known 2026 and 2027 dates', () => {
  const window = {};
  vm.runInNewContext(read('admin/memorial-zadushnitsi.js'), {window, Date});
  const get = window.DenINoshtZadushnitsi.between;
  const rows = get('2026-01-01', '2027-12-31');
  assert.deepEqual(Array.from(rows, row => [row.name,row.date]), [
    ['Месопустна задушница','2026-02-14'],
    ['Черешова задушница','2026-05-30'],
    ['Архангелова задушница','2026-11-07'],
    ['Месопустна задушница','2027-03-06'],
    ['Черешова задушница','2027-06-19'],
    ['Архангелова задушница','2027-11-06']
  ]);
  assert.deepEqual(Array.from(get('2026-10-28','2027-10-28'), r=>r.date),
    ['2026-11-07','2027-03-06','2027-06-19']);
  assert.equal(get('2026-02-30','2027-10-28').length, 0);
});

test('Public calculator includes eight periods and exports one complete ICS file', async () => {
  const hooks = {}, output = {blob:null, filename:''};
  const form = {addEventListener(type,fn){hooks['form:'+type]=fn;}};
  const input = {value:'2026-10-28'};
  const results = {
    innerHTML:'',hidden:true,
    getBoundingClientRect(){return {top:200};},
    addEventListener(type,fn){hooks['results:'+type]=fn;}
  };
  const error = {textContent:''};
  const document = {
    readyState:'complete',
    querySelector(selector){
      return ({
        '[data-pomen-calculator]':form,
        '[data-death-date]':input,
        '[data-pomen-results]':results,
        '[data-pomen-error]':error
      })[selector] ?? null;
    },
    createElement(){return {
      set href(v){this._href=v;}, set download(v){output.filename=v;},
      click(){},remove(){}
    };},
    body:{appendChild(){}}
  };
  const URL = {createObjectURL(blob){output.blob=blob;return 'blob:calendar';},revokeObjectURL(){}};
  const window = {scrollY:0,scrollTo(){}};
  vm.runInNewContext(read('kalkulator-pomeni.js'),{
    document,window,URL,Blob,Date,setTimeout(){},console
  });
  hooks['form:submit']({preventDefault(){}});
  assert.equal(results.hidden,false);
  for (const period of ['3-ти ден','9-ти ден','20-ти ден','40-ти ден','3 месеца','6 месеца','9 месеца','1 година'])
    assert.ok(results.innerHTML.includes(period), 'Missing '+period);
  assert.equal((results.innerHTML.match(/class="pomen-result-card"/g) || []).length,8);
  assert.ok(results.innerHTML.includes('Добави всички дати в календара'));
  hooks['results:click']({target:{closest(){return {hasAttribute(attr){return attr==='data-pomen-all';}};}}});
  assert.equal(output.filename,'vsichki-dati-za-pomen.ics');
  const ics=await output.blob.text();
  assert.equal((ics.match(/BEGIN:VEVENT/g)||[]).length,8);
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261116')); // 20th day, counting death as day one
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20270128')); // 3 months
});

test('Booklet print implementation remains present and independent of auto-fill',()=>{
  const code=read('admin/admin.js'),html=read('admin/index.html');
  assert.ok(code.includes('function autoAddBookletZadushnitsi()'));
  assert.ok(code.includes('async function createBookletPdf('));
  assert.ok(code.includes('async function renderBookletPageCanvas('));
  assert.ok(code.includes('const MANUAL_BOOKLET_STAGES='));
  assert.ok(html.includes('id="booklet-auto-zadushnitsi"'));
  assert.ok(html.includes('src="memorial-zadushnitsi.js?v=1.99"'));
  assert.ok(code.indexOf('function addZadushnitsaRow(') < code.indexOf('function autoAddBookletZadushnitsi('));
});

test('Public memorial explanatory cards and FAQ match the eight calculated stages',()=>{
  const html=read('kalkulator-pomeni/index.html');
  const section=html.split('<section class="pomen-seo-content">')[1]?.split('<section class="related-services')[0];
  assert.ok(section,'Missing explanatory section');
  const names=Array.from(section.matchAll(/<article><h3>([^<]+)<\/h3>/g),m=>m[1]);
  assert.deepEqual(names,['3-ти ден','9-ти ден','20-ти ден','40-ти ден','3 месеца','6 месеца','9 месеца','1 година']);
  assert.equal((section.match(/<section\b/g)||[]).length,1);
  assert.equal((section.match(/<\/section>/g)||[]).length,3);
  assert.ok(section.includes('Как се изчисляват 9 и 20 дни'));
  assert.ok(section.includes('Как се изчисляват 3, 6 и 9 месеца'));
  const ldJson=Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),m=>JSON.parse(m[1]));
  const faq=ldJson.find(v=>v['@type']==='FAQPage');
  assert.ok(faq,'Missing FAQPage structured data');
  assert.deepEqual(faq.mainEntity.map(q=>q.name),[
    'Брои ли се денят на смъртта при изчисляването на 40 дни?',
    'Как се изчисляват 9 и 20 дни след смъртта?',
    'Как се изчисляват 3, 6 и 9 месеца?'
  ]);
});

test('Seasonal header has one compact strip, two services and clean rollback',()=>{
  const html=read('index.html'), css=read('seasonal-header.css'), js=read('seasonal-header.js');
  const begin=html.indexOf('<!-- Начало на самостоятелния сезонен блок:');
  const end=html.indexOf('<!-- Край на самостоятелния сезонен блок -->');
  assert.ok(begin>0 && end>begin);
  const content=html.slice(begin,end);
  assert.equal((content.match(/<aside\b/g)||[]).length,1);
  assert.equal((content.match(/class="home-seasonal-action"/g)||[]).length,2);
  assert.equal((content.match(/class="home-seasonal-banner"/g)||[]).length,1);
  assert.ok(content.includes('href="/zadushnitsi/"'));
  assert.ok(content.includes('href="/pochistvane-poddrazhka-grobni-mesta/"'));
  assert.ok(content.includes('href="/pomeni/"'));
  assert.ok(content.includes('data-seasonal-name'));
  assert.ok(content.includes('data-seasonal-date'));
  assert.ok(html.includes('seasonal-header.css?v=2.0'));
  assert.ok(html.includes('seasonal-header.js?v=2.0'));
  assert.ok(css.includes('grid-template-columns:minmax(0,1fr)'));
  assert.ok(css.includes('grid-template-areas:"seasonal-logo seasonal-menu" "seasonal-strip seasonal-strip"'));
  assert.ok(css.includes('max-width:100%'));
  assert.ok(js.includes('const SEASONAL_BANNER_ENABLED = true'));
  assert.ok(js.includes('promo=off'));
  assert.ok(js.includes("header.classList.add('home-seasonal-active')"));
  // Styles must be opt-in; the hidden placeholder has no impact on the legacy header.
  const selectors=css.split('}').map(rule=>rule.split('{')[0]).filter(rule=>rule.includes('.header-inner')||rule.includes('.nav'));
  assert.ok(selectors.every(rule=>rule.includes('home-seasonal-active')));
});
