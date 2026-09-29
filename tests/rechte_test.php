<?php
/* Rechteauflösung: Maximalprinzip, Programmpunkt-Ebene, Event-Leitung, Team-Leitung */

function wer($id, $istAdmin = false) {
  return array('id' => $id, 'istAdmin' => $istAdmin);
}

function testEvent() {
  return array(
    'mitglieder' => array(
      array('person_id' => 'leitung', 'rollen' => array('r-leitung')),
      array('person_id' => 'anna', 'rollen' => array('r-a', 'r-b')),
      array('person_id' => 'ben', 'rollen' => array('r-a')),
      array('person_id' => 'ohne', 'rollen' => array()),
      array('person_id' => 'tl', 'rollen' => array()),
    ),
    'rollen' => array(
      array('id' => 'r-leitung', 'name' => 'Event-Leitung', 'ist_event_leitung' => true, 'rechte' => array()),
      array('id' => 'r-a', 'name' => 'A', 'ist_event_leitung' => false, 'rechte' => array(
        array('bereich' => 'programm', 'programmpunkt_id' => null, 'stufe' => RECHT_LESEN),
        array('bereich' => 'stammdaten', 'programmpunkt_id' => null, 'stufe' => RECHT_LESEN),
      )),
      array('id' => 'r-b', 'name' => 'B', 'ist_event_leitung' => false, 'rechte' => array(
        array('bereich' => 'programm', 'programmpunkt_id' => 'x', 'stufe' => RECHT_BEARBEITEN),
        array('bereich' => 'stammdaten', 'programmpunkt_id' => 'x', 'stufe' => RECHT_BEARBEITEN),
      )),
    ),
    'teams' => array(
      array('id' => 't-kueche', 'name' => 'Küche', 'mitglieder' => array(
        array('person_id' => 'tl', 'ist_leitung' => true),
        array('person_id' => 'ben', 'ist_leitung' => false),
      )),
    ),
    'programmpunkte' => array(
      array('id' => 'x', 'teams' => array()),
      array('id' => 'y', 'teams' => array()),
      array('id' => 'zmorge', 'teams' => array('t-kueche')),
    ),
  );
}

function test_abnahme_lesen_und_bearbeiten_auf_x_ergibt_x_bearbeiten_andere_lesen() {
  $event = testEvent();
  pruefeGleich(RECHT_BEARBEITEN, effektivesRecht($event, wer('anna'), 'programm', 'x'), 'Programmpunkt X');
  pruefeGleich(RECHT_LESEN, effektivesRecht($event, wer('anna'), 'programm', 'y'), 'Programmpunkt Y');
  pruefeGleich(RECHT_LESEN, effektivesRecht($event, wer('anna'), 'programm'), 'ganzes Programm');
}

function test_maximalprinzip_entzieht_nie() {
  $event = testEvent();
  $event['rollen'][2]['rechte'][] = array('bereich' => 'programm', 'programmpunkt_id' => null, 'stufe' => RECHT_KEINE);
  pruefeGleich(RECHT_LESEN, effektivesRecht($event, wer('anna'), 'programm', 'y'), 'Rolle mit «keine» entzieht nichts');
}

function test_punktrecht_gilt_nur_in_punktbereichen() {
  $event = testEvent();
  pruefeGleich(RECHT_LESEN, effektivesRecht($event, wer('anna'), 'stammdaten', 'x'), 'Stammdaten kennen keine Programmpunkte');
}

function test_ohne_punktrecht_gilt_das_allgemeine() {
  $event = testEvent();
  pruefeGleich(RECHT_LESEN, effektivesRecht($event, wer('ben'), 'programm', 'x'), 'Ben ohne Rolle B');
}

function test_event_leitung_darf_alles() {
  $event = testEvent();
  foreach (array_keys(bereiche()) as $bereich) {
    pruefeGleich(RECHT_BEARBEITEN, effektivesRecht($event, wer('leitung'), $bereich), "Leitung: $bereich");
    pruefeGleich(RECHT_BEARBEITEN, effektivesRecht($event, wer('leitung'), $bereich, 'y'), "Leitung: $bereich auf Y");
  }
}

function test_installations_admin_darf_alles_auch_ohne_mitgliedschaft() {
  $event = testEvent();
  $admin = wer('fremd', true);
  foreach (array_keys(bereiche()) as $bereich) {
    pruefeGleich(RECHT_BEARBEITEN, effektivesRecht($event, $admin, $bereich), "Admin: $bereich");
    pruefeGleich(RECHT_BEARBEITEN, effektivesRecht($event, $admin, $bereich, 'x'), "Admin: $bereich auf X");
  }
  pruefe(hatLeitungsrechte($event, $admin), 'Admin hat Leitungsrechte');
  pruefe(darfTeamVerwalten($event, $admin, 't-kueche'), 'Admin verwaltet Teams');
  pruefeGleich(1, anzahlEventLeitungen($event), 'Admin zählt nicht als Event-Leitung');
}

function test_nichtmitglied_und_mitglied_ohne_rolle_haben_keine_rechte() {
  $event = testEvent();
  pruefeGleich(RECHT_KEINE, effektivesRecht($event, wer('fremd'), 'programm'), 'Nichtmitglied');
  pruefeGleich(RECHT_KEINE, effektivesRecht($event, wer('fremd'), 'programm', 'x'), 'Nichtmitglied auf X');
  pruefeGleich(RECHT_KEINE, effektivesRecht($event, wer('ohne'), 'stammdaten'), 'Mitglied ohne Rolle');
}

function test_team_leitung_bearbeitet_was_dem_team_zugewiesen_ist() {
  $event = testEvent();
  pruefeGleich(RECHT_BEARBEITEN, effektivesRecht($event, wer('tl'), 'material', 'zmorge'), 'Team-Leitung auf Team-Punkt');
  pruefeGleich(RECHT_KEINE, effektivesRecht($event, wer('tl'), 'material', 'y'), 'Team-Leitung auf fremdem Punkt');
  pruefeGleich(RECHT_KEINE, effektivesRecht($event, wer('tl'), 'stammdaten'), 'Team-Leitung ohne Stammdaten');
  pruefeGleich(RECHT_LESEN, effektivesRecht($event, wer('ben'), 'programm', 'zmorge'), 'Team-Mitglied ohne Leitung');
  pruefe(darfTeamVerwalten($event, wer('tl'), 't-kueche'), 'Team-Leitung verwaltet eigenes Team');
  pruefe(!darfTeamVerwalten($event, wer('ben'), 't-kueche'), 'Team-Mitglied verwaltet Team nicht');
  pruefe(darfTeamVerwalten($event, wer('leitung'), 't-kueche'), 'Event-Leitung verwaltet jedes Team');
}

function test_hoechstes_recht_beruecksichtigt_einzelne_punkte() {
  $event = testEvent();
  pruefeGleich(RECHT_BEARBEITEN, hoechstesRecht($event, wer('anna'), 'programm'), 'Anna');
  pruefeGleich(RECHT_BEARBEITEN, hoechstesRecht($event, wer('tl'), 'ablauf'), 'Team-Leitung');
  pruefeGleich(RECHT_KEINE, hoechstesRecht($event, wer('ohne'), 'ablauf'), 'ohne Rolle');
}

function test_event_leitungen_werden_gezaehlt() {
  $event = testEvent();
  pruefeGleich(1, anzahlEventLeitungen($event), 'eine Leitung');
  $event['mitglieder'][0]['rollen'] = array();
  pruefeGleich(0, anzahlEventLeitungen($event), 'keine Leitung');
}
