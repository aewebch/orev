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

/* Leitung des Plans und die im Schritt Eingetragenen persönlich, alle mit Leserecht auf den Plan allgemein.
   Mehrere Änderungen am selben Plan innert einer Stunde ergeben eine Meldung. */
function ablaufMelden($id, $ich, $punktId, $text, $personen, $teams) {
  $event = eventLesen($id);
  $i = programmpunktIndex($event, $punktId);
  if ($i === null) return;
  $punkt = $event['programmpunkte'][$i];
  benachrichtigen($event, $ich, array(
    'schluessel' => 'ablauf-' . $punktId,
    'text' => $text . ' im Ablaufplan von ' . punktText($punkt),
    'link' => '/event/' . $id . '/ablauf/' . $punktId,
    'persoenlich' => array_merge($punkt['ablauf']['leitung'], $personen),
    'teams' => $teams,
    'sichtbar' => sichtbarMitRecht($event, 'ablauf', $punktId),
  ));
}

function schrittVon($event, $punktId, $schrittId) {
  $punkt = $event['programmpunkte'][programmpunktIndex($event, $punktId)];
  $s = ablaufschrittIndex($punkt, $schrittId);
  return $s === null ? null : $punkt['ablauf']['schritte'][$s];
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
  $vorher = $event['programmpunkte'][programmpunktIndex($event, $punktId)]['ablauf']['leitung'];
  ablaufMelden($id, $ich, $punktId, 'hat Leitung oder Ziele geändert', $vorher, array());
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
  $alt = $schrittId === '' ? null : schrittVon($event, $punktId, $schrittId);
  ablaufMelden($id, $ich, $punktId, ($alt ? 'hat den Schritt «' . $felder['titel'] . '» geändert' : 'hat den Schritt «' . $felder['titel'] . '» ergänzt'),
    array_merge($felder['wer']['personen'], $alt ? $alt['wer']['personen'] : array()),
    array_merge($felder['wer']['teams'], $alt ? $alt['wer']['teams'] : array()));
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
  list($id, $event, $punktId) = ablaufPunktPruefen($ich);
  $schrittId = (string) feld('id');
  $alt = schrittVon($event, $punktId, $schrittId);
  if ($alt === null) fehler('Ablaufschritt nicht gefunden.', 404);
  /* Schritt und alles, was daran hängt (Aufgaben, Material), in einem Schreibvorgang entfernen */
  eventAendern($id, function (&$event) use ($punktId, $schrittId) {
    $i = programmpunktIndex($event, $punktId);
    if ($i === null) abbrechen('Programmpunkt nicht gefunden.');
    $event['programmpunkte'][$i]['ablauf']['schritte'] = array_values(array_filter($event['programmpunkte'][$i]['ablauf']['schritte'], function ($s) use ($schrittId) { return $s['id'] !== $schrittId; }));
    $event['programmpunkte'][$i]['geaendert_am'] = jetzt();
    $event['programmpunkte'][$i]['sequenz']++;
    zielVerweiseEntfernen($event, 'schritt', $schrittId);
  });
  ablaufMelden($id, $ich, $punktId, 'hat den Schritt «' . $alt['titel'] . '» gelöscht', $alt['wer']['personen'], $alt['wer']['teams']);
  eventAntwort($id, $ich);
}
