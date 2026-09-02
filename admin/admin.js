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
  const obituaryBirthDate = $('obituary-birth-date');
  const obituaryDeathDate = $('obituary-death-date');
  const obituaryAge = $('obituary-age');
  const obituaryMessage = $('obituary-message');
  const obituaryDownloadButton = $('obituary-download-button');
  const obituaryPreviewArea = $('obituary-preview-area');
  const obituaryPreviewCanvas = $('obituary-preview-canvas');
  const obituaryPreviewFormat = $('obituary-preview-format');
  let obituaryPhotoUrl = '';
  let obituaryPhotoImage = null;
  let obituaryPreviewTimer = 0;
  let obituaryAgeIsAutomatic = true;
  let obituaryCeremonyDateIsAutomatic = true;

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
      '/':'Начало','/index.html':'Начало','/uslugi.html':'Услуги','/traurni-stoki.html':'Траурни стоки',
      '/kontakti.html':'Контакти','/faq.html':'Често задавани въпроси','/za-nas.html':'За нас',
      '/pri-smarten-sluchai.html':'При смъртен случай','/organizirane-na-pogrebenie.html':'Организиране на погребение',
      '/kremacia.html':'Кремация','/pomeni.html':'Помен и панихида','/pogrebalen-transport.html':'Погребален транспорт',
      '/nekrolozi.html':'Некролози','/politika-za-poveritelnost.html':'Политика за поверителност',
      '/politika-za-biskvitki.html':'Политика за бисквитки','/404.html':'404'
    };
    if(names[raw]) return names[raw];
    if(raw.startsWith('/kategoriya.html?category=')){
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
    $('obituary-extra-text').value=preset.extra||'';
    $('obituary-closing').value=preset.closing[obituaryGender&&obituaryGender.value||'male']||preset.closing.neutral;
    $('obituary-ceremony-kind').value=preset.ceremony;
    updateObituaryCeremonyDateFromDeath(true);
    scheduleObituaryPreview();
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

  function resetObituaryPhoto(){
    if(obituaryPhotoUrl) URL.revokeObjectURL(obituaryPhotoUrl);
    obituaryPhotoUrl=''; obituaryPhotoImage=null;
    if(obituaryPhoto) obituaryPhoto.value='';
    if(obituaryPhotoName) obituaryPhotoName.textContent='Няма избрана снимка';
    if(obituaryPhotoControls) obituaryPhotoControls.hidden=true;
    if(obituaryRemovePhoto) obituaryRemovePhoto.hidden=true;
    if(obituaryPhotoZoom) obituaryPhotoZoom.value='100';
    if(obituaryPhotoFit) obituaryPhotoFit.value='contain';
    if(obituaryPhotoZoomValue) obituaryPhotoZoomValue.textContent='100%';
    if(obituaryPhotoX) obituaryPhotoX.value='0';
    if(obituaryPhotoY) obituaryPhotoY.value='0';
    scheduleObituaryPreview();
  }

  async function setObituaryPhoto(file){
    if(!file){ resetObituaryPhoto(); return; }
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
    obituaryPhotoUrl=url; obituaryPhotoImage=image;
    if(obituaryPhotoName) obituaryPhotoName.textContent=file.name;
    if(obituaryPhotoControls) obituaryPhotoControls.hidden=false;
    if(obituaryRemovePhoto) obituaryRemovePhoto.hidden=false;
    if(obituaryPhotoZoom) obituaryPhotoZoom.value='100';
    if(obituaryPhotoFit) obituaryPhotoFit.value='contain';
    if(obituaryPhotoZoomValue) obituaryPhotoZoomValue.textContent='100%';
    if(obituaryPhotoX) obituaryPhotoX.value='0';
    if(obituaryPhotoY) obituaryPhotoY.value='0';
    scheduleObituaryPreview();
  }

  function readObituaryModel(){
    const title=String($('obituary-title').value||'').trim();
    const name=String($('obituary-name').value||'').trim();
    if(!title) throw new Error('Въведете заглавие на некролога.');
    if(!name) throw new Error('Въведете името на покойника.');
    const birth=parseObituaryDate(obituaryBirthDate&&obituaryBirthDate.value);
    const death=parseObituaryDate(obituaryDeathDate&&obituaryDeathDate.value);
    if(birth&&death&&death<birth) throw new Error('Датата на смъртта не може да бъде преди датата на раждане.');
    const rawAge=String(obituaryAge&&obituaryAge.value||'').trim();
    const age=rawAge===''?null:Number(rawAge);
    if(age!==null&&(!Number.isInteger(age)||age<0||age>130)) throw new Error('Проверете въведената възраст.');
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
      extraText:String($('obituary-extra-text').value||'').trim(),
      closing:String($('obituary-closing').value||'').trim(),
      from:String($('obituary-from').value||'').trim(),
      agencyFooter:Boolean($('obituary-agency-footer').checked),
      photo:obituaryPhotoImage,
      photoFit:obituaryPhotoFit&&obituaryPhotoFit.value||'contain',
      photoZoom:Number(obituaryPhotoZoom&&obituaryPhotoZoom.value||100),
      photoX:Number(obituaryPhotoX&&obituaryPhotoX.value||0),
      photoY:Number(obituaryPhotoY&&obituaryPhotoY.value||0)
    };
  }

  function buildObituaryCeremonyText(model){
    if(model.ceremonyKind==='none'||model.ceremonyKind==='custom') return '';
    if(!model.ceremonyDate&&!model.ceremonyTime&&!model.ceremonyPlace) return '';
    const names={viewing:'Поклонението',service:'Опелото',funeral:'Погребението',memorial:'Панихидата'};
    let text=model.ceremonyKind==='service'?'Опелото ще се отслужи':(names[model.ceremonyKind]||'Церемонията')+' ще се състои';
    if(model.ceremonyDate) text+=' на '+formatObituaryLongDate(model.ceremonyDate);
    if(model.ceremonyTime) text+=' от '+model.ceremonyTime+' ч.';
    if(model.ceremonyPlace) text+=' в '+model.ceremonyPlace;
    if(!/[.!?]$/.test(text)) text+='.';
    return text;
  }

  function obituaryWrappedLines(ctx,text,maxWidth){
    const lines=[];
    String(text||'').split(/\r?\n/).forEach((paragraph,index,all)=>{
      const words=paragraph.trim().split(/\s+/).filter(Boolean);
      if(!words.length){ if(index<all.length-1) lines.push(''); return; }
      let line='';
      words.forEach((word)=>{
        const test=line?line+' '+word:word;
        if(line&&ctx.measureText(test).width>maxWidth){ lines.push(line); line=word; }
        else line=test;
      });
      if(line) lines.push(line);
    });
    return lines;
  }

  function drawObituaryText(ctx,text,y,options){
    if(!String(text||'').trim()) return y;
    const opts=Object.assign({x:620,maxWidth:1000,size:28,lineHeight:38,gapAfter:18,family:'Georgia',weight:'normal',style:'normal',color:'#181515',uppercase:false,align:'center'},options||{});
    const value=opts.uppercase?String(text).toLocaleUpperCase('bg-BG'):String(text);
    ctx.font=opts.style+' '+opts.weight+' '+Math.round(opts.size)+'px '+opts.family;
    ctx.fillStyle=opts.color; ctx.textAlign=opts.align; ctx.textBaseline='top';
    const lines=obituaryWrappedLines(ctx,value,opts.maxWidth);
    lines.forEach((line,index)=>{ if(line) ctx.fillText(line,opts.x,y+index*opts.lineHeight); });
    return y+lines.length*opts.lineHeight+opts.gapAfter;
  }

  function drawObituaryCross(ctx,cx,y,height,color,lineWidth){
    const width=height*.58; const barY=y+height*.38;
    ctx.save(); ctx.strokeStyle=color||'#171313'; ctx.lineWidth=lineWidth||8; ctx.lineCap='square';
    ctx.beginPath(); ctx.moveTo(cx,y); ctx.lineTo(cx,y+height); ctx.moveTo(cx-width/2,barY); ctx.lineTo(cx+width/2,barY); ctx.stroke(); ctx.restore();
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

  function drawObituaryDove(ctx,cx,cy,size,flip){
    ctx.save(); ctx.translate(cx,cy); ctx.scale(flip?-1:1,1); ctx.fillStyle='#a5a7a8'; ctx.globalAlpha=.8;
    ctx.beginPath(); ctx.moveTo(-.42*size,.14*size); ctx.bezierCurveTo(-.26*size,.02*size,-.08*size,-.02*size,.1*size,.03*size); ctx.bezierCurveTo(.2*size,.06*size,.3*size,.02*size,.35*size,-.07*size); ctx.arc(.34*size,-.13*size,.09*size,.55,Math.PI*2+.55); ctx.bezierCurveTo(.24*size,-.03*size,.16*size,.15*size,-.01*size,.23*size); ctx.bezierCurveTo(-.17*size,.3*size,-.31*size,.25*size,-.42*size,.14*size); ctx.fill();
    ctx.beginPath(); ctx.moveTo(.42*size,-.15*size); ctx.lineTo(.57*size,-.11*size); ctx.lineTo(.42*size,-.06*size); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-.05*size,.08*size); ctx.bezierCurveTo(-.2*size,-.08*size,-.19*size,-.38*size,-.08*size,-.55*size); ctx.bezierCurveTo(.02*size,-.39*size,.08*size,-.19*size,.12*size,.05*size); ctx.bezierCurveTo(.07*size,.12*size,.02*size,.14*size,-.05*size,.08*size); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-.34*size,.15*size); ctx.lineTo(-.57*size,.25*size); ctx.lineTo(-.45*size,.07*size); ctx.lineTo(-.62*size,.03*size); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function drawObituaryCandleBackground(ctx){
    const bg=ctx.createLinearGradient(0,0,1240,1754); bg.addColorStop(0,'#090807'); bg.addColorStop(.52,'#24201b'); bg.addColorStop(1,'#070707'); ctx.fillStyle=bg; ctx.fillRect(0,0,1240,1754);
    const glow=ctx.createRadialGradient(620,650,20,620,650,520); glow.addColorStop(0,'rgba(255,215,135,.72)'); glow.addColorStop(.25,'rgba(204,133,61,.28)'); glow.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=glow; ctx.fillRect(80,100,1080,1200);
    ctx.save(); ctx.globalAlpha=.5; ctx.fillStyle='#e6c18c'; ctx.fillRect(585,620,70,520); ctx.fillStyle='#fff2d5'; ctx.beginPath(); ctx.moveTo(620,555); ctx.bezierCurveTo(560,635,596,694,620,700); ctx.bezierCurveTo(648,674,681,620,620,555); ctx.fill(); ctx.restore();
  }

  function drawObituaryFrame(ctx,design){
    if(design==='candle') drawObituaryCandleBackground(ctx);
    else{ ctx.fillStyle='#fff'; ctx.fillRect(0,0,1240,1754); }
    const dark=design==='candle'; const color=dark?'#d5a85c':'#151515';
    ctx.save(); ctx.strokeStyle=color; ctx.lineWidth=dark?5:4; ctx.strokeRect(44,44,1152,1666); ctx.lineWidth=2; ctx.strokeRect(58,58,1124,1638);
    if(design==='crosses'){
      drawObituaryCornerCross(ctx,130,145,90,color); drawObituaryCornerCross(ctx,1110,145,90,color);
    }else if(design==='doves'){
      drawObituaryDove(ctx,145,135,125,false); drawObituaryDove(ctx,1095,135,125,true);
    }else{
      const corners=[[78,78,1,1],[1162,78,-1,1],[78,1676,1,-1],[1162,1676,-1,-1]]; ctx.lineWidth=4;
      corners.forEach(([x,y,dx,dy])=>{ ctx.beginPath(); ctx.moveTo(x,y+dy*38); ctx.lineTo(x,y); ctx.lineTo(x+dx*38,y); ctx.stroke(); });
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

  function drawObituaryAgencyFooter(ctx,dark){
    ctx.save(); ctx.strokeStyle=dark?'#9d7843':'#555'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(78,1638); ctx.lineTo(1162,1638); ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillStyle=dark?'#ead1a4':'#292929'; ctx.font='italic bold 18px Georgia';
    ctx.fillText('Траурна агенция „Ден и Нощ“ (срещу полицията)   0898 24 24 34   0893 64 66 68   deninosht.bg',620,1652); ctx.restore();
  }

  function obituaryNameParts(name){
    return String(name||'').trim().split(/\s+/).filter(Boolean).map((part)=>{
      const lower=part.toLocaleLowerCase('bg-BG');
      return lower.charAt(0).toLocaleUpperCase('bg-BG')+lower.slice(1);
    });
  }

  function obituaryHeadingParts(model){
    if(model.type==='death') return {title:model.title||'СКРЪБНА ВЕСТ',period:''};
    const periods={day40:'40 ДНИ',month3:'ТРИ МЕСЕЦА',month6:'ШЕСТ МЕСЕЦА',month9:'ДЕВЕТ МЕСЕЦА',year1:'ЕДНА ГОДИНА'};
    return {title:'ВЪЗПОМЕНАНИЕ',period:periods[model.type]||''};
  }

  function paintObituaryCrossTemplate(ctx,model,scale){
    drawObituaryFrame(ctx,'crosses');
    const ink='#171515'; const heading=obituaryHeadingParts(model); const isDeath=model.type==='death';
    drawObituaryText(ctx,heading.title,130,{size:58*scale,lineHeight:66*scale,gapAfter:0,maxWidth:780,weight:'bold',family:'Georgia',color:ink,uppercase:true});
    if(heading.period) drawObituaryText(ctx,heading.period,208,{size:45*scale,lineHeight:53*scale,gapAfter:0,maxWidth:760,weight:'bold',family:'Georgia',color:ink,uppercase:true});

    drawObituaryText(ctx,model.intro||(isDeath?'С много болка съобщаваме,':'С болка и обич си спомняме за'),isDeath?300:315,{size:26*scale,lineHeight:35*scale,gapAfter:0,maxWidth:850,style:'italic',color:'#302b29'});
    if(isDeath){
      const deathLine=model.death?'че на '+formatObituaryShortDate(model.death):'че';
      drawObituaryText(ctx,deathLine,352,{size:25*scale,lineHeight:34*scale,gapAfter:0,maxWidth:850,style:'italic',color:'#302b29'});
      drawObituaryText(ctx,'внезапно ни напусна',404,{size:26*scale,lineHeight:35*scale,gapAfter:0,maxWidth:850,weight:'bold',style:'italic',color:'#302b29'});
    }

    const parts=obituaryNameParts(model.name); const nameSize=(parts.length>3?55:63)*scale; const nameLine=80*scale;
    let nameY=isDeath?510:405;
    parts.forEach((part)=>{ drawObituaryText(ctx,part,nameY,{size:nameSize,lineHeight:nameLine,gapAfter:0,maxWidth:820,weight:'bold',family:'Georgia',color:ink}); nameY+=nameLine; });
    if(model.birth){
      const born=model.gender==='female'?'родена':'роден';
      drawObituaryText(ctx,born+' '+model.birth.getFullYear()+' година',nameY+4*scale,{size:22*scale,lineHeight:30*scale,gapAfter:0,maxWidth:760,style:'italic',color:'#37312f'});
    }
    if(model.age!==null) drawObituaryText(ctx,'на '+model.age+' години',nameY+38*scale,{size:23*scale,lineHeight:31*scale,gapAfter:0,maxWidth:760,weight:'bold',style:'italic',color:'#37312f'});

    const poem=model.extraText||'Мъка къса ни сърцата,\nпред твоя гроб стоим, стоим\nи ниско свели сме челата,\nдокато сме живи ще скърбим!';
    drawObituaryText(ctx,poem,940,{size:33*scale,lineHeight:44*scale,gapAfter:0,maxWidth:830,color:ink});

    let ceremony='';
    if(model.ceremonyKind!=='none'&&model.ceremonyKind!=='custom'){
      const labels={viewing:'Поклонението ще се състои',service:'Опелото ще се отслужи',funeral:'Погребението ще се състои',memorial:'Панихидата ще се състои'};
      ceremony=labels[model.ceremonyKind]||'Церемонията ще се състои';
      if(model.ceremonyDate) ceremony+=' на '+formatObituaryShortDate(model.ceremonyDate);
      if(model.ceremonyTime) ceremony+=' от '+model.ceremonyTime+' часа';
      if(model.ceremonyPlace) ceremony+='\nв '+model.ceremonyPlace;
    }
    if(ceremony) drawObituaryText(ctx,ceremony,1380,{size:24*scale,lineHeight:38*scale,gapAfter:0,maxWidth:930,style:'italic',color:'#302b29'});
    drawObituaryText(ctx,'От семейството',1525,{x:1080,size:24*scale,lineHeight:32*scale,gapAfter:0,maxWidth:500,weight:'bold',style:'italic',align:'right',color:ink});
    if(model.agencyFooter) drawObituaryAgencyFooter(ctx,false);
    return 1580;
  }

  function paintObituary(ctx,model,scale){
    if(model.design==='crosses') return paintObituaryCrossTemplate(ctx,model,scale);
    drawObituaryFrame(ctx,model.design);
    const dark=model.design==='candle'; const ink=dark?'#fff5e8':'#171515'; const accent=dark?'#e2b257':'#171515'; const secondary=dark?'#f1d7ad':'#36302d';
    const heading=obituaryHeadingParts(model); const titleSize=(heading.title.length>32?45:heading.title.length>22?51:58)*scale; let y=105;
    y=drawObituaryText(ctx,heading.title,y,{size:titleSize,lineHeight:titleSize*1.08,gapAfter:heading.period?8*scale:45*scale,maxWidth:850,weight:'bold',family:'Arial',color:accent,uppercase:true});
    if(heading.period) y=drawObituaryText(ctx,heading.period,y,{size:44*scale,lineHeight:50*scale,gapAfter:38*scale,maxWidth:820,weight:'bold',family:'Arial',color:accent,uppercase:true});
    y=drawObituaryText(ctx,model.intro,y,{size:27*scale,lineHeight:38*scale,gapAfter:34*scale,maxWidth:850,style:'italic',color:secondary});

    const dateParts=[];
    if(model.birth) dateParts.push('* '+formatObituaryShortDate(model.birth));
    if(model.death) dateParts.push('† '+formatObituaryShortDate(model.death));
    const nameSize=(model.name.length>42?48:model.name.length>28?55:64)*scale;
    if(model.photo&&model.design!=='candle'){
      const photoX=145,photoY=Math.max(y+12,445),photoWidth=370*scale,photoHeight=465*scale;
      drawObituaryPortrait(ctx,model.photo,photoX,photoY,photoWidth,photoHeight,model,false);
      let sideY=photoY+38*scale;
      sideY=drawObituaryText(ctx,model.name,sideY,{x:825,size:nameSize,lineHeight:nameSize*1.08,gapAfter:18*scale,maxWidth:540,weight:'bold',color:ink,uppercase:true});
      if(model.age!==null) sideY=drawObituaryText(ctx,model.age+' г.',sideY,{x:825,size:28*scale,lineHeight:35*scale,gapAfter:12*scale,maxWidth:500,weight:'bold',style:'italic',color:secondary});
      if(dateParts.length) sideY=drawObituaryText(ctx,dateParts.join('   '),sideY,{x:825,size:21*scale,lineHeight:29*scale,gapAfter:8*scale,maxWidth:540,family:'Arial',color:secondary});
      y=Math.max(photoY+photoHeight+55*scale,sideY+28*scale);
    }else{
      if(model.photo&&dark){ const pw=300*scale,ph=365*scale; drawObituaryPortrait(ctx,model.photo,620-pw/2,y,pw,ph,model,true); y+=ph+38*scale; }
      else if(!dark){ drawObituaryCross(ctx,620,y+3*scale,105*scale,accent,9*scale); y+=140*scale; }
      y=drawObituaryText(ctx,model.name,y,{size:nameSize,lineHeight:nameSize*1.08,gapAfter:13*scale,maxWidth:900,weight:'bold',color:ink,uppercase:true});
      if(model.age!==null) y=drawObituaryText(ctx,model.age+' г.',y,{size:26*scale,lineHeight:34*scale,gapAfter:8*scale,maxWidth:700,weight:'bold',style:'italic',color:secondary});
      if(dateParts.length) y=drawObituaryText(ctx,dateParts.join('     '),y,{size:21*scale,lineHeight:29*scale,gapAfter:20*scale,maxWidth:800,family:'Arial',color:secondary});
    }

    const ceremony=buildObituaryCeremonyText(model);
    if(model.extraText) y=drawObituaryText(ctx,model.extraText,y,{size:30*scale,lineHeight:41*scale,gapAfter:36*scale,maxWidth:930,weight:'bold',style:'italic',color:ink});
    if(ceremony) y=drawObituaryText(ctx,ceremony,y,{size:25*scale,lineHeight:35*scale,gapAfter:18*scale,maxWidth:950,style:'italic',color:secondary});
    const closingAnchor=model.photo?1260:dark?1180:1110; y=Math.max(y+12*scale,closingAnchor);
    if(model.closing){
      y=drawObituaryText(ctx,model.closing,y,{size:31*scale,lineHeight:42*scale,gapAfter:25*scale,maxWidth:900,weight:'bold',style:'italic',color:accent,uppercase:true});
    }
    if(model.from) y=drawObituaryText(ctx,model.from,y,{x:1080,size:23*scale,lineHeight:31*scale,gapAfter:8*scale,maxWidth:820,weight:'bold',style:'italic',align:'right',color:secondary});
    if(model.agencyFooter) drawObituaryAgencyFooter(ctx,dark);
    return y;
  }

  async function createObituaryCanvas(model,targetCanvas){
    const canvas=targetCanvas||document.createElement('canvas'); canvas.width=1240; canvas.height=1754;
    const ctx=canvas.getContext('2d',{alpha:false});
    const limit=model.agencyFooter?1615:1680;
    let fitted=false;
    for(const scale of [1,.92,.85,.78,.72]){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const bottom=paintObituary(ctx,model,scale);
      if(bottom<=limit){ fitted=true; break; }
    }
    if(!fitted) throw new Error('Текстът е прекалено дълъг за една страница. Съкратете допълнителния или прощалния текст.');
    return canvas;
  }

  function scheduleObituaryPreview(){
    if(!obituaryPreviewArea||obituaryPreviewArea.hidden) return;
    if(obituaryDownloadButton) obituaryDownloadButton.disabled=true;
    window.clearTimeout(obituaryPreviewTimer);
    obituaryPreviewTimer=window.setTimeout(()=>{
      renderObituaryPreview(false).catch((error)=>message(obituaryMessage,error.message||'Прегледът не можа да бъде обновен.','error'));
    },120);
  }

  async function renderObituaryPreview(scroll){
    const model=readObituaryModel();
    message(obituaryMessage,'Създаване на преглед…');
    await createObituaryCanvas(model,obituaryPreviewCanvas);
    obituaryPreviewArea.hidden=false;
    obituaryDownloadButton.disabled=false;
    obituaryPreviewFormat.textContent=model.output==='a5x2'?'A4 хоризонтално — два еднакви некролога за изрязване':'A4 — една страница';
    message(obituaryMessage,'Некрологът е готов за проверка и изтегляне.','success');
    if(scroll!==false) obituaryPreviewArea.scrollIntoView({behavior:'smooth',block:'start'});
    return model;
  }

  async function downloadObituaryPdf(){
    if(!window.PDFLib||!window.PDFLib.PDFDocument) throw new Error('PDF модулът не е зареден. Обновете страницата и опитайте отново.');
    const model=readObituaryModel(); const canvas=await createObituaryCanvas(model);
    const pdf=await window.PDFLib.PDFDocument.create();
    pdf.setTitle('Некролог - '+model.name); pdf.setAuthor('Траурна агенция Ден и Нощ'); pdf.setCreator('deninosht.bg');
    const image=await pdf.embedJpg(canvas.toDataURL('image/jpeg',.98));
    if(model.output==='a5x2'){
      const page=pdf.addPage([841.89,595.28]);
      page.drawImage(image,{x:0,y:0,width:420.945,height:595.28});
      page.drawImage(image,{x:420.945,y:0,width:420.945,height:595.28});
      page.drawLine({start:{x:420.945,y:0},end:{x:420.945,y:595.28},thickness:.7,color:window.PDFLib.rgb(.72,.69,.66),dashArray:[5,5]});
    }else{
      const page=pdf.addPage([595.28,841.89]); page.drawImage(image,{x:0,y:0,width:595.28,height:841.89});
    }
    const bytes=await pdf.save({useObjectStreams:true}); const blob=new Blob([bytes],{type:'application/pdf'}); const url=URL.createObjectURL(blob);
    const link=document.createElement('a'); link.href=url; link.download='nekrolog-'+slugify(model.name)+'.pdf'; link.rel='noopener';
    if(/iPad|iPhone|iPod/i.test(navigator.userAgent||'')) link.target='_blank';
    document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(()=>URL.revokeObjectURL(url),60000);
  }

  function resetObituaryForm(){
    if(!obituaryForm) return;
    obituaryForm.reset(); resetObituaryPhoto(); obituaryAgeIsAutomatic=true; obituaryCeremonyDateIsAutomatic=true; applyObituaryPreset();
    window.clearTimeout(obituaryPreviewTimer);
    if(obituaryPreviewArea) obituaryPreviewArea.hidden=true;
    if(obituaryDownloadButton) obituaryDownloadButton.disabled=true;
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
    if(pageNumber===3){
      appendBookletText(content,'p','Първи възпоменателни дни','booklet-kicker'); appendBookletText(content,'h2','Трети и девети ден');
      const earlyDates=document.createElement('div'); earlyDates.className='booklet-early-dates'; content.appendChild(earlyDates);
      const third=document.createElement('div'); appendBookletText(third,'strong','Трети ден'); appendBookletText(third,'span',dateLine('day3')); earlyDates.appendChild(third);
      const ninth=document.createElement('div'); appendBookletText(ninth,'strong','Девети ден'); appendBookletText(ninth,'span',dateLine('day9')); earlyDates.appendChild(ninth);
      appendBookletText(content,'p','Третият и деветият ден са сред основните ранни възпоменателни дни. Близките се събират за молитва и почит към покойника.');
      appendBookletList(content,['Уговорете часа със свещеник.','Подгответе свещи и необходимото според указанията му.','По желание подгответе малки раздавки.']);
    }
    if(pageNumber===4){
      appendBookletText(content,'p','Панихида','booklet-kicker'); appendBookletText(content,'h2','Двадесети ден'); appendBookletText(content,'p',dateLine('day20'),'booklet-page-date');
      appendBookletText(content,'p','На двадесетия ден в българската православна традиция се прави панихида. Тя може да бъде в храм или на гроба според уговорката със свещеника.');
      appendBookletList(content,['Свържете се предварително с храма или свещеника.','Подгответе жито, хляб или погача, вино и свещи.','Уведомете близките за часа и мястото.']);
    }
    if(pageNumber===5){
      appendBookletText(content,'p','Основна панихида','booklet-kicker'); appendBookletText(content,'h2','Четиридесети ден'); appendBookletText(content,'p',dateLine('day40'),'booklet-page-date');
      appendBookletText(content,'p','Четиридесетият ден е един от най-важните дни за възпоменание. Обичайно се отслужва панихида в храм или на гроба.');
      appendBookletList(content,['Запазете свещеник и уточнете мястото.','Подгответе жито, хляб или погача, вино и свещи.','При нужда поръчайте некролози, цветя и раздавки.','Уточнете с гробищния парк дали предстои оформяне на гроба.']);
    }
    if(pageNumber===6){
      appendBookletText(content,'p','Възпоменание','booklet-kicker'); appendBookletText(content,'h2','Три месеца'); appendBookletText(content,'p',dateLine('month3'),'booklet-page-date');
      appendBookletText(content,'p','Тримесечният помен се прави според семейната и местната традиция. Може да бъде отбелязан с молитва, посещение на гроба и раздаване за помен.');
      appendBookletList(content,['Проверете датата и часа със свещеник.','Почистете и подредете гробното място.','Подгответе само необходимото за избрания начин на помен.']);
    }
    if(pageNumber===7){
      appendBookletText(content,'p','Възпоменание','booklet-kicker'); appendBookletText(content,'h2','Шест месеца'); appendBookletText(content,'p',dateLine('month6'),'booklet-page-date');
      appendBookletText(content,'p','На шест месеца много семейства организират панихида или по-малък помен. Най-важни остават молитвата, паметта и грижата за гробното място.');
      appendBookletList(content,['Уговорете панихида, ако семейството желае.','Подгответе свещи, цветя и раздавки.','Съобразете всичко с указанията на свещеника.']);
    }
    if(pageNumber===8){
      appendBookletText(content,'p','Възпоменание','booklet-kicker'); appendBookletText(content,'h2','Девет месеца'); appendBookletText(content,'p',dateLine('month9'),'booklet-page-date');
      appendBookletText(content,'p','Деветмесечният помен също се спазва от много семейства. Той може да бъде отбелязан в тесен кръг с молитва и посещение на гроба.');
      appendBookletList(content,['Уточнете деня със свещеник при съмнение.','Уведомете най-близките хора.','Подгответе свещи, цветя и раздавки по желание.']);
    }
    if(pageNumber===9){
      appendBookletText(content,'p','Годишнина','booklet-kicker'); appendBookletText(content,'h2','Една година'); appendBookletText(content,'p',dateLine('year1'),'booklet-page-date');
      appendBookletText(content,'p','Първата годишнина е основен ден за възпоменание. Обичайно се отслужва панихида и се събират роднини и близки.');
      appendBookletList(content,['Уговорете храм, свещеник и час.','Подгответе жито, хляб или погача, вино и свещи.','Предвидете цветя, некролози и раздавки според желанието на семейството.']);
    }
    if(pageNumber===10){
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
    if(pageNumber===11){
      appendBookletText(content,'p','Кратък списък','booklet-kicker'); appendBookletText(content,'h2','Какво обичайно се подготвя');
      appendBookletList(content,['Варено жито','Хляб или погача','Червено вино','Свещи','Цветя','Раздавки за помен','Некролози — когато семейството желае','Уговорка със свещеник и уточнен час']);
      appendBookletText(content,'p','Обичаите се различават. Не е необходимо всичко от списъка — съобразете се със семейството, местната традиция и свещеника.','booklet-note');
    }
    if(pageNumber===12){
      page.classList.add('booklet-back-cover');
      const logoBadge=document.createElement('div'); logoBadge.className='booklet-logo-badge';
      const logo=document.createElement('img'); logo.src='../assets/logo-den-i-nosht.webp'; logo.alt='Траурна агенция „Ден и Нощ“'; logoBadge.appendChild(logo); content.appendChild(logoBadge);
      appendBookletText(content,'p','Денонощна траурна агенция','booklet-back-label');
      const phone1=document.createElement('a'); phone1.href='tel:+359893646668'; phone1.textContent='0893 64 66 68'; content.appendChild(phone1);
      const phone2=document.createElement('a'); phone2.href='tel:+359898242434'; phone2.textContent='0898 24 24 34'; content.appendChild(phone2);
      appendBookletText(content,'p','deninosht.bg','booklet-site');
      const qr=document.createElement('img'); qr.className='booklet-qr'; qr.src='../assets/qr-deninosht.svg'; qr.alt='QR код към deninosht.bg'; content.appendChild(qr);
    }
    if(pageNumber>=3&&pageNumber<=11) appendAgencyHelp(content);
    if(pageNumber!==12) appendBookletText(page,'span',String(pageNumber),'booklet-page-number');
    return page;
  }

  function renderBooklet(){
    const model=readBookletModel();
    const pages={}; for(let page=1;page<=12;page+=1) pages[page]=createBookletPage(page,model);
    const sides=[[12,1],[2,11],[10,3],[4,9],[8,5],[6,7]];
    const labels=['Лист 1 — лице','Лист 1 — гръб','Лист 2 — лице','Лист 2 — гръб','Лист 3 — лице','Лист 3 — гръб'];
    bookletReadingPreview.replaceChildren();
    for(let page=1;page<=12;page+=1){
      const preview=document.createElement('div'); preview.className='booklet-reading-page';
      appendBookletText(preview,'div','Страница '+page,'booklet-reading-label');
      preview.appendChild(pages[page].cloneNode(true)); bookletReadingPreview.appendChild(preview);
    }
    bookletPrintRoot.replaceChildren();
    sides.forEach((pair,index)=>{
      const side=document.createElement('section'); side.className='booklet-side';
      appendBookletText(side,'div',labels[index],'booklet-sheet-label');
      const sheet=document.createElement('div'); sheet.className='booklet-sheet';
      sheet.append(pages[pair[0]].cloneNode(true),pages[pair[1]].cloneNode(true)); side.appendChild(sheet); bookletPrintRoot.appendChild(side);
    });
    bookletPreviewArea.hidden=false; bookletPrintButton.disabled=false;
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
    const canvas=document.createElement('canvas'); canvas.width=1240; canvas.height=1754; const ctx=canvas.getContext('2d');
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);

    if(pageNumber===1){
      const logo=content.querySelector('img'); let y=520;
      y=await drawLogoBadgeToCanvas(ctx,logo.src,y,350)+55;
      y=drawCanvasText(ctx,'Траурна агенция „Ден и Нощ“',y,{font:'bold 32px Arial',color:'#7b3337',maxWidth:1000,lineHeight:42,gapAfter:65});
      drawCanvasText(ctx,'Панихиди и възпоменателни дни',y,{font:'58px Georgia',color:'#24191a',maxWidth:940,lineHeight:70,gapAfter:0});
      return canvas;
    }

    if(pageNumber===12){
      const logo=content.querySelector('.booklet-logo-badge img'); const qr=content.querySelector('.booklet-qr'); let y=215;
      y=await drawLogoBadgeToCanvas(ctx,logo.src,y,360)+38;
      y=drawCanvasText(ctx,'Денонощна траурна агенция',y,{font:'bold 25px Arial',color:'#66564b',maxWidth:900,lineHeight:34,gapAfter:28});
      y=drawCanvasText(ctx,'0893 64 66 68',y,{font:'bold 46px Georgia',maxWidth:900,lineHeight:56,gapAfter:8});
      y=drawCanvasText(ctx,'0898 24 24 34',y,{font:'bold 46px Georgia',maxWidth:900,lineHeight:56,gapAfter:32});
      y=drawCanvasText(ctx,'deninosht.bg',y,{font:'bold 28px Arial',maxWidth:900,lineHeight:38,gapAfter:24});
      const qrImage=await loadBookletImage(qr.src); drawImageContained(ctx,qrImage,510,y,220,220);
      return canvas;
    }

    let y=105; const agencyHelp=content.querySelector('.booklet-agency-help');
    for(const child of Array.from(content.children)){
      if(child===agencyHelp) continue;
      const classes=child.classList;
      if(classes.contains('booklet-kicker')){
        y=drawCanvasText(ctx,child.textContent,y,{font:'bold 22px Arial',color:'#7b3337',maxWidth:1000,lineHeight:30,gapAfter:18});
      }else if(classes.contains('booklet-person-name')){
        y=drawCanvasText(ctx,child.textContent,y,{font:'50px Georgia',maxWidth:1000,lineHeight:58,gapAfter:22});
      }else if(child.tagName==='H2'){
        y=drawCanvasText(ctx,child.textContent,y,{font:'50px Georgia',maxWidth:1040,lineHeight:60,gapAfter:24});
      }else if(classes.contains('booklet-subheading')||child.tagName==='H3'){
        y=drawCanvasText(ctx,child.textContent,y,{font:'bold 27px Georgia',color:'#7b3337',maxWidth:1000,lineHeight:36,gapAfter:14});
      }else if(classes.contains('booklet-page-date')){
        drawCanvasRule(ctx,y,920,'#bd9d85'); y+=20;
        y=drawCanvasText(ctx,child.textContent,y,{font:'bold 29px Georgia',color:'#7b3337',maxWidth:940,lineHeight:38,gapAfter:16});
        drawCanvasRule(ctx,y,920,'#bd9d85'); y+=34;
      }else if(classes.contains('booklet-overview')){
        drawCanvasRule(ctx,y,940,'#bd9d85'); y+=10;
        for(const row of Array.from(child.children)){
          const strong=row.querySelector('strong'); const span=row.querySelector('span');
          y=drawCanvasText(ctx,strong.textContent,y,{font:'bold 22px Arial',color:'#7b3337',maxWidth:950,lineHeight:28,gapAfter:1});
          y=drawCanvasText(ctx,span.textContent,y,{font:'21px Arial',color:'#4d4240',maxWidth:950,lineHeight:27,gapAfter:6});
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
          y=drawCanvasText(ctx,row.querySelector('strong').textContent,y,{font:'bold 21px Arial',color:'#7b3337',maxWidth:950,lineHeight:27,gapAfter:1});
          y=drawCanvasText(ctx,row.querySelector('span').textContent,y,{font:'20px Arial',color:'#4d4240',maxWidth:950,lineHeight:26,gapAfter:6});
          drawCanvasRule(ctx,y,940,'#ded4c8'); y+=6;
        }
      }else if(child.tagName==='UL'){
        for(const item of Array.from(child.children)) y=drawCanvasText(ctx,'• '+item.textContent,y,{font:'26px Georgia',maxWidth:1010,lineHeight:34,gapAfter:10});
        y+=8;
      }else if(classes.contains('booklet-note')){
        drawCanvasRule(ctx,y,900,'#bd9d85'); y+=17;
        y=drawCanvasText(ctx,child.textContent,y,{font:'22px Georgia',color:'#5d5148',maxWidth:940,lineHeight:30,gapAfter:22});
      }else if(child.tagName==='P'){
        const isLead=classes.contains('booklet-lead');
        y=drawCanvasText(ctx,child.textContent,y,{font:(isLead?'26px':'27px')+' Georgia',color:isLead?'#66564b':'#24191a',maxWidth:1020,lineHeight:36,gapAfter:24});
      }
    }

    if(agencyHelp){
      drawCanvasRule(ctx,1500,960,'#9a6546');
      drawCanvasText(ctx,agencyHelp.textContent,1520,{font:'bold 21px Arial',color:'#7b3337',maxWidth:980,lineHeight:28,gapAfter:0});
    }
    ctx.font='18px Arial'; ctx.fillStyle='#877a72'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.fillText(String(pageNumber),620,1690);
    return canvas;
  }

  async function downloadBookletPdf(){
    if(!window.PDFLib||!window.PDFLib.PDFDocument) throw new Error('PDF модулът не е зареден. Обновете страницата и опитайте отново.');
    const model=readBookletModel(); const pdf=await window.PDFLib.PDFDocument.create();
    pdf.setTitle('Книжка за панихиди - Ден и Нощ'); pdf.setAuthor('Траурна агенция Ден и Нощ'); pdf.setCreator('deninosht.bg');
    const sides=[[12,1],[2,11],[10,3],[4,9],[8,5],[6,7]];
    for(const pair of sides){
      const left=await renderBookletPageCanvas(pair[0],model); const right=await renderBookletPageCanvas(pair[1],model);
      const sheet=document.createElement('canvas'); sheet.width=2480; sheet.height=1754; const ctx=sheet.getContext('2d');
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,sheet.width,sheet.height); ctx.drawImage(left,0,0); ctx.drawImage(right,1240,0);
      ctx.strokeStyle='#d2cbc4'; ctx.lineWidth=2; ctx.setLineDash([10,10]); ctx.beginPath(); ctx.moveTo(1240,0); ctx.lineTo(1240,1754); ctx.stroke(); ctx.setLineDash([]);
      const image=await pdf.embedJpg(sheet.toDataURL('image/jpeg',0.94)); const page=pdf.addPage([841.89,595.28]); page.drawImage(image,{x:0,y:0,width:841.89,height:595.28});
    }
    const bytes=await pdf.save({useObjectStreams:true}); const blob=new Blob([bytes],{type:'application/pdf'}); const url=URL.createObjectURL(blob);
    const link=document.createElement('a'); link.href=url; link.download='knizhka-za-panihidi-den-i-nosht.pdf'; link.rel='noopener';
    if(/iPad|iPhone|iPod/i.test(navigator.userAgent||'')) link.target='_blank';
    document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(()=>URL.revokeObjectURL(url),60000);
  }

  function switchAdminView(view){
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
    try{
      prodResult = await request('/rest/v1/products?select=id,name,product_code,slug,description,image_url,is_available,sort_order,is_active,is_archived,category_id,created_at&order=category_id.asc,sort_order.asc,created_at.asc', {}, true);
    } catch (error){
      if (/product_code|is_archived|column/i.test(error.message || '')){
        schemaReady = false;
        prodResult = await request('/rest/v1/products?select=id,name,slug,description,image_url,is_available,sort_order,is_active,category_id,created_at&order=category_id.asc,sort_order.asc,created_at.asc', {}, true);
        prodResult = (prodResult || []).map((p)=>Object.assign({product_code:'',is_archived:false}, p));
      } else throw error;
    }
    categories = (await catPromise) || [];
    products = prodResult || [];
    $('schema-warning').hidden = schemaReady;
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
    if (data.product_code){ const code=document.createElement('div'); code.className='preview-product-code'; code.textContent='Код: '+data.product_code; card.appendChild(code); }
    if (data.image_url){ const img=document.createElement('img'); img.src=data.image_url; img.alt=data.name||'Продукт'; card.appendChild(img); }
    if (data.description){ const d=document.createElement('p'); d.textContent=data.description; card.appendChild(d); }
    const a=document.createElement('div'); a.className='preview-availability '+(data.is_available?'is-available':'is-unavailable'); a.textContent=data.is_available?'В наличност':'Временно неналичен'; card.appendChild(a);
    wrap.appendChild(card); previewBackdrop.hidden=false; document.body.style.overflow='hidden';
  }

  function closeAdminPreview(){ previewBackdrop.hidden=true; if (editorBackdrop.hidden) document.body.style.overflow=''; }

  function editorDraft(){
    return {
      name:$('product-name').value.trim(), product_code:$('product-code').value.trim(), description:$('product-description').value.trim(),
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
      if (slug){ window.open('../kategoriya.html?category='+encodeURIComponent(slug)+'#product-'+encodeURIComponent(product.id),'_blank','noopener'); return; }
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
  if(obituaryGender) obituaryGender.addEventListener('change',()=>{
    const preset=OBITUARY_PRESETS[obituaryType.value]||OBITUARY_PRESETS.death;
    $('obituary-closing').value=preset.closing[obituaryGender.value]||preset.closing.neutral;
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
      message(obituaryMessage,file?'Обработка на снимката…':'');
      await setObituaryPhoto(file);
      if(file) message(obituaryMessage,'Снимката е добавена. Използвайте плъзгачите, ако трябва да я наместите.','success');
    }catch(error){
      event.target.value=''; message(obituaryMessage,error.message||'Снимката не можа да бъде добавена.','error');
    }
  });
  if(obituaryRemovePhoto) obituaryRemovePhoto.addEventListener('click',()=>{ resetObituaryPhoto(); message(obituaryMessage,'Снимката е премахната.','success'); });
  [obituaryPhotoZoom,obituaryPhotoX,obituaryPhotoY].filter(Boolean).forEach((input)=>input.addEventListener('input',()=>{
    if(obituaryPhotoZoomValue) obituaryPhotoZoomValue.textContent=obituaryPhotoZoom.value+'%';
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
      await downloadBookletPdf(); message(bookletMessage,'PDF файлът е готов. Отворете го и го отпечатайте без промяна на ориентацията.','success');
    }catch(error){ message(bookletMessage,error.message||'PDF файлът не можа да бъде създаден.','error'); }
    finally{ bookletPrintButton.disabled=false; bookletPrintButton.textContent=originalLabel; }
  });

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

  switchAdminView('products');

  async function boot(){
    const session=await ensureSession(); const loggedIn=Boolean(session&&session.access_token); setLoggedIn(loggedIn); if(!loggedIn)return;
    try{ await loadData(); } catch(error){ message(dashboardMessage,'Админ панелът е отворен, но данните не се заредиха: '+error.message,'error'); }
    await loadTopTickerSetting();
  }

  boot();
})();
