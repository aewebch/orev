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
require __DIR__ . '/src/konzept.php';
require __DIR__ . '/src/wirkungsmodell.php';
require __DIR__ . '/src/ical.php';
require __DIR__ . '/src/freigaben.php';
require __DIR__ . '/src/aktionen/konto.php';
require __DIR__ . '/src/aktionen/verwaltung.php';
require __DIR__ . '/src/aktionen/events.php';
require __DIR__ . '/src/aktionen/programm.php';
require __DIR__ . '/src/aktionen/ablauf.php';
require __DIR__ . '/src/aktionen/aufgaben.php';
require __DIR__ . '/src/aktionen/benachrichtigungen.php';
require __DIR__ . '/src/aktionen/suche.php';
require __DIR__ . '/src/aktionen/konzept.php';
require __DIR__ . '/src/aktionen/wirkungsmodell.php';
require __DIR__ . '/src/aktionen/ical.php';
require __DIR__ . '/src/aktionen/freigaben.php';

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
    'einfuehrung_speichern' => 'aktionEinfuehrungSpeichern',
    'freigabe_pruefen' => 'aktionFreigabePruefen',
    'freigabe_einloesen' => 'aktionFreigabeEinloesen',
    'freigabe_konto_anlegen' => 'aktionFreigabeKontoAnlegen',
    'freigabe_speichern' => 'aktionFreigabeSpeichern',
    'freigabe_erneuern' => 'aktionFreigabeErneuern',
    'freigabe_loeschen' => 'aktionFreigabeLoeschen',
    'benutzer_liste' => 'aktionBenutzerListe',
    'person_speichern' => 'aktionPersonSpeichern',
    'einladen' => 'aktionEinladen',
    'einladung_zurueckziehen' => 'aktionEinladungZurueckziehen',
    'konto_rechte' => 'aktionKontoRechte',
    'konto_entfernen' => 'aktionKontoEntfernen',
    'einstellungen_lesen' => 'aktionEinstellungenLesen',
    'datenschutz' => 'aktionDatenschutz',
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
    'zielgruppe_speichern' => 'aktionZielgruppeSpeichern',
    'ziel_speichern' => 'aktionZielSpeichern',
    'ziel_verschieben' => 'aktionZielVerschieben',
    'ziel_loeschen' => 'aktionZielLoeschen',
    'ziel_pruefung_speichern' => 'aktionZielPruefungSpeichern',
    'teamkultur_speichern' => 'aktionTeamkulturSpeichern',
    'bewertung_speichern' => 'aktionBewertungSpeichern',
    'feedback_speichern' => 'aktionFeedbackSpeichern',
    'feedback_loeschen' => 'aktionFeedbackLoeschen',
    'wirkung_kopf_speichern' => 'aktionWirkungsKopfSpeichern',
    'wirkung_eintrag_speichern' => 'aktionWirkungsEintragSpeichern',
    'wirkung_eintrag_verschieben' => 'aktionWirkungsEintragVerschieben',
    'wirkung_eintrag_loeschen' => 'aktionWirkungsEintragLoeschen',
    'wirkung_verbindung' => 'aktionWirkungsVerbindung',
    'wirkung_uebernehmen' => 'aktionWirkungsUebernehmen',
    'ical_status' => 'aktionIcalStatus',
    'ical_token_erzeugen' => 'aktionIcalTokenErzeugen',
    'ical_beenden' => 'aktionIcalBeenden',
    'ical_einstellung_speichern' => 'aktionIcalEinstellungSpeichern',
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
