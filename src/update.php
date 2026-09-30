<?php
/* Update-Prüfung und Installation über GitHub-Releases (Mechanismus aus ormeet).
   Es werden keine Nutzerdaten übermittelt, nur die Anfrage nach dem neuesten Release des öffentlichen Repositorys.
   Das Repository ist fest: Orev wird öffentlich verteilt, Installationen holen Updates immer aus derselben Quelle.
   Das Ergebnis der Prüfung wird 6 Stunden gemerkt; ein Fehler bei GitHub beeinträchtigt die App nie. */

define('OREV_UPDATE_CACHE', 6 * 3600);
define('OREV_UPDATE_REPO', 'aewebch/orev');

/* Liefert array(Status, Inhalt); Status 0 bei Verbindungsfehler */
function holen($url) {
  $header = array('User-Agent: Orev', 'Accept: application/vnd.github+json');
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_MAXREDIRS => 3,
      CURLOPT_TIMEOUT => 30,
      CURLOPT_HTTPHEADER => $header,
      CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
      CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
      CURLOPT_SSL_VERIFYPEER => true,
      CURLOPT_SSL_VERIFYHOST => 2,
    ));
    $inhalt = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return array($inhalt === false ? 0 : $status, $inhalt === false ? '' : $inhalt);
  }
  $kontext = stream_context_create(array(
    'http' => array('header' => implode("\r\n", $header), 'timeout' => 30, 'follow_location' => 1, 'max_redirects' => 3, 'ignore_errors' => true),
    'ssl' => array('verify_peer' => true, 'verify_peer_name' => true),
  ));
  $inhalt = @file_get_contents($url, false, $kontext);
  if ($inhalt === false) return array(0, '');
  $status = 0;
  if (isset($http_response_header)) {
    foreach ($http_response_header as $zeile) {
      if (preg_match('#^HTTP/\S+ (\d{3})#', $zeile, $treffer)) $status = (int) $treffer[1];
    }
  }
  return array($status, $inhalt);
}

function neuestesRelease($einstellungen) {
  list($status, $inhalt) = holen('https://api.github.com/repos/' . OREV_UPDATE_REPO . '/releases/latest');
  if ($status === 0) throw new RuntimeException('GitHub ist nicht erreichbar.');
  if ($status === 404) throw new RuntimeException('Kein Release gefunden.');
  if ($status !== 200) throw new RuntimeException("GitHub antwortet mit Status $status.");
  $release = json_decode($inhalt, true);
  $version = isset($release['tag_name']) ? ltrim($release['tag_name'], 'v') : '';
  if (!preg_match('/^\d+\.\d+\.\d+$/', $version)) throw new RuntimeException('Ungültige Versionsangabe bei GitHub.');
  return array(
    'tag' => $release['tag_name'],
    'version' => $version,
    'notizen' => isset($release['body']) ? (string) $release['body'] : '',
    'url' => isset($release['html_url']) ? (string) $release['html_url'] : '',
  );
}

function updateStand($erzwingen) {
  $einstellungen = einstellungenLesen();
  $stand = $einstellungen['update_stand'];
  if (!$erzwingen && is_array($stand) && $stand['geprueft'] > time() - OREV_UPDATE_CACHE) {
    $stand['lokal'] = lokaleVersion();
    $stand['verfuegbar'] = $stand['aktuell'] !== '' && version_compare($stand['aktuell'], $stand['lokal'], '>');
    return $stand;
  }
  $stand = array('geprueft' => time(), 'lokal' => lokaleVersion(), 'aktuell' => '', 'verfuegbar' => false, 'notizen' => '', 'url' => '', 'fehler' => '');
  try {
    $release = neuestesRelease($einstellungen);
    $stand['aktuell'] = $release['version'];
    $stand['notizen'] = $release['notizen'];
    $stand['url'] = $release['url'];
    $stand['verfuegbar'] = version_compare($release['version'], $stand['lokal'], '>');
  } catch (Exception $e) {
    $stand['fehler'] = $e->getMessage();
  }
  einstellungenAendern(function (&$daten) use ($stand) {
    $daten['update_stand'] = $stand;
  });
  return $stand;
}

/* Dateien, die ein Update nie überschreibt */
function updateGeschuetzt($pfad) {
  return $pfad === '' || substr($pfad, -1) === '/'
    || $pfad === 'orev-konfiguration.php' || $pfad === 'orev-einrichtungscode.php'
    || strpos($pfad, 'daten/') === 0;
}

function updateInstallieren() {
  if (!class_exists('ZipArchive')) throw new RuntimeException('Die PHP-Erweiterung zip fehlt. Bitte installieren Sie das Update von Hand.');
  $einstellungen = einstellungenLesen();
  $release = neuestesRelease($einstellungen);
  if (!version_compare($release['version'], lokaleVersion(), '>')) throw new RuntimeException('Es ist bereits die aktuelle Version installiert.');

  list($status, $inhalt) = holen('https://api.github.com/repos/' . OREV_UPDATE_REPO . '/zipball/' . rawurlencode($release['tag']));
  if ($status !== 200 || substr($inhalt, 0, 2) !== 'PK') throw new RuntimeException('Das Update-Paket konnte nicht geladen werden.');
  $zipDatei = konfiguration('daten_pfad') . '/update-' . bin2hex(random_bytes(6)) . '.zip';
  file_put_contents($zipDatei, $inhalt);

  try {
    $zip = new ZipArchive();
    if ($zip->open($zipDatei) !== true) throw new RuntimeException('Das Update-Paket ist beschädigt.');

    /* Erst vollständig prüfen, dann schreiben: GitHub verpackt alles in einen Wurzelordner, den wir entfernen */
    $dateien = array();
    for ($i = 0; $i < $zip->numFiles; $i++) {
      $name = $zip->getNameIndex($i);
      $schraegstrich = strpos($name, '/');
      $pfad = $schraegstrich === false ? '' : substr($name, $schraegstrich + 1);
      if (updateGeschuetzt($pfad)) continue;
      if (strpos($pfad, '..') !== false || strpos($pfad, '\\') !== false || $pfad[0] === '/' || strpos($pfad, ':') !== false) {
        throw new RuntimeException('Das Update-Paket enthält einen unzulässigen Pfad.');
      }
      $dateien[$pfad] = $i;
    }
    if (!isset($dateien['VERSION']) || trim($zip->getFromIndex($dateien['VERSION'])) !== $release['version']) {
      throw new RuntimeException('Die Version im Update-Paket passt nicht zum Release.');
    }

    $geschrieben = array();
    foreach ($dateien as $pfad => $i) {
      $ziel = OREV_WURZEL . '/' . $pfad;
      if (!is_dir(dirname($ziel))) mkdir(dirname($ziel), 0755, true);
      if (file_put_contents($ziel, $zip->getFromIndex($i)) === false) throw new RuntimeException("$pfad konnte nicht geschrieben werden.");
      $geschrieben[] = $pfad;
    }
    $zip->close();
  } finally {
    @unlink($zipDatei);
  }
  einstellungenAendern(function (&$daten) {
    $daten['update_stand'] = null;
  });
  return array('version' => $release['version'], 'dateien' => $geschrieben);
}
