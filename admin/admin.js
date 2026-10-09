(function(){
  const cfg = window.DENINOSHT_SUPABASE || {
    url: 'https://beflewauiyexpmvcxjat.supabase.co',
    publishableKey: 'sb_publishable_053ZIwadY-CXSIIm3E0byQ_ByB9UJp3'
  };
  const bucket = 'product-images';
  const sessionKey = 'deninosht_admin_session_v1';
  let categories = [];
  let products = [];
  let currentObjectUrl = '';
  let schemaReady = true;
  let codeVisibilityReady = true;
  const ORIGINAL_TICKER = 'ДЕНОНОЩНА ТРАУРНА АГЕНЦИЯ — 0893 64 66 68 — 0898 24 24 34';
  let siteSettingsRowId = null;
  let siteSettingsReady = true;
  let analyticsDays = 30;
  let analyticsLoading = false;

  const $ = (id)=>document.getElementById(id);
  const loginPanel = $('login-panel');
  const dashboard = $('dashboard');
  const loginForm = $('login-form');
  const loginMessage = $('login-message');
  const dashboardMessage = $('dashboard-message');
  const productList = $('product-list');
  const categoryFilter = $('category-filter');
  const statusFilter = $('status-filter');
  const productSearch = $('product-search');
  const productCount = $('product-count');
  const editorBackdrop = $('editor-backdrop');
  const previewBackdrop = $('preview-backdrop');
  const productForm = $('product-form');
  const editorMessage = $('editor-message');
  const saveButton = $('save-product');
  const loginSubmit = $('login-submit');
  const passwordToggle = $('password-toggle');
  const topTickerInput = $('top-ticker-input');
  const tickerSettingMessage = $('ticker-setting-message');
  const saveTopTickerButton = $('save-top-ticker');
  const resetTopTickerButton = $('reset-top-ticker');
  const productsAdminView = $('products-admin-view');
  const analyticsAdminView = $('analytics-admin-view');
  const obituaryAdminView = $('obituary-admin-view');
  const bookletAdminView = $('booklet-admin-view');
  const dashboardTitle = $('dashboard-title');
  const dashboardIntro = $('dashboard-intro');
  const newProductButton = $('new-product-button');
  const analyticsMessage = $('analytics-message');
  const analyticsSetup = $('analytics-setup');
  const analyticsRefresh = $('analytics-refresh');
  const bookletForm = $('booklet-form');
  const bookletName = $('booklet-name');
  const bookletDeathDate = $('booklet-death-date');
  const bookletMessage = $('booklet-message');
  const bookletPrintButton = $('booklet-print-button');
  const bookletPreviewArea = $('booklet-preview-area');
  const bookletReadingPreview = $('booklet-reading-preview');
  const bookletPrintRoot = $('booklet-print-root');
  const bookletZadushnitsiList = $('booklet-zadushnitsi-list');
  const bookletAddZadushnitsa = $('booklet-add-zadushnitsa');
  const obituaryForm = $('obituary-form');
  const obituaryType = $('obituary-type');
  const obituaryDesign = $('obituary-design');
  const obituaryOutput = $('obituary-output');
  const obituaryGender = $('obituary-gender');
  const obituaryPhoto = $('obituary-photo');
  const obituaryPhotoName = $('obituary-photo-name');
  const obituaryPhotoControls = $('obituary-photo-controls');
  const obituaryPhotoFit = $('obituary-photo-fit');
  const obituaryPhotoZoom = $('obituary-photo-zoom');
  const obituaryPhotoZoomValue = $('obituary-photo-zoom-value');
  const obituaryPhotoX = $('obituary-photo-x');
  const obituaryPhotoY = $('obituary-photo-y');
  const obituaryRemovePhoto = $('obituary-remove-photo');
  const obituaryPhotoTools = $('obituary-photo-tools');
  const obituaryPhotoAuto = $('obituary-photo-auto');
  const obituaryPhotoApplyAuto = $('obituary-photo-apply-auto');
  const obituaryPhotoUseOriginal = $('obituary-photo-use-original');
  const obituarySecondPhotoUi = {
    controls:$('obituary-second-photo-controls'),tools:$('obituary-second-photo-tools'),
    fit:$('obituary-second-photo-fit'),zoom:$('obituary-second-photo-zoom'),zoomValue:$('obituary-second-photo-zoom-value'),
    x:$('obituary-second-photo-x'),y:$('obituary-second-photo-y'),auto:$('obituary-second-photo-auto'),
    applyAuto:$('obituary-second-photo-apply-auto'),useOriginal:$('obituary-second-photo-use-original')
  };
  const obituaryBirthDate = $('obituary-birth-date');
  const obituaryDeathDate = $('obituary-death-date');
  const obituaryAge = $('obituary-age');
  const obituaryMessage = $('obituary-message');
  const obituaryDownloadButton = $('obituary-download-button');
  const obituaryPrintButton = $('obituary-print-button');
  const obituaryPrintRoot = $('obituary-print-root');
  const obituaryPreviewArea = $('obituary-preview-area');
  const obituaryPreviewCanvas = $('obituary-preview-canvas');
  const obituaryPreviewFormat = $('obituary-preview-format');
  let obituaryPhotoUrl = '';
  let obituaryPhotoImage = null;
  let obituaryPhotoAutoPreset = null;
  let obituaryPreviewTimer = 0;
  let obituaryAgeIsAutomatic = true;
  let obituaryCeremonyDateIsAutomatic = true;
  let obituaryThumbnailTimer = 0;
  let obituaryThumbnailPortrait = null;
  let obituaryArtworkRevision = 0;
  const OBITUARY_PERIODS={day40:'40 дни',month3:'3 месеца',month6:'6 месеца',month9:'9 месеца',year1:'1 година'};
  const obituaryArtwork={
    angel:{file:'angel.webp'},
    'black-silver':{file:'silver-cross.webp'},
    'black-candle':{file:'gold-candle.webp'},
    'black-gold':{file:'gold-cross.webp'}
  };
  const obituaryLocalImages={
    background:{input:'obituary-background',name:'obituary-background-name',remove:'obituary-remove-background',empty:'Няма избран фон',url:'',image:null,request:0},
    second:{input:'obituary-second-photo',name:'obituary-second-photo-name',remove:'obituary-remove-second-photo',empty:'Без снимка — кръст и ангелчета',url:'',image:null,request:0,autoPreset:null,adjustmentRequest:0}
  };

  function obituaryRequiredArtwork(design){
    if(design==='angels'||design==='doves'||design==='double') return ['angel'];
    return obituaryArtwork[design]?[design]:[];
  }

  function loadObituaryArtwork(design){
    const keys=design?obituaryRequiredArtwork(design):Object.keys(obituaryArtwork);
    return Promise.all(keys.map((key)=>{
      const asset=obituaryArtwork[key];
      if(!asset.promise) asset.promise=new Promise((resolve,reject)=>{
        const image=new Image();
        image.onload=()=>{asset.image=image;obituaryArtworkRevision+=1;scheduleObituaryPreview();resolve(image);};
        image.onerror=()=>reject(new Error('Оформлението не можа да се зареди. Обновете страницата и опитайте отново.'));
        image.src='obituary-art/'+asset.file+'?v=1.90';
      });
      return asset.promise;
    }));
  }

  function updateObituaryDesignFields(){
    const design=obituaryDesign&&obituaryDesign.value;
    const double=design==='double';
    ['obituary-first-period-label','obituary-second-person-section'].forEach((id)=>{const el=$(id);if(el) el.hidden=!double;});
    const secondName=$('obituary-second-name');if(secondName) secondName.required=double;
    const photoHeading=$('obituary-photo-heading');if(photoHeading) photoHeading.textContent=double?'Снимка на първия човек':'Снимка на покойника';
    const personHeading=$('obituary-person-heading');if(personHeading) personHeading.textContent=double?'Данни за първия човек':'Данни за човека';
    const background=$('obituary-background-section');if(background) background.hidden=design!=='background';
    renderObituaryDesignThumbnail();
  }

  function resetObituaryLocalImage(kind){
    const slot=obituaryLocalImages[kind];slot.request+=1;
    if(slot.url) URL.revokeObjectURL(slot.url);
    slot.url='';slot.image=null;
    const input=$(slot.input);if(input) input.value='';
    const name=$(slot.name);if(name) name.textContent=slot.empty;
    const remove=$(slot.remove);if(remove) remove.hidden=true;
    if(kind==='second'){
      slot.autoPreset=null;
      if(obituarySecondPhotoUi.controls) obituarySecondPhotoUi.controls.hidden=true;
      if(obituarySecondPhotoUi.tools) obituarySecondPhotoUi.tools.hidden=true;
      if(obituarySecondPhotoUi.auto) obituarySecondPhotoUi.auto.checked=true;
      useOriginalObituarySecondPhoto(false);
    }
    scheduleObituaryPreview();
  }

  async function setObituaryLocalImage(kind,file){
    if(!file){resetObituaryLocalImage(kind);return false;}
    if(file.size>25*1024*1024) throw new Error('Снимката е прекалено голяма. Изберете файл до 25 MB.');
    const slot=obituaryLocalImages[kind],request=++slot.request,url=URL.createObjectURL(file);
    let image;
    try{
      image=await new Promise((resolve,reject)=>{const candidate=new Image();candidate.onload=()=>resolve(candidate);candidate.onerror=()=>reject(new Error('Снимката не може да бъде отворена. Изберете JPG, PNG или WebP файл.'));candidate.src=url;});
    }catch(error){URL.revokeObjectURL(url);throw error;}
    if(request!==slot.request){URL.revokeObjectURL(url);return false;}
    if(slot.url) URL.revokeObjectURL(slot.url);
    slot.url=url;slot.image=image;
    const name=$(slot.name);if(name) name.textContent=file.name;
    const remove=$(slot.remove);if(remove) remove.hidden=false;
    if(kind==='second'){
      slot.autoPreset=null;
      if(obituarySecondPhotoUi.controls) obituarySecondPhotoUi.controls.hidden=false;
      if(obituarySecondPhotoUi.tools) obituarySecondPhotoUi.tools.hidden=false;
      useOriginalObituarySecondPhoto(false);
      if(!obituarySecondPhotoUi.auto||obituarySecondPhotoUi.auto.checked) await applyAutoObituarySecondPhoto(false);
      if(request!==slot.request) return false;
    }
    scheduleObituaryPreview();
    return true;
  }

  function renderObituaryDesignThumbnail(){
    const thumbnail=$('obituary-design-thumbnail');if(!thumbnail) return;
    try{
      const model=readObituaryModel(true),samplePhoto=model.design==='photo'&&!model.photo;
      if(samplePhoto){
        if(!obituaryThumbnailPortrait){
          const c=document.createElement('canvas');c.width=380;c.height=442;const p=c.getContext('2d');
          p.fillStyle='#e6e6e6';p.fillRect(0,0,380,442);p.fillStyle='#939393';p.beginPath();p.arc(190,145,65,0,Math.PI*2);p.fill();p.beginPath();p.ellipse(190,360,125,125,0,0,Math.PI*2);p.fill();obituaryThumbnailPortrait=c;
        }
        Object.assign(model,{photo:obituaryThumbnailPortrait,photoFit:'contain',photoZoom:100,photoX:0,photoY:0});
      }
      const source=createObituaryCanvas(model,null,1);
      const ctx=thumbnail.getContext('2d');ctx.clearRect(0,0,thumbnail.width,thumbnail.height);ctx.drawImage(source,0,0,thumbnail.width,thumbnail.height);
      thumbnail.dataset.design=model.design;
      const caption=$('obituary-design-caption');if(caption) caption.textContent=obituaryDesign.options[obituaryDesign.selectedIndex].textContent+(samplePhoto?' — добавете снимка':'');
    }catch(error){/* Keep the last valid miniature while an input is incomplete. */}
  }

  function message(el, text, type){
    if (!el) return;
    el.textContent = text || '';
    el.className = 'admin-message' + (type ? ' ' + type : '');
  }

  function slugify(value){
    const map = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sht','ъ':'a','ь':'y','ю':'yu','я':'ya'};
    return String(value || '').toLowerCase().split('').map((ch)=>map[ch] || ch).join('')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-') || 'product';
  }

  function norm(value){
    return String(value || '').toLocaleLowerCase('bg-BG').trim();
  }

  function readSession(){
    try{ const raw = localStorage.getItem(sessionKey); return raw ? JSON.parse(raw) : null; }
    catch (_) { return null; }
  }

  function saveSession(data){
    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + Math.max(60, Number(data.expires_in || 3600)) * 1000,
      user: data.user || null
    };
    localStorage.setItem(sessionKey, JSON.stringify(session));
    return session;
  }

  function clearSession(){ localStorage.removeItem(sessionKey); }

  async function parseError(response){
    try{
      const data = await response.json();
      return data.msg || data.message || data.error_description || data.error || ('HTTP ' + response.status);
    } catch (_) { return 'HTTP ' + response.status; }
  }

  async function authToken(grantType, payload){
    const response = await fetch(cfg.url + '/auth/v1/token?grant_type=' + encodeURIComponent(grantType), {
      method: 'POST', headers: {apikey: cfg.publishableKey,'Content-Type':'application/json',Accept:'application/json'},
      body: JSON.stringify(payload), cache: 'no-store'
    });
    if (!response.ok) throw new Error(await parseError(response));
    return response.json();
  }

  async function ensureSession(){
    let session = readSession();
    if (!session || !session.refresh_token) return null;
    if (session.access_token && session.expires_at > Date.now() + 60000) return session;
    try{
      const refreshed = await authToken('refresh_token', {refresh_token: session.refresh_token});
      session = saveSession(refreshed);
      return session;
    } catch (_) { clearSession(); return null; }
  }

  async function request(path, options, authenticated, retry){
    const opts = Object.assign({method:'GET',headers:{}}, options || {});
    const headers = new Headers(opts.headers || {});
    headers.set('apikey', cfg.publishableKey);
    headers.set('Accept','application/json');
    if (authenticated){
      const session = await ensureSession();
      if (!session) throw new Error('Сесията е изтекла. Влезте отново.');
      headers.set('Authorization','Bearer ' + session.access_token);
    }
    const response = await fetch(cfg.url + path, Object.assign({}, opts, {headers,cache:'no-store'}));
    if (response.status === 401 && authenticated && retry !== false){
      const session = readSession();
      if (session && session.refresh_token){
        session.expires_at = 0;
        localStorage.setItem(sessionKey, JSON.stringify(session));
        const refreshed = await ensureSession();
        if (refreshed) return request(path, options, authenticated, false);
      }
    }
    if (!response.ok) throw new Error(await parseError(response));
    if (response.status === 204) return null;
    const text = await response.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch (_) { return text; }
  }

  function analyticsRpc(name, payload){
    return request('/rest/v1/rpc/' + name, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload || {})
    }, true);
  }

  function formatNumber(value){
    return new Intl.NumberFormat('bg-BG').format(Number(value || 0));
  }

  function analyticsSince(days){
    const since = new Date();
    since.setHours(0,0,0,0);
    since.setDate(since.getDate() - Math.max(0, Number(days || 1) - 1));
    return since;
  }

  function pageLabel(path){
    const raw=String(path || '/');
    const names={
      '/':'Начало','/index.html':'Начало','/uslugi/':'Услуги','/uslugi.html':'Услуги','/traurni-stoki/':'Траурни стоки','/traurni-stoki.html':'Траурни стоки',
      '/kontakti/':'Контакти','/kontakti.html':'Контакти','/faq/':'Често задавани въпроси','/faq.html':'Често задавани въпроси','/za-nas/':'За нас','/za-nas.html':'За нас',
      '/pri-smarten-sluchai/':'При смъртен случай','/pri-smarten-sluchai.html':'При смъртен случай','/organizirane-na-pogrebenie/':'Организиране на погребение','/organizirane-na-pogrebenie.html':'Организиране на погребение',
      '/kremacia/':'Кремация','/kremacia.html':'Кремация','/pomeni/':'Помен и панихида','/pomeni.html':'Помен и панихида','/pogrebalen-transport/':'Погребален транспорт','/pogrebalen-transport.html':'Погребален транспорт',
      '/nekrolozi/':'Некролози','/nekrolozi.html':'Некролози','/politika-za-poveritelnost/':'Политика за поверителност','/politika-za-poveritelnost.html':'Политика за поверителност',
      '/politika-za-biskvitki/':'Политика за бисквитки','/politika-za-biskvitki.html':'Политика за бисквитки','/404.html':'404'
    };
    if(names[raw]) return names[raw];
    if(raw.startsWith('/kategoriya/?category=')||raw.startsWith('/kategoriya.html?category=')){
      const slug=raw.split('category=')[1] || '';
      const cats={kovchezi:'Ковчези',urni:'Урни',krastove:'Кръстове','ritualni-prinadlezhnosti':'Ритуални принадлежности','grobni-prinadlezhnosti':'Гробни принадлежности','venci-i-cvetya':'Венци и цветя',pametnici:'Паметници'};
      return 'Категория: ' + (cats[slug] || slug.replace(/-/g,' '));
    }
    return raw;
  }

  function sourceLabel(source){
    const value=String(source || 'direct').toLowerCase();
    const names={direct:'Директно',google:'Google',facebook:'Facebook',instagram:'Instagram',bing:'Bing',other:'Друг източник'};
    return names[value] || value;
  }

  function phoneLabel(phone){
    const digits=String(phone || '').replace(/\D/g,'');
    if(digits.endsWith('893646668')) return '0893 64 66 68';
    if(digits.endsWith('898242434')) return '0898 24 24 34';
    return phone || 'Неуточнен';
  }

  function setAnalyticsKpis(row){
    row=row || {};
    $('analytics-pageviews').textContent=formatNumber(row.page_views);
    $('analytics-phone-clicks').textContent=formatNumber(row.phone_clicks);
    $('analytics-contact-views').textContent=formatNumber(row.contact_page_views);
    $('analytics-map-opens').textContent=formatNumber(row.map_opens);
    $('analytics-faq-opens').textContent=formatNumber(row.faq_opens);
  }

  function renderAnalyticsList(element, rows, labelFn, valueKey){
    if(!element) return;
    element.replaceChildren();
    if(!Array.isArray(rows) || !rows.length){
      const empty=document.createElement('div'); empty.className='analytics-empty'; empty.textContent='Още няма данни за този период.'; element.appendChild(empty); return;
    }
    rows.forEach((row)=>{
      const item=document.createElement('div'); item.className='analytics-list-row';
      const label=document.createElement('div'); label.className='analytics-list-label'; label.textContent=labelFn(row);
      const value=document.createElement('div'); value.className='analytics-list-value'; value.textContent=formatNumber(row[valueKey]);
      item.append(label,value); element.appendChild(item);
    });
  }

  function localDateKey(date){
    const y=date.getFullYear(); const m=String(date.getMonth()+1).padStart(2,'0'); const d=String(date.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+d;
  }

  function renderAnalyticsChart(rows, days){
    const chart=$('analytics-daily-chart'); if(!chart) return;
    chart.replaceChildren();
    const map=new Map((Array.isArray(rows)?rows:[]).map((r)=>[String(r.day),r]));
    const start=analyticsSince(days); const today=new Date(); today.setHours(0,0,0,0);
    const series=[];
    for(let d=new Date(start); d<=today; d.setDate(d.getDate()+1)){
      const key=localDateKey(d); const r=map.get(key)||{};
      series.push({date:new Date(d),page_views:Number(r.page_views||0),contact_actions:Number(r.contact_actions||0)});
    }
    const max=Math.max(1,...series.map((r)=>Math.max(r.page_views,r.contact_actions)));
    series.forEach((row,index)=>{
      const col=document.createElement('div'); col.className='analytics-day';
      col.title=row.date.toLocaleDateString('bg-BG')+' — '+row.page_views+' преглеждания, '+row.contact_actions+' контактни действия';
      const top=document.createElement('span'); top.className='analytics-day-value';
      if(days<=7 || row.page_views>0 || row.contact_actions>0) top.textContent=row.page_views;
      const bars=document.createElement('div'); bars.className='analytics-bars';
      const page=document.createElement('span'); page.className='analytics-bar page'; page.style.height=Math.max(2,(row.page_views/max)*135)+'px'; page.setAttribute('aria-label',row.page_views+' преглеждания');
      const contact=document.createElement('span'); contact.className='analytics-bar contact'; contact.style.height=Math.max(2,(row.contact_actions/max)*135)+'px'; contact.setAttribute('aria-label',row.contact_actions+' контактни действия');
      bars.append(page,contact);
      const label=document.createElement('span'); label.className='analytics-day-label';
      const showLabel=days<=7 || index===0 || index===series.length-1 || (days<=30 ? index%5===0 : index%14===0);
      label.textContent=showLabel ? row.date.toLocaleDateString('bg-BG',{day:'2-digit',month:'2-digit'}) : '';
      col.append(top,bars,label); chart.appendChild(col);
    });
  }

  function analyticsSchemaMissing(error){
    return /admin_analytics|analytics_events|record_analytics|PGRST202|schema cache|could not find the function|does not exist|404/i.test(String(error && error.message || error || ''));
  }

  async function loadAnalytics(){
    if(analyticsLoading || !analyticsAdminView || analyticsAdminView.hidden) return;
    analyticsLoading=true;
    if(analyticsRefresh){ analyticsRefresh.disabled=true; analyticsRefresh.textContent='Обновяване…'; }
    if(analyticsSetup) analyticsSetup.hidden=true;
    message(analyticsMessage,'Зареждане на статистиката…');
    try{
      const since=analyticsSince(analyticsDays).toISOString();
      const [kpis,daily,pages,sources,phones]=await Promise.all([
        analyticsRpc('admin_analytics_kpis',{p_since:since}),
        analyticsRpc('admin_analytics_daily',{p_since:since}),
        analyticsRpc('admin_analytics_top_pages',{p_since:since,p_limit:10}),
        analyticsRpc('admin_analytics_sources',{p_since:since,p_limit:10}),
        analyticsRpc('admin_analytics_phones',{p_since:since})
      ]);
      setAnalyticsKpis(Array.isArray(kpis)?kpis[0]:kpis);
      renderAnalyticsChart(daily,analyticsDays);
      renderAnalyticsList($('analytics-top-pages'),pages,(r)=>pageLabel(r.page_path),'views');
      renderAnalyticsList($('analytics-sources'),sources,(r)=>sourceLabel(r.source),'views');
      renderAnalyticsList($('analytics-phones'),phones,(r)=>phoneLabel(r.phone),'clicks');
      message(analyticsMessage,'Последно обновяване: '+new Date().toLocaleTimeString('bg-BG',{hour:'2-digit',minute:'2-digit'}),'success');
    } catch(error){
      setAnalyticsKpis({});
      renderAnalyticsChart([],analyticsDays);
      renderAnalyticsList($('analytics-top-pages'),[],()=>'', 'views');
      renderAnalyticsList($('analytics-sources'),[],()=>'', 'views');
      renderAnalyticsList($('analytics-phones'),[],()=>'', 'clicks');
      if(analyticsSchemaMissing(error)){
        if(analyticsSetup) analyticsSetup.hidden=false;
        message(analyticsMessage,'Нужно е еднократното SQL активиране за v1.52.','error');
      }else message(analyticsMessage,'Статистиката не се зареди: '+error.message,'error');
    } finally {
      analyticsLoading=false;
      if(analyticsRefresh){ analyticsRefresh.disabled=false; analyticsRefresh.textContent='Обнови'; }
    }
  }

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

  function applyObituaryPreset(){
    if(!obituaryType) return;
    const preset=OBITUARY_PRESETS[obituaryType.value]||OBITUARY_PRESETS.death;
    $('obituary-title').value=preset.title;
    $('obituary-intro').value=preset.intro;
    const closing=preset.closing[obituaryGender&&obituaryGender.value||'male']||preset.closing.neutral;
    $('obituary-extra-text').value=[preset.extra,closing].filter(Boolean).join('\n\n');
    $('obituary-ceremony-kind').value=preset.ceremony;
    updateObituaryCeremonyFields();
    applyObituaryLayoutPreset();
    updateObituaryCeremonyDateFromDeath(true);
    scheduleObituaryPreview();
  }

  function applyObituaryLayoutPreset(){
    if(!obituaryType||obituaryType.value==='death') return;
    // Replace only automatic copy; retain text the operator has entered.
    const presets=Object.values(OBITUARY_PRESETS);
    const defaults={
      'obituary-title':{values:presets.map(p=>p.title),text:'ТЪЖЕН ПОМЕН'},
      'obituary-intro':{values:[...presets.map(p=>p.intro),'от смъртта на нашия близък','от смъртта на нашата близка'],text:obituaryGender&&obituaryGender.value==='female'?'от смъртта на нашата близка':'от смъртта на нашия близък'},
      'obituary-extra-text':{values:presets.flatMap(p=>[p.extra,...Object.values(p.closing).map(closing=>[p.extra,closing].filter(Boolean).join('\n\n'))]),text:'Да бъде тих и спокоен вечният ти сън!\n\nНикога няма да те забравим!'},
      'obituary-from':{values:['От семейството'],text:'От Семейството'}
    };
    Object.entries(defaults).forEach(([id,preset])=>{
      const input=$(id);
      if(input&&preset.values.includes(input.value)) input.value=preset.text;
    });
  }

  function updateObituaryCeremonyFields(){
    const kind=$('obituary-ceremony-kind').value;
    ['obituary-ceremony-date','obituary-ceremony-time','obituary-ceremony-place'].forEach((id)=>{
      const input=$(id); if(input) input.disabled=kind==='none'||kind==='custom';
    });
    const additional=$('obituary-extra-ceremonies');
    const text=$('obituary-ceremony-text'); if(text) text.disabled=kind==='none'&&!(additional&&additional.children.length);
  }

  function parseObituaryDate(value){
    return parseBookletDate(value);
  }

  function formatObituaryShortDate(date){
    if(!date) return '';
    return new Intl.DateTimeFormat('bg-BG',{day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
  }

  function formatObituaryLongDate(date){
    if(!date) return '';
    return new Intl.DateTimeFormat('bg-BG',{day:'numeric',month:'long',year:'numeric'}).format(date);
  }

  function calculateObituaryAge(birth,death){
    if(!birth||!death||death<birth) return null;
    let age=death.getFullYear()-birth.getFullYear();
    const beforeBirthday=death.getMonth()<birth.getMonth()||(death.getMonth()===birth.getMonth()&&death.getDate()<birth.getDate());
    if(beforeBirthday) age-=1;
    return age>=0&&age<=130?age:null;
  }

  function updateObituaryAgeFromDates(){
    const birth=parseObituaryDate(obituaryBirthDate&&obituaryBirthDate.value);
    const death=parseObituaryDate(obituaryDeathDate&&obituaryDeathDate.value);
    const calculated=calculateObituaryAge(birth,death);
    if(calculated!==null){ obituaryAge.value=String(calculated); obituaryAgeIsAutomatic=true; }
    else if(obituaryAgeIsAutomatic&&obituaryAge) obituaryAge.value='';
    updateObituaryCeremonyDateFromDeath(false);
    scheduleObituaryPreview();
  }

  function updateObituaryCeremonyDateFromDeath(force){
    const input=$('obituary-ceremony-date');
    const death=parseObituaryDate(obituaryDeathDate&&obituaryDeathDate.value);
    if(!input) return;
    if(!death){ if(force&&obituaryCeremonyDateIsAutomatic) input.value=''; return; }
    let calculated=null;
    if(obituaryType&&obituaryType.value==='day40') calculated=addBookletDays(death,39);
    if(obituaryType&&obituaryType.value==='month3') calculated=addBookletMonths(death,3);
    if(obituaryType&&obituaryType.value==='month6') calculated=addBookletMonths(death,6);
    if(obituaryType&&obituaryType.value==='month9') calculated=addBookletMonths(death,9);
    if(obituaryType&&obituaryType.value==='year1') calculated=addBookletMonths(death,12);
    if(calculated&&(force||obituaryCeremonyDateIsAutomatic||!input.value)){
      input.value=bookletDateValue(calculated); obituaryCeremonyDateIsAutomatic=true;
    }else if(force&&obituaryCeremonyDateIsAutomatic) input.value='';
  }

  function clampObituaryPhoto(value,min,max){
    return Math.max(min,Math.min(max,value));
  }

  function applyObituaryPhotoControls(settings,shouldSchedule){
    const next=Object.assign({fit:'contain',zoom:100,x:0,y:0},settings||{});
    if(obituaryPhotoFit) obituaryPhotoFit.value=next.fit;
    if(obituaryPhotoZoom) obituaryPhotoZoom.value=String(Math.round(clampObituaryPhoto(Number(next.zoom||100),50,220)));
    if(obituaryPhotoZoomValue&&obituaryPhotoZoom) obituaryPhotoZoomValue.textContent=obituaryPhotoZoom.value+'%';
    if(obituaryPhotoX) obituaryPhotoX.value=String(Math.round(clampObituaryPhoto(Number(next.x||0),-100,100)));
    if(obituaryPhotoY) obituaryPhotoY.value=String(Math.round(clampObituaryPhoto(Number(next.y||0),-100,100)));
    if(shouldSchedule!==false) scheduleObituaryPreview();
  }

  function useOriginalObituaryPhoto(shouldSchedule){
    applyObituaryPhotoControls({fit:'contain',zoom:100,x:0,y:0},shouldSchedule);
  }

  function applyObituarySecondPhotoControls(settings,shouldSchedule){
    const next=Object.assign({fit:'contain',zoom:100,x:0,y:0},settings||{}),ui=obituarySecondPhotoUi;
    if(ui.fit) ui.fit.value=next.fit;
    if(ui.zoom) ui.zoom.value=String(Math.round(clampObituaryPhoto(Number(next.zoom||100),50,220)));
    if(ui.zoomValue&&ui.zoom) ui.zoomValue.textContent=ui.zoom.value+'%';
    if(ui.x) ui.x.value=String(Math.round(clampObituaryPhoto(Number(next.x||0),-100,100)));
    if(ui.y) ui.y.value=String(Math.round(clampObituaryPhoto(Number(next.y||0),-100,100)));
    if(shouldSchedule!==false) scheduleObituaryPreview();
  }

  function useOriginalObituarySecondPhoto(shouldSchedule){
    obituaryLocalImages.second.adjustmentRequest+=1;
    applyObituarySecondPhotoControls({fit:'contain',zoom:100,x:0,y:0},shouldSchedule);
  }

  async function applyAutoObituarySecondPhoto(shouldSchedule){
    const slot=obituaryLocalImages.second,image=slot.image;
    if(!image) return null;
    const imageRequest=slot.request,adjustmentRequest=++slot.adjustmentRequest;
    let preset=slot.autoPreset;
    if(!preset){
      const face=await detectObituaryPrimaryFace(image);
      preset=buildObituaryAutoPhotoPreset(image,face,{width:300,height:350});
    }
    // A late face result must not replace a newer upload or a manual adjustment.
    if(image!==slot.image||imageRequest!==slot.request||adjustmentRequest!==slot.adjustmentRequest||(obituarySecondPhotoUi.auto&&!obituarySecondPhotoUi.auto.checked)) return null;
    slot.autoPreset=preset;
    applyObituarySecondPhotoControls(preset,shouldSchedule);
    return preset;
  }

  async function detectObituaryPrimaryFace(image){
    if(typeof window.FaceDetector!=='function') return null;
    try{
      const detector=new window.FaceDetector({fastMode:true,maxDetectedFaces:5});
      const faces=await detector.detect(image);
      if(!Array.isArray(faces)||!faces.length) return null;
      faces.sort((a,b)=>{
        const boxA=a&&a.boundingBox?a.boundingBox:{width:0,height:0};
        const boxB=b&&b.boundingBox?b.boundingBox:{width:0,height:0};
        return (boxB.width*boxB.height)-(boxA.width*boxA.height);
      });
      return faces[0].boundingBox||null;
    }catch(error){
      console.warn('Face detection failed:', error&&error.message?error.message:error);
      return null;
    }
  }

  function buildObituaryAutoPhotoPreset(image,face,frame){
    const imageWidth=image.naturalWidth||image.width||1;
    const imageHeight=image.naturalHeight||image.height||1;
    const frameWidth=frame&&frame.width||370;
    const frameHeight=frame&&frame.height||465;

    if(!face||!face.width||!face.height){
      if(imageWidth>imageHeight*1.18){
        return {fit:'cover',zoom:108,x:0,y:-12,reason:'fallback'};
      }
      return {fit:'contain',zoom:100,x:0,y:0,reason:'fallback'};
    }

    const baseCover=Math.max(frameWidth/imageWidth,frameHeight/imageHeight);
    const targetFaceHeight=frameHeight*(imageWidth>imageHeight?0.48:0.42);
    const desiredScale=Math.max(baseCover,targetFaceHeight/Math.max(1,face.height));
    let zoom=Math.round((desiredScale/baseCover)*100);
    zoom=clampObituaryPhoto(zoom,85,175);

    const scale=baseCover*Math.max(.5,zoom/100);
    const drawWidth=imageWidth*scale;
    const drawHeight=imageHeight*scale;
    const overflowX=Math.max(0,drawWidth-frameWidth);
    const overflowY=Math.max(0,drawHeight-frameHeight);

    let focusX=(face.x+face.width/2)*scale;
    let focusY=(face.y+face.height*.42)*scale;

    let offsetX=drawWidth/2-focusX;
    let offsetY=drawHeight/2-focusY;

    const faceTopPosition=(frameHeight-drawHeight)/2+offsetY+face.y*scale;
    const minimumTopMargin=frameHeight*.08;
    if(faceTopPosition<minimumTopMargin) offsetY+=minimumTopMargin-faceTopPosition;

    offsetX=clampObituaryPhoto(offsetX,-overflowX/2,overflowX/2);
    offsetY=clampObituaryPhoto(offsetY,-overflowY/2,overflowY/2);

    const x=overflowX?Math.round((offsetX/(overflowX/2))*100):0;
    const y=overflowY?Math.round((offsetY/(overflowY/2))*100):0;

    return {fit:'cover',zoom:zoom,x:clampObituaryPhoto(x,-100,100),y:clampObituaryPhoto(y,-100,100),reason:'face'};
  }

  async function applyAutoObituaryPhoto(shouldSchedule){
    if(!obituaryPhotoImage) return null;
    if(!obituaryPhotoAutoPreset){
      const face=await detectObituaryPrimaryFace(obituaryPhotoImage);
      obituaryPhotoAutoPreset=buildObituaryAutoPhotoPreset(obituaryPhotoImage,face);
    }
    applyObituaryPhotoControls(obituaryPhotoAutoPreset,shouldSchedule);
    return obituaryPhotoAutoPreset;
  }

  function resetObituaryPhoto(){
    if(obituaryPhotoUrl) URL.revokeObjectURL(obituaryPhotoUrl);
    obituaryPhotoUrl=''; obituaryPhotoImage=null; obituaryPhotoAutoPreset=null;
    if(obituaryPhoto) obituaryPhoto.value='';
    if(obituaryPhotoName) obituaryPhotoName.textContent='Няма избрана снимка';
    if(obituaryPhotoControls) obituaryPhotoControls.hidden=true;
    if(obituaryRemovePhoto) obituaryRemovePhoto.hidden=true;
    if(obituaryPhotoTools) obituaryPhotoTools.hidden=true;
    if(obituaryPhotoAuto) obituaryPhotoAuto.checked=true;
    useOriginalObituaryPhoto(false);
    scheduleObituaryPreview();
  }

  async function setObituaryPhoto(file){
    if(!file){ resetObituaryPhoto(); return {autoApplied:false,reason:'empty'}; }
    if(file.size>25*1024*1024) throw new Error('Снимката е прекалено голяма. Изберете файл до 25 MB.');
    const url=URL.createObjectURL(file);
    let image;
    try{
      image=await new Promise((resolve,reject)=>{
        const candidate=new Image();
        candidate.onload=()=>resolve(candidate);
        candidate.onerror=()=>reject(new Error('Снимката не може да бъде отворена. Изберете JPG, PNG или WebP файл.'));
        candidate.src=url;
      });
    }catch(error){ URL.revokeObjectURL(url); throw error; }

    if(obituaryPhotoUrl) URL.revokeObjectURL(obituaryPhotoUrl);
    obituaryPhotoUrl=url; obituaryPhotoImage=image; obituaryPhotoAutoPreset=null;

    if(obituaryPhotoName) obituaryPhotoName.textContent=file.name;
    if(obituaryPhotoControls) obituaryPhotoControls.hidden=false;
    if(obituaryRemovePhoto) obituaryRemovePhoto.hidden=false;
    if(obituaryPhotoTools) obituaryPhotoTools.hidden=false;

    useOriginalObituaryPhoto(false);

    let preset={reason:'original'};
    if(!obituaryPhotoAuto||obituaryPhotoAuto.checked){
      preset=await applyAutoObituaryPhoto(false)||{reason:'fallback'};
    }

    scheduleObituaryPreview();
    return {autoApplied:!obituaryPhotoAuto||obituaryPhotoAuto.checked,reason:preset.reason||'original'};
  }

  function readObituaryModel(allowIncomplete){
    const title=String($('obituary-title').value||'').trim()||(allowIncomplete?'СКРЪБНА ВЕСТ':'');
    const name=String($('obituary-name').value||'').trim()||(allowIncomplete?'Име Презиме Фамилия':'');
    if(!title) throw new Error('Въведете заглавие на некролога.');
    if(!name) throw new Error('Въведете името на покойника.');
    const birth=parseObituaryDate(obituaryBirthDate&&obituaryBirthDate.value);
    const death=parseObituaryDate(obituaryDeathDate&&obituaryDeathDate.value);
    if(!allowIncomplete&&birth&&death&&death<birth) throw new Error('Датата на смъртта не може да бъде преди датата на раждане.');
    const rawAge=String(obituaryAge&&obituaryAge.value||'').trim();
    let age=rawAge===''?null:Number(rawAge);
    if(age!==null&&(!Number.isInteger(age)||age<0||age>130)){if(!allowIncomplete) throw new Error('Проверете въведената възраст.');age=null;}
    const secondName=String($('obituary-second-name')&&$('obituary-second-name').value||'').trim();
    const secondAgeValue=String($('obituary-second-age')&&$('obituary-second-age').value||'').trim();
    let secondAge=secondAgeValue===''?null:Number(secondAgeValue);
    if(obituaryDesign.value==='double'&&!allowIncomplete&&!secondName) throw new Error('Въведете името на втория покойник.');
    if(secondAge!==null&&(!Number.isInteger(secondAge)||secondAge<0||secondAge>130)){if(obituaryDesign.value==='double'&&!allowIncomplete) throw new Error('Проверете възрастта на втория човек.');secondAge=null;}
    if(!allowIncomplete){
      if(obituaryDesign.value==='background'&&!obituaryLocalImages.background.image) throw new Error('Изберете снимка за фон.');
      if(obituaryRequiredArtwork(obituaryDesign.value).some((key)=>!obituaryArtwork[key].image)) throw new Error('Оформлението се зарежда. Изчакайте малко и опитайте отново.');
    }
    return {
      type:obituaryType.value,
      design:obituaryDesign.value,
      output:obituaryOutput.value,
      gender:obituaryGender.value,
      title,
      intro:String($('obituary-intro').value||'').trim(),
      name,
      birth,
      death,
      age,
      ceremonyKind:$('obituary-ceremony-kind').value,
      ceremonyDate:parseObituaryDate($('obituary-ceremony-date').value),
      ceremonyTime:String($('obituary-ceremony-time').value||'').trim(),
      ceremonyPlace:String($('obituary-ceremony-place').value||'').trim(),
      ceremonyText:String($('obituary-ceremony-text')&&$('obituary-ceremony-text').value||'').trim(),
      additionalCeremonies:readAdditionalObituaryCeremonies(),
      extraText:String($('obituary-extra-text').value||'').trim(),
      from:String($('obituary-from').value||'').trim(),
      agencyFooter:Boolean($('obituary-agency-footer').checked),
      photo:obituaryPhotoImage,
      photoFit:obituaryPhotoFit&&obituaryPhotoFit.value||'contain',
      photoZoom:Number(obituaryPhotoZoom&&obituaryPhotoZoom.value||100),
      photoX:Number(obituaryPhotoX&&obituaryPhotoX.value||0),
      photoY:Number(obituaryPhotoY&&obituaryPhotoY.value||0),
      firstPeriod:String($('obituary-first-period')&&$('obituary-first-period').value||'').trim(),
      secondPerson:obituaryDesign.value==='double'?{
        name:secondName||(allowIncomplete?'Име Презиме Фамилия':''),
        period:String($('obituary-second-period')&&$('obituary-second-period').value||'').trim(),age:secondAge,
        photo:obituaryLocalImages.second.image,
        photoFit:obituarySecondPhotoUi.fit&&obituarySecondPhotoUi.fit.value||'contain',
        photoZoom:Number(obituarySecondPhotoUi.zoom&&obituarySecondPhotoUi.zoom.value||100),
        photoX:Number(obituarySecondPhotoUi.x&&obituarySecondPhotoUi.x.value||0),
        photoY:Number(obituarySecondPhotoUi.y&&obituarySecondPhotoUi.y.value||0)
      }:null,
      background:obituaryDesign.value==='background'?obituaryLocalImages.background.image:null,
      backgroundFit:$('obituary-background-fit')&&$('obituary-background-fit').value||'cover',
      backgroundColor:$('obituary-background-color')&&$('obituary-background-color').value||'white',
      backgroundZoom:Number($('obituary-background-zoom')&&$('obituary-background-zoom').value||100),
      backgroundX:Number($('obituary-background-x')&&$('obituary-background-x').value||0),
      backgroundY:Number($('obituary-background-y')&&$('obituary-background-y').value||0),
      backgroundOutline:Boolean($('obituary-background-outline')&&$('obituary-background-outline').checked),
      artworkRevision:obituaryArtworkRevision
    };
  }

  let obituaryCeremonySequence=0;

  function readAdditionalObituaryCeremonies(){
    const container=$('obituary-extra-ceremonies');
    if(!container) return [];
    return Array.from(container.querySelectorAll('.obituary-extra-ceremony'),(row)=>({
      kind:row.querySelector('[data-obituary-ceremony="kind"]').value,
      date:parseObituaryDate(row.querySelector('[data-obituary-ceremony="date"]').value),
      time:row.querySelector('[data-obituary-ceremony="time"]').value.trim(),
      place:row.querySelector('[data-obituary-ceremony="place"]').value.trim()
    }));
  }

  function renumberObituaryCeremonies(){
    const container=$('obituary-extra-ceremonies');
    if(container) Array.from(container.children).forEach((row,index)=>{row.querySelector('legend').textContent='Церемония '+(index+2);});
  }

  function addObituaryCeremony(){
    const container=$('obituary-extra-ceremonies');
    if(!container) return;
    const id='obituary-extra-ceremony-'+(++obituaryCeremonySequence);
    const row=document.createElement('fieldset'); row.className='obituary-extra-ceremony';
    row.innerHTML='<legend>Церемония</legend>'+
      '<div class="obituary-ceremony-grid">'+
        '<label for="'+id+'-kind">Вид<select id="'+id+'-kind" data-obituary-ceremony="kind">'+
          '<option value="viewing">Поклонение</option><option value="service">Опело</option><option value="funeral" selected>Погребение</option><option value="memorial">Панихида</option>'+
        '</select></label>'+
        '<label for="'+id+'-date">Дата<input id="'+id+'-date" data-obituary-ceremony="date" type="date"/></label>'+
        '<label for="'+id+'-time">Час<input id="'+id+'-time" data-obituary-ceremony="time" type="time"/></label>'+
      '</div>'+
      '<label for="'+id+'-place">Място<input id="'+id+'-place" data-obituary-ceremony="place" type="text" placeholder="Напр. гробищен парк с. Коняво"/></label>'+
      '<button class="small-button" type="button" data-remove-ceremony>Премахни тази церемония</button>';
    row.querySelector('[data-obituary-ceremony="date"]').value=$('obituary-ceremony-date').value;
    row.querySelectorAll('input,select').forEach((input)=>{
      input.addEventListener('input',scheduleObituaryPreview);
      input.addEventListener('change',scheduleObituaryPreview);
    });
    row.querySelector('[data-remove-ceremony]').addEventListener('click',()=>{
      row.remove(); renumberObituaryCeremonies(); updateObituaryCeremonyFields(); scheduleObituaryPreview();
    });
    container.appendChild(row); renumberObituaryCeremonies(); updateObituaryCeremonyFields(); scheduleObituaryPreview();
    row.querySelector('[data-obituary-ceremony="kind"]').focus();
    return row;
  }

  const obituaryAddCeremonyButton=$('obituary-add-ceremony');
  if(obituaryAddCeremonyButton) obituaryAddCeremonyButton.addEventListener('click',addObituaryCeremony);

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
    if(design==='crosses'){
      drawObituaryCornerCross(ctx,150,160,104,color); drawObituaryCornerCross(ctx,1090,160,104,color);
    }else if(design==='angels'||design==='doves'){
      drawObituaryAngel(ctx,150,170,170,false); drawObituaryAngel(ctx,1090,170,170,true);
    }
    ctx.restore();
  }

  function drawObituaryPortrait(ctx,image,x,y,width,height,model,dark){
    const imageWidth=image.naturalWidth||image.width; const imageHeight=image.naturalHeight||image.height;
    const base=model.photoFit==='cover'?Math.max(width/imageWidth,height/imageHeight):Math.min(width/imageWidth,height/imageHeight);
    const scale=base*Math.max(.5,model.photoZoom/100);
    const drawWidth=imageWidth*scale; const drawHeight=imageHeight*scale;
    const overflowX=Math.max(0,drawWidth-width); const overflowY=Math.max(0,drawHeight-height);
    const offsetX=(Math.max(-100,Math.min(100,model.photoX))/100)*(overflowX/2);
    const offsetY=(Math.max(-100,Math.min(100,model.photoY))/100)*(overflowY/2);
    ctx.save(); ctx.beginPath(); ctx.rect(x,y,width,height); ctx.clip();
    ctx.drawImage(image,x+(width-drawWidth)/2+offsetX,y+(height-drawHeight)/2+offsetY,drawWidth,drawHeight); ctx.restore();
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
    const firstPeriod=model.firstPeriod||OBITUARY_PERIODS[model.type]||'';
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
    const period=OBITUARY_PERIODS[model.type]||'';
    const title=model.type!=='death'&&model.title==='ВЪЗПОМЕНАНИЕ'?'ТЪЖЕН ПОМЕН':model.title;
    drawText(title,120,{size:88*scale,maxWidth:silver?740:['angels','doves'].includes(model.design)?760:model.design==='crosses'?860:1020,maxHeight:104,style:silver?'italic':'normal'});
    if(period) drawText(period,224,{size:80*scale,maxHeight:90});
    let intro=model.intro;
    if(model.type==='death'&&intro==='С много болка съобщаваме,') intro+='\n'+(model.death?'че на '+formatObituaryShortDate(model.death)+' ':'')+'ни напусна';
    drawText(intro,period?318:260,{size:43*scale,weight:'normal',maxHeight:period?60:90});

    if(model.photo) drawObituaryPortrait(ctx,model.photo,silver?470:180,376,silver?260:380,442,model,dark);
    const parts=obituaryNameParts(model.name);
    const nameX=model.photo?(silver?955:850):textX, nameWidth=model.photo?(silver?360:540):(silver?660:980);
    const nameStep=parts.length>1?Math.min(144,288/(parts.length-1)):0;
    parts.forEach((part,index)=>drawText(part,378+index*nameStep,{x:nameX,maxWidth:nameWidth,maxHeight:Math.min(114,nameStep||114),size:96*scale}));
    if(model.age!==null) drawText(model.age+'г.',790,{x:nameX,maxWidth:nameWidth,size:62*scale,maxHeight:76});

    drawText(model.extraText,950,{size:60*scale,style:'italic',maxWidth:textWidth,maxHeight:360,blankLineFactor:35/56});
    const ceremonyText=buildObituaryCeremonyText(model);
    const expandedCeremony=(model.additionalCeremonies||[]).some((ceremony)=>formatObituaryCeremonyText(ceremony))||ceremonyText.split(/\r?\n/).filter((line)=>line.trim()).length>2;
    drawText(ceremonyText,expandedCeremony?1345:1360,{size:43*scale,weight:'bold',maxWidth:textWidth,maxHeight:expandedCeremony?220:138,wrap:Boolean(model.ceremonyText)});
    drawText(model.from,expandedCeremony?1600:1530,{x:1110,size:60*scale,style:'italic',align:'right',maxWidth:980,maxHeight:85});
    if(model.agencyFooter) drawObituaryFooter(ctx,geometry,model.design==='candle'?ink:'#000');
    return 1754;
  }

  function createObituaryCanvas(model,targetCanvas,pixelRatio){
    const ratio=pixelRatio||((model.design==='background'&&model.background)?Math.min(3,Math.max(2,Math.min((model.background.naturalWidth||model.background.width)/1240,(model.background.naturalHeight||model.background.height)/1754))):1);
    const canvas=targetCanvas||document.createElement('canvas'); canvas.width=Math.round(1240*ratio); canvas.height=Math.round(1754*ratio);
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.scale(canvas.width/1240,canvas.height/1754);
    paintObituary(ctx,model,1);
    return canvas;
  }

  function scheduleObituaryPreview(){
    window.clearTimeout(obituaryThumbnailTimer);
    obituaryThumbnailTimer=window.setTimeout(renderObituaryDesignThumbnail,80);
    // Keep print pixels ready before Ctrl+P opens the browser's print snapshot.
    try{ prepareObituaryPrintPixels(readObituaryModel()); }catch(error){ obituaryPrintCache=null; }
    if(!obituaryPreviewArea||obituaryPreviewArea.hidden) return;
    if(obituaryDownloadButton) obituaryDownloadButton.disabled=true;
    if(obituaryPrintButton) obituaryPrintButton.disabled=true;
    window.clearTimeout(obituaryPreviewTimer);
    obituaryPreviewTimer=window.setTimeout(()=>{
      renderObituaryPreview(false).catch((error)=>message(obituaryMessage,error.message||'Прегледът не можа да бъде обновен.','error'));
    },120);
  }

  async function renderObituaryPreview(scroll){
    await loadObituaryArtwork(obituaryDesign.value);
    const model=readObituaryModel();
    prepareObituaryPrintPixels(model);
    message(obituaryMessage,'Създаване на преглед…');
    await createObituaryCanvas(model,obituaryPreviewCanvas);
    obituaryPreviewArea.hidden=false;
    obituaryDownloadButton.disabled=false;
    if(obituaryPrintButton) obituaryPrintButton.disabled=false;
    obituaryPreviewFormat.textContent=model.output==='a5x2'?'A4 хоризонтално — два еднакви некролога за изрязване':'A4 — една страница';
    message(obituaryMessage,'Некрологът е готов за проверка и изтегляне.','success');
    if(scroll!==false) obituaryPreviewArea.scrollIntoView({behavior:'smooth',block:'start'});
    return model;
  }

  function setObituaryPrintPage(output){
    const style=$('obituary-print-page');
    // Apply the orientation to the whole document, without a named-page transition.
    if(style) style.textContent='@media print{@page{size:A4 '+(output==='a5x2'?'landscape':'portrait')+';margin:5mm}}';
  }

  function clearObituaryPrint(){
    document.body.classList.remove('obituary-print-ready');
    const style=$('obituary-print-page'); if(style) style.textContent='';
    if(obituaryPrintRoot){ obituaryPrintRoot.hidden=true; obituaryPrintRoot.replaceChildren(); }
  }

  let obituaryPrintCache=null;

  function prepareObituaryPrintPixels(model){
    const secondPhoto=model.secondPerson&&model.secondPerson.photo;
    const key=JSON.stringify(Object.assign({},model,{photo:null,background:null,secondPerson:model.secondPerson?Object.assign({},model.secondPerson,{photo:null}):null}));
    if(obituaryPrintCache&&obituaryPrintCache.key===key&&obituaryPrintCache.photo===model.photo&&obituaryPrintCache.secondPhoto===secondPhoto&&obituaryPrintCache.background===model.background) return obituaryPrintCache.canvases;
    const source=createObituaryCanvas(model);
    const copies=model.output==='a5x2'?2:1;
    const canvases=[];
    for(let index=0;index<copies;index+=1){
      const copy=document.createElement('canvas'); copy.width=source.width; copy.height=source.height;
      copy.getContext('2d',{alpha:false}).drawImage(source,0,0);
      canvases.push(copy);
    }
    obituaryPrintCache={key,photo:model.photo,secondPhoto,background:model.background,canvases};
    return canvases;
  }

  function prepareObituaryPrint(){
    if(!obituaryPrintRoot) throw new Error('Обновете страницата, за да заредите печата на некролози.');
    const model=readObituaryModel();
    const canvases=prepareObituaryPrintPixels(model),copies=canvases.length;
    setObituaryPrintPage(model.output);
    obituaryPrintRoot.replaceChildren(...canvases);
    obituaryPrintRoot.className='obituary-print-sheet '+(copies===2?'obituary-print-landscape':'obituary-print-portrait');
    obituaryPrintRoot.hidden=false;
    document.body.classList.add('obituary-print-ready');
    // Flush print geometry before the browser snapshots newly rendered canvases.
    if(obituaryPrintRoot.getBoundingClientRect) obituaryPrintRoot.getBoundingClientRect();
    return model;
  }

  function printObituary(){
    try{ prepareObituaryPrint(); window.print(); }
    catch(error){ clearObituaryPrint(); message(obituaryMessage,error.message||'Некрологът не можа да бъде подготвен за печат.','error'); }
  }

  window.addEventListener('beforeprint',()=>{
    if(!obituaryAdminView||obituaryAdminView.hidden||document.body.classList.contains('obituary-print-ready')) return;
    try{ prepareObituaryPrint(); }
    catch(error){
      message(obituaryMessage,error.message||'Създайте преглед преди печат.','error');
      if(obituaryPrintRoot){
        obituaryPrintRoot.replaceChildren();
        obituaryPrintRoot.textContent=error.message||'Създайте преглед преди печат.';
        setObituaryPrintPage('a4');
        obituaryPrintRoot.className='obituary-print-sheet obituary-print-portrait';
        obituaryPrintRoot.hidden=false; document.body.classList.add('obituary-print-ready');
      }
    }
  });
  window.addEventListener('afterprint',clearObituaryPrint);
  if(obituaryPrintButton) obituaryPrintButton.addEventListener('click',printObituary);

  async function downloadObituaryPdf(){
    if(!window.PDFLib||!window.PDFLib.PDFDocument) throw new Error('PDF модулът не е зареден. Обновете страницата и опитайте отново.');
    await loadObituaryArtwork(obituaryDesign.value);
    const model=readObituaryModel(); const canvas=await createObituaryCanvas(model);
    const pdf=await window.PDFLib.PDFDocument.create();
    pdf.setTitle('Некролог - '+model.name); pdf.setAuthor('Траурна агенция Ден и Нощ'); pdf.setCreator('deninosht.bg');
    const image=await pdf.embedJpg(canvas.toDataURL('image/jpeg',.98));
    const geometry=obituaryPrintGeometry(model.output),mm=72/25.4;
    const page=pdf.addPage([geometry.pageWidth*mm,geometry.pageHeight*mm]);
    for(let index=0;index<geometry.copies;index+=1){
      page.drawImage(image,{x:(geometry.margin+index*geometry.cellWidth)*mm,y:geometry.margin*mm,width:geometry.panelWidth*mm,height:geometry.panelHeight*mm});
    }
    if(geometry.copies===2){
      const middle=geometry.pageWidth*mm/2;
      page.drawLine({start:{x:middle,y:geometry.margin*mm},end:{x:middle,y:(geometry.pageHeight-geometry.margin)*mm},thickness:.7,color:window.PDFLib.rgb(.72,.69,.66),dashArray:[5,5]});
    }
    const bytes=await pdf.save({useObjectStreams:true}); const blob=new Blob([bytes],{type:'application/pdf'}); const url=URL.createObjectURL(blob);
    const link=document.createElement('a'); link.href=url; link.download='nekrolog-'+slugify(model.name)+'.pdf'; link.rel='noopener';
    if(/iPad|iPhone|iPod/i.test(navigator.userAgent||'')) link.target='_blank';
    document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(()=>URL.revokeObjectURL(url),60000);
  }

  function resetObituaryForm(){
    clearObituaryPrint();
    if(!obituaryForm) return;
    const ceremonies=$('obituary-extra-ceremonies'); if(ceremonies) ceremonies.replaceChildren();
    obituaryCeremonySequence=0;
    obituaryForm.reset(); resetObituaryPhoto(); resetObituaryLocalImage('background'); resetObituaryLocalImage('second'); updateObituaryDesignFields(); obituaryAgeIsAutomatic=true; obituaryCeremonyDateIsAutomatic=true; applyObituaryPreset();
    const backgroundZoom=$('obituary-background-zoom-value');if(backgroundZoom) backgroundZoom.textContent='100%';
    window.clearTimeout(obituaryPreviewTimer);
    if(obituaryPreviewArea) obituaryPreviewArea.hidden=true;
    if(obituaryDownloadButton) obituaryDownloadButton.disabled=true;
    if(obituaryPrintButton) obituaryPrintButton.disabled=true;
    message(obituaryMessage,'Формата е изчистена.');
  }

  function parseBookletDate(value){
    const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(!match) return null;
    const date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]),12,0,0,0);
    return Number.isNaN(date.getTime())?null:date;
  }

  function bookletDateValue(date){
    return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
  }

  function addBookletDays(date,days){
    const result=new Date(date); result.setDate(result.getDate()+days); return result;
  }

  function addBookletMonths(date,months){
    const targetMonth=date.getMonth()+months;
    const year=date.getFullYear()+Math.floor(targetMonth/12);
    const month=((targetMonth%12)+12)%12;
    const lastDay=new Date(year,month+1,0,12).getDate();
    return new Date(year,month,Math.min(date.getDate(),lastDay),12);
  }

  function formatBookletDate(date){
    if(!date) return '—';
    return new Intl.DateTimeFormat('bg-BG',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(date);
  }

  function calculateBookletDates(){
    const death=parseBookletDate(bookletDeathDate&&bookletDeathDate.value);
    if(!death){
      invalidateBookletPreview();
      message(bookletMessage,'Въведете дата на смъртта.','error');
      return false;
    }
    const values={
      day3:addBookletDays(death,2), day9:addBookletDays(death,8), day20:addBookletDays(death,19), day40:addBookletDays(death,39),
      month3:addBookletMonths(death,3), month6:addBookletMonths(death,6), month9:addBookletMonths(death,9), year1:addBookletMonths(death,12)
    };
    Object.keys(values).forEach((key)=>{ const input=document.querySelector('[data-booklet-date="'+key+'"]'); if(input) input.value=bookletDateValue(values[key]); });
    invalidateBookletPreview();
    message(bookletMessage,'Датите са изчислени. Може да ги поправите ръчно преди печат.','success');
    return true;
  }

  function invalidateBookletPreview(){
    resetManualBookletPrint();
    if(bookletPrintButton) bookletPrintButton.disabled=true;
    if(bookletPreviewArea) bookletPreviewArea.hidden=true;
  }

  function addZadushnitsaRow(name,date){
    if(!bookletZadushnitsiList) return;
    if(bookletZadushnitsiList.children.length>=6){
      message(bookletMessage,'Може да добавите до 6 Задушници в една книжка.','error');
      return;
    }
    const row=document.createElement('div'); row.className='booklet-zadushnitsa-row';
    const nameLabel=document.createElement('label'); nameLabel.textContent='Наименование';
    const nameInput=document.createElement('input'); nameInput.type='text'; nameInput.maxLength=70; nameInput.placeholder='Напр. Месопустна Задушница'; nameInput.className='booklet-zadushnitsa-name'; nameInput.value=name||''; nameLabel.appendChild(nameInput);
    const dateLabel=document.createElement('label'); dateLabel.textContent='Дата';
    const dateInput=document.createElement('input'); dateInput.type='date'; dateInput.className='booklet-zadushnitsa-date'; dateInput.value=date||''; dateLabel.appendChild(dateInput);
    const remove=document.createElement('button'); remove.type='button'; remove.className='small-button danger booklet-zadushnitsa-remove'; remove.textContent='Премахни'; remove.setAttribute('aria-label','Премахни Задушницата');
    nameInput.addEventListener('input',invalidateBookletPreview); dateInput.addEventListener('input',invalidateBookletPreview);
    remove.addEventListener('click',()=>{ row.remove(); invalidateBookletPreview(); });
    row.append(nameLabel,dateLabel,remove); bookletZadushnitsiList.appendChild(row); invalidateBookletPreview();
  }

  function readZadushnitsi(){
    if(!bookletZadushnitsiList) return [];
    return Array.from(bookletZadushnitsiList.querySelectorAll('.booklet-zadushnitsa-row')).map((row)=>{
      const name=String(row.querySelector('.booklet-zadushnitsa-name').value||'').trim();
      const value=row.querySelector('.booklet-zadushnitsa-date').value;
      const date=parseBookletDate(value);
      if((name&&!date)||(!name&&value)) throw new Error('За всяка Задушница попълнете и наименование, и дата.');
      return name&&date?{name,date}:null;
    }).filter(Boolean);
  }

  function readBookletModel(){
    const death=parseBookletDate(bookletDeathDate&&bookletDeathDate.value);
    if(!death) throw new Error('Въведете дата на смъртта.');
    const dates={};
    document.querySelectorAll('[data-booklet-date]').forEach((input)=>{ dates[input.dataset.bookletDate]=parseBookletDate(input.value); });
    const missing=Object.keys(dates).find((key)=>!dates[key]);
    if(missing || Object.keys(dates).length!==8) throw new Error('Попълнете всички дати за панихидите.');
    return {name:String(bookletName&&bookletName.value||'').trim(),death,dates,zadushnitsi:readZadushnitsi()};
  }

  function appendBookletText(parent,tag,text,className){
    const element=document.createElement(tag); if(className) element.className=className; element.textContent=text; parent.appendChild(element); return element;
  }

  function appendBookletList(parent,items){
    const list=document.createElement('ul'); list.className='booklet-page-list';
    items.forEach((text)=>appendBookletText(list,'li',text)); parent.appendChild(list);
  }

  function appendAgencyHelp(parent){
    appendBookletText(parent,'p','Траурна агенция „Ден и Нощ“ може да съдейства със свещеник, некролози, раздавки, свещи, цветя и всичко необходимо за панихидата.','booklet-agency-help');
  }

  function createBookletPage(pageNumber,model){
    const page=document.createElement('article'); page.className='booklet-page booklet-page-'+pageNumber; page.dataset.page=String(pageNumber);
    const content=document.createElement('div'); content.className='booklet-page-content'; page.appendChild(content);
    const dateLine=(key)=>formatBookletDate(model.dates[key]);

    if(pageNumber===1){
      page.classList.add('booklet-cover');
      const coverLogoBadge=document.createElement('div'); coverLogoBadge.className='booklet-logo-badge booklet-cover-logo';
      const coverLogo=document.createElement('img'); coverLogo.src='../assets/logo-den-i-nosht.webp'; coverLogo.alt='Траурна агенция „Ден и Нощ“'; coverLogoBadge.appendChild(coverLogo); content.appendChild(coverLogoBadge);
      appendBookletText(content,'p','Траурна агенция „Ден и Нощ“','booklet-cover-brand');
      appendBookletText(content,'h1','Панихиди и възпоменателни дни');
      appendBookletText(content,'p','Кратък помощник за близките','booklet-cover-subtitle');
      const coverContacts=document.createElement('div'); coverContacts.className='booklet-cover-contacts';
      appendBookletText(coverContacts,'p','0893 64 66 68','booklet-cover-phone');
      appendBookletText(coverContacts,'p','0898 24 24 34','booklet-cover-phone');
      appendBookletText(coverContacts,'p','Кюстендил, бул. „Цар Освободител“ 27А','booklet-cover-address');
      appendBookletText(coverContacts,'p','deninosht.bg','booklet-cover-site');
      content.appendChild(coverContacts);
      const coverQr=document.createElement('img'); coverQr.className='booklet-qr booklet-cover-qr'; coverQr.src='../assets/qr-deninosht.svg'; coverQr.alt='QR код към deninosht.bg'; content.appendChild(coverQr);
      return page;
    }
    if(pageNumber===2){
      appendBookletText(content,'p','В памет на','booklet-kicker');
      appendBookletText(content,'h2',model.name||'нашия близък','booklet-person-name');
      appendBookletText(content,'p','Дата на смъртта: '+formatBookletDate(model.death),'booklet-lead');
      const overview=document.createElement('div'); overview.className='booklet-overview'; content.appendChild(overview);
      [['3-ти ден','day3'],['9-ти ден','day9'],['20-ти ден','day20'],['40-ти ден','day40'],['3 месеца','month3'],['6 месеца','month6'],['9 месеца','month9'],['1 година','year1']].forEach((row)=>{
        const item=document.createElement('div'); appendBookletText(item,'strong',row[0]); appendBookletText(item,'span',dateLine(row[1])); overview.appendChild(item);
      });
    }
    if(pageNumber===3 || pageNumber===4){
      const third=pageNumber===3;
      appendBookletText(content,'p','Първи възпоменателни дни','booklet-kicker');
      appendBookletText(content,'h2',third?'Трети ден':'Девети ден');
      appendBookletText(content,'p',dateLine(third?'day3':'day9'),'booklet-page-date');
      appendBookletText(content,'p',third?'Третият ден е сред първите възпоменателни дни. Близките се събират за молитва и почит към покойника.':'На деветия ден близките отново се събират за молитва и почит към покойника.');
      appendBookletList(content,['Уговорете часа със свещеник.','Подгответе свещи и необходимото според указанията му.','По желание подгответе малки раздавки.']);
    }
    if(pageNumber===5){
      appendBookletText(content,'p','Панихида','booklet-kicker'); appendBookletText(content,'h2','Двадесети ден'); appendBookletText(content,'p',dateLine('day20'),'booklet-page-date');
      appendBookletText(content,'p','Двадесетият ден се отбелязва според семейната и местната традиция. Уточнете със свещеника дали панихидата ще бъде в храм или на гроба.');
      appendBookletList(content,['Свържете се предварително с храма или свещеника.','Подгответе жито, хляб или погача, вино и свещи.','Уведомете близките за часа и мястото.']);
    }
    if(pageNumber===6){
      appendBookletText(content,'p','Основна панихида','booklet-kicker'); appendBookletText(content,'h2','Четиридесети ден'); appendBookletText(content,'p',dateLine('day40'),'booklet-page-date');
      appendBookletText(content,'p','Четиридесетият ден е един от най-важните дни за възпоменание. Обичайно се отслужва панихида в храм или на гроба.');
      appendBookletList(content,['Запазете час със свещеник.','Подгответе жито, хляб или погача, вино и свещи.','При нужда поръчайте некролози, цветя и раздавки.','При нужда от почистване, подравняване или оформяне на гробното място се свържете с нас.']);
    }
    if(pageNumber===7){
      appendBookletText(content,'p','Възпоменание','booklet-kicker'); appendBookletText(content,'h2','Три месеца'); appendBookletText(content,'p',dateLine('month3'),'booklet-page-date');
      appendBookletText(content,'p','Тримесечният помен се прави според семейната и местната традиция. Може да бъде отбелязан с молитва, посещение на гроба и раздаване за помен.');
      appendBookletList(content,['Проверете датата и часа със свещеник.','Почистете и подредете гробното място.','Подгответе само необходимото за избрания начин на помен.']);
    }
    if(pageNumber===8){
      appendBookletText(content,'p','Възпоменание','booklet-kicker'); appendBookletText(content,'h2','Шест месеца'); appendBookletText(content,'p',dateLine('month6'),'booklet-page-date');
      appendBookletText(content,'p','На шест месеца много семейства организират панихида или по-малък помен. Най-важни остават молитвата, паметта и грижата за гробното място.');
      appendBookletList(content,['Уговорете панихида, ако семейството желае.','Подгответе свещи, цветя и раздавки.','Съобразете всичко с указанията на свещеника.']);
    }
    if(pageNumber===9){
      appendBookletText(content,'p','Възпоменание','booklet-kicker'); appendBookletText(content,'h2','Девет месеца'); appendBookletText(content,'p',dateLine('month9'),'booklet-page-date');
      appendBookletText(content,'p','Деветмесечният помен също се спазва от много семейства. Той може да бъде отбелязан в тесен кръг с молитва и посещение на гроба.');
      appendBookletList(content,['Уточнете деня със свещеник при съмнение.','Уведомете най-близките хора.','Подгответе свещи, цветя и раздавки по желание.']);
    }
    if(pageNumber===10){
      appendBookletText(content,'p','Годишнина','booklet-kicker'); appendBookletText(content,'h2','Една година'); appendBookletText(content,'p',dateLine('year1'),'booklet-page-date');
      appendBookletText(content,'p','Първата годишнина е основен ден за възпоменание. Обичайно се отслужва панихида и се събират роднини и близки.');
      appendBookletList(content,['Уговорете храм, свещеник и час.','Подгответе жито, хляб или погача, вино и свещи.','Предвидете цветя, некролози и раздавки според желанието на семейството.']);
    }
    if(pageNumber===11){
      appendBookletText(content,'p','След първата година','booklet-kicker'); appendBookletText(content,'h2','Годишнини и Задушници');
      appendBookletText(content,'p','След първата година близките могат да отбелязват годишнината от смъртта и общите дни за почит към починалите — Задушниците.');
      if(model.zadushnitsi.length){
        appendBookletText(content,'h3','Добавени Задушници','booklet-subheading');
        const memorials=document.createElement('div'); memorials.className='booklet-zadushnitsi-print'; content.appendChild(memorials);
        model.zadushnitsi.forEach((item)=>{
          const row=document.createElement('div'); appendBookletText(row,'strong',item.name); appendBookletText(row,'span',formatBookletDate(item.date)); memorials.appendChild(row);
        });
      }else{
        appendBookletList(content,['Датите на Задушниците са различни всяка година.','За точната дата и реда на службата попитайте в храма.']);
      }
      appendBookletText(content,'p','Ако денят съвпада с голям празник, уточнете със свещеник дали панихидата трябва да бъде по-рано.','booklet-note');
    }
    if(pageNumber===13){
      appendBookletText(content,'p','За организацията','booklet-kicker');
      appendBookletText(content,'h2','Уговорени панихиди');
      appendBookletText(content,'p','Запишете часа и мястото на службата.');
      appendBookletList(content,['Помен: __________________','Дата: ___________________','Час: ____________________','Храм / място: ____________','Свещеник: _______________','Телефон: _________________']);
    }
    if(pageNumber===14){
      appendBookletText(content,'p','За семейството','booklet-kicker');
      appendBookletText(content,'h2','Бележки');
      appendBookletList(content,Array(10).fill('____________________________'));
    }
    if(pageNumber===15){
      appendBookletText(content,'p','Съдействие при организацията','booklet-kicker');
      appendBookletText(content,'h2','Ден и Нощ');
      appendBookletText(content,'p','Свържете се с нас за организация на панихида и необходимите принадлежности.');
      appendBookletList(content,['Свещеник и организация','Некролози','Раздавки, свещи и цветя','Почистване и поддръжка на гробни места']);
      appendBookletText(content,'p','0893 64 66 68 · 0898 24 24 34','booklet-page-date');
      appendBookletText(content,'p','Кюстендил, бул. „Цар Освободител“ 27А');
      appendBookletText(content,'p','deninosht.bg');
    }
    if(pageNumber===12){
      appendBookletText(content,'p','Кратък списък','booklet-kicker'); appendBookletText(content,'h2','Какво обичайно се подготвя');
      appendBookletList(content,['Варено жито','Хляб или погача','Червено вино','Свещи','Цветя','Раздавки за помен','Некролози — когато семейството желае','Уговорка със свещеник и уточнен час']);
      appendBookletText(content,'p','Обичаите се различават. Не е необходимо всичко от списъка — съобразете се със семейството, местната традиция и свещеника.','booklet-note');
    }
    if(pageNumber===16){
      page.classList.add('booklet-back-cover');
      const logoBadge=document.createElement('div'); logoBadge.className='booklet-logo-badge';
      const logo=document.createElement('img'); logo.src='../assets/logo-den-i-nosht.webp'; logo.alt='Траурна агенция „Ден и Нощ“'; logoBadge.appendChild(logo); content.appendChild(logoBadge);
      appendBookletText(content,'p','Денонощна траурна агенция','booklet-back-label');
      const phone1=document.createElement('a'); phone1.href='tel:+359893646668'; phone1.textContent='0893 64 66 68'; content.appendChild(phone1);
      const phone2=document.createElement('a'); phone2.href='tel:+359898242434'; phone2.textContent='0898 24 24 34'; content.appendChild(phone2);
      appendBookletText(content,'p','deninosht.bg','booklet-site');
      const qr=document.createElement('img'); qr.className='booklet-qr'; qr.src='../assets/qr-deninosht.svg'; qr.alt='QR код към deninosht.bg'; content.appendChild(qr);
    }
    if(pageNumber>=3&&pageNumber<=13&&pageNumber!==11) appendAgencyHelp(content);
    if(pageNumber!==16) appendBookletText(page,'span',String(pageNumber),'booklet-page-number');
    return page;
  }

  const BOOKLET_PAGE_COUNT=16;
  // A4 portrait, four A6 pages per side. Cut horizontally, nest A5 halves, fold vertically.
  const BOOKLET_PRINT_SIDES=[[[16,1],[14,3]],[[2,15],[4,13]],[[12,5],[10,7]],[[6,11],[8,9]]];

  function renderBooklet(){
    const model=readBookletModel();
    const pages={}; for(let page=1;page<=BOOKLET_PAGE_COUNT;page+=1) pages[page]=createBookletPage(page,model);
    const sides=BOOKLET_PRINT_SIDES;
    const labels=['Лист A4 1 — лице','Лист A4 1 — гръб','Лист A4 2 — лице','Лист A4 2 — гръб'];
    bookletReadingPreview.replaceChildren();
    for(let page=1;page<=BOOKLET_PAGE_COUNT;page+=1){
      const preview=document.createElement('div'); preview.className='booklet-reading-page';
      appendBookletText(preview,'div','Страница '+page,'booklet-reading-label');
      preview.appendChild(pages[page].cloneNode(true)); bookletReadingPreview.appendChild(preview);
    }
    bookletPrintRoot.replaceChildren();
    sides.forEach((pair,index)=>{
      const side=document.createElement('section'); side.className='booklet-side';
      appendBookletText(side,'div',labels[index],'booklet-sheet-label');
      const sheet=document.createElement('div'); sheet.className='booklet-sheet';
      pair.flat().forEach((number)=>sheet.appendChild(pages[number].cloneNode(true))); side.appendChild(sheet); bookletPrintRoot.appendChild(side);
    });
    bookletPreviewArea.hidden=false; bookletPrintButton.disabled=false;
    const manualStart=$('booklet-manual-start'); if(manualStart) manualStart.disabled=false;
    message(bookletMessage,'Книжката е готова за печат или запис като PDF.','success');
    bookletPreviewArea.scrollIntoView({behavior:'smooth',block:'start'});
  }

  const bookletImageCache=new Map();

  function loadBookletImage(src){
    if(bookletImageCache.has(src)) return bookletImageCache.get(src);
    const promise=new Promise((resolve,reject)=>{
      const image=new Image(); image.onload=()=>resolve(image); image.onerror=()=>reject(new Error('Неуспешно зареждане на изображение за PDF.'));
      image.src=src;
    });
    bookletImageCache.set(src,promise); return promise;
  }

  function wrapCanvasText(ctx,text,maxWidth){
    const words=String(text||'').trim().split(/\s+/).filter(Boolean); if(!words.length) return [];
    const lines=[]; let line='';
    words.forEach((word)=>{
      const test=line?line+' '+word:word;
      if(line&&ctx.measureText(test).width>maxWidth){ lines.push(line); line=word; }
      else line=test;
    });
    if(line) lines.push(line); return lines;
  }

  function drawCanvasText(ctx,text,y,options){
    const opts=Object.assign({font:'28px Georgia',color:'#24191a',maxWidth:1000,lineHeight:38,gapAfter:16},options||{});
    ctx.font=opts.font;
    ctx.fillStyle=opts.color; ctx.textAlign='center'; ctx.textBaseline='top';
    const lines=wrapCanvasText(ctx,text,opts.maxWidth);
    lines.forEach((line,index)=>ctx.fillText(line,620,y+index*opts.lineHeight));
    return y+lines.length*opts.lineHeight+opts.gapAfter;
  }

  function drawCanvasRule(ctx,y,width,color){
    ctx.strokeStyle=color||'#b98a68'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo((1240-width)/2,y); ctx.lineTo((1240+width)/2,y); ctx.stroke();
  }

  function drawImageContained(ctx,image,x,y,width,height){
    const scale=Math.min(width/image.naturalWidth,height/image.naturalHeight); const w=image.naturalWidth*scale; const h=image.naturalHeight*scale;
    ctx.drawImage(image,x+(width-w)/2,y+(height-h)/2,w,h);
  }

  async function drawLogoBadgeToCanvas(ctx,src,y,width){
    const image=await loadBookletImage(src); const x=(1240-width)/2;
    ctx.fillStyle='#080808'; ctx.fillRect(x,y,width,width);
    drawImageContained(ctx,image,x+34,y+34,width-68,width-68); return y+width;
  }

  async function renderBookletPageCanvas(pageNumber,model){
    const pageElement=createBookletPage(pageNumber,model); const content=pageElement.querySelector('.booklet-page-content');
    const canvas=document.createElement('canvas'); canvas.width=1240; canvas.height=1754; let ctx=canvas.getContext('2d');
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);

    if(pageNumber===1){
      const logo=content.querySelector('.booklet-cover-logo img'); let y=120;
      y=await drawLogoBadgeToCanvas(ctx,logo.src,y,440)+34;
      y=drawCanvasText(ctx,'Траурна агенция „Ден и Нощ“',y,{font:'bold 44px Arial',color:'#7b3337',maxWidth:1040,lineHeight:58,gapAfter:48});
      y=drawCanvasText(ctx,'Панихиди и възпоменателни дни',y,{font:'88px Georgia',color:'#24191a',maxWidth:1040,lineHeight:106,gapAfter:25});
      y=drawCanvasText(ctx,'Кратък помощник за близките',y,{font:'36px Georgia',color:'#66564b',maxWidth:1040,lineHeight:48,gapAfter:28});
      drawCanvasRule(ctx,y,760,'#bd9d85'); y+=30;
      y=drawCanvasText(ctx,'0893 64 66 68',y,{font:'bold 48px Georgia',maxWidth:1040,lineHeight:62,gapAfter:4});
      y=drawCanvasText(ctx,'0898 24 24 34',y,{font:'bold 48px Georgia',maxWidth:1040,lineHeight:62,gapAfter:14});
      y=drawCanvasText(ctx,'Кюстендил, бул. „Цар Освободител“ 27А',y,{font:'38px Georgia',maxWidth:950,lineHeight:49,gapAfter:16});
      y=drawCanvasText(ctx,'deninosht.bg',y,{font:'bold 34px Arial',maxWidth:1040,lineHeight:44,gapAfter:16});
      const qr=content.querySelector('.booklet-cover-qr'); const qrImage=await loadBookletImage(qr.src);
      drawImageContained(ctx,qrImage,510,y,220,220);
      return canvas;
    }

    if(pageNumber===16){
      const logo=content.querySelector('.booklet-logo-badge img'); const qr=content.querySelector('.booklet-qr'); let y=215;
      y=await drawLogoBadgeToCanvas(ctx,logo.src,y,360)+38;
      y=drawCanvasText(ctx,'Денонощна траурна агенция',y,{font:'bold 25px Arial',color:'#66564b',maxWidth:900,lineHeight:34,gapAfter:28});
      y=drawCanvasText(ctx,'0893 64 66 68',y,{font:'bold 46px Georgia',maxWidth:900,lineHeight:56,gapAfter:8});
      y=drawCanvasText(ctx,'0898 24 24 34',y,{font:'bold 46px Georgia',maxWidth:900,lineHeight:56,gapAfter:32});
      y=drawCanvasText(ctx,'deninosht.bg',y,{font:'bold 30px Arial',maxWidth:900,lineHeight:42,gapAfter:24});
      const qrImage=await loadBookletImage(qr.src); drawImageContained(ctx,qrImage,510,y,220,220);
      return canvas;
    }

    const pageCtx=ctx;
    const contentCanvas=document.createElement('canvas');contentCanvas.width=1240;contentCanvas.height=6000;ctx=contentCanvas.getContext('2d');
    let y=105; const agencyHelp=content.querySelector('.booklet-agency-help');
    for(const child of Array.from(content.children)){
      if(child===agencyHelp) continue;
      const classes=child.classList;
      if(classes.contains('booklet-kicker')){
        y=drawCanvasText(ctx,child.textContent,y,{font:'bold 35px Arial',color:'#7b3337',maxWidth:1000,lineHeight:46,gapAfter:18});
      }else if(classes.contains('booklet-person-name')){
        y=drawCanvasText(ctx,child.textContent,y,{font:'70px Georgia',maxWidth:1000,lineHeight:81,gapAfter:22});
      }else if(child.tagName==='H2'){
        y=drawCanvasText(ctx,child.textContent,y,{font:'70px Georgia',maxWidth:1040,lineHeight:83,gapAfter:24});
      }else if(classes.contains('booklet-subheading')||child.tagName==='H3'){
        y=drawCanvasText(ctx,child.textContent,y,{font:'bold 44px Georgia',color:'#7b3337',maxWidth:1000,lineHeight:57,gapAfter:14});
      }else if(classes.contains('booklet-page-date')){
        drawCanvasRule(ctx,y,920,'#bd9d85'); y+=20;
        y=drawCanvasText(ctx,child.textContent,y,{font:'bold 44px Georgia',color:'#7b3337',maxWidth:940,lineHeight:57,gapAfter:16});
        drawCanvasRule(ctx,y,920,'#bd9d85'); y+=34;
      }else if(classes.contains('booklet-overview')){
        drawCanvasRule(ctx,y,940,'#bd9d85'); y+=10;
        for(const row of Array.from(child.children)){
          const strong=row.querySelector('strong'); const span=row.querySelector('span');
          y=drawCanvasText(ctx,strong.textContent,y,{font:'bold 35px Arial',color:'#7b3337',maxWidth:950,lineHeight:44,gapAfter:1});
          y=drawCanvasText(ctx,span.textContent,y,{font:'35px Arial',color:'#4d4240',maxWidth:950,lineHeight:44,gapAfter:6});
          drawCanvasRule(ctx,y,940,'#ded4c8'); y+=7;
        }
      }else if(classes.contains('booklet-early-dates')){
        drawCanvasRule(ctx,y,940,'#bd9d85'); y+=16;
        const rows=Array.from(child.children); const colWidth=470;
        rows.forEach((row,index)=>{
          const cx=index===0?385:855; const strong=row.querySelector('strong'); const span=row.querySelector('span');
          ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillStyle='#7b3337'; ctx.font='bold 25px Georgia'; ctx.fillText(strong.textContent,cx,y);
          ctx.fillStyle='#24191a'; ctx.font='24px Georgia'; const lines=wrapCanvasText(ctx,span.textContent,colWidth-30); lines.forEach((line,i)=>ctx.fillText(line,cx,y+40+i*31));
        });
        y+=105; drawCanvasRule(ctx,y,940,'#bd9d85'); y+=36;
      }else if(classes.contains('booklet-zadushnitsi-print')){
        drawCanvasRule(ctx,y,940,'#bd9d85'); y+=10;
        for(const row of Array.from(child.children)){
          y=drawCanvasText(ctx,row.querySelector('strong').textContent,y,{font:'bold 33px Arial',color:'#7b3337',maxWidth:950,lineHeight:44,gapAfter:1});
          y=drawCanvasText(ctx,row.querySelector('span').textContent,y,{font:'33px Arial',color:'#4d4240',maxWidth:950,lineHeight:42,gapAfter:6});
          drawCanvasRule(ctx,y,940,'#ded4c8'); y+=6;
        }
      }else if(child.tagName==='UL'){
        for(const item of Array.from(child.children)) y=drawCanvasText(ctx,'• '+item.textContent,y,{font:'44px Georgia',maxWidth:1010,lineHeight:57,gapAfter:16});
        y+=8;
      }else if(classes.contains('booklet-note')){
        drawCanvasRule(ctx,y,900,'#bd9d85'); y+=17;
        y=drawCanvasText(ctx,child.textContent,y,{font:'35px Georgia',color:'#5d5148',maxWidth:940,lineHeight:46,gapAfter:22});
      }else if(child.tagName==='P'){
        const isLead=classes.contains('booklet-lead');
        y=drawCanvasText(ctx,child.textContent,y,{font:(isLead?'37px':'44px')+' Georgia',color:isLead?'#66564b':'#24191a',maxWidth:1020,lineHeight:57,gapAfter:24});
      }
    }

    if(y>5900) throw new Error('Текстът на страница '+pageNumber+' е прекалено дълъг. Съкратете името или добавените Задушници.');
    const contentLimit=agencyHelp?1290:1450;
    const fit=Math.min(1,(contentLimit-105)/Math.max(1,y-105));
    pageCtx.drawImage(contentCanvas,0,105,1240,y-105,(1240-1240*fit)/2,105,1240*fit,(y-105)*fit);
    ctx=pageCtx;
    if(agencyHelp){
      drawCanvasRule(ctx,1320,960,'#9a6546');
      drawCanvasText(ctx,agencyHelp.textContent,1340,{font:'bold 30px Arial',color:'#7b3337',maxWidth:980,lineHeight:39,gapAfter:0});
    }
    ctx.font='28px Arial'; ctx.fillStyle='#877a72'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText(String(pageNumber),620,1518);
    return canvas;
  }

  async function createBookletPdf(model,sideIndexes=[0,1,2,3],canvasCache=new Map()){
    if(!window.PDFLib||!window.PDFLib.PDFDocument) throw new Error('PDF модулът не е зареден. Обновете страницата и опитайте отново.');
    const pdf=await window.PDFLib.PDFDocument.create();
    pdf.setTitle('Книжка за панихиди - Ден и Нощ'); pdf.setAuthor('Траурна агенция Ден и Нощ'); pdf.setCreator('deninosht.bg');
    const sides=sideIndexes.map(index=>BOOKLET_PRINT_SIDES[index]);
    const images=new Map();
    const numbers=new Set(sides.flat(2));
    for(const number of numbers){
      if(!canvasCache.has(number)){
        const canvas=await renderBookletPageCanvas(number,model);
        canvasCache.set(number,canvas.toDataURL('image/jpeg',0.96));
      }
      images.set(number,await pdf.embedJpg(canvasCache.get(number)));
    }
    const mm=72/25.4, pageWidth=105*mm, pageHeight=148.5*mm;
    for(const rows of sides){
      const page=pdf.addPage([210*mm,297*mm]);
      rows.forEach((pair,row)=>pair.forEach((number,column)=>{
        page.drawImage(images.get(number),{x:column*pageWidth,y:(1-row)*pageHeight,width:pageWidth,height:pageHeight});
      }));
      page.drawLine({start:{x:0,y:pageHeight},end:{x:210*mm,y:pageHeight},thickness:0.3,color:window.PDFLib.rgb(.78,.78,.78),dashArray:[3,3]});
      page.drawLine({start:{x:pageWidth,y:0},end:{x:pageWidth,y:297*mm},thickness:0.3,color:window.PDFLib.rgb(.85,.85,.85),dashArray:[2,4]});
    }
    return pdf.save({useObjectStreams:true});
  }

  async function downloadBookletPdf(){
    const bytes=await createBookletPdf(readBookletModel()); const blob=new Blob([bytes],{type:'application/pdf'}); const url=URL.createObjectURL(blob);
    const link=document.createElement('a'); link.href=url; link.download='knizhka-panihidi-A6-pechat-A4.pdf'; link.rel='noopener';
    if(/iPad|iPhone|iPod/i.test(navigator.userAgent||'')) link.target='_blank';
    document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(()=>URL.revokeObjectURL(url),60000);
  }

  // Manual duplex: print both fronts, then each matching back separately.
  const MANUAL_BOOKLET_STAGES=[
    {title:'Стъпка 1 от 3 — лица на двата листа',sides:[0,2],next:'Готово — към гръб на лист 1',instructions:[
      'Сложете 2 чисти листа A4 в задната тава на Canon G2416.',
      'Отваря се PDF с точно 2 страници. Натиснете иконата за печат в PDF. Настройки: A4, Portrait, едностранно, 100%, една страница на лист.',
      'След печата отделете листа с корицата „Панихиди и възпоменателни дни“. Това е лист 1. Другият, с „Какво обичайно се подготвя“ горе вляво, е лист 2.',
      'Изчакайте мастилото да изсъхне. Натиснете „Готово“ само след като и двете лица са отпечатани.'
    ]},
    {title:'Стъпка 2 от 3 — гръб на лист 1',sides:[1],next:'Готово — към гръб на лист 2',instructions:[
      'Вземете САМО лист 1 — този с корицата. Отстранете другите листове от задната тава.',
      'Върнете го с ПРАЗНАТА страна към вас; отпечатаната страна да гледа назад, към опората на тавата.',
      'Горният край на отпечатаното лице трябва да влезе ПЪРВИ в принтера: той е долу, при ролките. Не разменяйте горния и долния край.',
      'PDF съдържа точно 1 страница. Печатайте чрез иконата в PDF: A4, Portrait, едностранно, 100%. После се върнете в админ панела и натиснете „Готово“.'
    ]},
    {title:'Стъпка 3 от 3 — гръб на лист 2',sides:[3],next:'Готово — сгъване на книжката',instructions:[
      'Вземете САМО лист 2 — „Какво обичайно се подготвя“ е горе вляво на лицето. Задната тава трябва да съдържа само него.',
      'ПРАЗНАТА страна е към вас, отпечатаната е към опората на тавата.',
      'Горният край на отпечатаното лице влиза ПЪРВИ в принтера — поставете го долу, при ролките.',
      'PDF съдържа точно 1 страница. Печатайте чрез иконата в PDF: A4, Portrait, едностранно, 100%. После се върнете в админ панела и натиснете „Готово“.'
    ]}
  ];
  let manualBookletState=null;

  function resetManualBookletPrint(){
    if(manualBookletState&&manualBookletState.printWindow&&!manualBookletState.printWindow.closed) manualBookletState.printWindow.close();
    if(manualBookletState&&manualBookletState.pdfs) manualBookletState.pdfs.forEach(url=>URL.revokeObjectURL(url));
    manualBookletState=null;
    const download=$('booklet-manual-pdf-download');if(download){download.hidden=true;download.removeAttribute('href');}
    const start=$('booklet-manual-start'); if(start) start.disabled=true;
    const panel=$('booklet-manual-panel'); if(panel) panel.hidden=true;
  }

  function updateManualBookletPanel(){
    const panel=$('booklet-manual-panel'); if(!panel||!manualBookletState) return;
    panel.hidden=false;
    const stage=MANUAL_BOOKLET_STAGES[manualBookletState.step];
    $('booklet-manual-title').textContent=stage?stage.title:'Печатът е готов — сгъване';
    const list=$('booklet-manual-instructions'); list.replaceChildren();
    (stage?stage.instructions:[
      'Изчакайте мастилото да изсъхне и на двата листа.',
      'Поставете лист 1 с корицата към вас и текста изправен. Лист 2 е с „Какво обичайно се подготвя“ горе вляво.',
      'Разрежете всеки лист по хоризонталната линия.',
      'Подредете половинките една върху друга, с лицата нагоре и текста изправен: лист 1 горе → лист 1 долу → лист 2 горе → лист 2 долу.',
      'Сгънете цялата купчинка по вертикалната линия, като лявата половина отиде отзад под дясната. Корицата остава отпред, а сгъвката е вляво.',
      'Захванете по сгъвката с телбод. Помените следват: 3, 9, 20, 40 дни, 3, 6, 9 месеца и 1 година.'
    ]).forEach(text=>appendBookletText(list,'li',text));
    $('booklet-manual-next').hidden=!stage;
    $('booklet-manual-next').disabled=manualBookletState.busy||!manualBookletState.ready;
    $('booklet-manual-next').textContent=stage?stage.next:'Готово';
    const download=$('booklet-manual-pdf-download');if(download) download.hidden=!stage||!manualBookletState.ready;
    $('booklet-manual-open').hidden=!stage;
    $('booklet-manual-open').disabled=manualBookletState.busy;
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function manualBookletWindow(){
    if(manualBookletState.printWindow&&!manualBookletState.printWindow.closed) return manualBookletState.printWindow;
    const popup=window.open('','deninosht-manual-booklet','width=920,height=900');
    if(!popup) throw new Error('Разрешете изскачащия прозорец за печат и натиснете „Отвори печат“ отново.');
    manualBookletState.printWindow=popup; return popup;
  }

  async function openManualBookletPrint(){
    if(!manualBookletState||manualBookletState.busy) return;
    const state=manualBookletState,stage=MANUAL_BOOKLET_STAGES[state.step];if(!stage) return;
    let popup;
    try{
      popup=manualBookletWindow(); // Reserve the tab synchronously from the click.
      state.busy=true;state.ready=false;updateManualBookletPanel();
      message(bookletMessage,'Подготовка на PDF за тази стъпка…');
      if(!state.pdfs.has(state.step)){
        const bytes=await createBookletPdf(state.model,stage.sides,state.images);
        if(manualBookletState!==state) return;
        state.pdfs.set(state.step,URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})));
      }
      if(manualBookletState!==state) return;
      state.ready=true;
      const url=state.pdfs.get(state.step);
      const link=$('booklet-manual-pdf-download');
      if(link){link.href=url;link.download=['panihidi-01-litsa.pdf','panihidi-02-grab-list-1.pdf','panihidi-03-grab-list-2.pdf'][state.step];link.hidden=false;}
      if(popup.closed) throw new Error('PDF е готов. Натиснете „Отвори PDF за печат“ или „Изтегли PDF за тази стъпка“.');
      popup.location.replace(url);popup.focus();
      message(bookletMessage,'PDF: '+stage.sides.length+' '+(stage.sides.length===1?'страница':'страници')+'. Натиснете иконата за печат в PDF. След отпечатването се върнете тук и натиснете „Готово“.','success');
    }catch(error){message(bookletMessage,error.message||'PDF за печат не можа да бъде отворен.','error');}
    finally{if(manualBookletState===state){state.busy=false;updateManualBookletPanel();}}
  }

  function startManualBookletPrint(){
    try{
      const hasEmpty=Array.from(document.querySelectorAll('[data-booklet-date]')).some(input=>!input.value);
      if(hasEmpty&&!calculateBookletDates()) return;
      const model=readBookletModel();
      resetManualBookletPrint(); renderBooklet();
      manualBookletState={model,step:0,busy:false,ready:false,images:new Map(),pdfs:new Map(),printWindow:null};
      updateManualBookletPanel();openManualBookletPrint();
    }catch(error){message(bookletMessage,error.message||'Ръчният печат не можа да започне.','error');}
  }

  function advanceManualBookletPrint(){
    if(!manualBookletState||manualBookletState.busy||!manualBookletState.ready) return;
    manualBookletState.step+=1;manualBookletState.ready=false;
    if(manualBookletState.step>=MANUAL_BOOKLET_STAGES.length){
      if(manualBookletState.printWindow&&!manualBookletState.printWindow.closed) manualBookletState.printWindow.close();
      updateManualBookletPanel();return;
    }
    updateManualBookletPanel();openManualBookletPrint();
  }

  function switchAdminView(view){
    clearObituaryPrint();
    const analytics=view==='analytics';
    const obituary=view==='obituary';
    const booklet=view==='booklet';
    const products=!analytics&&!obituary&&!booklet;
    if(productsAdminView) productsAdminView.hidden=!products;
    if(analyticsAdminView) analyticsAdminView.hidden=!analytics;
    if(obituaryAdminView) obituaryAdminView.hidden=!obituary;
    if(bookletAdminView) bookletAdminView.hidden=!booklet;
    document.querySelectorAll('[data-admin-view]').forEach((btn)=>{
      const active=btn.dataset.adminView===view; btn.classList.toggle('is-active',active); btn.setAttribute('aria-pressed',String(active));
    });
    if(dashboardTitle) dashboardTitle.textContent=analytics?'Статистика':obituary?'Некролози':booklet?'Книжка за панихиди':'Траурни стоки';
    if(dashboardIntro) dashboardIntro.textContent=analytics?'Следете преглежданията, входящите източници и действията към контакт.':obituary?'Създайте професионално оформен некролог и готов PDF за печат.':booklet?'Създайте персонализирана книжка, подредена за двустранен печат, сгъване и телбод.':'Управлявайте продуктите от едно място — наличност, видимост, подредба, архив и снимки.';
    if(newProductButton) newProductButton.hidden=!products;
    if(analytics) loadAnalytics();
  }

  async function loadTopTickerSetting(){
    if (!topTickerInput) return;
    siteSettingsReady = true;
    siteSettingsRowId = null;
    topTickerInput.value = ORIGINAL_TICKER;
    message(tickerSettingMessage, 'Зареждане на текущото съобщение…');
    try{
      const rows = await request('/rest/v1/site_settings?select=id,top_ticker_text&order=id.asc&limit=1', {}, true);
      if (Array.isArray(rows) && rows[0]){
        siteSettingsRowId = rows[0].id;
        topTickerInput.value = String(rows[0].top_ticker_text || '').trim() || ORIGINAL_TICKER;
      }
      message(tickerSettingMessage, '');
    } catch(error){
      siteSettingsReady = false;
      if (/site_settings|relation|schema cache|42P01|not found/i.test(error.message || '')){
        message(tickerSettingMessage, 'Първо създайте таблицата site_settings в Supabase. Дотогава сайтът ще показва оригиналното съобщение.', 'error');
      } else {
        message(tickerSettingMessage, 'Настройката не се зареди: ' + error.message, 'error');
      }
    }
  }

  async function persistTopTicker(text, successText){
    const value = String(text || '').trim();
    if (!value) throw new Error('Съобщението не може да бъде празно.');
    if (value.length > 260) throw new Error('Съобщението е прекалено дълго.');
    if (!siteSettingsReady) throw new Error('Таблицата site_settings още не е настроена в Supabase.');

    if (siteSettingsRowId !== null && siteSettingsRowId !== undefined){
      await request('/rest/v1/site_settings?id=eq.' + encodeURIComponent(siteSettingsRowId), {
        method:'PATCH',
        headers:{'Content-Type':'application/json',Prefer:'return=minimal'},
        body:JSON.stringify({top_ticker_text:value})
      }, true);
    } else {
      const created = await request('/rest/v1/site_settings', {
        method:'POST',
        headers:{'Content-Type':'application/json',Prefer:'return=representation'},
        body:JSON.stringify({top_ticker_text:value})
      }, true);
      if (Array.isArray(created) && created[0]) siteSettingsRowId = created[0].id;
    }
    topTickerInput.value = value;
    try { localStorage.setItem('deninosht_top_ticker_v1', value); } catch (_) {}
    message(tickerSettingMessage, successText || 'Съобщението е записано и вече се използва на сайта.', 'success');
  }

  function categoryName(id){
    const c = categories.find((item)=>String(item.id) === String(id));
    return c ? c.name : 'Без категория';
  }

  function categorySlug(id){
    const c = categories.find((item)=>String(item.id) === String(id));
    return c ? c.slug : '';
  }

  function storagePathFromUrl(url){
    if (!url) return '';
    const marker = '/storage/v1/object/public/' + bucket + '/';
    const idx = url.indexOf(marker);
    if (idx === -1) return '';
    return decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
  }

  function encodePath(path){ return String(path).split('/').map(encodeURIComponent).join('/'); }

  async function removeStoredImage(url){
    const path = storagePathFromUrl(url);
    if (!path) return;
    try{
      await request('/storage/v1/object/' + bucket, {
        method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:[path]})
      }, true);
    } catch (error){ console.warn('Image cleanup failed:', error.message); }
  }

  function loadImageFile(file){
    return new Promise((resolve,reject)=>{
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = ()=>{ URL.revokeObjectURL(url); resolve(img); };
      img.onerror = ()=>{ URL.revokeObjectURL(url); reject(new Error('Снимката не може да бъде прочетена.')); };
      img.src = url;
    });
  }

  function canvasBlob(canvas, type, quality){
    return new Promise((resolve,reject)=>{
      canvas.toBlob((blob)=>blob ? resolve(blob) : reject(new Error('Снимката не може да бъде оптимизирана.')), type, quality);
    });
  }

  async function optimizeImage(file){
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.type)) throw new Error('Разрешени са JPG, PNG и WEBP снимки.');
    if (file.size > 25 * 1024 * 1024) throw new Error('Снимката е прекалено голяма. Изберете файл под 25 MB.');

    const img = await loadImageFile(file);
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d', {alpha:true});
    ctx.drawImage(img, 0, 0, width, height);
    let blob = await canvasBlob(canvas, 'image/webp', 0.84);

    if (blob.size > 4.7 * 1024 * 1024){
      blob = await canvasBlob(canvas, 'image/webp', 0.68);
    }
    if (blob.size > 5 * 1024 * 1024) throw new Error('Снимката остава по-голяма от 5 MB след оптимизация.');
    return blob;
  }

  async function uploadBlob(blob, slug){
    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/jpeg' ? 'jpg' : 'webp';
    const path = 'products/' + Date.now() + '-' + Math.random().toString(36).slice(2,7) + '-' + slug + '.' + ext;
    await request('/storage/v1/object/' + bucket + '/' + encodePath(path), {
      method:'POST',
      headers:{'Content-Type':blob.type || 'image/webp','cache-control':'max-age=31536000','x-upsert':'false'},
      body:blob
    }, true);
    return cfg.url + '/storage/v1/object/public/' + bucket + '/' + encodePath(path);
  }

  async function uploadImage(file, slug){
    message(editorMessage, 'Оптимизиране на снимката…');
    const optimized = await optimizeImage(file);
    message(editorMessage, 'Качване на снимката…');
    return uploadBlob(optimized, slug);
  }

  async function duplicateImage(url, slug){
    if (!url) return '';
    const response = await fetch(url, {cache:'no-store'});
    if (!response.ok) throw new Error('Снимката на продукта не може да бъде копирана.');
    const blob = await response.blob();
    return uploadBlob(blob, slug);
  }

  function setLoggedIn(loggedIn){
    loginPanel.hidden = Boolean(loggedIn);
    dashboard.hidden = !loggedIn;
    loginPanel.setAttribute('aria-hidden', loggedIn ? 'true' : 'false');
    dashboard.setAttribute('aria-hidden', loggedIn ? 'false' : 'true');
  }

  async function loadData(){
    message(dashboardMessage, 'Зареждане…');
    const catPromise = request('/rest/v1/categories?select=id,name,slug,sort_order,is_active&order=sort_order.asc', {}, true);
    let prodResult;
    schemaReady = true;
    codeVisibilityReady = true;
    try{
      prodResult = await request('/rest/v1/products?select=id,name,product_code,show_product_code,slug,description,image_url,is_available,sort_order,is_active,is_archived,category_id,created_at&order=category_id.asc,sort_order.asc,created_at.asc', {}, true);
    } catch (error){
      if (/show_product_code/i.test(error.message || '')){
        codeVisibilityReady = false;
        try{
          prodResult = await request('/rest/v1/products?select=id,name,product_code,slug,description,image_url,is_available,sort_order,is_active,is_archived,category_id,created_at&order=category_id.asc,sort_order.asc,created_at.asc', {}, true);
          prodResult = (prodResult || []).map((p)=>Object.assign({show_product_code:false}, p));
        } catch (fallbackError){
          if (!/product_code|is_archived|column/i.test(fallbackError.message || '')) throw fallbackError;
          schemaReady = false;
          prodResult = await request('/rest/v1/products?select=id,name,slug,description,image_url,is_available,sort_order,is_active,category_id,created_at&order=category_id.asc,sort_order.asc,created_at.asc', {}, true);
          prodResult = (prodResult || []).map((p)=>Object.assign({product_code:'',show_product_code:false,is_archived:false}, p));
        }
      } else if (/product_code|is_archived|column/i.test(error.message || '')){
        schemaReady = false;
        prodResult = await request('/rest/v1/products?select=id,name,slug,description,image_url,is_available,sort_order,is_active,category_id,created_at&order=category_id.asc,sort_order.asc,created_at.asc', {}, true);
        prodResult = (prodResult || []).map((p)=>Object.assign({product_code:'',show_product_code:false,is_archived:false}, p));
      } else throw error;
    }
    categories = (await catPromise) || [];
    products = prodResult || [];
    $('schema-warning').hidden = schemaReady;
    $('code-visibility-warning').hidden = !schemaReady || codeVisibilityReady;
    populateCategoryControls();
    updateStats();
    renderProducts();
    message(dashboardMessage, schemaReady ? '' : 'Сайтът работи, но новите функции чакат SQL настройката за v1.41.', schemaReady ? '' : 'error');
  }

  function populateCategoryControls(){
    const currentFilter = categoryFilter.value;
    const currentEditor = $('product-category').value;
    categoryFilter.replaceChildren(new Option('Всички категории',''));
    $('product-category').replaceChildren();
    categories.forEach((c)=>{
      categoryFilter.add(new Option(c.name, c.id));
      $('product-category').add(new Option(c.name, c.id));
    });
    if ([...categoryFilter.options].some((o)=>o.value === currentFilter)) categoryFilter.value = currentFilter;
    if ([...$('product-category').options].some((o)=>o.value === currentEditor)) $('product-category').value = currentEditor;
  }

  function updateStats(){
    const current = products.filter((p)=>!p.is_archived);
    $('stat-total').textContent = current.length;
    $('stat-available').textContent = current.filter((p)=>p.is_available).length;
    $('stat-unavailable').textContent = current.filter((p)=>!p.is_available).length;
    $('stat-hidden').textContent = current.filter((p)=>!p.is_active).length;
    $('stat-archived').textContent = products.filter((p)=>p.is_archived).length;
  }

  function getVisibleProducts(){
    const selected = categoryFilter.value;
    const status = statusFilter.value;
    const query = norm(productSearch.value);
    let list = products.slice();
    if (selected) list = list.filter((p)=>String(p.category_id) === selected);
    if (status === 'current') list = list.filter((p)=>!p.is_archived);
    else if (status === 'visible') list = list.filter((p)=>!p.is_archived && p.is_active);
    else if (status === 'hidden') list = list.filter((p)=>!p.is_archived && !p.is_active);
    else if (status === 'available') list = list.filter((p)=>!p.is_archived && p.is_available);
    else if (status === 'unavailable') list = list.filter((p)=>!p.is_archived && !p.is_available);
    else if (status === 'archived') list = list.filter((p)=>p.is_archived);
    if (query){
      list = list.filter((p)=>norm([p.name,p.product_code,p.description,categoryName(p.category_id)].join(' ')).includes(query));
    }
    return list.sort((a,b)=>Number(a.category_id)-Number(b.category_id) || Number(a.sort_order||0)-Number(b.sort_order||0) || String(a.created_at||'').localeCompare(String(b.created_at||'')));
  }

  function actionButton(text, handler, className, title){
    const btn = document.createElement('button');
    btn.className = 'small-button' + (className ? ' ' + className : '');
    btn.type = 'button'; btn.textContent = text;
    if (title) btn.title = title;
    btn.addEventListener('click', async ()=>{
      if (btn.disabled) return;
      btn.disabled = true;
      try { await handler(); } finally { btn.disabled = false; }
    });
    return btn;
  }

  function renderProducts(){
    productList.replaceChildren();
    const visible = getVisibleProducts();
    productCount.textContent = visible.length + (visible.length === 1 ? ' продукт' : ' продукта');
    if (!visible.length){
      const empty = document.createElement('div');
      empty.className = 'empty-admin'; empty.textContent = 'Няма продукти в този изглед.';
      productList.appendChild(empty); return;
    }

    visible.forEach((p)=>{
      const row = document.createElement('article');
      row.className = 'admin-product' + (p.is_archived ? ' is-archived' : '');

      const imageBox = document.createElement('div');
      imageBox.className = 'admin-product-image' + (p.image_url ? '' : ' no-image');
      if (p.image_url){
        const img = document.createElement('img'); img.src=p.image_url; img.alt=p.name; img.loading='lazy'; imageBox.appendChild(img);
      } else imageBox.textContent='Без снимка';

      const content = document.createElement('div');
      const titleLine = document.createElement('div'); titleLine.className='admin-product-titleline';
      const h3 = document.createElement('h3'); h3.textContent=p.name; titleLine.appendChild(h3);
      if (p.product_code){ const code=document.createElement('span'); code.className='product-code-chip'; code.textContent=p.product_code; titleLine.appendChild(code); }
      content.appendChild(titleLine);
      const meta = document.createElement('div'); meta.className='admin-product-meta';
      const cat=document.createElement('span'); cat.className='badge'; cat.textContent=categoryName(p.category_id); meta.appendChild(cat);
      const avail=document.createElement('span'); avail.className='badge '+(p.is_available?'green':'red'); avail.textContent=p.is_available?'В наличност':'Няма наличност'; meta.appendChild(avail);
      const active=document.createElement('span'); active.className='badge '+(p.is_active?'green':'red'); active.textContent=p.is_active?'Показва се':'Скрит'; meta.appendChild(active);
      if (p.is_archived){ const ar=document.createElement('span'); ar.className='badge archived'; ar.textContent='Архив'; meta.appendChild(ar); }
      content.appendChild(meta);
      if (p.description){ const d=document.createElement('p'); d.className='admin-product-description'; d.textContent=p.description; content.appendChild(d); }

      const actions = document.createElement('div'); actions.className='product-actions';
      if (p.is_archived){
        actions.appendChild(actionButton('Възстанови',()=>restoreProduct(p),'success'));
        actions.appendChild(actionButton('Изтрий окончателно',()=>deletePermanently(p),'danger'));
      } else {
        actions.appendChild(actionButton('Редакция',()=>{ openEditor(p); },''));
        actions.appendChild(actionButton(p.is_available?'✓ Наличен':'Неналичен',()=>toggleAvailable(p),p.is_available?'success':''));
        actions.appendChild(actionButton(p.is_active?'Скрий':'Покажи',()=>toggleActive(p),p.is_active?'':'success'));
        actions.appendChild(actionButton('↑',()=>moveProduct(p,-1),'order','Премести нагоре'));
        actions.appendChild(actionButton('↓',()=>moveProduct(p,1),'order','Премести надолу'));
        actions.appendChild(actionButton('Дублирай',()=>duplicateProduct(p)));
        actions.appendChild(actionButton(p.is_active?'Виж в сайта':'Преглед',()=>previewOrOpen(p)));
        actions.appendChild(actionButton('Архивирай',()=>archiveProduct(p),'danger'));
      }

      row.append(imageBox,content,actions);
      productList.appendChild(row);
    });
  }

  function resetPreview(){
    if (currentObjectUrl){ URL.revokeObjectURL(currentObjectUrl); currentObjectUrl=''; }
    $('image-preview-img').removeAttribute('src'); $('image-preview').hidden=true;
  }

  function showPreview(url){
    if (!url){ resetPreview(); return; }
    $('image-preview-img').src=url; $('image-preview').hidden=false;
  }

  function openEditor(product){
    if (!schemaReady){ message(dashboardMessage,'Първо пуснете SQL настройката за v1.41 в Supabase.','error'); return; }
    message(editorMessage,''); productForm.reset(); resetPreview();
    const editing=Boolean(product);
    $('editor-title').textContent=editing?'Редакция на продукт':'Нов продукт';
    $('product-id').value=editing?product.id:'';
    $('product-code').value=editing?(product.product_code||''):'';
    $('product-name').value=editing?product.name:'';
    $('product-category').value=editing?String(product.category_id):(categories[0]?String(categories[0].id):'');
    $('product-description').value=editing?(product.description||''):'';
    $('product-available').checked=editing?Boolean(product.is_available):true;
    $('product-active').checked=editing?Boolean(product.is_active):true;
    $('product-show-code').checked=editing?Boolean(product.show_product_code):false;
    $('product-show-code').disabled=!codeVisibilityReady;
    $('product-slug').value=editing?(product.slug||''):'';
    $('product-current-image').value=editing?(product.image_url||''):'';
    const sameCat = products.filter((p)=>!p.is_archived && (!editing || String(p.category_id)===String(product.category_id)));
    $('product-sort-order').value=editing?(product.sort_order??10):((sameCat.reduce((max,p)=>Math.max(max,Number(p.sort_order)||0),0)||0)+10);
    $('image-required-mark').hidden=editing&&Boolean(product.image_url);
    if (editing&&product.image_url) showPreview(product.image_url);
    editorBackdrop.hidden=false; document.body.style.overflow='hidden';
    setTimeout(()=>$('product-code').focus(),0);
  }

  function closeEditor(){
    editorBackdrop.hidden=true; document.body.style.overflow=''; productForm.reset(); resetPreview(); message(editorMessage,'');
  }

  function showAdminPreview(data){
    const wrap=$('preview-content'); wrap.replaceChildren();
    const card=document.createElement('article'); card.className='preview-product-card';
    const name=document.createElement('h3'); name.textContent=data.name||'Име на продукта'; card.appendChild(name);
    if (data.product_code && data.show_product_code){ const code=document.createElement('div'); code.className='preview-product-code'; code.textContent='Код: '+data.product_code; card.appendChild(code); }
    if (data.image_url){ const img=document.createElement('img'); img.src=data.image_url; img.alt=data.name||'Продукт'; card.appendChild(img); }
    if (data.description){ const d=document.createElement('p'); d.textContent=data.description; card.appendChild(d); }
    const a=document.createElement('div'); a.className='preview-availability '+(data.is_available?'is-available':'is-unavailable'); a.textContent=data.is_available?'В наличност':'Временно неналичен'; card.appendChild(a);
    wrap.appendChild(card); previewBackdrop.hidden=false; document.body.style.overflow='hidden';
  }

  function closeAdminPreview(){ previewBackdrop.hidden=true; if (editorBackdrop.hidden) document.body.style.overflow=''; }

  function editorDraft(){
    return {
      name:$('product-name').value.trim(), product_code:$('product-code').value.trim(), show_product_code:$('product-show-code').checked, description:$('product-description').value.trim(),
      image_url:$('image-preview-img').getAttribute('src')||$('product-current-image').value||'', is_available:$('product-available').checked
    };
  }

  async function patchProduct(product, payload, successText){
    if (!schemaReady) throw new Error('Първо пуснете SQL настройката за v1.41.');
    message(dashboardMessage,'Записване…');
    await request('/rest/v1/products?id=eq.'+encodeURIComponent(product.id), {
      method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload)
    }, true);
    await loadData();
    if (successText) message(dashboardMessage,successText,'success');
  }

  async function toggleActive(product){
    try{ await patchProduct(product,{is_active:!product.is_active},product.is_active?'Продуктът е скрит.':'Продуктът се показва в сайта.'); }
    catch(error){ message(dashboardMessage,'Грешка: '+error.message,'error'); }
  }

  async function toggleAvailable(product){
    try{ await patchProduct(product,{is_available:!product.is_available},product.is_available?'Маркиран е като неналичен.':'Маркиран е като наличен.'); }
    catch(error){ message(dashboardMessage,'Грешка: '+error.message,'error'); }
  }

  async function archiveProduct(product){
    if (!window.confirm('Да архивираме ли „'+product.name+'“? Продуктът ще се скрие от сайта, но може да бъде възстановен.')) return;
    try{ await patchProduct(product,{is_archived:true,is_active:false},'Продуктът е преместен в архива.'); }
    catch(error){ message(dashboardMessage,'Грешка: '+error.message,'error'); }
  }

  async function restoreProduct(product){
    try{ await patchProduct(product,{is_archived:false,is_active:false},'Продуктът е възстановен като скрит.'); statusFilter.value='current'; renderProducts(); }
    catch(error){ message(dashboardMessage,'Грешка: '+error.message,'error'); }
  }

  async function deletePermanently(product){
    if (!window.confirm('ОКОНЧАТЕЛНО изтриване на „'+product.name+'“? Ще бъдат изтрити и снимката, и записът. Това не може да се върне.')) return;
    try{
      message(dashboardMessage,'Окончателно изтриване…');
      await request('/rest/v1/products?id=eq.'+encodeURIComponent(product.id), {method:'DELETE',headers:{Prefer:'return=minimal'}}, true);
      await removeStoredImage(product.image_url); await loadData(); message(dashboardMessage,'Продуктът е изтрит окончателно.','success');
    } catch(error){ message(dashboardMessage,'Грешка: '+error.message,'error'); }
  }

  async function moveProduct(product, direction){
    if (!schemaReady) return message(dashboardMessage,'Първо пуснете SQL настройката за v1.41.','error');
    const siblings=products.filter((p)=>!p.is_archived&&String(p.category_id)===String(product.category_id))
      .sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)||String(a.created_at||'').localeCompare(String(b.created_at||'')));
    const index=siblings.findIndex((p)=>String(p.id)===String(product.id));
    const target=index+direction;
    if (index<0||target<0||target>=siblings.length){ message(dashboardMessage,direction<0?'Продуктът вече е най-отгоре.':'Продуктът вече е най-отдолу.'); return; }
    const moved=siblings.splice(index,1)[0]; siblings.splice(target,0,moved);
    try{
      message(dashboardMessage,'Подреждане…');
      await Promise.all(siblings.map((p,i)=>request('/rest/v1/products?id=eq.'+encodeURIComponent(p.id), {
        method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({sort_order:(i+1)*10})
      }, true)));
      await loadData(); message(dashboardMessage,'Подредбата е записана.','success');
    } catch(error){ message(dashboardMessage,'Грешка: '+error.message,'error'); }
  }

  async function duplicateProduct(product){
    if (!schemaReady) return message(dashboardMessage,'Първо пуснете SQL настройката за v1.41.','error');
    let copiedImage='';
    try{
      message(dashboardMessage,'Дублиране…');
      const newSlug=slugify(product.name)+'-'+Date.now().toString(36).slice(-6);
      if (product.image_url) copiedImage=await duplicateImage(product.image_url,newSlug);
      const maxOrder=products.filter((p)=>!p.is_archived&&String(p.category_id)===String(product.category_id)).reduce((m,p)=>Math.max(m,Number(p.sort_order)||0),0);
      const payload={
        name:product.name+' – копие', product_code:null, category_id:product.category_id, slug:newSlug,
        description:product.description||null, image_url:copiedImage||null, is_available:Boolean(product.is_available),
        is_active:false, is_archived:false, sort_order:maxOrder+10
      };
      if (codeVisibilityReady) payload.show_product_code = false;
      const created=await request('/rest/v1/products', {
        method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(payload)
      }, true);
      await loadData();
      const newId=Array.isArray(created)&&created[0]?created[0].id:null;
      const fresh=products.find((p)=>String(p.id)===String(newId)) || (Array.isArray(created)?created[0]:null);
      message(dashboardMessage,'Копието е създадено като скрито. Въведете нов код и го редактирайте.','success');
      if (fresh) openEditor(fresh);
    } catch(error){
      if (copiedImage) await removeStoredImage(copiedImage);
      message(dashboardMessage,'Грешка при дублиране: '+error.message,'error');
    }
  }

  function previewOrOpen(product){
    if (product.is_active && !product.is_archived){
      const slug=categorySlug(product.category_id);
      if (slug){ window.open('/kategoriya/?category='+encodeURIComponent(slug)+'#product-'+encodeURIComponent(product.id),'_blank','noopener'); return; }
    }
    showAdminPreview(product);
  }

  loginForm.addEventListener('submit', async (event)=>{
    event.preventDefault(); if (loginSubmit.disabled) return;
    message(loginMessage,'Влизане…');
    const email=$('login-email').value.trim(); const password=$('login-password').value;
    loginSubmit.disabled=true; loginSubmit.textContent='Влизане…';
    try{
      const auth=await authToken('password',{email,password}); saveSession(auth); $('login-password').value=''; message(loginMessage,''); setLoggedIn(true);
      try{ await loadData(); } catch(dataError){ message(dashboardMessage,'Входът е успешен, но данните не се заредиха: '+dataError.message,'error'); }
      await loadTopTickerSetting();
    } catch(_){ clearSession(); setLoggedIn(false); message(loginMessage,'Неуспешен вход. Проверете имейла и паролата.','error'); }
    finally{ loginSubmit.disabled=false; loginSubmit.textContent='Вход'; }
  });

  if (passwordToggle){
    passwordToggle.addEventListener('click',()=>{
      const input=$('login-password'); const willShow=input.type==='password'; input.type=willShow?'text':'password';
      passwordToggle.classList.toggle('is-visible',willShow); passwordToggle.setAttribute('aria-pressed',willShow?'true':'false');
      passwordToggle.setAttribute('aria-label',willShow?'Скрий паролата':'Покажи паролата');
      try{ input.focus({preventScroll:true}); } catch(_){ input.focus(); }
    });
  }

  $('logout-button').addEventListener('click', async ()=>{
    const session=readSession();
    if (session&&session.access_token){ try{ await fetch(cfg.url+'/auth/v1/logout',{method:'POST',headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+session.access_token}}); } catch(_){} }
    clearSession(); setLoggedIn(false); products=[]; productList.replaceChildren(); switchAdminView('products'); message(loginMessage,'Излязохте от админ панела.','success');
  });

  if (saveTopTickerButton){
    saveTopTickerButton.addEventListener('click', async ()=>{
      if (saveTopTickerButton.disabled) return;
      saveTopTickerButton.disabled = true;
      resetTopTickerButton.disabled = true;
      message(tickerSettingMessage, 'Записване…');
      try{ await persistTopTicker(topTickerInput.value, 'Съобщението е записано. Отвори сайта, за да го видиш.'); }
      catch(error){ message(tickerSettingMessage, error.message || 'Грешка при записването.', 'error'); }
      finally{ saveTopTickerButton.disabled = false; resetTopTickerButton.disabled = false; }
    });
  }

  if (resetTopTickerButton){
    resetTopTickerButton.addEventListener('click', async ()=>{
      const ok = window.confirm('Да върна ли оригиналното движещо се съобщение?');
      if (!ok) return;
      saveTopTickerButton.disabled = true;
      resetTopTickerButton.disabled = true;
      message(tickerSettingMessage, 'Връщане на оригинала…');
      try{ await persistTopTicker(ORIGINAL_TICKER, 'Оригиналното съобщение е възстановено.'); }
      catch(error){ message(tickerSettingMessage, error.message || 'Грешка при възстановяването.', 'error'); }
      finally{ saveTopTickerButton.disabled = false; resetTopTickerButton.disabled = false; }
    });
  }

  $('new-product-button').addEventListener('click',()=>openEditor(null));
  $('editor-close').addEventListener('click',closeEditor);
  $('cancel-edit').addEventListener('click',closeEditor);
  $('preview-edit').addEventListener('click',()=>showAdminPreview(editorDraft()));
  $('preview-close').addEventListener('click',closeAdminPreview);
  editorBackdrop.addEventListener('click',(e)=>{ if(e.target===editorBackdrop) closeEditor(); });
  previewBackdrop.addEventListener('click',(e)=>{ if(e.target===previewBackdrop) closeAdminPreview(); });
  document.addEventListener('keydown',(e)=>{ if(e.key==='Escape'){ if(!previewBackdrop.hidden) closeAdminPreview(); else if(!editorBackdrop.hidden) closeEditor(); } });
  categoryFilter.addEventListener('change',renderProducts);
  statusFilter.addEventListener('change',renderProducts);
  productSearch.addEventListener('input',renderProducts);
  document.querySelectorAll('[data-stat-filter]').forEach((btn)=>btn.addEventListener('click',()=>{ statusFilter.value=btn.dataset.statFilter; renderProducts(); }));

  document.querySelectorAll('[data-admin-view]').forEach((btn)=>btn.addEventListener('click',()=>switchAdminView(btn.dataset.adminView)));
  document.querySelectorAll('[data-analytics-days]').forEach((btn)=>btn.addEventListener('click',()=>{
    analyticsDays=Number(btn.dataset.analyticsDays)||30;
    document.querySelectorAll('[data-analytics-days]').forEach((b)=>b.classList.toggle('is-active',b===btn));
    loadAnalytics();
  }));
  if(analyticsRefresh) analyticsRefresh.addEventListener('click',loadAnalytics);

  if(obituaryType) obituaryType.addEventListener('change',applyObituaryPreset);
  if(obituaryDesign) obituaryDesign.addEventListener('change',()=>{ updateObituaryDesignFields(); applyObituaryLayoutPreset(); scheduleObituaryPreview(); });
  Object.entries(obituaryLocalImages).forEach(([kind,slot])=>{
    const input=$(slot.input),remove=$(slot.remove);
    if(input) input.addEventListener('change',async(event)=>{
      const file=event.target.files&&event.target.files[0];
      try{
        message(obituaryMessage,file?'Зареждане на снимката…':'');
        if(await setObituaryLocalImage(kind,file)) message(obituaryMessage,kind==='background'?'Фонът е добавен. Оригиналната снимка е запазена.':'Снимката на втория човек е добавена.','success');
      }catch(error){event.target.value='';message(obituaryMessage,error.message||'Снимката не можа да бъде добавена.','error');}
    });
    if(remove) remove.addEventListener('click',()=>{resetObituaryLocalImage(kind);message(obituaryMessage,'Снимката е премахната.','success');});
  });
  ['obituary-background-zoom','obituary-background-x','obituary-background-y'].forEach((id)=>{
    const input=$(id);if(input) input.addEventListener('input',()=>{const zoom=$('obituary-background-zoom-value');if(zoom) zoom.textContent=$('obituary-background-zoom').value+'%';scheduleObituaryPreview();});
  });
  const obituaryCeremonyKindInput=$('obituary-ceremony-kind');
  if(obituaryCeremonyKindInput) obituaryCeremonyKindInput.addEventListener('change',()=>{ updateObituaryCeremonyFields(); scheduleObituaryPreview(); });
  if(obituaryGender) obituaryGender.addEventListener('change',()=>{
    applyObituaryLayoutPreset();
    scheduleObituaryPreview();
  });
  if(obituaryBirthDate) obituaryBirthDate.addEventListener('change',updateObituaryAgeFromDates);
  if(obituaryDeathDate) obituaryDeathDate.addEventListener('change',updateObituaryAgeFromDates);
  if(obituaryAge) obituaryAge.addEventListener('input',()=>{ obituaryAgeIsAutomatic=obituaryAge.value===''; scheduleObituaryPreview(); });
  const obituaryCeremonyDateInput=$('obituary-ceremony-date');
  if(obituaryCeremonyDateInput) obituaryCeremonyDateInput.addEventListener('input',()=>{ obituaryCeremonyDateIsAutomatic=false; scheduleObituaryPreview(); });
  if(obituaryPhoto) obituaryPhoto.addEventListener('change',async(event)=>{
    const file=event.target.files&&event.target.files[0];
    try{
      message(obituaryMessage,file?'Подготовка на снимката…':'');
      const result=await setObituaryPhoto(file);
      if(file){
        if(result.autoApplied&&result.reason==='face') message(obituaryMessage,'Снимката е добавена и подготвена автоматично. Ако не ви хареса, изключете автоматичната подготовка или я наместете ръчно.','success');
        else if(result.autoApplied) message(obituaryMessage,'Снимката е добавена. Приложен е безопасен автоматичен вариант. При нужда можете да върнете оригинала или да я наместите ръчно.','success');
        else message(obituaryMessage,'Снимката е добавена. Показва се оригиналният вариант. При нужда включете автоматичната подготовка или използвайте плъзгачите.','success');
      }
    }catch(error){
      event.target.value=''; message(obituaryMessage,error.message||'Снимката не можа да бъде добавена.','error');
    }
  });
  if(obituaryRemovePhoto) obituaryRemovePhoto.addEventListener('click',()=>{ resetObituaryPhoto(); message(obituaryMessage,'Снимката е премахната.','success'); });
  if(obituaryPhotoAuto) obituaryPhotoAuto.addEventListener('change',async()=>{
    if(!obituaryPhotoImage) return;
    try{
      if(obituaryPhotoAuto.checked){
        message(obituaryMessage,'Подготовка на снимката…');
        const preset=await applyAutoObituaryPhoto();
        if(preset&&preset.reason==='face') message(obituaryMessage,'Автоматичната подготовка е приложена.','success');
        else message(obituaryMessage,'Показан е безопасният автоматичен вариант. При нужда я наместете ръчно.','success');
      }else{
        useOriginalObituaryPhoto();
        message(obituaryMessage,'Показва се оригиналният вариант. При нужда можете да наместите снимката ръчно.','success');
      }
    }catch(error){
      message(obituaryMessage,error.message||'Автоматичната подготовка не можа да се приложи.','error');
    }
  });
  if(obituaryPhotoApplyAuto) obituaryPhotoApplyAuto.addEventListener('click',async()=>{
    if(!obituaryPhotoImage) return;
    try{
      if(obituaryPhotoAuto) obituaryPhotoAuto.checked=true;
      message(obituaryMessage,'Подготовка на снимката…');
      const preset=await applyAutoObituaryPhoto();
      if(preset&&preset.reason==='face') message(obituaryMessage,'Автоматичната подготовка е приложена отново.','success');
      else message(obituaryMessage,'Показан е безопасният автоматичен вариант. При нужда я наместете ръчно.','success');
    }catch(error){
      message(obituaryMessage,error.message||'Автоматичната подготовка не можа да се приложи.','error');
    }
  });
  if(obituaryPhotoUseOriginal) obituaryPhotoUseOriginal.addEventListener('click',()=>{
    if(!obituaryPhotoImage) return;
    if(obituaryPhotoAuto) obituaryPhotoAuto.checked=false;
    useOriginalObituaryPhoto();
    message(obituaryMessage,'Показва се оригиналният вариант.','success');
  });
  [obituaryPhotoFit].filter(Boolean).forEach((input)=>input.addEventListener('change',scheduleObituaryPreview));
  [obituaryPhotoZoom,obituaryPhotoX,obituaryPhotoY].filter(Boolean).forEach((input)=>input.addEventListener('input',()=>{
    if(obituaryPhotoZoomValue&&obituaryPhotoZoom) obituaryPhotoZoomValue.textContent=obituaryPhotoZoom.value+'%';
    scheduleObituaryPreview();
  }));
  const prepareSecondPhotoAuto=async(again)=>{
    if(!obituaryLocalImages.second.image) return;
    try{
      if(obituarySecondPhotoUi.auto) obituarySecondPhotoUi.auto.checked=true;
      message(obituaryMessage,'Подготовка на втората снимка…');
      const preset=await applyAutoObituarySecondPhoto();
      if(!preset) return;
      if(preset.reason==='face') message(obituaryMessage,again?'Втората снимка е подготвена автоматично отново.':'Втората снимка е подготвена автоматично.','success');
      else message(obituaryMessage,'Показан е безопасният автоматичен вариант за втората снимка. При нужда я наместете ръчно.','success');
    }catch(error){message(obituaryMessage,error.message||'Автоматичната подготовка на втората снимка не можа да се приложи.','error');}
  };
  if(obituarySecondPhotoUi.auto) obituarySecondPhotoUi.auto.addEventListener('change',()=>{
    if(!obituaryLocalImages.second.image) return;
    if(obituarySecondPhotoUi.auto.checked) prepareSecondPhotoAuto(false);
    else{
      useOriginalObituarySecondPhoto();
      message(obituaryMessage,'Показва се оригиналният вариант на втората снимка. Можете да я наместите ръчно.','success');
    }
  });
  if(obituarySecondPhotoUi.applyAuto) obituarySecondPhotoUi.applyAuto.addEventListener('click',()=>prepareSecondPhotoAuto(true));
  if(obituarySecondPhotoUi.useOriginal) obituarySecondPhotoUi.useOriginal.addEventListener('click',()=>{
    if(!obituaryLocalImages.second.image) return;
    if(obituarySecondPhotoUi.auto) obituarySecondPhotoUi.auto.checked=false;
    useOriginalObituarySecondPhoto();
    message(obituaryMessage,'Показва се оригиналният вариант на втората снимка.','success');
  });
  if(obituarySecondPhotoUi.fit) obituarySecondPhotoUi.fit.addEventListener('change',()=>{
    obituaryLocalImages.second.adjustmentRequest+=1;
    scheduleObituaryPreview();
  });
  [obituarySecondPhotoUi.zoom,obituarySecondPhotoUi.x,obituarySecondPhotoUi.y].filter(Boolean).forEach((input)=>input.addEventListener('input',()=>{
    obituaryLocalImages.second.adjustmentRequest+=1;
    if(obituarySecondPhotoUi.zoomValue&&obituarySecondPhotoUi.zoom) obituarySecondPhotoUi.zoomValue.textContent=obituarySecondPhotoUi.zoom.value+'%';
    scheduleObituaryPreview();
  }));
  if(obituaryForm){
    obituaryForm.querySelectorAll('input:not([type="file"]):not([type="range"]),textarea,select').forEach((input)=>input.addEventListener('input',scheduleObituaryPreview));
    obituaryForm.addEventListener('submit',async(event)=>{
      event.preventDefault();
      try{ await renderObituaryPreview(true); }
      catch(error){ message(obituaryMessage,error.message||'Некрологът не можа да бъде създаден.','error'); }
    });
  }
  if(obituaryDownloadButton) obituaryDownloadButton.addEventListener('click',async()=>{
    const originalLabel='Изтегли готов PDF';
    try{
      obituaryDownloadButton.disabled=true; obituaryDownloadButton.textContent='Създаване на PDF…'; message(obituaryMessage,'Създаване на готовия PDF…');
      await downloadObituaryPdf(); message(obituaryMessage,'PDF файлът е готов за печат.','success');
    }catch(error){ message(obituaryMessage,error.message||'PDF файлът не можа да бъде създаден.','error'); }
    finally{ obituaryDownloadButton.disabled=false; obituaryDownloadButton.textContent=originalLabel; }
  });
  const obituaryResetButton=$('obituary-reset-button');
  if(obituaryResetButton) obituaryResetButton.addEventListener('click',()=>{
    const hasData=String($('obituary-name').value||'').trim()||obituaryPhotoImage;
    if(hasData&&!window.confirm('Да изчистя ли текущия некролог и да започна нов?')) return;
    resetObituaryForm();
  });

  if(bookletDeathDate){
    bookletDeathDate.addEventListener('input',invalidateBookletPreview);
    bookletDeathDate.addEventListener('change',calculateBookletDates);
  }
  if(bookletName) bookletName.addEventListener('input',invalidateBookletPreview);
  document.querySelectorAll('[data-booklet-date]').forEach((input)=>input.addEventListener('input',invalidateBookletPreview));
  const bookletCalculateButton=$('booklet-calculate');
  if(bookletCalculateButton) bookletCalculateButton.addEventListener('click',calculateBookletDates);
  if(bookletAddZadushnitsa) bookletAddZadushnitsa.addEventListener('click',()=>addZadushnitsaRow('',''));
  if(bookletZadushnitsiList&&!bookletZadushnitsiList.children.length) addZadushnitsaRow('','');
  if(bookletForm) bookletForm.addEventListener('submit',(event)=>{
    event.preventDefault();
    try{
      const hasEmpty=Array.from(document.querySelectorAll('[data-booklet-date]')).some((input)=>!input.value);
      if(hasEmpty && !calculateBookletDates()) return;
      renderBooklet();
    }catch(error){ message(bookletMessage,error.message||'Книжката не можа да бъде създадена.','error'); }
  });
  if(bookletPrintButton) bookletPrintButton.addEventListener('click',async()=>{
    const originalLabel='Изтегли готов PDF';
    try{
      renderBooklet();
      bookletPrintButton.disabled=true; bookletPrintButton.textContent='Създаване на PDF…'; message(bookletMessage,'Създаване на готовия PDF…');
      await downloadBookletPdf(); message(bookletMessage,'PDF файлът е готов: A4, двустранно, дълъг ръб, 100%. Разрежете двата листа по хоризонталната линия, подредете половинките и сгънете.','success');
    }catch(error){ message(bookletMessage,error.message||'PDF файлът не можа да бъде създаден.','error'); }
    finally{ bookletPrintButton.disabled=false; bookletPrintButton.textContent=originalLabel; }
  });

  const manualBookletStart=$('booklet-manual-start');
  if(manualBookletStart) manualBookletStart.addEventListener('click',startManualBookletPrint);
  const manualBookletNext=$('booklet-manual-next');
  if(manualBookletNext) manualBookletNext.addEventListener('click',advanceManualBookletPrint);
  const manualBookletOpen=$('booklet-manual-open');
  if(manualBookletOpen) manualBookletOpen.addEventListener('click',openManualBookletPrint);
  const manualBookletReset=$('booklet-manual-reset');
  if(manualBookletReset) manualBookletReset.addEventListener('click',()=>{resetManualBookletPrint();if(manualBookletStart)manualBookletStart.disabled=false;});

  $('product-image').addEventListener('change',(event)=>{
    resetPreview(); const file=event.target.files&&event.target.files[0];
    if (file){ currentObjectUrl=URL.createObjectURL(file); showPreview(currentObjectUrl); }
    else if ($('product-current-image').value) showPreview($('product-current-image').value);
  });

  productForm.addEventListener('submit', async (event)=>{
    event.preventDefault();
    if (!schemaReady){ message(editorMessage,'Първо пуснете SQL настройката за v1.41 в Supabase.','error'); return; }
    message(editorMessage,'Записване…'); saveButton.disabled=true; productForm.classList.add('loading');

    const id=$('product-id').value; const editing=Boolean(id); const code=$('product-code').value.trim();
    const name=$('product-name').value.trim(); const categoryId=$('product-category').value; const description=$('product-description').value.trim();
    const file=$('product-image').files&&$('product-image').files[0]; const oldImage=$('product-current-image').value;
    const slug=editing&&$('product-slug').value?$('product-slug').value:slugify(name)+'-'+Date.now().toString(36).slice(-5);
    let newImage='';

    try{
      if (!editing&&!file) throw new Error('Изберете една снимка за продукта.');
      if (!code) throw new Error('Въведете код на продукта.');
      if (!name) throw new Error('Въведете име на продукта.');
      if (!categoryId) throw new Error('Изберете категория.');
      const duplicateCode=products.find((p)=>String(p.id)!==String(id)&&norm(p.product_code)===norm(code));
      if (duplicateCode) throw new Error('Вече има продукт с код „'+code+'“. Въведете друг код.');
      if (file) newImage=await uploadImage(file,slug);
      const originalProduct=editing?products.find((p)=>String(p.id)===String(id)):null;
      let sortOrder=Number($('product-sort-order').value)||10;
      if (!editing || !originalProduct || String(originalProduct.category_id)!==String(categoryId)){
        sortOrder=products.filter((p)=>!p.is_archived&&String(p.category_id)===String(categoryId)&&String(p.id)!==String(id))
          .reduce((max,p)=>Math.max(max,Number(p.sort_order)||0),0)+10;
      }
      const payload={
        name, product_code:code, category_id:/^\d+$/.test(categoryId)?Number(categoryId):categoryId, slug,
        description:description||null, image_url:newImage||oldImage||null, is_available:$('product-available').checked,
        is_active:$('product-active').checked, is_archived:false, sort_order:sortOrder
      };
      if (codeVisibilityReady) payload.show_product_code = $('product-show-code').checked;
      if (editing){
        await request('/rest/v1/products?id=eq.'+encodeURIComponent(id), {method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload)}, true);
      } else {
        await request('/rest/v1/products', {method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload)}, true);
      }
      if (newImage&&oldImage&&newImage!==oldImage) await removeStoredImage(oldImage);
      closeEditor(); await loadData(); message(dashboardMessage,editing?'Промените са записани.':'Продуктът е добавен.','success');
    } catch(error){
      if (newImage) await removeStoredImage(newImage);
      message(editorMessage,error.message||'Възникна грешка при записването.','error');
    } finally{ saveButton.disabled=false; productForm.classList.remove('loading'); }
  });

  if(obituaryForm){
    applyObituaryPreset();updateObituaryDesignFields();
    loadObituaryArtwork().catch((error)=>message(obituaryMessage,error.message,'error'));
  }
  switchAdminView('products');

  async function boot(){
    const session=await ensureSession(); const loggedIn=Boolean(session&&session.access_token); setLoggedIn(loggedIn); if(!loggedIn)return;
    try{ await loadData(); } catch(error){ message(dashboardMessage,'Админ панелът е отворен, но данните не се заредиха: '+error.message,'error'); }
    await loadTopTickerSetting();
  }

  boot();
})();
