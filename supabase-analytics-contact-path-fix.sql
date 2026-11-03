-- Ден и Нощ — поправка на статистиката за страницата „Контакти“.
-- ВАЖНО: Това е само скрипт за бъдещо ръчно изпълнение в Supabase проекта на Ден и Нощ.
-- НЕ е изпълняван върху реална база. Засяга единствено функцията admin_analytics_kpis.
-- Брои както новия каноничен адрес /kontakti/, така и стария /kontakti.html.
-- ПРАВА: запазва съществуващата схема за достъп; тя изисква отделен одит.

create or replace function public.admin_analytics_kpis(p_since timestamptz)
returns table(
  page_views bigint,
  phone_clicks bigint,
  contact_page_views bigint,
  map_opens bigint,
  faq_opens bigint,
  call_widget_opens bigint
)
language sql
security definer
set search_path = ''
as $$
  select
    count(*) filter (where event_type='page_view')::bigint,
    count(*) filter (where event_type='phone_click')::bigint,
    count(*) filter (where event_type='page_view' and page_path in ('/kontakti/', '/kontakti.html'))::bigint,
    count(*) filter (where event_type='map_open')::bigint,
    count(*) filter (where event_type='faq_open')::bigint,
    count(*) filter (where event_type='call_widget_open')::bigint
  from public.analytics_events
  where created_at >= p_since;
$$;
