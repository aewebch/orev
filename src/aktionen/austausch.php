<?php
/* Event exportieren (Event-Leitung) und importieren (wer Events anlegen darf) */

function aktionEventExport() {
  nurPost();
  $ich = pflichtAnmeldung();
  $event = eventFuerMitglied(eventIdAusEingabe(), $ich);
  pflichtEventLeitung($event, $ich);
  antwort(array('datei' => eventExportDaten($event, personenLesen())));
}

/* Eingabe: die Datei als Base64 (JSON oder ZIP mit orev-event.json) */
function aktionEventImport() {
  nurPost();
  $ich = pflichtAnmeldung();
  if (!darfEventsAnlegen($ich)) fehler('Sie dürfen keine Events anlegen.', 403);
  $bytes = base64_decode((string) feld('datei'), true);
  if ($bytes === false || $bytes === '') fehler('Die Datei liess sich nicht lesen.');
  $daten = json_decode(importInhalt($bytes), true);
  if (!is_array($daten)) fehler('Die Datei ist kein gültiges JSON.');
  $geprueft = eventImportPruefen($daten);
  $zuordnung = personenAendern(function (&$personen) use ($geprueft) {
    return importPersonenZuordnen($personen, $geprueft['personen']);
  });
  $event = eventAusImport($geprueft, $zuordnung, $ich['id']);
  speicherSchreiben('events/' . $event['id'], $event);
  antwort(array('id' => $event['id'], 'titel' => $event['titel']));
}
