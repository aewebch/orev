<?php
/* Konzept (SMART-Ziele, Zielgruppe) und Nachbereitung (Zielüberprüfung, Teamkultur, persönliche Feedbacks).
   Ziele sind im Bereich «Konzept», ihre Überprüfung und die Teamkultur im Bereich «Reflexion».
   Feedbacks sind vertraulich: Die verfassende Person sieht und ändert ihre eigenen immer, alle anderen brauchen das
   Recht im Bereich «Feedback» (lesen: ansehen, bearbeiten: ändern und löschen). Die Event-Leitung hat es immer. */

function konzeptLeer() {
  return array(
    'ziele' => array(),
    'zielgruppe' => array('beschreibung' => '', 'alter_von' => null, 'alter_bis' => null, 'anzahl' => null, 'besonderheiten' => ''),
  );
}

function reflexionLeer() {
  return array('teamkultur' => '');
}

function pruefungLeer($messkriterium) {
  /* Wie geprüft wird, ist vorab planbar und wird aus dem Messkriterium vorbelegt */
  return array('wie' => $messkriterium, 'ergebnis' => '', 'grad' => '', 'kommentar' => '');
}

function zielgrade() {
  return array('erreicht', 'teilweise', 'nicht');
}

function zielIndex($event, $id) {
  foreach ($event['konzept']['ziele'] as $i => $ziel) {
    if ($ziel['id'] === $id) return $i;
  }
  return null;
}

function feedbackIndex($event, $id) {
  foreach ($event['feedbacks'] as $i => $f) {
    if ($f['id'] === $id) return $i;
  }
  return null;
}

/* Recht auf einen Feedback-Eintrag: eigene immer bearbeiten, sonst das Recht im Bereich «Feedback» */
function feedbackRecht($event, $wer, $feedback) {
  if ($feedback['von'] === $wer['id']) return RECHT_BEARBEITEN;
  return effektivesRecht($event, $wer, 'feedback');
}

function sichtbareFeedbacks($event, $wer) {
  $liste = array();
  foreach ($event['feedbacks'] as $f) {
    $recht = feedbackRecht($event, $wer, $f);
    if ($recht < RECHT_LESEN) continue;
    $liste[] = array(
      'id' => $f['id'], 'von' => $f['von'], 'an' => $f['an'], 'text' => $f['text'],
      'erstelltAm' => $f['erstellt_am'], 'geaendertAm' => $f['geaendert_am'],
      'eigenes' => $f['von'] === $wer['id'], 'recht' => $recht,
    );
  }
  usort($liste, function ($a, $b) { return strcmp($b['erstelltAm'], $a['erstelltAm']); });
  return $liste;
}

/* Sicht auf Konzept und Reflexion: Ziele sieht, wer Konzept oder Reflexion lesen darf; die Überprüfung nur mit Reflexion */
function konzeptOeffentlich($event, $wer) {
  $konzept = effektivesRecht($event, $wer, 'konzept');
  $reflexion = effektivesRecht($event, $wer, 'reflexion');
  $sicht = array('ziele' => array(), 'zielgruppe' => null, 'teamkultur' => null);
  if ($konzept >= RECHT_LESEN || $reflexion >= RECHT_LESEN) {
    foreach ($event['konzept']['ziele'] as $ziel) {
      $eintrag = array(
        'id' => $ziel['id'], 'formulierung' => $ziel['formulierung'], 'messkriterium' => $ziel['messkriterium'],
        'termin' => $ziel['termin'], 'erreichbarkeit' => $ziel['erreichbarkeit'], 'relevanz' => $ziel['relevanz'],
        'pruefung' => null,
      );
      if ($reflexion >= RECHT_LESEN) $eintrag['pruefung'] = $ziel['pruefung'];
      $sicht['ziele'][] = $eintrag;
    }
  }
  if ($konzept >= RECHT_LESEN) {
    $z = $event['konzept']['zielgruppe'];
    $sicht['zielgruppe'] = array('beschreibung' => $z['beschreibung'], 'alterVon' => $z['alter_von'], 'alterBis' => $z['alter_bis'], 'anzahl' => $z['anzahl'], 'besonderheiten' => $z['besonderheiten']);
  }
  if ($reflexion >= RECHT_LESEN) $sicht['teamkultur'] = $event['reflexion']['teamkultur'];
  return $sicht;
}

/* Wie viele Ziele erreicht, teilweise, nicht erreicht oder noch offen sind */
function zielBilanz($ziele) {
  $bilanz = array('erreicht' => 0, 'teilweise' => 0, 'nicht' => 0, 'offen' => 0);
  foreach ($ziele as $ziel) {
    $grad = $ziel['pruefung']['grad'];
    $bilanz[$grad !== '' ? $grad : 'offen']++;
  }
  return $bilanz;
}
