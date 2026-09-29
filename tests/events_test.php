<?php
/* Events: Tage pro Datum, Erhalt beim Verschieben, Rollen aus Vorlagen, Ersteller als Event-Leitung */

function test_eventtage_werden_pro_tag_angelegt() {
  $tage = eventTageErzeugen('2026-10-02', '2026-10-11', array());
  pruefeGleich(10, count($tage), 'BeachCamp: zwei Wochenenden');
  pruefeGleich('2026-10-02', $tage[0]['datum'], 'erster Tag');
  pruefeGleich('2026-10-11', $tage[9]['datum'], 'letzter Tag');
  pruefeGleich(1, count(eventTageErzeugen('2026-10-02', '2026-10-02', array())), 'eintägig');
}

function test_eventtage_behalten_thema_und_verantwortung() {
  $tage = eventTageErzeugen('2026-10-02', '2026-10-04', array());
  $tage[1]['thema'] = 'Berufung';
  $tage[1]['verantwortliche'] = array('andre');
  $neu = eventTageErzeugen('2026-10-03', '2026-10-05', $tage);
  pruefeGleich(3, count($neu), 'verschoben');
  pruefeGleich('Berufung', $neu[0]['thema'], 'Thema bleibt');
  pruefeGleich(array('andre'), $neu[0]['verantwortliche'], 'Verantwortung bleibt');
  pruefeGleich('', $neu[2]['thema'], 'neuer Tag leer');
}

function test_eventtage_ueber_zeitumstellung() {
  pruefeGleich(3, count(eventTageErzeugen('2026-10-24', '2026-10-26', array())), 'Ende der Sommerzeit');
}

function test_neues_event_hat_ersteller_als_leitung_und_rollen_aus_vorlagen() {
  $felder = array('typ' => 'camp', 'titel' => 'BeachCamp 2026', 'thema' => '', 'ort' => '', 'start_datum' => '2026-10-02', 'end_datum' => '2026-10-11', 'beschreibung' => '');
  $event = neuesEvent($felder, 'ersteller', rollenvorlagenStandard());
  pruefe(istUuid($event['id']), 'ID');
  pruefe(istEventLeitung($event, 'ersteller'), 'Ersteller ist Event-Leitung');
  pruefeGleich(4, count($event['rollen']), 'Leitung plus drei Vorlagen');
  pruefeGleich(RECHT_BEARBEITEN, effektivesRecht($event, wer('ersteller'), 'feedback'), 'Leitung darf alles');
  pruefeGleich(10, count($event['tage']), 'Tage');
}

function test_rechte_aus_der_oberflaeche_werden_bereinigt() {
  $sauber = rechteBereinigen(array(
    array('bereich' => 'programm', 'stufe' => 1),
    array('bereich' => 'material', 'stufe' => 0),
  ), false);
  pruefeGleich(array(array('bereich' => 'programm', 'stufe' => 1)), $sauber, 'Stufe 0 fällt weg');
}
