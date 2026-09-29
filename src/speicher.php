<?php
/* Verschlüsselte Ablage ohne Datenbank.
   Jede Datei im Datenordner ist mit AES-256-GCM verschlüsselt. Der logische Dateiname fliesst als zusätzliche
   Authentifizierung (AAD) ein: Eine Datei lässt sich nicht unbemerkt gegen eine andere austauschen.
   Schreiben geschieht über eine temporäre Datei und rename(), damit Lesende nie eine halbe Datei sehen.
   Ändern (lesen, anpassen, schreiben) läuft unter einer exklusiven Sperre pro Datei. */

define('OREV_KENNUNG', 'OREV1:');
define('OREV_ENDUNG', '.orev');

function verschluesseln($klartext, $schluessel, $name) {
  $iv = random_bytes(12);
  $tag = '';
  $chiffrat = openssl_encrypt($klartext, 'aes-256-gcm', $schluessel, OPENSSL_RAW_DATA, $iv, $tag, $name, 16);
  if ($chiffrat === false) throw new RuntimeException('Verschlüsselung fehlgeschlagen');
  return OREV_KENNUNG . base64_encode($iv . $tag . $chiffrat);
}

function entschluesseln($roh, $schluessel, $name) {
  if (strpos($roh, OREV_KENNUNG) !== 0) throw new RuntimeException("Unbekanntes Dateiformat: $name");
  $daten = base64_decode(substr($roh, strlen(OREV_KENNUNG)), true);
  if ($daten === false || strlen($daten) < 28) throw new RuntimeException("Datei beschädigt: $name");
  $klartext = openssl_decrypt(substr($daten, 28), 'aes-256-gcm', $schluessel, OPENSSL_RAW_DATA, substr($daten, 0, 12), substr($daten, 12, 16), $name);
  if ($klartext === false) throw new RuntimeException("Datei beschädigt oder falscher Schlüssel: $name");
  return $klartext;
}

/* Logische Namen wie «personen» oder «events/<uuid>» */
function speicherPfad($name) {
  if (!preg_match('/^[a-z0-9_-]+(\/[a-z0-9_-]+)?$/', $name)) throw new RuntimeException("Ungültiger Speichername: $name");
  return konfiguration('daten_pfad') . '/' . $name . OREV_ENDUNG;
}

function speicherLesen($name, $standard) {
  $pfad = speicherPfad($name);
  if (!is_file($pfad)) return $standard;
  $daten = json_decode(entschluesseln(file_get_contents($pfad), schluessel(), $name), true);
  if (!is_array($daten)) throw new RuntimeException("Datei unlesbar: $name");
  return $daten;
}

function speicherSchreiben($name, $daten) {
  $pfad = speicherPfad($name);
  if (!is_dir(dirname($pfad))) mkdir(dirname($pfad), 0700, true);
  $temporaer = $pfad . '.' . bin2hex(random_bytes(6)) . '.tmp';
  $inhalt = verschluesseln(json_encode($daten, JSON_UNESCAPED_UNICODE), schluessel(), $name);
  if (file_put_contents($temporaer, $inhalt, LOCK_EX) === false) throw new RuntimeException("Schreiben fehlgeschlagen: $name");
  @chmod($temporaer, 0600);
  if (!rename($temporaer, $pfad)) {
    @unlink($temporaer);
    throw new RuntimeException("Schreiben fehlgeschlagen: $name");
  }
}

/* Liest die Datei unter Sperre, übergibt sie der Änderung (per Referenz) und schreibt sie zurück.
   Gibt zurück, was die Änderung zurückgibt. */
function speicherAendern($name, $standard, $aenderung) {
  $pfad = speicherPfad($name);
  if (!is_dir(dirname($pfad))) mkdir(dirname($pfad), 0700, true);
  $sperre = fopen($pfad . '.lock', 'c');
  if ($sperre === false || !flock($sperre, LOCK_EX)) throw new RuntimeException("Sperre nicht möglich: $name");
  try {
    $daten = speicherLesen($name, $standard);
    $ergebnis = $aenderung($daten);
    speicherSchreiben($name, $daten);
  } finally {
    flock($sperre, LOCK_UN);
    fclose($sperre);
  }
  return $ergebnis;
}

function speicherLoeschen($name) {
  $pfad = speicherPfad($name);
  if (is_file($pfad)) unlink($pfad);
  if (is_file($pfad . '.lock')) unlink($pfad . '.lock');
}

/* Namen aller Dateien in einem Unterordner, z. B. alle Events */
function speicherListe($ordner) {
  $namen = array();
  foreach (glob(konfiguration('daten_pfad') . '/' . $ordner . '/*' . OREV_ENDUNG) ?: array() as $pfad) {
    $namen[] = $ordner . '/' . basename($pfad, OREV_ENDUNG);
  }
  return $namen;
}

/* Datenordner gegen Webzugriff sperren, auch wenn er (nicht empfohlen) im Webroot liegt */
function datenordnerSchuetzen($pfad) {
  if (!is_dir($pfad)) mkdir($pfad, 0700, true);
  file_put_contents($pfad . '/.htaccess', "Require all denied\n");
  file_put_contents($pfad . '/index.html', '');
}
