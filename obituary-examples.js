/* Връщане към стария вид: сменете само true на false. */
(() => {
  'use strict';
  const ENABLE_OBITUARY_EXAMPLES = true;
  if (!ENABLE_OBITUARY_EXAMPLES) return;
  const section = document.getElementById('obituary-examples');
  if (section) section.hidden = false;
})();
