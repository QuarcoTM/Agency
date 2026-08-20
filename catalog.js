(function(){
  const nav = document.querySelector('.goods-category-nav');
  const catalog = document.querySelector('.goods-catalog');
  const status = document.querySelector('.goods-catalog-status');
  if (!nav || !catalog || !status) return;

  const cfg = window.DENINOSHT_SUPABASE || {
    url: 'https://beflewauiyexpmvcxjat.supabase.co',
    publishableKey: 'sb_publishable_053ZIwadY-CXSIIm3E0byQ_ByB9UJp3'
  };

  function setStatus(message, isError){
    status.textContent = message || '';
    status.classList.toggle('is-error', Boolean(isError));
    status.hidden = !message;
  }

  function make(tag, className, text){
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof text === 'string') el.textContent = text;
    return el;
  }

  function renderProduct(product){
    const article = make('article', 'product-card');
    if (product.image_url){
      const imageWrap = make('div', 'product-image-wrap');
      const img = document.createElement('img');
      img.src = product.image_url;
      img.alt = product.name || 'Траурна стока';
      img.loading = 'lazy';
      img.decoding = 'async';
      imageWrap.appendChild(img);
      article.appendChild(imageWrap);
    }

    const body = make('div', 'product-card-body');
    body.appendChild(make('h3', 'product-name', product.name || 'Артикул'));
    if (product.description){
      body.appendChild(make('p', 'product-description', product.description));
    }
    body.appendChild(make(
      'div',
      'product-availability ' + (product.is_available ? 'is-available' : 'is-unavailable'),
      product.is_available ? 'В наличност' : 'Временно неналичен'
    ));
    article.appendChild(body);
    return article;
  }

  function render(categories, products){
    nav.replaceChildren();
    catalog.replaceChildren();

    const grouped = new Map();
    products.forEach((product)=>{
      const key = String(product.category_id);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(product);
    });

    categories.forEach((category, index)=>{
      const anchor = document.createElement('a');
      anchor.href = '#' + category.slug;
      anchor.textContent = category.name;
      nav.appendChild(anchor);

      const section = make('section', 'goods-category');
      section.id = category.slug;
      section.dataset.category = category.slug;
      section.appendChild(make('div', 'goods-category-number', String(index + 1).padStart(2, '0')));

      const content = make('div', 'goods-category-content');
      const heading = make('div', 'goods-category-copy');
      heading.appendChild(make('h2', '', category.name));
      content.appendChild(heading);

      const list = grouped.get(String(category.id)) || [];
      if (list.length){
        const grid = make('div', 'product-grid');
        list.forEach((product)=>grid.appendChild(renderProduct(product)));
        content.appendChild(grid);
      } else {
        content.appendChild(make('p', 'goods-empty', 'В момента няма публикувани артикули в тази категория. За наличности се свържете с нас.'));
      }

      section.appendChild(content);
      catalog.appendChild(section);
    });
  }

  async function getRows(table, query, signal){
    const response = await fetch(cfg.url + '/rest/v1/' + table + '?' + query, {
      method: 'GET',
      headers: {
        apikey: cfg.publishableKey,
        Accept: 'application/json'
      },
      signal,
      cache: 'no-store'
    });
    if (!response.ok){
      let details = '';
      try{
        const body = await response.json();
        details = body.message || body.error || '';
      } catch (_) {}
      throw new Error(details || ('HTTP ' + response.status));
    }
    return response.json();
  }

  async function loadCatalog(){
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), 12000);
    try{
      const [categories, products] = await Promise.all([
        getRows(
          'categories',
          'select=id,name,slug,sort_order,is_active&is_active=eq.true&order=sort_order.asc',
          controller.signal
        ),
        getRows(
          'products',
          'select=id,name,slug,description,image_url,is_available,sort_order,category_id,is_active&is_active=eq.true&order=sort_order.asc',
          controller.signal
        )
      ]);

      render(categories || [], products || []);
      if (!categories || !categories.length){
        setStatus('Категориите ще бъдат публикувани скоро. За наличности се свържете с нас по телефона.');
      } else {
        setStatus('');
      }
    } catch (error){
      console.error('Catalog load failed:', error);
      setStatus('Каталогът не може да бъде зареден в момента. За наличности се свържете с нас по телефона.', true);
    } finally {
      clearTimeout(timer);
    }
  }

  loadCatalog();
})();
