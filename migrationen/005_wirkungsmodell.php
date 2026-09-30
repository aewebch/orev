<?php
/* 0.8.0: Events erhalten ein Wirkungsmodell als Bericht der Nachbereitung */
return function () {
  foreach (speicherListe('events') as $name) {
    speicherAendern($name, null, function (&$event) {
      if ($event === null) return;
      if (!isset($event['wirkungsmodell'])) $event['wirkungsmodell'] = wirkungsmodellLeer();
    });
  }
};
