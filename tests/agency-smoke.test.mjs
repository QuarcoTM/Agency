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
