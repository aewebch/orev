<?php
/* Ablaufplan eines Programmpunkts: Kopf (Leitung, Ziele) und Ablaufschritte.
   Alles braucht das Recht «Ablaufpläne bearbeiten» für diesen Programmpunkt (ganzes Event oder nur dieser Punkt). */

function ablaufPunktPruefen($ich) {
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  $punktId = (string) feld('punktId');
  $i = programmpunktIndex($event, $punktId);
  if ($i === null) fehler('Programmpunkt nicht gefunden.', 404);
  pflichtRecht($event, $ich, 'ablauf', RECHT_BEARBEITEN, $punktId);
  return array($id, $event, $punktId);
}

/* Punkt im Event suchen und Änderung am Ablaufplan ausführen; der Punkt zählt danach als geändert (iCal) */
function ablaufAendern($id, $punktId, $aenderung) {
  eventAendern($id, function (&$event) use ($punktId, $aenderung) {
    $i = programmpunktIndex($event, $punktId);
    if ($i === null) abbrechen('Programmpunkt nicht gefunden.');
    $aenderung($event['programmpunkte'][$i]['ablauf']);
    $event['programmpunkte'][$i]['geaendert_am'] = jetzt();
    $event['programmpunkte'][$i]['sequenz']++;
  });
}

function aktionAblaufKopfSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  list($id, $event, $punktId) = ablaufPunktPruefen($ich);
  $ziele = (string) feld('ziele');
  if (mb_strlen($ziele) > 5000) fehler('Die Ziele sind zu lang.');
  list($leitung) = zustaendigePruefen($event, feld('leitung', array()), array());
  ablaufAendern($id, $punktId, function (&$ablauf) use ($leitung, $ziele) {
    $ablauf['leitung'] = $leitung;
    $ablauf['ziele'] = $ziele;
  });
  eventAntwort($id, $ich);
}

function ablaufschrittFelderPruefen($event) {
  $wer = feld('wer', array());
  if (!is_array($wer)) fehler('Ungültige Angabe bei «Wer».');
  $felder = array(
    'zeit' => (string) feld('zeit'),
    'abschnitt' => (string) feld('abschnitt'),
    'titel' => (string) feld('titel'),
    'beschreibung' => (string) feld('beschreibung'),
    'methode' => (string) feld('methode'),
    'anmerkung' => (string) feld('anmerkung'),
  );
  if ($felder['zeit'] !== '' && !uhrzeitGueltig($felder['zeit'])) fehler('Bitte geben Sie die Zeit als HH:MM an.');
  if ($felder['titel'] === '' || mb_strlen($felder['titel']) > 200) fehler('Bitte beschreiben Sie kurz, was geschieht (höchstens 200 Zeichen).');
  if (mb_strlen($felder['abschnitt']) > 80) fehler('Der Abschnitt ist zu lang.');
  foreach (array('beschreibung', 'methode', 'anmerkung') as $name) {
    if (mb_strlen($felder[$name]) > 5000) fehler('Eine Angabe ist zu lang.');
  }
  list($personen, $teams) = zustaendigePruefen($event,
    isset($wer['personen']) ? $wer['personen'] : array(),
    isset($wer['teams']) ? $wer['teams'] : array());
  $zusatz = isset($wer['zusatz']) ? (string) $wer['zusatz'] : '';
  if (mb_strlen($zusatz) > 200) fehler('Der Zusatz bei «Wer» ist zu lang.');
  $felder['wer'] = array('personen' => $personen, 'teams' => $teams, 'alle' => !empty($wer['alle']), 'zusatz' => $zusatz);
  return $felder;
}

function aktionAblaufschrittSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  list($id, $event, $punktId) = ablaufPunktPruefen($ich);
  $schrittId = (string) feld('id');
  $felder = ablaufschrittFelderPruefen($event);
  ablaufAendern($id, $punktId, function (&$ablauf) use ($schrittId, $felder) {
    if ($schrittId === '') {
      if (count($ablauf['schritte']) >= 200) abbrechen('Ein Ablaufplan hat höchstens 200 Schritte.');
      ablaufschrittEinfuegen($ablauf['schritte'], array_merge(array('id' => uuid()), $felder));
      return;
    }
    foreach ($ablauf['schritte'] as $i => $s) {
      if ($s['id'] === $schrittId) {
        $ablauf['schritte'][$i] = array_merge($s, $felder);
        return;
      }
    }
    abbrechen('Ablaufschritt nicht gefunden.');
  });
  eventAntwort($id, $ich);
}

function aktionAblaufschrittVerschieben() {
  nurPost();
  $ich = pflichtAnmeldung();
  list($id, , $punktId) = ablaufPunktPruefen($ich);
  $schrittId = (string) feld('id');
  $richtung = feld('richtung') === -1 ? -1 : 1;
  ablaufAendern($id, $punktId, function (&$ablauf) use ($schrittId, $richtung) {
    foreach ($ablauf['schritte'] as $i => $s) {
      if ($s['id'] !== $schrittId) continue;
      $ziel = $i + $richtung;
      if ($ziel < 0 || $ziel >= count($ablauf['schritte'])) return;
      $ablauf['schritte'][$i] = $ablauf['schritte'][$ziel];
      $ablauf['schritte'][$ziel] = $s;
      return;
    }
    abbrechen('Ablaufschritt nicht gefunden.');
  });
  eventAntwort($id, $ich);
}

function aktionAblaufschrittLoeschen() {
  nurPost();
  $ich = pflichtAnmeldung();
  list($id, , $punktId) = ablaufPunktPruefen($ich);
  $schrittId = (string) feld('id');
  ablaufAendern($id, $punktId, function (&$ablauf) use ($schrittId) {
    $ablauf['schritte'] = array_values(array_filter($ablauf['schritte'], function ($s) use ($schrittId) { return $s['id'] !== $schrittId; }));
  });
  eventAntwort($id, $ich);
}
