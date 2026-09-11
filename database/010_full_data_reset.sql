-- Vollständiger Datenreset für einen sauberen Neustart.
-- Löscht Benutzer, Profile, Stammbäume, Personen, Beziehungen und Einladungen.
-- Tabellen, Funktionen und Tarifkatalog bleiben erhalten.
--
-- Im Supabase SQL Editor ausführen.

begin;

delete from auth.users;

truncate table
  public.family_invitations,
  public.relationships,
  public.persons,
  public.family_members,
  public.families,
  public.user_plans,
  public.profiles
restart identity cascade;

commit;
