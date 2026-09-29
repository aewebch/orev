<?php
/* Aufgaben mit Vorbereitungsterminen und Materialposten eines Events.
   Eine Aufgabe hängt an genau einem von: Event, Programmpunkt oder Ablaufschritt (ziel).
   Ein Materialposten hängt an Programmpunkt, Ablaufschritt oder Aufgabe.
   Rechte: Aufgaben und Material richten sich nach dem Programmpunkt, an dem sie (auch über die Aufgabe) hängen;
   Zuständige einer Aufgabe sehen sie immer und dürfen ihren Status setzen, Halter sehen ihr Material immer. */

function aufgabeIndex($event, $id) {
  foreach ($event['aufgaben'] as $i => $aufgabe) {
    if ($aufgabe['id'] === $id) return $i;
  }
  return null;
}

function materialIndex($event, $id) {
  foreach ($event['material'] as $i => $posten) {
    if ($posten['id'] === $id) return $i;
  }
  return null;
}

/* Programmpunkt, nach dem sich das Recht richtet (null: ganzes Event) */
function aufgabePunktId($aufgabe) {
  return $aufgabe['ziel']['punkt_id'];
}

function materialPunktId($event, $posten) {
  if ($posten['ziel']['art'] !== 'aufgabe') return $posten['ziel']['punkt_id'];
  $i = aufgabeIndex($event, $posten['ziel']['aufgabe_id']);
  return $i === null ? null : aufgabePunktId($event['aufgaben'][$i]);
}

/* Personen, die über direkte Zuweisung oder über Teams zuständig sind */
function personenAusZustaendigen($event, $personen, $teams) {
  $ids = $personen;
  foreach ($event['teams'] as $team) {
    if (!in_array($team['id'], $teams, true)) continue;
    foreach ($team['mitglieder'] as $m) $ids[] = $m['person_id'];
  }
  return array_values(array_unique($ids));
}

function istZustaendig($event, $personId, $personen, $teams) {
  return in_array($personId, personenAusZustaendigen($event, $personen, $teams), true);
}

function aufgabeRecht($event, $wer, $aufgabe) {
  $recht = effektivesRecht($event, $wer, 'aufgaben', aufgabePunktId($aufgabe));
  if ($recht < RECHT_LESEN && istZustaendig($event, $wer['id'], $aufgabe['personen'], $aufgabe['teams'])) $recht = RECHT_LESEN;
  return $recht;
}

function materialRecht($event, $wer, $posten) {
  $recht = effektivesRecht($event, $wer, 'material', materialPunktId($event, $posten));
  if ($recht < RECHT_LESEN && $posten['halter'] === $wer['id']) $recht = RECHT_LESEN;
  return $recht;
}

/* Lesbare Beschreibung, woran etwas hängt. Titel von Punkten und Schritten nur, wenn die Person sie sehen darf. */
function zielBeschreibung($event, $wer, $ziel) {
  $text = array('art' => $ziel['art'], 'punktId' => '', 'schrittId' => '', 'aufgabeId' => '', 'titel' => '');
  if ($ziel['art'] === 'event') {
    $text['titel'] = 'Event';
    return $text;
  }
  if ($ziel['art'] === 'aufgabe') {
    $i = aufgabeIndex($event, $ziel['aufgabe_id']);
    $text['aufgabeId'] = $ziel['aufgabe_id'];
    $text['titel'] = $i !== null && aufgabeRecht($event, $wer, $event['aufgaben'][$i]) >= RECHT_LESEN ? 'Aufgabe «' . $event['aufgaben'][$i]['titel'] . '»' : 'Aufgabe';
    return $text;
  }
  $text['punktId'] = $ziel['punkt_id'];
  $p = programmpunktIndex($event, $ziel['punkt_id']);
  if ($p === null || effektivesRecht($event, $wer, 'programm', $ziel['punkt_id']) < RECHT_LESEN) {
    $text['titel'] = 'Programmpunkt';
    return $text;
  }
  $punkt = $event['programmpunkte'][$p];
  $text['titel'] = $punkt['titel'] . ' (' . substr($punkt['start'], 8, 2) . '.' . substr($punkt['start'], 5, 2) . '. ' . substr($punkt['start'], 11) . ')';
  if ($ziel['art'] === 'schritt') {
    $text['schrittId'] = $ziel['schritt_id'];
    $s = ablaufschrittIndex($punkt, $ziel['schritt_id']);
    if ($s !== null && effektivesRecht($event, $wer, 'ablauf', $ziel['punkt_id']) >= RECHT_LESEN) {
      $text['titel'] .= ' · Schritt «' . $punkt['ablauf']['schritte'][$s]['titel'] . '»';
    }
  }
  return $text;
}

function aufgabeOeffentlich($event, $wer, $aufgabe, $recht) {
  return array(
    'id' => $aufgabe['id'],
    'titel' => $aufgabe['titel'],
    'beschreibung' => $aufgabe['beschreibung'],
    'ziel' => zielBeschreibung($event, $wer, $aufgabe['ziel']),
    'personen' => $aufgabe['personen'],
    'teams' => $aufgabe['teams'],
    'status' => $aufgabe['status'],
    'faellig' => $aufgabe['faellig'],
    'termine' => array_map(function ($t) {
      return array('id' => $t['id'], 'start' => $t['start'], 'ende' => $t['ende'], 'ort' => $t['ort'], 'notiz' => $t['notiz']);
    }, $aufgabe['termine']),
    'recht' => $recht,
    'darfStatus' => $recht >= RECHT_BEARBEITEN || istZustaendig($event, $wer['id'], $aufgabe['personen'], $aufgabe['teams']),
    'meine' => istZustaendig($event, $wer['id'], $aufgabe['personen'], $aufgabe['teams']),
  );
}

function sichtbareAufgaben($event, $wer) {
  $liste = array();
  foreach ($event['aufgaben'] as $aufgabe) {
    $recht = aufgabeRecht($event, $wer, $aufgabe);
    if ($recht >= RECHT_LESEN) $liste[] = aufgabeOeffentlich($event, $wer, $aufgabe, $recht);
  }
  return $liste;
}

function materialOeffentlich($event, $wer, $posten, $recht) {
  return array(
    'id' => $posten['id'],
    'name' => $posten['name'],
    'menge' => $posten['menge'],
    'einheit' => $posten['einheit'],
    'halter' => $posten['halter'],
    'notiz' => $posten['notiz'],
    'ziel' => zielBeschreibung($event, $wer, $posten['ziel']),
    'punktId' => materialPunktId($event, $posten),
    'recht' => $recht,
  );
}

function sichtbaresMaterial($event, $wer) {
  $liste = array();
  foreach ($event['material'] as $posten) {
    $recht = materialRecht($event, $wer, $posten);
    if ($recht >= RECHT_LESEN) $liste[] = materialOeffentlich($event, $wer, $posten, $recht);
  }
  return $liste;
}

/* Vergleichsschlüssel: Gross-/Kleinschreibung und überflüssige Leerzeichen spielen keine Rolle */
function materialSchluessel($text) {
  return mb_strtolower(trim(preg_replace('/\s+/u', ' ', $text)), 'UTF-8');
}

function mengeText($menge) {
  return floor($menge) == $menge ? (int) $menge : round($menge, 3);
}

/* Gesamtliste: Posten mit gleichem Namen und gleicher Einheit werden zusammengeführt und ihre Mengen summiert.
   Wird bei jeder Abfrage aus den (sichtbaren) Posten berechnet, nie gespeichert.
   Eingabe: Posten wie materialOeffentlich(). Halter '' steht für «ohne Zuordnung». */
function materialGesamtliste($posten) {
  $zeilen = array();
  foreach ($posten as $p) {
    $schluessel = materialSchluessel($p['name']) . '|' . materialSchluessel($p['einheit']);
    if (!isset($zeilen[$schluessel])) {
      $zeilen[$schluessel] = array(
        'name' => trim(preg_replace('/\s+/u', ' ', $p['name'])),
        'einheit' => trim(preg_replace('/\s+/u', ' ', $p['einheit'])),
        'menge' => 0,
        'halter' => array(),
        'notizen' => array(),
        'quellen' => array(),
        'posten' => array(),
      );
    }
    $zeile = &$zeilen[$schluessel];
    $zeile['menge'] += $p['menge'];
    $halter = $p['halter'];
    if (!isset($zeile['halter'][$halter])) $zeile['halter'][$halter] = 0;
    $zeile['halter'][$halter] += $p['menge'];
    if ($p['notiz'] !== '' && !in_array($p['notiz'], $zeile['notizen'], true)) $zeile['notizen'][] = $p['notiz'];
    $zeile['quellen'][] = $p['ziel'];
    $zeile['posten'][] = $p['id'];
    unset($zeile);
  }
  $liste = array();
  foreach ($zeilen as $zeile) {
    $halter = array();
    foreach ($zeile['halter'] as $personId => $menge) $halter[] = array('personId' => (string) $personId, 'menge' => mengeText($menge));
    /* Personen zuerst, «ohne Zuordnung» zuletzt */
    usort($halter, function ($a, $b) { return ($a['personId'] === '') - ($b['personId'] === ''); });
    $zeile['halter'] = $halter;
    $zeile['menge'] = mengeText($zeile['menge']);
    $liste[] = $zeile;
  }
  usort($liste, function ($a, $b) { return strcmp(materialSchluessel($a['name']), materialSchluessel($b['name'])); });
  return $liste;
}

/* Filter der Gesamtliste: halter '' (alle), 'ohne' (ohne Halter) oder eine Personen-ID; punktId '' oder ein Programmpunkt */
function materialFiltern($posten, $halter, $punktId) {
  return array_values(array_filter($posten, function ($p) use ($halter, $punktId) {
    if ($halter === 'ohne' && $p['halter'] !== '') return false;
    if ($halter !== '' && $halter !== 'ohne' && $p['halter'] !== $halter) return false;
    if ($punktId !== '' && $p['punktId'] !== $punktId) return false;
    return true;
  }));
}

/* Alles entfernen, was an einem gelöschten Ziel hängt (Programmpunkt, Ablaufschritt oder Aufgabe) */
function zielVerweiseEntfernen(&$event, $art, $id) {
  $passt = function ($ziel) use ($art, $id) {
    if ($art === 'programmpunkt') return $ziel['art'] !== 'event' && $ziel['art'] !== 'aufgabe' && $ziel['punkt_id'] === $id;
    if ($art === 'schritt') return $ziel['art'] === 'schritt' && $ziel['schritt_id'] === $id;
    return $ziel['art'] === 'aufgabe' && $ziel['aufgabe_id'] === $id;
  };
  $entfernt = array();
  foreach ($event['aufgaben'] as $aufgabe) {
    if ($passt($aufgabe['ziel'])) $entfernt[] = $aufgabe['id'];
  }
  $event['aufgaben'] = array_values(array_filter($event['aufgaben'], function ($a) use ($entfernt) { return !in_array($a['id'], $entfernt, true); }));
  $event['material'] = array_values(array_filter($event['material'], function ($m) use ($passt, $entfernt) {
    return !$passt($m['ziel']) && !($m['ziel']['art'] === 'aufgabe' && in_array($m['ziel']['aufgabe_id'], $entfernt, true));
  }));
}

