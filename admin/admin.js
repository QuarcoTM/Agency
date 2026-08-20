(function(){
  const cfg = window.DENINOSHT_SUPABASE;
  const sdk = window.supabase;
  if (!cfg || !sdk){
    document.body.innerHTML = '<p style="padding:30px;color:white">Админ панелът не може да се зареди.</p>';
    return;
  }

  const db = sdk.createClient(cfg.url, cfg.publishableKey);
  const bucket = 'product-images';
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

  async function removeStoredImage(url){
    const path = storagePathFromUrl(url);
    if (!path) return;
    const { error } = await db.storage.from(bucket).remove([path]);
    if (error) console.warn('Image cleanup failed:', error.message);
  }

  async function uploadImage(file, slug){
    if (!file) return '';
    if (file.size > 5 * 1024 * 1024) throw new Error('Снимката е по-голяма от 5 MB.');
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.type)) throw new Error('Разрешени са JPG, PNG и WEBP снимки.');
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = 'products/' + Date.now() + '-' + slug + '.' + ext;
    const { error } = await db.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (error) throw error;
    const { data } = db.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  function setLoggedIn(loggedIn){
    loginPanel.hidden = loggedIn;
    dashboard.hidden = !loggedIn;
  }

  async function loadData(){
    message(dashboardMessage, 'Зареждане…');
    const [catResult, prodResult] = await Promise.all([
      db.from('categories').select('id,name,slug,sort_order,is_active').order('sort_order', {ascending:true}),
      db.from('products').select('id,name,slug,description,image_url,is_available,sort_order,is_active,category_id,created_at').order('sort_order', {ascending:true}).order('created_at', {ascending:true})
    ]);
    if (catResult.error) throw catResult.error;
    if (prodResult.error) throw prodResult.error;
    categories = catResult.data || [];
    products = prodResult.data || [];
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
    message(dashboardMessage, 'Записване…');
    const { error } = await db.from('products').update({is_active: !product.is_active}).eq('id', product.id);
    if (error){ message(dashboardMessage, 'Грешка: ' + error.message, 'error'); return; }
    await loadData();
  }

  async function deleteProduct(product){
    if (!window.confirm('Да изтрием ли „' + product.name + '“? Това действие не може да се върне.')) return;
    message(dashboardMessage, 'Изтриване…');
    const { error } = await db.from('products').delete().eq('id', product.id);
    if (error){ message(dashboardMessage, 'Грешка: ' + error.message, 'error'); return; }
    await removeStoredImage(product.image_url);
    await loadData();
    message(dashboardMessage, 'Продуктът е изтрит.', 'success');
  }

  loginForm.addEventListener('submit', async (event)=>{
    event.preventDefault();
    message(loginMessage, 'Влизане…');
    const email = $('login-email').value.trim();
    const password = $('login-password').value;
    const { error } = await db.auth.signInWithPassword({email, password});
    if (error){ message(loginMessage, 'Неуспешен вход. Проверете имейла и паролата.', 'error'); return; }
    $('login-password').value = '';
    setLoggedIn(true);
    try{ await loadData(); }catch(e){ message(dashboardMessage, 'Грешка при зареждане: ' + e.message, 'error'); }
  });

  $('logout-button').addEventListener('click', async ()=>{
    await db.auth.signOut();
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

      let result;
      if (editing) result = await db.from('products').update(payload).eq('id', id);
      else result = await db.from('products').insert(payload);
      if (result.error) throw result.error;

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
    const { data, error } = await db.auth.getSession();
    if (error){ message(loginMessage, 'Неуспешна проверка на сесията.', 'error'); setLoggedIn(false); return; }
    const loggedIn = Boolean(data.session);
    setLoggedIn(loggedIn);
    if (loggedIn){
      try{ await loadData(); }catch(e){ message(dashboardMessage, 'Грешка при зареждане: ' + e.message, 'error'); }
    }
  }

  db.auth.onAuthStateChange((event, session)=>{
    if (event === 'SIGNED_OUT') setLoggedIn(false);
    if (event === 'SIGNED_IN' && session) setLoggedIn(true);
  });

  boot();
})();
