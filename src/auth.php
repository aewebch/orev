<?php
/* Wer ist angemeldet? Das Sitzungs-Cookie wird gegen die gehashten Sitzungen im Personenverzeichnis geprüft. */

function angemeldetePerson() {
  static $geprueft = false;
  static $person = null;
  if ($geprueft) return $person;
  $geprueft = true;

  $token = sitzungsTokenAusCookie();
  if ($token === '') return null;
  $hash = tokenHash($token);
  foreach (personenLesen() as $kandidat) {
    if ($kandidat['konto'] === null) continue;
    foreach ($kandidat['konto']['sitzungen'] as $sitzung) {
      if (!hash_equals($sitzung['hash'], $hash) || !sitzungGueltig($sitzung)) continue;
      $person = $kandidat;
      if ($sitzung['zuletzt'] < time() - 3600) sitzungAuffrischen($kandidat['id'], $hash);
      return $person;
    }
  }
  sitzungsCookieSetzen('');
  return null;
}

/* Letzte Aktivität höchstens stündlich nachführen, damit nicht jede Anfrage schreibt */
function sitzungAuffrischen($personId, $hash) {
  personenAendern(function (&$personen) use ($personId, $hash) {
    $i = personIndex($personen, $personId);
    if ($i === null || $personen[$i]['konto'] === null) return;
    foreach ($personen[$i]['konto']['sitzungen'] as $k => $sitzung) {
      if (hash_equals($sitzung['hash'], $hash)) $personen[$i]['konto']['sitzungen'][$k]['zuletzt'] = time();
    }
  });
}

function pflichtAnmeldung() {
  $person = angemeldetePerson();
  if ($person === null) fehler('Bitte melden Sie sich an.', 401);
  return $person;
}

function istAdmin($person) {
  return $person !== null && $person['konto'] !== null && $person['konto']['ist_admin'] === true;
}

/* Die Angaben, die die Rechteauflösung über die fragende Person braucht */
function rechteKontext($person) {
  return array('id' => $person['id'], 'istAdmin' => istAdmin($person));
}

/* Events anlegen: Installations-Admins immer, andere nur mit freigeschaltetem Recht am Konto */
function darfEventsAnlegen($person) {
  if ($person === null || $person['konto'] === null) return false;
  return istAdmin($person) || !empty($person['konto']['darf_events_anlegen']);
}

function pflichtAdmin() {
  $person = pflichtAnmeldung();
  if (!istAdmin($person)) fehler('Nur für Installations-Admins.', 403);
  return $person;
}
