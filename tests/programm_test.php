<?php
/* Programmpunkte: Kopieren auf andere Tage, Löschen samt Verweisen, Sichtbarkeit nach Rechten */

function testPunkt($id, $start, $ende) {
  return array('id' => $id, 'titel' => 'Zmorge', 'beschreibung' => '', 'start' => $start, 'ende' => $ende, 'ort' => '',
    'phase' => 'durchfuehrung', 'personen' => array(), 'teams' => array('t-kueche'), 'erstellt_am' => '', 'geaendert_am' => '', 'sequenz' => 3);
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
