(function(){
  const cfg = window.DENINOSHT_SUPABASE;
  if (!cfg || !cfg.url || !cfg.publishableKey) return;

  const DEVICE_OPT_OUT_KEY = 'deninosht_analytics_do_not_count_device_v1';

  function isLikelyBot(){
    const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
    return /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|headless|lighthouse/i.test(ua);
  }

  function deviceOptedOut(){
    try { return localStorage.getItem(DEVICE_OPT_OUT_KEY) === '1'; }
    catch (_) { return false; }
  }

  if (isLikelyBot() || deviceOptedOut()) return;

  let disabled = false;

  function clean(value, max){
    return String(value || '').replace(/\s+/g,' ').trim().slice(0,max);
  }

  function currentPagePath(){
    let path = location.pathname || '/';
    if (path.length > 220) path = path.slice(0,220);
    if (/\/kategoriya\.html$/i.test(path)){
      const category = new URLSearchParams(location.search).get('category') || '';
      if (/^[a-z0-9-]{1,60}$/i.test(category)) path += '?category=' + category.toLowerCase();
    }
    return path;
  }

  function campaignInfo(){
    const params = new URLSearchParams(location.search);
    return {
      source: clean(params.get('utm_source'),80),
      medium: clean(params.get('utm_medium'),80),
      campaign: clean(params.get('utm_campaign'),120)
    };
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

  function track(eventType, label){
    if (disabled || deviceOptedOut()) return;
    const ref = referrerInfo();
    const campaign = campaignInfo();

    // A UTM source describes the external acquisition source more precisely than
    // an empty/direct referrer, but internal navigation must stay "internal".
    let source = ref.source;
    if (source !== 'internal' && campaign.source) source = campaign.source.toLowerCase();

    const payload = {
      p_event_type: clean(eventType,40),
      p_page_path: currentPagePath(),
      p_source: clean(source,120) || 'direct',
      p_referrer_host: clean(ref.host,160),
      p_label: clean(label,180),
      p_utm_source: campaign.source,
      p_utm_medium: campaign.medium,
      p_utm_campaign: campaign.campaign
    };

    try{
      fetch(cfg.url + '/rest/v1/rpc/record_analytics_event_v153', {
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

  window.DenINoshtAnalytics = Object.freeze({
    track:track,
    isDeviceExcluded:deviceOptedOut,
    optOutKey:DEVICE_OPT_OUT_KEY
  });

  // Cookie-free page view. No visitor ID, fingerprint or persistent tracking ID.
  track('page_view','');

  // GitHub Pages serves 404.html at the requested path; this extra event lets
  // the admin panel show exactly which missing URLs are being requested.
  if (window.DENINOSHT_IS_404 === true) track('not_found','404');

  document.addEventListener('click',(event)=>{
    const link = event.target && event.target.closest ? event.target.closest('a[href^="tel:"]') : null;
    if (!link) return;
    const phone = String(link.getAttribute('href') || '').replace(/^tel:/i,'').replace(/[^0-9+]/g,'').slice(0,30);
    track('phone_click', phone);
  }, true);
})();