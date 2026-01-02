-- Add clicks column to app_links table
alter table public.app_links
add column if not exists clicks integer not null default 0;

-- Add index for better performance when ordering by clicks
create index if not exists idx_app_links_clicks on public.app_links(clicks desc);

-- Function to increment link clicks
create or replace function public.increment_link_clicks(link_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.app_links
  set clicks = clicks + 1
  where id = link_id;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.increment_link_clicks(uuid) to authenticated;
