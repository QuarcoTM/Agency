-- Ден и Нощ: миграция за администраторски права и защита на статистиката.
-- ПРИЛАГАНЕ: изпълнете ЦЕЛИЯ файл в Supabase SQL Editor ПРЕДИ публикуване на новите admin файлове.
-- Ако има повече от един Supabase Auth потребител, транзакцията умишлено се прекратява
-- и трябва ръчно да изберете администратор (описано в SECURITY-DEPLOY.md).
-- Не трие analytics_events, категории, продукти, снимки или site_settings.
BEGIN;

CREATE TABLE IF NOT EXISTS public.agency_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agency_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.agency_admins FROM anon, authenticated;

-- Seed only when there is EXACTLY one existing Auth user; never elevate arbitrary users.
DO $$
DECLARE v_count bigint; v_id uuid;
BEGIN
  SELECT count(*), min(id) INTO v_count,v_id FROM auth.users;
  IF NOT EXISTS (SELECT 1 FROM public.agency_admins) THEN
    IF v_count <> 1 THEN
      RAISE EXCEPTION 'No unique existing admin: % Supabase Auth users. Seed agency_admins manually; see SECURITY-DEPLOY.md.',v_count;
    END IF;
    INSERT INTO public.agency_admins(user_id) VALUES(v_id);
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.is_agency_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_admins AS a WHERE a.user_id = (SELECT auth.uid())
  );
$$;
REVOKE ALL ON FUNCTION public.is_agency_admin() FROM public,anon;
GRANT EXECUTE ON FUNCTION public.is_agency_admin() TO authenticated;

-- Additional restrictive RLS WRITE gates. They preserve existing public SELECT policies.
-- Do NOT silently enable RLS on a table that has no policies (that could break the site).
DO $$
DECLARE tbl text; action text; pol text; enabled boolean;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['products','categories','site_settings'] LOOP
    IF to_regclass('public.'||tbl) IS NULL THEN CONTINUE; END IF;
    SELECT c.relrowsecurity INTO enabled FROM pg_class c WHERE c.oid=to_regclass('public.'||tbl);
    IF NOT enabled THEN
      RAISE EXCEPTION 'RLS not enabled on public.%; refusing to change it automatically',tbl;
    END IF;
    FOREACH action IN ARRAY ARRAY['INSERT','UPDATE','DELETE'] LOOP
      pol='agency_admin_'||tbl||'_'||lower(action)||'_guard';
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',pol,tbl);
      IF action='INSERT' THEN
        EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR INSERT TO public WITH CHECK (public.is_agency_admin())',pol,tbl);
      ELSIF action='UPDATE' THEN
        EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR UPDATE TO public USING (public.is_agency_admin()) WITH CHECK (public.is_agency_admin())',pol,tbl);
      ELSE
        EXECUTE format('CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR DELETE TO public USING (public.is_agency_admin())',pol,tbl);
      END IF;
    END LOOP;
  END LOOP;
END
$$;

-- Limit product image writes to the approved administrator as well.
DO $$
DECLARE action text; pol text;
BEGIN
  IF to_regclass('storage.objects') IS NULL THEN RETURN; END IF;
  FOREACH action IN ARRAY ARRAY['INSERT','UPDATE','DELETE'] LOOP
    pol='agency_product_images_'||lower(action)||'_guard';
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects',pol);
    IF action='INSERT' THEN
      EXECUTE format('CREATE POLICY %I ON storage.objects AS RESTRICTIVE FOR INSERT TO public WITH CHECK (bucket_id <> %L OR public.is_agency_admin())',pol,'product-images');
    ELSIF action='UPDATE' THEN
      EXECUTE format('CREATE POLICY %I ON storage.objects AS RESTRICTIVE FOR UPDATE TO public USING (bucket_id <> %L OR public.is_agency_admin()) WITH CHECK (bucket_id <> %L OR public.is_agency_admin())',pol,'product-images','product-images');
    ELSE
      EXECUTE format('CREATE POLICY %I ON storage.objects AS RESTRICTIVE FOR DELETE TO public USING (bucket_id <> %L OR public.is_agency_admin())',pol,'product-images');
    END IF;
  END LOOP;
END
$$;

-- One-minute global quota; no visitor identifier, IP address or browser fingerprint.
CREATE TABLE IF NOT EXISTS public.analytics_ingest_limits (
  window_start timestamptz PRIMARY KEY,
  accepted_count integer NOT NULL DEFAULT 0 CHECK (accepted_count >= 0)
);
ALTER TABLE public.analytics_ingest_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.analytics_ingest_limits FROM anon,authenticated;

CREATE OR REPLACE FUNCTION public.record_analytics_event(
  p_event_type text,
  p_page_path text,
  p_source text DEFAULT 'direct',
  p_referrer_host text DEFAULT '',
  p_label text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE
  v_type text := left(coalesce(p_event_type,''),40);
  v_path text := left(coalesce(p_page_path,'/'),240);
  v_source text := left(coalesce(nullif(p_source,''),'direct'),120);
  v_host text := left(coalesce(p_referrer_host,''),160);
  v_label text := left(coalesce(p_label,''),180);
  v_window timestamptz := date_trunc('minute',now());
  v_count integer;
BEGIN
  IF v_type NOT IN ('page_view','phone_click','map_open','faq_open','reviews_open','call_widget_open') THEN RETURN; END IF;
  IF v_path='' OR left(v_path,1)<>'/' OR v_path !~ '^/[a-zA-Z0-9_/?=&.%~-]*$' THEN RETURN; END IF;

  INSERT INTO public.analytics_ingest_limits(window_start,accepted_count)
    VALUES(v_window,1)
  ON CONFLICT(window_start) DO UPDATE
    SET accepted_count = public.analytics_ingest_limits.accepted_count+1
    WHERE public.analytics_ingest_limits.accepted_count < 300
  RETURNING accepted_count INTO v_count;
  IF v_count IS NULL THEN RETURN; END IF;

  INSERT INTO public.analytics_events(event_type,page_path,source,referrer_host,label)
    VALUES(v_type,v_path,v_source,v_host,v_label);

  -- Compact the quota log once per hour, on the first accepted event in that minute.
  IF extract(minute from v_window)=0 AND v_count=1 THEN
    DELETE FROM public.analytics_ingest_limits WHERE window_start < now()-interval '7 days';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.record_analytics_event(text,text,text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.record_analytics_event(text,text,text,text) TO anon,authenticated;

-- All analytics RPCs below are now limited by is_agency_admin().

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
set search_path = public
as $$
  select
    count(*) filter (where event_type='page_view')::bigint,
    count(*) filter (where event_type='phone_click')::bigint,
    count(*) filter (where event_type='page_view' and page_path IN ('/kontakti/','/kontakti.html'))::bigint,
    count(*) filter (where event_type='map_open')::bigint,
    count(*) filter (where event_type='faq_open')::bigint,
    count(*) filter (where event_type='call_widget_open')::bigint
  from public.analytics_events
  where created_at >= p_since AND public.is_agency_admin();
$$;

create or replace function public.admin_analytics_daily(p_since timestamptz)
returns table(day date, page_views bigint, phone_clicks bigint, contact_actions bigint)
language sql
security definer
set search_path = public
as $$
  select
    (created_at at time zone 'Europe/Sofia')::date as day,
    count(*) filter (where event_type='page_view')::bigint as page_views,
    count(*) filter (where event_type='phone_click')::bigint as phone_clicks,
    count(*) filter (where event_type in ('phone_click','map_open','call_widget_open'))::bigint as contact_actions
  from public.analytics_events
  where created_at >= p_since AND public.is_agency_admin()
  group by 1
  order by 1 asc;
$$;

create or replace function public.admin_analytics_top_pages(p_since timestamptz, p_limit integer default 10)
returns table(page_path text, views bigint)
language sql
security definer
set search_path = public
as $$
  select page_path, count(*)::bigint as views
  from public.analytics_events
  where created_at >= p_since AND public.is_agency_admin() and event_type='page_view'
  group by page_path
  order by views desc, page_path asc
  limit greatest(1, least(coalesce(p_limit,10), 25));
$$;

create or replace function public.admin_analytics_sources(p_since timestamptz, p_limit integer default 10)
returns table(source text, views bigint)
language sql
security definer
set search_path = public
as $$
  select source, count(*)::bigint as views
  from public.analytics_events
  where created_at >= p_since AND public.is_agency_admin()
    and event_type='page_view'
    and source <> 'internal'
  group by source
  order by views desc, source asc
  limit greatest(1, least(coalesce(p_limit,10), 25));
$$;

create or replace function public.admin_analytics_phones(p_since timestamptz)
returns table(phone text, clicks bigint)
language sql
security definer
set search_path = public
as $$
  select coalesce(nullif(label,''),'Неуточнен') as phone, count(*)::bigint as clicks
  from public.analytics_events
  where created_at >= p_since AND public.is_agency_admin() and event_type='phone_click'
  group by 1
  order by clicks desc, phone asc;
$$;

COMMIT;

-- VERIFY AFTER RUN:
-- SELECT public.is_agency_admin(); -- SQL Editor is not a logged-in frontend session; may return false.
-- SELECT * FROM public.agency_admins;
-- SELECT tablename,policyname,cmd,permissive,roles FROM pg_policies
--   WHERE schemaname IN ('public','storage') AND tablename IN ('products','categories','site_settings','objects');
