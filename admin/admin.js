(function(){
  const cfg = window.DENINOSHT_SUPABASE || {
    url: 'https://beflewauiyexpmvcxjat.supabase.co',
    publishableKey: 'sb_publishable_053ZIwadY-CXSIIm3E0byQ_ByB9UJp3'
  };
  const bucket = 'product-images';
  const sessionKey = 'deninosht_admin_session_v1';
  const analyticsOptOutKey = 'deninosht_analytics_do_not_count_device_v1';
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
  const dashboardTitle = $('dashboard-title');
  const dashboardIntro = $('dashboard-intro');
  const newProductButton = $('new-product-button');
  const analyticsMessage = $('analytics-message');
  const analyticsSetup = $('analytics-setup');
  const analyticsRefresh = $('analytics-refresh');
  const analyticsDeviceToggle = $('analytics-device-toggle');
  const analyticsDeviceStatus = $('analytics-device-status');

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

  function campaignLabel(row){
    const campaign=String(row && row.utm_campaign || 'Без име');
    const source=String(row && row.utm_source || 'неуточнен');
    const medium=String(row && row.utm_medium || '');
    return campaign + ' — ' + source + (medium ? ' / ' + medium : '');
  }

  function analyticsDeviceExcluded(){
    try{ return localStorage.getItem(analyticsOptOutKey)==='1'; }
    catch(_){ return false; }
  }

  function renderAnalyticsDeviceControl(){
    if(!analyticsDeviceToggle || !analyticsDeviceStatus) return;
    const excluded=analyticsDeviceExcluded();
    analyticsDeviceStatus.textContent=excluded
      ? 'Това устройство НЕ се отчита в статистиката.'
      : 'Това устройство се отчита в статистиката.';
    analyticsDeviceToggle.textContent=excluded
      ? 'Отчитай това устройство'
      : 'Не отчитай това устройство';
    analyticsDeviceToggle.classList.toggle('is-excluded',excluded);
  }

  function toggleAnalyticsDevice(){
    try{
      if(analyticsDeviceExcluded()) localStorage.removeItem(analyticsOptOutKey);
      else localStorage.setItem(analyticsOptOutKey,'1');
    }catch(_){}
    renderAnalyticsDeviceControl();
  }

  function setAnalyticsKpis(row){
    row=row || {};
    $('analytics-pageviews').textContent=formatNumber(row.page_views);
    $('analytics-phone-clicks').textContent=formatNumber(row.phone_clicks);
    $('analytics-contact-views').textContent=formatNumber(row.contact_page_views);
    $('analytics-map-opens').textContent=formatNumber(row.map_opens);
    $('analytics-faq-opens').textContent=formatNumber(row.faq_opens);
    $('analytics-404-hits').textContent=formatNumber(row.not_found_hits);
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
      const [kpis,daily,pages,sources,phones,googleLandings,campaigns,notFound]=await Promise.all([
        analyticsRpc('admin_analytics_kpis_v153',{p_since:since}),
        analyticsRpc('admin_analytics_daily_v153',{p_since:since}),
        analyticsRpc('admin_analytics_top_pages_v153',{p_since:since,p_limit:10}),
        analyticsRpc('admin_analytics_sources_v153',{p_since:since,p_limit:10}),
        analyticsRpc('admin_analytics_phones_v153',{p_since:since}),
        analyticsRpc('admin_analytics_google_landings_v153',{p_since:since,p_limit:10}),
        analyticsRpc('admin_analytics_campaigns_v153',{p_since:since,p_limit:10}),
        analyticsRpc('admin_analytics_not_found_v153',{p_since:since,p_limit:10})
      ]);
      setAnalyticsKpis(Array.isArray(kpis)?kpis[0]:kpis);
      renderAnalyticsChart(daily,analyticsDays);
      renderAnalyticsList($('analytics-top-pages'),pages,(r)=>pageLabel(r.page_path),'views');
      renderAnalyticsList($('analytics-sources'),sources,(r)=>sourceLabel(r.source),'views');
      renderAnalyticsList($('analytics-phones'),phones,(r)=>phoneLabel(r.phone),'clicks');
      renderAnalyticsList($('analytics-google-landings'),googleLandings,(r)=>pageLabel(r.page_path),'views');
      renderAnalyticsList($('analytics-campaigns'),campaigns,(r)=>campaignLabel(r),'views');
      renderAnalyticsList($('analytics-not-found'),notFound,(r)=>String(r.page_path || 'Неизвестен адрес'),'hits');
      message(analyticsMessage,'Последно обновяване: '+new Date().toLocaleTimeString('bg-BG',{hour:'2-digit',minute:'2-digit'}),'success');
    } catch(error){
      setAnalyticsKpis({});
      renderAnalyticsChart([],analyticsDays);
      renderAnalyticsList($('analytics-top-pages'),[],()=>'', 'views');
      renderAnalyticsList($('analytics-sources'),[],()=>'', 'views');
      renderAnalyticsList($('analytics-phones'),[],()=>'', 'clicks');
      renderAnalyticsList($('analytics-google-landings'),[],()=>'', 'views');
      renderAnalyticsList($('analytics-campaigns'),[],()=>'', 'views');
      renderAnalyticsList($('analytics-not-found'),[],()=>'', 'hits');
      if(analyticsSchemaMissing(error)){
        if(analyticsSetup) analyticsSetup.hidden=false;
        message(analyticsMessage,'Нужно е еднократното SQL активиране за v1.53.','error');
      }else message(analyticsMessage,'Статистиката не се зареди: '+error.message,'error');
    } finally {
      analyticsLoading=false;
      if(analyticsRefresh){ analyticsRefresh.disabled=false; analyticsRefresh.textContent='Обнови'; }
    }
  }

  function switchAdminView(view){
    const analytics=view==='analytics';
    if(productsAdminView) productsAdminView.hidden=analytics;
    if(analyticsAdminView) analyticsAdminView.hidden=!analytics;
    document.querySelectorAll('[data-admin-view]').forEach((btn)=>{
      const active=btn.dataset.adminView===view; btn.classList.toggle('is-active',active); btn.setAttribute('aria-pressed',String(active));
    });
    if(dashboardTitle) dashboardTitle.textContent=analytics?'Статистика':'Траурни стоки';
    if(dashboardIntro) dashboardIntro.textContent=analytics?'Следете преглежданията, входящите източници и действията към контакт.':'Управлявайте продуктите от едно място — наличност, видимост, подредба, архив и снимки.';
    if(newProductButton) newProductButton.hidden=analytics;
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
  if(analyticsDeviceToggle) analyticsDeviceToggle.addEventListener('click',toggleAnalyticsDevice);
  renderAnalyticsDeviceControl();

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
