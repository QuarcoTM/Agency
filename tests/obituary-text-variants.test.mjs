import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const script=read('admin/admin.js');
const html=read('admin/index.html');

test('nine photo-derived obituary messages are available, without the duplicate photo',()=>{
  const begin=script.indexOf('const OBITUARY_TEXT_VARIANTS = ');
  const end=script.indexOf('\n\n  function initializeObituaryTextVariants',begin);
  assert.ok(begin>0 && end>begin,'Obituary variants declaration missing');
  const section=script.slice(begin,end);
  const ids=[...section.matchAll(/"id": "(photo-\d+)"/g)].map(m=>m[1]);
  assert.deepEqual(ids,['photo-7603','photo-7604','photo-7605','photo-7606','photo-7607','photo-7608','photo-7609','photo-7611','photo-7612']);
  assert.ok(!section.includes('photo-7610'),'Duplicate should not appear');
  for(const text of ['С невероятните си доброта и човечност,','Да бъде тих и спокоен вечният ти сън!','Защо в живота все така се случва','Добрите хора не умират','Ако можем с думи да те върнем,','Неусетно дните минават.','Когато си отиде, не попита','До твоя гроб утъпкана пътека води','Винаги ще си с нас.']){
    assert.ok(section.includes(text),'Missing source text: '+text);
  }
  assert.doesNotMatch(section,/(?:Иван|Йоакимов|Христова|Димитров|Черкезки|Нора|Цветан|Траурен парк)/i,'No names or personal data from photos');
});

test('Explicit insert updates only the editable obituary text and schedules preview',()=>{
  assert.match(html,/id="obituary-text-variant"/);
  assert.match(html,/id="obituary-text-variant-insert"/);
  assert.match(html,/id="obituary-extra-text"/);
  assert.match(script,/function initializeObituaryTextVariants\(\)/);
  assert.match(script,/const target=\$\('obituary-extra-text'\)/);
  assert.match(script,/target\.value=variant\.text/);
  assert.match(script,/scheduleObituaryPreview\(\)/);
  assert.match(script,/initializeObituaryTextVariants\(\);\s+if\(obituaryType\)/);
  assert.match(html,/admin\.js\?v=2\.23/);
  assert.match(script,/async function downloadObituaryPdf\(/);
  assert.match(script,/function renderObituaryPreview\(/);
});

test('Photo verses stay separate from pre-existing obituary type presets and names',()=>{
  const form=html.slice(html.indexOf('id="obituary-text-heading"'),html.indexOf('id="obituary-ceremony-heading"'));
  assert.ok(form.includes('Текст под името'));
  assert.ok(form.includes('Готови варианти'));
  assert.ok(form.includes('textarea id="obituary-extra-text"'));
  const preset=script.slice(script.indexOf('const OBITUARY_PRESETS ='),script.indexOf('const OBITUARY_TEXT_VARIANTS ='));
  assert.match(preset,/day40:/);
  assert.match(preset,/year1:/);
  assert.ok(!preset.includes('photo-7603'),'Existing type preset untouched');
});
