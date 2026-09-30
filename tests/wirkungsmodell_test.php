<?php
/* Wirkungsmodell: Nummern, erlaubte Pfeile, Löschen samt Pfeilen, Hinweise nach der Methode, Übernahme aus dem Event */

function testModell() {
  $m = wirkungsmodellLeer();
  $m['eintraege'] = array(
    wirkungsEintrag('grundlagen', 'Konzept', '', array('id' => 'g1')),
    wirkungsEintrag('leistungen', 'Camp', '', array('id' => 'l1', 'indikator' => 'Anzahl Teilnehmende')),
    wirkungsEintrag('outcomes', 'Glaubenszugang', '', array('id' => 'o1', 'indikator' => 'Umfrage')),
    wirkungsEintrag('leistungen', 'Events', '', array('id' => 'l2')),
    wirkungsEintrag('impacts', 'Kirche bleibt relevant', '', array('id' => 'i1')),
    wirkungsEintrag('outcomes', 'Beziehungsnetz', '', array('id' => 'o2', 'indikator' => 'Kontakte')),
  );
  return $m;
}

function test_nummern_folgen_der_reihenfolge_pro_spalte() {
  $n = wirkungsNummern(testModell());
  pruefeGleich(array('l1' => 'L1', 'o1' => 'O1', 'l2' => 'L2', 'i1' => 'I1', 'o2' => 'O2'), $n, 'Nummern');
}

function test_nur_leistung_zu_outcome_und_outcome_zu_impact() {
  $m = testModell();
  pruefe(wirkungsVerbindungErlaubt($m, 'l1', 'o1'), 'L zu O');
  pruefe(wirkungsVerbindungErlaubt($m, 'o1', 'i1'), 'O zu I');
  pruefe(!wirkungsVerbindungErlaubt($m, 'l1', 'i1'), 'L zu I nicht');
  pruefe(!wirkungsVerbindungErlaubt($m, 'o1', 'l1'), 'rückwärts nicht');
  pruefe(!wirkungsVerbindungErlaubt($m, 'g1', 'l1'), 'Grundlagen ohne Pfeile');
  pruefe(!wirkungsVerbindungErlaubt($m, 'l1', 'x'), 'unbekanntes Ziel');
}

function test_pfeile_setzen_loesen_und_beim_loeschen_entfernen() {
  $m = testModell();
  wirkungsVerbindungSetzen($m, 'l1', 'o1', true);
  wirkungsVerbindungSetzen($m, 'l1', 'o1', true);
  pruefeGleich(1, count($m['verbindungen']), 'kein Doppel');
  wirkungsVerbindungSetzen($m, 'o1', 'i1', true);
  wirkungsVerbindungSetzen($m, 'l1', 'o1', false);
  pruefeGleich(array(array('von' => 'o1', 'zu' => 'i1')), $m['verbindungen'], 'gelöst');
  wirkungsEintragEntfernen($m, 'o1');
  pruefeGleich(array(), $m['verbindungen'], 'Pfeile des gelöschten Eintrags weg');
  pruefeGleich(5, count($m['eintraege']), 'Eintrag weg');
}

function test_hinweise_nach_der_methode() {
  $m = testModell();
  wirkungsVerbindungSetzen($m, 'l1', 'o1', true);
  wirkungsVerbindungSetzen($m, 'o1', 'i1', true);
  $texte = array_map(function ($h) { return $h['text']; }, wirkungsHinweise($m));
  pruefe(in_array('L2 mündet in keine Wirkung bei den Zielgruppen.', $texte, true), 'L2 ohne Outcome');
  pruefe(in_array('L2 hat noch keinen Indikator (woran erkennen wir die Erfüllung?).', $texte, true), 'L2 ohne Indikator');
  pruefe(in_array('O2 wird von keiner Leistung erreicht.', $texte, true), 'O2 ohne Leistung');
  pruefe(in_array('O2 trägt zu keiner Wirkung im weiteren Umfeld bei.', $texte, true), 'O2 ohne Impact');
  foreach ($texte as $t) pruefe(strpos($t, 'L1') !== 0 && strpos($t, 'O1') !== 0 && strpos($t, 'I1') !== 0, 'vollständige Kette ohne Hinweis: ' . $t);
}

function test_uebernahme_aus_dem_event_ohne_doppel() {
  $event = testEventMitKonzept();
  $event['id'] = 'e1';
  $event['typ'] = 'camp';
  $event['titel'] = 'BeachCamp';
  $event['thema'] = '';
  $event['ort'] = 'Toskana';
  $event['start_datum'] = '2026-10-02';
  $event['end_datum'] = '2026-10-11';
  $event['tage'] = array(array('datum' => '2026-10-02'));
  $event['programmpunkte'] = array(testPunkt('p1', '2026-10-03T08:00', ''));
  $event['konzept']['ziele'][0]['pruefung']['grad'] = 'teilweise';
  $personen = array(array('id' => 'leitung', 'vorname' => 'Lea', 'name' => 'Leiterin'), array('id' => 'tl', 'vorname' => 'Tim', 'name' => 'Team'));
  $modell = wirkungsmodellLeer();
  $neu = wirkungsUebernehmen($modell, wirkungsVorschlag($event, $personen));
  pruefe($neu >= 5, 'mehrere Einträge übernommen');
  $ziel = array_values(array_filter($modell['eintraege'], function ($e) { return $e['spalte'] === 'outcomes'; }));
  pruefeGleich('Namensrunde am Sonntag', $ziel[0]['indikator'], 'Messkriterium als Indikator');
  pruefeGleich('teilweise', $ziel[0]['status'], 'Überprüfung als Status');
  pruefeGleich(0, wirkungsUebernehmen($modell, wirkungsVorschlag($event, $personen)), 'zweites Mal nichts doppelt');
}
