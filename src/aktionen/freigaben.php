<?php
/* Freigabe-Links: verwalten (nur Event-Leitung, weil ein Link Rollen vergibt) und einlösen.
   Prüfen und Konto anlegen sind ohne Anmeldung möglich und zählen ungültige Tokens als Fehlversuch. */

function freigabeFelderPruefen($event) {
  $bezeichnung = (string) feld('bezeichnung');
  $gueltigBis = (string) feld('gueltigBis');
  $rollen = feld('rollen', array());
  $teams = feld('teams', array());
  if (mb_strlen($bezeichnung) > 80) fehler('Die Bezeichnung ist zu lang (höchstens 80 Zeichen).');
  if ($gueltigBis !== '' && !datumGueltig($gueltigBis)) fehler('Ungültiges Ablaufdatum.');
  if (!is_array($rollen) || !is_array($teams)) fehler('Ungültige Rollen oder Teams.');
  $rollenIds = array_map(function ($r) { return $r['id']; }, $event['rollen']);
  $teamIds = array_map(function ($t) { return $t['id']; }, $event['teams']);
  foreach ($rollen as $r) {
    if (!in_array($r, $rollenIds, true)) fehler('Unbekannte Rolle.');
  }
  foreach ($teams as $t) {
    if (!in_array($t, $teamIds, true)) fehler('Unbekanntes Team.');
  }
  return array(
    'bezeichnung' => $bezeichnung !== '' ? $bezeichnung : 'Freigabe-Link',
    'rollen' => array_values(array_unique($rollen)),
    'teams' => array_values(array_unique($teams)),
    'gueltig_bis' => $gueltigBis,
  );
}

function freigabeVerwalten($aenderung) {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  pflichtEventLeitung(eventFuerMitglied($id, $ich), $ich);
  $freigabeId = (string) feld('id');
  eventAendern($id, function (&$event) use ($aenderung, $freigabeId, $ich) {
    if (!isset($event['freigaben'])) $event['freigaben'] = array();
    return $aenderung($event, $freigabeId, $ich);
  });
  eventAntwort($id, $ich);
}

function freigabePosition($event, $freigabeId) {
  foreach ($event['freigaben'] as $i => $f) {
    if ($f['id'] === $freigabeId) return $i;
  }
  abbrechen('Link nicht gefunden.');
}

function aktionFreigabeSpeichern() {
  freigabeVerwalten(function (&$event, $freigabeId, $ich) {
    $felder = freigabeFelderPruefen($event);
    if ($freigabeId === '') {
      $event['freigaben'][] = neueFreigabe($felder, $ich['id']);
      return;
    }
    $i = freigabePosition($event, $freigabeId);
    $event['freigaben'][$i] = array_merge($event['freigaben'][$i], $felder);
  });
}

function aktionFreigabeErneuern() {
  freigabeVerwalten(function (&$event, $freigabeId) {
    $i = freigabePosition($event, $freigabeId);
    $event['freigaben'][$i]['token'] = zufallsToken();
  });
}

function aktionFreigabeLoeschen() {
  freigabeVerwalten(function (&$event, $freigabeId) {
    freigabePosition($event, $freigabeId);
    $event['freigaben'] = array_values(array_filter($event['freigaben'], function ($f) use ($freigabeId) { return $f['id'] !== $freigabeId; }));
  });
}

/* Event und Link zu einer Eingabe, sonst Fehlversuch (verrät nicht, ob es das Event gibt) */
function freigabeAusEingabe() {
  anmeldeSperrePruefen();
  $eventId = (string) feld('eventId');
  $event = istUuid($eventId) ? eventLesen($eventId) : null;
  $i = $event !== null ? freigabeIndex($event, (string) feld('token')) : null;
  if ($i === null) fehlversuch('Dieser Link ist ungültig oder abgelaufen.');
  return array($event, $i);
}

function aktionFreigabePruefen() {
  nurPost();
  list($event, $i) = freigabeAusEingabe();
  $freigabe = $event['freigaben'][$i];
  $ich = angemeldetePerson();
  $namen = function ($liste, $ids) {
    $ergebnis = array();
    foreach ($liste as $x) {
      if (in_array($x['id'], $ids, true)) $ergebnis[] = $x['name'];
    }
    return $ergebnis;
  };
  antwort(array(
    'event' => array('titel' => $event['titel'], 'typ' => $event['typ'], 'ort' => $event['ort'], 'startDatum' => $event['start_datum'], 'endDatum' => $event['end_datum']),
    'bezeichnung' => $freigabe['bezeichnung'],
    'rollen' => $namen($event['rollen'], $freigabe['rollen']),
    'teams' => $namen($event['teams'], $freigabe['teams']),
    'angemeldet' => $ich !== null,
    'istMitglied' => $ich !== null && mitgliedVon($event, $ich['id']) !== null,
  ));
}

/* Link einlösen und die Leitung informieren */
function freigabeBeitreten($eventId, $token, $person) {
  $ergebnis = eventAendern($eventId, function (&$event) use ($token, $person) {
    if (!isset($event['freigaben'])) abbrechen('Dieser Link ist ungültig oder abgelaufen.');
    $i = freigabeIndex($event, $token);
    if ($i === null) abbrechen('Dieser Link ist ungültig oder abgelaufen.');
    return array('art' => freigabeEinloesen($event, $i, $person['id']), 'bezeichnung' => $event['freigaben'][$i]['bezeichnung']);
  });
  if ($ergebnis['art'] !== 'unveraendert') {
    $event = eventLesen($eventId);
    benachrichtigen($event, $person, array(
      'schluessel' => 'mitglied-' . $person['id'],
      'text' => ($ergebnis['art'] === 'neu' ? 'ist dem Event beigetreten' : 'hat zusätzliche Rollen erhalten') . ' (Link «' . $ergebnis['bezeichnung'] . '»)',
      'link' => '/event/' . $eventId . '/personen',
      'sichtbar' => function ($wer) use ($event) { return hatLeitungsrechte($event, $wer); },
    ));
  }
  return $ergebnis['art'];
}

function aktionFreigabeEinloesen() {
  nurPost();
  $ich = pflichtAnmeldung();
  list($event) = freigabeAusEingabe();
  antwort(array('eventId' => $event['id'], 'ergebnis' => freigabeBeitreten($event['id'], (string) feld('token'), $ich)));
}

/* Neues Konto über einen Link: Person, Konto und Sitzung in einem Schritt. Eine bereits erfasste E-Mail-Adresse
   wird nicht übernommen, sonst erhielte man ohne Nachweis Zugriff auf die Events dieser Person. */
function aktionFreigabeKontoAnlegen() {
  nurPost();
  list($event) = freigabeAusEingabe();
  $felder = personenFelderPruefen();
  if ($felder['email'] === '') fehler('Bitte geben Sie Ihre E-Mail-Adresse an. Sie ist Ihr Login.');
  $passwort = (string) feld('passwort');
  passwortPruefen($passwort);
  $ergebnis = personenAendern(function (&$personen) use ($felder, $passwort) {
    $i = personIndexNachEmail($personen, $felder['email']);
    if ($i !== null) {
      abbrechen($personen[$i]['konto'] !== null
        ? 'Zu dieser E-Mail-Adresse gibt es bereits ein Konto. Bitte melden Sie sich an.'
        : 'Diese E-Mail-Adresse ist bereits erfasst. Bitten Sie die Event-Leitung um eine Einladung.');
    }
    $person = neuePerson($felder['vorname'], $felder['name'], $felder['kuerzel'], $felder['email']);
    $person['konto'] = neuesKonto($passwort, false, false);
    $token = sitzungAnlegen($person);
    $personen[] = $person;
    return array('person' => $person, 'sitzung' => $token);
  });
  freigabeBeitreten($event['id'], (string) feld('token'), $ergebnis['person']);
  sitzungsCookieSetzen($ergebnis['sitzung']);
  antwort(array('eventId' => $event['id']));
}
