-- Benachrichtigungspräferenz (noch ohne Versand; Speicherung für spätere Nutzung)

alter table public.profiles
  add column if not exists notifications_enabled boolean not null default true;

comment on column public.profiles.notifications_enabled is
  'Nutzerpräferenz: Benachrichtigungen aktiv (true) oder inaktiv (false).';
