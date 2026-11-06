-- Ден и Нощ — телефонни кликове с разбивка по номер и страница.
-- Не променя записването на събития, съществуващи RPC функции или RLS.
-- SELECT-only; security invoker respects admin-only analytics_events SELECT RLS.
create or replace function public.admin_analytics_phone_pages(p_since timestamptz)
returns table(phone text, page_path text, clicks bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(nullif(label,''),'Неуточнен')::text as phone,
    coalesce(nullif(page_path,''),'/')::text as page_path,
    count(*)::bigint as clicks
  from public.analytics_events
  where created_at >= p_since and event_type='phone_click'
  group by 1, 2
  order by clicks desc, phone asc, page_path asc;
$$;

revoke all on function public.admin_analytics_phone_pages(timestamptz) from public, anon;
grant execute on function public.admin_analytics_phone_pages(timestamptz) to authenticated;
