<?php
/* Update: Konfiguration, Einrichtungscode und Daten werden nie überschrieben */

function test_update_ueberschreibt_keine_geschuetzten_dateien() {
  foreach (array('orev-konfiguration.php', 'orev-einrichtungscode.php', 'daten/personen.orev', 'daten/', '', 'js/') as $pfad) {
    pruefe(updateGeschuetzt($pfad), "Nicht geschützt: $pfad");
  }
  foreach (array('api.php', 'VERSION', 'js/start.js', 'src/speicher.php') as $pfad) {
    pruefe(!updateGeschuetzt($pfad), "Fälschlich geschützt: $pfad");
  }
}
