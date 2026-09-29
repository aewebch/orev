<?php
/* Events: eine verschlüsselte Datei pro Event («events/<id>») mit Tagen, Teams, Mitgliedern und Rollen.
   Spätere Meilensteine ergänzen Programm, Aufgaben, Material, Konzept und Reflexion in derselben Datei. */

define('OREV_MAX_EVENT_TAGE', 60);

function datumGueltig($datum) {
  if (!is_string($datum) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $datum)) return false;
  list($j, $m, $t) = array_map('intval', explode('-', $datum));
  return checkdate($m, $t, $j);
}

/* Ein Eintrag pro Tag im Zeitraum; bestehende Tagesthemen und Verantwortliche bleiben erhalten */
function eventTageErzeugen($start, $ende, $alteTage) {
  $bisher = array();
  foreach ($alteTage as $tag) $bisher[$tag['datum']] = $tag;
  $tage = array();
  $datum = new DateTime($start);
  $letzter = new DateTime($ende);
  while ($datum <= $letzter) {
    $d = $datum->format('Y-m-d');
    $tage[] = isset($bisher[$d]) ? $bisher[$d] : array('datum' => $d, 'thema' => '', 'verantwortliche' => array());
    $datum->modify('+1 day');
  }
  return $tage;
}

function rolleAusVorlage($vorlage) {
  $rechte = array();
  foreach ($vorlage['rechte'] as $recht) {
    $rechte[] = array('bereich' => $recht['bereich'], 'programmpunkt_id' => null, 'stufe' => $recht['stufe']);
  }
  return array('id' => uuid(), 'name' => $vorlage['name'], 'ist_event_leitung' => false, 'rechte' => $rechte);
}

function neuesEvent($felder, $erstellerId, $vorlagen) {
  $leitung = array('id' => uuid(), 'name' => 'Event-Leitung', 'ist_event_leitung' => true, 'rechte' => array());
  $rollen = array($leitung);
  foreach ($vorlagen as $vorlage) $rollen[] = rolleAusVorlage($vorlage);
  return array_merge($felder, array(
    'id' => uuid(),
    'erstellt_am' => jetzt(),
    'tage' => eventTageErzeugen($felder['start_datum'], $felder['end_datum'], array()),
    'teams' => array(),
    'mitglieder' => array(array('person_id' => $erstellerId, 'rollen' => array($leitung['id']))),
    'rollen' => $rollen,
    'programmpunkte' => array(),
  ));
}

function eventLesen($id) {
  if (!istUuid($id)) return null;
  return speicherLesen('events/' . $id, null);
}

function eventAendern($id, $aenderung) {
  return speicherAendern('events/' . $id, null, function (&$event) use ($aenderung) {
    if ($event === null) throw new RuntimeException('Event nicht gefunden');
    return $aenderung($event);
  });
}

/* Event für die angemeldete Person: Mitglieder und Installations-Admins.
   Alle anderen erfahren nicht einmal, dass es existiert. */
function eventFuerMitglied($id, $person) {
  $event = eventLesen($id);
  if ($event === null || (mitgliedVon($event, $person['id']) === null && !istAdmin($person))) fehler('Event nicht gefunden.', 404);
  return $event;
}

function pflichtRecht($event, $person, $bereich, $stufe, $programmpunktId = null) {
  if (effektivesRecht($event, rechteKontext($person), $bereich, $programmpunktId) < $stufe) fehler('Dafür fehlt Ihnen das Recht.', 403);
}

function pflichtEventLeitung($event, $person) {
  if (!hatLeitungsrechte($event, rechteKontext($person))) fehler('Nur die Event-Leitung kann das.', 403);
}

function teamsVonPerson($event, $personId) {
  $teams = array();
  foreach ($event['teams'] as $team) {
    foreach ($team['mitglieder'] as $m) {
      if ($m['person_id'] === $personId) $teams[] = $team;
    }
  }
  return $teams;
}

function eventKurz($event) {
  return array(
    'id' => $event['id'],
    'typ' => $event['typ'],
    'titel' => $event['titel'],
    'thema' => $event['thema'],
    'ort' => $event['ort'],
    'startDatum' => $event['start_datum'],
    'endDatum' => $event['end_datum'],
  );
}

/* Sicht auf ein Event, gefiltert nach den Rechten der Person */
function eventOeffentlich($event, $wer, $personen) {
  $personId = $wer['id'];
  $recht = array();
  foreach (array_keys(bereiche()) as $bereich) $recht[$bereich] = hoechstesRecht($event, $wer, $bereich);
  $personenRecht = $recht['personen'];

  $namen = array();
  foreach ($event['mitglieder'] as $mitglied) {
    foreach ($personen as $p) {
      if ($p['id'] !== $mitglied['person_id']) continue;
      $namen[$p['id']] = array('id' => $p['id'], 'vorname' => $p['vorname'], 'name' => $p['name'], 'kuerzel' => $p['kuerzel']);
      if ($personenRecht >= RECHT_LESEN) {
        $namen[$p['id']]['email'] = $p['email'];
        $namen[$p['id']]['hatKonto'] = $p['konto'] !== null;
        $namen[$p['id']]['eingeladenBis'] = $p['einladung'] !== null ? $p['einladung']['gueltig_bis'] : '';
      }
    }
  }

  $teams = array();
  foreach ($event['teams'] as $team) {
    $sichtbar = $personenRecht >= RECHT_LESEN || in_array($team, teamsVonPerson($event, $personId), true);
    $teams[] = array(
      'id' => $team['id'],
      'name' => $team['name'],
      'mitglieder' => $sichtbar ? array_map(function ($m) { return array('personId' => $m['person_id'], 'istLeitung' => $m['ist_leitung']); }, $team['mitglieder']) : array(),
    );
  }

  $sicht = eventKurz($event);
  $sicht['beschreibung'] = $recht['stammdaten'] >= RECHT_LESEN ? $event['beschreibung'] : '';
  $sicht['tage'] = array_map(function ($tag) {
    return array('datum' => $tag['datum'], 'thema' => $tag['thema'], 'verantwortliche' => $tag['verantwortliche']);
  }, $event['tage']);
  $sicht['personen'] = $namen;
  $sicht['teams'] = $teams;
  $sicht['mitglieder'] = array();
  $sicht['rollen'] = array();
  if ($personenRecht >= RECHT_LESEN) {
    foreach ($event['mitglieder'] as $m) $sicht['mitglieder'][] = array('personId' => $m['person_id'], 'rollen' => $m['rollen']);
    foreach ($event['rollen'] as $r) {
      $sicht['rollen'][] = array(
        'id' => $r['id'],
        'name' => $r['name'],
        'istEventLeitung' => $r['ist_event_leitung'],
        'rechte' => array_map(function ($x) { return array('bereich' => $x['bereich'], 'programmpunktId' => $x['programmpunkt_id'], 'stufe' => $x['stufe']); }, $r['rechte']),
      );
    }
  }
  $sicht['ich'] = array(
    'personId' => $personId,
    'recht' => $recht,
    'hatLeitungsrechte' => hatLeitungsrechte($event, $wer),
    'istAdmin' => $wer['istAdmin'],
    'istMitglied' => mitgliedVon($event, $personId) !== null,
    'rollen' => array_map(function ($r) { return $r['name']; }, rollenVon($event, $personId)),
    'teamLeitung' => array_values(array_map(function ($t) { return $t['id']; }, array_filter($event['teams'], function ($t) use ($event, $personId) {
      return istTeamLeitung($event, $personId, $t['id']);
    }))),
  );
  return $sicht;
}
