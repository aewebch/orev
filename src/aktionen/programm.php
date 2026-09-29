<?php
/* Programmpunkte anlegen, ändern, löschen und auf weitere Tage kopieren.
   Anlegen und Kopieren braucht das Programm-Recht «bearbeiten» für das ganze Event,
   Ändern und Löschen das Recht auf diesen einen Programmpunkt. */

function programmpunktFelderPruefen($event) {
  $felder = array(
    'titel' => (string) feld('titel'),
    'beschreibung' => (string) feld('beschreibung'),
    'start' => (string) feld('start'),
    'ende' => (string) feld('ende'),
    'ort' => (string) feld('ort'),
    'phase' => feld('phase') === 'vorbereitung' ? 'vorbereitung' : 'durchfuehrung',
    'personen' => feld('personen', array()),
    'teams' => feld('teams', array()),
  );
  if ($felder['titel'] === '' || mb_strlen($felder['titel']) > 120) fehler('Bitte geben Sie einen Titel an (höchstens 120 Zeichen).');
  if (mb_strlen($felder['beschreibung']) > 5000 || mb_strlen($felder['ort']) > 200) fehler('Eine Angabe ist zu lang.');
  if (!zeitpunktGueltig($felder['start'])) fehler('Bitte geben Sie Datum und Startzeit an.');
  if ($felder['ende'] !== '' && (!zeitpunktGueltig($felder['ende']) || $felder['ende'] <= $felder['start'])) fehler('Das Ende muss nach dem Start liegen.');
  $datum = substr($felder['start'], 0, 10);
  if ($felder['phase'] === 'durchfuehrung' && ($datum < $event['start_datum'] || $datum > $event['end_datum'])) {
    fehler('Der Programmpunkt liegt ausserhalb des Events. Wählen Sie die Phase «Vorbereitung» (z. B. für einen Elternabend).');
  }
  if (!is_array($felder['personen']) || !is_array($felder['teams'])) fehler('Ungültige Zuständige.');
  foreach ($felder['personen'] as $personId) {
    if (!is_string($personId) || mitgliedVon($event, $personId) === null) fehler('Zuständige Personen müssen zum Event gehören.');
  }
  $teamIds = array_map(function ($t) { return $t['id']; }, $event['teams']);
  foreach ($felder['teams'] as $teamId) {
    if (!in_array($teamId, $teamIds, true)) fehler('Unbekanntes Team.');
  }
  $felder['personen'] = array_values(array_unique($felder['personen']));
  $felder['teams'] = array_values(array_unique($felder['teams']));
  return $felder;
}

function aktionProgrammpunktSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  $punktId = (string) feld('id');
  if ($punktId === '') {
    pflichtRecht($event, $ich, 'programm', RECHT_BEARBEITEN);
  } else {
    if (programmpunktIndex($event, $punktId) === null) fehler('Programmpunkt nicht gefunden.', 404);
    pflichtRecht($event, $ich, 'programm', RECHT_BEARBEITEN, $punktId);
  }
  $felder = programmpunktFelderPruefen($event);
  eventAendern($id, function (&$event) use ($punktId, $felder) {
    if ($punktId === '') {
      $event['programmpunkte'][] = array_merge($felder, array('id' => uuid(), 'erstellt_am' => jetzt(), 'geaendert_am' => jetzt(), 'sequenz' => 0));
      return;
    }
    $i = programmpunktIndex($event, $punktId);
    if ($i === null) abbrechen('Programmpunkt nicht gefunden.');
    $event['programmpunkte'][$i] = array_merge($event['programmpunkte'][$i], $felder, array(
      'geaendert_am' => jetzt(),
      'sequenz' => $event['programmpunkte'][$i]['sequenz'] + 1,
    ));
  });
  eventAntwort($id, $ich);
}

function aktionProgrammpunktLoeschen() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  $punktId = (string) feld('id');
  if (programmpunktIndex($event, $punktId) === null) fehler('Programmpunkt nicht gefunden.', 404);
  pflichtRecht($event, $ich, 'programm', RECHT_BEARBEITEN, $punktId);
  eventAendern($id, function (&$event) use ($punktId) {
    programmpunktEntfernen($event, $punktId);
  });
  eventAntwort($id, $ich);
}

function aktionProgrammpunktKopieren() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  pflichtRecht($event, $ich, 'programm', RECHT_BEARBEITEN);
  $punktId = (string) feld('id');
  $daten = feld('daten', array());
  if (programmpunktIndex($event, $punktId) === null) fehler('Programmpunkt nicht gefunden.', 404);
  if (!is_array($daten) || !$daten || count($daten) > OREV_MAX_EVENT_TAGE) fehler('Bitte wählen Sie mindestens einen Tag.');
  foreach ($daten as $datum) {
    if (!datumGueltig($datum) || $datum < $event['start_datum'] || $datum > $event['end_datum']) fehler('Kopieren geht nur auf Tage des Events.');
  }
  eventAendern($id, function (&$event) use ($punktId, $daten) {
    $punkt = $event['programmpunkte'][programmpunktIndex($event, $punktId)];
    foreach (array_unique($daten) as $datum) {
      if ($datum !== substr($punkt['start'], 0, 10)) $event['programmpunkte'][] = programmpunktKopie($punkt, $datum);
    }
  });
  eventAntwort($id, $ich);
}
