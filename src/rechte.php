<?php
/* Zentrale Rechteauflösung. Alle Aktionen und der Kalender-Feed fragen ausschliesslich effektivesRecht().
   Stufen: 0 keine, 1 lesen, 2 bearbeiten (schliesst Anlegen und Löschen ein).
   Maximalprinzip: Aus allen Rollen einer Person gilt pro Bereich das höchste Recht; ein Recht für einen einzelnen
   Programmpunkt und eines für das ganze Event werden ebenfalls per Maximum kombiniert. Rechte werden nie entzogen. */

define('RECHT_KEINE', 0);
define('RECHT_LESEN', 1);
define('RECHT_BEARBEITEN', 2);

function bereiche() {
  return array(
    'stammdaten' => 'Event-Stammdaten',
    'konzept' => 'Konzept (Ziele, Zielgruppe)',
    'personen' => 'Personen, Teams und Rollen',
    'programm' => 'Programm',
    'ablauf' => 'Ablaufpläne',
    'aufgaben' => 'Aufgaben',
    'material' => 'Material',
    'reflexion' => 'Reflexion',
    'feedback' => 'Feedback',
  );
}

/* Bereiche, deren Recht auch nur für einzelne Programmpunkte gelten kann */
function programmpunktBereiche() {
  return array('programm', 'ablauf', 'aufgaben', 'material');
}

function mitgliedVon($event, $personId) {
  foreach ($event['mitglieder'] as $mitglied) {
    if ($mitglied['person_id'] === $personId) return $mitglied;
  }
  return null;
}

function rollenVon($event, $personId) {
  $mitglied = mitgliedVon($event, $personId);
  if ($mitglied === null) return array();
  $rollen = array();
  foreach ($event['rollen'] as $rolle) {
    if (in_array($rolle['id'], $mitglied['rollen'], true)) $rollen[] = $rolle;
  }
  return $rollen;
}

function istEventLeitung($event, $personId) {
  foreach (rollenVon($event, $personId) as $rolle) {
    if ($rolle['ist_event_leitung']) return true;
  }
  return false;
}

function istTeamLeitung($event, $personId, $teamId) {
  foreach ($event['teams'] as $team) {
    if ($team['id'] !== $teamId) continue;
    foreach ($team['mitglieder'] as $m) {
      if ($m['person_id'] === $personId && $m['ist_leitung']) return true;
    }
  }
  return false;
}

/* Teams, denen ein Programmpunkt zugewiesen ist */
function teamsVonProgrammpunkt($event, $programmpunktId) {
  if (!isset($event['programmpunkte'])) return array();
  foreach ($event['programmpunkte'] as $punkt) {
    if ($punkt['id'] === $programmpunktId) return $punkt['teams'];
  }
  return array();
}

/* Wer fragt: array('id' => Personen-ID, 'istAdmin' => Installations-Admin?), siehe rechteKontext() */
function effektivesRecht($event, $wer, $bereich, $programmpunktId = null) {
  if ($wer['istAdmin']) return RECHT_BEARBEITEN;
  $personId = $wer['id'];
  if (mitgliedVon($event, $personId) === null) return RECHT_KEINE;
  if (istEventLeitung($event, $personId)) return RECHT_BEARBEITEN;

  $proPunkt = in_array($bereich, programmpunktBereiche(), true);
  $stufe = RECHT_KEINE;
  foreach (rollenVon($event, $personId) as $rolle) {
    foreach ($rolle['rechte'] as $recht) {
      if ($recht['bereich'] !== $bereich) continue;
      $passt = $recht['programmpunkt_id'] === null || ($proPunkt && $recht['programmpunkt_id'] === $programmpunktId);
      if ($passt) $stufe = max($stufe, $recht['stufe']);
    }
  }

  /* Team-Leitung: darf bearbeiten, was ihrem Team zugewiesen ist */
  if ($proPunkt && $programmpunktId !== null) {
    foreach (teamsVonProgrammpunkt($event, $programmpunktId) as $teamId) {
      if (istTeamLeitung($event, $personId, $teamId)) $stufe = RECHT_BEARBEITEN;
    }
  }
  return $stufe;
}

/* Höchstes Recht in einem Bereich über das ganze Event und alle einzelnen Programmpunkte:
   entscheidet, ob ein Bereich in der Navigation überhaupt erscheint */
function hoechstesRecht($event, $wer, $bereich) {
  $stufe = effektivesRecht($event, $wer, $bereich);
  if (!in_array($bereich, programmpunktBereiche(), true) || !isset($event['programmpunkte'])) return $stufe;
  foreach ($event['programmpunkte'] as $punkt) {
    $stufe = max($stufe, effektivesRecht($event, $wer, $bereich, $punkt['id']));
  }
  return $stufe;
}

/* Rechte der Event-Leitung (Rollen vergeben und definieren, Event löschen): Event-Leitung oder Installations-Admin */
function hatLeitungsrechte($event, $wer) {
  return $wer['istAdmin'] || istEventLeitung($event, $wer['id']);
}

/* Team verwalten (Mitglieder, Name, Team-Leitung): Personen-Recht «bearbeiten» oder Team-Leitung dieses Teams */
function darfTeamVerwalten($event, $wer, $teamId) {
  return effektivesRecht($event, $wer, 'personen') === RECHT_BEARBEITEN || istTeamLeitung($event, $wer['id'], $teamId);
}

function anzahlEventLeitungen($event) {
  $anzahl = 0;
  foreach ($event['mitglieder'] as $mitglied) {
    if (istEventLeitung($event, $mitglied['person_id'])) $anzahl++;
  }
  return $anzahl;
}
