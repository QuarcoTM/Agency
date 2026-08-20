(function(){
  const ORIGINAL_TICKER = 'ДЕНОНОЩНА ТРАУРНА АГЕНЦИЯ — 0893 64 66 68 — 0898 24 24 34';
  const cfg = window.DENINOSHT_SUPABASE || null;

  function applyTicker(text){
    const value = String(text || '').trim() || ORIGINAL_TICKER;
    document.querySelectorAll('.ticker-item').forEach((item)=>{ item.textContent = value; });
  }

  async function loadTicker(){
    applyTicker(ORIGINAL_TICKER);
    if (!cfg || !cfg.url || !cfg.publishableKey) return;
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
      if (!response.ok) return;
      const rows = await response.json();
      if (Array.isArray(rows) && rows[0] && rows[0].top_ticker_text){
        applyTicker(rows[0].top_ticker_text);
      }
    } catch (_) {
      // Keep the built-in original text if Supabase is unavailable.
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadTicker, {once:true});
  else loadTicker();
})();
