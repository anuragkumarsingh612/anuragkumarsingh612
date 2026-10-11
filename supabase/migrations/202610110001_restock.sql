-- Every household is scoped to an authenticated owner, including anonymous users.
create table public.households (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null unique references auth.users(id) on delete cascade,
 name text not null default 'My household' check (length(name) between 2 and 60),
 city text not null default 'Bengaluru',
 created_at timestamptz not null default now()
);
create table public.products (
 id uuid primary key default gen_random_uuid(),
 household_id uuid not null references public.households(id) on delete cascade,
 name text not null check (length(trim(name)) between 1 and 120),
 normalized_name text generated always as (lower(trim(name))) stored,
 pack text not null default '',
 category text not null default 'pantry' check (category in ('pantry','dairy','home','personal')),
 art text not null default 'lentils' check (art in ('rice','oil','milk','salt','soap','tea','coffee','detergent','lentils')),
 cycle_days numeric check (cycle_days > 0),
 manual_cycle_days integer check (manual_cycle_days between 1 and 365),
 confidence numeric not null default 0 check (confidence between 0 and 1),
 last_purchased_on date,
 store text not null default '',
 price numeric check (price >= 0),
 ignored boolean not null default false,
 snooze_until date,
 unique(household_id, normalized_name),
 unique(household_id,id)
);
create table public.purchases (
 id uuid primary key default gen_random_uuid(),
 household_id uuid not null references public.households(id) on delete cascade,
 product_id uuid not null,
 purchased_on date not null check (purchased_on <= (now() at time zone 'Asia/Kolkata')::date),
 quantity numeric not null check (quantity > 0 and quantity <= 100000),
 price numeric check (price >= 0 and price <= 100000000),
 store text not null check (length(store) between 1 and 120),
 created_at timestamptz not null default now(),
 foreign key (household_id,product_id) references public.products(household_id,id) on delete cascade
);
create index purchases_cycle_idx on public.purchases(household_id, product_id, purchased_on);
create table public.item_cycles (
 household_id uuid not null,
 product_id uuid primary key,
 median_days numeric check (median_days > 0),
 interval_count integer not null default 0 check (interval_count >= 0),
 due_on date,
 updated_at timestamptz not null default now(),
 foreign key (household_id,product_id) references public.products(household_id,id) on delete cascade
);
alter table public.households enable row level security;
alter table public.products enable row level security;
alter table public.purchases enable row level security;
alter table public.item_cycles enable row level security;
create policy owner_household on public.households for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy owner_products on public.products for all to authenticated using (exists(select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))) with check (exists(select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid())));
create policy owner_purchases_read on public.purchases for select to authenticated using (exists(select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid())));
create policy owner_cycles_read on public.item_cycles for select to authenticated using (exists(select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid())));

create function public.ensure_household() returns uuid language plpgsql security invoker set search_path = '' as $$
declare result uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 insert into public.households(owner_id) values(auth.uid()) on conflict(owner_id) do nothing;
 select id into result from public.households where owner_id=auth.uid();
 return result;
end;
$$;

-- Atomic confirmation, matching and median recomputation. No AI values are saved
-- until the user has reviewed the rows and submits this transaction.
create function public.confirm_purchase(p_household uuid,p_store text,p_date date,p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 row_data jsonb;
 product_uuid uuid;
 interval_median numeric;
 interval_total integer;
 last_date date;
 result jsonb := '[]'::jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.households where id=p_household and owner_id=auth.uid()) then raise exception 'Household access denied'; end if;
 if p_date is null or p_date > (now() at time zone 'Asia/Kolkata')::date or p_store is null or length(trim(p_store)) not between 1 and 120 then raise exception 'Invalid purchase details'; end if;
 if jsonb_typeof(p_items) is distinct from 'array' then raise exception 'Items must be an array'; end if;
 if jsonb_array_length(p_items) not between 1 and 100 then raise exception 'Expected 1 to 100 items'; end if;
 -- Serialize confirmations for this household to avoid stale cycle aggregates.
 perform 1 from public.households where id=p_household for update;
 for row_data in select value from jsonb_array_elements(p_items) loop
  if jsonb_typeof(row_data->'name') is distinct from 'string' or length(trim(row_data->>'name')) not between 1 and 120 or jsonb_typeof(row_data->'quantity') is distinct from 'number' or (row_data->>'quantity')::numeric not between 0.000001 and 100000 then raise exception 'Invalid item'; end if;
  if row_data->'price' is not null and row_data->'price' <> 'null'::jsonb and (jsonb_typeof(row_data->'price') <> 'number' or (row_data->>'price')::numeric not between 0 and 100000000) then raise exception 'Invalid price'; end if;
  insert into public.products(household_id,name) values(p_household,trim(row_data->>'name')) on conflict(household_id,normalized_name) do update set name=excluded.name returning id into product_uuid;
  insert into public.purchases(household_id,product_id,purchased_on,quantity,price,store) values(p_household,product_uuid,p_date,(row_data->>'quantity')::numeric,(row_data->>'price')::numeric,trim(p_store));
  with dates as (select distinct purchased_on from public.purchases where product_id=product_uuid), gaps as (select purchased_on-lag(purchased_on) over(order by purchased_on) as gap from dates)
  select percentile_cont(0.5) within group(order by gap),count(gap) into interval_median,interval_total from gaps where gap>0;
  select max(purchased_on) into last_date from public.purchases where product_id=product_uuid;
  insert into public.item_cycles(household_id,product_id,median_days,interval_count,due_on) values(p_household,product_uuid,interval_median,interval_total,last_date+round(interval_median)::integer)
  on conflict(product_id) do update set median_days=excluded.median_days,interval_count=excluded.interval_count,due_on=excluded.due_on,updated_at=now();
  update public.products set cycle_days=interval_median,confidence=least(0.95,interval_total::numeric/5),last_purchased_on=last_date,store=case when p_date=last_date then trim(p_store) else store end,price=case when p_date=last_date then (row_data->>'price')::numeric else price end,snooze_until=null where id=product_uuid;
  result := result || jsonb_build_array(jsonb_build_object('id',product_uuid,'name',trim(row_data->>'name')));
 end loop;
 return result;
end;
$$;
revoke all on function public.ensure_household() from public, anon;
revoke all on function public.confirm_purchase(uuid,text,date,jsonb) from public, anon;
grant execute on function public.ensure_household() to authenticated;
grant execute on function public.confirm_purchase(uuid,text,date,jsonb) to authenticated;
-- Purchases and cycles are writable only through the validated atomic function.
revoke insert,update,delete on public.purchases,public.item_cycles from anon,authenticated;
grant select on public.purchases,public.item_cycles to authenticated;

-- A small per-account hourly budget bounds paid vision requests.
create table public.receipt_usage (
 user_id uuid primary key references auth.users(id) on delete cascade,
 hour_bucket timestamptz not null,
 requests integer not null check (requests between 1 and 20)
);
alter table public.receipt_usage enable row level security;
revoke all on public.receipt_usage from anon,authenticated;
create function public.consume_receipt_quota() returns boolean language plpgsql security definer set search_path = '' as $$
declare requests_used integer;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 insert into public.receipt_usage(user_id,hour_bucket,requests) values(auth.uid(),date_trunc('hour',now()),1)
 on conflict(user_id) do update set
 requests=case when public.receipt_usage.hour_bucket < date_trunc('hour',now()) then 1 else public.receipt_usage.requests+1 end,
 hour_bucket=date_trunc('hour',now())
 where public.receipt_usage.hour_bucket < date_trunc('hour',now()) or public.receipt_usage.requests < 20
 returning requests into requests_used;
 return requests_used is not null;
end;
$$;
revoke all on function public.consume_receipt_quota() from public,anon;
grant execute on function public.consume_receipt_quota() to authenticated;
