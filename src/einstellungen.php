<?php
/* Einstellungen der Installation (Datei «installation») */

function einstellungenStandard() {
  return array(
    'name' => 'Orev',
    'zeitzone' => 'Europe/Zurich',
    'schema_version' => 0,
    'events_anlegen' => 'admins',
    'ical_ganzes_programm' => false,
    'mail_aktiv' => false,
    'mail_absender' => '',
    'github_repo' => 'aewebch/orev',
    'github_token' => '',
    'update_stand' => null,
  );
}

function einstellungenLesen() {
  return array_merge(einstellungenStandard(), speicherLesen('installation', array()));
}

function einstellungenAendern($aenderung) {
  return speicherAendern('installation', array(), function (&$daten) use ($aenderung) {
    $daten = array_merge(einstellungenStandard(), $daten);
    return $aenderung($daten);
  });
}

/* Was die Oberfläche sehen darf: der GitHub-Token verlässt den Server nie */
function einstellungenOeffentlich($einstellungen) {
  return array(
    'name' => $einstellungen['name'],
    'zeitzone' => $einstellungen['zeitzone'],
    'eventsAnlegen' => $einstellungen['events_anlegen'],
    'icalGanzesProgramm' => $einstellungen['ical_ganzes_programm'],
    'mailAktiv' => $einstellungen['mail_aktiv'],
    'mailAbsender' => $einstellungen['mail_absender'],
    'githubRepo' => $einstellungen['github_repo'],
    'githubTokenGesetzt' => $einstellungen['github_token'] !== '',
  );
}
