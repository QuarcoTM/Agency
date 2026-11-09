import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = path => fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const admin=read('admin/admin.js');
const helperStart=admin.indexOf('  function getUpcomingBookletZadushnitsi(');
const helperEnd=admin.indexOf('  // Add dates only on request.',helperStart);

test('Booklet auto-fill skips Archangel Zadushnitsa 7 Nov 2026 after 9 Nov 2026',()=>{
  assert.ok(helperStart>0&&helperEnd>helperStart,'Upcoming helper missing');
  assert.match(admin,/getUpcomingBookletZadushnitsi\(calendar,death,new Date\(\)\)/);
  const helper=admin.slice(helperStart,helperEnd).trim();
  const window={};
  vm.runInNewContext(read('admin/memorial-zadushnitsi.js'),{window,Date});
  const bookletDateValue=(d)=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const addBookletMonths=(date,months)=>{
    const m=date.getMonth()+months,y=date.getFullYear()+Math.floor(m/12),month=((m%12)+12)%12;
    return new Date(y,month,Math.min(date.getDate(),new Date(y,month+1,0,12).getDate()),12);
  };
  const upcoming=vm.runInNewContext('('+helper+')',{Date,bookletDateValue,addBookletMonths});
  const dates=(death,now)=>Array.from(upcoming(window.DenINoshtZadushnitsi,new Date(death+'T12:00:00'),new Date(now+'T09:30:00')),e=>e.date);
  assert.deepEqual(dates('2026-10-28','2026-11-09'),['2027-03-06','2027-06-19']);
  assert.deepEqual(dates('2026-10-28','2026-11-07'),['2026-11-07','2027-03-06','2027-06-19']);
  assert.deepEqual(dates('2026-10-28','2027-08-01'),[]);
  assert.deepEqual(dates('2026-11-09','2026-11-09'),['2027-03-06','2027-06-19','2027-11-06']);
});

test('Manual rows remain untouched, one-year limit and PDF format retained',()=>{
  assert.match(admin,/const fromDate = death > today \? death : today/);
  assert.match(admin,/if\(fromDate > untilDate\) return \[\]/);
  assert.match(admin,/const untilDate = addBookletMonths\(death,12\)/);
  assert.match(admin,/const present=new Set\(Array\.from\(bookletZadushnitsiList\.querySelectorAll/);
  assert.match(admin,/if\(present\.has\(event\.date\)\)return/);
  assert.doesNotMatch(admin,/remove\(\).*getUpcomingBookletZadushnitsi/);
  assert.match(admin,/Минали дати не се добавят автоматично/);
  assert.match(read('admin/index.html'),/admin\.js\?v=2\.25/);
  assert.match(admin,/async function createBookletPdf\(/);
});
