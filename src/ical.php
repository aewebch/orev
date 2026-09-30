<?php
/* Kalender-Abo (iCal, RFC 5545): ein geheimer Link pro Person, ohne Anmeldung abrufbar (ical.php).
   Inhalt nur, was die Person betrifft und laut Rechten sehen darf:
   - Programmpunkte, bei denen sie direkt, über ein Team, in einem Ablaufschritt oder als Leitung des Ablaufplans
     eingetragen ist
     (Beschreibung mit Ort, eigenen Ablaufschritten, Aufgaben und mitzunehmendem Material),
   - jeder Vorbereitungstermin ihrer Aufgaben als eigener Eintrag,
   - auf Wunsch das ganze Programm ihrer Events.
   Stabile UIDs (pgm-<id>, prep-<id>), SEQUENCE und LAST-MODIFIED aus den Daten, Zeitzone Europe/Zurich. */

define('OREV_ICAL_ZONE', 'Europe/Zurich');

/* Text nach RFC 5545 maskieren: Backslash, Semikolon, Komma, Zeilenumbruch */
function icalText($text) {
  $text = str_replace(array("\r\n", "\r"), "\n", (string) $text);
  return str_replace(array('\\', ';', ',', "\n"), array('\\\\', '\\;', '\\,', '\\n'), $text);
}

/* Zeilen über 75 Bytes falten; Folgezeilen beginnen mit einem Leerzeichen. UTF-8-Zeichen werden nie zerteilt. */
function icalFalten($zeile) {
  $teile = array();
  $rest = $zeile;
  $grenze = 75;
  while (strlen($rest) > $grenze) {
    $stueck = mb_strcut($rest, 0, $grenze, 'UTF-8');
    $teile[] = $stueck;
    $rest = substr($rest, strlen($stueck));
    $grenze = 74;
  }
  $teile[] = $rest;
  return implode("\r\n ", $teile);
}

function icalZeile($name, $wert) {
  return icalFalten($name . ':' . $wert) . "\r\n";
}

/* 2026-10-03T08:30 → 20261003T083000 (lokale Zeit, mit TZID) */
function icalLokal($zeitpunkt) {
  return str_replace(array('-', ':'), '', $zeitpunkt) . '00';
}

/* ISO-Zeitpunkt mit Zeitzone → UTC-Format 20261003T063000Z */
function icalUtc($iso) {
  $zeit = new DateTime($iso !== '' ? $iso : 'now');
  $zeit->setTimezone(new DateTimeZone('UTC'));
  return $zeit->format('Ymd\THis\Z');
}

function icalPlusMinuten($zeitpunkt, $minuten) {
  return (new DateTime($zeitpunkt, new DateTimeZone(OREV_ICAL_ZONE)))->modify('+' . $minuten . ' minutes')->format('Y-m-d\TH:i');
}

function icalZeitzone() {
  return "BEGIN:VTIMEZONE\r\nTZID:Europe/Zurich\r\n"
    . "BEGIN:DAYLIGHT\r\nTZOFFSETFROM:+0100\r\nTZOFFSETTO:+0200\r\nTZNAME:CEST\r\nDTSTART:19700329T020000\r\nRRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU\r\nEND:DAYLIGHT\r\n"
    . "BEGIN:STANDARD\r\nTZOFFSETFROM:+0200\r\nTZOFFSETTO:+0100\r\nTZNAME:CET\r\nDTSTART:19701025T030000\r\nRRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU\r\nEND:STANDARD\r\n"
    . "END:VTIMEZONE\r\n";
}

/* Ist die Person bei einem Ablaufschritt dieses Punkts eingetragen (direkt oder über ein Team)? «Alle» zählt nicht. */
function icalImAblauf($event, $personId, $punkt) {
  foreach ($punkt['ablauf']['schritte'] as $s) {
    if (istZustaendig($event, $personId, $s['wer']['personen'], $s['wer']['teams'])) return true;
  }
  return false;
}

/* Beschreibung eines Programmpunkts: Ort, eigene Ablaufschritte, Aufgaben, mitzunehmendes Material */
function icalPunktBeschreibung($event, $wer, $punkt) {
  $zeilen = array();
  if ($punkt['beschreibung'] !== '') $zeilen[] = $punkt['beschreibung'];
  if ($punkt['ort'] !== '') $zeilen[] = 'Ort: ' . $punkt['ort'];
  if (effektivesRecht($event, $wer, 'ablauf', $punkt['id']) >= RECHT_LESEN) {
    $schritte = array();
    foreach ($punkt['ablauf']['schritte'] as $s) {
      if (istZustaendig($event, $wer['id'], $s['wer']['personen'], $s['wer']['teams'])) $schritte[] = trim($s['zeit'] . ' ' . $s['titel']);
    }
    if ($schritte) $zeilen[] = "Ihre Ablaufschritte:\n- " . implode("\n- ", $schritte);
  }
  $schrittIds = array_map(function ($s) { return $s['id']; }, $punkt['ablauf']['schritte']);
  $aufgaben = array();
  $aufgabenIds = array();
  foreach ($event['aufgaben'] as $a) {
    $hier = $a['ziel']['punkt_id'] === $punkt['id'] || ($a['ziel']['art'] === 'schritt' && in_array($a['ziel']['schritt_id'], $schrittIds, true));
    if (!$hier) continue;
    $aufgabenIds[] = $a['id'];
    if (istZustaendig($event, $wer['id'], $a['personen'], $a['teams'])) $aufgaben[] = $a['titel'] . ($a['status'] === 'erledigt' ? ' (erledigt)' : '');
  }
  if ($aufgaben) $zeilen[] = "Ihre Aufgaben:\n- " . implode("\n- ", $aufgaben);
  $material = array();
  foreach ($event['material'] as $m) {
    if ($m['halter'] !== $wer['id']) continue;
    $z = $m['ziel'];
    $hier = ($z['art'] !== 'aufgabe' && $z['punkt_id'] === $punkt['id']) || ($z['art'] === 'aufgabe' && in_array($z['aufgabe_id'], $aufgabenIds, true));
    if ($hier) $material[] = mengeText($m['menge']) . ($m['einheit'] !== '' ? ' ' . $m['einheit'] : ' x') . ' ' . $m['name'];
  }
  if ($material) $zeilen[] = "Bitte mitnehmen:\n- " . implode("\n- ", $material);
  return implode("\n\n", $zeilen);
}

/* Alle Einträge eines Events für eine Person. $wer wie rechteKontext(); Installations-Admins ausserhalb des Events
   erhalten nichts (der Feed zeigt nur Events, zu denen man gehört). */
function icalEintraege($event, $wer, $ganzesProgramm) {
  $eintraege = array();
  if (mitgliedVon($event, $wer['id']) === null) return $eintraege;
  foreach ($event['programmpunkte'] as $punkt) {
    if (effektivesRecht($event, $wer, 'programm', $punkt['id']) < RECHT_LESEN) continue;
    $betrifft = istZustaendig($event, $wer['id'], $punkt['personen'], $punkt['teams']) || icalImAblauf($event, $wer['id'], $punkt)
      || in_array($wer['id'], $punkt['ablauf']['leitung'], true);
    if (!$betrifft && !$ganzesProgramm) continue;
    $eintraege[] = array(
      'uid' => 'pgm-' . $punkt['id'],
      'start' => $punkt['start'],
      'ende' => $punkt['ende'] !== '' ? $punkt['ende'] : icalPlusMinuten($punkt['start'], 30),
      'titel' => $punkt['titel'],
      'ort' => $punkt['ort'],
      'beschreibung' => trim($event['titel'] . "\n\n" . icalPunktBeschreibung($event, $wer, $punkt)),
      'geaendert' => $punkt['geaendert_am'],
      'sequenz' => $punkt['sequenz'],
    );
  }
  foreach ($event['aufgaben'] as $a) {
    if (!istZustaendig($event, $wer['id'], $a['personen'], $a['teams'])) continue;
    foreach ($a['termine'] as $t) {
      $eintraege[] = array(
        'uid' => 'prep-' . $t['id'],
        'start' => $t['start'],
        'ende' => $t['ende'] !== '' ? $t['ende'] : icalPlusMinuten($t['start'], 60),
        'titel' => 'Vorbereitung: ' . $a['titel'],
        'ort' => $t['ort'],
        'beschreibung' => trim('Event: ' . $event['titel'] . ($t['notiz'] !== '' ? "\n\n" . $t['notiz'] : '')),
        'geaendert' => $t['geaendert_am'],
        'sequenz' => $t['sequenz'],
      );
    }
  }
  return $eintraege;
}

/* Ganzer Kalender als Text. $jetzt (UTC-Format) für DTSTAMP, damit Tests stabil bleiben. */
function icalKalender($eintraege, $name, $domain, $jetzt) {
  $text = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Orev//Kalender-Abo//DE\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n";
  $text .= icalZeile('X-WR-CALNAME', icalText($name));
  $text .= icalZeile('X-WR-TIMEZONE', OREV_ICAL_ZONE);
  $text .= "REFRESH-INTERVAL;VALUE=DURATION:PT1H\r\nX-PUBLISHED-TTL:PT1H\r\n";
  $text .= icalZeitzone();
  usort($eintraege, function ($a, $b) { return strcmp($a['start'], $b['start']); });
  foreach ($eintraege as $e) {
    $text .= "BEGIN:VEVENT\r\n";
    $text .= icalZeile('UID', $e['uid'] . '@' . $domain);
    $text .= icalZeile('DTSTAMP', $jetzt);
    $text .= icalZeile('LAST-MODIFIED', icalUtc($e['geaendert']));
    $text .= icalZeile('SEQUENCE', (string) (int) $e['sequenz']);
    $text .= icalZeile('DTSTART;TZID=' . OREV_ICAL_ZONE, icalLokal($e['start']));
    $text .= icalZeile('DTEND;TZID=' . OREV_ICAL_ZONE, icalLokal($e['ende']));
    $text .= icalZeile('SUMMARY', icalText($e['titel']));
    if ($e['ort'] !== '') $text .= icalZeile('LOCATION', icalText($e['ort']));
    if ($e['beschreibung'] !== '') $text .= icalZeile('DESCRIPTION', icalText($e['beschreibung']));
    $text .= "END:VEVENT\r\n";
  }
  return $text . "END:VCALENDAR\r\n";
}

/* Abo-Einstellungen einer Person (im Konto): Token und «ganzes Programm»; null = Standard der Installation */
function icalEinstellungen($person) {
  $standard = array('token' => '', 'ganzes_programm' => null, 'erzeugt_am' => '');
  if ($person['konto'] === null || !isset($person['konto']['ical'])) return $standard;
  return array_merge($standard, $person['konto']['ical']);
}

function icalGanzesProgramm($person, $einstellungen) {
  $ical = icalEinstellungen($person);
  return $ical['ganzes_programm'] !== null ? $ical['ganzes_programm'] : (bool) $einstellungen['ical_ganzes_programm'];
}

/* Person zum Token finden (Vergleich in konstanter Zeit); nur Personen mit Konto */
function icalPersonNachToken($personen, $token) {
  if (!is_string($token) || !preg_match('/^[A-Za-z0-9_-]{40,100}$/', $token)) return null;
  foreach ($personen as $p) {
    $ical = icalEinstellungen($p);
    if ($ical['token'] !== '' && hash_equals($ical['token'], $token)) return $p;
  }
  return null;
}
