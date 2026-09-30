<?php
/* 0.11.0: Events erhalten Freigabe-Links */
return function () {
  foreach (speicherListe('events') as $name) {
    speicherAendern($name, null, function (&$event) {
      if ($event === null) return;
      if (!isset($event['freigaben'])) $event['freigaben'] = array();
    });
  }
};
