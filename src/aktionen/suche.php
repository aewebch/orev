<?php
/* Suche und «Meine Aufgaben» über alle Events der Person. Beides arbeitet auf der rechtegefilterten Sicht
   (eventOeffentlich), findet also nur, was die Person ohnehin sehen darf. */

function sichtbareEvents($ich) {
  $events = array();
  foreach (speicherListe('events') as $name) {
    $event = speicherLesen($name, null);
    if ($event === null || (mitgliedVon($event, $ich['id']) === null && !istAdmin($ich))) continue;
    $events[] = $event;
  }
  return $events;
}

function sucheTreffer($texte, $suche) {
  foreach ($texte as $text) {
    if ($text !== '' && mb_strpos(mb_strtolower($text, 'UTF-8'), $suche) !== false) return true;
  }
  return false;
}

function aktionSuche() {
  nurPost();
  $ich = pflichtAnmeldung();
  $suche = mb_strtolower(trim((string) feld('suche')), 'UTF-8');
  if (mb_strlen($suche) < 2) antwort(array('treffer' => array()));
  $personen = personenLesen();
  $treffer = array();
  foreach (sichtbareEvents($ich) as $roh) {
    $event = eventOeffentlich($roh, rechteKontext($ich), $personen);
    $basis = '/event/' . $event['id'];
    $eventTitel = $event['titel'];
    $dazu = function ($art, $titel, $text, $link) use (&$treffer, $eventTitel) {
      $treffer[] = array('art' => $art, 'titel' => $titel, 'text' => $text, 'link' => $link, 'eventTitel' => $eventTitel);
    };
    if (sucheTreffer(array($event['titel'], $event['thema'], $event['ort']), $suche)) $dazu('event', $event['titel'], trim($event['thema'] . ' ' . $event['ort']), $basis);
    foreach ($event['programmpunkte'] as $p) {
      if (sucheTreffer(array($p['titel'], $p['ort'], $p['beschreibung']), $suche)) $dazu('programm', $p['titel'], zeitpunktText($p['start']) . ($p['ort'] !== '' ? ' · ' . $p['ort'] : ''), $basis . '/programm');
      if ($p['ablauf'] === null) continue;
      foreach ($p['ablauf']['schritte'] as $s) {
        if (sucheTreffer(array($s['titel'], $s['beschreibung'], $s['methode'], $s['anmerkung']), $suche)) $dazu('ablauf', $s['titel'], 'Ablaufplan «' . $p['titel'] . '»', $basis . '/ablauf/' . $p['id']);
      }
    }
    foreach ($event['aufgaben'] as $a) {
      if (sucheTreffer(array($a['titel'], $a['beschreibung']), $suche)) $dazu('aufgabe', $a['titel'], $a['status'] === 'erledigt' ? 'Aufgabe, erledigt' : 'Aufgabe, offen', $basis . '/aufgaben');
    }
    foreach ($event['materialGesamt'] as $m) {
      if (sucheTreffer(array($m['name']), $suche)) $dazu('material', $m['name'], 'Material, ' . $m['menge'] . ($m['einheit'] !== '' ? ' ' . $m['einheit'] : ''), $basis . '/material');
    }
    foreach ($event['personen'] as $p) {
      if (sucheTreffer(array($p['vorname'] . ' ' . $p['name'], $p['kuerzel']), $suche)) $dazu('person', trim($p['vorname'] . ' ' . $p['name']), $p['kuerzel'], $basis . '/personen');
    }
    if (count($treffer) >= 60) break;
  }
  antwort(array('treffer' => array_slice($treffer, 0, 60)));
}

/* Offene und erledigte Aufgaben, für die die Person zuständig ist, über alle Events */
function aktionMeineAufgaben() {
  nurPost();
  $ich = pflichtAnmeldung();
  $liste = array();
  foreach (sichtbareEvents($ich) as $event) {
    foreach (sichtbareAufgaben($event, rechteKontext($ich)) as $aufgabe) {
      if (!$aufgabe['meine']) continue;
      $aufgabe['eventId'] = $event['id'];
      $aufgabe['eventTitel'] = $event['titel'];
      $liste[] = $aufgabe;
    }
  }
  usort($liste, function ($a, $b) {
    $fa = $a['faellig'] !== '' ? $a['faellig'] : '9999';
    $fb = $b['faellig'] !== '' ? $b['faellig'] : '9999';
    return strcmp($fa, $fb);
  });
  antwort(array('aufgaben' => $liste));
}
