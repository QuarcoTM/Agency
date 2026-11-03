/* Галерия с 11-те реални оформления от админ генератора.
 * Самостоятелна и изключваема. Няма връзка с входа, данните или Supabase.
 * Етикети и вариантите са синхронизирани с admin/index.html.
 */
(()=>{
 "use strict";

  const ENABLE_REAL_OBITUARY_GALLERY = true; // Премахнете галерията от сайта само с false.
  const galleryDesigns = [
  {
    "id": "crosses",
    "label": "Класически с кръстове"
  },
  {
    "id": "photo",
    "label": "Класически със снимка"
  },
  {
    "id": "photo-oval",
    "label": "С овална снимка и кръстове"
  },
  {
    "id": "photo-arch",
    "label": "С централна снимка в арка"
  },
  {
    "id": "angels",
    "label": "Класически с ангелчета"
  },
  {
    "id": "candle",
    "label": "Тъмен със свещ — досегашният"
  },
  {
    "id": "double",
    "label": "Двоен — за двама"
  },
  {
    "id": "black-silver",
    "label": "Черен със сребърен кръст и рози"
  },
  {
    "id": "black-candle",
    "label": "Черен със свещ и златен текст"
  },
  {
    "id": "black-gold",
    "label": "Черен със златен кръст"
  },
  {
    "id": "background",
    "label": "С ваша снимка за фон"
  }
];
  const obituaryArtwork = {
    angel:{file:"angel.webp"},
    "black-silver":{file:"silver-cross.webp"},
    "black-candle":{file:"gold-candle.webp"},
    "black-gold":{file:"gold-cross.webp"}
  };

const OBITUARY_PERIODS={day40:'40 дни',month3:'3 месеца',month6:'6 месеца',month9:'9 месеца',year1:'1 година'};
const OBITUARY_PRESETS = {
    death: {
      title: 'СКРЪБНА ВЕСТ',
      intro: 'С много болка съобщаваме,',
      extra: 'Мъка къса ни сърцата,\nпред твоя гроб стоим, стоим\nи ниско свели сме челата,\nдокато сме живи ще скърбим!',
      ceremony: 'service',
      closing: {male:'',female:'',neutral:''}
    },
    day40: {
      title: 'ВЪЗПОМЕНАНИЕ',
      intro: 'С тъга и обич си спомняме за',
      extra: 'Липсваш ни всеки ден. Споменът за теб ще остане завинаги в сърцата ни.',
      ceremony: 'memorial',
      closing: {male:'СВЕТЛА И ВЕЧНА МУ ПАМЕТ!',female:'СВЕТЛА И ВЕЧНА Ѝ ПАМЕТ!',neutral:'СВЕТЛА И ВЕЧНА ПАМЕТ!'}
    },
    month3: {
      title: 'ВЪЗПОМЕНАНИЕ',
      intro: 'С болка и обич си спомняме за',
      extra: 'Времето минава, но болката и споменът остават. Никога няма да те забравим.',
      ceremony: 'memorial',
      closing: {male:'СВЕТЛА И ВЕЧНА МУ ПАМЕТ!',female:'СВЕТЛА И ВЕЧНА Ѝ ПАМЕТ!',neutral:'СВЕТЛА И ВЕЧНА ПАМЕТ!'}
    },
    month6: {
      title: 'ВЪЗПОМЕНАНИЕ',
      intro: 'С болка и обич си спомняме за',
      extra: 'Времето минава, но болката и споменът остават. Никога няма да те забравим.',
      ceremony: 'memorial',
      closing: {male:'СВЕТЛА И ВЕЧНА МУ ПАМЕТ!',female:'СВЕТЛА И ВЕЧНА Ѝ ПАМЕТ!',neutral:'СВЕТЛА И ВЕЧНА ПАМЕТ!'}
    },
    month9: {
      title: 'ВЪЗПОМЕНАНИЕ',
      intro: 'С болка и обич си спомняме за',
      extra: 'Времето минава, но болката и споменът остават. Никога няма да те забравим.',
      ceremony: 'memorial',
      closing: {male:'СВЕТЛА И ВЕЧНА МУ ПАМЕТ!',female:'СВЕТЛА И ВЕЧНА Ѝ ПАМЕТ!',neutral:'СВЕТЛА И ВЕЧНА ПАМЕТ!'}
    },
    year1: {
      title: 'ВЪЗПОМЕНАНИЕ',
      intro: 'С болка и обич пазим спомена за',
      extra: 'Измина една година, но ти оставаш завинаги в мислите и сърцата ни.',
      ceremony: 'memorial',
      closing: {male:'СВЕТЛА И ВЕЧНА МУ ПАМЕТ!',female:'СВЕТЛА И ВЕЧНА Ѝ ПАМЕТ!',neutral:'СВЕТЛА И ВЕЧНА ПАМЕТ!'}
    },
    memorial: {
      title: 'ВЪЗПОМЕНАНИЕ',
      intro: 'С обич и признателност си спомняме за',
      extra: 'Споменът за теб е жив и ще остане завинаги в сърцата ни.',
      ceremony: 'memorial',
      closing: {male:'ПОКЛОН ПРЕД СВЕТЛАТА МУ ПАМЕТ!',female:'ПОКЛОН ПРЕД СВЕТЛАТА Ѝ ПАМЕТ!',neutral:'ПОКЛОН ПРЕД СВЕТЛАТА ПАМЕТ!'}
    }
  };

  // Функциите по-долу са копирани дословно от admin/admin.js (същият Canvas генератор).
  // Контролният тест сравнява кода им, така че публичните шаблони да не се разминават.
  function obituaryPeriod(model){
      if(model.type==='year1'){
        const years=Number(model.anniversaryYears)||1;
        return years+' '+(years===1?'година':'години');
      }
      return OBITUARY_PERIODS[model.type]||'';
    }

  function formatObituaryShortDate(date){
      if(!date) return '';
      return new Intl.DateTimeFormat('bg-BG',{day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
    }

  function obituaryWrappedLines(ctx,text,maxWidth){
      const lines=[];
      String(text||'').split(/\r?\n/).forEach((paragraph,index,all)=>{
        const words=paragraph.trim().split(/\s+/).filter(Boolean);
        if(!words.length){ if(index<all.length-1) lines.push(''); return; }
        let line='',width=0;
        const spaceWidth=ctx.measureText(' ').width;
        words.forEach((word)=>{
          const wordWidth=ctx.measureText(word).width;
          if(wordWidth>maxWidth){
            if(line){ lines.push(line); line=''; width=0; }
            // Split a long word or URL without deleting characters.
            const chars=Array.from(word);
            let offset=0;
            const probeLimit=Math.max(1,Math.ceil(maxWidth/Math.max(.000001,ctx.measureText('M').width))*4);
            while(offset<chars.length){
              let low=1,high=Math.min(chars.length-offset,probeLimit),take=1;
              while(low<=high){
                const middle=Math.floor((low+high)/2);
                if(ctx.measureText(chars.slice(offset,offset+middle).join('')).width<=maxWidth){ take=middle; low=middle+1; }
                else high=middle-1;
              }
              const part=chars.slice(offset,offset+take).join(''); offset+=take;
              if(offset<chars.length) lines.push(part);
              else{ line=part; width=ctx.measureText(part).width; }
            }
          }else if(line&&width+spaceWidth+wordWidth>maxWidth){ lines.push(line); line=word; width=wordWidth; }
          else{ width+=wordWidth+(line?spaceWidth:0); line=line?line+' '+word:word; }
        });
        if(line) lines.push(line);
      });
      return lines;
    }

  function drawObituaryCornerCross(ctx,cx,y,size,color){
      ctx.save(); ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=Math.max(5,size*.105); ctx.lineCap='round';
      const top=y-size*.42; const bottom=y+size*.42; const left=cx-size*.32; const right=cx+size*.32; const barY=y-size*.12;
      ctx.beginPath(); ctx.moveTo(cx,top); ctx.lineTo(cx,bottom); ctx.moveTo(left,barY); ctx.lineTo(right,barY); ctx.stroke();
      const r=size*.073,side=size*.068,forward=size*.026,inward=size*.052;
      const lobes=[
        [cx,top-forward],[cx-side,top+inward],[cx+side,top+inward],
        [cx,bottom+forward],[cx-side,bottom-inward],[cx+side,bottom-inward],
        [left-forward,barY],[left+inward,barY-side],[left+inward,barY+side],
        [right+forward,barY],[right-inward,barY-side],[right-inward,barY+side]
      ];
      lobes.forEach(([px,py])=>{ ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fill(); });
      ctx.strokeStyle='#fff'; ctx.lineWidth=Math.max(2,size*.04); ctx.beginPath(); ctx.moveTo(cx,top-size*.015); ctx.lineTo(cx,bottom+size*.015); ctx.moveTo(left-size*.015,barY); ctx.lineTo(right+size*.015,barY); ctx.stroke();
      ctx.fillStyle='#fff'; const innerR=r*.39;
      lobes.forEach(([px,py])=>{ ctx.beginPath(); ctx.arc(px,py,innerR,0,Math.PI*2); ctx.fill(); });
      ctx.restore();
    }

  function drawObituaryAngel(ctx,cx,cy,size,flip){
      const image=obituaryArtwork.angel.image;if(!image) return;
      ctx.save();ctx.translate(cx,cy);ctx.scale(flip?-1:1,1);ctx.drawImage(image,-size/2,-size/2,size,size);ctx.restore();
    }

  function drawObituaryCandleBackground(ctx){
      const bg=ctx.createLinearGradient(0,0,1240,1754); bg.addColorStop(0,'#090807'); bg.addColorStop(.52,'#24201b'); bg.addColorStop(1,'#070707'); ctx.fillStyle=bg; ctx.fillRect(0,0,1240,1754);
      const glow=ctx.createRadialGradient(620,650,20,620,650,520); glow.addColorStop(0,'rgba(255,215,135,.72)'); glow.addColorStop(.25,'rgba(204,133,61,.28)'); glow.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=glow; ctx.fillRect(80,100,1080,1200);
      ctx.save(); ctx.globalAlpha=.5; ctx.fillStyle='#e6c18c'; ctx.fillRect(585,620,70,520); ctx.fillStyle='#fff2d5'; ctx.beginPath(); ctx.moveTo(620,555); ctx.bezierCurveTo(560,635,596,694,620,700); ctx.bezierCurveTo(648,674,681,620,620,555); ctx.fill(); ctx.restore();
    }

  function obituaryPrintGeometry(output){
      const copies=output==='a5x2'?2:1;
      const pageWidth=copies===2?297:210,pageHeight=copies===2?210:297,margin=5;
      const cellWidth=pageWidth/copies,panelWidth=cellWidth-2*margin,panelHeight=pageHeight-2*margin;
      return {copies,pageWidth,pageHeight,margin,cellWidth,panelWidth,panelHeight,pxPerMmX:1240/panelWidth,pxPerMmY:1754/panelHeight};
    }

  function drawObituaryImageBackground(ctx,image,geometry,settings){
      const inset=3.8,width=geometry.panelWidth-2*inset,height=geometry.panelHeight-2*inset;
      const sx=geometry.pxPerMmX,sy=geometry.pxPerMmY;
      ctx.save();ctx.beginPath();ctx.rect(inset*sx,inset*sy,width*sx,height*sy);ctx.clip();
      ctx.fillStyle=settings.backgroundColor==='black'?'#fff':'#050505';ctx.fillRect(0,0,1240,1754);
      if(image){
        const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
        const base=settings.backgroundFit==='contain'?Math.min(width/iw,height/ih):Math.max(width/iw,height/ih);
        const zoom=Math.max(1,Number(settings.backgroundZoom||100)/100),w=iw*base*zoom,h=ih*base*zoom;
        const x=inset+(width-w)/2+Math.max(-100,Math.min(100,settings.backgroundX||0))/100*Math.max(0,w-width)/2;
        const y=inset+(height-h)/2+Math.max(-100,Math.min(100,settings.backgroundY||0))/100*Math.max(0,h-height)/2;
        ctx.filter='none';ctx.globalAlpha=1;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
        ctx.drawImage(image,x*sx,y*sy,w*sx,h*sy);
      }
      ctx.restore();
    }

  function drawDoubleObituaryFrame(ctx,geometry){
      ctx.save();ctx.scale(geometry.pxPerMmX,geometry.pxPerMmY);
      const x=4.1,y=4.1,w=geometry.panelWidth-8.2,h=geometry.panelHeight-8.2;
      ctx.strokeStyle='#111';ctx.lineWidth=1.4;ctx.strokeRect(x,y,w,h);
      ctx.lineWidth=.15;ctx.strokeRect(5,5,geometry.panelWidth-10,geometry.panelHeight-10);
      const rosette=(cx,cy)=>{
        ctx.fillStyle='#fff';
        for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.arc(cx+Math.cos(a)*.31,cy+Math.sin(a)*.31,.25,0,Math.PI*2);ctx.fill();}
        ctx.fillStyle='#111';ctx.beginPath();ctx.arc(cx,cy,.17,0,Math.PI*2);ctx.fill();
      };
      const across=Math.ceil(w/6),down=Math.ceil(h/6);
      for(let i=0;i<=across;i++){const px=x+i*w/across;rosette(px,y);rosette(px,y+h);}
      for(let i=1;i<down;i++){const py=y+i*h/down;rosette(x,py);rosette(x+w,py);}
      ctx.restore();
    }

  function drawObituaryFrame(ctx,design,geometry,model){
      if(design==='candle') drawObituaryCandleBackground(ctx);
      else{ ctx.fillStyle='#fff'; ctx.fillRect(0,0,1240,1754); }
      if(obituaryArtwork[design]) drawObituaryImageBackground(ctx,obituaryArtwork[design].image,geometry,{backgroundFit:'cover'});
      if(design==='background') drawObituaryImageBackground(ctx,model&&model.background,geometry,model||{});
      if(design==='double'){drawDoubleObituaryFrame(ctx,geometry);return;}
      const dark=design==='candle'||design.indexOf('black-')===0; const color=design==='black-silver'?'#ececec':dark?'#d5a85c':'#151515';
      // Millimetre coordinates keep all four printed frame insets identical.
      // The 5 mm page margin plus 3.8 mm frame inset leaves room for the footer.
      ctx.save(); ctx.strokeStyle=color;
      ctx.save(); ctx.scale(geometry.pxPerMmX,geometry.pxPerMmY);
      ctx.lineWidth=.8; ctx.strokeRect(3.8,3.8,geometry.panelWidth-7.6,geometry.panelHeight-7.6);
      ctx.lineWidth=.15; ctx.strokeRect(4.6,4.6,geometry.panelWidth-9.2,geometry.panelHeight-9.2);
      ctx.restore();
      if(design==='crosses'||design==='photo-oval'){
        drawObituaryCornerCross(ctx,150,160,104,color); drawObituaryCornerCross(ctx,1090,160,104,color);
      }else if(design==='angels'||design==='doves'){
        drawObituaryAngel(ctx,150,170,170,false); drawObituaryAngel(ctx,1090,170,170,true);
      }
      ctx.restore();
    }

  function obituaryPortraitPath(ctx,x,y,width,height,shape){
      ctx.beginPath();
      if(shape==='oval') ctx.ellipse(x+width/2,y+height/2,width/2,height/2,0,0,Math.PI*2);
      else{
        const radius=width/2;
        ctx.moveTo(x,y+height);ctx.lineTo(x,y+radius);
        ctx.arc(x+radius,y+radius,radius,Math.PI,Math.PI*2);
        ctx.lineTo(x+width,y+height);ctx.closePath();
      }
    }

  function drawObituaryPortrait(ctx,image,x,y,width,height,model,dark,shape){
      const imageWidth=image.naturalWidth||image.width; const imageHeight=image.naturalHeight||image.height;
      const base=model.photoFit==='cover'?Math.max(width/imageWidth,height/imageHeight):Math.min(width/imageWidth,height/imageHeight);
      const scale=base*Math.max(.5,model.photoZoom/100);
      const drawWidth=imageWidth*scale; const drawHeight=imageHeight*scale;
      const overflowX=Math.max(0,drawWidth-width); const overflowY=Math.max(0,drawHeight-height);
      const offsetX=(Math.max(-100,Math.min(100,model.photoX))/100)*(overflowX/2);
      const offsetY=(Math.max(-100,Math.min(100,model.photoY))/100)*(overflowY/2);
      ctx.save();
      if(shape) obituaryPortraitPath(ctx,x,y,width,height,shape);
      else{ctx.beginPath();ctx.rect(x,y,width,height);}
      ctx.clip();
      ctx.drawImage(image,x+(width-drawWidth)/2+offsetX,y+(height-drawHeight)/2+offsetY,drawWidth,drawHeight); ctx.restore();
      if(shape){
        ctx.save();ctx.strokeStyle='#171717';ctx.lineWidth=5;
        obituaryPortraitPath(ctx,x-8,y-8,width+16,height+16,shape);ctx.stroke();
        ctx.lineWidth=2;obituaryPortraitPath(ctx,x+4,y+4,width-8,height-8,shape);ctx.stroke();ctx.restore();
        return;
      }
      ctx.save(); ctx.strokeStyle=dark?'#d5a85c':'#171717'; ctx.lineWidth=5; ctx.strokeRect(x-8,y-8,width+16,height+16); ctx.lineWidth=2; ctx.strokeRect(x+4,y+4,width-8,height-8); ctx.restore();
    }

  function obituaryNameParts(name){
      return String(name||'').trim().split(/\s+/).filter(Boolean).map((part)=>{
        const lower=part.toLocaleLowerCase('bg-BG');
        return lower.charAt(0).toLocaleUpperCase('bg-BG')+lower.slice(1);
      });
    }

  function drawObituaryFittedText(ctx,text,y,options){
      if(!String(text||'').trim()) return y;
      const opts=Object.assign({x:620,maxWidth:1060,maxHeight:100,size:56,weight:'bold',style:'normal',align:'center',color:'#000',blankLineFactor:1.16},options||{});
      const measure=(size)=>{
        // Measure at the original font size; scale at draw time even below one pixel.
        ctx.font=opts.style+' '+opts.weight+' '+opts.size+'px "Times New Roman", Times, serif';
        const ratio=size/opts.size;
        const lines=opts.wrap===false?String(text).split(/\r?\n/).map((line)=>line.trim()):obituaryWrappedLines(ctx,text,opts.maxWidth/ratio);
        const height=lines.reduce((sum,line)=>sum+size*(line?1.16:opts.blankLineFactor),0);
        return {size,lines,height,fits:height<=opts.maxHeight&&lines.every(line=>ctx.measureText(line).width*ratio<=opts.maxWidth)};
      };
      let fitted=measure(opts.size);
      if(!fitted.fits){
        let low=0,high=opts.size;
        // Fit the complete text, including very long words and explicit line breaks.
        // There is no minimum font size that can force another sheet or discard text.
        for(let step=0;step<32;step+=1){
          const candidate=measure((low+high)/2);
          if(candidate.fits){ low=candidate.size; fitted=candidate; }
          else high=candidate.size;
        }
        if(!fitted.fits) fitted=measure(Math.min(opts.size,opts.maxHeight/(String(text).length+1)/2,opts.maxWidth/(String(text).length+1)/2));
      }
      ctx.font=opts.style+' '+opts.weight+' '+opts.size+'px "Times New Roman", Times, serif';
      ctx.fillStyle=opts.color; ctx.textAlign=opts.align; ctx.textBaseline='top';
      const ratio=fitted.size/opts.size;
      let cursor=y;
      fitted.lines.forEach((line)=>{
        if(line){
          ctx.save();ctx.translate(opts.x,cursor);ctx.scale(ratio,ratio);
          if(opts.outline){ctx.strokeStyle=opts.outline;ctx.lineWidth=Math.max(1.2,opts.size*.033);ctx.lineJoin='round';ctx.strokeText(line,0,0,opts.maxWidth/ratio);}
          ctx.fillText(line,0,0,opts.maxWidth/ratio);ctx.restore();
        }
        cursor+=fitted.size*(line?1.16:opts.blankLineFactor);
      });
      return cursor;
    }

  function formatObituaryCeremonyText(ceremony){
      if(ceremony.kind==='none'||ceremony.kind==='custom'||(!ceremony.date&&!ceremony.time&&!ceremony.place)) return '';
      const labels={viewing:'Поклонението ще се състои',service:'Опелото ще се отслужи',funeral:'Погребението ще се състои',memorial:'Поменът ще се състои'};
      let text=labels[ceremony.kind]||'Церемонията ще се състои';
      if(ceremony.date){
        const date=ceremony.date;
        text+=' на '+String(date.getDate()).padStart(2,'0')+'.'+String(date.getMonth()+1).padStart(2,'0')+'.'+String(date.getFullYear()).slice(-2)+'г.';
      }
      if(ceremony.time) text+=' от '+ceremony.time+'ч.';
      if(ceremony.place) text+='\nв '+ceremony.place;
      return text;
    }

  function buildObituaryCeremonyText(model){
      const additional=model.additionalCeremonies||[];
      if(model.ceremonyKind==='none'&&!additional.length) return '';
      if(model.ceremonyText) return model.ceremonyText;
      const primary={kind:model.ceremonyKind,date:model.ceremonyDate,time:model.ceremonyTime,place:model.ceremonyPlace};
      return [primary,...additional].map(formatObituaryCeremonyText).filter(Boolean).join('\n');
    }

  function drawObituaryFooter(ctx,geometry,color){
      const text='Траурна агенция „Ден и Нощ“ (срещу полицията) 0898 24 24 34 / 0893 64 66 68  deninosht.bg';
      const maxWidth=1240-7.6*geometry.pxPerMmX;
      const bandTop=1754-3.4*geometry.pxPerMmY,bandHeight=3.4*geometry.pxPerMmY;
      ctx.save();
      ctx.font='bold '+(10*25.4/72*geometry.pxPerMmY)+'px Arial, Helvetica, sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillStyle=color;
      const metrics=ctx.measureText(text);
      const ascent=metrics.actualBoundingBoxAscent,descent=metrics.actualBoundingBoxDescent;
      const scaleX=Math.min(1,maxWidth/metrics.width);
      const scaleY=Math.min(1,3.1*geometry.pxPerMmY/(ascent+descent));
      // Fit the actual ink below the unchanged frame, not an oversized line box.
      const baseline=bandTop+(bandHeight-(ascent+descent)*scaleY)/2+ascent*scaleY;
      ctx.translate(620,baseline); ctx.scale(scaleX,scaleY); ctx.fillText(text,0,0);
      ctx.restore();
    }

  function drawDoubleObituaryPortrait(ctx,photo,cx,model){
      const x=cx-150,y=500,w=300,h=350;
      if(photo){drawObituaryPortrait(ctx,photo,x,y,w,h,model,false);return;}
      ctx.save();ctx.fillStyle='#101010';ctx.fillRect(x,y,w,h);
      ctx.strokeStyle='#d6cec1';ctx.lineWidth=20;ctx.beginPath();ctx.moveTo(cx,y+30);ctx.lineTo(cx,y+270);ctx.moveTo(cx-65,y+106);ctx.lineTo(cx+65,y+106);ctx.stroke();
      ctx.strokeStyle='#8c8174';ctx.lineWidth=3;ctx.stroke();
      drawObituaryAngel(ctx,cx-75,y+260,170,false);drawObituaryAngel(ctx,cx+75,y+260,170,true);
      ctx.strokeStyle='#171717';ctx.lineWidth=4;ctx.strokeRect(x-5,y-5,w+10,h+10);ctx.restore();
    }

  function paintDoubleObituary(ctx,model,geometry,scale){
      const drawText=(text,y,options)=>drawObituaryFittedText(ctx,text,y,options);
      const second=model.secondPerson||{name:'',period:'',age:null,photo:null};
      const title=model.type!=='death'&&model.title==='ВЪЗПОМЕНАНИЕ'?'ТЪЖЕН ПОМЕН':model.title;
      drawText(title,120,{size:88*scale,maxWidth:1020,maxHeight:104});
      const firstPeriod=model.firstPeriod||obituaryPeriod(model);
      const periodLines=(text)=>String(text||'').replace(/\s+(години?|месеца|дни)$/i,'\n$1');
      drawText(periodLines(firstPeriod),268,{x:355,size:68*scale,maxWidth:460,maxHeight:150});
      drawText(periodLines(second.period),268,{x:885,size:68*scale,maxWidth:460,maxHeight:150});
      const defaultIntros=Object.values(OBITUARY_PRESETS).map(preset=>preset.intro).concat(['от смъртта на нашия близък','от смъртта на нашата близка']);
      const intro=defaultIntros.includes(model.intro)?(model.type==='death'?'С много болка съобщаваме, че ни напуснаха':'ОТ СМЪРТТА НА'):model.intro;
      drawText(intro,433,{size:40*scale,weight:'normal',maxWidth:1000,maxHeight:60});
      drawDoubleObituaryPortrait(ctx,model.photo,355,model);
      drawDoubleObituaryPortrait(ctx,second.photo,885,Object.assign({photoFit:'contain',photoZoom:100,photoX:0,photoY:0},second));
      [{name:model.name,age:model.age,x:355},{name:second.name,age:second.age,x:885}].forEach((person)=>{
        const parts=obituaryNameParts(person.name),slot=216/Math.max(3,parts.length);
        parts.forEach((part,index)=>drawText(part,895+index*slot,{x:person.x,size:70*scale,maxWidth:460,maxHeight:slot}));
        if(person.age!==null&&person.age!==undefined) drawText(person.age+'г.',1130,{x:person.x,size:42*scale,maxWidth:460,maxHeight:50});
      });
      drawText(model.extraText,1200,{size:49*scale,style:'italic',maxWidth:1020,maxHeight:200,blankLineFactor:.7});
      drawText(buildObituaryCeremonyText(model),1430,{size:38*scale,weight:'bold',maxWidth:1020,maxHeight:150,wrap:Boolean(model.ceremonyText)});
      drawText(model.from,1600,{x:1110,size:54*scale,style:'italic',align:'right',maxWidth:980,maxHeight:85});
      if(model.agencyFooter) drawObituaryFooter(ctx,geometry,'#000');
    }

  function paintObituary(ctx,model,scale){
      // Browser print and PDF place this canvas in the same 5 mm printable area.
      const geometry=obituaryPrintGeometry(model.output);
      drawObituaryFrame(ctx,model.design,geometry,model);
      if(model.design==='double'){paintDoubleObituary(ctx,model,geometry,scale);return 1754;}
      const custom=model.design==='background',dark=model.design==='candle'||model.design.indexOf('black-')===0;
      const backgroundColors={white:'#fff',black:'#000',gold:'#e5ba55'};
      const ink=custom?(backgroundColors[model.backgroundColor]||'#fff'):model.design==='black-candle'?'#e5ba55':dark?'#fff5e8':'#000';
      const outline=custom&&model.backgroundOutline?(model.backgroundColor==='black'?'#fff':'#000'):model.design.indexOf('black-')===0?'#000':null;
      const silver=model.design==='black-silver',textX=silver?800:620,textWidth=silver?720:1020;
      const textDefaults={color:ink,outline,x:textX};if(silver) textDefaults.maxWidth=textWidth;
      const drawText=(text,y,options)=>drawObituaryFittedText(ctx,text,y,Object.assign({},textDefaults,options));
      const period=obituaryPeriod(model);
      const title=model.type!=='death'&&model.title==='ВЪЗПОМЕНАНИЕ'?'ТЪЖЕН ПОМЕН':model.title;
      drawText(title,120,{size:88*scale,maxWidth:silver?740:['angels','doves'].includes(model.design)?760:['crosses','photo-oval'].includes(model.design)?860:1020,maxHeight:104,style:silver?'italic':'normal'});
      if(period) drawText(period,224,{size:80*scale,maxHeight:90});
      let intro=model.intro;
      if(model.type==='death'&&intro==='С много болка съобщаваме,') intro+='\n'+(model.death?'че на '+formatObituaryShortDate(model.death)+' ':'')+'ни напусна';
      drawText(intro,period?318:260,{size:43*scale,weight:'normal',maxHeight:period?60:90});

      const arched=model.design==='photo-arch'&&Boolean(model.photo);
      const parts=obituaryNameParts(model.name);
      if(arched){
        drawObituaryPortrait(ctx,model.photo,470,388,300,350,model,false,'arch');
        drawText(parts.join('\n'),760,{size:66*scale,maxWidth:1000,maxHeight:180,wrap:false});
        if(model.age!==null) drawText(model.age+'г.',956,{size:42*scale,maxWidth:980,maxHeight:50});
      }else{
        if(model.photo) drawObituaryPortrait(ctx,model.photo,silver?470:180,376,silver?260:380,442,model,dark,model.design==='photo-oval'?'oval':null);
        const nameX=model.photo?(silver?955:850):textX, nameWidth=model.photo?(silver?360:540):(silver?660:980);
        const nameStep=parts.length>1?Math.min(144,288/(parts.length-1)):0;
        parts.forEach((part,index)=>drawText(part,378+index*nameStep,{x:nameX,maxWidth:nameWidth,maxHeight:Math.min(114,nameStep||114),size:96*scale}));
        if(model.age!==null) drawText(model.age+'г.',790,{x:nameX,maxWidth:nameWidth,size:62*scale,maxHeight:76});
      }

      drawText(model.extraText,arched?1040:950,{size:60*scale,style:'italic',maxWidth:textWidth,maxHeight:arched?270:360,blankLineFactor:35/56});
      const ceremonyText=buildObituaryCeremonyText(model);
      const expandedCeremony=(model.additionalCeremonies||[]).some((ceremony)=>formatObituaryCeremonyText(ceremony))||ceremonyText.split(/\r?\n/).filter((line)=>line.trim()).length>2;
      drawText(ceremonyText,expandedCeremony?1345:1360,{size:43*scale,weight:'bold',maxWidth:textWidth,maxHeight:expandedCeremony?220:138,wrap:Boolean(model.ceremonyText)});
      drawText(model.from,expandedCeremony?1600:1530,{x:1110,size:60*scale,style:'italic',align:'right',maxWidth:980,maxHeight:85});
      if(model.agencyFooter) drawObituaryFooter(ctx,geometry,model.design==='candle'?ink:'#000');
      return 1754;
    }

  function placeholderPhoto() {
    const canvas=document.createElement("canvas");
    canvas.width=380;canvas.height=442;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#dcd8d2";ctx.fillRect(0,0,380,442);
    ctx.strokeStyle="#777067";ctx.lineWidth=4;ctx.strokeRect(12,12,356,418);
    ctx.fillStyle="#39342f";ctx.font="bold 57px Arial, sans-serif";
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText("СНИМКА",190,221,340);
    return canvas;
  }

  function placeholderBackground() {
    const canvas=document.createElement("canvas");
    canvas.width=1240;canvas.height=1754;
    const ctx=canvas.getContext("2d");
    const fill=ctx.createLinearGradient(0,0,1240,1754);
    fill.addColorStop(0,"#2d2a27");fill.addColorStop(0.5,"#4e453c");fill.addColorStop(1,"#221d1b");
    ctx.fillStyle=fill;ctx.fillRect(0,0,1240,1754);
    ctx.fillStyle="rgba(255,255,255,0.25)";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.font="bold 175px Arial, sans-serif";ctx.fillText("СНИМКА",620,870,1100);
    return canvas;
  }

  let samplePhoto=null;
  let sampleBackground=null;

  function sampleModel(design) {
    const withPhoto=["photo","photo-oval","photo-arch","double"].includes(design);
    if(withPhoto && !samplePhoto) samplePhoto=placeholderPhoto();
    if(design==="background" && !sampleBackground) sampleBackground=placeholderBackground();
    return {
      type:"death",anniversaryYears:1,design,output:"a4",gender:"neutral",
      title:"СКРЪБНА ВЕСТ",intro:"С много болка съобщаваме,",
      name:"Име Презиме Фамилия",birth:null,death:null,age:null,
      ceremonyKind:"none",ceremonyDate:null,ceremonyTime:"",ceremonyPlace:"",ceremonyText:"",
      additionalCeremonies:[],extraText:"Поклон пред светлата памет!",
      from:"От семейството",agencyFooter:true,
      photo:withPhoto?samplePhoto:null,photoFit:"contain",photoZoom:100,photoX:0,photoY:0,
      firstPeriod:"",secondPerson:design==="double"?{
        name:"Име Презиме Фамилия",period:"",age:null,
        photo:samplePhoto,photoFit:"contain",photoZoom:100,photoX:0,photoY:0
      }:null,
      background:design==="background"?sampleBackground:null,
      backgroundFit:"cover",backgroundColor:"white",backgroundZoom:100,
      backgroundX:0,backgroundY:0,backgroundOutline:false
    };
  }

  function renderSample(canvas,design,width) {
    const targetWidth=Math.round(width);
    canvas.width=targetWidth;
    canvas.height=Math.round(targetWidth*1754/1240);
    const ctx=canvas.getContext("2d",{alpha:false});
    if(!ctx) throw new Error("Canvas е недостъпен.");
    ctx.setTransform(canvas.width/1240,0,0,canvas.height/1754,0,0);
    paintObituary(ctx,sampleModel(design),1);
  }

  async function loadArtwork() {
    await Promise.all(Object.values(obituaryArtwork).map(asset=>new Promise((resolve,reject)=>{
      const img=new Image();img.decoding="async";
      img.onload=()=>{asset.image=img;resolve();};
      img.onerror=()=>reject(new Error("Липсва оригиналният шаблон: "+asset.file));
      img.src="/admin/obituary-art/"+asset.file+"?v=1.90";
    })));
  }

  async function initGallery() {
    if(!ENABLE_REAL_OBITUARY_GALLERY) return;
    const section=document.getElementById("real-obituary-gallery");
    const grid=document.getElementById("real-obituary-grid");
    const dialog=document.getElementById("real-obituary-dialog");
    const bigCanvas=document.getElementById("real-obituary-large");
    const bigTitle=document.getElementById("real-obituary-large-title");
    const close=document.getElementById("real-obituary-close");
    if(!section||!grid||!dialog||!bigCanvas||!bigTitle||!close) return;

    try {
      await loadArtwork();
      const fragment=document.createDocumentFragment();
      galleryDesigns.forEach(item=>{
        const figure=document.createElement("figure");
        figure.className="real-obituary-card";
        const button=document.createElement("button");
        button.type="button";
        button.className="real-obituary-preview";
        button.setAttribute("aria-label","Увеличете некролог: "+item.label);
        const canvas=document.createElement("canvas");
        canvas.setAttribute("aria-label","Примерен некролог: "+item.label);
        renderSample(canvas,item.id,540);
        button.appendChild(canvas);
        const caption=document.createElement("figcaption");
        caption.textContent=item.label;
        figure.append(button,caption);
        button.addEventListener("click",()=>{
          renderSample(bigCanvas,item.id,930);
          bigTitle.textContent=item.label;
          dialog.showModal();
          document.body.classList.add("real-obituary-dialog-open");
        });
        fragment.appendChild(figure);
      });
      grid.replaceChildren(fragment);
      close.addEventListener("click",()=>dialog.close());
      dialog.addEventListener("close",()=>document.body.classList.remove("real-obituary-dialog-open"));
      dialog.addEventListener("click",event=>{if(event.target===dialog)dialog.close();});
      const prev=document.getElementById("real-obituary-prev");
      const next=document.getElementById("real-obituary-next");
      const scrollByCard=direction=>{
        const first=grid.querySelector(".real-obituary-card");
        const distance=first?first.getBoundingClientRect().width+16:320;
        grid.scrollBy({left:direction*distance,behavior:"smooth"});
      };
      if(prev)prev.addEventListener("click",()=>scrollByCard(-1));
      if(next)next.addEventListener("click",()=>scrollByCard(1));
      section.hidden=false;
    }catch(error){
      console.error("Галерията с некролози не можа да бъде заредена:",error);
      section.hidden=true; // При проблем другите части на страницата остават непокътнати.
    }
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initGallery,{once:true});
  else initGallery();
})();

