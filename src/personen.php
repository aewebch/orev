<?php
/* Globales Personenverzeichnis (Datei «personen»).
   Eine Person kann ohne Konto existieren. Konto, laufende Sitzungen und Einladung hängen an der Person;
   Sitzungs- und Einladungstokens liegen nur als Hash vor. */

define('OREV_EINLADUNG_TAGE', 7);
define('OREV_MAX_SITZUNGEN', 10);

function personenLesen() {
  $daten = speicherLesen('personen', array('personen' => array()));
  return $daten['personen'];
}

function personenAendern($aenderung) {
  return speicherAendern('personen', array('personen' => array()), function (&$daten) use ($aenderung) {
    return $aenderung($daten['personen']);
  });
}

function personIndex($personen, $id) {
  foreach ($personen as $i => $person) {
    if ($person['id'] === $id) return $i;
  }
  return null;
}

function personIndexNachEmail($personen, $email) {
  foreach ($personen as $i => $person) {
    if ($person['email'] !== '' && strcasecmp($person['email'], $email) === 0) return $i;
  }
  return null;
}

function neuePerson($vorname, $name, $kuerzel, $email) {
  return array(
    'id' => uuid(),
    'vorname' => $vorname,
    'name' => $name,
    'kuerzel' => $kuerzel,
    'email' => $email,
    'erstellt_am' => jetzt(),
    'konto' => null,
    'einladung' => null,
  );
}

function neuesKonto($passwort, $istAdmin) {
  return array(
    'passwort_hash' => passwortHash($passwort),
    'ist_admin' => $istAdmin,
    'erstellt_am' => jetzt(),
    'letzte_anmeldung' => '',
    'sitzungen' => array(),
  );
}

/* Neue Sitzung anlegen; liefert den Token (nur er selbst kommt ins Cookie, gespeichert wird der Hash) */
function sitzungAnlegen(&$person) {
  $token = zufallsToken();
  $person['konto']['sitzungen'][] = array('hash' => tokenHash($token), 'seit' => jetzt(), 'zuletzt' => time());
  $person['konto']['sitzungen'] = array_slice($person['konto']['sitzungen'], -OREV_MAX_SITZUNGEN);
  $person['konto']['letzte_anmeldung'] = jetzt();
  return $token;
}

function sitzungGueltig($sitzung) {
  return $sitzung['zuletzt'] > time() - OREV_SITZUNG_TAGE * 86400;
}

function personOeffentlich($person) {
  return array(
    'id' => $person['id'],
    'vorname' => $person['vorname'],
    'name' => $person['name'],
    'kuerzel' => $person['kuerzel'],
    'email' => $person['email'],
    'hatKonto' => $person['konto'] !== null,
    'istAdmin' => $person['konto'] !== null && $person['konto']['ist_admin'],
    'letzteAnmeldung' => $person['konto'] !== null ? $person['konto']['letzte_anmeldung'] : '',
    'eingeladenBis' => $person['einladung'] !== null ? $person['einladung']['gueltig_bis'] : '',
  );
}

function einladungAnlegen(&$person) {
  $token = zufallsToken();
  $person['einladung'] = array(
    'hash' => tokenHash($token),
    'gueltig_bis' => date('Y-m-d\TH:i:s', time() + OREV_EINLADUNG_TAGE * 86400),
  );
  return $token;
}

function einladungsLink($token) {
  return basisUrl() . '#/einladung/' . $token;
}

/* Index der Person zu einem noch gültigen Einladungstoken */
function personIndexNachEinladung($personen, $token) {
  if (!preg_match('/^[0-9a-f]{64}$/', $token)) return null;
  $hash = tokenHash($token);
  foreach ($personen as $i => $person) {
    $einladung = $person['einladung'];
    if ($einladung !== null && hash_equals($einladung['hash'], $hash) && $einladung['gueltig_bis'] > jetzt()) return $i;
  }
  return null;
}
