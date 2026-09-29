<?php
/* Einfacher Testlauf ohne Abhängigkeiten: php tests/run.php
   Jede Datei tests/*_test.php definiert Funktionen test_…; sie prüfen mit pruefe() und pruefeGleich(). */

if (PHP_SAPI !== 'cli') exit;

require dirname(__DIR__) . '/src/kern.php';
require dirname(__DIR__) . '/src/konfiguration.php';
require dirname(__DIR__) . '/src/speicher.php';
require dirname(__DIR__) . '/src/sicherheit.php';
require dirname(__DIR__) . '/src/personen.php';
require dirname(__DIR__) . '/src/einstellungen.php';
require dirname(__DIR__) . '/src/update.php';

$fehlgeschlagen = array();
$anzahl = 0;

function pruefe($bedingung, $text) {
  if (!$bedingung) throw new Exception($text);
}

function pruefeGleich($erwartet, $tatsaechlich, $text) {
  if ($erwartet !== $tatsaechlich) {
    throw new Exception($text . "\n    erwartet: " . var_export($erwartet, true) . "\n    erhalten: " . var_export($tatsaechlich, true));
  }
}

function pruefeAusnahme($funktion, $text) {
  try {
    $funktion();
  } catch (Exception $e) {
    return;
  }
  throw new Exception($text);
}

foreach (glob(__DIR__ . '/*_test.php') as $datei) require $datei;

foreach (get_defined_functions()['user'] as $funktion) {
  if (strpos($funktion, 'test_') !== 0) continue;
  $anzahl++;
  try {
    $funktion();
    echo '.';
  } catch (Exception $e) {
    echo 'F';
    $fehlgeschlagen[] = $funktion . ': ' . $e->getMessage();
  }
}

echo "\n\n$anzahl Tests, " . count($fehlgeschlagen) . " fehlgeschlagen\n";
foreach ($fehlgeschlagen as $meldung) echo "\n- $meldung\n";
exit($fehlgeschlagen ? 1 : 0);
