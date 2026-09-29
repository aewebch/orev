<?php
/* Benachrichtigungen: eine verschlüsselte Datei pro Person («benachrichtigungen/<personId>»).
   Wer etwas ändert, bekommt selbst keine Meldung. Alle anderen Mitglieder des Events erhalten eine Meldung, wenn
   - die Änderung sie persönlich betrifft (zugewiesen, Halter, Leitung, Rollen, Team …): «persönlich», oder
   - sie das Geänderte laut ihren Rechten sehen dürfen: «allgemein».
   Mehrere Änderungen derselben Person am selben Gegenstand innert einer Stunde werden zu einer Meldung zusammengefasst. */

define('OREV_MAX_BENACHRICHTIGUNGEN', 200);
define('OREV_ZUSAMMENFASSEN_SEKUNDEN', 3600);

function benachrichtigungenDatei($personId) {
  return 'benachrichtigungen/' . $personId;
}

function benachrichtigungenLesen($personId) {
  $daten = speicherLesen(benachrichtigungenDatei($personId), array('eintraege' => array()));
  return $daten['eintraege'];
}

function benachrichtigungenAendern($personId, $aenderung) {
  return speicherAendern(benachrichtigungenDatei($personId), array('eintraege' => array()), function (&$daten) use ($aenderung) {
    return $aenderung($daten['eintraege']);
  });
}

/* Neue Meldung vorn einfügen oder eine passende ungelesene zusammenfassen */
function benachrichtigungEintragen(&$eintraege, $meldung, $zeitstempel) {
  foreach ($eintraege as $i => $e) {
    if ($e['gelesen'] || $e['schluessel'] !== $meldung['schluessel'] || $e['von_id'] !== $meldung['von_id']) continue;
    if ($zeitstempel - $e['zeitstempel'] > OREV_ZUSAMMENFASSEN_SEKUNDEN) continue;
    $meldung['id'] = $e['id'];
    $meldung['persoenlich'] = $meldung['persoenlich'] || $e['persoenlich'];
    $meldung['anzahl'] = $e['anzahl'] + 1;
    array_splice($eintraege, $i, 1);
    array_unshift($eintraege, $meldung);
    return;
  }
  array_unshift($eintraege, $meldung);
  if (count($eintraege) > OREV_MAX_BENACHRICHTIGUNGEN) $eintraege = array_slice($eintraege, 0, OREV_MAX_BENACHRICHTIGUNGEN);
}

/* Wer eine Meldung bekommt und ob persönlich. Reine Funktion (ohne Speicher), damit sie testbar ist.
   $angaben: persoenlich (Personen-IDs), teams (deren Mitglieder gelten als persönlich betroffen),
   sichtbar (function ($wer) → bool), auch (Personen ausserhalb des Events, z. B. gerade entfernte),
   ohne (Personen, die schon eine eigene Meldung dazu erhalten haben). */
function benachrichtigungEmpfaenger($event, $akteurId, $angaben, $admins) {
  $persoenlich = personenAusZustaendigen($event, isset($angaben['persoenlich']) ? $angaben['persoenlich'] : array(), isset($angaben['teams']) ? $angaben['teams'] : array());
  $ohne = isset($angaben['ohne']) ? array_values($angaben['ohne']) : array();
  $empfaenger = array();
  foreach ($event['mitglieder'] as $mitglied) {
    $personId = $mitglied['person_id'];
    if ($personId === $akteurId || in_array($personId, $ohne, true)) continue;
    $wer = array('id' => $personId, 'istAdmin' => in_array($personId, $admins, true));
    if (in_array($personId, $persoenlich, true)) {
      $empfaenger[$personId] = true;
    } elseif (isset($angaben['sichtbar']) && call_user_func($angaben['sichtbar'], $wer)) {
      $empfaenger[$personId] = false;
    }
  }
  foreach (isset($angaben['auch']) ? $angaben['auch'] : array() as $personId) {
    if ($personId !== $akteurId) $empfaenger[$personId] = true;
  }
  return $empfaenger;
}

/* Meldung an alle Betroffenen verteilen.
   $angaben: schluessel, text (allgemein), textPersoenlich (optional), link, persoenlich, teams, sichtbar, auch */
function benachrichtigen($event, $akteur, $angaben) {
  $personen = personenLesen();
  $admins = array();
  foreach ($personen as $p) {
    if ($p['konto'] !== null && $p['konto']['ist_admin']) $admins[] = $p['id'];
  }
  $name = trim($akteur['vorname'] . ' ' . $akteur['name']);
  $zeitstempel = time();
  foreach (benachrichtigungEmpfaenger($event, $akteur['id'], $angaben, $admins) as $personId => $persoenlich) {
    $text = $persoenlich && isset($angaben['textPersoenlich']) ? $angaben['textPersoenlich'] : $angaben['text'];
    $meldung = array(
      'id' => uuid(),
      'zeit' => jetzt(),
      'zeitstempel' => $zeitstempel,
      'event_id' => $event['id'],
      'event_titel' => $event['titel'],
      'schluessel' => $angaben['schluessel'],
      'von_id' => $akteur['id'],
      'von' => $name,
      'text' => $text,
      'link' => $angaben['link'],
      'persoenlich' => $persoenlich,
      'anzahl' => 1,
      'gelesen' => false,
    );
    benachrichtigungenAendern($personId, function (&$eintraege) use ($meldung, $zeitstempel) {
      benachrichtigungEintragen($eintraege, $meldung, $zeitstempel);
    });
  }
}

/* Häufige Sichtbarkeiten: Recht in einem Bereich, optional für einen Programmpunkt */
function sichtbarMitRecht($event, $bereich, $programmpunktId = null) {
  return function ($wer) use ($event, $bereich, $programmpunktId) {
    return effektivesRecht($event, $wer, $bereich, $programmpunktId) >= RECHT_LESEN;
  };
}

function sichtbarFuerAlle() {
  return function ($wer) { return true; };
}

function benachrichtigungOeffentlich($e) {
  return array(
    'id' => $e['id'],
    'zeit' => $e['zeit'],
    'eventId' => $e['event_id'],
    'eventTitel' => $e['event_titel'],
    'von' => $e['von'],
    'text' => $e['text'],
    'link' => $e['link'],
    'persoenlich' => $e['persoenlich'],
    'anzahl' => $e['anzahl'],
    'gelesen' => $e['gelesen'],
  );
}

/* Kurzform für Texte: «Zmorge» (Sa 03.10., 08:30) */
function punktText($punkt) {
  return '«' . $punkt['titel'] . '» (' . zeitpunktText($punkt['start']) . ')';
}

/* Sa 03.10., 08:30 */
function zeitpunktText($zeitpunkt) {
  $tage = array('So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa');
  $datum = new DateTime(substr($zeitpunkt, 0, 10));
  return $tage[(int) $datum->format('w')] . ' ' . $datum->format('d.m.') . ', ' . substr($zeitpunkt, 11);
}
