<?php
/* Verschlüsselte Ablage: Rundreise, Manipulation und vertauschte Dateien werden erkannt */

function test_verschluesseln_und_entschluesseln_ergibt_den_klartext() {
  $schluessel = random_bytes(32);
  $klartext = json_encode(array('titel' => 'BeachCamp 2026', 'text' => "Zeile 1\nÄöü «Anführung»"));
  $roh = verschluesseln($klartext, $schluessel, 'events/abc');
  pruefe(strpos($roh, OREV_KENNUNG) === 0, 'Kennung fehlt');
  pruefe(strpos($roh, 'BeachCamp') === false, 'Klartext im Chiffrat sichtbar');
  pruefeGleich($klartext, entschluesseln($roh, $schluessel, 'events/abc'), 'Rundreise');
}

function test_gleicher_klartext_ergibt_verschiedene_chiffrate() {
  $schluessel = random_bytes(32);
  pruefe(verschluesseln('x', $schluessel, 'a') !== verschluesseln('x', $schluessel, 'a'), 'IV wird wiederverwendet');
}

function test_manipuliertes_chiffrat_wird_abgelehnt() {
  $schluessel = random_bytes(32);
  $roh = verschluesseln('geheim', $schluessel, 'personen');
  $daten = base64_decode(substr($roh, strlen(OREV_KENNUNG)));
  $daten[strlen($daten) - 1] = chr(ord($daten[strlen($daten) - 1]) ^ 1);
  $verfaelscht = OREV_KENNUNG . base64_encode($daten);
  pruefeAusnahme(function () use ($verfaelscht, $schluessel) { entschluesseln($verfaelscht, $schluessel, 'personen'); }, 'Manipulation nicht erkannt');
}

function test_vertauschte_datei_wird_abgelehnt() {
  $schluessel = random_bytes(32);
  $roh = verschluesseln('{"personen":[]}', $schluessel, 'events/a');
  pruefeAusnahme(function () use ($roh, $schluessel) { entschluesseln($roh, $schluessel, 'personen'); }, 'Vertauschte Datei nicht erkannt');
}

function test_falscher_schluessel_wird_abgelehnt() {
  $roh = verschluesseln('geheim', random_bytes(32), 'personen');
  pruefeAusnahme(function () use ($roh) { entschluesseln($roh, random_bytes(32), 'personen'); }, 'Falscher Schlüssel nicht erkannt');
}

function test_ungueltige_speichernamen_werden_abgelehnt() {
  foreach (array('../personen', 'events/../x', 'Personen', 'a/b/c', '') as $name) {
    pruefeAusnahme(function () use ($name) { speicherPfad($name); }, "Name akzeptiert: $name");
  }
}

function test_token_wird_nur_als_hash_gespeichert() {
  $person = neuePerson('Anna', 'Muster', 'MuA', 'anna@example.ch');
  $person['konto'] = array('passwort_hash' => '', 'ist_admin' => false, 'erstellt_am' => '', 'letzte_anmeldung' => '', 'sitzungen' => array());
  $token = sitzungAnlegen($person);
  pruefe(strpos(json_encode($person), $token) === false, 'Sitzungstoken im Klartext gespeichert');
  $einladung = einladungAnlegen($person);
  pruefe(strpos(json_encode($person), $einladung) === false, 'Einladungstoken im Klartext gespeichert');
  pruefeGleich(0, personIndexNachEinladung(array($person), $einladung), 'Einladung nicht auffindbar');
  pruefeGleich(null, personIndexNachEinladung(array($person), str_repeat('0', 64)), 'Falsche Einladung gefunden');
}
