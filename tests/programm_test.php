<?php
/* Programmpunkte: Kopieren auf andere Tage, Verschieben, Vorlagen, Löschen samt Verweisen, Sichtbarkeit nach Rechten */

function testPunkt($id, $start, $ende) {
  return array('id' => $id, 'titel' => 'Zmorge', 'beschreibung' => '', 'start' => $start, 'ende' => $ende, 'ort' => '',
    'phase' => 'durchfuehrung', 'farbe' => 'gelb', 'personen' => array(), 'teams' => array('t-kueche'), 'ablauf' => ablaufLeer(),
    'erstellt_am' => '', 'geaendert_am' => '', 'sequenz' => 3);
}

function test_zeitpunkte_werden_geprueft() {
  pruefe(zeitpunktGueltig('2026-10-03T08:30'), 'gültig');
  foreach (array('2026-10-03 08:30', '2026-10-03T24:00', '2026-02-30T08:00', '2026-10-03T8:30', '') as $wert) {
    pruefe(!zeitpunktGueltig($wert), "akzeptiert: $wert");
  }
}

function test_kopie_uebernimmt_uhrzeit_und_zustaendige_mit_neuer_id() {
  $kopie = programmpunktKopie(testPunkt('p1', '2026-10-03T08:30', '2026-10-03T09:15'), '2026-10-05');
  pruefeGleich('2026-10-05T08:30', $kopie['start'], 'Start');
  pruefeGleich('2026-10-05T09:15', $kopie['ende'], 'Ende');
  pruefeGleich(array('t-kueche'), $kopie['teams'], 'Teams');
  pruefe($kopie['id'] !== 'p1' && istUuid($kopie['id']), 'neue ID');
  pruefeGleich(0, $kopie['sequenz'], 'Sequenz beginnt neu');
}

function test_kopie_ueber_mitternacht_und_ohne_ende() {
  $nacht = programmpunktKopie(testPunkt('p1', '2026-10-03T22:00', '2026-10-04T01:00'), '2026-10-10');
  pruefeGleich('2026-10-11T01:00', $nacht['ende'], 'Ende am Folgetag');
  $offen = programmpunktKopie(testPunkt('p1', '2026-10-03T07:00', ''), '2026-10-04');
  pruefeGleich('', $offen['ende'], 'ohne Ende');
}

function test_loeschen_entfernt_punktrechte() {
  $event = testEvent();
  $event['programmpunkte'] = array(testPunkt('x', '2026-10-03T08:00', ''), testPunkt('y', '2026-10-03T09:00', ''));
  programmpunktEntfernen($event, 'x');
  pruefeGleich(1, count($event['programmpunkte']), 'ein Punkt übrig');
  foreach ($event['rollen'] as $rolle) {
    foreach ($rolle['rechte'] as $recht) pruefe($recht['programmpunkt_id'] !== 'x', 'Recht auf gelöschten Punkt übrig');
  }
  pruefeGleich(RECHT_LESEN, effektivesRecht($event, wer('anna'), 'programm'), 'allgemeines Recht bleibt');
}

function test_sichtbar_ist_nur_was_die_person_lesen_darf() {
  $event = testEvent();
  $event['rollen'][1]['rechte'] = array();
  $event['programmpunkte'] = array(testPunkt('y', '2026-10-03T09:00', ''), testPunkt('x', '2026-10-03T08:00', ''));
  $anna = sichtbareProgrammpunkte($event, wer('anna'));
  pruefeGleich(array('x'), array_map(function ($p) { return $p['id']; }, $anna), 'nur Punkt X über Rolle B');
  pruefeGleich(RECHT_BEARBEITEN, $anna[0]['recht'], 'X bearbeiten');
  $leitung = sichtbareProgrammpunkte($event, wer('leitung'));
  pruefeGleich(array('x', 'y'), array_map(function ($p) { return $p['id']; }, $leitung), 'Leitung sieht alles, chronologisch');
  pruefeGleich(array(), sichtbareProgrammpunkte($event, wer('ben')), 'Ben ohne Programmrecht');
}

function testSchritt($id, $zeit, $personen, $teams) {
  return array('id' => $id, 'zeit' => $zeit, 'abschnitt' => 'Freitag', 'titel' => 'Schritt ' . $id, 'beschreibung' => '', 'methode' => '',
    'anmerkung' => 'Flipchart', 'wer' => array('personen' => $personen, 'teams' => $teams, 'alle' => false, 'zusatz' => 'sonst EbA'));
}

function testPunktMitAblauf() {
  $punkt = testPunkt('p1', '2026-10-03T09:00', '2026-10-03T15:00');
  $punkt['personen'] = array('anna');
  $punkt['ablauf'] = array('leitung' => array('anna', 'ben'), 'ziele' => 'Kennenlernen', 'schritte' => array(
    testSchritt('s1', '09:00', array('anna'), array()),
    testSchritt('s2', '11:15', array('ben'), array('t-kueche')),
  ));
  return $punkt;
}

function test_kopie_uebernimmt_ablaufplan_mit_neuen_schritt_ids() {
  $kopie = programmpunktKopie(testPunktMitAblauf(), '2026-10-04');
  pruefeGleich('Kennenlernen', $kopie['ablauf']['ziele'], 'Ziele');
  pruefeGleich(2, count($kopie['ablauf']['schritte']), 'zwei Schritte');
  pruefe($kopie['ablauf']['schritte'][0]['id'] !== 's1' && istUuid($kopie['ablauf']['schritte'][0]['id']), 'neue Schritt-ID');
  pruefeGleich(array('ben'), $kopie['ablauf']['schritte'][1]['wer']['personen'], 'Wer bleibt');
}

function test_verschieben_behaelt_die_dauer() {
  $neu = programmpunktVerschoben(testPunkt('p1', '2026-10-03T08:30', '2026-10-03T09:15'), '2026-10-04T23:30');
  pruefeGleich('2026-10-05T00:15', $neu['ende'], 'Dauer 45 Minuten über Mitternacht');
}

function test_vorlage_ohne_personen_und_teams() {
  $vorlage = vorlageAusProgrammpunkt(testPunktMitAblauf());
  pruefeGleich(360, $vorlage['dauer'], 'Dauer in Minuten');
  pruefeGleich('gelb', $vorlage['farbe'], 'Farbe');
  pruefeGleich(array(), $vorlage['ablauf']['leitung'], 'keine Leitung');
  foreach ($vorlage['ablauf']['schritte'] as $schritt) {
    pruefeGleich(array(), $schritt['wer']['personen'], 'keine Personen');
    pruefeGleich(array(), $schritt['wer']['teams'], 'keine Teams');
    pruefeGleich('sonst EbA', $schritt['wer']['zusatz'], 'Zusatz bleibt');
  }
  $punkt = programmpunktAusVorlage($vorlage, '2026-10-05T13:00');
  pruefeGleich('2026-10-05T19:00', $punkt['ende'], 'Ende aus Dauer');
  pruefeGleich(2, count($punkt['ablauf']['schritte']), 'Schritte aus Vorlage');
  pruefe($punkt['ablauf']['schritte'][0]['id'] !== $vorlage['ablauf']['schritte'][0]['id'], 'neue Schritt-IDs');
  $offen = $vorlage;
  $offen['dauer'] = 0;
  pruefeGleich('', programmpunktAusVorlage($offen, '2026-10-05T13:00')['ende'], 'Dauer 0 heisst ohne Ende');
}

function test_person_und_team_verschwinden_aus_ablaufplan() {
  $event = testEvent();
  $event['programmpunkte'] = array(testPunktMitAblauf());
  personAusProgrammEntfernen($event, 'anna');
  $punkt = $event['programmpunkte'][0];
  pruefeGleich(array(), $punkt['personen'], 'Zuständige');
  pruefeGleich(array('ben'), $punkt['ablauf']['leitung'], 'Leitung');
  pruefeGleich(array(), $punkt['ablauf']['schritte'][0]['wer']['personen'], 'Wer');
  teamAusProgrammEntfernen($event, 't-kueche');
  pruefeGleich(array(), $event['programmpunkte'][0]['teams'], 'Team beim Punkt');
  pruefeGleich(array(), $event['programmpunkte'][0]['ablauf']['schritte'][1]['wer']['teams'], 'Team im Schritt');
}

function test_schritt_nach_zeit_einfuegen() {
  $schritte = array(testSchritt('a', '09:00', array(), array()), testSchritt('b', '11:00', array(), array()));
  ablaufschrittEinfuegen($schritte, testSchritt('c', '10:00', array(), array()));
  ablaufschrittEinfuegen($schritte, testSchritt('d', '', array(), array()));
  ablaufschrittEinfuegen($schritte, testSchritt('e', '08:00', array(), array()));
  pruefeGleich(array('e', 'a', 'c', 'b', 'd'), array_map(function ($s) { return $s['id']; }, $schritte), 'Reihenfolge');
}

function test_ablaufplan_nur_mit_leserecht() {
  $event = testEvent();
  $event['programmpunkte'] = array(testPunktMitAblauf());
  $event['programmpunkte'][0]['id'] = 'x';
  $leitung = sichtbareProgrammpunkte($event, wer('leitung'));
  pruefeGleich(2, count($leitung[0]['ablauf']['schritte']), 'Leitung sieht den Ablaufplan');
  $event['rollen'][1]['rechte'] = array(array('bereich' => 'programm', 'programmpunkt_id' => null, 'stufe' => RECHT_LESEN));
  $event['rollen'][2]['rechte'] = array();
  $anna = sichtbareProgrammpunkte($event, wer('anna'));
  pruefeGleich(1, count($anna), 'Anna sieht den Punkt');
  pruefeGleich(null, $anna[0]['ablauf'], 'aber nicht den Ablaufplan');
  $event['rollen'][2]['rechte'] = array(array('bereich' => 'ablauf', 'programmpunkt_id' => 'x', 'stufe' => RECHT_BEARBEITEN));
  $anna = sichtbareProgrammpunkte($event, wer('anna'));
  pruefeGleich(RECHT_BEARBEITEN, $anna[0]['rechtAblauf'], 'Ablauf bearbeiten nur für X');
}