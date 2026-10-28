/* Isolated calendar helper for the booklet. Does not change PDF rendering/printing. */
(function(){
  'use strict';
  const DAY = 86400000;
  const asUtc = (y,m,d)=>new Date(Date.UTC(y,m,d));
  const addDays=(date,days)=>new Date(date.getTime()+days*DAY);
  function parseIso(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value||'')) return null;
    const [year,month,day]=value.split('-').map(Number);
    const date=asUtc(year,month-1,day);
    if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
    return date;
  }
  function iso(date){
    return date.getUTCFullYear()+'-'+String(date.getUTCMonth()+1).padStart(2,'0')+'-'+String(date.getUTCDate()).padStart(2,'0');
  }
  function orthodoxEaster(year){
    const a=year%4,b=year%7,c=year%19;
    const d=(19*c+15)%30,e=(2*a+4*b-d+34)%7;
    const julianMonth=Math.floor((d+e+114)/31);
    const julianDay=(d+e+114)%31+1;
    const calendarShift=Math.floor(year/100)-Math.floor(year/400)-2;
    return addDays(asUtc(year,julianMonth-1,julianDay),calendarShift);
  }
  function previousSaturdayBeforeNov8(year){
    const nov8=asUtc(year,10,8),day=nov8.getUTCDay();
    return addDays(nov8,-(day===6?7:(day+1)%7));
  }
  function yearDates(year){
    const easter=orthodoxEaster(year);
    return [
      {key:'mesopustna',name:'Месопустна задушница',date:addDays(easter,-57)},
      {key:'chereshova',name:'Черешова задушница',date:addDays(easter,48)},
      {key:'arhangelova',name:'Архангелова задушница',date:previousSaturdayBeforeNov8(year)}
    ];
  }
  function between(fromIso,toIso){
    const from=parseIso(fromIso),to=parseIso(toIso);
    if(!from||!to||from>to)return [];
    const rows=[];
    for(let year=from.getUTCFullYear();year<=to.getUTCFullYear();year++){
      for(const event of yearDates(year)){
        if(event.date>=from&&event.date<=to) rows.push({key:event.key,name:event.name,date:iso(event.date)});
      }
    }
    return rows.sort((a,b)=>a.date.localeCompare(b.date));
  }
  window.DenINoshtZadushnitsi=Object.freeze({between});
})();
