import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Admin shows origin page for every phone click, grouped by number',()=>{
 const code=read('admin/admin.js');
 const html=read('admin/index.html');
 const css=read('admin/admin.css');
 assert.match(code,/analyticsRpc\('admin_analytics_phone_pages',\{p_since:since\}\)/);
 assert.match(code,/function renderAnalyticsPhonePages\(element, rows\)/);
 assert.match(code,/label\.textContent='Страница: '/);
 assert.match(code,/phoneLabel\(row\.phone\)/);
 assert.match(code,/pageLabel\(item\.path\)/);
 assert.match(code,/group\.total\+=clicks/);
 assert.match(html,/Кликове по телефон и страница/);
 assert.match(html,/не потвърдени телефонни разговори/);
 assert.match(html,/admin\.js\?v=2\.22/);
 assert.match(html,/admin\.css\?v=2\.22/);
 assert.match(css,/\.analytics-phone-page\{/);
});

test('Phone analytics RPC remains SELECT-only, scoped to existing admin RLS',()=>{
 const sql=read('supabase-analytics-phone-page-breakdown-20261106.sql');
 assert.match(sql,/create or replace function public\.admin_analytics_phone_pages\(p_since timestamptz\)/i);
 assert.match(sql,/security invoker/i);
 assert.match(sql,/where created_at >= p_since and event_type='phone_click'/i);
 assert.match(sql,/group by 1, 2/i);
 assert.match(sql,/revoke all on function public\.admin_analytics_phone_pages\(timestamptz\) from public, anon;/i);
 assert.match(sql,/grant execute on function public\.admin_analytics_phone_pages\(timestamptz\) to authenticated;/i);
 assert.doesNotMatch(sql,/create policy|alter table|security definer/i);
 const publicTracking=read('analytics.js');
 assert.match(publicTracking,/p_page_path: currentPagePath\(\)/);
 assert.match(publicTracking,/track\('phone_click', phone\)/);
});
