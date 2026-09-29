<?php
/* Programmpunkte eines Events. Zeiten sind lokale Zeit (Europe/Zurich) im Format JJJJ-MM-TTTHH:MM.
   Punkte dürfen sich überschneiden (Parallelprogramm). Wiederkehrende Punkte entstehen durch Kopieren auf weitere Tage.
   Jeder Programmpunkt hat genau einen Ablaufplan: Kopf (Leitung, Ziele) und eine geordnete Liste von Ablaufschritten. */

function zeitpunktGueltig($wert) {
  return is_string($wert) && preg_match('/^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):[0-5]\d$/', $wert, $teile) === 1 && datumGueltig($teile[1]);
}

function uhrzeitGueltig($wert) {
  return is_string($wert) && preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $wert) === 1;
}

function ablaufLeer() {
  return array('leitung' => array(), 'ziele' => '', 'schritte' => array());
}

function programmpunktIndex($event, $id) {
  foreach ($event['programmpunkte'] as $i => $punkt) {
    if ($punkt['id'] === $id) return $i;
  }
  return null;
}

function ablaufschrittIndex($punkt, $id) {
  foreach ($punkt['ablauf']['schritte'] as $i => $schritt) {
    if ($schritt['id'] === $id) return $i;
  }
  return null;
}

/* Neue Schritte mit Zeit landen nach dem letzten Schritt mit gleicher oder früherer Zeit (Schritte ohne Zeit zählen nicht), ohne Zeit am Ende */
function ablaufschrittEinfuegen(&$schritte, $schritt) {
  $position = count($schritte);
  if ($schritt['zeit'] !== '') {
    $position = 0;
    foreach ($schritte as $i => $s) {
      if ($s['zeit'] !== '' && $s['zeit'] <= $schritt['zeit']) $position = $i + 1;
    }
  }
  array_splice($schritte, $position, 0, array($schritt));
}

/* Ablaufschritte erhalten beim Kopieren neue IDs (spätere Aufgaben und Material hängen an der ID) */
function ablaufKopie($ablauf) {
  foreach ($ablauf['schritte'] as $i => $schritt) $ablauf['schritte'][$i]['id'] = uuid();
  return $ablauf;
}

/* Kopie an einen anderen Zeitpunkt: gleiche Dauer, gleiche Zuständige und gleicher Ablaufplan, neue ID */
function programmpunktVerschoben($punkt, $start) {
  $kopie = $punkt;
  $kopie['id'] = uuid();
  $kopie['start'] = $start;
  if ($punkt['ende'] !== '') {
    $dauer = (new DateTime($punkt['ende']))->getTimestamp() - (new DateTime($punkt['start']))->getTimestamp();
    $kopie['ende'] = (new DateTime($start))->modify('+' . (int) round($dauer / 60) . ' minutes')->format('Y-m-d\TH:i');
  }
  $kopie['ablauf'] = ablaufKopie($punkt['ablauf']);
  $kopie['erstellt_am'] = jetzt();
  $kopie['geaendert_am'] = jetzt();
  $kopie['sequenz'] = 0;
  return $kopie;
}

/* Kopie auf ein anderes Datum mit denselben Uhrzeiten */
function programmpunktKopie($punkt, $datum) {
  return programmpunktVerschoben($punkt, $datum . substr($punkt['start'], 10));
}

/* Alles, was auf einen gelöschten Programmpunkt verweist, mit entfernen */
function programmpunktEntfernen(&$event, $id) {
  $event['programmpunkte'] = array_values(array_filter($event['programmpunkte'], function ($p) use ($id) { return $p['id'] !== $id; }));
  foreach ($event['rollen'] as $i => $rolle) {
    $event['rollen'][$i]['rechte'] = array_values(array_filter($rolle['rechte'], function ($r) use ($id) { return $r['programmpunkt_id'] !== $id; }));
  }
  zielVerweiseEntfernen($event, 'programmpunkt', $id);
}

/* Eine Person verlässt das Event: aus Zuständigen, Ablauf-Leitung, «Wer» der Schritte und Aufgaben streichen;
   Material, das sie mitnehmen sollte, ist danach ohne Zuordnung */
function personAusProgrammEntfernen(&$event, $personId) {
  foreach ($event['programmpunkte'] as $i => $punkt) {
    $event['programmpunkte'][$i]['personen'] = array_values(array_diff($punkt['personen'], array($personId)));
    $event['programmpunkte'][$i]['ablauf']['leitung'] = array_values(array_diff($punkt['ablauf']['leitung'], array($personId)));
    foreach ($punkt['ablauf']['schritte'] as $j => $schritt) {
      $event['programmpunkte'][$i]['ablauf']['schritte'][$j]['wer']['personen'] = array_values(array_diff($schritt['wer']['personen'], array($personId)));
    }
  }
  foreach ($event['aufgaben'] as $i => $aufgabe) {
    $event['aufgaben'][$i]['personen'] = array_values(array_diff($aufgabe['personen'], array($personId)));
  }
  foreach ($event['material'] as $i => $posten) {
    if ($posten['halter'] === $personId) $event['material'][$i]['halter'] = '';
  }
}

function teamAusProgrammEntfernen(&$event, $teamId) {
  foreach ($event['programmpunkte'] as $i => $punkt) {
    $event['programmpunkte'][$i]['teams'] = array_values(array_diff($punkt['teams'], array($teamId)));
    foreach ($punkt['ablauf']['schritte'] as $j => $schritt) {
      $event['programmpunkte'][$i]['ablauf']['schritte'][$j]['wer']['teams'] = array_values(array_diff($schritt['wer']['teams'], array($teamId)));
    }
  }
  foreach ($event['aufgaben'] as $i => $aufgabe) {
    $event['aufgaben'][$i]['teams'] = array_values(array_diff($aufgabe['teams'], array($teamId)));
  }
}

function ablaufschrittOeffentlich($schritt) {
  return array(
    'id' => $schritt['id'],
    'zeit' => $schritt['zeit'],
    'abschnitt' => $schritt['abschnitt'],
    'titel' => $schritt['titel'],
    'beschreibung' => $schritt['beschreibung'],
    'methode' => $schritt['methode'],
    'anmerkung' => $schritt['anmerkung'],
    'wer' => array(
      'personen' => $schritt['wer']['personen'],
      'teams' => $schritt['wer']['teams'],
      'alle' => $schritt['wer']['alle'],
      'zusatz' => $schritt['wer']['zusatz'],
    ),
  );
}

function programmpunktOeffentlich($punkt, $recht, $rechtAblauf, $rechtAufgaben = 0, $rechtMaterial = 0) {
  return array(
    'id' => $punkt['id'],
    'titel' => $punkt['titel'],
    'beschreibung' => $punkt['beschreibung'],
    'start' => $punkt['start'],
    'ende' => $punkt['ende'],
    'ort' => $punkt['ort'],
    'phase' => $punkt['phase'],
    'farbe' => $punkt['farbe'],
    'personen' => $punkt['personen'],
    'teams' => $punkt['teams'],
    'recht' => $recht,
    'rechtAblauf' => $rechtAblauf,
    'rechtAufgaben' => $rechtAufgaben,
    'rechtMaterial' => $rechtMaterial,
    'ablauf' => $rechtAblauf >= RECHT_LESEN ? array(
      'leitung' => $punkt['ablauf']['leitung'],
      'ziele' => $punkt['ablauf']['ziele'],
      'schritte' => array_map('ablaufschrittOeffentlich', $punkt['ablauf']['schritte']),
    ) : null,
  );
}

/* Programmpunkte, die die Person sehen darf, chronologisch. Den Ablaufplan sieht, wer im Bereich «Ablaufpläne» lesen darf. */
function sichtbareProgrammpunkte($event, $wer) {
  $liste = array();
  foreach ($event['programmpunkte'] as $punkt) {
    $recht = effektivesRecht($event, $wer, 'programm', $punkt['id']);
    if ($recht >= RECHT_LESEN) $liste[] = programmpunktOeffentlich($punkt, $recht, effektivesRecht($event, $wer, 'ablauf', $punkt['id']),
      effektivesRecht($event, $wer, 'aufgaben', $punkt['id']), effektivesRecht($event, $wer, 'material', $punkt['id']));
  }
  usort($liste, function ($a, $b) { return strcmp($a['start'], $b['start']); });
  return $liste;
}

/* Programmvorlagen der Installation (Datei «programmvorlagen»): wiederverwendbare Punkte samt Ablaufplan,
   aber ohne Personen und Teams, weil diese zu einem bestimmten Event gehören. */
function programmvorlagenLesen() {
  $daten = speicherLesen('programmvorlagen', array('vorlagen' => array()));
  return $daten['vorlagen'];
}

function programmvorlagenAendern($aenderung) {
  return speicherAendern('programmvorlagen', array('vorlagen' => array()), function (&$daten) use ($aenderung) {
    return $aenderung($daten['vorlagen']);
  });
}

function vorlageAusProgrammpunkt($punkt) {
  $dauer = 60;
  if ($punkt['ende'] !== '') $dauer = (int) round(((new DateTime($punkt['ende']))->getTimestamp() - (new DateTime($punkt['start']))->getTimestamp()) / 60);
  $schritte = array();
  foreach ($punkt['ablauf']['schritte'] as $schritt) {
    $schritt['wer'] = array('personen' => array(), 'teams' => array(), 'alle' => $schritt['wer']['alle'], 'zusatz' => $schritt['wer']['zusatz']);
    $schritte[] = $schritt;
  }
  return array(
    'id' => uuid(),
    'titel' => $punkt['titel'],
    'beschreibung' => $punkt['beschreibung'],
    'dauer' => $dauer,
    'ort' => $punkt['ort'],
    'farbe' => $punkt['farbe'],
    'ablauf' => array('leitung' => array(), 'ziele' => $punkt['ablauf']['ziele'], 'schritte' => $schritte),
    'erstellt_am' => jetzt(),
  );
}

/* Neuer Programmpunkt aus einer Vorlage */
function programmpunktAusVorlage($vorlage, $start) {
  $ende = $vorlage['dauer'] > 0 ? (new DateTime($start))->modify('+' . $vorlage['dauer'] . ' minutes')->format('Y-m-d\TH:i') : '';
  return array(
    'id' => uuid(),
    'titel' => $vorlage['titel'],
    'beschreibung' => $vorlage['beschreibung'],
    'start' => $start,
    'ende' => $ende,
    'ort' => $vorlage['ort'],
    'phase' => 'durchfuehrung',
    'farbe' => $vorlage['farbe'],
    'personen' => array(),
    'teams' => array(),
    'ablauf' => ablaufKopie($vorlage['ablauf']),
    'erstellt_am' => jetzt(),
    'geaendert_am' => jetzt(),
    'sequenz' => 0,
  );
}

function vorlageOeffentlich($vorlage) {
  return array(
    'id' => $vorlage['id'],
    'titel' => $vorlage['titel'],
    'beschreibung' => $vorlage['beschreibung'],
    'dauer' => $vorlage['dauer'],
    'ort' => $vorlage['ort'],
    'farbe' => $vorlage['farbe'],
    'schritte' => count($vorlage['ablauf']['schritte']),
  );
}
