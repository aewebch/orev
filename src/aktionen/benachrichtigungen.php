<?php
/* Benachrichtigungscenter: eigene Meldungen lesen, als gelesen markieren, leeren. Jede Person sieht nur ihre eigenen. */

function ungeleseneAnzahl($eintraege) {
  $anzahl = 0;
  foreach ($eintraege as $e) {
    if (!$e['gelesen']) $anzahl++;
  }
  return $anzahl;
}

function aktionBenachrichtigungenListe() {
  nurPost();
  $ich = pflichtAnmeldung();
  $eintraege = benachrichtigungenLesen($ich['id']);
  antwort(array('benachrichtigungen' => array_map('benachrichtigungOeffentlich', $eintraege), 'ungelesen' => ungeleseneAnzahl($eintraege)));
}

/* Nur die Zahl, für die regelmässige Abfrage im Menü */
function aktionBenachrichtigungenAnzahl() {
  nurPost();
  $ich = pflichtAnmeldung();
  antwort(array('ungelesen' => ungeleseneAnzahl(benachrichtigungenLesen($ich['id']))));
}

/* ids: bestimmte Meldungen; alle: true für alle */
function aktionBenachrichtigungenGelesen() {
  nurPost();
  $ich = pflichtAnmeldung();
  $ids = feld('ids', array());
  $alle = feld('alle') === true;
  if (!is_array($ids)) fehler('Ungültige Angabe.');
  $eintraege = benachrichtigungenAendern($ich['id'], function (&$eintraege) use ($ids, $alle) {
    foreach ($eintraege as $i => $e) {
      if ($alle || in_array($e['id'], $ids, true)) $eintraege[$i]['gelesen'] = true;
    }
    return $eintraege;
  });
  antwort(array('benachrichtigungen' => array_map('benachrichtigungOeffentlich', $eintraege), 'ungelesen' => ungeleseneAnzahl($eintraege)));
}

function aktionBenachrichtigungenLeeren() {
  nurPost();
  $ich = pflichtAnmeldung();
  benachrichtigungenAendern($ich['id'], function (&$eintraege) {
    $eintraege = array_values(array_filter($eintraege, function ($e) { return !$e['gelesen']; }));
  });
  aktionBenachrichtigungenListe();
}
