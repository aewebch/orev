<?php
/* Programmpunkte eines Events. Zeiten sind lokale Zeit (Europe/Zurich) im Format JJJJ-MM-TTTHH:MM.
   Punkte dürfen sich überschneiden (Parallelprogramm). Wiederkehrende Punkte entstehen durch Kopieren auf weitere Tage. */

function zeitpunktGueltig($wert) {
  return is_string($wert) && preg_match('/^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):[0-5]\d$/', $wert, $teile) === 1 && datumGueltig($teile[1]);
}

function programmpunktIndex($event, $id) {
  foreach ($event['programmpunkte'] as $i => $punkt) {
    if ($punkt['id'] === $id) return $i;
  }
  return null;
}

/* Kopie auf ein anderes Datum: gleiche Uhrzeiten, gleiche Zuständige, neue ID */
function programmpunktKopie($punkt, $datum) {
  $kopie = $punkt;
  $kopie['id'] = uuid();
  $kopie['start'] = $datum . substr($punkt['start'], 10);
  if ($punkt['ende'] !== '') {
    $tageSpaeter = (new DateTime(substr($punkt['start'], 0, 10)))->diff(new DateTime(substr($punkt['ende'], 0, 10)))->days;
    $kopie['ende'] = (new DateTime($datum))->modify('+' . $tageSpaeter . ' day')->format('Y-m-d') . substr($punkt['ende'], 10);
  }
  $kopie['erstellt_am'] = jetzt();
  $kopie['geaendert_am'] = jetzt();
  $kopie['sequenz'] = 0;
  return $kopie;
}

/* Alles, was auf einen gelöschten Programmpunkt verweist, mit entfernen */
function programmpunktEntfernen(&$event, $id) {
  $event['programmpunkte'] = array_values(array_filter($event['programmpunkte'], function ($p) use ($id) { return $p['id'] !== $id; }));
  foreach ($event['rollen'] as $i => $rolle) {
    $event['rollen'][$i]['rechte'] = array_values(array_filter($rolle['rechte'], function ($r) use ($id) { return $r['programmpunkt_id'] !== $id; }));
  }
}

function programmpunktOeffentlich($punkt, $recht) {
  return array(
    'id' => $punkt['id'],
    'titel' => $punkt['titel'],
    'beschreibung' => $punkt['beschreibung'],
    'start' => $punkt['start'],
    'ende' => $punkt['ende'],
    'ort' => $punkt['ort'],
    'phase' => $punkt['phase'],
    'personen' => $punkt['personen'],
    'teams' => $punkt['teams'],
    'recht' => $recht,
  );
}

/* Programmpunkte, die die Person sehen darf, chronologisch */
function sichtbareProgrammpunkte($event, $wer) {
  $liste = array();
  foreach ($event['programmpunkte'] as $punkt) {
    $recht = effektivesRecht($event, $wer, 'programm', $punkt['id']);
    if ($recht >= RECHT_LESEN) $liste[] = programmpunktOeffentlich($punkt, $recht);
  }
  usort($liste, function ($a, $b) { return strcmp($a['start'], $b['start']); });
  return $liste;
}
