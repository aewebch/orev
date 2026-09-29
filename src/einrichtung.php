<?php
/* Einrichtungsassistent: läuft nur, solange es keine orev-konfiguration.php gibt.
   Schutz gegen Übernahme einer frisch hochgeladenen Installation: Beim ersten Aufruf entsteht auf dem Server die Datei
   orev-einrichtungscode.php. Über das Web aufgerufen bricht sie sofort ab (auch ohne .htaccess, z. B. unter nginx);
   nur wer per FTP oder Dateimanager Zugriff auf die Dateien hat, kann den Code lesen. */

define('OREV_EINRICHTUNGSCODE', OREV_WURZEL . '/orev-einrichtungscode.php');

function einrichtungscode() {
  if (!is_file(OREV_EINRICHTUNGSCODE)) {
    $zeichen = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $code = '';
    for ($i = 0; $i < 20; $i++) {
      if ($i > 0 && $i % 5 === 0) $code .= '-';
      $code .= $zeichen[random_int(0, strlen($zeichen) - 1)];
    }
    $inhalt = "<?php exit; ?>\nEinrichtungscode für Orev (in der Einrichtung eingeben, danach wird diese Datei gelöscht):\n" . $code . "\n";
    if (file_put_contents(OREV_EINRICHTUNGSCODE, $inhalt, LOCK_EX) === false) return '';
    @chmod(OREV_EINRICHTUNGSCODE, 0600);
  }
  $zeilen = file(OREV_EINRICHTUNGSCODE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
  return trim(end($zeilen));
}

function datenPfadVorschlag() {
  $ausserhalb = dirname(OREV_WURZEL);
  if (is_writable($ausserhalb)) return str_replace('\\', '/', $ausserhalb) . '/orev-daten';
  return str_replace('\\', '/', OREV_WURZEL) . '/daten';
}

function einrichtungsPruefungen() {
  $gcm = function_exists('openssl_get_cipher_methods') && in_array('aes-256-gcm', openssl_get_cipher_methods(), true);
  $lokal = isset($_SERVER['HTTP_HOST']) && preg_match('/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/', $_SERVER['HTTP_HOST']);
  return array(
    array('name' => 'PHP 7.2 oder neuer', 'ok' => version_compare(PHP_VERSION, '7.2.0', '>='), 'pflicht' => true, 'wert' => PHP_VERSION),
    array('name' => 'OpenSSL mit AES-256-GCM', 'ok' => $gcm, 'pflicht' => true, 'wert' => ''),
    array('name' => 'Erweiterung mbstring', 'ok' => function_exists('mb_encode_mimeheader'), 'pflicht' => true, 'wert' => ''),
    array('name' => 'Installationsordner beschreibbar', 'ok' => is_writable(OREV_WURZEL), 'pflicht' => true, 'wert' => ''),
    array('name' => 'Erweiterung zip (für Updates per Klick)', 'ok' => class_exists('ZipArchive'), 'pflicht' => false, 'wert' => ''),
    array('name' => 'HTTPS', 'ok' => istHttps() || $lokal, 'pflicht' => false, 'wert' => istHttps() ? 'aktiv' : ($lokal ? 'lokal' : 'fehlt')),
  );
}

function aktionEinrichtungStatus() {
  $pruefungen = einrichtungsPruefungen();
  $code = is_writable(OREV_WURZEL) ? einrichtungscode() : '';
  antwort(array(
    'eingerichtet' => false,
    'version' => lokaleVersion(),
    'pruefungen' => $pruefungen,
    'codeDatei' => basename(OREV_EINRICHTUNGSCODE),
    'codeBereit' => $code !== '',
    'datenPfad' => datenPfadVorschlag(),
  ));
}

function aktionEinrichtungAbschliessen() {
  nurPost();
  foreach (einrichtungsPruefungen() as $pruefung) {
    if ($pruefung['pflicht'] && !$pruefung['ok']) fehler('Voraussetzung fehlt: ' . $pruefung['name']);
  }

  if (!is_file(OREV_EINRICHTUNGSCODE)) fehler('Einrichtungscode nicht gefunden. Bitte laden Sie die Seite neu.');
  $sperrdatei = OREV_WURZEL . '/orev-einrichtung.lock';
  $sperre = fopen($sperrdatei, 'c');
  if ($sperre === false || !flock($sperre, LOCK_EX)) fehler('Die Einrichtung läuft bereits.', 409);
  try {
    if (istEingerichtet()) fehler('Orev ist bereits eingerichtet.', 409);
    usleep(500000);
    $code = strtoupper(str_replace(' ', '', (string) feld('code')));
    if (!hash_equals(einrichtungscode(), $code)) fehler('Der Einrichtungscode stimmt nicht.', 403);

    $name = (string) feld('name', 'Orev');
    $datenPfad = rtrim(str_replace('\\', '/', (string) feld('datenPfad')), '/');
    $admin = feld('admin', array());
    $vorname = isset($admin['vorname']) ? trim((string) $admin['vorname']) : '';
    $nachname = isset($admin['name']) ? trim((string) $admin['name']) : '';
    $kuerzel = isset($admin['kuerzel']) ? trim((string) $admin['kuerzel']) : '';
    $email = isset($admin['email']) ? trim((string) $admin['email']) : '';
    $passwort = isset($admin['passwort']) ? (string) $admin['passwort'] : '';

    if ($name === '' || mb_strlen($name) > 80) fehler('Bitte geben Sie einen Namen für die Installation an.');
    if ($vorname === '' || $nachname === '') fehler('Bitte geben Sie Vorname und Name an.');
    if (!gueltigeEmail($email)) fehler('Bitte geben Sie eine gültige E-Mail-Adresse an.');
    passwortPruefen($passwort);
    if ($datenPfad === '' || !preg_match('#^([A-Za-z]:)?/#', $datenPfad)) fehler('Bitte geben Sie den Datenordner als absoluten Pfad an.');
    if (is_dir($datenPfad) && count(glob($datenPfad . '/*' . OREV_ENDUNG) ?: array()) > 0) fehler('Der Datenordner enthält bereits Orev-Daten.');
    if (!is_dir($datenPfad) && !@mkdir($datenPfad, 0700, true)) fehler('Der Datenordner konnte nicht angelegt werden.');
    if (!is_writable($datenPfad)) fehler('Der Datenordner ist nicht beschreibbar.');
    datenordnerSchuetzen($datenPfad);

    konfigurationSchreiben($datenPfad, random_bytes(32));
    einstellungenAendern(function (&$einstellungen) use ($name) {
      $einstellungen['name'] = $name;
      $einstellungen['schema_version'] = hoechsteMigration();
    });
    $person = neuePerson($vorname, $nachname, $kuerzel, $email);
    $person['konto'] = neuesKonto($passwort, true, true);
    $token = sitzungAnlegen($person);
    speicherSchreiben('personen', array('personen' => array($person)));
  } finally {
    flock($sperre, LOCK_UN);
    fclose($sperre);
  }
  unlink(OREV_EINRICHTUNGSCODE);
  @unlink($sperrdatei);
  sitzungsCookieSetzen($token);
  antwort(array('ok' => true));
}
