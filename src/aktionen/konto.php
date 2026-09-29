<?php
/* Anmelden, Abmelden, Einladung einlösen, eigenes Passwort */

function aktionStatus() {
  $person = angemeldetePerson();
  antwort(array(
    'eingerichtet' => true,
    'version' => lokaleVersion(),
    'name' => einstellungenLesen()['name'],
    'ich' => $person === null ? null : personOeffentlich($person),
    'darfEventsAnlegen' => darfEventsAnlegen($person),
  ));
}

function aktionAnmelden() {
  nurPost();
  anmeldeSperrePruefen();
  $email = (string) feld('email');
  $passwort = (string) feld('passwort');
  $token = personenAendern(function (&$personen) use ($email, $passwort) {
    $i = gueltigeEmail($email) ? personIndexNachEmail($personen, $email) : null;
    if ($i === null || $personen[$i]['konto'] === null) {
      passwortPruefungVortaeuschen($passwort);
      return '';
    }
    if (!password_verify($passwort, $personen[$i]['konto']['passwort_hash'])) return '';
    if (password_needs_rehash($personen[$i]['konto']['passwort_hash'], passwortVerfahren())) {
      $personen[$i]['konto']['passwort_hash'] = passwortHash($passwort);
    }
    return sitzungAnlegen($personen[$i]);
  });
  if ($token === '') fehlversuch('E-Mail oder Passwort stimmt nicht.');
  sitzungsCookieSetzen($token);
  antwort(array('ok' => true));
}

function aktionAbmelden() {
  nurPost();
  $token = sitzungsTokenAusCookie();
  if ($token !== '') {
    $hash = tokenHash($token);
    personenAendern(function (&$personen) use ($hash) {
      foreach ($personen as $i => $person) {
        if ($person['konto'] === null) continue;
        $personen[$i]['konto']['sitzungen'] = array_values(array_filter($person['konto']['sitzungen'], function ($sitzung) use ($hash) {
          return !hash_equals($sitzung['hash'], $hash);
        }));
      }
    });
  }
  sitzungsCookieSetzen('');
  antwort(array('ok' => true));
}

function aktionUeberallAbmelden() {
  nurPost();
  $ich = pflichtAnmeldung();
  personenAendern(function (&$personen) use ($ich) {
    $i = personIndex($personen, $ich['id']);
    $personen[$i]['konto']['sitzungen'] = array();
  });
  sitzungsCookieSetzen('');
  antwort(array('ok' => true));
}

function aktionEinladungPruefen() {
  nurPost();
  anmeldeSperrePruefen();
  $personen = personenLesen();
  $i = personIndexNachEinladung($personen, (string) feld('token'));
  if ($i === null) fehlversuch('Diese Einladung ist ungültig oder abgelaufen.');
  antwort(array(
    'vorname' => $personen[$i]['vorname'],
    'name' => $personen[$i]['name'],
    'email' => $personen[$i]['email'],
    'hatKonto' => $personen[$i]['konto'] !== null,
  ));
}

/* Einladung einlösen: legt das Konto an oder setzt bei bestehendem Konto das Passwort neu.
   Alle früheren Sitzungen werden dabei beendet. */
function aktionEinladungEinloesen() {
  nurPost();
  anmeldeSperrePruefen();
  $token = (string) feld('token');
  $passwort = (string) feld('passwort');
  passwortPruefen($passwort);
  $sitzung = personenAendern(function (&$personen) use ($token, $passwort) {
    $i = personIndexNachEinladung($personen, $token);
    if ($i === null) return '';
    $bisher = $personen[$i]['konto'];
    $personen[$i]['konto'] = neuesKonto($passwort, $bisher !== null && $bisher['ist_admin'], $bisher !== null && !empty($bisher['darf_events_anlegen']));
    $personen[$i]['einladung'] = null;
    return sitzungAnlegen($personen[$i]);
  });
  if ($sitzung === '') fehlversuch('Diese Einladung ist ungültig oder abgelaufen.');
  sitzungsCookieSetzen($sitzung);
  antwort(array('ok' => true));
}

function aktionPasswortAendern() {
  nurPost();
  $ich = pflichtAnmeldung();
  anmeldeSperrePruefen();
  $alt = (string) feld('alt');
  $neu = (string) feld('neu');
  passwortPruefen($neu);
  if (!password_verify($alt, $ich['konto']['passwort_hash'])) fehlversuch('Das bisherige Passwort stimmt nicht.');
  $token = personenAendern(function (&$personen) use ($ich, $neu) {
    $i = personIndex($personen, $ich['id']);
    $personen[$i]['konto']['passwort_hash'] = passwortHash($neu);
    $personen[$i]['konto']['sitzungen'] = array();
    return sitzungAnlegen($personen[$i]);
  });
  sitzungsCookieSetzen($token);
  antwort(array('ok' => true));
}
