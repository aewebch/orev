<?php
/* Demo-Daten und Abnahmetest für das Datenmodell: legt aus den Beispieldateien ein Camp «BeachCamp 2026»
   (Wochenraster, Tagesverantwortung, ToDos, Elternabend) und ein Event «Weg zur Konfirmation» mit dem Programmpunkt
   «Start-Tag zum Weg zur Konfirmation» samt vollständigem Ablaufplan an. Alle Personen sind erfunden.
   Aufruf auf einer eingerichteten Installation: php werkzeuge/seed.php [--neu]
   Ohne --neu bricht das Skript ab, wenn es die Events schon gibt. */

if (PHP_SAPI !== 'cli') exit;

$wurzel = dirname(__DIR__);
foreach (array('kern', 'konfiguration', 'speicher', 'sicherheit', 'personen', 'einstellungen', 'rechte', 'events', 'programm', 'aufgaben', 'konzept', 'migrationen') as $datei) {
  require $wurzel . '/src/' . $datei . '.php';
}
if (!istEingerichtet()) {
  fwrite(STDERR, "Orev ist noch nicht eingerichtet. Bitte zuerst den Einrichtungsassistenten abschliessen.\n");
  exit(1);
}
migrationenAusfuehren();
$neu = in_array('--neu', $argv, true);

foreach (speicherListe('events') as $name) {
  $vorhanden = speicherLesen($name, null);
  if (!$neu && $vorhanden && in_array($vorhanden['titel'], array('BeachCamp 2026', 'Weg zur Konfirmation'), true)) {
    fwrite(STDERR, "Die Demo-Events gibt es bereits. Mit --neu werden sie zusätzlich angelegt.\n");
    exit(1);
  }
}

/* Erster Installations-Admin: legt die Events an und leitet sie mit */
$admin = null;
foreach (personenLesen() as $p) {
  if ($admin === null && $p['konto'] !== null && $p['konto']['ist_admin']) $admin = $p;
}
if ($admin === null) {
  fwrite(STDERR, "Kein Installations-Admin gefunden.\n");
  exit(1);
}

/* Erfundene Personen (Kürzel wie im Word-Dokument: Nachname, Vorname) */
$leute = array(
  'hannes' => array('Hannes', 'Keller', 'KeH'),
  'andrin' => array('Andrin', 'Brunner', 'BrA'),
  'dario' => array('Dario', 'Frei', 'FrD'),
  'jana' => array('Jana', 'Meier', 'MeJ'),
  'fabienne' => array('Fabienne', 'Graf', 'GrF'),
  'walter' => array('Walter', 'Imhof', 'ImW'),
);
$id = array();
personenAendern(function (&$personen) use ($leute, &$id) {
  foreach ($leute as $schluessel => $l) {
    foreach ($personen as $p) {
      if ($p['vorname'] === $l[0] && $p['name'] === $l[1]) $id[$schluessel] = $p['id'];
    }
    if (isset($id[$schluessel])) continue;
    $person = neuePerson($l[0], $l[1], $l[2], '');
    $personen[] = $person;
    $id[$schluessel] = $person['id'];
  }
});

function seedMitglieder(&$event, $personenIds, $rolleName) {
  $rolle = null;
  foreach ($event['rollen'] as $r) {
    if ($r['name'] === $rolleName) $rolle = $r['id'];
  }
  foreach ($personenIds as $personId) {
    if (mitgliedVon($event, $personId) !== null) continue;
    $event['mitglieder'][] = array('person_id' => $personId, 'rollen' => $rolle ? array($rolle) : array(), 'farbe' => '');
  }
}

function seedPunkt($titel, $start, $minuten, $angaben = array()) {
  $ende = $minuten > 0 ? (new DateTime($start))->modify('+' . $minuten . ' minutes')->format('Y-m-d\TH:i') : '';
  return array_merge(array(
    'id' => uuid(), 'titel' => $titel, 'beschreibung' => '', 'start' => $start, 'ende' => $ende, 'ort' => '',
    'phase' => 'durchfuehrung', 'farbe' => '', 'personen' => array(), 'teams' => array(), 'ablauf' => ablaufLeer(),
    'erstellt_am' => jetzt(), 'geaendert_am' => jetzt(), 'sequenz' => 0,
  ), $angaben);
}

function seedSchritt($zeit, $abschnitt, $titel, $angaben = array()) {
  $wer = array('personen' => array(), 'teams' => array(), 'alle' => false, 'zusatz' => '');
  if (isset($angaben['wer'])) $wer = array_merge($wer, $angaben['wer']);
  unset($angaben['wer']);
  return array_merge(array('id' => uuid(), 'zeit' => $zeit, 'abschnitt' => $abschnitt, 'titel' => $titel, 'beschreibung' => '', 'methode' => '', 'anmerkung' => ''), $angaben, array('wer' => $wer));
}

function seedMaterial($name, $menge, $ziel, $halter = '', $einheit = '', $notiz = '') {
  return array('id' => uuid(), 'name' => $name, 'menge' => $menge, 'einheit' => $einheit, 'halter' => $halter, 'notiz' => $notiz, 'ziel' => $ziel, 'erstellt_am' => jetzt());
}

function seedAufgabe($titel, $personen, $termine = array(), $ziel = null) {
  $liste = array();
  foreach ($termine as $t) {
    $liste[] = array('id' => uuid(), 'start' => $t[0], 'ende' => $t[1], 'ort' => $t[2], 'notiz' => $t[3], 'sequenz' => 0, 'geaendert_am' => jetzt());
  }
  return array(
    'id' => uuid(), 'titel' => $titel, 'beschreibung' => '',
    'ziel' => $ziel ? $ziel : array('art' => 'event', 'punkt_id' => null, 'schritt_id' => null, 'aufgabe_id' => null),
    'personen' => $personen, 'teams' => array(), 'status' => 'offen', 'faellig' => '', 'termine' => $liste,
    'erstellt_am' => jetzt(), 'geaendert_am' => jetzt(), 'sequenz' => 0,
  );
}

$vorlagen = einstellungenLesen()['rollenvorlagen'];

/* ---------- BeachCamp 2026: zehn Tage über zwei Wochenenden ---------- */
$camp = neuesEvent(array(
  'typ' => 'camp', 'titel' => 'BeachCamp 2026', 'thema' => 'Petrus und seine Freundschaft mit Jesus', 'ort' => 'Toskana',
  'start_datum' => '2026-10-02', 'end_datum' => '2026-10-11', 'beschreibung' => 'Sanität: Hannes und Jana. Ablauf Plenum: Begrüssung, Worship, Storytime, Input.',
), $admin['id'], $vorlagen);
$camp['agenda'] = array('von' => 7, 'bis' => 24);
seedMitglieder($camp, array($id['hannes'], $id['andrin']), 'Event-Leitung');
seedMitglieder($camp, array($id['dario'], $id['jana'], $id['fabienne']), 'Mitarbeitende');
$camp['teams'] = array(
  array('id' => uuid(), 'name' => 'Sanität', 'farbe' => 'rot', 'mitglieder' => array(array('person_id' => $id['hannes'], 'ist_leitung' => true), array('person_id' => $id['jana'], 'ist_leitung' => false))),
  array('id' => uuid(), 'name' => 'Musik', 'farbe' => 'violett', 'mitglieder' => array(array('person_id' => $id['dario'], 'ist_leitung' => true))),
);
foreach ($camp['mitglieder'] as $i => $m) {
  $farben = array($id['hannes'] => 'blau', $id['andrin'] => 'gruen', $id['dario'] => 'violett', $id['jana'] => 'orange', $id['fabienne'] => 'tuerkis');
  if (isset($farben[$m['person_id']])) $camp['mitglieder'][$i]['farbe'] = $farben[$m['person_id']];
}

$tage = array('2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11');
$tv = array(array('hannes', 'andrin'), array('andrin'), array('dario'), array('jana'), array('fabienne'), array('andrin'), array('hannes'), array('hannes'), array('andrin', 'hannes'), array('hannes', 'andrin'));
$themen = array('Anreise', 'Ankommen', 'Berufung', 'Erste Schiffsfahrt', 'Speisung der 5000', 'Über dem Wasser', 'Kreuzigung', 'Auferstehung', 'So ging es weiter', 'Heimreise');
foreach ($camp['tage'] as $i => $tag) {
  $camp['tage'][$i]['thema'] = $themen[$i];
  $camp['tage'][$i]['verantwortliche'] = array_map(function ($k) use ($id) { return $id[$k]; }, $tv[$i]);
}

$punkte = array();
$normal = array(2, 3, 4, 6, 7, 8);
$plenum = array(2 => array('Plenum: Berufung', 'fabienne'), 3 => array('Plenum: Erste Schiffsfahrt', 'hannes'), 4 => array('Plenum: Speisung der 5000', 'andrin'),
  6 => array('Plenum: Kreuzigung', 'andrin'), 7 => array('Plenum: Auferstehung', 'fabienne'), 8 => array('Plenum: So ging es weiter', 'hannes'));
foreach ($normal as $t) {
  $d = $tage[$t];
  $punkte[] = seedPunkt('Tagwach', $d . 'T08:00', 30, array('farbe' => 'grau'));
  $punkte[] = seedPunkt('Zmorge', $d . 'T08:30', 45, array('farbe' => 'gelb'));
  $punkte[] = seedPunkt('Storytime', $d . 'T10:00', 15, array('personen' => array($id['jana'])));
  $punkte[] = seedPunkt($plenum[$t][0], $d . 'T10:15', 15, array('personen' => array($id[$plenum[$t][1]])));
  $punkte[] = seedPunkt('Kleingruppe', $d . 'T10:30', 30);
  $punkte[] = seedPunkt('Freizeit', $d . 'T11:00', 60, array('farbe' => 'grau'));
  $punkte[] = seedPunkt('Leitertreff', $d . 'T12:00', 30, array('personen' => array($id['hannes'], $id['andrin'])));
}
foreach (array(2, 3, 4, 6) as $t) {
  $punkte[] = seedPunkt('Zvieri', $tage[$t] . 'T16:00', 30, array('farbe' => 'gelb'));
  $punkte[] = seedPunkt('Kreativblock', $tage[$t] . 'T16:30', 90);
}
foreach (array(1, 2, 3, 4, 5, 6, 7) as $t) {
  $punkte[] = seedPunkt('Znacht', $tage[$t] . 'T19:00', 60, array('farbe' => 'gelb'));
  $punkte[] = seedPunkt('Tagesabschlussritual', $tage[$t] . 'T21:30', 30);
  $punkte[] = seedPunkt('Nachtruhe', $tage[$t] . 'T22:00', 0, array('farbe' => 'grau'));
}
foreach (array(1, 2, 3, 4, 6, 7) as $t) {
  $punkte[] = seedPunkt('Plenum', $tage[$t] . 'T20:30', 15);
  $punkte[] = seedPunkt('Abendprogramm', $tage[$t] . 'T20:45', 15);
}
$abend = array(1 => 'Kennenlernspiele', 2 => 'Dunkelfangis oder Mocktails', 3 => 'Spaziergang am Strand', 4 => 'Filmabend', 6 => 'Kleingruppe-Games', 7 => 'Kleingruppe-Games');
foreach ($abend as $t => $titel) $punkte[] = seedPunkt($titel, $tage[$t] . 'T21:00', 30);
$punkte[] = seedPunkt('Anreise', $tage[0] . 'T19:30', 0, array('farbe' => 'blau'));
$punkte[] = seedPunkt('Anreise Teilnehmende', $tage[1] . 'T08:00', 0, array('ort' => 'Bahnhof', 'farbe' => 'blau'));
$punkte[] = seedPunkt('Zmorge', $tage[1] . 'T10:00', 30, array('farbe' => 'gelb'));
$punkte[] = seedPunkt('Foto-OL', $tage[1] . 'T10:30', 60);
$punkte[] = seedPunkt('Stern-OL (bei viel Energie)', $tage[1] . 'T11:30', 30);
$punkte[] = seedPunkt('Foto für Foto (bei normaler Energie)', $tage[1] . 'T12:00', 60);
$punkte[] = seedPunkt('Zimmerbezug', $tage[1] . 'T16:00', 60);
foreach (array(2 => 'StrandDay', 3 => 'Mister X', 4 => 'SportsDay', 6 => 'Gruppenspiele (Schiffli versenke XXL, Bibelschmuggel)') as $t => $titel) {
  $punkte[] = seedPunkt('Tagesprogramm nach TV', $tage[$t] . 'T12:30', 30);
  $punkte[] = seedPunkt($titel, $tage[$t] . 'T13:00', 180, array('farbe' => 'tuerkis'));
}
$punkte[] = seedPunkt('Nöd so Deep', $tage[4] . 'T13:30', 60);
$mi = $tage[5];
$punkte[] = seedPunkt('Tagwach', $mi . 'T07:00', 30, array('farbe' => 'grau'));
$punkte[] = seedPunkt('Zmorge', $mi . 'T07:30', 45, array('farbe' => 'gelb'));
$punkte[] = seedPunkt('Ausflug nach Siena', $mi . 'T08:30', 510, array('ort' => 'Siena', 'farbe' => 'tuerkis'));
$punkte[] = seedPunkt('Storytime', $mi . 'T20:30', 15, array('personen' => array($id['jana'])));
$punkte[] = seedPunkt('Plenum: Über dem Wasser', $mi . 'T20:45', 15, array('personen' => array($id['hannes'])));
$punkte[] = seedPunkt('Kleingruppe', $mi . 'T21:00', 30);
$punkte[] = seedPunkt('Ausflug Märt', $tage[7] . 'T12:30', 180, array('farbe' => 'tuerkis'));
$punkte[] = seedPunkt('Gruppenbild', $tage[8] . 'T12:30', 30);
$punkte[] = seedPunkt('Strand', $tage[8] . 'T15:00', 150, array('farbe' => 'tuerkis'));
$punkte[] = seedPunkt('Znacht', $tage[8] . 'T18:00', 60, array('farbe' => 'gelb'));
$punkte[] = seedPunkt('Heimreise', $tage[8] . 'T19:00', 0, array('farbe' => 'blau'));
$punkte[] = seedPunkt('Ankunft zu Hause', $tage[9] . 'T08:00', 0, array('farbe' => 'blau'));

/* Elternabend: Phase Vorbereitung, mit Ablaufplan; zweimal «Flipchart» in verschiedenen Schritten (Abnahme) */
$elternabend = seedPunkt('Elternabend', '2026-08-27T19:30', 90, array('ort' => 'Degersheim', 'phase' => 'vorbereitung', 'farbe' => 'rosa', 'personen' => array($id['andrin'], $id['hannes'], $id['dario'], $id['fabienne'])));
$s = array(
  seedSchritt('18:45', 'Vorbereitung', 'Team-Treffpunkt', array('wer' => array('alle' => true))),
  seedSchritt('19:30', 'Elternabend', 'Vorstellung', array('wer' => array('alle' => true), 'anmerkung' => 'Namensschilder')),
  seedSchritt('19:40', 'Elternabend', 'Ort, Unterkunft, Verpflegung, Reise', array('wer' => array('personen' => array($id['andrin'])))),
  seedSchritt('19:55', 'Elternabend', 'Inhalt und Tagesablauf', array('wer' => array('personen' => array($id['hannes'])))),
  seedSchritt('20:10', 'Elternabend', 'Was gilt', array('wer' => array('personen' => array($id['dario'])), 'beschreibung' => "Land: Tabak und Alkohol ab 20 Jahren\nAnlage: Nachtruhe 23:00, Grenzen\nLeitungsteam: kein Verlassen der Anlage ohne Leitende; geschlechtergetrennte Bungalows; kein Tabak-, Alkohol- und Drogenkonsum; keine Gewalt und keine Übergriffe")),
  seedSchritt('20:25', 'Elternabend', 'Offene Fragen', array('wer' => array('personen' => array($id['fabienne'])))),
);
$elternabend['ablauf'] = array('leitung' => array($id['andrin'], $id['hannes']), 'ziele' => "Eltern kennen Leitungsteam, Ort, Programm und Regeln\nOffene Fragen sind geklärt", 'schritte' => $s);
$punkte[] = $elternabend;
$camp['programmpunkte'] = $punkte;

$material = array(
  seedMaterial('Flipchart', 1, array('art' => 'schritt', 'punkt_id' => $elternabend['id'], 'schritt_id' => $s[2]['id'], 'aufgabe_id' => null), $id['andrin']),
  seedMaterial('Flipchart', 1, array('art' => 'schritt', 'punkt_id' => $elternabend['id'], 'schritt_id' => $s[3]['id'], 'aufgabe_id' => null)),
  seedMaterial('Beamer', 1, array('art' => 'programmpunkt', 'punkt_id' => $elternabend['id'], 'schritt_id' => null, 'aufgabe_id' => null), $id['hannes']),
  seedMaterial('Namensschilder', 40, array('art' => 'schritt', 'punkt_id' => $elternabend['id'], 'schritt_id' => $s[1]['id'], 'aufgabe_id' => null), $id['fabienne'], 'Stück'),
);

$inputs = seedAufgabe("Inputs 15'", array($id['fabienne'], $id['hannes'], $id['andrin']), array(
  array('2026-09-03T19:30', '2026-09-03T21:00', 'Pfarrhaus', 'Themen verteilen'),
  array('2026-09-17T19:30', '2026-09-17T21:00', 'Pfarrhaus', 'Entwürfe besprechen'),
  array('2026-09-24T19:30', '2026-09-24T20:30', 'online', 'Letzte Durchsicht'),
));
$aufgaben = array(
  seedAufgabe('Thema Auto (Selberfahren, Mieten oder Überraschung)', array()),
  seedAufgabe('Bändel von Leitenden für alle Bungalows freischalten', array()),
  seedAufgabe('Kleingruppenheft', array($id['hannes'])),
  seedAufgabe('Worship', array($id['dario'])),
  $inputs,
  seedAufgabe('Kleingruppenaufträge', array($id['fabienne'], $id['hannes'], $id['andrin'])),
  seedAufgabe('Werbung für den Infoabend', array($id['hannes'])),
);
$material[] = seedMaterial('Gitarre', 1, array('art' => 'aufgabe', 'punkt_id' => null, 'schritt_id' => null, 'aufgabe_id' => $aufgaben[3]['id']), $id['dario']);
$camp['aufgaben'] = $aufgaben;
$camp['material'] = $material;
$ziel = function ($formulierung, $messkriterium, $termin, $erreichbarkeit, $relevanz) {
  return array('id' => uuid(), 'formulierung' => $formulierung, 'messkriterium' => $messkriterium, 'termin' => $termin,
    'erreichbarkeit' => $erreichbarkeit, 'relevanz' => $relevanz, 'pruefung' => pruefungLeer($messkriterium));
};
$camp['konzept'] = array(
  'ziele' => array(
    $ziel('Die Jugendlichen lernen Petrus als Freund von Jesus kennen und ziehen Parallelen zum eigenen Leben.', 'In der Schlussrunde nennen mindestens zwei Drittel eine Szene, die sie persönlich angesprochen hat.', 'Letzter Kleingruppenabend', 'Tägliche Storytime, Plenum und Kleingruppe bauen aufeinander auf.', 'Das Camp-Thema soll über die Woche hinaus tragen.'),
    $ziel('Jede Person findet in einer Kleingruppe Anschluss.', 'Niemand bleibt in der Kleingruppen-Umfrage ohne Ansprechperson.', 'Mitte der Woche (Mittwoch)', 'Kleingruppen mit höchstens acht Personen, feste Leitende.', 'Zugehörigkeit ist Voraussetzung für Tiefgang.'),
    $ziel('Die Teilnehmenden erleben die Toskana gemeinsam und sicher.', 'Keine ernsthaften Verletzungen, alle Ausflüge nach Plan durchgeführt.', 'Heimreise', 'Sanitätsteam, klare Regeln, Tagesverantwortung.', 'Sicherheit ist Grundlage für das Vertrauen der Eltern.'),
  ),
  'zielgruppe' => array('beschreibung' => 'Jugendliche der Oberstufe aus der Kirchgemeinde und ihre Freundinnen und Freunde.', 'alter_von' => 13, 'alter_bis' => 16, 'anzahl' => 40,
    'besonderheiten' => 'Allergien und Medikamente über das Anmeldeformular erfassen. Geschlechtergetrennte Bungalows.'),
);
speicherSchreiben('events/' . $camp['id'], $camp);

/* ---------- Weg zur Konfirmation: Start-Tag mit vollständigem Ablaufplan ---------- */
$konf = neuesEvent(array(
  'typ' => 'event', 'titel' => 'Weg zur Konfirmation', 'thema' => 'Start-Tag', 'ort' => 'Kirchgemeindehaus',
  'start_datum' => '2026-10-30', 'end_datum' => '2026-10-30', 'beschreibung' => '',
), $admin['id'], $vorlagen);
seedMitglieder($konf, array($id['walter'], $id['andrin']), 'Event-Leitung');
$b = $id['andrin'];
$w = $id['walter'];
$schritte = array(
  seedSchritt('09:00', 'Freitag', 'Eintreffen', array('methode' => 'Kreativ-Wand aufstellen', 'anmerkung' => 'Grosses Papier, Schreiber', 'wer' => array('alle' => true))),
  seedSchritt('09:30', 'Freitag', 'Start mit Walter Imhof', array('wer' => array('alle' => true))),
  seedSchritt('10:45', 'Freitag', 'Teilnahme an der Kafi-Ziit der Gemeinde', array('beschreibung' => 'Höchstens 30 Minuten', 'wer' => array('alle' => true))),
  seedSchritt('11:15', 'Freitag', 'Spiel: Lüge und Wahrheit', array('methode' => "Kennenlernen der Personen\nAktivierung der Gruppe\nStart des aktiv gestalteten Gruppenprozesses", 'anmerkung' => 'A4, Kleber und Schreiber', 'wer' => array('personen' => array($b)))),
  seedSchritt('11:45', 'Freitag', 'Kommunikation (Einrichtung Chat-Gruppe)', array('wer' => array('personen' => array($b)))),
  seedSchritt('12:15', 'Freitag', 'Mittagessen', array('beschreibung' => 'Bestellen im Restaurant im Dorf', 'wer' => array('personen' => array($b)))),
  seedSchritt('13:15', 'Freitag', 'Spiel: Kügelibahn-Bau', array(
    'beschreibung' => "In 5 Gruppen:\n- 1. Oberstufe in 3 Gruppen à 2 Personen\n- 6 Personen der 2. Oberstufe zu zweit auf diese 3 Gruppen verteilt\n- restliche 2. Oberstufe bildet 2 Gruppen\nJe eine Person aus der 2. Oberstufe pro Gruppe leitet und erhält den Auftrag von BrA.",
    'methode' => "Aktivierung der Gruppe\nPotenzial als Leitende erkennen\nZusammenhalt stärken", 'wer' => array('personen' => array($b)))),
  seedSchritt('14:00', 'Freitag', 'Gestaltung «mein Lieblingsort»', array(
    'beschreibung' => "Zu zweit einen Lieblingsort auf dem Areal suchen und für die Dauer des Programms gestalten, davon ein Foto machen (wird ausgedruckt).\nAnschliessend Auflösung: Kirchgemeinde als Ort zum Wohlfühlen und Mitgestalten, Kirche und Glauben als Teil des Lebens.",
    'wer' => array('personen' => array($b)))),
  seedSchritt('14:45', 'Freitag', 'Offene Fragen klären', array('wer' => array('personen' => array($b)))),
  seedSchritt('15:00', 'Freitag', 'Abschluss in der Kirche', array('wer' => array('personen' => array($w), 'zusatz' => '? sonst BrA'))),
);
$starttag = seedPunkt('Start-Tag zum Weg zur Konfirmation', '2026-10-30T09:00', 375, array('personen' => array($w, $b)));
$starttag['ablauf'] = array(
  'leitung' => array($w, $b),
  'ziele' => "Sich als Gruppe und Personen kennenlernen, Öffnung und Tiefgang ermöglichen (aktive Gruppenprozessgestaltung, Gruppenbildung)\n"
    . "Start des Wegs zur Konfirmation, inhaltlich wie auch im Prozess\n"
    . "Programm bis zur Konfirmation und die Angebote auf diesem Weg kennenlernen\n"
    . "Stichwort «Mithelfen»: Was heisst es in der Kirchgemeinde mitzuhelfen, und warum gehört es zum Weg zur Konfirmation?\n"
    . "Aktivierung mit partizipativem Ansatz: einen Programmteil des Wochenendes mitgestalten",
  'schritte' => $schritte,
);
$konf['programmpunkte'] = array($starttag);
$konf['material'] = array(
  seedMaterial('Flipchart', 2, array('art' => 'schritt', 'punkt_id' => $starttag['id'], 'schritt_id' => $schritte[0]['id'], 'aufgabe_id' => null), '', '', 'Grosses Papier für die Kreativ-Wand'),
  seedMaterial('Schreiber', 10, array('art' => 'schritt', 'punkt_id' => $starttag['id'], 'schritt_id' => $schritte[0]['id'], 'aufgabe_id' => null), $b, 'Stück'),
  seedMaterial('Schreiber', 5, array('art' => 'schritt', 'punkt_id' => $starttag['id'], 'schritt_id' => $schritte[3]['id'], 'aufgabe_id' => null), $b, 'Stück'),
  seedMaterial('A4-Papier', 1, array('art' => 'schritt', 'punkt_id' => $starttag['id'], 'schritt_id' => $schritte[3]['id'], 'aufgabe_id' => null), '', 'Pack'),
  seedMaterial('Kleber', 5, array('art' => 'schritt', 'punkt_id' => $starttag['id'], 'schritt_id' => $schritte[3]['id'], 'aufgabe_id' => null), $b, 'Stück'),
);
$konf['aufgaben'] = array(
  seedAufgabe('Fotos ausdrucken', array($b), array(), array('art' => 'schritt', 'punkt_id' => $starttag['id'], 'schritt_id' => $schritte[7]['id'], 'aufgabe_id' => null)),
  seedAufgabe('Tisch im Restaurant reservieren', array($b), array(), array('art' => 'schritt', 'punkt_id' => $starttag['id'], 'schritt_id' => $schritte[5]['id'], 'aufgabe_id' => null)),
);
speicherSchreiben('events/' . $konf['id'], $konf);

/* Abnahme: Flipchart im Elternabend zweimal erfasst, in der Gesamtliste eine Zeile mit Menge 2 */
$flipchart = array_values(array_filter(materialGesamtliste(sichtbaresMaterial($camp, array('id' => $admin['id'], 'istAdmin' => true))), function ($z) { return $z['name'] === 'Flipchart'; }));
echo 'BeachCamp 2026: ', count($camp['programmpunkte']), ' Programmpunkte, ', count($camp['aufgaben']), ' Aufgaben, Flipchart in der Gesamtliste: ', count($flipchart), ' Zeile, Menge ', $flipchart[0]['menge'], "\n";
echo 'Weg zur Konfirmation: Start-Tag mit ', count($schritte), " Ablaufschritten\n";
