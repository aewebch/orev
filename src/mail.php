<?php
/* E-Mail-Versand über die mail()-Funktion des Hostings. Empfänger und Absender werden streng geprüft,
   Betreff und Namen MIME-kodiert, damit keine zusätzlichen Header eingeschleust werden können. */

function mailSenden($an, $betreff, $text) {
  $einstellungen = einstellungenLesen();
  if (!$einstellungen['mail_aktiv'] || !gueltigeEmail($an) || !gueltigeEmail($einstellungen['mail_absender'])) return false;
  $header = array(
    'From: ' . mb_encode_mimeheader($einstellungen['name'], 'UTF-8') . ' <' . $einstellungen['mail_absender'] . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
  );
  return @mail($an, mb_encode_mimeheader($betreff, 'UTF-8'), $text, implode("\r\n", $header));
}

function einladungSenden($person, $link) {
  $einstellungen = einstellungenLesen();
  $text = 'Guten Tag ' . $person['vorname'] . ' ' . $person['name'] . "\n\n"
    . 'Sie wurden zu ' . $einstellungen['name'] . " eingeladen. Über diesen Link legen Sie Ihr Passwort fest:\n\n"
    . $link . "\n\n"
    . 'Der Link ist ' . OREV_EINLADUNG_TAGE . " Tage gültig und funktioniert nur einmal.\n";
  return mailSenden($person['email'], 'Einladung zu ' . $einstellungen['name'], $text);
}
