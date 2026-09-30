<?php
/* Wirkungsmodell bearbeiten: Kopf, Einträge, Reihenfolge, Pfeile, Vorschlag aus den Eventdaten.
   Alles braucht das Recht «Reflexion bearbeiten». */

function wirkungsmodellAendern($eventId, $aenderung) {
  return eventAendern($eventId, function (&$event) use ($aenderung) {
    $ergebnis = $aenderung($event['wirkungsmodell'], $event);
    $event['wirkungsmodell']['geaendert_am'] = jetzt();
    return $ergebnis;
  });
}

function wirkungsPruefen($ich) {
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  pflichtRecht($event, $ich, 'reflexion', RECHT_BEARBEITEN);
  return array($id, $event);
}

function wirkungsMelden($id, $ich) {
  $event = eventLesen($id);
  benachrichtigen($event, $ich, array('schluessel' => 'wirkungsmodell', 'text' => 'hat das Wirkungsmodell bearbeitet', 'link' => '/event/' . $id . '/wirkungsmodell', 'sichtbar' => sichtbarMitRecht($event, 'reflexion')));
}

function aktionWirkungsKopfSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  list($id) = wirkungsPruefen($ich);
  $titel = textFeld('titel', 200, 'Der Titel');
  $verantwortung = textFeld('verantwortung', 200, 'Die Angabe zur Verantwortung');
  wirkungsmodellAendern($id, function (&$modell) use ($titel, $verantwortung) {
    $modell['titel'] = $titel;
    $modell['verantwortung'] = $verantwortung;
  });
  eventAntwort($id, $ich);
}

function aktionWirkungsEintragSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  list($id) = wirkungsPruefen($ich);
  $eintragId = (string) feld('id');
  $spalte = (string) feld('spalte');
  if (!in_array($spalte, wirkungsSpalten(), true)) fehler('Unbekannte Spalte.');
  $felder = array(
    'titel' => trim(textFeld('titel', 300, 'Der Titel')),
    'text' => textFeld('text', 10000, 'Der Text'),
    'indikator' => textFeld('indikator', 2000, 'Der Indikator'),
    'status' => (string) feld('status'),
  );
  if ($felder['titel'] === '' && trim($felder['text']) === '') fehler('Bitte geben Sie einen Titel oder einen Text ein.');
  if ($felder['status'] !== '' && !in_array($felder['status'], wirkungsStatus($spalte), true)) fehler('Ungültiger Status.');
  $neuId = $eintragId !== '' ? $eintragId : uuid();
  wirkungsmodellAendern($id, function (&$modell) use ($eintragId, $neuId, $spalte, $felder) {
    if ($eintragId === '') {
      if (count($modell['eintraege']) >= 300) abbrechen('Ein Wirkungsmodell hat höchstens 300 Einträge.');
      $modell['eintraege'][] = array_merge(array('id' => $neuId, 'spalte' => $spalte, 'quelle' => ''), $felder);
      return;
    }
    $i = wirkungsEintragIndex($modell, $eintragId);
    if ($i === null) abbrechen('Eintrag nicht gefunden.');
    if ($modell['eintraege'][$i]['spalte'] !== $spalte) abbrechen('Die Spalte eines Eintrags lässt sich nicht ändern.');
    $modell['eintraege'][$i] = array_merge($modell['eintraege'][$i], $felder);
  });
  wirkungsMelden($id, $ich);
  $event = eventLesen($id);
  antwort(array('event' => eventOeffentlich($event, rechteKontext($ich), personenLesen()), 'eintragId' => $neuId));
}

/* Innerhalb der Spalte eine Stelle nach oben oder unten (die Nummern L1, O1 … folgen der Reihenfolge) */
function aktionWirkungsEintragVerschieben() {
  nurPost();
  $ich = pflichtAnmeldung();
  list($id) = wirkungsPruefen($ich);
  $eintragId = (string) feld('id');
  $richtung = feld('richtung') === -1 ? -1 : 1;
  wirkungsmodellAendern($id, function (&$modell) use ($eintragId, $richtung) {
    $i = wirkungsEintragIndex($modell, $eintragId);
    if ($i === null) abbrechen('Eintrag nicht gefunden.');
    $spalte = $modell['eintraege'][$i]['spalte'];
    for ($j = $i + $richtung; $j >= 0 && $j < count($modell['eintraege']); $j += $richtung) {
      if ($modell['eintraege'][$j]['spalte'] !== $spalte) continue;
      $tausch = $modell['eintraege'][$j];
      $modell['eintraege'][$j] = $modell['eintraege'][$i];
      $modell['eintraege'][$i] = $tausch;
      return;
    }
  });
  eventAntwort($id, $ich);
}

function aktionWirkungsEintragLoeschen() {
  nurPost();
  $ich = pflichtAnmeldung();
  list($id) = wirkungsPruefen($ich);
  $eintragId = (string) feld('id');
  wirkungsmodellAendern($id, function (&$modell) use ($eintragId) {
    wirkungsEintragEntfernen($modell, $eintragId);
  });
  wirkungsMelden($id, $ich);
  eventAntwort($id, $ich);
}

function aktionWirkungsVerbindung() {
  nurPost();
  $ich = pflichtAnmeldung();
  list($id, $event) = wirkungsPruefen($ich);
  $von = (string) feld('von');
  $zu = (string) feld('zu');
  $an = feld('an') === true;
  if (!wirkungsVerbindungErlaubt($event['wirkungsmodell'], $von, $zu)) fehler('Pfeile führen von einer Leistung zu einer Wirkung bei den Zielgruppen oder von dort zu einer Wirkung im weiteren Umfeld.');
  wirkungsmodellAendern($id, function (&$modell) use ($von, $zu, $an) {
    wirkungsVerbindungSetzen($modell, $von, $zu, $an);
  });
  eventAntwort($id, $ich);
}

function aktionWirkungsUebernehmen() {
  nurPost();
  $ich = pflichtAnmeldung();
  list($id) = wirkungsPruefen($ich);
  $personen = personenLesen();
  $neu = wirkungsmodellAendern($id, function (&$modell, $event) use ($personen) {
    if ($modell['titel'] === '') $modell['titel'] = 'Wirkungsmodell ' . $event['titel'];
    return wirkungsUebernehmen($modell, wirkungsVorschlag($event, $personen));
  });
  if ($neu) wirkungsMelden($id, $ich);
  $event = eventLesen($id);
  antwort(array('event' => eventOeffentlich($event, rechteKontext($ich), $personen), 'neu' => $neu));
}
