/* Ден и Нощ — изолиран сезонен блок в началния хедър.
   За връщане към стария изглед сменете само true на false. */
(() => {
  'use strict';
  const SEASONAL_BANNER_ENABLED = true; // Бързо и безопасно изключване без други промени.
  if (!SEASONAL_BANNER_ENABLED) return;

  const DAY_MS = 86400000;
  const makeDate = (y,m,d) => new Date(Date.UTC(y,m,d));
  const addDays = (date,days) => new Date(date.getTime()+days*DAY_MS);
  function orthodoxEaster(year){
    const a=year%4, b=year%7, c=year%19;
    const d=(19*c+15)%30, e=(2*a+4*b-d+34)%7;
    const month=Math.floor((d+e+114)/31), day=(d+e+114)%31+1;
    const shift=Math.floor(year/100)-Math.floor(year/400)-2;
    return addDays(makeDate(year,month-1,day),shift);
  }
  function precedingSaturday(year){
    const nov8=makeDate(year,10,8);
    const day=nov8.getUTCDay();
    return addDays(nov8,day===6?-7:-((day+1)%7));
  }
  function memorialDates(year){
    const easter=orthodoxEaster(year);
    return [
      {name:'Месопустна задушница',date:addDays(easter,-57)},
      {name:'Черешова задушница',date:addDays(easter,48)},
      {name:'Архангелова задушница',date:precedingSaturday(year)}
    ];
  }
  function bulgarianToday(){
    // Local calendar date of Bulgaria, including if visitor is abroad.
    try{
      const parts = new Intl.DateTimeFormat('en-GB',{
        timeZone:'Europe/Sofia',year:'numeric',month:'2-digit',day:'2-digit'
      }).formatToParts(new Date());
      const fields={};
      parts.forEach(part=>{if(part.type!=='literal') fields[part.type]=Number(part.value);});
      if(fields.year&&fields.month&&fields.day)return makeDate(fields.year,fields.month-1,fields.day);
    }catch(_){}
    const now=new Date();
    return makeDate(now.getFullYear(),now.getMonth(),now.getDate());
  }
  function nextMemorial(today){
    const year=today.getUTCFullYear();
    return [...memorialDates(year),...memorialDates(year+1)]
      .filter(item=>item.date.getTime()>=today.getTime())
      .sort((a,b)=>a.date-b.date)[0]||null;
  }
  function render(){
    const banner=document.getElementById('home-seasonal-banner');
    const header=banner&&banner.closest('.site-header');
    if(!banner||!header)return;
    const today=bulgarianToday(),upcoming=nextMemorial(today);
    if(!upcoming)return;
    const days=(upcoming.date.getTime()-today.getTime())/DAY_MS;
    // 14 days before and the memorial day itself; otherwise keep the old header intact.
    if(days<0||days>14)return;

    const name=banner.querySelector('[data-seasonal-name]');
    const date=banner.querySelector('[data-seasonal-date]');
    const status=banner.querySelector('[data-seasonal-status]');
    const months=['януари','февруари','март','април','май','юни','юли','август','септември','октомври','ноември','декември'];
    if(!name||!date||!status)return;

    name.textContent=upcoming.name;
    date.textContent=upcoming.date.getUTCDate()+' '+months[upcoming.date.getUTCMonth()]+' '+upcoming.date.getUTCFullYear()+' г.';
    status.textContent=days===0?'Днес е задушница':days===1?'Задушницата е утре':'Предстояща задушница';
    // Both changes are limited to this new banner. No existing menu CSS or script is changed.
    banner.hidden=false;
    header.classList.add('home-seasonal-active');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});
  else render();
})();