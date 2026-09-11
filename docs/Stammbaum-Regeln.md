# Stammbaum-Regeln

Fachliche Regeln für die Darstellung und Bearbeitung in MALBAT v1.0.0.

## Grundlagen

- Jede Familie (`families`) entspricht einem Stammbaum.
- Die erste Person wird manuell angelegt (leerer Baum).
- Weitere Personen entstehen über Beziehungen (Eltern, Partner, Geschwister, Kind).
- Es gibt keinen allgemeinen „Person hinzufügen“-Button außerhalb dieser Flüsse.

## Beziehungen

Unterstützte Beziehungstypen (kanonisch u. a.):

- Vater / Mutter (Eltern)
- Partner
- Geschwister
- Kind (über Elternknoten)

Personen ohne jede Verbindung sind im laufenden Betrieb nicht vorgesehen
(außer der allerersten Person im leeren Baum).

## Bearbeitung

- Nur `owner` und `editor` dürfen Personen und Beziehungen ändern.
- `owner` und `editor` dürfen Einladungslinks erstellen und exportieren.
- Mitglieder verwalten und Stammbaum löschen: nur `owner`.
- `viewer` darf den Baum nur betrachten (Export ist erlaubt).
- Gesperrte Bäume (`plan_locked`) sind durch den Free-Tarif blockiert und
  können nach Premium-Upgrade wieder geöffnet werden.

## Darstellung

- Der Stammbaum ist die Hauptansicht einer Familie.
- Verbindungen werden orthogonal geroutet; Kreuzungen erhalten einen
  Halbkreis-Überlauf zur besseren Lesbarkeit.
