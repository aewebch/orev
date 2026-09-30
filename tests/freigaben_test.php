<?php
/* Freigabe-Links: Token-Prüfung, Ablauf, Beitritt mit Rollen und Teams, Bereinigung */

function testEventMitFreigabe($gueltigBis) {
  $event = testEvent();
  $freigabe = neueFreigabe(array('bezeichnung' => 'Leitende', 'rollen' => array('r-a'), 'teams' => array('t-kueche'), 'gueltig_bis' => $gueltigBis), 'leitung');
  $event['freigaben'] = array($freigabe);
  return $event;
}

function test_freigabe_findet_nur_den_passenden_token() {
  $event = testEventMitFreigabe('');
  pruefeGleich(0, freigabeIndex($event, $event['freigaben'][0]['token']), 'richtiger Token');
  pruefeGleich(null, freigabeIndex($event, str_repeat('a', 64)), 'falscher Token');
  pruefeGleich(null, freigabeIndex($event, 'kurz'), 'ungültiges Format');
  pruefeGleich(null, freigabeIndex($event, null), 'kein Token');
}

function test_freigabe_ist_standardmaessig_unbegrenzt_und_laeuft_nach_dem_datum_ab() {
  $unbegrenzt = testEventMitFreigabe('');
  pruefe(!freigabeAbgelaufen($unbegrenzt['freigaben'][0]), 'ohne Datum unbegrenzt');
  $heute = testEventMitFreigabe(date('Y-m-d'));
  pruefe(freigabeIndex($heute, $heute['freigaben'][0]['token']) !== null, 'gilt bis und mit dem Ablauftag');
  $gestern = testEventMitFreigabe(date('Y-m-d', time() - 86400));
  pruefeGleich(null, freigabeIndex($gestern, $gestern['freigaben'][0]['token']), 'abgelaufen');
}

function test_beitritt_ueber_link_gibt_rollen_und_teams() {
  $event = testEventMitFreigabe('');
  pruefeGleich(RECHT_KEINE, effektivesRecht($event, wer('neu'), 'programm'), 'vorher kein Recht');
  pruefeGleich('neu', freigabeEinloesen($event, 0, 'neu'), 'neues Mitglied');
  pruefeGleich(RECHT_LESEN, effektivesRecht($event, wer('neu'), 'programm'), 'Rechte der Rolle A');
  pruefeGleich(1, count(teamsVonPerson($event, 'neu')), 'im Team Küche');
  pruefeGleich(1, $event['freigaben'][0]['beitritte'], 'Beitritt gezählt');
  pruefeGleich('unveraendert', freigabeEinloesen($event, 0, 'neu'), 'zweites Öffnen ändert nichts');
  pruefeGleich(1, $event['freigaben'][0]['beitritte'], 'nicht doppelt gezählt');
}

function test_bestehendes_mitglied_erhaelt_zusaetzliche_rollen_ohne_verlust() {
  $event = testEventMitFreigabe('');
  pruefeGleich('ergaenzt', freigabeEinloesen($event, 0, 'ohne'), 'Rolle ergänzt');
  $mitglied = mitgliedVon($event, 'ohne');
  pruefeGleich(array('r-a'), $mitglied['rollen'], 'Rolle A');
  $vorher = count($event['mitglieder']);
  freigabeEinloesen($event, 0, 'anna');
  pruefeGleich($vorher, count($event['mitglieder']), 'kein doppeltes Mitglied');
  pruefeGleich(array('r-a', 'r-b'), mitgliedVon($event, 'anna')['rollen'], 'Rollen bleiben erhalten');
}

function test_geloeschte_rollen_und_teams_verschwinden_aus_links() {
  $event = testEventMitFreigabe('');
  $event['rollen'] = array_values(array_filter($event['rollen'], function ($r) { return $r['id'] !== 'r-a'; }));
  $event['teams'] = array();
  freigabenBereinigen($event);
  pruefeGleich(array(), $event['freigaben'][0]['rollen'], 'Rolle entfernt');
  pruefeGleich(array(), $event['freigaben'][0]['teams'], 'Team entfernt');
}
