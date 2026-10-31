## MALBAT v1.4.1

YS-Tech-Zuordnung und Feinschliff.

### Neu
- Einstellungen: **Über uns** — MALBAT ist ein Produkt von YS-Tech
- Startseite: YS-Tech unten links; Kopfzeile als **MAL[Icon]BAT** mit Wachstums-Animation

### Hinweise
- Live: https://malbat.vercel.app

---

## MALBAT v1.4.0

Dunkles Design und Geburtstagsliste auf dem Dashboard.

### Neu
- Design **Hell** / **Dunkel** in den Einstellungen (persistent)
- Klick auf „Geburtstage diesen Monat“ zeigt die Personen mit Namen und Datum

### Verbessert
- Dunkler Modus: dunklere Flächen, Karten und Hintergrund-Overlay
- Geburtstags-Badge in derselben Farbe wie die Personen-Anzahl

### Hinweise
- Live: https://malbat.vercel.app
- Migration `database/019_profile_theme.sql` in Supabase ausführen

---

## MALBAT v1.3.0

Manuelles Anordnen, PNG-Export und Layout-Feinschliff.

### Neu
- Personenkarten manuell anordnen (Stift-Modus): Ast mit Partnern und Nachkommen verschieben, speichern oder verwerfen
- Auto-Layout mit Bestätigung zurücksetzen
- Positionen persistent (`family_layout_overrides`)
- Export als **Bild (.png)** über Dashboard → Exportieren (ohne den Stammbaum zu öffnen)
- Benachrichtigungen in den Einstellungen aktiv/inaktiv speichern (für späteren Versand)
- Sprachlabel **Kurdî (Kurmancî)**

### Verbessert
- Neue Partner/Kinder landen neben der echten (verschobenen) Personenposition
- Dashboard-Aktionsmenü liegt nicht mehr hinter anderen Karten
- Personenfotos in den Details vergrößern
- Multi-Ehe- und Halbgeschwister-Layout robuster

### Hinweise
- Live: https://malbat.vercel.app
- Migrationen `database/017_family_layout_overrides.sql` und `database/018_profile_notifications.sql` in Supabase ausführen

---

## MALBAT v1.2.0

Mehrsprachige Oberfläche und Kurmancî.

### Neu
- UI in **Deutsch**, **English**, **العربية** und **Kurmancî**
- Sprachwahl auf der Startseite und im Profilmenü
- Arabisch mit RTL-Layout (Stammbaum-Canvas bleibt LTR)

### Verbessert
- Dashboard-Dialoge (Bearbeiten, Einladen, Mitglieder, Löschen) übersetzt
- Profil: Tarif, Passwort ändern, Konto löschen übersetzt
- Auth-Seiten und Einladungsflow übersetzt
- Kurmancî-Wortlaut nach Feedback angepasst

### Hinweise
- Live: https://malbat.vercel.app

---

## MALBAT v1.0.0

Erste öffentliche Version des modernen Familienstammbaums.

### Funktionen
- Stammbaum anlegen, bearbeiten und mit Familie teilen (Rollen: Besitzer, Bearbeiter, Betrachter)
- Personen, Partner, Eltern, Kinder und Geschwister verknüpfen
- Suche mit Fokus auf die Person und Markierung ihres Asts (Vorfahren, Nachkommen, Partner)
- Export als GEDCOM, JSON und Excel
- Einladungslinks (auch für Bearbeiter)
- Passwort-Anzeige und klare Passwortregeln bei der Registrierung

### Darstellung
- Kompaktes Layout mit weniger leeren Sammelschienen
- Mehrere Partner einer Person: Verbindung zum Anker, nicht untereinander verkettet
- Geschwister ohne gemeinsame Eltern als Gruppe
- Geschwister-Sammelschiene und Sortierung nach Geburtsdatum
- Tieferes Herauszoomen bei großen Bäumen

### Hinweise
- Live: https://malbat.vercel.app
