<?php
/* Austausch von Events zwischen Installationen: Export als unverschlüsseltes JSON (orev-event.json, auf Wunsch in
   einer ZIP-Datei), Import als neues Event. Die Ablage selbst ist an den Schlüssel der Installation gebunden und lässt
   sich deshalb nicht einfach kopieren.
   Exportiert werden das Event und die Angaben der beteiligten Personen (Name, Kürzel, E-Mail), nie Konten, Passwörter,
   Sitzungen, Freigabe-Links oder Mitteilungen. Beim Import erhält das Event eine neue ID; Personen mit bekannter
   E-Mail-Adresse werden übernommen, alle anderen neu ohne Konto angelegt. Wer importiert, wird Event-Leitung. */

define('OREV_AUSTAUSCH_FORMAT', 'orev-event');
define('OREV_AUSTAUSCH_VERSION', 1);
define('OREV_AUSTAUSCH_MAX_BYTES', 8 * 1024 * 1024);

function eventExportDaten($event, $personen) {
  $ids = array_map(function ($m) { return $m['person_id']; }, $event['mitglieder']);
  $liste = array();
  foreach ($personen as $p) {
    if (in_array($p['id'], $ids, true)) $liste[] = array('id' => $p['id'], 'vorname' => $p['vorname'], 'name' => $p['name'], 'kuerzel' => $p['kuerzel'], 'email' => $p['email']);
  }
  $event['freigaben'] = array();
  return array(
    'format' => OREV_AUSTAUSCH_FORMAT,
    'version' => OREV_AUSTAUSCH_VERSION,
    'orev' => lokaleVersion(),
    'exportiert_am' => jetzt(),
    'event' => $event,
    'personen' => $liste,
  );
}

/* Fehlende Teile ergänzen (ältere Exporte) und die Grundstruktur prüfen; wirft OrevAbbruch bei ungültigen Daten */
function eventImportPruefen($daten) {
  if (!is_array($daten) || !isset($daten['format']) || $daten['format'] !== OREV_AUSTAUSCH_FORMAT) abbrechen('Das ist keine Orev-Eventdatei.');
  if (!isset($daten['version']) || (int) $daten['version'] > OREV_AUSTAUSCH_VERSION) abbrechen('Die Datei stammt aus einer neueren Orev-Version. Bitte aktualisieren Sie Orev.');
  if (!isset($daten['event']) || !is_array($daten['event']) || !isset($daten['personen']) || !is_array($daten['personen'])) abbrechen('Die Datei ist unvollständig.');
  $event = $daten['event'];
  foreach (array('titel', 'typ', 'start_datum', 'end_datum') as $feld) {
    if (!isset($event[$feld]) || !is_string($event[$feld])) abbrechen('Die Datei ist unvollständig.');
  }
  if (!datumGueltig($event['start_datum']) || !datumGueltig($event['end_datum']) || $event['end_datum'] < $event['start_datum']) abbrechen('Die Datei enthält einen ungültigen Zeitraum.');
  if ((new DateTime($event['start_datum']))->diff(new DateTime($event['end_datum']))->days >= OREV_MAX_EVENT_TAGE) abbrechen('Ein Event dauert höchstens ' . OREV_MAX_EVENT_TAGE . ' Tage.');
  $standard = array(
    'thema' => '', 'ort' => '', 'beschreibung' => '', 'tage' => array(), 'teams' => array(), 'mitglieder' => array(), 'rollen' => array(),
    'programmpunkte' => array(), 'agenda' => agendaStandard(), 'aufgaben' => array(), 'material' => array(), 'konzept' => konzeptLeer(),
    'reflexion' => reflexionLeer(), 'feedbacks' => array(), 'wirkungsmodell' => wirkungsmodellLeer(), 'freigaben' => array(),
  );
  foreach ($standard as $feld => $wert) {
    if (!isset($event[$feld])) $event[$feld] = $wert;
    if (gettype($event[$feld]) !== gettype($wert)) abbrechen('Die Datei ist beschädigt (' . $feld . ').');
  }
  $event['typ'] = $event['typ'] === 'camp' ? 'camp' : 'event';
  $event['freigaben'] = array();
  foreach ($daten['personen'] as $p) {
    if (!is_array($p) || !istUuid(isset($p['id']) ? $p['id'] : '') || !isset($p['vorname'], $p['name']) || !is_string($p['vorname']) || !is_string($p['name'])) abbrechen('Die Personen in der Datei sind ungültig.');
  }
  return array('event' => $event, 'personen' => $daten['personen']);
}

/* Personen zuordnen: bekannte E-Mail übernehmen, sonst neu anlegen. Liefert alte ID => neue ID. */
function importPersonenZuordnen(&$verzeichnis, $personen) {
  $zuordnung = array();
  foreach ($personen as $p) {
    $email = isset($p['email']) && gueltigeEmail($p['email']) ? $p['email'] : '';
    $i = $email !== '' ? personIndexNachEmail($verzeichnis, $email) : null;
    if ($i !== null) {
      $zuordnung[$p['id']] = $verzeichnis[$i]['id'];
      continue;
    }
    $neu = neuePerson(mb_substr($p['vorname'], 0, 80), mb_substr($p['name'], 0, 80), isset($p['kuerzel']) && is_string($p['kuerzel']) ? mb_substr($p['kuerzel'], 0, 10) : '', $email);
    $verzeichnis[] = $neu;
    $zuordnung[$p['id']] = $neu['id'];
  }
  return $zuordnung;
}

/* Neues Event aus geprüften Daten: neue Event-ID, Personen-IDs ersetzt (UUIDs sind eindeutig, deshalb genügt das
   Ersetzen im JSON-Text), Personen ohne Eintrag in der Datei entfernt, die importierende Person als Event-Leitung */
function eventAusImport($geprueft, $zuordnung, $ichId) {
  $json = json_encode($geprueft['event'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  $json = strtr($json, array_combine(array_map(function ($id) { return '"' . $id . '"'; }, array_keys($zuordnung)), array_map(function ($id) { return '"' . $id . '"'; }, array_values($zuordnung))));
  $event = json_decode($json, true);
  $event['id'] = uuid();
  $event['erstellt_am'] = jetzt();
  $bekannt = array_values($zuordnung);
  $event['mitglieder'] = array_values(array_filter($event['mitglieder'], function ($m) use ($bekannt) { return is_array($m) && isset($m['person_id']) && in_array($m['person_id'], $bekannt, true); }));

  $leitung = null;
  foreach ($event['rollen'] as $rolle) {
    if (!empty($rolle['ist_event_leitung'])) $leitung = $rolle['id'];
  }
  if ($leitung === null) {
    $leitung = uuid();
    array_unshift($event['rollen'], array('id' => $leitung, 'name' => 'Event-Leitung', 'ist_event_leitung' => true, 'rechte' => array()));
  }
  $gefunden = false;
  foreach ($event['mitglieder'] as $i => $m) {
    if ($m['person_id'] !== $ichId) continue;
    $gefunden = true;
    if (!in_array($leitung, $m['rollen'], true)) $event['mitglieder'][$i]['rollen'][] = $leitung;
  }
  if (!$gefunden) $event['mitglieder'][] = array('person_id' => $ichId, 'rollen' => array($leitung), 'farbe' => '');
  $event['tage'] = eventTageErzeugen($event['start_datum'], $event['end_datum'], $event['tage']);
  return $event;
}

/* Inhalt einer hochgeladenen Datei: JSON direkt oder orev-event.json aus einer ZIP-Datei */
function importInhalt($bytes) {
  if (strlen($bytes) > OREV_AUSTAUSCH_MAX_BYTES) abbrechen('Die Datei ist zu gross (höchstens 8 MB).');
  if (substr($bytes, 0, 2) !== 'PK') return $bytes;
  if (!class_exists('ZipArchive')) abbrechen('Dieser Server kann keine ZIP-Dateien öffnen. Laden Sie die Datei orev-event.json aus der ZIP-Datei hoch.');
  $pfad = tempnam(sys_get_temp_dir(), 'orev');
  file_put_contents($pfad, $bytes);
  $zip = new ZipArchive();
  $inhalt = false;
  if ($zip->open($pfad) === true) {
    $stat = $zip->statName('orev-event.json');
    if ($stat !== false && $stat['size'] <= OREV_AUSTAUSCH_MAX_BYTES) $inhalt = $zip->getFromName('orev-event.json');
    $zip->close();
  }
  unlink($pfad);
  if ($inhalt === false) abbrechen('In der ZIP-Datei fehlt die Datei orev-event.json.');
  return $inhalt;
}
