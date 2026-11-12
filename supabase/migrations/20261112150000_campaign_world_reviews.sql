create table public.campaign_world_reviews (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  from_campaign_date text not null check (length(trim(from_campaign_date)) between 1 and 120),
  to_campaign_date text not null check (length(trim(to_campaign_date)) between 1 and 120),
  trigger text not null check (trigger in ('session_end','downtime','pc_action','gm_review','other')),
  summary text not null default '' check (length(summary) <= 20000),
  status text not null default 'draft' check (status in ('draft','reviewed','applied')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  applied_at timestamptz
);

create index campaign_world_reviews_campaign_created
on public.campaign_world_reviews (campaign_id, created_at desc);

create table public.campaign_world_review_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  review_id uuid not null references public.campaign_world_reviews(id) on delete cascade,
  subject_type text not null check (subject_type in ('npc','house','faction','quest','location','event','economy','geography','history','other')),
  subject_id uuid,
  title text not null check (length(trim(title)) between 1 and 200),
  proposal text not null check (length(trim(proposal)) between 1 and 20000),
  basis text not null default '' check (length(basis) <= 10000),
  disposition text not null default 'pending' check (disposition in ('pending','approved','rejected','deferred','recorded')),
  gm_notes text not null default '' check (length(gm_notes) <= 10000),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index campaign_world_review_items_review
on public.campaign_world_review_items (campaign_id, review_id, disposition, created_at);

alter table public.campaign_world_reviews enable row level security;
alter table public.campaign_world_review_items enable row level security;

create policy campaign_world_reviews_gm_read
on public.campaign_world_reviews for select
to authenticated
using (public.is_campaign_gm(campaign_id));

create policy campaign_world_reviews_gm_insert
on public.campaign_world_reviews for insert
to authenticated
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create policy campaign_world_reviews_gm_update
on public.campaign_world_reviews for update
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create policy campaign_world_reviews_gm_delete
on public.campaign_world_reviews for delete
to authenticated
using (public.is_campaign_gm(campaign_id));

create policy campaign_world_review_items_gm_read
on public.campaign_world_review_items for select
to authenticated
using (public.is_campaign_gm(campaign_id));

create policy campaign_world_review_items_gm_insert
on public.campaign_world_review_items for insert
to authenticated
with check (public.is_campaign_gm(campaign_id));

create policy campaign_world_review_items_gm_update
on public.campaign_world_review_items for update
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create policy campaign_world_review_items_gm_delete
on public.campaign_world_review_items for delete
to authenticated
using (public.is_campaign_gm(campaign_id));

revoke all on public.campaign_world_reviews, public.campaign_world_review_items from anon;
grant select, insert, update, delete on public.campaign_world_reviews to authenticated;
grant select, insert, update, delete on public.campaign_world_review_items to authenticated;