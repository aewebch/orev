<?php
/* Grundfunktionen für api.php: Antworten, Eingaben, Kennungen, Zeit */

define('OREV_WURZEL', dirname(__DIR__));
date_default_timezone_set('Europe/Zurich');

function antwort($daten, $status = 200) {
  http_response_code($status);
  echo json_encode($daten, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function fehler($text, $status = 400) {
  antwort(array('fehler' => $text), $status);
}

/* JSON-Body der Anfrage, einmal gelesen */
function eingabe() {
  static $daten = null;
  if ($daten === null) {
    $daten = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($daten)) $daten = array();
  }
  return $daten;
}

function feld($name, $standard = '') {
  $daten = eingabe();
  if (!array_key_exists($name, $daten) || $daten[$name] === null) return $standard;
  return is_string($daten[$name]) ? trim($daten[$name]) : $daten[$name];
}

function uuid() {
  $b = random_bytes(16);
  $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
  $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

function istUuid($wert) {
  return is_string($wert) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/', $wert) === 1;
}

/* Geheimer Wert für Links und Sitzungen; gespeichert wird nur sein Hash */
function zufallsToken() {
  return bin2hex(random_bytes(32));
}

function tokenHash($token) {
  return hash('sha256', $token);
}

function jetzt() {
  return date('Y-m-d\TH:i:s');
}

function istHttps() {
  if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') return true;
  return isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https';
}

/* Pfad der Installation im Web, z. B. «/orev/» */
function webPfad() {
  return rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/') . '/';
}

function basisUrl() {
  $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
  return (istHttps() ? 'https://' : 'http://') . $host . webPfad();
}

function lokaleVersion() {
  $datei = OREV_WURZEL . '/VERSION';
  return is_file($datei) ? trim(file_get_contents($datei)) : '0.0.0';
}

function gueltigeEmail($email) {
  return is_string($email) && strlen($email) <= 254 && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}
