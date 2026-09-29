# Orev – Events und Camps planen, durchführen und reflektieren

Orev ist ein Werkzeug für Leitungsteams, die Events (ein- oder mehrtägig) und Camps planen, durchführen und auswerten:
Konzept mit SMART-Zielen und Zielgruppe, Teams und Rollen mit fein abgestuften Rechten, Programm in Wochen-, Tages- und
Listenansicht, Ablaufpläne pro Programmpunkt, Aufgaben mit Vorbereitungsterminen, eine zusammengeführte Materialliste,
Reflexion und ein persönliches Kalender-Abo.

## Stand

In Entwicklung. Auftrag und Meilensteine: [docs/auftrag.md](docs/auftrag.md).

## Technik

- PHP (7.2-kompatibler Stil), MySQL/MariaDB mit nummerierten Migrationen
- Vue 3 (Options API) ohne Build-Schritt, alle Bibliotheken, Schriften und Icons lokal
- Design: aeweb Design System

## Versionen

Die installierte Version steht in `VERSION`. Releases werden auf GitHub mit Tags ohne «v» veröffentlicht (z. B. `0.1.0`),
darauf stützt sich die Update-Prüfung in den Einstellungen.
