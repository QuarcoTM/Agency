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
  // Dedicated server-served pages have real canonical URLs; the old query URL remains functional.
  const dedicatedSlug = isCategoryPage ? (document.body.dataset.categorySlug || '') : '';
  const isDedicatedCategoryPage = Boolean(dedicatedSlug);
  const selectedSlug = isCategoryPage ? (dedicatedSlug || new URLSearchParams(window.location.search).get('category') || '') : '';
  const categoryPath = (slug)=>'/traurni-stoki/' + encodeURIComponent(slug) + '/';

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
    window.location.assign(categoryPath(slug));
  }

  function bindTouchNavigation(link, slug){
    let startX = 0;
    let startY = 0;
    let moved = false;
    let suppressClickUntil = 0;
    link.addEventListener('touchstart',(event)=>{
      const touch = event.touches && event.touches[0];
      if(!touch) return;
      startX = touch.clientX;
      startY = touch.clientY;
      moved = false;
    },{passive:true});
    link.addEventListener('touchmove',(event)=>{
      const touch = event.touches && event.touches[0];
      if(!touch) return;
      if(Math.hypot(touch.clientX - startX, touch.clientY - startY) > 10) moved = true;
    },{passive:true});
    link.addEventListener('touchend',(event)=>{
      suppressClickUntil = Date.now() + 700;
      if(moved) return;
      if(event.cancelable) event.preventDefault();
      navigateToCategory(slug);
    },{passive:false});
    link.addEventListener('click',(event)=>{
      if(Date.now() < suppressClickUntil){
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
          link.href = categoryPath(category.slug);
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
        link.href = categoryPath(category.slug);
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
    article.id = 'product-' + product.id;
    article.appendChild(make('h3', 'product-name', product.name || 'Артикул'));
    if (product.product_code && product.show_product_code === true){
      article.appendChild(make('div', 'product-code', 'Код: ' + product.product_code));
    }

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

  function setCategoryIndexability(indexable){
    if (!isCategoryPage) return;
    const meta = document.querySelector('meta[name="robots"]');
    // Legacy query-based pages are canonicalized but never independently indexed.
    // Public obituary previews stay out of the SEO category pages for now.
    const canIndex = isDedicatedCategoryPage && selectedSlug !== 'nekrolozi' && Boolean(indexable);
    if (meta) meta.setAttribute('content', canIndex
      ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
      : 'noindex,follow');
  }

  function setCategoryCanonical(slug){
    if (!isCategoryPage || !slug) return;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical){
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    const url = 'https://deninosht.bg' + categoryPath(slug);
    canonical.href = url;
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', url);
  }

  function renderCategory(category, products){
    setCategoryIndexability(products.length > 0);
    setCategoryCanonical(category.slug);
    const title = document.getElementById('category-page-title');
    const description = document.getElementById('category-page-description');
    const categoryName = String(category.name || '').trim();
    if (title) title.textContent = categoryName;
    if (description && !isDedicatedCategoryPage) description.textContent = 'Разгледайте публикуваните модели в категория „' + categoryName + '“. За конкретна наличност и допълнителна информация се свържете с нас.';
    if (!isDedicatedCategoryPage) document.title = categoryName + ' в Кюстендил | Траурни стоки – Ден и Нощ';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && !isDedicatedCategoryPage) metaDescription.setAttribute('content', categoryName + ' в Кюстендил от траурна агенция „Ден и Нощ“. Разгледайте публикуваните модели и се свържете с нас за актуална наличност.');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && !isDedicatedCategoryPage) ogTitle.setAttribute('content', categoryName + ' в Кюстендил | Ден и Нощ');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription && !isDedicatedCategoryPage) ogDescription.setAttribute('content', 'Разгледайте ' + categoryName.toLowerCase() + ' от траурна агенция „Ден и Нощ“ в Кюстендил.');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle && !isDedicatedCategoryPage) twitterTitle.setAttribute('content', categoryName + ' в Кюстендил | Ден и Нощ');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription && !isDedicatedCategoryPage) twitterDescription.setAttribute('content', 'Разгледайте ' + categoryName.toLowerCase() + ' в каталога на траурна агенция „Ден и Нощ“.');

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
        setCategoryIndexability(false);
        const title = document.getElementById('category-page-title');
        if (title) title.textContent = 'Категорията не е намерена';
        catalog.replaceChildren();
        setStatus('Тази категория не е намерена. Върнете се към всички траурни стоки.', true);
        return;
      }

      let products;
      try{
        products = await getRows(
          'products',
          'select=id,name,product_code,show_product_code,slug,description,image_url,is_available,sort_order,category_id,is_active,is_archived&is_active=eq.true&is_archived=eq.false&category_id=eq.' + encodeURIComponent(category.id) + '&order=sort_order.asc,created_at.asc',
          controller.signal
        );
      } catch (schemaError){
        products = await getRows(
          'products',
          'select=id,name,slug,description,image_url,is_available,sort_order,category_id,is_active&is_active=eq.true&category_id=eq.' + encodeURIComponent(category.id) + '&order=sort_order.asc,created_at.asc',
          controller.signal
        );
      }
      renderCategory(category, products || []);
      if (window.location.hash){
        requestAnimationFrame(()=>{
          const target = document.querySelector(window.location.hash);
          if (target){ target.classList.add('is-target-product'); target.scrollIntoView({behavior:'smooth',block:'center'}); }
        });
      }
    } catch (error){
      // Keep the static SEO metadata during temporary network outages.
      // Unknown query-based pages remain noindex from their HTML source.
      if (!isDedicatedCategoryPage) setCategoryIndexability(false);
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
