-- Ден и Нощ v1.61
-- Позволява за всеки продукт отделно да се избере дали кодът му да се вижда в публичния сайт.
-- Съществуващите и новите продуктови кодове са скрити по подразбиране.

alter table public.products
  add column if not exists show_product_code boolean not null default false;

comment on column public.products.show_product_code is
  'Показва продуктовия код в публичния каталог, когато стойността е true.';
