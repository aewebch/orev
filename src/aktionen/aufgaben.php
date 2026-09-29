<?php
/* Aufgaben (mit Vorbereitungsterminen) und Materialposten anlegen, ändern, löschen.
   Bearbeiten braucht das Recht «Aufgaben» bzw. «Material» für den Programmpunkt, an dem der Eintrag hängt
   (bei Verschieben an einen anderen Ort für beide). Den Status einer Aufgabe dürfen auch ihre Zuständigen setzen. */

/* Ziel aus der Eingabe prüfen: { art, punktId, schrittId, aufgabeId } → gespeicherte Form */
function zielPruefen($event, $eingabe, $erlaubt) {
  if (!is_array($eingabe) || !isset($eingabe['art']) || !in_array($eingabe['art'], $erlaubt, true)) fehler('Bitte wählen Sie, woran der Eintrag hängt.');
  $ziel = array('art' => $eingabe['art'], 'punkt_id' => null, 'schritt_id' => null, 'aufgabe_id' => null);
  if ($ziel['art'] === 'event') return $ziel;
  if ($ziel['art'] === 'aufgabe') {
    $id = isset($eingabe['aufgabeId']) ? (string) $eingabe['aufgabeId'] : '';
    if (aufgabeIndex($event, $id) === null) fehler('Aufgabe nicht gefunden.', 404);
    $ziel['aufgabe_id'] = $id;
    return $ziel;
  }
  $punktId = isset($eingabe['punktId']) ? (string) $eingabe['punktId'] : '';
  $p = programmpunktIndex($event, $punktId);
  if ($p === null) fehler('Programmpunkt nicht gefunden.', 404);
  $ziel['punkt_id'] = $punktId;
  if ($ziel['art'] === 'schritt') {
    $schrittId = isset($eingabe['schrittId']) ? (string) $eingabe['schrittId'] : '';
    if (ablaufschrittIndex($event['programmpunkte'][$p], $schrittId) === null) fehler('Ablaufschritt nicht gefunden.', 404);
    $ziel['schritt_id'] = $schrittId;
  }
  return $ziel;
}

function termineAufbereiten($eingabe, $alte) {
  if (!is_array($eingabe) || count($eingabe) > 50) fehler('Ungültige Vorbereitungstermine.');
  $bisher = array();
  foreach ($alte as $t) $bisher[$t['id']] = $t;
  $termine = array();
  foreach ($eingabe as $t) {
    if (!is_array($t)) fehler('Ungültige Vorbereitungstermine.');
    $termin = array(
      'start' => isset($t['start']) ? (string) $t['start'] : '',
      'ende' => isset($t['ende']) ? (string) $t['ende'] : '',
      'ort' => isset($t['ort']) ? (string) $t['ort'] : '',
      'notiz' => isset($t['notiz']) ? (string) $t['notiz'] : '',
    );
    if (!zeitpunktGueltig($termin['start'])) fehler('Bitte geben Sie bei jedem Vorbereitungstermin Datum und Startzeit an.');
    if ($termin['ende'] !== '' && (!zeitpunktGueltig($termin['ende']) || $termin['ende'] <= $termin['start'])) fehler('Das Ende eines Vorbereitungstermins muss nach dem Start liegen.');
    if (mb_strlen($termin['ort']) > 200 || mb_strlen($termin['notiz']) > 2000) fehler('Eine Angabe beim Vorbereitungstermin ist zu lang.');
    $id = isset($t['id']) ? (string) $t['id'] : '';
    if ($id !== '' && isset($bisher[$id])) {
      $alt = $bisher[$id];
      $geaendert = $alt['start'] !== $termin['start'] || $alt['ende'] !== $termin['ende'] || $alt['ort'] !== $termin['ort'] || $alt['notiz'] !== $termin['notiz'];
      $termine[] = array_merge($termin, array('id' => $id, 'sequenz' => $alt['sequenz'] + ($geaendert ? 1 : 0), 'geaendert_am' => $geaendert ? jetzt() : $alt['geaendert_am']));
    } else {
      $termine[] = array_merge($termin, array('id' => uuid(), 'sequenz' => 0, 'geaendert_am' => jetzt()));
    }
  }
  usort($termine, function ($a, $b) { return strcmp($a['start'], $b['start']); });
  return $termine;
}

function aktionAufgabeSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  $aufgabeId = (string) feld('id');
  $alt = null;
  if ($aufgabeId !== '') {
    $i = aufgabeIndex($event, $aufgabeId);
    if ($i === null) fehler('Aufgabe nicht gefunden.', 404);
    $alt = $event['aufgaben'][$i];
    pflichtRecht($event, $ich, 'aufgaben', RECHT_BEARBEITEN, aufgabePunktId($alt));
  }
  $ziel = zielPruefen($event, feld('ziel'), array('event', 'programmpunkt', 'schritt'));
  pflichtRecht($event, $ich, 'aufgaben', RECHT_BEARBEITEN, $ziel['punkt_id']);
  $felder = array(
    'titel' => (string) feld('titel'),
    'beschreibung' => (string) feld('beschreibung'),
    'faellig' => (string) feld('faellig'),
    'ziel' => $ziel,
  );
  if ($felder['titel'] === '' || mb_strlen($felder['titel']) > 200) fehler('Bitte geben Sie einen Titel an (höchstens 200 Zeichen).');
  if (mb_strlen($felder['beschreibung']) > 5000) fehler('Die Beschreibung ist zu lang.');
  if ($felder['faellig'] !== '' && !datumGueltig($felder['faellig'])) fehler('Ungültiges Fälligkeitsdatum.');
  list($felder['personen'], $felder['teams']) = zustaendigePruefen($event, feld('personen', array()), feld('teams', array()));
  $felder['termine'] = termineAufbereiten(feld('termine', array()), $alt ? $alt['termine'] : array());

  $neuId = $aufgabeId !== '' ? $aufgabeId : uuid();
  eventAendern($id, function (&$event) use ($aufgabeId, $neuId, $felder) {
    if ($aufgabeId === '') {
      $event['aufgaben'][] = array_merge($felder, array('id' => $neuId, 'status' => 'offen', 'erstellt_am' => jetzt(), 'geaendert_am' => jetzt(), 'sequenz' => 0));
      return;
    }
    $i = aufgabeIndex($event, $aufgabeId);
    if ($i === null) abbrechen('Aufgabe nicht gefunden.');
    $event['aufgaben'][$i] = array_merge($event['aufgaben'][$i], $felder, array('geaendert_am' => jetzt(), 'sequenz' => $event['aufgaben'][$i]['sequenz'] + 1));
  });

  $event = eventLesen($id);
  $jetzt = personenAusZustaendigen($event, $felder['personen'], $felder['teams']);
  $vorher = $alt ? personenAusZustaendigen($event, $alt['personen'], $alt['teams']) : array();
  $neuZugewiesen = array_values(array_diff($jetzt, $vorher));
  $titel = '«' . $felder['titel'] . '»';
  $link = '/event/' . $id . '/aufgaben';
  if ($neuZugewiesen) {
    benachrichtigen($event, $ich, array('schluessel' => 'aufgabe-zu-' . $neuId, 'text' => 'hat Ihnen die Aufgabe ' . $titel . ' zugewiesen', 'link' => $link, 'persoenlich' => $neuZugewiesen));
  }
  benachrichtigen($event, $ich, array(
    'schluessel' => 'aufgabe-' . $neuId,
    'text' => ($alt ? 'hat die Aufgabe ' . $titel . ' geändert' : 'hat die Aufgabe ' . $titel . ' erfasst'),
    'textPersoenlich' => 'hat Ihre Aufgabe ' . $titel . ' geändert',
    'link' => $link,
    'persoenlich' => array_values(array_intersect($vorher, $jetzt)),
    'auch' => array(),
    'ohne' => $neuZugewiesen,
    'sichtbar' => sichtbarMitRecht($event, 'aufgaben', $ziel['punkt_id']),
  ));
  $antwort = array('event' => eventOeffentlich($event, rechteKontext($ich), personenLesen()), 'aufgabeId' => $neuId);
  antwort($antwort);
}

function aktionAufgabeStatus() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  $aufgabeId = (string) feld('id');
  $i = aufgabeIndex($event, $aufgabeId);
  if ($i === null) fehler('Aufgabe nicht gefunden.', 404);
  $aufgabe = $event['aufgaben'][$i];
  $wer = rechteKontext($ich);
  if (effektivesRecht($event, $wer, 'aufgaben', aufgabePunktId($aufgabe)) < RECHT_BEARBEITEN && !istZustaendig($event, $ich['id'], $aufgabe['personen'], $aufgabe['teams'])) {
    fehler('Dafür fehlt Ihnen das Recht.', 403);
  }
  $status = feld('erledigt') === true ? 'erledigt' : 'offen';
  eventAendern($id, function (&$event) use ($aufgabeId, $status) {
    $i = aufgabeIndex($event, $aufgabeId);
    if ($i === null) abbrechen('Aufgabe nicht gefunden.');
    $event['aufgaben'][$i]['status'] = $status;
    $event['aufgaben'][$i]['geaendert_am'] = jetzt();
  });
  benachrichtigen($event, $ich, array(
    'schluessel' => 'aufgabe-status-' . $aufgabeId,
    'text' => 'hat die Aufgabe «' . $aufgabe['titel'] . '» ' . ($status === 'erledigt' ? 'als erledigt markiert' : 'wieder geöffnet'),
    'link' => '/event/' . $id . '/aufgaben',
    'persoenlich' => $aufgabe['personen'],
    'teams' => $aufgabe['teams'],
    'sichtbar' => sichtbarMitRecht($event, 'aufgaben', aufgabePunktId($aufgabe)),
  ));
  eventAntwort($id, $ich);
}

function aktionAufgabeLoeschen() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  $aufgabeId = (string) feld('id');
  $i = aufgabeIndex($event, $aufgabeId);
  if ($i === null) fehler('Aufgabe nicht gefunden.', 404);
  $aufgabe = $event['aufgaben'][$i];
  pflichtRecht($event, $ich, 'aufgaben', RECHT_BEARBEITEN, aufgabePunktId($aufgabe));
  eventAendern($id, function (&$event) use ($aufgabeId) {
    $event['aufgaben'] = array_values(array_filter($event['aufgaben'], function ($a) use ($aufgabeId) { return $a['id'] !== $aufgabeId; }));
    zielVerweiseEntfernen($event, 'aufgabe', $aufgabeId);
  });
  benachrichtigen($event, $ich, array(
    'schluessel' => 'aufgabe-' . $aufgabeId,
    'text' => 'hat die Aufgabe «' . $aufgabe['titel'] . '» gelöscht',
    'link' => '/event/' . $id . '/aufgaben',
    'persoenlich' => $aufgabe['personen'],
    'teams' => $aufgabe['teams'],
    'sichtbar' => sichtbarMitRecht($event, 'aufgaben', aufgabePunktId($aufgabe)),
  ));
  eventAntwort($id, $ich);
}

function aktionMaterialSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  $postenId = (string) feld('id');
  $alt = null;
  if ($postenId !== '') {
    $i = materialIndex($event, $postenId);
    if ($i === null) fehler('Materialposten nicht gefunden.', 404);
    $alt = $event['material'][$i];
    pflichtRecht($event, $ich, 'material', RECHT_BEARBEITEN, materialPunktId($event, $alt));
  }
  $ziel = zielPruefen($event, feld('ziel'), array('programmpunkt', 'schritt', 'aufgabe'));
  $felder = array(
    'name' => trim((string) feld('name')),
    'menge' => feld('menge', 1),
    'einheit' => trim((string) feld('einheit')),
    'halter' => (string) feld('halter'),
    'notiz' => (string) feld('notiz'),
    'ziel' => $ziel,
  );
  pflichtRecht($event, $ich, 'material', RECHT_BEARBEITEN, materialPunktId($event, $felder));
  if ($felder['name'] === '' || mb_strlen($felder['name']) > 120) fehler('Bitte geben Sie einen Namen an (höchstens 120 Zeichen).');
  if (!is_int($felder['menge']) && !is_float($felder['menge']) || $felder['menge'] <= 0 || $felder['menge'] > 100000) fehler('Die Menge muss grösser als 0 sein.');
  if (mb_strlen($felder['einheit']) > 30 || mb_strlen($felder['notiz']) > 500) fehler('Eine Angabe ist zu lang.');
  if ($felder['halter'] !== '' && mitgliedVon($event, $felder['halter']) === null) fehler('Wer das Material mitnimmt, muss zum Event gehören.');

  eventAendern($id, function (&$event) use ($postenId, $felder) {
    if ($postenId === '') {
      $event['material'][] = array_merge($felder, array('id' => uuid(), 'erstellt_am' => jetzt()));
      return;
    }
    $i = materialIndex($event, $postenId);
    if ($i === null) abbrechen('Materialposten nicht gefunden.');
    $event['material'][$i] = array_merge($event['material'][$i], $felder);
  });

  $event = eventLesen($id);
  $menge = mengeText($felder['menge']) . ($felder['einheit'] !== '' ? ' ' . $felder['einheit'] : '');
  $link = '/event/' . $id . '/material';
  if ($felder['halter'] !== '' && (!$alt || $alt['halter'] !== $felder['halter'] || $alt['menge'] != $felder['menge'] || $alt['name'] !== $felder['name'])) {
    benachrichtigen($event, $ich, array('schluessel' => 'material-halter', 'text' => 'hat eingetragen, dass Sie «' . $felder['name'] . '» mitnehmen (' . $menge . ')', 'link' => $link, 'persoenlich' => array($felder['halter'])));
  }
  if ($alt && $alt['halter'] !== '' && $alt['halter'] !== $felder['halter']) {
    benachrichtigen($event, $ich, array('schluessel' => 'material-halter', 'text' => 'hat «' . $alt['name'] . '» jemand anderem zugeteilt; Sie müssen es nicht mehr mitnehmen', 'link' => $link, 'persoenlich' => array($alt['halter'])));
  }
  benachrichtigen($event, $ich, array(
    'schluessel' => 'material',
    'text' => 'hat Material erfasst oder geändert, zuletzt «' . $felder['name'] . '»',
    'link' => $link,
    'ohne' => array_filter(array($felder['halter'], $alt ? $alt['halter'] : '')),
    'sichtbar' => sichtbarMitRecht($event, 'material', materialPunktId($event, $felder)),
  ));
  eventAntwort($id, $ich);
}

function aktionMaterialLoeschen() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  $postenId = (string) feld('id');
  $i = materialIndex($event, $postenId);
  if ($i === null) fehler('Materialposten nicht gefunden.', 404);
  $posten = $event['material'][$i];
  pflichtRecht($event, $ich, 'material', RECHT_BEARBEITEN, materialPunktId($event, $posten));
  eventAendern($id, function (&$event) use ($postenId) {
    $event['material'] = array_values(array_filter($event['material'], function ($m) use ($postenId) { return $m['id'] !== $postenId; }));
  });
  if ($posten['halter'] !== '') {
    benachrichtigen($event, $ich, array('schluessel' => 'material-halter', 'text' => 'hat «' . $posten['name'] . '» gestrichen; Sie müssen es nicht mehr mitnehmen', 'link' => '/event/' . $id . '/material', 'persoenlich' => array($posten['halter'])));
  }
  eventAntwort($id, $ich);
}

/* Gesamtliste mit Filtern, jedes Mal neu aus den sichtbaren Posten berechnet */
function aktionMaterialGesamtliste() {
  nurPost();
  $ich = pflichtAnmeldung();
  $event = eventFuerMitglied(eventIdAusEingabe(), $ich);
  $posten = materialFiltern(sichtbaresMaterial($event, rechteKontext($ich)), (string) feld('halter'), (string) feld('punktId'));
  antwort(array('liste' => materialGesamtliste($posten)));
}