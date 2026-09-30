<?php
/* 0.7.0: Events erhalten Konzept (Ziele, Zielgruppe), Reflexion (Teamkultur) und Feedbacks */
return function () {
  foreach (speicherListe('events') as $name) {
    speicherAendern($name, null, function (&$event) {
      if ($event === null) return;
      if (!isset($event['konzept'])) $event['konzept'] = konzeptLeer();
      if (!isset($event['reflexion'])) $event['reflexion'] = reflexionLeer();
      if (!isset($event['feedbacks'])) $event['feedbacks'] = array();
    });
  }
};
