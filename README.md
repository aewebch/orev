# Orev – Events und Camps planen, durchführen und reflektieren

Orev ist ein Werkzeug für Leitungsteams, die Events (ein- oder mehrtägig) und Camps planen, durchführen und auswerten:
Konzept mit SMART-Zielen und Zielgruppe, Teams und Rollen mit fein abgestuften Rechten, Programm in Wochen-, Tages- und
Listenansicht, Ablaufpläne pro Programmpunkt, Aufgaben mit Vorbereitungsterminen, eine zusammengeführte Materialliste,
Reflexion und ein persönliches Kalender-Abo.

## Stand

In Entwicklung. Auftrag und Meilensteine: [docs/auftrag.md](docs/auftrag.md).

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
- Unter Apache sperrt `.htaccess` alle internen Ordner. **Unter nginx** bitte `src/`, `migrationen/`, `tests/`, `docs/`
  und den Datenordner selbst sperren (`location ~ ^/(src|migrationen|tests|docs|daten)/ { deny all; }`).
- Orev nur über HTTPS betreiben.

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
es per Klick. Datenordner und `orev-konfiguration.php` bleiben unberührt; nötige Datenanpassungen (Migrationen) laufen
danach automatisch. Bei einem privaten Repository braucht es einen GitHub-Token mit reinem Lesezugriff.

## Entwicklung

- PHP (7.2-kompatibler Stil), Vue 3 (Options API) ohne Build-Schritt, alle Bibliotheken, Schriften und Icons lokal
- Design: aeweb Design System (`css/tokens`, `css/components`), Farben in `css/tokens/colors.css`
- Tests: `php tests/run.php`
- Lokal starten: `php -S 127.0.0.1:8080 -t .`

## Versionen

Die installierte Version steht in `VERSION`. Releases werden auf GitHub mit Tags ohne «v» veröffentlicht (z. B. `0.1.0`).
