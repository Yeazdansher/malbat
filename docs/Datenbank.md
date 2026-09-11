# Datenbank

MALBAT nutzt Supabase (Auth + PostgreSQL) mit Row Level Security.

## Kern-Tabellen

| Tabelle | Zweck |
| --- | --- |
| `profiles` | Anzeigename und Benutzername |
| `families` | Stammbäume (`plan_locked` bei Free-Downgrade) |
| `family_members` | Mitgliedschaft und Rolle |
| `persons` | Personen eines Stammbaums |
| `relationships` | Beziehungen zwischen Personen |
| `family_invitations` | Einmalige Einladungslinks |
| `plans` / `user_plans` | Tarifkatalog und Benutzer-Tarif |

## Rollen

| Rolle | Rechte |
| --- | --- |
| `owner` | Volle Verwaltung, Einladungen, Löschen |
| `editor` | Personen und Beziehungen bearbeiten |
| `viewer` | Nur lesen |

## Tarife

- **Free:** max. 1 eigener Stammbaum, max. 50 Personen je eigenem Baum
- **Premium:** unbegrenzt (aktuell bewusst kostenlos aktivierbar)
- Mitarbeit in fremden Bäumen ist in beiden Tarifen unbegrenzt
- Limits richten sich nach dem **Besitzer** des Baums

## Migrationen

Im Supabase SQL Editor **streng nacheinander** ausführen:

| Datei | Inhalt |
| --- | --- |
| `001_families.sql` | families, persons, relationships |
| `002_profiles.sql` | profiles |
| `003_family_members.sql` | family_members |
| `004_profile_auth_trigger.sql` | Profil bei Registrierung |
| `005_delete_complete_family.sql` | Stammbaum vollständig löschen |
| `006_delete_own_account.sql` | Eigenes Konto löschen |
| `007_update_family_details.sql` | Name/Beschreibung (Policy) |
| `008_family_invitations_and_roles.sql` | Einladungen, Rollen, RLS |
| `009_user_plans.sql` | Free/Premium, Limits, Trigger |
| `010_full_data_reset.sql` | **Nur Entwicklung** — löscht alle Daten |
| `011_downgrade_to_free.sql` | Free-Wechsel und Baumsperren |
| `012_update_family_details.sql` | RPC zum Speichern von Baumdetails |
| `013_editor_can_invite.sql` | Bearbeiter dürfen Einladungen erstellen |

## Sicherheitshinweise

- `010_full_data_reset.sql` niemals in Produktion mit echten Nutzern ausführen.
- Nach dem Go-Live nur noch vorwärts gerichtete Migrationen (`013+`) ergänzen.
- Auth-Redirects in Supabase auf die jeweilige Site-URL beschränken.
