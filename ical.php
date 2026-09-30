<?php
/* Kalender-Abo ohne Anmeldung: /ical/<token>.ics (mit Rewrite-Regel) oder ical.php/<token>.ics, optional ?event=<id>.
   Der Token ist lang und zufällig; wer ihn neu erzeugt, macht den alten Link ungültig.
   ETag und If-None-Match sparen Kalender-Clients unnötige Übertragungen. */

require __DIR__ . '/src/kern.php';
require __DIR__ . '/src/konfiguration.php';
require __DIR__ . '/src/speicher.php';
require __DIR__ . '/src/personen.php';
require __DIR__ . '/src/einstellungen.php';
require __DIR__ . '/src/rechte.php';
require __DIR__ . '/src/events.php';
require __DIR__ . '/src/programm.php';
require __DIR__ . '/src/aufgaben.php';
require __DIR__ . '/src/ical.php';

ini_set('display_errors', '0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Orev-Ical: 1');

function icalNichtGefunden() {
  http_response_code(404);
  header('Content-Type: text/plain; charset=utf-8');
  echo "Nicht gefunden.\n";
  exit;
}

try {
  if (!istEingerichtet()) icalNichtGefunden();
  $token = isset($_GET['t']) ? (string) $_GET['t'] : '';
  if ($token === '' && isset($_SERVER['PATH_INFO'])) $token = basename((string) $_SERVER['PATH_INFO']);
  $token = preg_replace('/\.ics$/', '', $token);

  $personen = personenLesen();
  $person = icalPersonNachToken($personen, $token);
  if ($person === null) icalNichtGefunden();

  $einstellungen = einstellungenLesen();
  date_default_timezone_set($einstellungen['zeitzone']);
  $nurEvent = isset($_GET['event']) && istUuid((string) $_GET['event']) ? (string) $_GET['event'] : '';
  $wer = array('id' => $person['id'], 'istAdmin' => $person['konto']['ist_admin']);
  $ganzes = icalGanzesProgramm($person, $einstellungen);

  $eintraege = array();
  foreach (speicherListe('events') as $name) {
    $event = speicherLesen($name, null);
    if ($event === null || ($nurEvent !== '' && $event['id'] !== $nurEvent)) continue;
    $eintraege = array_merge($eintraege, icalEintraege($event, $wer, $ganzes));
  }

  $host = isset($_SERVER['HTTP_HOST']) ? strtolower(preg_replace('/:\d+$/', '', (string) $_SERVER['HTTP_HOST'])) : '';
  $domain = preg_match('/^[a-z0-9.-]{1,200}$/', $host) ? $host : 'orev';
  $kalenderName = 'Orev – ' . trim($person['vorname'] . ' ' . $person['name']);

  /* Das ETag hängt nur vom Inhalt ab, nicht vom Abrufzeitpunkt (DTSTAMP) */
  $etag = '"' . hash('sha256', icalKalender($eintraege, $kalenderName, $domain, '19700101T000000Z')) . '"';
  header('ETag: ' . $etag);
  header('Cache-Control: private, no-cache');
  $anfrage = isset($_SERVER['HTTP_IF_NONE_MATCH']) ? trim((string) $_SERVER['HTTP_IF_NONE_MATCH']) : '';
  if ($anfrage !== '' && hash_equals($etag, $anfrage)) {
    http_response_code(304);
    exit;
  }
  header('Content-Type: text/calendar; charset=utf-8');
  header('Content-Disposition: inline; filename="orev.ics"');
  echo icalKalender($eintraege, $kalenderName, $domain, icalUtc('now'));
} catch (Throwable $e) {
  error_log('Orev iCal: ' . $e->getMessage());
  http_response_code(500);
  header('Content-Type: text/plain; charset=utf-8');
  echo "Der Kalender ist gerade nicht verfügbar.\n";
}
