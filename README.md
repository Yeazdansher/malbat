# MALBAT

**Version 1.0.0** — stabile Grundlage für Familienstammbäume.

MALBAT ist eine Webanwendung zum gemeinsamen Erstellen und Verwalten von
Familienstammbäumen. Benutzer können eigene Bäume anlegen, Personen und
Beziehungen pflegen sowie Familienmitglieder mit klaren Rollen einladen.

Stack: **Next.js**, **Supabase Auth**, **PostgreSQL**, **React Flow**.

## Funktionen in v1.0.0

- Registrierung, Anmeldung, Passwort zurücksetzen und Konto löschen
- Profil mit Vor-/Nachname und Tarifverwaltung (Free / Premium)
- Eigene Stammbäume erstellen, bearbeiten und löschen
- Personen und Beziehungen im interaktiven Stammbaum
- Einladungen mit Rollen: Besitzer, Bearbeiter, Betrachter
- Free-Limits: 1 eigener Stammbaum, max. 50 Personen
- Dashboard mit Personenanzahl und Geburtstagen im aktuellen Monat

## Schnellstart

### 1. Voraussetzungen

- Node.js 20+
- Supabase-Projekt

### 2. Umgebung

Datei `.env.local` anlegen (Vorlage: `.env.example`):

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Datenbank

Im Supabase SQL Editor die Dateien unter `database/` **in numerischer
Reihenfolge** ausführen (`001` … `012`). Details: [docs/Datenbank.md](docs/Datenbank.md).

Unter **Authentication → URL Configuration** Redirect erlauben:

```text
http://localhost:3000/auth/callback
```

### 4. App starten

```bash
npm install
npm run dev
```

Öffnen: [http://localhost:3000](http://localhost:3000)

### 5. Qualitätssicherung

```bash
npm run lint
npm run build
```

## Dokumentation

| Dokument | Inhalt |
| --- | --- |
| [docs/Projektstruktur.md](docs/Projektstruktur.md) | Ordner und Verantwortung |
| [docs/Datenbank.md](docs/Datenbank.md) | Schema, Migrationen, Sicherheit |
| [docs/Stammbaum-Regeln.md](docs/Stammbaum-Regeln.md) | Fachliche Regeln im Baum |
| [docs/Roadmap.md](docs/Roadmap.md) | Geplante Schritte nach v1.0.0 |

## Hinweise

- `.env.local` und Secrets gehören **nicht** ins Git-Repository.
- `database/010_full_data_reset.sql` ist nur für **Entwicklung**. Niemals in
  Produktion mit echten Nutzerdaten ausführen.
- Unter Windows mit Norton SSL-Scanning ggf. `npm run certs:norton`, danach
  `npm run dev`.

## Lizenz

Privat / projekteigen — siehe Repository-Einstellungen auf GitHub.
