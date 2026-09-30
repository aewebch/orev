<?php
/* Freigabe-Links eines Events: Wer den Link öffnet, wird Mitglied mit den Rollen und Teams des Links.
   Der Token liegt im verschlüsselten Event (wie der Kalender-Token im Konto), damit die Event-Leitung den Link
   jederzeit wieder kopieren kann; verglichen wird mit hash_equals. Erneuern ersetzt den Token, der alte Link ist
   danach ungültig. Ablauf: leer = unbegrenzt, sonst gilt der Link bis und mit diesem Tag. */

function neueFreigabe($felder, $erstellerId) {
  return array(
    'id' => uuid(),
    'bezeichnung' => $felder['bezeichnung'],
    'token' => zufallsToken(),
    'rollen' => $felder['rollen'],
    'teams' => $felder['teams'],
    'gueltig_bis' => $felder['gueltig_bis'],
    'erstellt_am' => jetzt(),
    'erstellt_von' => $erstellerId,
    'beitritte' => 0,
    'zuletzt' => '',
  );
}

function freigabeAbgelaufen($freigabe) {
  return $freigabe['gueltig_bis'] !== '' && $freigabe['gueltig_bis'] < date('Y-m-d');
}

/* Index des gültigen Links zum Token oder null */
function freigabeIndex($event, $token) {
  if (!is_string($token) || !preg_match('/^[0-9a-f]{64}$/', $token) || !isset($event['freigaben'])) return null;
  foreach ($event['freigaben'] as $i => $freigabe) {
    if (hash_equals($freigabe['token'], $token) && !freigabeAbgelaufen($freigabe)) return $i;
  }
  return null;
}

function freigabeLink($eventId, $token) {
  return basisUrl() . '#/beitreten/' . $eventId . '/' . $token;
}

/* Person über einen Link aufnehmen. Ist sie schon Mitglied, erhält sie zusätzlich die Rollen und Teams des Links
   (Maximalprinzip: nichts wird entzogen). Liefert 'neu', 'ergaenzt' oder 'unveraendert'. */
function freigabeEinloesen(&$event, $index, $personId) {
  $freigabe = $event['freigaben'][$index];
  $rollenIds = array_map(function ($r) { return $r['id']; }, $event['rollen']);
  $rollen = array_values(array_intersect($freigabe['rollen'], $rollenIds));
  $ergebnis = 'unveraendert';

  $gefunden = false;
  foreach ($event['mitglieder'] as $i => $m) {
    if ($m['person_id'] !== $personId) continue;
    $gefunden = true;
    $neu = array_values(array_unique(array_merge($m['rollen'], $rollen)));
    if (count($neu) !== count($m['rollen'])) {
      $event['mitglieder'][$i]['rollen'] = $neu;
      $ergebnis = 'ergaenzt';
    }
  }
  if (!$gefunden) {
    $event['mitglieder'][] = array('person_id' => $personId, 'rollen' => $rollen, 'farbe' => '');
    $ergebnis = 'neu';
  }

  foreach ($event['teams'] as $i => $team) {
    if (!in_array($team['id'], $freigabe['teams'], true)) continue;
    $drin = false;
    foreach ($team['mitglieder'] as $tm) {
      if ($tm['person_id'] === $personId) $drin = true;
    }
    if (!$drin) {
      $event['teams'][$i]['mitglieder'][] = array('person_id' => $personId, 'ist_leitung' => false);
      if ($ergebnis === 'unveraendert') $ergebnis = 'ergaenzt';
    }
  }

  if ($ergebnis !== 'unveraendert') {
    $event['freigaben'][$index]['beitritte']++;
    $event['freigaben'][$index]['zuletzt'] = jetzt();
  }
  return $ergebnis;
}

/* Gelöschte Rollen und Teams aus allen Links entfernen */
function freigabenBereinigen(&$event) {
  if (!isset($event['freigaben'])) return;
  $rollenIds = array_map(function ($r) { return $r['id']; }, $event['rollen']);
  $teamIds = array_map(function ($t) { return $t['id']; }, $event['teams']);
  foreach ($event['freigaben'] as $i => $freigabe) {
    $event['freigaben'][$i]['rollen'] = array_values(array_intersect($freigabe['rollen'], $rollenIds));
    $event['freigaben'][$i]['teams'] = array_values(array_intersect($freigabe['teams'], $teamIds));
  }
}

/* Sicht für die Event-Leitung (nur sie verwaltet Links, weil ein Link Rollen vergibt) */
function freigabenOeffentlich($event) {
  if (!isset($event['freigaben'])) return array();
  return array_map(function ($f) use ($event) {
    return array(
      'id' => $f['id'],
      'bezeichnung' => $f['bezeichnung'],
      'link' => freigabeLink($event['id'], $f['token']),
      'rollen' => $f['rollen'],
      'teams' => $f['teams'],
      'gueltigBis' => $f['gueltig_bis'],
      'abgelaufen' => freigabeAbgelaufen($f),
      'erstelltAm' => $f['erstellt_am'],
      'beitritte' => $f['beitritte'],
      'zuletzt' => $f['zuletzt'],
    );
  }, $event['freigaben']);
}
