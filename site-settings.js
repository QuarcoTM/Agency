(function(){
  const ORIGINAL_TICKER = 'ДЕНОНОЩНА ТРАУРНА АГЕНЦИЯ — 0893 64 66 68 — 0898 24 24 34';
  const CACHE_KEY = 'deninosht_top_ticker_v1';
  const cfg = window.DENINOSHT_SUPABASE || null;
  let currentTicker = null;
  let lastViewportWidth = 0;
  let resizeTimer = 0;

  function normalizeTicker(text){
    return String(text || '').trim() || ORIGINAL_TICKER;
  }

  function readCachedTicker(){
    try {
      const value = String(localStorage.getItem(CACHE_KEY) || '').trim();
      return value || null;
    } catch (_) {
      return null;
    }
  }

  function cacheTicker(text){
    try { localStorage.setItem(CACHE_KEY, normalizeTicker(text)); }
    catch (_) {}
  }

  function makeTickerItem(text){
    const item = document.createElement('span');
    item.className = 'ticker-item';
    item.textContent = text;
    return item;
  }

  function makeTickerGroup(text, count){
    const group = document.createElement('div');
    group.className = 'ticker-group';
    group.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < count; i += 1) group.appendChild(makeTickerItem(text));
    return group;
  }

  function rebuildTrack(track, text){
    track.classList.remove('ticker-running');
    track.style.removeProperty('--ticker-duration');
    track.replaceChildren();

    const probe = makeTickerItem(text);
    probe.classList.add('ticker-probe');
    track.appendChild(probe);
    const itemWidth = Math.max(1, probe.getBoundingClientRect().width || 1);
    track.replaceChildren();

    const viewportWidth = Math.max(window.innerWidth || document.documentElement.clientWidth || 320, 320);
    const targetGroupWidth = Math.max(1100, viewportWidth * 1.8);
    const repeatCount = Math.max(2, Math.ceil(targetGroupWidth / itemWidth) + 1);

    const first = makeTickerGroup(text, repeatCount);
    const second = makeTickerGroup(text, repeatCount);
    track.append(first, second);

    const groupWidth = Math.max(first.getBoundingClientRect().width || targetGroupWidth, targetGroupWidth);
    const duration = Math.max(22, Math.min(90, groupWidth / 48));
    track.style.setProperty('--ticker-duration', duration.toFixed(2) + 's');

    void track.offsetWidth;
    track.setAttribute('data-ticker-ready', '1');
    track.classList.add('ticker-running');
  }

  function applyTicker(text){
    const value = normalizeTicker(text);
    currentTicker = value;
    document.querySelectorAll('.ticker-track').forEach((track)=>rebuildTrack(track, value));
  }

  async function loadTicker(){
    // Never paint the hard-coded original before we know the active value.
    // A cached custom value is already inserted synchronously by the tiny
    // bootstrap next to the ticker markup, before the first paint.
    const cached = readCachedTicker();
    if (cached) {
      currentTicker = cached;
      // Rebuild only to calculate the exact repetition count and speed.
      applyTicker(cached);
    }

    if (!cfg || !cfg.url || !cfg.publishableKey) {
      if (!currentTicker) applyTicker(ORIGINAL_TICKER);
      return;
    }

    try{
      const controller = new AbortController();
      const timeout = setTimeout(()=>controller.abort(), 4500);
      const response = await fetch(cfg.url + '/rest/v1/site_settings?select=top_ticker_text&order=id.asc&limit=1', {
        method:'GET',
        headers:{apikey:cfg.publishableKey,Accept:'application/json'},
        cache:'no-store',
        signal:controller.signal
      });
      clearTimeout(timeout);
      if (!response.ok) {
        if (!currentTicker) applyTicker(ORIGINAL_TICKER);
        return;
      }
      const rows = await response.json();
      const value = Array.isArray(rows) && rows[0] && rows[0].top_ticker_text
        ? normalizeTicker(rows[0].top_ticker_text)
        : ORIGINAL_TICKER;

      cacheTicker(value);
      if (value !== currentTicker) applyTicker(value);
      else if (!document.querySelector('.ticker-track[data-ticker-ready="1"]')) applyTicker(value);
    } catch (_) {
      // If this browser has never loaded the setting and Supabase is unavailable,
      // fall back to the built-in original. Otherwise keep the cached value.
      if (!currentTicker) applyTicker(ORIGINAL_TICKER);
    }
  }

  function handleResize(){
    const width = Math.max(window.innerWidth || document.documentElement.clientWidth || 0, 0);
    if (Math.abs(width - lastViewportWidth) < 24) return;
    lastViewportWidth = width;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(()=>{
      if (currentTicker) applyTicker(currentTicker);
    }, 180);
  }

  lastViewportWidth = Math.max(window.innerWidth || document.documentElement.clientWidth || 0, 0);
  window.addEventListener('resize', handleResize, {passive:true});

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadTicker, {once:true});
  else loadTicker();
})();
