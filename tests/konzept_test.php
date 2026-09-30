<?php
/* Konzept und Reflexion: Sichtbarkeit von Zielen und Überprüfung, Vertraulichkeit der Feedbacks */

function testEventMitKonzept() {
  $event = testEvent();
  $event['konzept'] = konzeptLeer();
  $event['konzept']['ziele'][] = array('id' => 'z1', 'formulierung' => 'Alle kennen sich mit Namen', 'messkriterium' => 'Namensrunde am Sonntag',
    'termin' => 'Sonntagabend', 'erreichbarkeit' => '', 'relevanz' => '', 'pruefung' => pruefungLeer('Namensrunde am Sonntag'));
  $event['reflexion'] = array('teamkultur' => 'Gutes Miteinander');
  $event['feedbacks'] = array(
    array('id' => 'f1', 'von' => 'anna', 'an' => 'ben', 'text' => 'Danke fürs Kochen', 'erstellt_am' => '2026-10-12T10:00:00+02:00', 'geaendert_am' => ''),
    array('id' => 'f2', 'von' => 'ben', 'an' => '', 'text' => 'Schönes Camp', 'erstellt_am' => '2026-10-12T11:00:00+02:00', 'geaendert_am' => ''),
  );
  $event['rollen'][1]['rechte'] = array();
  $event['rollen'][2]['rechte'] = array();
  return $event;
}

function test_pruefung_wird_aus_dem_messkriterium_vorbelegt() {
  $pruefung = pruefungLeer('Namensrunde am Sonntag');
  pruefeGleich('Namensrunde am Sonntag', $pruefung['wie'], 'wie');
  pruefeGleich('', $pruefung['grad'], 'noch nicht beurteilt');
}

function test_ziele_und_ueberpruefung_nach_rechten() {
  $event = testEventMitKonzept();
  $ohne = konzeptOeffentlich($event, wer('anna'));
  pruefeGleich(array(), $ohne['ziele'], 'ohne Recht keine Ziele');
  pruefeGleich(null, $ohne['zielgruppe'], 'ohne Recht keine Zielgruppe');
  $event['rollen'][1]['rechte'] = array(array('bereich' => 'konzept', 'programmpunkt_id' => null, 'stufe' => RECHT_LESEN));
  $konzept = konzeptOeffentlich($event, wer('anna'));
  pruefeGleich(1, count($konzept['ziele']), 'Konzept lesen zeigt die Ziele');
  pruefeGleich(null, $konzept['ziele'][0]['pruefung'], 'aber nicht die Überprüfung');
  pruefeGleich(null, $konzept['teamkultur'], 'und nicht die Teamkultur');
  $event['rollen'][1]['rechte'] = array(array('bereich' => 'reflexion', 'programmpunkt_id' => null, 'stufe' => RECHT_LESEN));
  $reflexion = konzeptOeffentlich($event, wer('anna'));
  pruefeGleich('Namensrunde am Sonntag', $reflexion['ziele'][0]['pruefung']['wie'], 'Reflexion zeigt die Überprüfung');
  pruefeGleich(null, $reflexion['zielgruppe'], 'Zielgruppe gehört zum Konzept');
  pruefeGleich('Gutes Miteinander', $reflexion['teamkultur'], 'Teamkultur');
}

function test_feedback_sieht_nur_verfasser_und_leitung() {
  $event = testEventMitKonzept();
  $ids = function ($liste) { return array_map(function ($f) { return $f['id']; }, $liste); };
  pruefeGleich(array('f1'), $ids(sichtbareFeedbacks($event, wer('anna'))), 'Anna sieht nur ihr eigenes');
  pruefeGleich(array('f2'), $ids(sichtbareFeedbacks($event, wer('ben'))), 'Ben sieht Annas Feedback an ihn nicht');
  pruefeGleich(array('f2', 'f1'), $ids(sichtbareFeedbacks($event, wer('leitung'))), 'Event-Leitung sieht alle, neueste zuerst');
  pruefeGleich(array(), sichtbareFeedbacks($event, wer('ohne')), 'andere nichts');
  pruefeGleich(RECHT_BEARBEITEN, feedbackRecht($event, wer('anna'), $event['feedbacks'][0]), 'eigenes bearbeiten');
  pruefeGleich(RECHT_KEINE, feedbackRecht($event, wer('anna'), $event['feedbacks'][1]), 'fremdes nicht');
}

function test_feedback_nur_mit_ausdruecklichem_recht() {
  $event = testEventMitKonzept();
  $event['rollen'][2]['rechte'] = array(array('bereich' => 'feedback', 'programmpunkt_id' => null, 'stufe' => RECHT_LESEN));
  $anna = sichtbareFeedbacks($event, wer('anna'));
  pruefeGleich(2, count($anna), 'mit Leserecht sieht Anna alle');
  $fremd = array_values(array_filter($anna, function ($f) { return !$f['eigenes']; }));
  pruefeGleich(RECHT_LESEN, $fremd[0]['recht'], 'fremdes nur lesen');
}

function test_zielbilanz() {
  $ziele = array(
    array('pruefung' => array('grad' => 'erreicht')), array('pruefung' => array('grad' => 'teilweise')),
    array('pruefung' => array('grad' => 'erreicht')), array('pruefung' => array('grad' => '')),
  );
  pruefeGleich(array('erreicht' => 2, 'teilweise' => 1, 'nicht' => 0, 'offen' => 1), zielBilanz($ziele), 'Bilanz');
}
