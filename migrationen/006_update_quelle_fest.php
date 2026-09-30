<?php
/* 0.9.1: Die Update-Quelle ist fest (öffentliches Repository aewebch/orev). Früher gespeicherte Angaben zu
   Repository und GitHub-Token werden entfernt, damit kein Token mehr in der Installation liegt; ebenso die seit 0.2.0
   ungenutzte Einstellung events_anlegen. */
return function () {
  speicherAendern('installation', array(), function (&$daten) {
    unset($daten['github_repo'], $daten['github_token'], $daten['events_anlegen']);
    $daten['update_stand'] = null;
  });
};
