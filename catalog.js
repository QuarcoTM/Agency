(function(){
  const nav = document.querySelector('.goods-category-nav');
  const catalog = document.querySelector('.goods-catalog');
  const status = document.querySelector('.goods-catalog-status');
  const categoryMenuButton = document.getElementById('category-switcher-button');
  const categoryMenu = document.getElementById('category-switcher-menu');
  const categoryCurrent = document.getElementById('category-switcher-current');
  if (!catalog || !status) return;

  const cfg = window.DENINOSHT_SUPABASE || {
    url: 'https://beflewauiyexpmvcxjat.supabase.co',
    publishableKey: 'sb_publishable_053ZIwadY-CXSIIm3E0byQ_ByB9UJp3'
  };

  const isCategoryPage = document.body.classList.contains('category-page');
  const selectedSlug = isCategoryPage ? (new URLSearchParams(window.location.search).get('category') || '') : '';

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

  function navigateToCategory(slug){
    if(!slug) return;
    window.location.assign('kategoriya.html?category=' + encodeURIComponent(slug));
  }

  function bindTouchNavigation(link, slug){
    let touchHandled = false;
    link.addEventListener('touchend',(event)=>{
      if(event.cancelable) event.preventDefault();
      touchHandled = true;
      navigateToCategory(slug);
      setTimeout(()=>{ touchHandled = false; },700);
    },{passive:false});
    link.addEventListener('click',(event)=>{
      if(touchHandled){
        event.preventDefault();
        return;
      }
    });
  }

  function closeCategoryMenu(){
    if(!categoryMenuButton || !categoryMenu) return;
    categoryMenuButton.setAttribute('aria-expanded','false');
    categoryMenu.hidden = true;
    document.body.classList.remove('category-menu-open');
  }

  function toggleCategoryMenu(event){
    if(event) event.stopPropagation();
    if(!categoryMenuButton || !categoryMenu) return;
    const opening = categoryMenu.hidden;
    categoryMenu.hidden = !opening;
    categoryMenuButton.setAttribute('aria-expanded',String(opening));
    document.body.classList.toggle('category-menu-open',opening);
  }

  function bindReliableMenuButton(){
    if(!categoryMenuButton) return;
    let suppressClickUntil = 0;
    categoryMenuButton.addEventListener('touchend',(event)=>{
      if(event.cancelable) event.preventDefault();
      suppressClickUntil = Date.now() + 700;
      toggleCategoryMenu(event);
    },{passive:false});
    categoryMenuButton.addEventListener('click',(event)=>{
      if(Date.now() < suppressClickUntil){
        event.preventDefault();
        return;
      }
      toggleCategoryMenu(event);
    });
  }

  function renderCategoryLinks(categories){
    if (nav){
      nav.replaceChildren();
      if (!isCategoryPage){
        categories.forEach((category)=>{
          const link = document.createElement('a');
          link.href = 'kategoriya.html?category=' + encodeURIComponent(category.slug);
          link.textContent = category.name;
          link.dataset.category = category.slug;
          bindTouchNavigation(link, category.slug);
          nav.appendChild(link);
        });
      }
    }

    if (isCategoryPage && categoryMenu && categoryMenuButton){
      categoryMenu.replaceChildren();
      const selected = categories.find((category)=>category.slug === selectedSlug);
      if(categoryCurrent) categoryCurrent.textContent = selected ? selected.name : 'Изберете категория';

      categories.forEach((category)=>{
        const link = document.createElement('a');
        link.href = 'kategoriya.html?category=' + encodeURIComponent(category.slug);
        link.textContent = category.name;
        link.dataset.category = category.slug;
        if(category.slug === selectedSlug){
          link.classList.add('is-current');
          link.setAttribute('aria-current','page');
        }
        bindTouchNavigation(link, category.slug);
        categoryMenu.appendChild(link);
      });

      categoryMenuButton.disabled = !categories.length;
    }
  }

  function renderProduct(product){
    const article = make('article', 'product-card');
    article.appendChild(make('h3', 'product-name', product.name || 'Артикул'));

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

  function renderCatalogLanding(categories){
    catalog.replaceChildren();
    const intro = make('div','goods-catalog-intro');
    intro.appendChild(make('strong','', 'Изберете категория'));
    intro.appendChild(make('p','', 'Всяка категория се отваря на отделна страница с публикуваните модели.'));
    catalog.appendChild(intro);
    if (!categories.length){
      setStatus('Категориите ще бъдат публикувани скоро. За наличности се свържете с нас по телефона.');
    } else {
      setStatus('');
    }
  }

  function renderCategory(category, products){
    const title = document.getElementById('category-page-title');
    const description = document.getElementById('category-page-description');
    if (title) title.textContent = category.name;
    if (description) description.textContent = 'Разгледайте публикуваните модели в категория „' + category.name + '“. За конкретна наличност и допълнителна информация се свържете с нас.';
    document.title = category.name + ' | Траурни стоки | Траурна агенция „Ден и Нощ“';

    catalog.replaceChildren();
    const section = make('section','goods-category goods-category-page-content');
    const content = make('div','goods-category-content');
    if (products.length){
      const grid = make('div','product-grid');
      products.forEach((product)=>grid.appendChild(renderProduct(product)));
      content.appendChild(grid);
    } else {
      content.appendChild(make('p','goods-empty','В момента няма публикувани артикули в тази категория. За наличности се свържете с нас.'));
    }
    section.appendChild(content);
    catalog.appendChild(section);
    setStatus('');
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
      const categories = await getRows(
        'categories',
        'select=id,name,slug,sort_order,is_active&is_active=eq.true&order=sort_order.asc',
        controller.signal
      );
      renderCategoryLinks(categories || []);

      if (!isCategoryPage){
        renderCatalogLanding(categories || []);
        return;
      }

      const category = (categories || []).find((item)=>item.slug === selectedSlug);
      if (!category){
        const title = document.getElementById('category-page-title');
        if (title) title.textContent = 'Категорията не е намерена';
        catalog.replaceChildren();
        setStatus('Тази категория не е намерена. Върнете се към всички траурни стоки.', true);
        return;
      }

      const products = await getRows(
        'products',
        'select=id,name,slug,description,image_url,is_available,sort_order,category_id,is_active&is_active=eq.true&category_id=eq.' + encodeURIComponent(category.id) + '&order=sort_order.asc,created_at.asc',
        controller.signal
      );
      renderCategory(category, products || []);
    } catch (error){
      console.error('Catalog load failed:', error);
      setStatus('Каталогът не може да бъде зареден в момента. За наличности се свържете с нас по телефона.', true);
    } finally {
      clearTimeout(timer);
    }
  }

  bindReliableMenuButton();

  document.addEventListener('click',(event)=>{
    if(!categoryMenuButton || !categoryMenu || categoryMenu.hidden) return;
    const switcher = document.querySelector('.category-switcher');
    if(switcher && !switcher.contains(event.target)) closeCategoryMenu();
  });

  document.addEventListener('keydown',(event)=>{
    if(event.key === 'Escape') closeCategoryMenu();
  });

  loadCatalog();
})();
