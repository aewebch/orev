<?php
/* Export und Import von Events: neue IDs, Personen zugeordnet, keine Freigabe-Links, Importierende als Leitung */

function testAustauschEvent() {
  $event = neuesEvent(array('typ' => 'camp', 'titel' => 'Test', 'thema' => '', 'ort' => '', 'start_datum' => '2026-10-02', 'end_datum' => '2026-10-04', 'beschreibung' => ''), '11111111-1111-4111-8111-111111111111', array());
  $event['mitglieder'][] = array('person_id' => '22222222-2222-4222-8222-222222222222', 'rollen' => array(), 'farbe' => '');
  $event['tage'][0]['verantwortliche'] = array('22222222-2222-4222-8222-222222222222');
  $event['freigaben'] = array(neueFreigabe(array('bezeichnung' => 'x', 'rollen' => array(), 'teams' => array(), 'gueltig_bis' => ''), 'x'));
  return $event;
}

function testAustauschPersonen() {
  return array(
    array_merge(neuePerson('Lea', 'Leitung', 'LeL', 'lea@example.test'), array('id' => '11111111-1111-4111-8111-111111111111')),
    array_merge(neuePerson('Ben', 'Beispiel', 'BeB', 'ben@example.test'), array('id' => '22222222-2222-4222-8222-222222222222')),
  );
}

function test_export_enthaelt_keine_freigaben_und_keine_konten() {
  $personen = testAustauschPersonen();
  $personen[0]['konto'] = array('passwort_hash' => 'geheim');
  $daten = eventExportDaten(testAustauschEvent(), $personen);
  pruefeGleich(array(), $daten['event']['freigaben'], 'keine Links');
  pruefeGleich(2, count($daten['personen']), 'zwei Personen');
  pruefe(strpos(json_encode($daten), 'geheim') === false, 'kein Passwort-Hash');
}

function test_import_vergibt_neue_ids_und_ordnet_personen_zu() {
  $daten = json_decode(json_encode(eventExportDaten(testAustauschEvent(), testAustauschPersonen())), true);
  $geprueft = eventImportPruefen($daten);
  $verzeichnis = array(array_merge(neuePerson('Ben', 'Anders', '', 'ben@example.test'), array('id' => '33333333-3333-4333-8333-333333333333')));
  $zuordnung = importPersonenZuordnen($verzeichnis, $geprueft['personen']);
  pruefeGleich('33333333-3333-4333-8333-333333333333', $zuordnung['22222222-2222-4222-8222-222222222222'], 'bekannte E-Mail übernommen');
  pruefeGleich(2, count($verzeichnis), 'eine Person neu');
  $ich = '44444444-4444-4444-8444-444444444444';
  $event = eventAusImport($geprueft, $zuordnung, $ich);
  pruefe($event['id'] !== $daten['event']['id'], 'neue Event-ID');
  pruefeGleich(array('33333333-3333-4333-8333-333333333333'), $event['tage'][0]['verantwortliche'], 'Tagesverantwortung umgeschrieben');
  pruefe(istEventLeitung($event, $ich), 'importierende Person ist Event-Leitung');
  pruefeGleich(3, count($event['mitglieder']), 'drei Mitglieder');
}

function test_import_lehnt_fremde_dateien_ab() {
  pruefeAusnahme(function () { eventImportPruefen(array('format' => 'anderes')); }, 'fremdes Format');
  pruefeAusnahme(function () { eventImportPruefen(array('format' => 'orev-event', 'version' => 99, 'event' => array(), 'personen' => array())); }, 'neuere Version');
  $daten = eventExportDaten(testAustauschEvent(), testAustauschPersonen());
  $daten['event']['programmpunkte'] = 'kaputt';
  pruefeAusnahme(function () use ($daten) { eventImportPruefen($daten); }, 'falscher Typ');
}
