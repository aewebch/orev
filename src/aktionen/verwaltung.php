<?php
/* Nur Installations-Admins: Benutzer und Einladungen, Einstellungen, Updates */

function aktionBenutzerListe() {
  pflichtAdmin();
  $liste = array_map('personOeffentlich', personenLesen());
  usort($liste, function ($a, $b) {
    return strcasecmp($a['name'] . ' ' . $a['vorname'], $b['name'] . ' ' . $b['vorname']);
  });
  antwort(array('personen' => $liste));
}

function personenFelderPruefen() {
  $felder = array(
    'vorname' => (string) feld('vorname'),
    'name' => (string) feld('name'),
    'kuerzel' => (string) feld('kuerzel'),
    'email' => (string) feld('email'),
  );
  if ($felder['vorname'] === '' || $felder['name'] === '') fehler('Bitte geben Sie Vorname und Name an.');
  if (mb_strlen($felder['vorname']) > 80 || mb_strlen($felder['name']) > 80 || mb_strlen($felder['kuerzel']) > 10) fehler('Eine Angabe ist zu lang.');
  if ($felder['email'] !== '' && !gueltigeEmail($felder['email'])) fehler('Bitte geben Sie eine gültige E-Mail-Adresse an.');
  return $felder;
}

function aktionPersonSpeichern() {
  nurPost();
  pflichtAdmin();
  $id = (string) feld('id');
  $felder = personenFelderPruefen();
  $ergebnis = personenAendern(function (&$personen) use ($id, $felder) {
    $gleicheEmail = $felder['email'] !== '' ? personIndexNachEmail($personen, $felder['email']) : null;
    if ($id === '') {
      if ($gleicheEmail !== null) abbrechen('Es gibt bereits eine Person mit dieser E-Mail-Adresse.');
      $personen[] = neuePerson($felder['vorname'], $felder['name'], $felder['kuerzel'], $felder['email']);
      return personOeffentlich($personen[count($personen) - 1]);
    }
    $i = personIndex($personen, $id);
    if ($i === null) abbrechen('Person nicht gefunden.');
    if ($gleicheEmail !== null && $gleicheEmail !== $i) abbrechen('Es gibt bereits eine Person mit dieser E-Mail-Adresse.');
    if ($personen[$i]['konto'] !== null && $felder['email'] === '') abbrechen('Personen mit Konto brauchen eine E-Mail-Adresse.');
    $personen[$i] = array_merge($personen[$i], $felder);
    return personOeffentlich($personen[$i]);
  });
  antwort(array('person' => $ergebnis));
}

/* Neue Einladung (ersetzt eine frühere). Bei bestehendem Konto dient sie als Link zum Zurücksetzen des Passworts. */
function aktionEinladen() {
  nurPost();
  pflichtAdmin();
  $id = (string) feld('id');
  $ergebnis = personenAendern(function (&$personen) use ($id) {
    $i = personIndex($personen, $id);
    if ($i === null) return null;
    if ($personen[$i]['email'] === '') abbrechen('Für eine Einladung braucht die Person eine E-Mail-Adresse.');
    $token = einladungAnlegen($personen[$i]);
    return array('person' => $personen[$i], 'link' => einladungsLink($token));
  });
  if ($ergebnis === null) fehler('Person nicht gefunden.', 404);
  $gesendet = einladungSenden($ergebnis['person'], $ergebnis['link']);
  antwort(array('link' => $ergebnis['link'], 'gesendet' => $gesendet, 'person' => personOeffentlich($ergebnis['person'])));
}

function aktionEinladungZurueckziehen() {
  nurPost();
  pflichtAdmin();
  $id = (string) feld('id');
  personenAendern(function (&$personen) use ($id) {
    $i = personIndex($personen, $id);
    if ($i !== null) $personen[$i]['einladung'] = null;
  });
  antwort(array('ok' => true));
}

function anzahlAdmins($personen) {
  $anzahl = 0;
  foreach ($personen as $person) {
    if ($person['konto'] !== null && $person['konto']['ist_admin']) $anzahl++;
  }
  return $anzahl;
}

/* Rechte eines Kontos: Installations-Admin (darf alles, in jedem Event) und Events anlegen */
function aktionKontoRechte() {
  nurPost();
  $ich = pflichtAdmin();
  $id = (string) feld('id');
  $admin = feld('istAdmin') === true;
  $eventsAnlegen = feld('darfEventsAnlegen') === true;
  personenAendern(function (&$personen) use ($id, $admin, $eventsAnlegen, $ich) {
    $i = personIndex($personen, $id);
    if ($i === null || $personen[$i]['konto'] === null) abbrechen('Diese Person hat kein Konto.');
    if (!$admin && $id === $ich['id']) abbrechen('Sie können sich die Admin-Rechte nicht selbst entziehen.');
    $personen[$i]['konto']['ist_admin'] = $admin;
    $personen[$i]['konto']['darf_events_anlegen'] = $eventsAnlegen;
    if (anzahlAdmins($personen) === 0) abbrechen('Es muss mindestens einen Installations-Admin geben.');
  });
  antwort(array('ok' => true));
}

/* Konto entfernen: Die Person bleibt im Verzeichnis (Zuweisungen bleiben erhalten), kann sich aber nicht mehr anmelden */
function aktionKontoEntfernen() {
  nurPost();
  $ich = pflichtAdmin();
  $id = (string) feld('id');
  if ($id === $ich['id']) fehler('Sie können Ihr eigenes Konto nicht entfernen.');
  personenAendern(function (&$personen) use ($id) {
    $i = personIndex($personen, $id);
    if ($i === null) return;
    $personen[$i]['konto'] = null;
    $personen[$i]['einladung'] = null;
  });
  antwort(array('ok' => true));
}

function aktionEinstellungenLesen() {
  pflichtAdmin();
  antwort(array('einstellungen' => einstellungenOeffentlich(einstellungenLesen())));
}

/* Datenschutzerklärung: öffentlich, auch ohne Anmeldung */
function aktionDatenschutz() {
  antwort(array('datenschutz' => datenschutzAngaben(einstellungenLesen())));
}

function aktionEinstellungenSpeichern() {
  nurPost();
  pflichtAdmin();
  $werte = array(
    'name' => (string) feld('name'),
    'zeitzone' => (string) feld('zeitzone', 'Europe/Zurich'),
    'ical_ganzes_programm' => feld('icalGanzesProgramm') === true,
    'mail_aktiv' => feld('mailAktiv') === true,
    'mail_absender' => (string) feld('mailAbsender'),
    'betreiber' => (string) feld('betreiber'),
    'datenschutz_kontakt' => (string) feld('datenschutzKontakt'),
    'datenschutz_zusatz' => (string) feld('datenschutzZusatz'),
  );
  if ($werte['name'] === '' || mb_strlen($werte['name']) > 80) fehler('Bitte geben Sie einen Namen für die Installation an.');
  if (!in_array($werte['zeitzone'], timezone_identifiers_list(), true)) fehler('Unbekannte Zeitzone.');
  if ($werte['mail_aktiv'] && !gueltigeEmail($werte['mail_absender'])) fehler('Bitte geben Sie eine gültige Absender-Adresse an.');
  if (mb_strlen($werte['betreiber']) > 1000 || mb_strlen($werte['datenschutz_zusatz']) > 20000) fehler('Eine Angabe zum Datenschutz ist zu lang.');
  if ($werte['datenschutz_kontakt'] !== '' && !gueltigeEmail($werte['datenschutz_kontakt'])) fehler('Bitte geben Sie eine gültige E-Mail-Adresse für Datenschutzanfragen an.');
  $einstellungen = einstellungenAendern(function (&$daten) use ($werte) {
    $daten = array_merge($daten, $werte);
    return $daten;
  });
  antwort(array('einstellungen' => einstellungenOeffentlich($einstellungen)));
}

function aktionUpdatePruefen() {
  pflichtAdmin();
  $stand = updateStand(feld('erzwingen') === true);
  antwort(array('stand' => $stand));
}

function aktionUpdateInstallieren() {
  nurPost();
  pflichtAdmin();
  try {
    antwort(updateInstallieren());
  } catch (RuntimeException $e) {
    fehler($e->getMessage(), 502);
  }
}
