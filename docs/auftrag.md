# Auftrag: Orev – Planung, Durchführung und Reflexion von Events und Camps

Du baust die Web-App **Orev** von Grund auf. Orev ist ein Werkzeug für Leitungsteams, die Events (ein- oder mehrtägig) und Camps planen, durchführen und auswerten. Lies zuerst diesen ganzen Auftrag, dann die Referenzen, und lege mir **vor dem Programmieren einen Plan zur Freigabe vor** (siehe Abschnitt «Vorgehen»).

## 1. Referenzen im Repository

Lege diese Dateien vor Beginn unter `docs/referenz/` ab bzw. lies sie dort:

| Referenz | Zweck |
| --- | --- |
| `../ormeet` (Pfad anpassen) bzw. ormeet.ch | **Vorlage** für Architektur, Login/Einladung, Einstellungsmenü, GitHub-Update-Prüfung, Projektstruktur. Übernimm Mechanismen von dort, statt sie neu zu erfinden. |
| `docs/referenz/aeweb_Design_System.zip` (entpackt nach `design-system/`) | Verbindliche Grundlage für das Design. Lies `readme.md`, `SKILL.md`, `tokens/*.css`, `components/aeweb.css` und die `*.prompt.md` der Komponenten. |
| `docs/referenz/Start-Tag_-_1-2_OS.docx` | Vorlage für die Datenstruktur eines **Ablaufplans** pro Programmpunkt. |
| `docs/referenz/BeachCamp-2026.xlsx` | Vorlage für den **Wochen-/Tages-/Stundenplan** eines Camps und für Aufgabenlisten. |

### Was die Beispieldateien zeigen (daraus ist das Datenmodell abzuleiten)

**Start-Tag (Word)** – ein Programmpunkt mit eigenem Ablaufplan:
- Kopf: Programmname, Datum, Leitung (mehrere Personen, mit Kürzeln wie «EbA»), Ziele (Freitext).
- Tabelle mit den Spalten **Zeit | Was | Methode/Sozialform | Anmerkung/Material | Wer**, gegliedert nach Tagesabschnitten.
- «Was» enthält teils lange Beschreibungen mit Unterpunkten.
- «Wer» enthält Kürzel, «Alle» oder Unsicheres wie «WiK? (sonst EbA)». Es braucht also ein Freitextfeld neben der Personenzuweisung.
- «Anmerkung/Material» ist im Word Freitext. In Orev werden daraus strukturierte Materialposten (siehe Abschnitt 5.6).

**BeachCamp (Excel)** – ein Camp über mehrere Tage:
- Raster: Tage als Spalten (FR, SA, SO, MO … über zwei Wochenenden), Uhrzeiten als Zeilen. Es gibt nur Startzeiten, keine Endzeiten.
- Über dem Raster steht das Camp-Thema («Petrus und seine Freundschaft mit Jesus») und pro Tag eine **Tagesverantwortung** (Zeile «TV»).
- Programmpunkte laufen teils parallel, teils wiederholen sie sich täglich (Tagwach, Zmorge, Znacht, Tagesabschlussritual), teils sind sie einmalig (Ausflug, Infoabend).
- Zusatzblätter: **ToDo-Listen** mit Zuständigen, ein **Elternabend** (Termin, Team-Treffpunkt, Ablauf mit Zuständigen), eine Regelliste («Was gilt») und eine (leere) Teilnehmerliste.

Diese Dateien dienen als Struktur-Vorbild und als Testdaten (siehe Abschnitt 9). Einen Excel- oder Word-Import baust du **nicht**.

## 2. Technische Rahmenbedingungen (strikt einhalten)

Übernimm zuerst alles, was ormeet bereits vorgibt. Zusätzlich gilt, bei Widerspruch geht diese Liste vor:

- **PHP im 7.2-kompatiblen Stil:** keine Arrow Functions, keine Type Hints.
- **Kommentare ausschliesslich als Blockkommentare `/* ... */`.** Niemals `//`, weder in PHP, JavaScript, CSS noch sonst wo. Kommentare nur, wo sie etwas erklären, das der Code nicht selbst sagt.
- **Vue 3, Options API, ohne Build-Step.** Einbindung per CDN wie in ormeet, Registrierung per `app.component()`, kein `import`/`export` in Komponenten.
- **MySQL/MariaDB** mit nummerierten Migrationsdateien.
- **Datenhoheit Schweiz:** Schriften und Icons lokal ausliefern, nichts von unpkg oder Google-Fonts nachladen. Die Update-Prüfung (Abschnitt 7) sendet keine Nutzerdaten.
- **Minimaler Code zuerst (KISS):** einfache, flache, lineare Logik. Keine Abstraktionen auf Vorrat, keine ungenutzten Hilfsfunktionen, keine spekulativen Fallbacks, kein Boilerplate ohne Anforderung. Selbsterklärende Namen, klarer Kontrollfluss.
- **Sprache der Oberfläche:** Schweizer Hochdeutsch (`ss` statt `ß`, Zahlen als `1'204`), Anrede **Sie** gemäss aeweb-Design-System, Buttons als kurze Verben («Speichern», «Schliessen»), keine Emojis, keine Ausrufezeichen.
- **Zeitzone:** `Europe/Zurich`. Zeiten werden als lokale Zeit gespeichert und ausgegeben.
- Rechte werden **serverseitig bei jedem Zugriff** geprüft. Die Oberfläche blendet nur zusätzlich aus, was nicht erlaubt ist.

## 3. Design

- Basis ist das aeweb Design System: Tokens, Radien, Schatten, Abstände, Typografie (Manrope), Hover-/Fokus-Regeln, Transition `all 0.35s ease`, Karten, Badges, Inputs, Modals, Tabs.
- Das Design System liegt als **React-JSX** vor. Orev nutzt aber Vue ohne Build-Step. Übernimm daher **die CSS-Dateien unverändert** (`tokens/*.css`, `components/aeweb.css`, Schriften) und **baue die Komponenten als Vue-Komponenten mit denselben Klassen und Werten nach**. Kein React einbinden.
- Icons: Das Design System nennt Lucide via unpkg. Binde die benötigten Lucide-Icons als lokale SVG-Dateien ein.
- Farbtokens sind projektspezifisch und werden zentral in `tokens/colors.css` gesetzt. Starte mit den aeweb-Werten (Primär `#4DA19F`, Sekundär `#00427C`).
- Das Design System definiert **kein Layout**. Navigation und Seitenstruktur entscheidest du, orientiert an ormeet.
- Die App muss auf dem Smartphone gut bedienbar sein (Leitende schauen unterwegs in den Plan).

## 4. Domänenmodell (Überblick)

Leite daraus ein sauberes Schema mit Migrationen ab. Die Namen sind Vorschläge.

- **Person** (globales Personenverzeichnis): Vorname, Name, **Kürzel** (z.B. «EbA»), E-Mail. Eine Person kann ohne Login existieren (nur zugewiesen) und später eingeladen werden.
- **Benutzerkonto** und **Installations-Admin**: Login/Einladung wie in ormeet.
- **Event:** Titel, Thema/Motto, Ort, Start- und Enddatum (ein- oder mehrtägig), Beschreibung, Typ (Event oder Camp, nur Beschriftung).
- **Eventtag:** wird automatisch pro Tag im Zeitraum angelegt. Felder: Tagesthema (optional), **Tagesverantwortliche/r** (Person).
- **Team:** gehört zu einem Event. Person↔Team (mehrere Teams pro Person möglich) mit Flag «Team-Leitung».
- **Eventmitglied:** Person↔Event, mit beliebig vielen **Rollen**. Person darf auch in keinem Team sein.
- **Rolle:** gehört zu einem Event, Name plus Rechteliste (Abschnitt 6). Es gibt globale **Rollenvorlagen** (Einstellungen), die beim Anlegen eines Events kopiert werden.
- **Programmpunkt:** Titel, Beschreibung, Start (Datum+Uhrzeit), Ende, Ort, Zuständige (Personen und/oder Teams, mehrere), Phase (`vorbereitung`, `durchfuehrung`; Standard `durchfuehrung`; z.B. ein Elternabend liegt vor dem Event). Punkte dürfen sich zeitlich überschneiden (Kleingruppen, Parallelprogramm). Wiederkehrende Punkte (Zmorge jeden Tag) müssen sich schnell für mehrere Tage anlegen lassen (Kopieren auf weitere Tage genügt, keine RRULE-Engine).
- **Ablaufplan:** gehört genau zu einem Programmpunkt. Kopfdaten wie im Start-Tag-Dokument (Leitung, Ziele) und eine geordnete Liste von **Ablaufschritten**.
- **Ablaufschritt:** Uhrzeit, Titel («Was»), Beschreibung, Methode/Sozialform, Anmerkung, **Wer** (Personen/Teams/«Alle») plus Freitext-Zusatz («WiK? sonst EbA»).
- **Aufgabe:** hängt an genau einem von: Event, Programmpunkt oder Ablaufschritt. Felder: Titel, Beschreibung, Zuständige (Personen/Teams), Status (offen/erledigt), optional Fälligkeit, **0..n Vorbereitungstermine**, Materialposten. (Beispiele aus dem Excel: «Kleingruppenheft», «Worship», «Inputs 15'».)
- **Vorbereitungstermin:** gehört zu einer Aufgabe. Felder: Start, Ende, Ort, Notiz. Eine Aufgabe kann mehrere haben.
- **Materialposten:** hängt an Programmpunkt, Ablaufschritt oder Aufgabe. Felder: Name, Menge (Standard 1), Einheit (optional), **Halter** (Person, optional) oder Freitext-Notiz, wenn keine Person zugewiesen werden kann.
- **Konzept:** pro Event mehrere **Ziele** (Abschnitt 5.3) und eine **Zielgruppe**.
- **Reflexion:** pro Ziel die Überprüfung, pro Event die Teamkultur-Auswertung, plus **persönliche Feedbacks** (Abschnitt 5.8).

## 5. Funktionen

### 5.1 Dashboard (Startseite nach Login)
- Zeigt alle Events, an denen die angemeldete Person beteiligt ist (Eventmitglied), mit Zeitraum, eigenen Rollen und Teams.
- **Zwei Tabs: «Kommende» (Standard) und «Vergangene».** Ein Event ist «vergangen», wenn sein Enddatum vor heute liegt. Kommende aufsteigend nach Start, Vergangene absteigend.
- Klick öffnet das Event. Neues Event anlegen darf, wer laut Einstellung dazu berechtigt ist (Standard: Installations-Admins).

### 5.2 Event-Bereich
Das Event hat drei klar getrennte Phasen in der Navigation, wie in einem Marketingkonzept:
1. **Konzept und Vorbereitung:** Ziele, Zielgruppe, Team und Personen, Aufgaben, Material.
2. **Durchführung:** Programm mit Ablaufplänen.
3. **Nachbereitung:** Reflexion.

### 5.3 Konzept
- **Ziele nach SMART:** mehrere Ziele pro Event. Je Ziel: Formulierung (spezifisch), **Messkriterium** (messbar), Zieltermin bzw. Zeitbezug, optional Notizen zu Erreichbarkeit und Relevanz. Die Ziele sind später in der Reflexion die Grundlage der Überprüfung.
- **Zielgruppe:** Beschreibung, Altersspanne, erwartete Anzahl, Besonderheiten/Bedürfnisse.

### 5.4 Personen, Teams, Rollen
- Personen zum Event hinzufügen (aus dem Verzeichnis oder neu erfassen), optional per E-Mail einladen.
- Teams anlegen, Personen zuordnen (mehrere Teams pro Person, oder ganz ohne Team).
- Pro Person mehrere Rollen vergeben (Abschnitt 6).

### 5.5 Programm
Drei Ansichten desselben Datenbestands:
- **Wochenansicht:** Tage als Spalten, Uhrzeiten als Zeilen, ähnlich dem BeachCamp-Excel. Kopfzeile mit Tagesthema und Tagesverantwortung.
- **Tagesansicht bzw. Stundenplan:** Zeitraster für einen Tag, parallele Punkte nebeneinander.
- **Liste:** chronologisch, filterbar nach Team und Person («Mein Programm»).

Jeder Programmpunkt lässt sich Teams und/oder Personen zuweisen. Vom Programmpunkt aus gelangt man in seinen Ablaufplan (Zeit | Was | Methode/Sozialform | Anmerkung/Material | Wer), wo Ablaufschritte, Aufgaben und Materialposten erfasst werden.

### 5.6 Material
- Materialposten werden dort erfasst, wo sie entstehen (Programmpunkt, Ablaufschritt, Aufgabe). Beim Tippen des Namens schlägt die App bereits vorhandene Materialnamen des Events vor, damit Duplikate gar nicht erst entstehen.
- **Gesamtliste pro Event:** Posten werden zusammengeführt, wenn **Name und Einheit** übereinstimmen. Der Vergleich ignoriert Gross-/Kleinschreibung und überflüssige Leerzeichen. Die Mengen werden **summiert** (zweimal «Flipchart» ergibt eine Zeile mit Menge 2, nicht zwei Zeilen).
- Jede Zeile der Gesamtliste zeigt: Name, Gesamtmenge, Einheit, **wer es mitnimmt** (bei mehreren Haltern aufgeschlüsselt, z.B. «Anna: 2, Ben: 1, ohne Zuordnung: 1»), gesammelte Notizen sowie **woher der Bedarf stammt** (Programmpunkte/Schritte/Aufgaben, jeweils verlinkt).
- Die Gesamtliste ist filterbar (nach Halter, «ohne Halter», Programmpunkt) und druckfreundlich.
- Die Aggregation wird bei jeder Abfrage berechnet, nicht separat gespeichert.

### 5.7 Aufgaben und Vorbereitungstermine
- Aufgaben lassen sich an Event, Programmpunkt oder Ablaufschritt hängen und Personen/Teams zuweisen.
- Pro Aufgabe beliebig viele Vorbereitungstermine.
- Ansicht «Meine Aufgaben» je Event und ein Überblick über alle offenen Aufgaben (Leitung).

### 5.8 Nachbereitung (Reflexion)
- **Zielüberprüfung:** Für jedes SMART-Ziel wird festgehalten, *wie* geprüft wird (vorab planbar, Vorbelegung aus dem Messkriterium), das *Ergebnis*, der *Erreichungsgrad* (erreicht / teilweise / nicht erreicht) und ein Kommentar.
- **Teamkultur:** Freitext-Auswertung des Miteinanders im Team.
- **Persönliche Feedbacks:** Personen können Feedback zum Event schreiben (und optional an einzelne Teammitglieder). Diese Einträge sind vertraulich. Standardmässig sieht sie nur die verfassende Person und die Event-Leitung, weitere Sichtbarkeit nur über ein ausdrückliches Recht (Abschnitt 6).

### 5.9 iCal-Abonnement
Jede Person bekommt einen persönlichen, geheimen Abo-Link, den sie im eigenen Kalender abonniert.

- **URL:** `/ical/<token>.ics`. Der Token ist lang und zufällig und **per Klick neu generierbar** (der alte Link wird ungültig). Optionaler Filter `?event=<id>`. In der Oberfläche: Link anzeigen, kopieren, als `webcal://` anbieten. Der Zugriff braucht keinen Login.
- **Inhalt: nur, was die Person betrifft**, und nur, was sie laut Rechten sehen darf:
  - **Programmpunkte**, bei denen die Person direkt zugewiesen ist, ein von ihr besuchtes **Team** zugewiesen ist oder sie bei mindestens einem Ablaufschritt (direkt oder via Team) eingetragen ist. In der Beschreibung stehen Ort und ihre eigenen Ablaufschritte, Aufgaben und mitzunehmendes Material.
  - **Jeder einzelne Vorbereitungstermin** jeder Aufgabe, für die die Person direkt oder via Team zuständig ist, als **eigener Kalendereintrag** mit Aufgabentitel, Event und Notiz.
  - Optional (Einstellung in den iCal-Einstellungen, Standard aus): das gesamte Programm des Events.
- **Technik:** Einträge als `VEVENT` mit **stabiler `UID`** (z.B. `pgm-<id>@<domain>`, `prep-<id>@<domain>`), `DTSTAMP`, `LAST-MODIFIED`, `SEQUENCE`, Zeitzone `Europe/Zurich` (mit `VTIMEZONE`), Zeilenfaltung nach 75 Bytes und korrektes Escaping nach RFC 5545. Kalendername «Orev – <Person>». `REFRESH-INTERVAL`/`X-PUBLISHED-TTL` auf eine Stunde. `ETag`/`If-None-Match` unterstützen, damit Kalender-Clients den Server nicht unnötig belasten. Gelöschte Einträge verschwinden einfach aus dem Feed.
- Schreibe die ICS-Erzeugung selbst (klein und gezielt), keine schwere Bibliothek, sofern ormeet nicht bereits eine nutzt.

## 6. Rollen und Rechte

### Berechtigungsstufen
Pro Bereich gibt es drei Stufen: **keine** < **lesen** < **bearbeiten**. «Bearbeiten» schliesst Anlegen und Löschen im jeweiligen Bereich ein.

### Bereiche
Event-Stammdaten · Konzept (Ziele, Zielgruppe) · Personen, Teams und Rollen · Programm · Ablaufpläne · Aufgaben · Material · Reflexion · Feedback.

Für **Programm, Ablaufpläne, Aufgaben und Material** lässt sich ein Recht **entweder für das ganze Event oder nur für einzelne Programmpunkte** setzen (Beispiel: Rolle A darf Programmpunkt X nur lesen, Rolle B darf X bearbeiten).

### Maximalprinzip
Eine Person kann **beliebig viele Rollen** haben. Für jeden Bereich (und jeden Programmpunkt) gilt das **höchste** Recht aus allen ihren Rollen. Hat Rolle A bei Programmpunkt X «lesen» und Rolle B «bearbeiten», darf die Person X bearbeiten. Rechte werden nie entzogen, nur addiert. Ein spezifisches Recht (Programmpunkt X) und ein allgemeines (ganzes Event) werden ebenfalls per Maximum kombiniert.

### Feste Rollen
- **Event-Leitung:** Vollzugriff auf alles im Event, inklusive Rollen, Personen und Einstellungen. Mindestens eine Person muss Event-Leitung bleiben.
- **Team-Leitung:** entsteht durch das Flag «Team-Leitung» an der Team-Zugehörigkeit (pro Team, nicht global). Sie verwaltet **dieses Team** (Mitglieder, Team-Einstellungen, Freigaben für dieses Team) und darf alles bearbeiten, was diesem Team zugewiesen ist.
- **Installations-Admin:** verwaltet Einstellungen und Benutzer der Installation und darf Events anlegen.

### Frei definierbare Rollen
Pro Event legen Event-Leitungen eigene Rollen an und definieren pro Bereich (und ggf. pro Programmpunkt) die Stufe. Rollenvorlagen aus den Einstellungen dienen als Startpunkt. Beispiele: «Mitarbeitende» (Programm lesen, eigene Aufgaben bearbeiten), «Küche» (Material lesen und bearbeiten), «Praktikant» (nur lesen).

### Vertraulichkeit Feedback
Feedback-Einträge gehören der verfassenden Person. Sie sieht und ändert ihre eigenen Einträge immer. Alle anderen benötigen dafür ein ausdrückliches Recht im Bereich «Feedback». Die Event-Leitung hat es immer.

### Umsetzung
Eine zentrale Funktion `effektives Recht(Person, Event, Bereich, Programmpunkt)` liefert die Stufe. Alle Controller und der iCal-Feed nutzen ausschliesslich diese Funktion. Schreibe dafür Tests (Abschnitt 9).

## 7. Einstellungen und Updates

- **Einstellungsmenü** (nur Installations-Admin, Aufbau wie in ormeet): Allgemein (Name der Installation, Zeitzone), Benutzer und Einladungen, Rollenvorlagen, E-Mail-Versand, iCal (Standard für «gesamtes Programm»), Eventerstellung (wer darf), **Version und Updates**.
- **GitHub-Updateprüfung:** Die App kennt ihre installierte Version (Datei `VERSION`, Semver). Serverseitig fragt sie die neueste Release über die GitHub-API ab (Repository als Einstellung, Platzhalter `<github-user>/orev`), vergleicht die Versionen und cached das Ergebnis mehrere Stunden. Bei einer neueren Version erscheint in den Einstellungen und für Admins ein dezenter Hinweis mit Release-Notizen und Link. **Übernimm den Mechanismus (inklusive einer allfälligen Update-Auslösung) so, wie ormeet ihn bereits löst.** Es werden keine Nutzerdaten übermittelt, und ein Fehler bei der Abfrage darf die App nie beeinträchtigen.

## 8. Nicht bauen (ausserhalb des Umfangs)

Teilnehmerverwaltung/Anmeldungen, Budget und Finanzen, Chat, Push-Benachrichtigungen, Excel-/Word-Import oder -Export, Mehrsprachigkeit, eine Mandantenfähigkeit, die ormeet nicht ohnehin mitbringt.

## 9. Vorgehen, Meilensteine, Abnahme

**Zuerst, ohne Code zu schreiben:**
1. Analysiere ormeet, das Design System und die beiden Beispieldateien.
2. Lege mir einen **Plan** vor: Projektstruktur, Datenbankschema, Rechte-Matrix, Seiten/Navigation, Meilensteine. Nenne offene Fragen und Annahmen ausdrücklich. Warte auf meine Freigabe.

**Danach in dieser Reihenfolge, je Meilenstein lauffähig und getestet:**
1. Grundgerüst aus ormeet (Login, Einladung, Einstellungen, Version/Update-Prüfung), aeweb-Design eingebunden.
2. Personenverzeichnis, Events, Eventtage, Teams, Eventmitglieder, Rollen und die zentrale Rechteauflösung samt Tests.
3. Dashboard mit Tabs «Kommende»/«Vergangene».
4. Programmpunkte mit Wochen-, Tages- und Listenansicht.
5. Ablaufpläne mit Ablaufschritten und Zuweisungen.
6. Aufgaben, Vorbereitungstermine und Materialposten inklusive Gesamtliste.
7. Konzept (SMART-Ziele, Zielgruppe) und Reflexion (Zielüberprüfung, Teamkultur, Feedback).
8. iCal-Feed und Abo-Oberfläche.

**Tests** (einfache Testskripte oder PHPUnit, wie in ormeet üblich) sind Pflicht für:
- die Rechteauflösung inklusive Maximalprinzip und Programmpunkt-Ebene,
- die Materialaggregation (Zusammenführung, Summierung, Halter-Aufschlüsselung),
- die iCal-Erzeugung (Relevanzregeln, Vorbereitungstermine einzeln, Escaping, Zeilenfaltung, stabile UIDs).

**Demo-Daten:** Erstelle ein Seed-Skript, das aus den Beispieldateien ein Camp «BeachCamp 2026» (Wochenraster, Tagesverantwortung, ToDos, Elternabend) und einen Programmpunkt «Start-Tag zum Weg zur Konfirmation» mit vollständigem Ablaufplan anlegt. Es dient als Abnahmetest für das Datenmodell.

**Abnahme, Beispiele, die funktionieren müssen:**
- Eine Person mit zwei Rollen (A: lesen, B: bearbeiten auf Programmpunkt X) kann X bearbeiten, alle anderen Punkte nur lesen.
- Zwei Materialposten «Flipchart» in verschiedenen Ablaufschritten erscheinen in der Gesamtliste als eine Zeile mit Menge 2.
- Eine Aufgabe mit drei Vorbereitungsterminen erscheint im iCal der zuständigen Person als drei einzelne Einträge und im iCal einer unbeteiligten Person gar nicht.
- Ein Event mit Enddatum gestern erscheint im Dashboard nur im Tab «Vergangene».

**Arbeitsregeln:** Bleib bei kleinen, überprüfbaren Schritten. Halte dich strikt an Abschnitt 2 (insbesondere: nie `//`-Kommentare). Wenn eine Anforderung unklar ist oder ormeet etwas anders löst, als hier beschrieben, frage nach, statt zu raten.
