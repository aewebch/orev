<?php
/* 0.6.0: Events erhalten Aufgaben (mit Vorbereitungsterminen) und Materialposten */
return function () {
  foreach (speicherListe('events') as $name) {
    speicherAendern($name, null, function (&$event) {
      if ($event === null) return;
      if (!isset($event['aufgaben'])) $event['aufgaben'] = array();
      if (!isset($event['material'])) $event['material'] = array();
    });
  }
};
