(() => {
  'use strict';
  const months=['януари','февруари','март','април','май','юни','юли','август','септември','октомври','ноември','декември'];
  const weekdays=['неделя','понеделник','вторник','сряда','четвъртък','петък','събота'];
  const mk=(y,m,d)=>new Date(Date.UTC(y,m,d));
  const addDays=(d,n)=>{const x=mk(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());x.setUTCDate(x.getUTCDate()+n);return x;};
  const addMonths=(d,n)=>{const base=mk(d.getUTCFullYear(),d.getUTCMonth()+n,1), y=base.getUTCFullYear(), m=base.getUTCMonth(), last=mk(y,m+1,0).getUTCDate();return mk(y,m,Math.min(d.getUTCDate(),last));};
  const addYears=(d,n)=>{const y=d.getUTCFullYear()+n,m=d.getUTCMonth(),last=mk(y,m+1,0).getUTCDate();return mk(y,m,Math.min(d.getUTCDate(),last));};
  const parse=v=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return null;const [y,m,d]=v.split('-').map(Number),x=mk(y,m-1,d);return x.getUTCFullYear()===y&&x.getUTCMonth()===m-1&&x.getUTCDate()===d?x:null;};
  const fmt=d=>`${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} г.`;
  const ymd=d=>`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
  const icsDate=d=>ymd(d).replace(/-/g,'');
  const esc=s=>String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const calc=d=>[
    {key:'3-den',label:'3-ти ден',date:addDays(d,2),note:'Денят на смъртта се брои за първи ден.'},
    {key:'9-den',label:'9-ти ден',date:addDays(d,8),note:'Денят на смъртта се брои за първи ден.'},
    {key:'40-den',label:'40-ти ден',date:addDays(d,39),note:'Денят на смъртта се брои за първи ден.'},
    {key:'6-meseca',label:'6 месеца',date:addMonths(d,6),note:'Шест календарни месеца от датата на смъртта.'},
    {key:'9-meseca',label:'9 месеца',date:addMonths(d,9),note:'Девет календарни месеца от датата на смъртта.'},
    {key:'1-godina',label:'1 година',date:addYears(d,1),note:'Една календарна година от датата на смъртта.'}
  ];
  function download(item){
    const next=addDays(item.date,1), stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    const body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Den i Nosht//Pomen//BG','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',`UID:${item.key}-${ymd(item.date)}@deninosht.bg`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${icsDate(item.date)}`,`DTEND;VALUE=DATE:${icsDate(next)}`,`SUMMARY:${esc('Помен – '+item.label)}`,`DESCRIPTION:${esc('Дата за помен. deninosht.bg')}`,'TRANSP:TRANSPARENT','END:VEVENT','END:VCALENDAR'].join('\r\n');
    const blob=new Blob([body],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`pomen-${item.key}-${ymd(item.date)}.ics`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function render(items,death,target){
    target.innerHTML=`<div class="pomen-results-head"><div class="eyebrow">Изчислени дати</div><h2>Дати за помен при смърт на ${fmt(death)}</h2></div><div class="pomen-results-grid">${items.map(i=>`<article class="pomen-result-card"><div class="pomen-result-label">${i.label}</div><div class="pomen-result-date">${fmt(i.date)}</div><div class="pomen-result-weekday">${weekdays[i.date.getUTCDay()]}</div><p>${i.note}</p><button class="pomen-calendar-button" type="button" data-key="${i.key}" data-date="${ymd(i.date)}">Добави в календара</button></article>`).join('')}</div><p class="pomen-result-footnote">За организация на панихида или помен можете да се свържете с траурна агенция „Ден и Нощ“.</p>`;
  }
  function init(){
    const form=document.querySelector('[data-pomen-calculator]'),input=document.querySelector('[data-death-date]'),results=document.querySelector('[data-pomen-results]'),error=document.querySelector('[data-pomen-error]');if(!form||!input||!results||!error)return;let items=[];
    form.addEventListener('submit',e=>{e.preventDefault();const death=parse(input.value);if(!death){error.textContent='Изберете валидна дата.';results.hidden=true;return;}error.textContent='';items=calc(death);render(items,death,results);results.hidden=false;const y=results.getBoundingClientRect().top+window.scrollY-110;window.scrollTo({top:y,behavior:'smooth'});});
    results.addEventListener('click',e=>{const b=e.target.closest('.pomen-calendar-button');if(!b)return;const item=items.find(i=>i.key===b.dataset.key&&ymd(i.date)===b.dataset.date);if(item)download(item);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
