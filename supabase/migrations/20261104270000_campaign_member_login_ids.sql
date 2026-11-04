alter table public.campaign_members
add column login_id text;

alter table public.campaign_members
add constraint campaign_members_login_id_format
check (
  login_id is null
  or (
    login_id = lower(login_id)
    and login_id ~ '^[a-z0-9][a-z0-9._-]{2,31}$'
  )
);

create unique index campaign_members_login_id_unique
on public.campaign_members (login_id)
where login_id is not null;
