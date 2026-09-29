<?php
/* Aufgaben, Material (Gesamtliste), Löschkaskaden und Empfänger von Benachrichtigungen */

function testPosten($id, $name, $menge, $einheit, $halter, $notiz, $ziel) {
  return array('id' => $id, 'name' => $name, 'menge' => $menge, 'einheit' => $einheit, 'halter' => $halter, 'notiz' => $notiz,
    'ziel' => array('art' => 'schritt', 'punktId' => 'x', 'schrittId' => $ziel, 'aufgabeId' => '', 'titel' => 'Schritt ' . $ziel));
}

function testZiel($art, $punkt, $schritt, $aufgabe) {
  return array('art' => $art, 'punkt_id' => $punkt, 'schritt_id' => $schritt, 'aufgabe_id' => $aufgabe);
}

function testAufgabe($id, $ziel, $personen, $teams) {
  return array('id' => $id, 'titel' => 'Aufgabe ' . $id, 'beschreibung' => '', 'ziel' => $ziel, 'personen' => $personen, 'teams' => $teams,
    'status' => 'offen', 'faellig' => '', 'termine' => array(), 'erstellt_am' => '', 'geaendert_am' => '', 'sequenz' => 0);
}

function testMaterial($id, $ziel, $halter) {
  return array('id' => $id, 'name' => 'Flipchart', 'menge' => 1, 'einheit' => '', 'halter' => $halter, 'notiz' => '', 'ziel' => $ziel);
}

function testEventMitAufgaben() {
  $event = testEvent();
  $event['id'] = 'e1';
  $event['titel'] = 'Test';
  $event['programmpunkte'] = array(array_merge(testPunktMitAblauf(), array('id' => 'x')), testPunkt('y', '2026-10-04T08:00', ''));
  $event['aufgaben'] = array(
    testAufgabe('a-event', testZiel('event', null, null, null), array(), array()),
    testAufgabe('a-x', testZiel('programmpunkt', 'x', null, null), array('ben'), array()),
    testAufgabe('a-s1', testZiel('schritt', 'x', 's1', null), array(), array('t-kueche')),
  );
  $event['material'] = array(
    testMaterial('m-x', testZiel('programmpunkt', 'x', null, null), 'anna'),
    testMaterial('m-s1', testZiel('schritt', 'x', 's1', null), ''),
    testMaterial('m-a', testZiel('aufgabe', null, null, 'a-s1'), 'ben'),
  );
  return $event;
}

function test_abnahme_zweimal_flipchart_ergibt_eine_zeile_mit_menge_zwei() {
  $liste = materialGesamtliste(array(
    testPosten('1', 'Flipchart', 1, '', '', '', 's1'),
    testPosten('2', 'Flipchart', 1, '', '', '', 's2'),
  ));
  pruefeGleich(1, count($liste), 'eine Zeile');
  pruefeGleich(2, $liste[0]['menge'], 'Menge 2');
  pruefeGleich(2, count($liste[0]['quellen']), 'zwei Herkunftsorte');
}

function test_zusammenfuehren_ignoriert_gross_klein_und_leerzeichen() {
  $liste = materialGesamtliste(array(
    testPosten('1', 'Flipchart ', 1, 'Stück', '', '', 's1'),
    testPosten('2', ' flipchart', 2, 'stück', '', '', 's2'),
    testPosten('3', 'Grosses   Papier', 1, '', '', '', 's1'),
    testPosten('4', 'grosses papier', 1, '', '', '', 's2'),
  ));
  pruefeGleich(2, count($liste), 'zwei Zeilen');
  pruefeGleich('Flipchart', $liste[0]['name'], 'Name der ersten Erfassung, bereinigt');
  pruefeGleich(3, $liste[0]['menge'], 'Summe Flipchart');
  pruefeGleich('Grosses Papier', $liste[1]['name'], 'Leerzeichen bereinigt');
}

function test_verschiedene_einheiten_bleiben_getrennt() {
  $liste = materialGesamtliste(array(
    testPosten('1', 'Mehl', 2, 'kg', '', '', 's1'),
    testPosten('2', 'Mehl', 500, 'g', '', '', 's2'),
    testPosten('3', 'Mehl', 1.5, 'kg', '', '', 's2'),
  ));
  pruefeGleich(2, count($liste), 'kg und g getrennt');
  $kg = $liste[0]['einheit'] === 'kg' ? $liste[0] : $liste[1];
  pruefeGleich(3.5, $kg['menge'], 'Dezimalmengen summiert');
}

function test_halter_aufgeschluesselt_ohne_zuordnung_zuletzt() {
  $liste = materialGesamtliste(array(
    testPosten('1', 'Ball', 1, '', '', '', 's1'),
    testPosten('2', 'Ball', 2, '', 'anna', 'im Keller', 's1'),
    testPosten('3', 'Ball', 1, '', 'ben', '', 's2'),
    testPosten('4', 'Ball', 1, '', 'anna', 'im Keller', 's2'),
  ));
  pruefeGleich(5, $liste[0]['menge'], 'Gesamtmenge');
  $halter = array();
  foreach ($liste[0]['halter'] as $h) $halter[$h['personId']] = $h['menge'];
  pruefeGleich(array('anna' => 3, 'ben' => 1, '' => 1), $halter, 'Anna 3, Ben 1, ohne Zuordnung 1');
  pruefeGleich('', $liste[0]['halter'][2]['personId'], 'ohne Zuordnung zuletzt');
  pruefeGleich(array('im Keller'), $liste[0]['notizen'], 'Notizen ohne Doppel');
}

function test_aufgabenrecht_folgt_programmpunkt_und_zustaendigkeit() {
  $event = testEventMitAufgaben();
  $event['rollen'][1]['rechte'] = array(array('bereich' => 'aufgaben', 'programmpunkt_id' => 'x', 'stufe' => RECHT_BEARBEITEN));
  $event['rollen'][2]['rechte'] = array();
  $anna = array_map(function ($a) { return $a['id']; }, sichtbareAufgaben($event, wer('anna')));
  pruefeGleich(array('a-x', 'a-s1'), $anna, 'Anna sieht die Aufgaben an X, nicht die des Events');
  $ohne = sichtbareAufgaben($event, wer('ohne'));
  pruefeGleich(array(), $ohne, 'ohne Recht und nicht zuständig: nichts');
  $event['rollen'][1]['rechte'] = array();
  $ben = sichtbareAufgaben($event, wer('ben'));
  pruefeGleich(array('a-x', 'a-s1'), array_map(function ($a) { return $a['id']; }, $ben), 'Ben: direkt und über Team Küche zuständig');
  pruefe($ben[0]['darfStatus'] && $ben[0]['recht'] === RECHT_LESEN, 'Zuständige lesen und setzen den Status');
}

function test_material_der_aufgabe_folgt_deren_programmpunkt() {
  $event = testEventMitAufgaben();
  pruefeGleich('x', materialPunktId($event, $event['material'][2]), 'über Aufgabe a-s1 an X');
  $event['rollen'][1]['rechte'] = array();
  $event['rollen'][2]['rechte'] = array();
  $ben = sichtbaresMaterial($event, wer('ben'));
  pruefeGleich(array('m-a'), array_map(function ($m) { return $m['id']; }, $ben), 'Halter sieht sein Material');
}

function test_loeschen_eines_punkts_entfernt_aufgaben_und_material() {
  $event = testEventMitAufgaben();
  programmpunktEntfernen($event, 'x');
  pruefeGleich(array('a-event'), array_map(function ($a) { return $a['id']; }, $event['aufgaben']), 'nur Aufgabe des Events bleibt');
  pruefeGleich(array(), $event['material'], 'Material am Punkt, am Schritt und an dessen Aufgabe entfernt');
}

function test_loeschen_eines_schritts_und_einer_aufgabe() {
  $event = testEventMitAufgaben();
  zielVerweiseEntfernen($event, 'schritt', 's1');
  pruefeGleich(array('a-event', 'a-x'), array_map(function ($a) { return $a['id']; }, $event['aufgaben']), 'Aufgabe am Schritt entfernt');
  pruefeGleich(array('m-x'), array_map(function ($m) { return $m['id']; }, $event['material']), 'Material am Schritt und an der Aufgabe entfernt');
}

function test_person_verlassen_macht_material_ohne_zuordnung() {
  $event = testEventMitAufgaben();
  personAusProgrammEntfernen($event, 'ben');
  pruefeGleich(array(), $event['aufgaben'][1]['personen'], 'aus Aufgabe gestrichen');
  pruefeGleich('', $event['material'][2]['halter'], 'Material ohne Halter');
}

function test_benachrichtigung_persoenlich_allgemein_und_nie_an_sich_selbst() {
  $event = testEventMitAufgaben();
  $event['rollen'][1]['rechte'] = array(array('bereich' => 'programm', 'programmpunkt_id' => null, 'stufe' => RECHT_LESEN));
  $event['rollen'][2]['rechte'] = array();
  $empfaenger = benachrichtigungEmpfaenger($event, 'leitung', array(
    'persoenlich' => array(),
    'teams' => array('t-kueche'),
    'sichtbar' => sichtbarMitRecht($event, 'programm', 'x'),
  ), array());
  pruefeGleich(array('anna' => false, 'ben' => true, 'tl' => true), $empfaenger, 'Team persönlich, Leserecht allgemein, «ohne» nichts, Akteur nicht');
  $selbst = benachrichtigungEmpfaenger($event, 'ben', array('persoenlich' => array('ben')), array());
  pruefeGleich(array(), $selbst, 'nie an sich selbst');
  $entfernt = benachrichtigungEmpfaenger($event, 'leitung', array('auch' => array('ehemalig'), 'ohne' => array('anna'), 'sichtbar' => sichtbarFuerAlle()), array());
  pruefeGleich(array('ben' => false, 'ohne' => false, 'tl' => false, 'ehemalig' => true), $entfernt, 'auch und ohne');
}

function test_admin_ausserhalb_des_events_bekommt_nichts() {
  $event = testEventMitAufgaben();
  $empfaenger = benachrichtigungEmpfaenger($event, 'leitung', array('sichtbar' => sichtbarFuerAlle()), array('admin'));
  pruefe(!isset($empfaenger['admin']), 'nur Mitglieder');
}

function test_gleiche_aenderung_wird_zusammengefasst() {
  $eintraege = array();
  $meldung = array('id' => 'm1', 'schluessel' => 'pgm-x', 'von_id' => 'leitung', 'persoenlich' => false, 'anzahl' => 1, 'gelesen' => false, 'zeitstempel' => 1000, 'text' => 'eins');
  benachrichtigungEintragen($eintraege, $meldung, 1000);
  benachrichtigungEintragen($eintraege, array_merge($meldung, array('id' => 'm2', 'text' => 'zwei', 'persoenlich' => true, 'zeitstempel' => 1500)), 1500);
  pruefeGleich(1, count($eintraege), 'zusammengefasst');
  pruefeGleich(array('m1', 'zwei', 2, true), array($eintraege[0]['id'], $eintraege[0]['text'], $eintraege[0]['anzahl'], $eintraege[0]['persoenlich']), 'neuester Text, Zähler, persönlich bleibt');
  $eintraege[0]['gelesen'] = true;
  benachrichtigungEintragen($eintraege, array_merge($meldung, array('id' => 'm3', 'zeitstempel' => 1600)), 1600);
  pruefeGleich(2, count($eintraege), 'gelesene Meldung wird nicht mehr ergänzt');
  benachrichtigungEintragen($eintraege, array_merge($meldung, array('id' => 'm4', 'zeitstempel' => 9000)), 9000);
  pruefeGleich(3, count($eintraege), 'nach einer Stunde neue Meldung');
}

function test_filter_nach_halter_und_programmpunkt() {
  $posten = array(
    array_merge(testPosten('1', 'Ball', 1, '', 'anna', '', 's1'), array('punktId' => 'x')),
    array_merge(testPosten('2', 'Ball', 2, '', '', '', 's1'), array('punktId' => 'x')),
    array_merge(testPosten('3', 'Ball', 4, '', 'anna', '', 's1'), array('punktId' => 'y')),
  );
  pruefeGleich(array('1', '3'), array_map(function ($p) { return $p['id']; }, materialFiltern($posten, 'anna', '')), 'Halter Anna');
  pruefeGleich(array('2'), array_map(function ($p) { return $p['id']; }, materialFiltern($posten, 'ohne', '')), 'ohne Halter');
  pruefeGleich(array('1', '2'), array_map(function ($p) { return $p['id']; }, materialFiltern($posten, '', 'x')), 'Programmpunkt X');
  pruefeGleich(3, materialGesamtliste(materialFiltern($posten, '', 'x'))[0]['menge'], 'Summe nur aus dem Filter');
}