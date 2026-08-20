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

  const $ = (id)=>document.getElementById(id);
  const loginPanel = $('login-panel');
  const dashboard = $('dashboard');
  const loginForm = $('login-form');
  const loginMessage = $('login-message');
  const dashboardMessage = $('dashboard-message');
  const productList = $('product-list');
  const categoryFilter = $('category-filter');
  const productCount = $('product-count');
  const editorBackdrop = $('editor-backdrop');
  const productForm = $('product-form');
  const editorMessage = $('editor-message');
  const saveButton = $('save-product');

  function message(el, text, type){
    el.textContent = text || '';
    el.className = 'admin-message' + (type ? ' ' + type : '');
  }

  function slugify(value){
    const map = {
      'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sht','ъ':'a','ь':'y','ю':'yu','я':'ya'
    };
    return String(value || '').toLowerCase().split('').map((ch)=>map[ch] || ch).join('')
      .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-') || 'product';
  }

  function readSession(){
    try{
      const raw = localStorage.getItem(sessionKey);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
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

  function clearSession(){
    localStorage.removeItem(sessionKey);
  }

  async function parseError(response){
    try{
      const data = await response.json();
      return data.msg || data.message || data.error_description || data.error || ('HTTP ' + response.status);
    } catch (_) {
      return 'HTTP ' + response.status;
    }
  }

  async function authToken(grantType, payload){
    const response = await fetch(cfg.url + '/auth/v1/token?grant_type=' + encodeURIComponent(grantType), {
      method: 'POST',
      headers: {
        apikey: cfg.publishableKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(await parseError(response));
    return response.json();
  }

  async function ensureSession(){
    let session = readSession();
    if (!session || !session.refresh_token) return null;
    if (session.access_token && session.expires_at > Date.now() + 60000) return session;
    try{
      const refreshed = await authToken('refresh_token', { refresh_token: session.refresh_token });
      session = saveSession(refreshed);
      return session;
    } catch (error){
      clearSession();
      return null;
    }
  }

  async function request(path, options, authenticated, retry){
    const opts = Object.assign({ method: 'GET', headers: {} }, options || {});
    const headers = new Headers(opts.headers || {});
    headers.set('apikey', cfg.publishableKey);
    headers.set('Accept', 'application/json');

    if (authenticated){
      const session = await ensureSession();
      if (!session) throw new Error('Сесията е изтекла. Влезте отново.');
      headers.set('Authorization', 'Bearer ' + session.access_token);
    }

    const response = await fetch(cfg.url + path, Object.assign({}, opts, { headers, cache: 'no-store' }));
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

  function categoryName(id){
    const c = categories.find((item)=>String(item.id) === String(id));
    return c ? c.name : 'Без категория';
  }

  function storagePathFromUrl(url){
    if (!url) return '';
    const marker = '/storage/v1/object/public/' + bucket + '/';
    const idx = url.indexOf(marker);
    if (idx === -1) return '';
    return decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
  }

  function encodePath(path){
    return String(path).split('/').map(encodeURIComponent).join('/');
  }

  async function removeStoredImage(url){
    const path = storagePathFromUrl(url);
    if (!path) return;
    try{
      await request('/storage/v1/object/' + bucket, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefixes: [path] })
      }, true);
    } catch (error){
      console.warn('Image cleanup failed:', error.message);
    }
  }

  async function uploadImage(file, slug){
    if (!file) return '';
    if (file.size > 5 * 1024 * 1024) throw new Error('Снимката е по-голяма от 5 MB.');
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.type)) throw new Error('Разрешени са JPG, PNG и WEBP снимки.');
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = 'products/' + Date.now() + '-' + slug + '.' + ext;
    await request('/storage/v1/object/' + bucket + '/' + encodePath(path), {
      method: 'POST',
      headers: {
        'Content-Type': file.type,
        'cache-control': 'max-age=3600',
        'x-upsert': 'false'
      },
      body: file
    }, true);
    return cfg.url + '/storage/v1/object/public/' + bucket + '/' + encodePath(path);
  }

  function setLoggedIn(loggedIn){
    loginPanel.hidden = loggedIn;
    dashboard.hidden = !loggedIn;
  }

  async function loadData(){
    message(dashboardMessage, 'Зареждане…');
    const [catResult, prodResult] = await Promise.all([
      request('/rest/v1/categories?select=id,name,slug,sort_order,is_active&order=sort_order.asc', {}, true),
      request('/rest/v1/products?select=id,name,slug,description,image_url,is_available,sort_order,is_active,category_id,created_at&order=sort_order.asc,created_at.asc', {}, true)
    ]);
    categories = catResult || [];
    products = prodResult || [];
    populateCategoryControls();
    renderProducts();
    message(dashboardMessage, '');
  }

  function populateCategoryControls(){
    const currentFilter = categoryFilter.value;
    categoryFilter.replaceChildren(new Option('Всички категории',''));
    $('product-category').replaceChildren();
    categories.forEach((c)=>{
      categoryFilter.add(new Option(c.name, c.id));
      $('product-category').add(new Option(c.name, c.id));
    });
    if ([...categoryFilter.options].some((o)=>o.value === currentFilter)) categoryFilter.value = currentFilter;
  }

  function renderProducts(){
    productList.replaceChildren();
    const selected = categoryFilter.value;
    const visible = selected ? products.filter((p)=>String(p.category_id) === selected) : products;
    productCount.textContent = visible.length + (visible.length === 1 ? ' продукт' : ' продукта');
    if (!visible.length){
      const empty = document.createElement('div');
      empty.className = 'empty-admin';
      empty.textContent = 'Няма продукти в този изглед.';
      productList.appendChild(empty);
      return;
    }

    visible.forEach((p)=>{
      const row = document.createElement('article');
      row.className = 'admin-product';

      const imageBox = document.createElement('div');
      imageBox.className = 'admin-product-image' + (p.image_url ? '' : ' no-image');
      if (p.image_url){
        const img = document.createElement('img');
        img.src = p.image_url;
        img.alt = p.name;
        img.loading = 'lazy';
        imageBox.appendChild(img);
      } else imageBox.textContent = 'Без снимка';

      const content = document.createElement('div');
      const h3 = document.createElement('h3'); h3.textContent = p.name; content.appendChild(h3);
      const meta = document.createElement('div'); meta.className = 'admin-product-meta';
      const cat = document.createElement('span'); cat.className='badge'; cat.textContent = categoryName(p.category_id); meta.appendChild(cat);
      const avail = document.createElement('span'); avail.className='badge ' + (p.is_available ? 'green' : 'red'); avail.textContent = p.is_available ? 'В наличност' : 'Няма наличност'; meta.appendChild(avail);
      const active = document.createElement('span'); active.className='badge ' + (p.is_active ? 'green' : 'red'); active.textContent = p.is_active ? 'Показва се' : 'Скрит'; meta.appendChild(active);
      content.appendChild(meta);
      if (p.description){ const d = document.createElement('p'); d.className='admin-product-description'; d.textContent=p.description; content.appendChild(d); }

      const actions = document.createElement('div'); actions.className='product-actions';
      const edit = document.createElement('button'); edit.className='small-button'; edit.type='button'; edit.textContent='Редакция'; edit.addEventListener('click',()=>openEditor(p)); actions.appendChild(edit);
      const toggle = document.createElement('button'); toggle.className='small-button'; toggle.type='button'; toggle.textContent=p.is_active?'Скрий':'Покажи'; toggle.addEventListener('click',()=>toggleActive(p)); actions.appendChild(toggle);
      const del = document.createElement('button'); del.className='small-button danger'; del.type='button'; del.textContent='Изтрий'; del.addEventListener('click',()=>deleteProduct(p)); actions.appendChild(del);

      row.append(imageBox, content, actions);
      productList.appendChild(row);
    });
  }

  function resetPreview(){
    if (currentObjectUrl){ URL.revokeObjectURL(currentObjectUrl); currentObjectUrl=''; }
    $('image-preview-img').removeAttribute('src');
    $('image-preview').hidden = true;
  }

  function showPreview(url){
    if (!url){ resetPreview(); return; }
    $('image-preview-img').src = url;
    $('image-preview').hidden = false;
  }

  function openEditor(product){
    message(editorMessage, '');
    productForm.reset();
    resetPreview();
    const editing = Boolean(product);
    $('editor-title').textContent = editing ? 'Редакция на продукт' : 'Нов продукт';
    $('product-id').value = editing ? product.id : '';
    $('product-name').value = editing ? product.name : '';
    $('product-category').value = editing ? String(product.category_id) : (categories[0] ? String(categories[0].id) : '');
    $('product-description').value = editing ? (product.description || '') : '';
    $('product-available').checked = editing ? Boolean(product.is_available) : true;
    $('product-active').checked = editing ? Boolean(product.is_active) : true;
    $('product-slug').value = editing ? (product.slug || '') : '';
    $('product-current-image').value = editing ? (product.image_url || '') : '';
    $('product-sort-order').value = editing ? (product.sort_order ?? 10) : ((products.reduce((max,p)=>Math.max(max, Number(p.sort_order)||0),0) || 0) + 10);
    $('image-required-mark').hidden = editing && Boolean(product.image_url);
    if (editing && product.image_url) showPreview(product.image_url);
    editorBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(()=>$('product-name').focus(), 0);
  }

  function closeEditor(){
    editorBackdrop.hidden = true;
    document.body.style.overflow = '';
    productForm.reset();
    resetPreview();
    message(editorMessage,'');
  }

  async function toggleActive(product){
    try{
      message(dashboardMessage, 'Записване…');
      await request('/rest/v1/products?id=eq.' + encodeURIComponent(product.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ is_active: !product.is_active })
      }, true);
      await loadData();
    } catch (error){
      message(dashboardMessage, 'Грешка: ' + error.message, 'error');
    }
  }

  async function deleteProduct(product){
    if (!window.confirm('Да изтрием ли „' + product.name + '“? Това действие не може да се върне.')) return;
    try{
      message(dashboardMessage, 'Изтриване…');
      await request('/rest/v1/products?id=eq.' + encodeURIComponent(product.id), {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' }
      }, true);
      await removeStoredImage(product.image_url);
      await loadData();
      message(dashboardMessage, 'Продуктът е изтрит.', 'success');
    } catch (error){
      message(dashboardMessage, 'Грешка: ' + error.message, 'error');
    }
  }

  loginForm.addEventListener('submit', async (event)=>{
    event.preventDefault();
    message(loginMessage, 'Влизане…');
    const email = $('login-email').value.trim();
    const password = $('login-password').value;
    try{
      const auth = await authToken('password', { email, password });
      saveSession(auth);
      $('login-password').value = '';
      setLoggedIn(true);
      await loadData();
    } catch (error){
      clearSession();
      setLoggedIn(false);
      message(loginMessage, 'Неуспешен вход. Проверете имейла и паролата.', 'error');
    }
  });

  $('logout-button').addEventListener('click', async ()=>{
    const session = readSession();
    if (session && session.access_token){
      try{
        await fetch(cfg.url + '/auth/v1/logout', {
          method: 'POST',
          headers: { apikey: cfg.publishableKey, Authorization: 'Bearer ' + session.access_token }
        });
      } catch (_) {}
    }
    clearSession();
    setLoggedIn(false);
    products=[];
    productList.replaceChildren();
    message(loginMessage, 'Излязохте от админ панела.', 'success');
  });

  $('new-product-button').addEventListener('click',()=>openEditor(null));
  $('editor-close').addEventListener('click',closeEditor);
  $('cancel-edit').addEventListener('click',closeEditor);
  editorBackdrop.addEventListener('click',(e)=>{ if(e.target === editorBackdrop) closeEditor(); });
  document.addEventListener('keydown',(e)=>{ if(e.key === 'Escape' && !editorBackdrop.hidden) closeEditor(); });
  categoryFilter.addEventListener('change',renderProducts);

  $('product-image').addEventListener('change',(event)=>{
    resetPreview();
    const file = event.target.files && event.target.files[0];
    if (file){
      currentObjectUrl = URL.createObjectURL(file);
      showPreview(currentObjectUrl);
    } else if ($('product-current-image').value){
      showPreview($('product-current-image').value);
    }
  });

  productForm.addEventListener('submit', async (event)=>{
    event.preventDefault();
    message(editorMessage, 'Записване…');
    saveButton.disabled = true;
    productForm.classList.add('loading');

    const id = $('product-id').value;
    const editing = Boolean(id);
    const name = $('product-name').value.trim();
    const categoryId = $('product-category').value;
    const description = $('product-description').value.trim();
    const file = $('product-image').files && $('product-image').files[0];
    const oldImage = $('product-current-image').value;
    const slug = editing && $('product-slug').value ? $('product-slug').value : slugify(name) + '-' + Date.now().toString(36).slice(-5);
    let newImage = '';

    try{
      if (!editing && !file) throw new Error('Изберете една снимка за продукта.');
      if (!name) throw new Error('Въведете име на продукта.');
      if (!categoryId) throw new Error('Изберете категория.');

      if (file) newImage = await uploadImage(file, slug);
      const payload = {
        name,
        category_id: /^\d+$/.test(categoryId) ? Number(categoryId) : categoryId,
        slug,
        description: description || null,
        image_url: newImage || oldImage || null,
        is_available: $('product-available').checked,
        is_active: $('product-active').checked,
        sort_order: Number($('product-sort-order').value) || 10
      };

      if (editing){
        await request('/rest/v1/products?id=eq.' + encodeURIComponent(id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify(payload)
        }, true);
      } else {
        await request('/rest/v1/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify(payload)
        }, true);
      }

      if (newImage && oldImage && newImage !== oldImage) await removeStoredImage(oldImage);
      closeEditor();
      await loadData();
      message(dashboardMessage, editing ? 'Промените са записани.' : 'Продуктът е добавен.', 'success');
    } catch (error){
      if (newImage) await removeStoredImage(newImage);
      message(editorMessage, error.message || 'Възникна грешка при записването.', 'error');
    } finally {
      saveButton.disabled = false;
      productForm.classList.remove('loading');
    }
  });

  async function boot(){
    try{
      const session = await ensureSession();
      const loggedIn = Boolean(session && session.access_token);
      setLoggedIn(loggedIn);
      if (loggedIn) await loadData();
    } catch (error){
      clearSession();
      setLoggedIn(false);
      message(loginMessage, 'Влезте с администраторския акаунт.', 'error');
    }
  }

  boot();
})();
