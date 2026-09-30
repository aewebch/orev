<?php
/* Wirkungsmodell (nach dem Quali-Tool von DOJ/AFAJ) als Bericht der Nachbereitung:
   fünf Spalten Grundlagen → Umsetzung → Leistungen (Outputs) → Wirkungen bei Zielgruppen (Outcomes) → Wirkungen im
   weiteren Umfeld (Impacts). Pfeile verbinden nur Leistungen mit Outcomes und Outcomes mit Impacts.
   Leistungen, Outcomes und Impacts werden nach ihrer Reihenfolge nummeriert (L1, O1, I1).
   Rechte: Bereich «Reflexion» (lesen: ansehen und drucken, bearbeiten: ändern). */

function wirkungsSpalten() {
  return array('grundlagen', 'umsetzung', 'leistungen', 'outcomes', 'impacts');
}

function wirkungsKuerzel() {
  return array('leistungen' => 'L', 'outcomes' => 'O', 'impacts' => 'I');
}

/* Statuswerte pro Spalte: Grundlagen und Umsetzung beschreiben einen Stand, Leistungen und Wirkungen ein Ergebnis */
function wirkungsStatus($spalte) {
  if ($spalte === 'grundlagen' || $spalte === 'umsetzung') return array('etabliert', 'aufbau', 'klaerung');
  return array('erreicht', 'teilweise', 'nicht', 'offen');
}

function wirkungsmodellLeer() {
  return array('titel' => '', 'verantwortung' => '', 'geaendert_am' => '', 'eintraege' => array(), 'verbindungen' => array());
}

function wirkungsEintragIndex($modell, $id) {
  foreach ($modell['eintraege'] as $i => $e) {
    if ($e['id'] === $id) return $i;
  }
  return null;
}

/* Kürzel wie L2 oder O1 aus der Reihenfolge innerhalb der Spalte; Grundlagen und Umsetzung ohne Kürzel */
function wirkungsNummern($modell) {
  $kuerzel = wirkungsKuerzel();
  $zaehler = array();
  $nummern = array();
  foreach ($modell['eintraege'] as $e) {
    if (!isset($kuerzel[$e['spalte']])) continue;
    $zaehler[$e['spalte']] = isset($zaehler[$e['spalte']]) ? $zaehler[$e['spalte']] + 1 : 1;
    $nummern[$e['id']] = $kuerzel[$e['spalte']] . $zaehler[$e['spalte']];
  }
  return $nummern;
}

/* Erlaubte Pfeile: Leistung → Outcome, Outcome → Impact */
function wirkungsVerbindungErlaubt($modell, $von, $zu) {
  $a = wirkungsEintragIndex($modell, $von);
  $b = wirkungsEintragIndex($modell, $zu);
  if ($a === null || $b === null) return false;
  $paar = $modell['eintraege'][$a]['spalte'] . '>' . $modell['eintraege'][$b]['spalte'];
  return $paar === 'leistungen>outcomes' || $paar === 'outcomes>impacts';
}

function wirkungsVerbindungSetzen(&$modell, $von, $zu, $an) {
  $modell['verbindungen'] = array_values(array_filter($modell['verbindungen'], function ($v) use ($von, $zu) { return !($v['von'] === $von && $v['zu'] === $zu); }));
  if ($an) $modell['verbindungen'][] = array('von' => $von, 'zu' => $zu);
}

function wirkungsEintragEntfernen(&$modell, $id) {
  $modell['eintraege'] = array_values(array_filter($modell['eintraege'], function ($e) use ($id) { return $e['id'] !== $id; }));
  $modell['verbindungen'] = array_values(array_filter($modell['verbindungen'], function ($v) use ($id) { return $v['von'] !== $id && $v['zu'] !== $id; }));
}

/* Hinweise nach der Methode: jede Leistung mündet in ein Outcome, jedes Outcome dient einem Impact und hat einen
   Indikator; Impacts ohne Outcome hängen in der Luft. */
function wirkungsHinweise($modell) {
  $nummern = wirkungsNummern($modell);
  $aus = array();
  $ein = array();
  foreach ($modell['verbindungen'] as $v) {
    $aus[$v['von']] = true;
    $ein[$v['zu']] = true;
  }
  $hinweise = array();
  foreach ($modell['eintraege'] as $e) {
    $n = isset($nummern[$e['id']]) ? $nummern[$e['id']] : '';
    if ($e['spalte'] === 'leistungen' && !isset($aus[$e['id']])) $hinweise[] = array('id' => $e['id'], 'text' => $n . ' mündet in keine Wirkung bei den Zielgruppen.');
    if ($e['spalte'] === 'outcomes' && !isset($ein[$e['id']])) $hinweise[] = array('id' => $e['id'], 'text' => $n . ' wird von keiner Leistung erreicht.');
    if ($e['spalte'] === 'outcomes' && !isset($aus[$e['id']])) $hinweise[] = array('id' => $e['id'], 'text' => $n . ' trägt zu keiner Wirkung im weiteren Umfeld bei.');
    if (($e['spalte'] === 'outcomes' || $e['spalte'] === 'leistungen') && trim($e['indikator']) === '') $hinweise[] = array('id' => $e['id'], 'text' => $n . ' hat noch keinen Indikator (woran erkennen wir die Erfüllung?).');
    if ($e['spalte'] === 'impacts' && !isset($ein[$e['id']])) $hinweise[] = array('id' => $e['id'], 'text' => $n . ' ist mit keinem Outcome verbunden.');
  }
  return $hinweise;
}

function wirkungsEintrag($spalte, $titel, $text, $angaben = array()) {
  return array_merge(array('id' => uuid(), 'spalte' => $spalte, 'titel' => $titel, 'text' => $text, 'indikator' => '', 'status' => '', 'quelle' => ''), $angaben);
}

/* Vorschlag aus den Eventdaten: Zielgruppe, Zeitraum, Leitung und Teams, Programm als Leistung, SMART-Ziele als
   Outcomes (Messkriterium als Indikator, Überprüfung als Status). Bereits übernommene Quellen werden nicht doppelt
   angelegt, damit sich das mehrfach ausführen lässt. */
function wirkungsVorschlag($event, $personen) {
  $namen = array();
  foreach ($personen as $p) $namen[$p['id']] = trim($p['vorname'] . ' ' . $p['name']);
  $vorschlag = array();
  $z = $event['konzept']['zielgruppe'];
  $gruppe = trim($z['beschreibung']);
  $alter = $z['alter_von'] !== null && $z['alter_bis'] !== null ? $z['alter_von'] . '–' . $z['alter_bis'] . ' Jahre' : '';
  $teile = array_filter(array($gruppe, $alter, $z['anzahl'] ? 'erwartet: ' . $z['anzahl'] . ' Personen' : '', trim($z['besonderheiten'])));
  if ($teile) $vorschlag[] = wirkungsEintrag('grundlagen', 'Zielgruppe', implode('. ', $teile), array('quelle' => 'zielgruppe'));
  $zeitraum = $event['start_datum'] === $event['end_datum'] ? $event['start_datum'] : $event['start_datum'] . ' bis ' . $event['end_datum'];
  $vorschlag[] = wirkungsEintrag('grundlagen', 'Geltungsbereich', trim(($event['typ'] === 'camp' ? 'Camp' : 'Event') . ' ' . $event['titel'] . ', ' . $zeitraum . ($event['ort'] !== '' ? ', ' . $event['ort'] : '') . ($event['thema'] !== '' ? '. Thema: ' . $event['thema'] : '')), array('quelle' => 'geltungsbereich'));

  $leitung = array();
  foreach ($event['mitglieder'] as $m) {
    if (istEventLeitung($event, $m['person_id']) && isset($namen[$m['person_id']])) $leitung[] = $namen[$m['person_id']];
  }
  if ($leitung) $vorschlag[] = wirkungsEintrag('umsetzung', 'Leitung', implode(', ', $leitung), array('quelle' => 'leitung', 'status' => 'etabliert'));
  foreach ($event['teams'] as $team) {
    $mitglieder = array();
    foreach ($team['mitglieder'] as $m) {
      if (isset($namen[$m['person_id']])) $mitglieder[] = $namen[$m['person_id']] . ($m['ist_leitung'] ? ' (Leitung)' : '');
    }
    $vorschlag[] = wirkungsEintrag('umsetzung', 'Team ' . $team['name'], implode(', ', $mitglieder), array('quelle' => 'team-' . $team['id']));
  }
  $vorschlag[] = wirkungsEintrag('umsetzung', 'Ressourcen', count($event['mitglieder']) . ' Mitwirkende, ' . count($event['tage']) . (count($event['tage']) === 1 ? ' Tag' : ' Tage'), array('quelle' => 'ressourcen'));

  $punkte = array_filter($event['programmpunkte'], function ($p) { return $p['phase'] === 'durchfuehrung'; });
  if ($punkte) {
    $titel = array();
    foreach ($punkte as $p) $titel[mb_strtolower($p['titel'])] = $p['titel'];
    $vorschlag[] = wirkungsEintrag('leistungen', 'Programm', count($punkte) . ' Programmpunkte, darunter ' . implode(', ', array_slice(array_values($titel), 0, 8)), array('quelle' => 'programm'));
  }
  foreach ($event['konzept']['ziele'] as $ziel) {
    $grad = $ziel['pruefung']['grad'];
    $vorschlag[] = wirkungsEintrag('outcomes', mb_substr($ziel['formulierung'], 0, 300), trim($ziel['pruefung']['ergebnis']),
      array('indikator' => $ziel['messkriterium'], 'status' => $grad !== '' ? $grad : 'offen', 'quelle' => 'ziel-' . $ziel['id']));
  }
  return $vorschlag;
}

function wirkungsUebernehmen(&$modell, $vorschlag) {
  $vorhanden = array();
  foreach ($modell['eintraege'] as $e) {
    if ($e['quelle'] !== '') $vorhanden[$e['quelle']] = true;
  }
  $neu = 0;
  foreach ($vorschlag as $e) {
    if (isset($vorhanden[$e['quelle']])) continue;
    $modell['eintraege'][] = $e;
    $neu++;
  }
  return $neu;
}

function wirkungsmodellOeffentlich($modell) {
  $nummern = wirkungsNummern($modell);
  return array(
    'titel' => $modell['titel'],
    'verantwortung' => $modell['verantwortung'],
    'geaendertAm' => $modell['geaendert_am'],
    'eintraege' => array_map(function ($e) use ($nummern) {
      return array('id' => $e['id'], 'spalte' => $e['spalte'], 'titel' => $e['titel'], 'text' => $e['text'], 'indikator' => $e['indikator'],
        'status' => $e['status'], 'nummer' => isset($nummern[$e['id']]) ? $nummern[$e['id']] : '');
    }, $modell['eintraege']),
    'verbindungen' => $modell['verbindungen'],
    'hinweise' => wirkungsHinweise($modell),
  );
}
