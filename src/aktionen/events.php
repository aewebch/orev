<?php
/* Events, Eventtage, Mitglieder, Teams und Rollen. Jede Aktion prüft ihr Recht über effektivesRecht(). */

function eventIdAusEingabe() {
  $id = (string) feld('eventId');
  if (!istUuid($id)) fehler('Event nicht gefunden.', 404);
  return $id;
}

function eventFelderPruefen() {
  $felder = array(
    'typ' => feld('typ') === 'camp' ? 'camp' : 'event',
    'titel' => (string) feld('titel'),
    'thema' => (string) feld('thema'),
    'ort' => (string) feld('ort'),
    'start_datum' => (string) feld('startDatum'),
    'end_datum' => (string) feld('endDatum'),
    'beschreibung' => (string) feld('beschreibung'),
  );
  if ($felder['titel'] === '' || mb_strlen($felder['titel']) > 120) fehler('Bitte geben Sie einen Titel an (höchstens 120 Zeichen).');
  if (mb_strlen($felder['thema']) > 200 || mb_strlen($felder['ort']) > 200 || mb_strlen($felder['beschreibung']) > 5000) fehler('Eine Angabe ist zu lang.');
  if (!datumGueltig($felder['start_datum']) || !datumGueltig($felder['end_datum'])) fehler('Bitte geben Sie Start- und Enddatum an.');
  if ($felder['end_datum'] < $felder['start_datum']) fehler('Das Enddatum liegt vor dem Startdatum.');
  $tage = (new DateTime($felder['start_datum']))->diff(new DateTime($felder['end_datum']))->days + 1;
  if ($tage > OREV_MAX_EVENT_TAGE) fehler('Ein Event dauert höchstens ' . OREV_MAX_EVENT_TAGE . ' Tage.');
  return $felder;
}

function eventAntwort($eventId, $person) {
  $event = eventLesen($eventId);
  antwort(array('event' => eventOeffentlich($event, rechteKontext($person), personenLesen())));
}

function aktionEventsListe() {
  $ich = pflichtAnmeldung();
  $liste = array();
  foreach (speicherListe('events') as $name) {
    $event = speicherLesen($name, null);
    if ($event === null || (mitgliedVon($event, $ich['id']) === null && !istAdmin($ich))) continue;
    $eintrag = eventKurz($event);
    $eintrag['rollen'] = array_map(function ($r) { return $r['name']; }, rollenVon($event, $ich['id']));
    $eintrag['teams'] = array_map(function ($t) { return $t['name']; }, teamsVonPerson($event, $ich['id']));
    $liste[] = $eintrag;
  }
  antwort(array('events' => $liste));
}

function aktionEventAnlegen() {
  nurPost();
  $ich = pflichtAnmeldung();
  if (!darfEventsAnlegen($ich)) fehler('Sie dürfen keine Events anlegen.', 403);
  $event = neuesEvent(eventFelderPruefen(), $ich['id'], einstellungenLesen()['rollenvorlagen']);
  speicherSchreiben('events/' . $event['id'], $event);
  antwort(array('id' => $event['id']));
}

function aktionEventLaden() {
  $ich = pflichtAnmeldung();
  $event = eventFuerMitglied(eventIdAusEingabe(), $ich);
  antwort(array('event' => eventOeffentlich($event, rechteKontext($ich), personenLesen())));
}

function aktionEventSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $felder = eventFelderPruefen();
  pflichtRecht(eventFuerMitglied($id, $ich), $ich, 'stammdaten', RECHT_BEARBEITEN);
  eventAendern($id, function (&$event) use ($felder) {
    $event = array_merge($event, $felder);
    $event['tage'] = eventTageErzeugen($felder['start_datum'], $felder['end_datum'], $event['tage']);
  });
  eventAntwort($id, $ich);
}

function aktionEventLoeschen() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  pflichtEventLeitung(eventFuerMitglied($id, $ich), $ich);
  speicherLoeschen('events/' . $id);
  antwort(array('ok' => true));
}

function aktionTagSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  pflichtRecht($event, $ich, 'stammdaten', RECHT_BEARBEITEN);
  $datum = (string) feld('datum');
  $thema = (string) feld('thema');
  $verantwortliche = feld('verantwortliche', array());
  if (mb_strlen($thema) > 200) fehler('Das Tagesthema ist zu lang.');
  if (!is_array($verantwortliche)) fehler('Ungültige Verantwortliche.');
  foreach ($verantwortliche as $personId) {
    if (!is_string($personId) || mitgliedVon($event, $personId) === null) fehler('Tagesverantwortliche müssen zum Event gehören.');
  }
  eventAendern($id, function (&$event) use ($datum, $thema, $verantwortliche) {
    foreach ($event['tage'] as $i => $tag) {
      if ($tag['datum'] !== $datum) continue;
      $event['tage'][$i]['thema'] = $thema;
      $event['tage'][$i]['verantwortliche'] = array_values(array_unique($verantwortliche));
    }
  });
  eventAntwort($id, $ich);
}

/* Personen suchen, um sie einem Event hinzuzufügen. E-Mail-Adressen sieht nur, wer Installations-Admin ist. */
function aktionPersonenSuche() {
  nurPost();
  $ich = pflichtAnmeldung();
  $event = eventFuerMitglied(eventIdAusEingabe(), $ich);
  pflichtRecht($event, $ich, 'personen', RECHT_BEARBEITEN);
  $suche = mb_strtolower((string) feld('suche'));
  if (mb_strlen($suche) < 2) antwort(array('personen' => array()));
  $treffer = array();
  foreach (personenLesen() as $p) {
    if (mitgliedVon($event, $p['id']) !== null) continue;
    $text = mb_strtolower($p['vorname'] . ' ' . $p['name'] . ' ' . $p['kuerzel'] . ' ' . $p['email']);
    if (strpos($text, $suche) === false) continue;
    $treffer[] = array('id' => $p['id'], 'vorname' => $p['vorname'], 'name' => $p['name'], 'kuerzel' => $p['kuerzel'], 'email' => istAdmin($ich) ? $p['email'] : '');
    if (count($treffer) >= 20) break;
  }
  antwort(array('personen' => $treffer));
}

/* Person aus dem Verzeichnis oder neu erfasst hinzufügen. Rollen vergibt nur die Event-Leitung. */
function aktionMitgliedHinzufuegen() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  pflichtRecht($event, $ich, 'personen', RECHT_BEARBEITEN);
  $rollen = hatLeitungsrechte($event, rechteKontext($ich)) ? feld('rollen', array()) : array();
  if (!is_array($rollen)) fehler('Ungültige Rollen.');
  $rollenIds = array_map(function ($r) { return $r['id']; }, $event['rollen']);
  foreach ($rollen as $rolle) {
    if (!in_array($rolle, $rollenIds, true)) fehler('Unbekannte Rolle.');
  }

  $personId = (string) feld('personId');
  if ($personId === '') {
    $felder = personenFelderPruefen();
    $personId = personenAendern(function (&$personen) use ($felder) {
      if ($felder['email'] !== '' && personIndexNachEmail($personen, $felder['email']) !== null) abbrechen('Es gibt bereits eine Person mit dieser E-Mail-Adresse. Bitte suchen Sie sie im Verzeichnis.');
      $person = neuePerson($felder['vorname'], $felder['name'], $felder['kuerzel'], $felder['email']);
      $personen[] = $person;
      return $person['id'];
    });
  } elseif (personIndex(personenLesen(), $personId) === null) {
    fehler('Person nicht gefunden.', 404);
  }

  eventAendern($id, function (&$event) use ($personId, $rollen) {
    if (mitgliedVon($event, $personId) === null) $event['mitglieder'][] = array('person_id' => $personId, 'rollen' => array_values(array_unique($rollen)));
  });
  eventAntwort($id, $ich);
}

function aktionMitgliedEntfernen() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  pflichtRecht($event, $ich, 'personen', RECHT_BEARBEITEN);
  $personId = (string) feld('personId');
  if (istEventLeitung($event, $personId) && !hatLeitungsrechte($event, rechteKontext($ich))) fehler('Nur die Event-Leitung kann eine Event-Leitung entfernen.', 403);
  eventAendern($id, function (&$event) use ($personId) {
    $event['mitglieder'] = array_values(array_filter($event['mitglieder'], function ($m) use ($personId) { return $m['person_id'] !== $personId; }));
    if (anzahlEventLeitungen($event) === 0) abbrechen('Mindestens eine Person muss Event-Leitung bleiben.');
    foreach ($event['teams'] as $i => $team) {
      $event['teams'][$i]['mitglieder'] = array_values(array_filter($team['mitglieder'], function ($m) use ($personId) { return $m['person_id'] !== $personId; }));
    }
    foreach ($event['tage'] as $i => $tag) {
      $event['tage'][$i]['verantwortliche'] = array_values(array_diff($tag['verantwortliche'], array($personId)));
    }
  });
  eventAntwort($id, $ich);
}

function aktionMitgliedRollen() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  pflichtEventLeitung(eventFuerMitglied($id, $ich), $ich);
  $personId = (string) feld('personId');
  $rollen = feld('rollen', array());
  if (!is_array($rollen)) fehler('Ungültige Rollen.');
  eventAendern($id, function (&$event) use ($personId, $rollen) {
    $rollenIds = array_map(function ($r) { return $r['id']; }, $event['rollen']);
    foreach ($rollen as $rolle) {
      if (!in_array($rolle, $rollenIds, true)) abbrechen('Unbekannte Rolle.');
    }
    $gefunden = false;
    foreach ($event['mitglieder'] as $i => $m) {
      if ($m['person_id'] !== $personId) continue;
      $event['mitglieder'][$i]['rollen'] = array_values(array_unique($rollen));
      $gefunden = true;
    }
    if (!$gefunden) abbrechen('Person gehört nicht zum Event.');
    if (anzahlEventLeitungen($event) === 0) abbrechen('Mindestens eine Person muss Event-Leitung bleiben.');
  });
  eventAntwort($id, $ich);
}

/* Angaben einer Person ändern. Personen mit Konto ändert nur ein Installations-Admin (ihre E-Mail ist ihr Login). */
function aktionMitgliedAngabenSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  pflichtRecht($event, $ich, 'personen', RECHT_BEARBEITEN);
  $personId = (string) feld('personId');
  if (mitgliedVon($event, $personId) === null) fehler('Person gehört nicht zum Event.');
  $felder = personenFelderPruefen();
  personenAendern(function (&$personen) use ($personId, $felder) {
    $i = personIndex($personen, $personId);
    if ($i === null) abbrechen('Person nicht gefunden.');
    if ($personen[$i]['konto'] !== null) abbrechen('Personen mit Konto ändert ein Installations-Admin.');
    $gleich = $felder['email'] !== '' ? personIndexNachEmail($personen, $felder['email']) : null;
    if ($gleich !== null && $gleich !== $i) abbrechen('Es gibt bereits eine Person mit dieser E-Mail-Adresse.');
    $personen[$i] = array_merge($personen[$i], $felder);
  });
  eventAntwort($id, $ich);
}

/* Person ohne Konto einladen. Bestehende Konten lassen sich hier nicht zurücksetzen (das wäre eine Übernahme). */
function aktionMitgliedEinladen() {
  nurPost();
  $ich = pflichtAnmeldung();
  $event = eventFuerMitglied(eventIdAusEingabe(), $ich);
  pflichtRecht($event, $ich, 'personen', RECHT_BEARBEITEN);
  $personId = (string) feld('personId');
  if (mitgliedVon($event, $personId) === null) fehler('Person gehört nicht zum Event.');
  $ergebnis = personenAendern(function (&$personen) use ($personId) {
    $i = personIndex($personen, $personId);
    if ($i === null) abbrechen('Person nicht gefunden.');
    if ($personen[$i]['konto'] !== null) abbrechen('Diese Person hat bereits ein Konto.');
    if ($personen[$i]['email'] === '') abbrechen('Für eine Einladung braucht die Person eine E-Mail-Adresse.');
    $token = einladungAnlegen($personen[$i]);
    return array('person' => $personen[$i], 'link' => einladungsLink($token));
  });
  $gesendet = einladungSenden($ergebnis['person'], $ergebnis['link']);
  antwort(array('link' => $ergebnis['link'], 'gesendet' => $gesendet));
}

/* Team anlegen oder ändern: Name und Mitglieder (je mit Flag Team-Leitung) in einem Schritt */
function aktionTeamSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  $teamId = (string) feld('teamId');
  $name = (string) feld('name');
  $eingabe = feld('mitglieder', array());
  if ($name === '' || mb_strlen($name) > 80) fehler('Bitte geben Sie einen Teamnamen an (höchstens 80 Zeichen).');
  if ($teamId === '') {
    pflichtRecht($event, $ich, 'personen', RECHT_BEARBEITEN);
  } elseif (!darfTeamVerwalten($event, rechteKontext($ich), $teamId)) {
    fehler('Dafür fehlt Ihnen das Recht.', 403);
  }
  if (!is_array($eingabe)) fehler('Ungültige Mitglieder.');
  $mitglieder = array();
  foreach ($eingabe as $m) {
    $personId = isset($m['personId']) ? $m['personId'] : '';
    if (!is_string($personId) || mitgliedVon($event, $personId) === null) fehler('Team-Mitglieder müssen zum Event gehören.');
    $mitglieder[$personId] = array('person_id' => $personId, 'ist_leitung' => isset($m['istLeitung']) && $m['istLeitung'] === true);
  }
  eventAendern($id, function (&$event) use ($teamId, $name, $mitglieder) {
    if ($teamId === '') {
      $event['teams'][] = array('id' => uuid(), 'name' => $name, 'mitglieder' => array_values($mitglieder));
      return;
    }
    foreach ($event['teams'] as $i => $team) {
      if ($team['id'] !== $teamId) continue;
      $event['teams'][$i]['name'] = $name;
      $event['teams'][$i]['mitglieder'] = array_values($mitglieder);
    }
  });
  eventAntwort($id, $ich);
}

function aktionTeamLoeschen() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  pflichtRecht(eventFuerMitglied($id, $ich), $ich, 'personen', RECHT_BEARBEITEN);
  $teamId = (string) feld('teamId');
  eventAendern($id, function (&$event) use ($teamId) {
    $event['teams'] = array_values(array_filter($event['teams'], function ($t) use ($teamId) { return $t['id'] !== $teamId; }));
    foreach ($event['programmpunkte'] as $i => $punkt) {
      $event['programmpunkte'][$i]['teams'] = array_values(array_diff($punkt['teams'], array($teamId)));
    }
  });
  eventAntwort($id, $ich);
}

function aktionRolleSpeichern() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  $event = eventFuerMitglied($id, $ich);
  pflichtEventLeitung($event, $ich);
  $rolleId = (string) feld('rolleId');
  $name = (string) feld('name');
  if ($name === '' || mb_strlen($name) > 80) fehler('Bitte geben Sie einen Rollennamen an (höchstens 80 Zeichen).');
  $rechte = rechteBereinigen(feld('rechte', array()), true);
  $punkte = array_map(function ($p) { return $p['id']; }, $event['programmpunkte']);
  foreach ($rechte as $recht) {
    if ($recht['programmpunkt_id'] !== null && !in_array($recht['programmpunkt_id'], $punkte, true)) fehler('Unbekannter Programmpunkt.');
  }
  eventAendern($id, function (&$event) use ($rolleId, $name, $rechte) {
    if ($rolleId === '') {
      $event['rollen'][] = array('id' => uuid(), 'name' => $name, 'ist_event_leitung' => false, 'rechte' => $rechte);
      return;
    }
    foreach ($event['rollen'] as $i => $rolle) {
      if ($rolle['id'] !== $rolleId) continue;
      $event['rollen'][$i]['name'] = $name;
      if (!$rolle['ist_event_leitung']) $event['rollen'][$i]['rechte'] = $rechte;
    }
  });
  eventAntwort($id, $ich);
}

function aktionRolleLoeschen() {
  nurPost();
  $ich = pflichtAnmeldung();
  $id = eventIdAusEingabe();
  pflichtEventLeitung(eventFuerMitglied($id, $ich), $ich);
  $rolleId = (string) feld('rolleId');
  eventAendern($id, function (&$event) use ($rolleId) {
    foreach ($event['rollen'] as $rolle) {
      if ($rolle['id'] === $rolleId && $rolle['ist_event_leitung']) abbrechen('Die Rolle Event-Leitung lässt sich nicht löschen.');
    }
    $event['rollen'] = array_values(array_filter($event['rollen'], function ($r) use ($rolleId) { return $r['id'] !== $rolleId; }));
    foreach ($event['mitglieder'] as $i => $m) {
      $event['mitglieder'][$i]['rollen'] = array_values(array_diff($m['rollen'], array($rolleId)));
    }
  });
  eventAntwort($id, $ich);
}

function aktionRollenvorlagenSpeichern() {
  nurPost();
  pflichtAdmin();
  $eingabe = feld('rollenvorlagen', array());
  if (!is_array($eingabe)) fehler('Ungültige Vorlagen.');
  $vorlagen = array();
  foreach ($eingabe as $vorlage) {
    $name = isset($vorlage['name']) ? trim((string) $vorlage['name']) : '';
    if ($name === '' || mb_strlen($name) > 80) fehler('Jede Vorlage braucht einen Namen (höchstens 80 Zeichen).');
    $vorlageId = isset($vorlage['id']) && istUuid($vorlage['id']) ? $vorlage['id'] : uuid();
    $vorlagen[] = array('id' => $vorlageId, 'name' => $name, 'rechte' => rechteBereinigen(isset($vorlage['rechte']) ? $vorlage['rechte'] : array(), false));
  }
  $einstellungen = einstellungenAendern(function (&$daten) use ($vorlagen) {
    $daten['rollenvorlagen'] = $vorlagen;
    return $daten;
  });
  antwort(array('einstellungen' => einstellungenOeffentlich($einstellungen)));
}
