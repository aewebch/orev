<?php
/* Einstellungen der Installation (Datei «installation») */

function einstellungenStandard() {
  return array(
    'name' => 'Orev',
    'zeitzone' => 'Europe/Zurich',
    'schema_version' => 0,
    'ical_ganzes_programm' => false,
    'mail_aktiv' => false,
    'mail_absender' => '',
    'github_repo' => 'aewebch/orev',
    'github_token' => '',
    'update_stand' => null,
    'rollenvorlagen' => rollenvorlagenStandard(),
  );
}

/* Startpunkte für frei definierbare Rollen; werden beim Anlegen eines Events kopiert */
function rollenvorlagenStandard() {
  $vorlage = function ($name, $stufen) {
    $rechte = array();
    foreach ($stufen as $bereich => $stufe) $rechte[] = array('bereich' => $bereich, 'stufe' => $stufe);
    return array('id' => uuid(), 'name' => $name, 'rechte' => $rechte);
  };
  return array(
    $vorlage('Mitarbeitende', array('stammdaten' => 1, 'konzept' => 1, 'personen' => 1, 'programm' => 1, 'ablauf' => 1, 'aufgaben' => 1, 'material' => 1, 'reflexion' => 1)),
    $vorlage('Küche', array('stammdaten' => 1, 'personen' => 1, 'programm' => 1, 'aufgaben' => 1, 'material' => 2)),
    $vorlage('Praktikant', array('stammdaten' => 1, 'programm' => 1, 'ablauf' => 1)),
  );
}

/* Rechteliste aus der Oberfläche prüfen: nur bekannte Bereiche, Stufen 0 bis 2, optional ein Programmpunkt */
function rechteBereinigen($rechte, $mitProgrammpunkt) {
  if (!is_array($rechte)) fehler('Ungültige Rechte.');
  $sauber = array();
  foreach ($rechte as $recht) {
    $bereich = isset($recht['bereich']) ? $recht['bereich'] : '';
    $stufe = isset($recht['stufe']) ? $recht['stufe'] : -1;
    $punkt = $mitProgrammpunkt && isset($recht['programmpunktId']) ? $recht['programmpunktId'] : null;
    if (!array_key_exists($bereich, bereiche()) || !in_array($stufe, array(0, 1, 2), true)) fehler('Ungültige Rechte.');
    if ($punkt !== null && (!istUuid($punkt) || !in_array($bereich, programmpunktBereiche(), true))) fehler('Ungültige Rechte.');
    if ($stufe === 0) continue;
    $eintrag = array('bereich' => $bereich, 'stufe' => $stufe);
    if ($mitProgrammpunkt) $eintrag['programmpunkt_id'] = $punkt;
    $sauber[] = $eintrag;
  }
  return $sauber;
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
    'icalGanzesProgramm' => $einstellungen['ical_ganzes_programm'],
    'mailAktiv' => $einstellungen['mail_aktiv'],
    'mailAbsender' => $einstellungen['mail_absender'],
    'githubRepo' => $einstellungen['github_repo'],
    'githubTokenGesetzt' => $einstellungen['github_token'] !== '',
    'rollenvorlagen' => $einstellungen['rollenvorlagen'],
  );
}
