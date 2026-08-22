(function(){
  const cfg = window.DENINOSHT_SUPABASE;
  if (!cfg || !cfg.url || !cfg.publishableKey) return;

  function isLikelyBot(){
    const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
    return /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|headless|lighthouse/i.test(ua);
  }
  if (isLikelyBot()) return;

  let disabled = false;

  function currentPagePath(){
    let path = location.pathname || '/';
    if (path.length > 220) path = path.slice(0,220);
    if (/\/kategoriya\.html$/i.test(path)){
      const category = new URLSearchParams(location.search).get('category') || '';
      if (/^[a-z0-9-]{1,60}$/i.test(category)) path += '?category=' + category.toLowerCase();
    }
    return path;
  }

  function referrerInfo(){
    if (!document.referrer) return {source:'direct', host:''};
    try{
      const ref = new URL(document.referrer);
      const host = (ref.hostname || '').toLowerCase().replace(/^www\./,'');
      const own = (location.hostname || '').toLowerCase().replace(/^www\./,'');
      if (!host) return {source:'direct', host:''};
      if (host === own) return {source:'internal', host:host};
      if (/(^|\.)google\./.test(host) || host === 'google.com') return {source:'google', host:host};
      if (host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.com' || host.endsWith('.fb.com')) return {source:'facebook', host:host};
      if (host === 'instagram.com' || host.endsWith('.instagram.com')) return {source:'instagram', host:host};
      if (host === 'bing.com' || host.endsWith('.bing.com')) return {source:'bing', host:host};
      return {source:host.slice(0,120), host:host.slice(0,160)};
    } catch(_){
      return {source:'other', host:''};
    }
  }

  function cleanLabel(value){
    return String(value || '').replace(/\s+/g,' ').trim().slice(0,180);
  }

  function track(eventType, label){
    if (disabled) return;
    const ref = referrerInfo();
    const payload = {
      p_event_type: String(eventType || '').slice(0,40),
      p_page_path: currentPagePath(),
      p_source: ref.source,
      p_referrer_host: ref.host,
      p_label: cleanLabel(label)
    };
    try{
      fetch(cfg.url + '/rest/v1/rpc/record_analytics_event', {
        method:'POST',
        headers:{
          apikey:cfg.publishableKey,
          'Content-Type':'application/json',
          Accept:'application/json'
        },
        body:JSON.stringify(payload),
        keepalive:true,
        cache:'no-store'
      }).then((response)=>{
        if (!response.ok && (response.status === 404 || response.status === 400)) disabled = true;
      }).catch(()=>{});
    } catch(_){}
  }

  window.DenINoshtAnalytics = Object.freeze({track:track});

  // Cookie-free page view. No visitor ID, browser fingerprint or persistent storage is created.
  track('page_view','');

  // Track only the agency phone link that was intentionally pressed.
  document.addEventListener('click',(event)=>{
    const link = event.target && event.target.closest ? event.target.closest('a[href^="tel:"]') : null;
    if (!link) return;
    const phone = String(link.getAttribute('href') || '').replace(/^tel:/i,'').replace(/[^0-9+]/g,'').slice(0,30);
    track('phone_click', phone);
  }, true);
})();
