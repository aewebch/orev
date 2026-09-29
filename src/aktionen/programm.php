<?php
/* Programmpunkte anlegen, ändern, verschieben, löschen und kopieren; Agenda-Zeitbereich; Programmvorlagen.
   Anlegen, Einfügen und Kopieren braucht das Programm-Recht «bearbeiten» für das ganze Event,
   Ändern, Verschieben und Löschen das Recht auf diesen einen Programmpunkt. */

/* Start und Ende prüfen; Punkte der Durchführung müssen in den Eventtagen beginnen */
function programmZeitenPruefen($event, $start, $ende, $phase) {
  if (!zeitpunktGueltig($start)) fehler('Bitte geben Sie Datum und Startzeit an.');
  if ($ende !== '' && (!zeitpunktGueltig($ende) || $ende <= $start)) fehler('Das Ende muss nach dem Start liegen.');
  $datum = substr($start, 0, 10);
  if ($phase === 'durchfuehrung' && ($datum < $event['start_datum'] || $datum > $event['end_datum'])) {
    fehler('Der Programmpunkt liegt ausserhalb des Events. Wählen Sie die Phase «Vorbereitung» (z. B. für einen Elternabend).');
  }
}

/* Personen müssen Mitglieder sein, Teams zum Event gehören; Doppelte fallen weg */
function zustaendigePruefen($event, $personen, $teams) {
  if (!is_array($personen) || !is_array($teams)) fehler('Ungültige Zuständige.');
  foreach ($personen as $personId) {
    if (!is_string($personId) || mitgliedVon($event, $personId) === null) fehler('Zuständige Personen müssen zum Event gehören.');
  }
  $teamIds = array_map(function ($t) { return $t['id']; }, $event['teams']);
  foreach ($teams as $teamId) {
    if (!in_array($teamId, $teamIds, true)) fehler('Unbekanntes Team.');
  }
  return array(array_values(array_unique($personen)), array_values(array_unique($teams)));
}

function programmpunktFelderPruefen($event) {
  $felder = array(
    'titel' => (string) feld('titel'),
    'beschreibung' => (string) feld('beschreibung'),
    'start' => (string) feld('start'),
    'ende' => (string) feld('ende'),
    'ort' => (string) feld('ort'),
    'phase' => feld('phase') === 'vorbereitung' ? 'vorbereitung' : 'durchfuehrung',
    'farbe' => farbeAusEingabe(feld('farbe')),
  );
  if ($felder['titel'] === '' || mb_strlen($felder['titel']) > 120) fehler('Bitte geben Sie einen Titel an (höchstens 120 Zeichen).');
  if (mb_strlen($felder['beschreibung']) > 5000 || mb_strlen($felder['ort']) > 200) fehler('Eine Angabe ist zu lang.');
  programmZeitenPruefen($event, $felder['start'], $felder['ende'], $felder['phase']);
  list($felder['personen'], $felder['teams']) = zustaendigePruefen($event, feld('personen', array()), feld('teams', array()));
  return $felder;
}

function programmpunktGeaendert(&$event, $i, $felder) {
  $event['programmpunkte'][$i] = array_merge($event['programmpunkte'][$i], $felder, array(
    'geaendert_am' => jetzt(),
    'sequenz' => $event['programmpunkte'][$i]['sequenz'] + 1,
  ));
}

function aktionProgrammpunktSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  $punktId = (string) feld('id');
  if ($punktId === '') {
    pflichtRecht($event, $ich, 'programm', RECHT_BEARBEITEN);
  } else {
    if (programmpunktIndex($event, $punktId) === null) fehler('Programmpunkt nicht gefunden.', 404);
    pflichtRecht($event, $ich, 'programm', RECHT_BEARBEITEN, $punktId);
  }
  $felder = programmpunktFelderPruefen($event);
  eventAendern($id, function (&$event) use ($punktId, $felder) {
    if ($punktId === '') {
      $event['programmpunkte'][] = array_merge($felder, array('id' => uuid(), 'ablauf' => ablaufLeer(), 'erstellt_am' => jetzt(), 'geaendert_am' => jetzt(), 'sequenz' => 0));
      return;
    }
    $i = programmpunktIndex($event, $punktId);
    if ($i === null) abbrechen('Programmpunkt nicht gefunden.');
    programmpunktGeaendert($event, $i, $felder);
  });
  eventAntwort($id, $ich);
}

/* Verschieben oder Länge ändern in der Agenda (Ziehen mit der Maus oder dem Finger) */
function aktionProgrammpunktVerschieben() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  $punktId = (string) feld('id');
  $i = programmpunktIndex($event, $punktId);
  if ($i === null) fehler('Programmpunkt nicht gefunden.', 404);
  pflichtRecht($event, $ich, 'programm', RECHT_BEARBEITEN, $punktId);
  $start = (string) feld('start');
  $ende = (string) feld('ende');
  programmZeitenPruefen($event, $start, $ende, $event['programmpunkte'][$i]['phase']);
  eventAendern($id, function (&$event) use ($punktId, $start, $ende) {
    $i = programmpunktIndex($event, $punktId);
    if ($i === null) abbrechen('Programmpunkt nicht gefunden.');
    programmpunktGeaendert($event, $i, array('start' => $start, 'ende' => $ende));
  });
  eventAntwort($id, $ich);
}

/* Neuer Punkt in der Agenda aus einer Vorlage oder als Kopie eines bestehenden Punkts dieses Events */
function aktionProgrammpunktEinfuegen() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  pflichtRecht($event, $ich, 'programm', RECHT_BEARBEITEN);
  $art = (string) feld('art');
  $quelleId = (string) feld('quelleId');
  $start = (string) feld('start');
  $ende = (string) feld('ende');
  if ($art === 'vorlage') {
    $quelle = null;
    foreach (programmvorlagenLesen() as $vorlage) {
      if ($vorlage['id'] === $quelleId) $quelle = $vorlage;
    }
    if ($quelle === null) fehler('Vorlage nicht gefunden.', 404);
    if (!zeitpunktGueltig($start)) fehler('Bitte geben Sie Datum und Startzeit an.');
    $neu = programmpunktAusVorlage($quelle, $start);
  } elseif ($art === 'punkt') {
    $i = programmpunktIndex($event, $quelleId);
    if ($i === null) fehler('Programmpunkt nicht gefunden.', 404);
    pflichtRecht($event, $ich, 'programm', RECHT_LESEN, $quelleId);
    if (!zeitpunktGueltig($start)) fehler('Bitte geben Sie Datum und Startzeit an.');
    $neu = programmpunktVerschoben($event['programmpunkte'][$i], $start);
    $neu['phase'] = 'durchfuehrung';
    /* Den Ablaufplan übernimmt nur, wer ihn auch lesen darf */
    if (effektivesRecht($event, rechteKontext($ich), 'ablauf', $quelleId) < RECHT_LESEN) $neu['ablauf'] = ablaufLeer();
  } else {
    fehler('Unbekannte Quelle.');
  }
  if ($ende !== '') $neu['ende'] = $ende;
  programmZeitenPruefen($event, $neu['start'], $neu['ende'], $neu['phase']);
  eventAendern($id, function (&$event) use ($neu) {
    $event['programmpunkte'][] = $neu;
  });
  antwort(array('event' => eventOeffentlich(eventLesen($id), rechteKontext($ich), personenLesen()), 'neuId' => $neu['id']));
}

function aktionProgrammpunktLoeschen() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  $punktId = (string) feld('id');
  if (programmpunktIndex($event, $punktId) === null) fehler('Programmpunkt nicht gefunden.', 404);
  pflichtRecht($event, $ich, 'programm', RECHT_BEARBEITEN, $punktId);
  eventAendern($id, function (&$event) use ($punktId) {
    programmpunktEntfernen($event, $punktId);
  });
  eventAntwort($id, $ich);
}

function aktionProgrammpunktKopieren() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  pflichtRecht($event, $ich, 'programm', RECHT_BEARBEITEN);
  $punktId = (string) feld('id');
  $daten = feld('daten', array());
  if (programmpunktIndex($event, $punktId) === null) fehler('Programmpunkt nicht gefunden.', 404);
  if (!is_array($daten) || !$daten || count($daten) > OREV_MAX_EVENT_TAGE) fehler('Bitte wählen Sie mindestens einen Tag.');
  foreach ($daten as $datum) {
    if (!datumGueltig($datum) || $datum < $event['start_datum'] || $datum > $event['end_datum']) fehler('Kopieren geht nur auf Tage des Events.');
  }
  eventAendern($id, function (&$event) use ($punktId, $daten) {
    $punkt = $event['programmpunkte'][programmpunktIndex($event, $punktId)];
    foreach (array_unique($daten) as $datum) {
      if ($datum !== substr($punkt['start'], 0, 10)) $event['programmpunkte'][] = programmpunktKopie($punkt, $datum);
    }
  });
  eventAntwort($id, $ich);
}

/* Sichtbarer Zeitbereich der Agenda; gilt für alle, die das Programm des Events ansehen */
function aktionAgendaSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  pflichtRecht(eventFuerMitglied($id, $ich), $ich, 'programm', RECHT_BEARBEITEN);
  $von = feld('von');
  $bis = feld('bis');
  if (!is_int($von) || !is_int($bis) || $von < 0 || $bis > 24 || $bis - $von < 1) fehler('Bitte wählen Sie einen gültigen Zeitbereich.');
  eventAendern($id, function (&$event) use ($von, $bis) {
    $event['agenda'] = array('von' => $von, 'bis' => $bis);
  });
  eventAntwort($id, $ich);
}

/* Vorlagen sehen alle Angemeldeten (zum Einfügen braucht es ohnehin das Programm-Recht);
   verwalten dürfen sie Installations-Admins und wer Events anlegen darf */
function aktionProgrammvorlagenListe() {
  nurPost();
  pflichtAnmeldung();
  $liste = array_map('vorlageOeffentlich', programmvorlagenLesen());
  usort($liste, function ($a, $b) { return strcasecmp($a['titel'], $b['titel']); });
  antwort(array('vorlagen' => $liste));
}

function pflichtVorlagenRecht() {
  $ich = pflichtAnmeldung();
  if (!darfEventsAnlegen($ich)) fehler('Vorlagen verwalten Installations-Admins und Personen, die Events anlegen dürfen.', 403);
  return $ich;
}

function aktionProgrammvorlageAusPunkt() {
  nurPost();
  $ich = pflichtVorlagenRecht();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  $punktId = (string) feld('id');
  $i = programmpunktIndex($event, $punktId);
  if ($i === null) fehler('Programmpunkt nicht gefunden.', 404);
  pflichtRecht($event, $ich, 'programm', RECHT_LESEN, $punktId);
  $punkt = $event['programmpunkte'][$i];
  if (effektivesRecht($event, rechteKontext($ich), 'ablauf', $punktId) < RECHT_LESEN) $punkt['ablauf'] = ablaufLeer();
  $vorlage = vorlageAusProgrammpunkt($punkt);
  programmvorlagenAendern(function (&$vorlagen) use ($vorlage) {
    if (count($vorlagen) >= 500) abbrechen('Es gibt bereits sehr viele Vorlagen. Bitte löschen Sie nicht mehr benötigte.');
    $vorlagen[] = $vorlage;
  });
  antwort(array('vorlage' => vorlageOeffentlich($vorlage)));
}

function aktionProgrammvorlageSpeichern() {
  nurPost();
  pflichtVorlagenRecht();
  $vorlageId = (string) feld('id');
  $felder = array(
    'titel' => (string) feld('titel'),
    'beschreibung' => (string) feld('beschreibung'),
    'dauer' => feld('dauer'),
    'ort' => (string) feld('ort'),
    'farbe' => farbeAusEingabe(feld('farbe')),
  );
  if ($felder['titel'] === '' || mb_strlen($felder['titel']) > 120) fehler('Bitte geben Sie einen Titel an (höchstens 120 Zeichen).');
  if (mb_strlen($felder['beschreibung']) > 5000 || mb_strlen($felder['ort']) > 200) fehler('Eine Angabe ist zu lang.');
  if (!is_int($felder['dauer']) || $felder['dauer'] < 0 || $felder['dauer'] > 24 * 60) fehler('Die Dauer muss zwischen 0 und 1440 Minuten liegen.');
  programmvorlagenAendern(function (&$vorlagen) use ($vorlageId, $felder) {
    if ($vorlageId === '') {
      $vorlagen[] = array_merge($felder, array('id' => uuid(), 'ablauf' => ablaufLeer(), 'erstellt_am' => jetzt()));
      return;
    }
    foreach ($vorlagen as $i => $v) {
      if ($v['id'] === $vorlageId) {
        $vorlagen[$i] = array_merge($v, $felder);
        return;
      }
    }
    abbrechen('Vorlage nicht gefunden.');
  });
  aktionProgrammvorlagenListe();
}

function aktionProgrammvorlageLoeschen() {
  nurPost();
  pflichtVorlagenRecht();
  $vorlageId = (string) feld('id');
  programmvorlagenAendern(function (&$vorlagen) use ($vorlageId) {
    $vorlagen = array_values(array_filter($vorlagen, function ($v) use ($vorlageId) { return $v['id'] !== $vorlageId; }));
  });
  aktionProgrammvorlagenListe();
}
