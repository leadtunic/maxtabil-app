alter table public.app_links
  add column if not exists sector text not null default 'GERAL';

create index if not exists app_links_sector_idx on public.app_links(sector);
