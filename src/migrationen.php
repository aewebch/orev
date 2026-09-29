<?php
/* Nummerierte Migrationen für die verschlüsselte Ablage: migrationen/NNN_name.php liefert eine Funktion, die den
   Datenbestand auf den neuen Stand bringt. Die Einstellung schema_version hält fest, was schon gelaufen ist.
   Läuft bei jeder Anfrage an, tut aber nur etwas, wenn eine neue Migration vorliegt (z. B. nach einem Update). */

function migrationsDateien() {
  $dateien = array();
  foreach (glob(OREV_WURZEL . '/migrationen/[0-9][0-9][0-9]_*.php') ?: array() as $datei) {
    $dateien[(int) substr(basename($datei), 0, 3)] = $datei;
  }
  ksort($dateien);
  return $dateien;
}

function hoechsteMigration() {
  $nummern = array_keys(migrationsDateien());
  return $nummern ? max($nummern) : 0;
}

function migrationenAusfuehren() {
  if (einstellungenLesen()['schema_version'] >= hoechsteMigration()) return;
  $sperre = fopen(konfiguration('daten_pfad') . '/migration.lock', 'c');
  if ($sperre === false || !flock($sperre, LOCK_EX)) throw new RuntimeException('Migration: Sperre nicht möglich');
  try {
    foreach (migrationsDateien() as $nummer => $datei) {
      if (einstellungenLesen()['schema_version'] >= $nummer) continue;
      $migration = require $datei;
      $migration();
      einstellungenAendern(function (&$einstellungen) use ($nummer) {
        $einstellungen['schema_version'] = $nummer;
      });
    }
  } finally {
    flock($sperre, LOCK_UN);
    fclose($sperre);
  }
}
