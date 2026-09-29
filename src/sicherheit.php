<?php
/* Sicherheits-Header, Schutz gegen fremd ausgelöste Anfragen, Sitzungs-Cookie und Bremse gegen Passwort-Raten */

define('OREV_COOKIE', 'orev_sitzung');
define('OREV_SITZUNG_TAGE', 14);
define('OREV_MAX_FEHLVERSUCHE', 10);
define('OREV_SPERRFENSTER', 900);

function sicherheitsHeader() {
  header('X-Content-Type-Options: nosniff');
  header('X-Frame-Options: DENY');
  header('Referrer-Policy: no-referrer');
  header('Cross-Origin-Opener-Policy: same-origin');
  header('Cross-Origin-Resource-Policy: same-origin');
  header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  if (istHttps()) header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

function apiHeader() {
  sicherheitsHeader();
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
  header('X-Orev-Version: ' . lokaleVersion());
}

/* Nur Anfragen der eigenen Oberfläche zulassen: Der eigene Header erzwingt bei fremden Seiten eine
   CORS-Vorabprüfung, die ohne CORS-Freigabe scheitert. Zusätzlich muss eine mitgeschickte Herkunft passen. */
function anfrageHerkunftPruefen() {
  if (!isset($_SERVER['HTTP_X_OREV']) || $_SERVER['HTTP_X_OREV'] !== '1') fehler('Anfrage abgelehnt', 403);
  if (!empty($_SERVER['HTTP_ORIGIN'])) {
    $host = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST);
    $port = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_PORT);
    $herkunft = $host . ($port ? ':' . $port : '');
    if (!isset($_SERVER['HTTP_HOST']) || !hash_equals($_SERVER['HTTP_HOST'], $herkunft)) fehler('Anfrage abgelehnt', 403);
  }
}

function nurPost() {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') fehler('Nur POST erlaubt', 405);
}

/* Sitzungs-Cookie: HttpOnly (für Skripte unsichtbar), SameSite=Strict, über HTTPS nur verschlüsselt.
   setcookie() kennt SameSite erst ab PHP 7.3, deshalb der Header von Hand. */
function sitzungsCookieSetzen($token) {
  $teile = array(
    OREV_COOKIE . '=' . $token,
    'Path=' . webPfad(),
    'HttpOnly',
    'SameSite=Strict',
  );
  if ($token === '') {
    $teile[] = 'Max-Age=0';
  } else {
    $teile[] = 'Max-Age=' . (OREV_SITZUNG_TAGE * 86400);
  }
  if (istHttps()) $teile[] = 'Secure';
  header('Set-Cookie: ' . implode('; ', $teile), false);
}

function sitzungsTokenAusCookie() {
  $token = isset($_COOKIE[OREV_COOKIE]) ? $_COOKIE[OREV_COOKIE] : '';
  return preg_match('/^[0-9a-f]{64}$/', $token) ? $token : '';
}

/* Adresse nur als verschlüsselter Hash ablegen, nie im Klartext */
function adressKennung() {
  $adresse = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
  return hash_hmac('sha256', $adresse, schluessel());
}

function fehlversucheZaehlen($daten, $kennung) {
  $grenze = time() - OREV_SPERRFENSTER;
  $anzahl = 0;
  if (isset($daten[$kennung])) {
    foreach ($daten[$kennung] as $zeit) {
      if ($zeit > $grenze) $anzahl++;
    }
  }
  return $anzahl;
}

function anmeldeSperrePruefen() {
  $daten = speicherLesen('fehlversuche', array());
  if (fehlversucheZaehlen($daten, adressKennung()) >= OREV_MAX_FEHLVERSUCHE) {
    fehler('Zu viele Fehlversuche. Bitte versuchen Sie es in 15 Minuten erneut.', 429);
  }
}

function fehlversuch($text) {
  $kennung = adressKennung();
  speicherAendern('fehlversuche', array(), function (&$daten) use ($kennung) {
    $grenze = time() - OREV_SPERRFENSTER;
    foreach ($daten as $k => $zeiten) {
      $daten[$k] = array_values(array_filter($zeiten, function ($zeit) use ($grenze) { return $zeit > $grenze; }));
      if (!$daten[$k]) unset($daten[$k]);
    }
    $daten[$kennung][] = time();
  });
  usleep(400000);
  fehler($text, 401);
}

function passwortVerfahren() {
  return defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
}

function passwortHash($passwort) {
  return password_hash($passwort, passwortVerfahren());
}

/* Bei unbekannter Adresse trotzdem einen Hash prüfen: Die Antwortzeit verrät dann nicht, ob es das Konto gibt */
function passwortPruefungVortaeuschen($passwort) {
  $attrappe = defined('PASSWORD_ARGON2ID')
    ? '$argon2id$v=19$m=65536,t=4,p=1$VWRJLjguRUFnaE5CVUNDWA$KW83FrzuZIYJd+A0Gk6JmnRXE3WcsOa1lYAe2vgnzUc'
    : '$2y$10$DelZm15fuuMUFzR4Kspk1OPd.5B.FE7C91NBhoccRo2BNi4IrEhXW';
  password_verify($passwort, $attrappe);
}

function passwortPruefen($passwort) {
  if (!is_string($passwort) || strlen($passwort) < 12) fehler('Das Passwort braucht mindestens 12 Zeichen.');
  if (strlen($passwort) > 1024) fehler('Das Passwort ist zu lang.');
}
