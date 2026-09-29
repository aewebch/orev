<?php
/* Orev API: ?aktion=<name>, Eingaben als JSON-Body, Antworten als JSON.
   Anmeldung über das HttpOnly-Cookie orev_sitzung; jede Anfrage braucht den Header X-Orev: 1. */

ini_set('display_errors', '0');

require __DIR__ . '/src/kern.php';
require __DIR__ . '/src/konfiguration.php';
require __DIR__ . '/src/speicher.php';
require __DIR__ . '/src/sicherheit.php';
require __DIR__ . '/src/personen.php';
require __DIR__ . '/src/auth.php';
require __DIR__ . '/src/einstellungen.php';
require __DIR__ . '/src/mail.php';
require __DIR__ . '/src/migrationen.php';
require __DIR__ . '/src/update.php';
require __DIR__ . '/src/einrichtung.php';
require __DIR__ . '/src/aktionen/konto.php';
require __DIR__ . '/src/aktionen/verwaltung.php';

apiHeader();
anfrageHerkunftPruefen();

$aktion = isset($_GET['aktion']) ? (string) $_GET['aktion'] : '';

try {
  if (!istEingerichtet()) {
    if ($aktion === 'status') aktionEinrichtungStatus();
    if ($aktion === 'einrichtung_abschliessen') aktionEinrichtungAbschliessen();
    fehler('Orev ist noch nicht eingerichtet.', 503);
  }

  migrationenAusfuehren();
  date_default_timezone_set(einstellungenLesen()['zeitzone']);

  $aktionen = array(
    'status' => 'aktionStatus',
    'anmelden' => 'aktionAnmelden',
    'abmelden' => 'aktionAbmelden',
    'ueberall_abmelden' => 'aktionUeberallAbmelden',
    'einladung_pruefen' => 'aktionEinladungPruefen',
    'einladung_einloesen' => 'aktionEinladungEinloesen',
    'passwort_aendern' => 'aktionPasswortAendern',
    'benutzer_liste' => 'aktionBenutzerListe',
    'person_speichern' => 'aktionPersonSpeichern',
    'einladen' => 'aktionEinladen',
    'einladung_zurueckziehen' => 'aktionEinladungZurueckziehen',
    'admin_setzen' => 'aktionAdminSetzen',
    'konto_entfernen' => 'aktionKontoEntfernen',
    'einstellungen_lesen' => 'aktionEinstellungenLesen',
    'einstellungen_speichern' => 'aktionEinstellungenSpeichern',
    'update_pruefen' => 'aktionUpdatePruefen',
    'update_installieren' => 'aktionUpdateInstallieren',
  );
  if (!isset($aktionen[$aktion])) fehler('Unbekannte Aktion.', 404);
  $aktionen[$aktion]();
} catch (Throwable $e) {
  /* Details nur ins Server-Log, nie an den Browser */
  error_log('Orev: ' . $e->getMessage());
  fehler('Interner Fehler. Details stehen im Server-Log.', 500);
}
