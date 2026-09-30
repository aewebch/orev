<?php
/* Orev – Startseite. Hängt die installierte Version an alle Skript- und Stil-Adressen, damit Browser nach einem Update
   garantiert die neuen Dateien laden. Die Seite selbst wird nie gecacht. */

require __DIR__ . '/src/kern.php';
require __DIR__ . '/src/sicherheit.php';

$version = rawurlencode(lokaleVersion());

$skripte = array(
  'lib/vue.global.prod.js',
  'lib/vue-router.global.prod.js',
  'js/kern/api.js',
  'js/kern/app.js',
  'js/komponenten/icons.js',
  'js/komponenten/actions.js',
  'js/komponenten/forms.js',
  'js/komponenten/surfaces.js',
  'js/komponenten/feedback.js',
  'js/komponenten/overlays.js',
  'js/komponenten/navigation.js',
  'js/komponenten/orev.js',
  'js/komponenten/bedienung.js',
  'js/komponenten/leiste.js',
  'js/komponenten/kalender-abo.js',
  'js/seiten/einrichtung.js',
  'js/seiten/anmelden.js',
  'js/seiten/einladung.js',
  'js/seiten/dashboard.js',
  'js/seiten/event.js',
  'js/seiten/event-uebersicht.js',
  'js/seiten/event-personen.js',
  'js/seiten/event-rollen.js',
  'js/seiten/event-programm.js',
  'js/seiten/event-material.js',
  'js/seiten/event-aufgaben.js',
  'js/seiten/event-ablauf.js',
  'js/seiten/event-konzept.js',
  'js/seiten/event-wirkungsmodell.js',
  'js/seiten/mitteilungen.js',
  'js/seiten/konto.js',
  'js/seiten/einstellungen.js',
  'js/kern/router.js',
  'js/start.js',
);
$stile = array(
  'css/tokens/fonts.css',
  'css/tokens/colors.css',
  'css/tokens/typography.css',
  'css/tokens/spacing.css',
  'css/tokens/shape.css',
  'css/tokens/motion.css',
  'css/tokens/base.css',
  'css/components/aeweb.css',
  'css/orev.css',
);

sicherheitsHeader();
/* 'unsafe-eval' braucht Vue, um die Vorlagen ohne Build-Schritt im Browser zu übersetzen */
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
header('Cache-Control: no-cache');
header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="de-CH">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="orev-version" content="<?= htmlspecialchars(lokaleVersion()) ?>">
    <meta name="referrer" content="no-referrer">
    <title>Orev</title>
    <link rel="icon" href="icons/calendar.svg" type="image/svg+xml">
<?php foreach ($stile as $stil): ?>
    <link rel="stylesheet" href="<?= $stil ?>?v=<?= $version ?>">
<?php endforeach; ?>
  </head>
  <body>
    <div id="app">
      <noscript><p class="lade-hinweis">Orev braucht JavaScript.</p></noscript>
    </div>
<?php foreach ($skripte as $skript): ?>
    <script src="<?= $skript ?>?v=<?= $version ?>"></script>
<?php endforeach; ?>
  </body>
</html>
