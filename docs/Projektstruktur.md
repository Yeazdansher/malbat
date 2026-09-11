# Projektstruktur

Übersicht der wichtigsten Ordner in MALBAT v1.0.0.

## `app/`

Next.js App Router: Seiten, Layouts und Server Actions.

Wichtige Bereiche:

- Auth: Login, Registrierung, Passwort vergessen/zurücksetzen, Callback
- `dashboard/` — Stammbaumübersicht
- `family/` — Stammbaum anlegen und öffnen
- `profile/` — Profil, Passwort, Tarif, Konto löschen
- `invite/` — Einladungslinks annehmen

## `components/`

UI-Komponenten (Header, Dialoge, Stammbaum-Darstellung, Profil, Dashboard).

## `database/`

Nummerierte SQL-Migrationen für Schema, Funktionen und RLS. Immer in
Reihenfolge ausführen. Siehe [Datenbank.md](Datenbank.md).

## `docs/`

Projektdokumentation für Entwickler und Betrieb.

## `lib/`

Fach- und Infrastrukturlogik:

- `supabase/` — Server-Client und Session-Proxy
- `tree-engine/` — Graph, Layout, Rendering, Kantenführung
- `plans.ts`, `invitations.ts`, `family-permissions.ts`, `password.ts`, …

## `scripts/`

Hilfsskripte für lokale Entwicklung (z. B. Next-Start mit Norton-CA).

## `public/`

Statische Assets.

## Wurzeldateien

- `proxy.ts` — Session-Aktualisierung für Next.js
- `package.json` — Version `1.0.0` und Scripts
- `.env.example` — Vorlage für Umgebungsvariablen
- `AGENTS.md` / `CLAUDE.md` — Hinweise für KI-Assistenten in diesem Repo
