<?php
/* iCal: Relevanzregeln, Vorbereitungstermine einzeln, Escaping, Zeilenfaltung, stabile UIDs, Token */

function testIcalEvent() {
  $event = testEvent();
  $event['id'] = 'e1';
  $event['titel'] = 'BeachCamp';
  $event['material'] = array();
  $p1 = testPunkt('p1', '2026-10-03T08:00', '2026-10-03T09:00');
  $p1['teams'] = array();
  $p1['personen'] = array('anna');
  $p1['ort'] = 'Strand';
  $p2 = testPunkt('p2', '2026-10-03T10:00', '');
  $p3 = testPunkt('p3', '2026-10-04T14:00', '2026-10-04T15:00');
  $p3['teams'] = array();
  $p3['ablauf']['schritte'] = array(
    array('id' => 's1', 'zeit' => '14:00', 'abschnitt' => '', 'titel' => 'Begrüssung', 'beschreibung' => '', 'methode' => '', 'anmerkung' => '', 'wer' => array('personen' => array('anna', 'ohne'), 'teams' => array(), 'alle' => false, 'zusatz' => '')),
    array('id' => 's2', 'zeit' => '14:30', 'abschnitt' => '', 'titel' => 'Spiel', 'beschreibung' => '', 'methode' => '', 'anmerkung' => '', 'wer' => array('personen' => array(), 'teams' => array(), 'alle' => true, 'zusatz' => '')),
  );
  $event['programmpunkte'] = array($p1, $p2, $p3);
  $event['rollen'][1]['rechte'] = array(array('bereich' => 'programm', 'programmpunkt_id' => null, 'stufe' => RECHT_LESEN), array('bereich' => 'ablauf', 'programmpunkt_id' => null, 'stufe' => RECHT_LESEN));
  $event['rollen'][2]['rechte'] = array();
  $aufgabe = testAufgabe('a1', testZiel('schritt', 'p3', 's1', null), array('anna'), array());
  $aufgabe['titel'] = 'Inputs 15\'';
  foreach (array('2026-09-03', '2026-09-17', '2026-09-24') as $i => $datum) {
    $aufgabe['termine'][] = array('id' => 't' . $i, 'start' => $datum . 'T19:30', 'ende' => '', 'ort' => 'Pfarrhaus', 'notiz' => 'Treffen ' . ($i + 1), 'sequenz' => $i, 'geaendert_am' => '2026-09-01T10:00:00+02:00');
  }
  $event['aufgaben'] = array($aufgabe, testAufgabe('a2', testZiel('event', null, null, null), array(), array('t-kueche')));
  $event['aufgaben'][1]['termine'] = array(array('id' => 'tk', 'start' => '2026-09-10T18:00', 'ende' => '2026-09-10T19:00', 'ort' => '', 'notiz' => '', 'sequenz' => 0, 'geaendert_am' => ''));
  $event['material'] = array(array('id' => 'm1', 'name' => 'Flipchart', 'menge' => 2, 'einheit' => '', 'halter' => 'anna', 'notiz' => '', 'ziel' => testZiel('schritt', 'p3', 's1', null)));
  return $event;
}

function uids($eintraege) {
  $liste = array_map(function ($e) { return $e['uid']; }, $eintraege);
  sort($liste);
  return $liste;
}

function test_abnahme_drei_vorbereitungstermine_einzeln_und_nicht_fuer_unbeteiligte() {
  $event = testIcalEvent();
  $anna = array_values(array_filter(icalEintraege($event, wer('anna'), false), function ($e) { return strpos($e['uid'], 'prep-t') === 0 && $e['uid'] !== 'prep-tk'; }));
  pruefeGleich(3, count($anna), 'drei einzelne Einträge');
  pruefeGleich('Vorbereitung: Inputs 15\'', $anna[0]['titel'], 'Aufgabentitel');
  pruefe(strpos($anna[0]['beschreibung'], 'Event: BeachCamp') === 0 && strpos($anna[0]['beschreibung'], 'Treffen 1') !== false, 'Event und Notiz');
  pruefeGleich('2026-09-03T20:30', $anna[0]['ende'], 'ohne Ende eine Stunde');
  pruefeGleich(array(), icalEintraege($event, wer('ohne'), false), 'Unbeteiligte erhalten nichts');
}

function test_relevanz_direkt_team_ablaufschritt_und_rechte() {
  $event = testIcalEvent();
  pruefeGleich(array('pgm-p1', 'pgm-p3', 'prep-t0', 'prep-t1', 'prep-t2'), uids(icalEintraege($event, wer('anna'), false)), 'Anna: direkt (p1), im Ablaufschritt (p3), ihre Termine');
  pruefeGleich(array('pgm-p2', 'prep-tk'), uids(icalEintraege($event, wer('ben'), false)), 'Ben über das Team Küche');
  pruefeGleich(array('pgm-p1', 'pgm-p2', 'pgm-p3', 'prep-t0', 'prep-t1', 'prep-t2'), uids(icalEintraege($event, wer('anna'), true)), 'ganzes Programm');
  pruefeGleich(array(), icalEintraege($event, wer('admin', true), true), 'Admin ausserhalb des Events erhält nichts');
  $event['programmpunkte'][1]['ablauf']['leitung'] = array('leitung');
  pruefeGleich(array('pgm-p2'), uids(icalEintraege($event, wer('leitung'), false)), 'Leitung des Ablaufplans');
}

function test_beschreibung_mit_eigenen_schritten_aufgaben_und_material() {
  $event = testIcalEvent();
  $p3 = array_values(array_filter(icalEintraege($event, wer('anna'), false), function ($e) { return $e['uid'] === 'pgm-p3'; }))[0];
  pruefe(strpos($p3['beschreibung'], "Ihre Ablaufschritte:\n- 14:00 Begrüssung") !== false, 'eigener Schritt');
  pruefe(strpos($p3['beschreibung'], 'Spiel') === false, '«Alle» ist kein eigener Schritt');
  pruefe(strpos($p3['beschreibung'], "Ihre Aufgaben:\n- Inputs 15'") !== false, 'Aufgabe');
  pruefe(strpos($p3['beschreibung'], "Bitte mitnehmen:\n- 2 x Flipchart") !== false, 'Material');
  $event['rollen'][1]['rechte'] = array(array('bereich' => 'programm', 'programmpunkt_id' => null, 'stufe' => RECHT_LESEN));
  $ohneAblauf = array_values(array_filter(icalEintraege($event, wer('anna'), false), function ($e) { return $e['uid'] === 'pgm-p3'; }))[0];
  pruefe(strpos($ohneAblauf['beschreibung'], 'Ablaufschritte') === false, 'ohne Ablauf-Recht keine Schritte');
}

function test_escaping_nach_rfc5545() {
  pruefeGleich('Zmorge\\, Kaffee\\; Brot \\\\ Butter\\nZweite Zeile', icalText("Zmorge, Kaffee; Brot \\ Butter\r\nZweite Zeile"), 'Komma, Semikolon, Backslash, Umbruch');
}

function test_zeilenfaltung_75_bytes_ohne_zerschnittene_umlaute() {
  $wert = str_repeat('Äpfel und Öl für die Küche, ', 12);
  $gefaltet = icalZeile('DESCRIPTION', icalText($wert));
  $zeilen = explode("\r\n", rtrim($gefaltet, "\r\n"));
  pruefe(count($zeilen) > 3, 'mehrere Zeilen');
  foreach ($zeilen as $i => $zeile) {
    pruefe(strlen($zeile) <= 75, 'Zeile ' . $i . ' hat ' . strlen($zeile) . ' Bytes');
    pruefe(mb_check_encoding($zeile, 'UTF-8'), 'gültiges UTF-8 in Zeile ' . $i);
    if ($i > 0) pruefe($zeile[0] === ' ', 'Folgezeile beginnt mit Leerzeichen');
  }
  pruefeGleich('DESCRIPTION:' . icalText($wert), str_replace("\r\n ", '', rtrim($gefaltet, "\r\n")), 'Entfalten ergibt das Original');
}

function test_kalender_mit_stabilen_uids_zeitzone_und_crlf() {
  $event = testIcalEvent();
  $ics = icalKalender(icalEintraege($event, wer('anna'), false), 'Orev – Anna, Muster', 'orev.example.ch', '20260930T120000Z');
  pruefe(strpos($ics, "BEGIN:VCALENDAR\r\nVERSION:2.0\r\n") === 0, 'Kopf');
  pruefe(strpos($ics, "X-WR-CALNAME:Orev – Anna\\, Muster\r\n") !== false, 'Kalendername maskiert');
  pruefe(strpos($ics, "UID:pgm-p1@orev.example.ch\r\n") !== false, 'stabile UID Programmpunkt');
  pruefe(strpos($ics, "UID:prep-t1@orev.example.ch\r\n") !== false, 'stabile UID Vorbereitungstermin');
  pruefe(strpos($ics, "DTSTART;TZID=Europe/Zurich:20261003T080000\r\n") !== false, 'lokale Zeit mit Zeitzone');
  pruefe(strpos($ics, "BEGIN:VTIMEZONE\r\nTZID:Europe/Zurich") !== false, 'VTIMEZONE');
  pruefe(strpos($ics, "SEQUENCE:2\r\n") !== false, 'SEQUENCE aus den Daten');
  pruefe(strpos($ics, "LAST-MODIFIED:20260901T080000Z\r\n") !== false, 'LAST-MODIFIED in UTC');
  pruefe(strpos($ics, "REFRESH-INTERVAL;VALUE=DURATION:PT1H\r\nX-PUBLISHED-TTL:PT1H\r\n") !== false, 'eine Stunde');
  pruefe(strpos(str_replace("\r\n", '', $ics), "\n") === false, 'nur CRLF als Zeilenende');
  pruefeGleich(substr_count($ics, 'BEGIN:VEVENT'), substr_count($ics, 'END:VEVENT'), 'VEVENT geschlossen');
  $nochmals = icalKalender(icalEintraege($event, wer('anna'), false), 'Orev – Anna, Muster', 'orev.example.ch', '20260930T120000Z');
  pruefeGleich($ics, $nochmals, 'gleiche Daten, gleicher Kalender (für das ETag)');
}

function test_token_nur_mit_konto_und_in_der_richtigen_form() {
  $token = str_repeat('ab12', 16);
  $personen = array(
    array('id' => 'p1', 'konto' => array('ical' => array('token' => $token, 'ganzes_programm' => null, 'erzeugt_am' => ''))),
    array('id' => 'p2', 'konto' => null),
  );
  pruefeGleich('p1', icalPersonNachToken($personen, $token)['id'], 'gefunden');
  pruefeGleich(null, icalPersonNachToken($personen, str_repeat('ab12', 15) . 'ab13'), 'falscher Token');
  pruefeGleich(null, icalPersonNachToken($personen, '../' . $token), 'ungültige Zeichen');
  pruefeGleich(null, icalPersonNachToken($personen, ''), 'leer');
  pruefe(icalGanzesProgramm($personen[0], array('ical_ganzes_programm' => true)), 'Standard der Installation');
  $personen[0]['konto']['ical']['ganzes_programm'] = false;
  pruefe(!icalGanzesProgramm($personen[0], array('ical_ganzes_programm' => true)), 'eigene Wahl geht vor');
}
