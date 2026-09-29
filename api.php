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
require __DIR__ . '/src/rechte.php';
require __DIR__ . '/src/events.php';
require __DIR__ . '/src/programm.php';
require __DIR__ . '/src/aufgaben.php';
require __DIR__ . '/src/benachrichtigungen.php';
require __DIR__ . '/src/aktionen/konto.php';
require __DIR__ . '/src/aktionen/verwaltung.php';
require __DIR__ . '/src/aktionen/events.php';
require __DIR__ . '/src/aktionen/programm.php';
require __DIR__ . '/src/aktionen/ablauf.php';
require __DIR__ . '/src/aktionen/aufgaben.php';
require __DIR__ . '/src/aktionen/benachrichtigungen.php';
require __DIR__ . '/src/aktionen/suche.php';

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
    'konto_rechte' => 'aktionKontoRechte',
    'konto_entfernen' => 'aktionKontoEntfernen',
    'einstellungen_lesen' => 'aktionEinstellungenLesen',
    'einstellungen_speichern' => 'aktionEinstellungenSpeichern',
    'update_pruefen' => 'aktionUpdatePruefen',
    'update_installieren' => 'aktionUpdateInstallieren',
    'rollenvorlagen_speichern' => 'aktionRollenvorlagenSpeichern',
    'events_liste' => 'aktionEventsListe',
    'event_anlegen' => 'aktionEventAnlegen',
    'event_laden' => 'aktionEventLaden',
    'event_speichern' => 'aktionEventSpeichern',
    'event_loeschen' => 'aktionEventLoeschen',
    'tag_speichern' => 'aktionTagSpeichern',
    'personen_suche' => 'aktionPersonenSuche',
    'mitglied_hinzufuegen' => 'aktionMitgliedHinzufuegen',
    'mitglied_entfernen' => 'aktionMitgliedEntfernen',
    'mitglied_rollen' => 'aktionMitgliedRollen',
    'mitglied_angaben_speichern' => 'aktionMitgliedAngabenSpeichern',
    'mitglied_einladen' => 'aktionMitgliedEinladen',
    'team_speichern' => 'aktionTeamSpeichern',
    'team_loeschen' => 'aktionTeamLoeschen',
    'rolle_speichern' => 'aktionRolleSpeichern',
    'rolle_loeschen' => 'aktionRolleLoeschen',
    'programmpunkt_speichern' => 'aktionProgrammpunktSpeichern',
    'programmpunkt_loeschen' => 'aktionProgrammpunktLoeschen',
    'programmpunkt_kopieren' => 'aktionProgrammpunktKopieren',
    'programmpunkt_verschieben' => 'aktionProgrammpunktVerschieben',
    'programmpunkt_einfuegen' => 'aktionProgrammpunktEinfuegen',
    'agenda_speichern' => 'aktionAgendaSpeichern',
    'mitglied_farbe' => 'aktionMitgliedFarbe',
    'programmvorlagen_liste' => 'aktionProgrammvorlagenListe',
    'programmvorlage_aus_punkt' => 'aktionProgrammvorlageAusPunkt',
    'programmvorlage_speichern' => 'aktionProgrammvorlageSpeichern',
    'programmvorlage_loeschen' => 'aktionProgrammvorlageLoeschen',
    'ablauf_kopf_speichern' => 'aktionAblaufKopfSpeichern',
    'ablaufschritt_speichern' => 'aktionAblaufschrittSpeichern',
    'ablaufschritt_verschieben' => 'aktionAblaufschrittVerschieben',
    'ablaufschritt_loeschen' => 'aktionAblaufschrittLoeschen',
    'aufgabe_speichern' => 'aktionAufgabeSpeichern',
    'aufgabe_status' => 'aktionAufgabeStatus',
    'aufgabe_loeschen' => 'aktionAufgabeLoeschen',
    'material_speichern' => 'aktionMaterialSpeichern',
    'material_loeschen' => 'aktionMaterialLoeschen',
    'material_gesamtliste' => 'aktionMaterialGesamtliste',
    'benachrichtigungen_liste' => 'aktionBenachrichtigungenListe',
    'benachrichtigungen_anzahl' => 'aktionBenachrichtigungenAnzahl',
    'benachrichtigungen_gelesen' => 'aktionBenachrichtigungenGelesen',
    'benachrichtigungen_leeren' => 'aktionBenachrichtigungenLeeren',
    'suche' => 'aktionSuche',
    'meine_aufgaben' => 'aktionMeineAufgaben',
  );
  if (!isset($aktionen[$aktion])) fehler('Unbekannte Aktion.', 404);
  $aktionen[$aktion]();
} catch (OrevAbbruch $e) {
  fehler($e->getMessage());
} catch (Throwable $e) {
  /* Details nur ins Server-Log, nie an den Browser */
  error_log('Orev: ' . $e->getMessage());
  fehler('Interner Fehler. Details stehen im Server-Log.', 500);
}
