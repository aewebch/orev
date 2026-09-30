<?php
/* Nachbereitung: Fünf-Finger-Feedback und Bewertungen von Ort, Tagen und Programmpunkten */

function test_fuenf_finger_immer_vollstaendig() {
  $event = testEventMitKonzept();
  $event['feedbacks'][0]['finger'] = array('daumen' => 'Stimmung', 'ringfinger' => 'Abschlussabend');
  $f = sichtbareFeedbacks($event, wer('anna'));
  pruefeGleich(array('daumen', 'zeigefinger', 'mittelfinger', 'ringfinger', 'kleinerfinger'), array_keys($f[0]['finger']), 'alle fünf Finger');
  pruefeGleich('Abschlussabend', $f[0]['finger']['ringfinger'], 'Antwort erhalten');
  $alt = sichtbareFeedbacks($event, wer('ben'));
  pruefeGleich('', $alt[0]['finger']['daumen'], 'älteres Feedback ohne Finger');
  pruefeGleich('Schönes Camp', $alt[0]['text'], 'Freitext bleibt');
}

function test_bewertungen_nur_mit_reflexion_und_sichtbaren_punkten() {
  $event = testEventMitKonzept();
  $event['reflexion'] = array('teamkultur' => '', 'ort' => array('bewertung' => 'gut', 'notiz' => 'Strand nah'), 'tage' => array('2026-10-03' => array('bewertung' => 'mittel', 'notiz' => '')),
    'punkte' => array('x' => array('bewertung' => 'gut', 'notiz' => ''), 'y' => array('bewertung' => 'schwach', 'notiz' => 'zu lang')));
  pruefeGleich(null, konzeptOeffentlich($event, wer('anna'))['bewertungen'], 'ohne Reflexion nichts');
  $event['rollen'][1]['rechte'] = array(array('bereich' => 'reflexion', 'programmpunkt_id' => null, 'stufe' => RECHT_LESEN));
  $event['rollen'][2]['rechte'] = array(array('bereich' => 'programm', 'programmpunkt_id' => 'x', 'stufe' => RECHT_LESEN));
  $b = konzeptOeffentlich($event, wer('anna'))['bewertungen'];
  pruefeGleich('Strand nah', $b['ort']['notiz'], 'Ort');
  pruefeGleich(array('2026-10-03'), array_keys((array) $b['tage']), 'Tage');
  pruefeGleich(array('x'), array_keys((array) $b['punkte']), 'nur Punkt X, den Anna sehen darf');
}

function test_aeltere_reflexion_wird_ergaenzt() {
  $r = reflexionVollstaendig(array('teamkultur' => 'gut'));
  pruefeGleich('gut', $r['teamkultur'], 'Teamkultur bleibt');
  pruefeGleich(array('bewertung' => '', 'notiz' => ''), $r['ort'], 'Ort leer');
  pruefeGleich(array(), $r['punkte'], 'Punkte leer');
}

function test_geloeschter_punkt_verliert_seine_bewertung() {
  $event = testEventMitKonzept();
  $event['programmpunkte'] = array(testPunkt('x', '2026-10-03T08:00', ''));
  $event['aufgaben'] = array();
  $event['material'] = array();
  $event['reflexion'] = reflexionLeer();
  $event['reflexion']['punkte']['x'] = array('bewertung' => 'gut', 'notiz' => '');
  programmpunktEntfernen($event, 'x');
  pruefeGleich(array(), $event['reflexion']['punkte'], 'Bewertung entfernt');
}
