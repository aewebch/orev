<?php
/* 0.5.0: Programmpunkte erhalten Ablaufplan und Farbe, Teams und Mitglieder eine Farbe, Events einen Agenda-Zeitbereich */
return function () {
  foreach (speicherListe('events') as $name) {
    speicherAendern($name, null, function (&$event) {
      if ($event === null) return;
      if (!isset($event['agenda'])) $event['agenda'] = agendaStandard();
      foreach ($event['programmpunkte'] as $i => $punkt) {
        if (!isset($punkt['ablauf'])) $event['programmpunkte'][$i]['ablauf'] = ablaufLeer();
        if (!isset($punkt['farbe'])) $event['programmpunkte'][$i]['farbe'] = '';
      }
      foreach ($event['teams'] as $i => $team) {
        if (!isset($team['farbe'])) $event['teams'][$i]['farbe'] = '';
      }
      foreach ($event['mitglieder'] as $i => $mitglied) {
        if (!isset($mitglied['farbe'])) $event['mitglieder'][$i]['farbe'] = '';
      }
    });
  }
};
