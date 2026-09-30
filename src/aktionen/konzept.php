<?php
/* Konzept (Ziele, Zielgruppe), Reflexion (Zielüberprüfung, Teamkultur) und persönliche Feedbacks */

function textFeld($name, $maximal, $bezeichnung) {
  $wert = (string) feld($name);
  if (mb_strlen($wert) > $maximal) fehler($bezeichnung . ' ist zu lang (höchstens ' . $maximal . ' Zeichen).');
  return $wert;
}

function zahlOderLeer($name, $maximal) {
  $wert = feld($name);
  if ($wert === null || $wert === '') return null;
  if (!is_int($wert) || $wert < 0 || $wert > $maximal) fehler('Bitte geben Sie eine ganze Zahl zwischen 0 und ' . $maximal . ' an.');
  return $wert;
}

function konzeptMelden($eventId, $ich, $schluessel, $text, $bereich) {
  $event = eventLesen($eventId);
  benachrichtigen($event, $ich, array('schluessel' => $schluessel, 'text' => $text, 'link' => '/event/' . $eventId . '/' . $bereich, 'sichtbar' => sichtbarMitRecht($event, $bereich)));
}

function aktionZielgruppeSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  pflichtRecht(eventFuerMitglied($id, $ich), $ich, 'konzept', RECHT_BEARBEITEN);
  $zielgruppe = array(
    'beschreibung' => textFeld('beschreibung', 5000, 'Die Beschreibung'),
    'alter_von' => zahlOderLeer('alterVon', 120),
    'alter_bis' => zahlOderLeer('alterBis', 120),
    'anzahl' => zahlOderLeer('anzahl', 100000),
    'besonderheiten' => textFeld('besonderheiten', 5000, 'Die Angabe zu Besonderheiten'),
  );
  if ($zielgruppe['alter_von'] !== null && $zielgruppe['alter_bis'] !== null && $zielgruppe['alter_bis'] < $zielgruppe['alter_von']) fehler('Das Höchstalter liegt unter dem Mindestalter.');
  eventAendern($id, function (&$event) use ($zielgruppe) {
    $event['konzept']['zielgruppe'] = $zielgruppe;
  });
  konzeptMelden($id, $ich, 'zielgruppe', 'hat die Zielgruppe beschrieben oder geändert', 'konzept');
  eventAntwort($id, $ich);
}

function aktionZielSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  pflichtRecht($event, $ich, 'konzept', RECHT_BEARBEITEN);
  $zielId = (string) feld('id');
  if ($zielId !== '' && zielIndex($event, $zielId) === null) fehler('Ziel nicht gefunden.', 404);
  $felder = array(
    'formulierung' => trim(textFeld('formulierung', 1000, 'Die Formulierung')),
    'messkriterium' => textFeld('messkriterium', 2000, 'Das Messkriterium'),
    'termin' => textFeld('termin', 200, 'Der Zeitbezug'),
    'erreichbarkeit' => textFeld('erreichbarkeit', 2000, 'Die Notiz zur Erreichbarkeit'),
    'relevanz' => textFeld('relevanz', 2000, 'Die Notiz zur Relevanz'),
  );
  if ($felder['formulierung'] === '') fehler('Bitte formulieren Sie das Ziel.');
  eventAendern($id, function (&$event) use ($zielId, $felder) {
    if ($zielId === '') {
      if (count($event['konzept']['ziele']) >= 50) abbrechen('Ein Event hat höchstens 50 Ziele.');
      $event['konzept']['ziele'][] = array_merge(array('id' => uuid()), $felder, array('pruefung' => pruefungLeer($felder['messkriterium'])));
      return;
    }
    $i = zielIndex($event, $zielId);
    if ($i === null) abbrechen('Ziel nicht gefunden.');
    $alt = $event['konzept']['ziele'][$i];
    /* Solange die Prüfung noch nicht geplant ist, folgt sie dem Messkriterium */
    if ($alt['pruefung']['wie'] === '' || $alt['pruefung']['wie'] === $alt['messkriterium']) $alt['pruefung']['wie'] = $felder['messkriterium'];
    $event['konzept']['ziele'][$i] = array_merge($alt, $felder);
  });
  konzeptMelden($id, $ich, 'ziele', 'hat die Ziele bearbeitet, zuletzt «' . mb_substr($felder['formulierung'], 0, 80) . '»', 'konzept');
  eventAntwort($id, $ich);
}

function aktionZielVerschieben() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  pflichtRecht(eventFuerMitglied($id, $ich), $ich, 'konzept', RECHT_BEARBEITEN);
  $zielId = (string) feld('id');
  $richtung = feld('richtung') === -1 ? -1 : 1;
  eventAendern($id, function (&$event) use ($zielId, $richtung) {
    $i = zielIndex($event, $zielId);
    if ($i === null) abbrechen('Ziel nicht gefunden.');
    $j = $i + $richtung;
    if ($j < 0 || $j >= count($event['konzept']['ziele'])) return;
    $tausch = $event['konzept']['ziele'][$j];
    $event['konzept']['ziele'][$j] = $event['konzept']['ziele'][$i];
    $event['konzept']['ziele'][$i] = $tausch;
  });
  eventAntwort($id, $ich);
}

function aktionZielLoeschen() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  pflichtRecht(eventFuerMitglied($id, $ich), $ich, 'konzept', RECHT_BEARBEITEN);
  $zielId = (string) feld('id');
  eventAendern($id, function (&$event) use ($zielId) {
    $event['konzept']['ziele'] = array_values(array_filter($event['konzept']['ziele'], function ($z) use ($zielId) { return $z['id'] !== $zielId; }));
  });
  konzeptMelden($id, $ich, 'ziele', 'hat ein Ziel gelöscht', 'konzept');
  eventAntwort($id, $ich);
}

function aktionZielPruefungSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  pflichtRecht($event, $ich, 'reflexion', RECHT_BEARBEITEN);
  $zielId = (string) feld('id');
  if (zielIndex($event, $zielId) === null) fehler('Ziel nicht gefunden.', 404);
  $pruefung = array(
    'wie' => textFeld('wie', 2000, 'Die Angabe, wie geprüft wird,'),
    'ergebnis' => textFeld('ergebnis', 5000, 'Das Ergebnis'),
    'grad' => (string) feld('grad'),
    'kommentar' => textFeld('kommentar', 5000, 'Der Kommentar'),
  );
  if ($pruefung['grad'] !== '' && !in_array($pruefung['grad'], zielgrade(), true)) fehler('Ungültiger Erreichungsgrad.');
  eventAendern($id, function (&$event) use ($zielId, $pruefung) {
    $i = zielIndex($event, $zielId);
    if ($i === null) abbrechen('Ziel nicht gefunden.');
    $event['konzept']['ziele'][$i]['pruefung'] = $pruefung;
  });
  konzeptMelden($id, $ich, 'zielpruefung', 'hat die Überprüfung der Ziele bearbeitet', 'reflexion');
  eventAntwort($id, $ich);
}

function aktionTeamkulturSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  pflichtRecht(eventFuerMitglied($id, $ich), $ich, 'reflexion', RECHT_BEARBEITEN);
  $text = textFeld('text', 20000, 'Die Auswertung');
  eventAendern($id, function (&$event) use ($text) {
    $event['reflexion']['teamkultur'] = $text;
  });
  konzeptMelden($id, $ich, 'teamkultur', 'hat die Auswertung der Teamkultur bearbeitet', 'reflexion');
  eventAntwort($id, $ich);
}

/* Feedback schreiben oder ändern. Neu schreiben darf jedes Mitglied; ändern nur die verfassende Person
   oder wer im Bereich «Feedback» bearbeiten darf. Der Inhalt erscheint nie in einer Benachrichtigung. */
function aktionFeedbackSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  $feedbackId = (string) feld('id');
  if ($feedbackId === '' && mitgliedVon($event, $ich['id']) === null) fehler('Feedback schreiben nur Mitglieder des Events.', 403);
  $an = (string) feld('an');
  $text = trim(textFeld('text', 10000, 'Das Feedback'));
  if ($text === '') fehler('Bitte schreiben Sie Ihr Feedback.');
  $vonId = $ich['id'];
  if ($feedbackId !== '') {
    $i = feedbackIndex($event, $feedbackId);
    if ($i === null) fehler('Feedback nicht gefunden.', 404);
    if (feedbackRecht($event, rechteKontext($ich), $event['feedbacks'][$i]) < RECHT_BEARBEITEN) fehler('Dafür fehlt Ihnen das Recht.', 403);
    $vonId = $event['feedbacks'][$i]['von'];
  }
  if ($an !== '' && (mitgliedVon($event, $an) === null || $an === $vonId)) fehler('Feedback an eine Person geht nur an andere Mitglieder des Events.');
  eventAendern($id, function (&$event) use ($feedbackId, $an, $text, $vonId) {
    if ($feedbackId === '') {
      $event['feedbacks'][] = array('id' => uuid(), 'von' => $vonId, 'an' => $an, 'text' => $text, 'erstellt_am' => jetzt(), 'geaendert_am' => jetzt());
      return;
    }
    $i = feedbackIndex($event, $feedbackId);
    if ($i === null) abbrechen('Feedback nicht gefunden.');
    $event['feedbacks'][$i]['an'] = $an;
    $event['feedbacks'][$i]['text'] = $text;
    $event['feedbacks'][$i]['geaendert_am'] = jetzt();
  });
  if ($feedbackId === '') {
    $nachher = eventLesen($id);
    benachrichtigen($nachher, $ich, array(
      'schluessel' => 'feedback', 'text' => 'hat ein Feedback geschrieben', 'link' => '/event/' . $id . '/feedback',
      'sichtbar' => sichtbarMitRecht($nachher, 'feedback'),
    ));
  }
  eventAntwort($id, $ich);
}

function aktionFeedbackLoeschen() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  $feedbackId = (string) feld('id');
  $i = feedbackIndex($event, $feedbackId);
  if ($i === null) fehler('Feedback nicht gefunden.', 404);
  if (feedbackRecht($event, rechteKontext($ich), $event['feedbacks'][$i]) < RECHT_BEARBEITEN) fehler('Dafür fehlt Ihnen das Recht.', 403);
  eventAendern($id, function (&$event) use ($feedbackId) {
    $event['feedbacks'] = array_values(array_filter($event['feedbacks'], function ($f) use ($feedbackId) { return $f['id'] !== $feedbackId; }));
  });
  eventAntwort($id, $ich);
}
