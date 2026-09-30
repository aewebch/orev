<?php
/* Kalender-Abo im eigenen Konto: Link anzeigen, neu erzeugen (der alte wird ungültig), beenden,
   «ganzes Programm» wählen. Nur Personen mit Konto. */

function icalAntwort($ich) {
  $personen = personenLesen();
  $person = $personen[personIndex($personen, $ich['id'])];
  $ical = icalEinstellungen($person);
  $einstellungen = einstellungenLesen();
  $events = array();
  foreach (speicherListe('events') as $name) {
    $event = speicherLesen($name, null);
    if ($event !== null && mitgliedVon($event, $ich['id']) !== null) $events[] = array('id' => $event['id'], 'titel' => $event['titel'], 'startDatum' => $event['start_datum']);
  }
  usort($events, function ($a, $b) { return strcmp($b['startDatum'], $a['startDatum']); });
  antwort(array('ical' => array(
    'token' => $ical['token'],
    'erzeugtAm' => $ical['erzeugt_am'],
    'ganzesProgramm' => icalGanzesProgramm($person, $einstellungen),
    'eigeneWahl' => $ical['ganzes_programm'] !== null,
    'standard' => (bool) $einstellungen['ical_ganzes_programm'],
    'events' => $events,
  )));
}

function icalAendern($ich, $aenderung) {
  personenAendern(function (&$personen) use ($ich, $aenderung) {
    $i = personIndex($personen, $ich['id']);
    if ($i === null || $personen[$i]['konto'] === null) abbrechen('Kein Konto gefunden.');
    $ical = icalEinstellungen($personen[$i]);
    $aenderung($ical);
    $personen[$i]['konto']['ical'] = $ical;
  });
}

function aktionIcalStatus() {
  nurPost();
  icalAntwort(pflichtAnmeldung());
}

function aktionIcalTokenErzeugen() {
  nurPost();
  $ich = pflichtAnmeldung();
  icalAendern($ich, function (&$ical) {
    $ical['token'] = zufallsToken();
    $ical['erzeugt_am'] = jetzt();
  });
  icalAntwort($ich);
}

function aktionIcalBeenden() {
  nurPost();
  $ich = pflichtAnmeldung();
  icalAendern($ich, function (&$ical) {
    $ical['token'] = '';
    $ical['erzeugt_am'] = '';
  });
  icalAntwort($ich);
}

/* ganzesProgramm: true, false oder null (Standard der Installation) */
function aktionIcalEinstellungSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  $wert = feld('ganzesProgramm', null);
  if ($wert !== true && $wert !== false && $wert !== null) fehler('Ungültige Angabe.');
  icalAendern($ich, function (&$ical) use ($wert) {
    $ical['ganzes_programm'] = $wert;
  });
  icalAntwort($ich);
}
