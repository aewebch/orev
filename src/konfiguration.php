<?php
/* Konfiguration der Installation: von der Einrichtung als orev-konfiguration.php erzeugt.
   Sie enthält den Pfad zum Datenordner und den Schlüssel. Ohne diese Datei sind die Daten nicht lesbar,
   deshalb gehört sie zusammen mit dem Datenordner in jede Sicherung. */

define('OREV_KONFIGURATION', OREV_WURZEL . '/orev-konfiguration.php');

function istEingerichtet() {
  return is_file(OREV_KONFIGURATION);
}

function konfiguration($schluesselName) {
  static $werte = null;
  if ($werte === null) {
    $werte = istEingerichtet() ? require OREV_KONFIGURATION : array();
    if (!is_array($werte)) $werte = array();
  }
  if (!array_key_exists($schluesselName, $werte)) throw new RuntimeException("Konfiguration unvollständig: $schluesselName");
  return $werte[$schluesselName];
}

function schluessel() {
  $schluessel = base64_decode(konfiguration('schluessel'), true);
  if ($schluessel === false || strlen($schluessel) !== 32) throw new RuntimeException('Ungültiger Schlüssel in der Konfiguration');
  return $schluessel;
}

function konfigurationSchreiben($datenPfad, $schluesselRoh) {
  $inhalt = "<?php\n"
    . "/* Von der Orev-Einrichtung erzeugt. Zusammen mit dem Datenordner sichern und niemals weitergeben:\n"
    . "   Wer diese Datei hat, kann die Daten entschlüsseln. */\n"
    . 'return ' . var_export(array('daten_pfad' => $datenPfad, 'schluessel' => base64_encode($schluesselRoh)), true) . ";\n";
  if (file_put_contents(OREV_KONFIGURATION, $inhalt, LOCK_EX) === false) throw new RuntimeException('Konfiguration konnte nicht geschrieben werden');
  @chmod(OREV_KONFIGURATION, 0600);
}
