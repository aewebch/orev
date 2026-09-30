# Orev – Events und Camps planen, durchführen und reflektieren

Orev ist ein Werkzeug für Leitungsteams, die Events (ein- oder mehrtägig) und Camps planen, durchführen und auswerten:
Konzept mit SMART-Zielen und Zielgruppe, Teams und Rollen mit fein abgestuften Rechten, Programm in Wochen-, Tages- und
Listenansicht, Ablaufpläne pro Programmpunkt, Aufgaben mit Vorbereitungsterminen, eine zusammengeführte Materialliste,
Reflexion mit Wirkungsmodell und Fünf-Finger-Feedback, ein automatisch geschriebener Auswertungsbericht, Freigabe-Links
zum Einladen, eine Einführungstour, Benachrichtigungen und ein persönliches Kalender-Abo.

## Stand

Alle acht Meilensteine aus dem Auftrag sind umgesetzt: [docs/auftrag.md](docs/auftrag.md).

## Installation

Orev braucht nur ein PHP-Hosting (PHP 7.2 oder neuer mit `openssl` und `mbstring`, für Updates per Klick zusätzlich
`zip`). **Keine Datenbank.**

1. Das aktuelle Release herunterladen und den Inhalt per FTP in einen Ordner laden, z. B. `orev/`.
2. Die Adresse im Browser öffnen. Der Einrichtungsassistent prüft die Voraussetzungen.
3. Den Einrichtungscode aus der Datei `orev-einrichtungscode.php` im Orev-Ordner eingeben (per FTP oder im Dateimanager
   öffnen). Über das Web ist die Datei leer; so kann niemand eine frisch hochgeladene Installation übernehmen.
4. Den Datenordner wählen – am besten **ausserhalb** des Web-Verzeichnisses – und das erste Admin-Konto anlegen.

## Sicherheit

- Alle Daten liegen **verschlüsselt** (AES-256-GCM) im Datenordner. Jede Datei ist zusätzlich an ihren Namen gebunden
  und lässt sich nicht unbemerkt austauschen oder verändern.
- Der Schlüssel liegt getrennt in `orev-konfiguration.php`. **Sicherung = Datenordner + `orev-konfiguration.php`.**
  Ohne diese Datei lassen sich die Daten nicht mehr entschlüsseln.
- Passwörter mit Argon2id (mindestens 12 Zeichen), Sitzungen und Einladungen nur als Hash gespeichert.
- Sitzungs-Cookie `HttpOnly`, `SameSite=Strict`, über HTTPS `Secure`; jede API-Anfrage braucht einen eigenen Header.
- Bremse gegen Passwort-Raten (10 Fehlversuche in 15 Minuten), strenge Content-Security-Policy und Sicherheits-Header.
- Unter Apache sperrt `.htaccess` alle internen Ordner. **Unter nginx** bitte `src/`, `migrationen/`, `tests/`, `docs/`,
  `werkzeuge/` und den Datenordner selbst sperren (`location ~ ^/(src|migrationen|tests|docs|werkzeuge|daten)/ { deny all; }`).
- Orev nur über HTTPS betreiben.

## Freigabe-Links

Die Event-Leitung erstellt im Setup-Schritt «Personen» Links mit Rollen, Teams und Ablaufdatum (Standard: unbegrenzt).
Wer einen Link öffnet, eröffnet ein Konto mit diesen Rechten, meldet sich mit einem bestehenden Konto an oder wird, wenn
bereits angemeldet, sofort verknüpft. Links lassen sich erneuern (der alte wird ungültig) und löschen. Eine bereits
erfasste E-Mail-Adresse wird über einen Link nie übernommen; dafür braucht es eine Einladung.

## Auswertungsbericht

In der Nachbereitung schreibt Orev aus Zielüberprüfung, Bewertungen, Wirkungsmodell, Teamkultur und Feedback einen
Fliesstext-Bericht: Titelblatt, Inhaltsverzeichnis mit Seitenzahlen, A4-Seiten mit Kopf- und Fusszeile, nummerierte
Quellenangaben und Quellenverzeichnis. Zentrale Aussagen folgen dem argumentativen Dreischritt (Behauptung, Begründung,
Beleg). Rückmeldungen erscheinen anonymisiert und nur für Personen mit Feedback-Recht. Drucken oder als PDF sichern
über den Browser.

## Kalender-Abo

Jede Person mit Konto erstellt unter «Mein Konto» einen geheimen Abo-Link für Apple-, Google- oder Outlook-Kalender.
Er enthält nur, was die Person betrifft und sehen darf: ihre Programmpunkte (direkt, über ein Team, in einem
Ablaufschritt oder als Leitung des Ablaufplans) und jeden Vorbereitungstermin ihrer Aufgaben. Auf Wunsch zeigt er das
ganze Programm. Der Link lässt sich jederzeit neu erzeugen; der alte wird dabei ungültig.

- Adresse `/ical/<token>.ics` über die Rewrite-Regel in `.htaccess`, sonst `ical.php/<token>.ics` (erkennt Orev selbst).
- Unter nginx für die kurze Adresse: `rewrite ^/ical/([A-Za-z0-9_-]+)\.ics$ /ical.php?t=$1 last;`

## Demo-Daten

`php werkzeuge/seed.php` legt auf einer eingerichteten Installation das Camp «BeachCamp 2026» und das Event «Weg zur
Konfirmation» mit dem Start-Tag an (erfundene Personen). Mit `--neu` auch dann, wenn es sie schon gibt.

## Rechte

- **Installations-Admin:** verwaltet die Installation und hat in jedem Event alle Rechte.
- **Events anlegen:** pro Konto freischaltbar (Einstellungen → Benutzer und Einladungen). Wer ein Event anlegt, wird
  dessen Event-Leitung.
- **Event-Leitung:** Vollzugriff im Event, vergibt und definiert Rollen. Mindestens eine Person bleibt Event-Leitung.
- **Rollen:** pro Bereich keine, lesen oder bearbeiten; für Programm, Ablaufpläne, Aufgaben und Material auch pro
  Programmpunkt. Bei mehreren Rollen gilt pro Bereich das höchste Recht.
- **Team-Leitung:** verwaltet das eigene Team und bearbeitet, was dem Team zugewiesen ist.

## Updates

In den Einstellungen unter «Version und Updates» prüft Orev, ob auf GitHub ein neueres Release vorliegt, und installiert
es per Klick. Updates kommen immer aus dem offiziellen Repository [aewebch/orev](https://github.com/aewebch/orev).
Datenordner und `orev-konfiguration.php` bleiben unberührt; nötige Datenanpassungen (Migrationen) laufen danach
automatisch.

## Datenschutz

Orev bringt eine Datenschutzerklärung mit (`/datenschutz`, ohne Anmeldung erreichbar), die beschreibt, was die Software
technisch tut. Verantwortlich ist, wer eine Installation betreibt: In den Einstellungen unter «Datenschutz» die
verantwortliche Stelle, eine Kontaktadresse und bei Bedarf ergänzende Angaben (z. B. Hosting und Serverstandort)
eintragen und den Text für die eigene Organisation prüfen.

## Entwicklung

- PHP (7.2-kompatibler Stil), Vue 3 (Options API) ohne Build-Schritt, alle Bibliotheken, Schriften und Icons lokal
- Design: aeweb Design System (`css/tokens`, `css/components`), Farben in `css/tokens/colors.css`
- Tests: `php tests/run.php`
- Lokal starten: `php -S 127.0.0.1:8080 -t .`

## Versionen

Die installierte Version steht in `VERSION`. Releases werden auf GitHub mit Tags ohne «v» veröffentlicht (z. B. `0.1.0`).

## Lizenz

MIT – siehe [LICENSE](LICENSE). Ein Projekt von [Orki](https://orki.ch).

Enthaltene Fremdkomponenten: Vue und Vue Router (MIT), Lucide-Icons (ISC), Schrift Manrope (SIL Open Font License 1.1),
aeweb Design System.
