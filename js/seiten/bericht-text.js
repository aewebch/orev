/* Auswertungsbericht als Fliesstext: berichtErstellen(event) erzeugt aus Zielüberprüfung, Bewertungen, Wirkungsmodell,
   Teamkultur und Feedback eine Folge von Blöcken (Überschriften, Absätze, Zitate, Listen, Tabellen) und ein Quellen-
   verzeichnis. Zentrale Aussagen folgen dem argumentativen Dreischritt: Behauptung (these), Begründung (begruendung),
   Beleg oder Beispiel (beleg). Jeder Beleg verweist mit einer Nummer auf seine Quelle.
   Grundlage ist nur, was die Person sehen darf (das Event kommt gefiltert vom Server). Feedbacks erscheinen anonymisiert
   und nur, wenn sie an das ganze Team gerichtet sind; persönliche Rückmeldungen an einzelne Personen bleiben draussen. */

var BERICHT_FUELLWOERTER = ('aber alle allem allen aller alles also als am an auch auf aus bei beim bin bis bitte da dabei dafür damit dann das '
  + 'dass dem den denn der des die dies diese diesem diesen dieser dieses doch dort du durch ein eine einem einen einer eines er es etwas '
  + 'für ganz gar gerne gut gute guten hat hatte hätte ich ihr im immer in ist ja jede jeder jedes jetzt kann kein keine man mehr mein '
  + 'meine mich mir mit muss nach nicht noch nur ob oder ohne schon sehr sein seine selbst sich sie sind so sowie über um und uns unser '
  + 'unsere viel viele vom von vor war waren was weil wenig wenn wer wie wieder wir wird wo zu zum zur zwar toll super schön schöne '
  + 'fand finde fande mega richtig einfach wirklich besonders manchmal etwas dieses jenes beim bisschen mal').split(' ')

var BERICHT_LITERATUR = {
  smart: 'Doran, George T. (1981): There’s a S.M.A.R.T. Way to Write Management’s Goals and Objectives. In: Management Review 70 (11), S. 35–36.',
  quali: 'DOJ/AFAJ Dachverband Offene Kinder- und Jugendarbeit Schweiz: Quali-Tool. Qualitäts- und Wirkungsmodell für die Offene Kinder- und Jugendarbeit. Online unter www.quali-tool.ch.',
  phineo: 'PHINEO gAG (2013): Kursbuch Wirkung. Das Praxishandbuch für alle, die Gutes noch besser tun wollen. Berlin: PHINEO.',
}

var BERICHT_GRAD = {
  erreicht: { these: 'wurde erreicht', label: 'erreicht' },
  teilweise: { these: 'wurde teilweise erreicht', label: 'teilweise erreicht' },
  nicht: { these: 'wurde nicht erreicht', label: 'nicht erreicht' },
  offen: { these: 'ist noch offen', label: 'offen' },
}

var BERICHT_STAND = { etabliert: 'etabliert', aufbau: 'im Aufbau', klaerung: 'noch zu klären' }

/* Kleine Sprachhelfer */
function berichtSatz(text) {
  var t = String(text || '').trim().replace(/\.{2,}/g, '.')
  if (!t) return ''
  t = t.charAt(0).toUpperCase() + t.slice(1)
  return /[.!?…]»?$/.test(t) ? t : t + '.'
}

function berichtZitat(text, laenge) {
  var t = String(text || '').trim().replace(/\s+/g, ' ').replace(/[.\s]+$/, '')
  var max = laenge || 220
  if (t.length > max) t = t.slice(0, max).replace(/\s+\S*$/, '') + ' …'
  return '«' + t + '»'
}

function berichtAufzaehlung(liste) {
  if (liste.length <= 1) return liste.join('')
  return liste.slice(0, -1).join(', ') + ' und ' + liste[liste.length - 1]
}

function berichtZahl(n) {
  var woerter = ['keine', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf']
  return n < woerter.length ? woerter[n] : String(n)
}

/* Anteil in Worten: «die einzige Rückmeldung», «alle drei Rückmeldungen», «zwei von fünf Rückmeldungen» */
function berichtAnteil(n, total, einzahl, mehrzahl) {
  if (total === 1) return 'die einzige ' + einzahl
  if (n === total) return 'alle ' + berichtZahl(total) + ' ' + mehrzahl
  return (n === 1 ? 'eine' : berichtZahl(n)) + ' von ' + berichtZahl(total) + ' ' + mehrzahl
}

function berichtGross(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/* «vom 2. bis 11. Oktober 2026», «vom 30. September bis 2. Oktober 2026» oder «am 30. Oktober 2026» */
function berichtZeitraum(start, ende) {
  var datum = function (iso, optionen) { return new Date(iso + 'T12:00:00').toLocaleDateString('de-CH', optionen) }
  var lang = { day: 'numeric', month: 'long', year: 'numeric' }
  if (start === ende) return 'am ' + datum(start, lang)
  if (start.slice(0, 7) === ende.slice(0, 7)) return 'vom ' + Number(start.slice(8, 10)) + '. bis ' + datum(ende, lang)
  if (start.slice(0, 4) === ende.slice(0, 4)) return 'vom ' + datum(start, { day: 'numeric', month: 'long' }) + ' bis ' + datum(ende, lang)
  return 'vom ' + datum(start, lang) + ' bis ' + datum(ende, lang)
}

function berichtDatum(iso) {
  return new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function berichtZeitpunkt(iso) {
  return new Date(iso.slice(0, 10) + 'T12:00:00').toLocaleDateString('de-CH', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ', ' + iso.slice(11, 16)
}

/* Häufig genannte Begriffe (Substantive, im Deutschen gross geschrieben) aus mehreren Antworten, je Antwort einmal gezählt */
function berichtStichworte(texte) {
  var zaehler = {}
  var schreibweise = {}
  texte.forEach(function (text) {
    var gesehen = {}
    ;(String(text).match(/[A-ZÄÖÜ][a-zäöüß]{3,}/g) || []).forEach(function (wort) {
      var klein = wort.toLowerCase()
      if (BERICHT_FUELLWOERTER.indexOf(klein) >= 0 || gesehen[klein]) return
      gesehen[klein] = true
      zaehler[klein] = (zaehler[klein] || 0) + 1
      if (!schreibweise[klein]) schreibweise[klein] = wort
    })
  })
  return Object.keys(zaehler).filter(function (k) { return zaehler[k] >= 2 })
    .sort(function (a, b) { return zaehler[b] - zaehler[a] || a.localeCompare(b, 'de') })
    .slice(0, 3).map(function (k) { return '«' + schreibweise[k] + '»' })
}

function berichtErstellen(event) {
  var heute = new Date().toISOString().slice(0, 10)
  var stand = datumText(heute + 'T12:00:00')
  var bloecke = []
  var quellen = []
  var quellenNach = {}
  var kapitel = 0
  var abschnitt = 0

  /* Quelle registrieren; liefert ihre Nummer (gleiche Quelle, gleiche Nummer) */
  function quelle(schluessel, text) {
    if (!quellenNach[schluessel]) {
      quellen.push({ nummer: quellen.length + 1, text: text })
      quellenNach[schluessel] = quellen.length
    }
    return quellenNach[schluessel]
  }
  function datenquelle(schluessel, was, ort) {
    return quelle(schluessel, was + ', ' + ort + '. Orev, Event «' + event.titel + '», Stand ' + stand + '.')
  }
  function literatur(schluessel) {
    return quelle('lit-' + schluessel, BERICHT_LITERATUR[schluessel])
  }
  function h1(text) {
    kapitel++
    abschnitt = 0
    bloecke.push({ art: 'h1', text: text, nummer: String(kapitel), id: 'k' + kapitel })
  }
  function h2(text) {
    abschnitt++
    bloecke.push({ art: 'h2', text: text, nummer: kapitel + '.' + abschnitt, id: 'k' + kapitel + '-' + abschnitt })
  }
  function absatz(saetze) {
    var liste = saetze.filter(function (s) { return s && s.t })
    if (liste.length) bloecke.push({ art: 'p', saetze: liste })
  }
  /* Dreischritt: Behauptung, Begründung, Beleg; fehlt der Beleg, bleibt es ein gewöhnlicher Absatz */
  function argument(these, begruendung, beleg, belegQuelle, begruendungQuelle) {
    var saetze = [{ t: berichtSatz(these), rolle: 'these' }]
    if (begruendung) saetze.push({ t: berichtSatz(begruendung), rolle: 'begruendung', q: begruendungQuelle })
    if (beleg) saetze.push({ t: berichtSatz(beleg), rolle: 'beleg', q: belegQuelle })
    bloecke.push({ art: 'p', saetze: saetze, argument: !!(begruendung && beleg) })
  }
  function zitat(text, q) {
    bloecke.push({ art: 'zitat', t: berichtZitat(text, 320), q: q })
  }

  /* Daten sammeln */
  var konzept = event.konzept || { ziele: [], zielgruppe: null, teamkultur: null, bewertungen: null }
  var ziele = konzept.ziele.filter(function (z) { return z.pruefung })
  var geprueft = ziele.filter(function (z) { return z.pruefung.grad })
  var bilanz = { erreicht: 0, teilweise: 0, nicht: 0, offen: 0 }
  ziele.forEach(function (z) { bilanz[z.pruefung.grad || 'offen']++ })

  var bewertungen = konzept.bewertungen || { ort: { bewertung: '', notiz: '' }, tage: {}, punkte: {} }
  var punkte = event.programmpunkte.slice().sort(function (a, b) { return a.start.localeCompare(b.start) })
  var bewertetePunkte = punkte.filter(function (p) { return bewertungen.punkte[p.id] && bewertungen.punkte[p.id].bewertung })
    .map(function (p) { return Object.assign({ punkt: p }, bewertungen.punkte[p.id]) })
  var bewerteteTage = event.tage.filter(function (t) { return bewertungen.tage[t.datum] && bewertungen.tage[t.datum].bewertung })
    .map(function (t) { return Object.assign({ tag: t }, bewertungen.tage[t.datum]) })
  var alleBewertungen = bewertetePunkte.concat(bewerteteTage)
  if (bewertungen.ort.bewertung) alleBewertungen.push(bewertungen.ort)
  var zaehlen = function (liste, wert) { return liste.filter(function (b) { return b.bewertung === wert }).length }

  var modell = event.wirkungsmodell || { eintraege: [], verbindungen: [], verantwortung: '' }
  var spalte = function (id) { return modell.eintraege.filter(function (e) { return e.spalte === id }) }
  var eintragNach = {}
  modell.eintraege.forEach(function (e) { eintragNach[e.id] = e })
  var vorgaenger = function (e) {
    return modell.verbindungen.filter(function (v) { return v.zu === e.id }).map(function (v) { return eintragNach[v.von] }).filter(Boolean)
  }
  var outcomes = spalte('outcomes')
  var impacts = spalte('impacts')

  var wen = event.typ === 'camp' ? 'Das Camp' : 'Das Event'
  var darfFeedback = event.ich.recht.feedback >= 1
  var feedbacks = darfFeedback ? event.feedbacks.filter(function (f) { return !f.an }).map(function (f) { return Object.assign({}, f) }).sort(function (a, b) { return a.erstelltAm.localeCompare(b.erstelltAm) }) : []
  feedbacks.forEach(function (f, i) { f.nummer = i + 1 })
  var antworten = function (finger) { return feedbacks.filter(function (f) { return f.finger[finger] && f.finger[finger].trim() }) }
  var fingerQuelle = function (f, finger) {
    var name = FEEDBACK_FINGER.find(function (x) { return x.id === finger }).name
    return quelle('fb-' + f.id + '-' + finger, 'Rückmeldung ' + f.nummer + ' (Fünf-Finger-Methode, ' + name + '), anonymisiert. Orev, Event «' + event.titel + '», erfasst am ' + datumText(f.erstelltAm) + '.')
  }
  var zielQuelle = function (z) { return datenquelle('ziel-' + z.id, 'Zielüberprüfung zu ' + berichtZitat(z.formulierung, 60), 'Nachbereitung › Reflexion') }
  var punktQuelle = function (b) { return datenquelle('punkt-' + b.punkt.id, 'Bewertung des Programmpunkts ' + berichtZitat(b.punkt.titel, 60) + ' (' + berichtZeitpunkt(b.punkt.start) + ')', 'Nachbereitung › Reflexion') }
  var tagQuelle = function (b) { return datenquelle('tag-' + b.tag.datum, 'Bewertung des Programmtags vom ' + datumText(b.tag.datum + 'T12:00:00'), 'Nachbereitung › Reflexion') }
  var ortQuelle = function () { return datenquelle('ort', 'Bewertung von Ort und Unterkunft', 'Nachbereitung › Reflexion') }
  var wmQuelle = function (e) { return datenquelle('wm-' + e.id, 'Wirkungsmodell, Eintrag ' + (e.nummer ? e.nummer + ' ' : '') + berichtZitat(e.titel, 60), 'Nachbereitung › Wirkungsmodell') }
  var wmTitel = function (e) { return (e.nummer ? e.nummer + ' ' : '') + berichtZitat(e.titel, 80) }

  /* 1 Zusammenfassung */
  h1('Zusammenfassung')
  absatz([{ t: 'Dieser Bericht wertet ' + (event.typ === 'camp' ? 'das Camp' : 'das Event') + ' «' + event.titel + '» aus, das ' + berichtZeitraum(event.startDatum, event.endDatum) + ' stattfand' + (event.ort ? '; Durchführungsort war ' + event.ort : '') + '.' },
    { t: 'Er stützt sich auf die in Orev erfassten Angaben des Leitungsteams: Zielüberprüfung, Bewertungen, Wirkungsmodell' + (darfFeedback ? ' und die Rückmeldungen nach der Fünf-Finger-Methode' : '') + '. Zentrale Aussagen sind jeweils begründet und mit einem Beleg versehen, dessen Quelle im Quellenverzeichnis steht.' }])
  if (geprueft.length) {
    var grad = (bilanz.erreicht + bilanz.teilweise / 2) / geprueft.length
    var these = wen + (grad >= 0.99 ? ' hat seine Ziele erreicht' : grad >= 0.6 ? ' hat seine Ziele überwiegend erreicht' : grad >= 0.35 ? ' hat seine Ziele teilweise erreicht' : ' hat seine Ziele nur in geringem Mass erreicht')
    var teile = []
    var zahlText = function (n) { return n === 1 ? 'eines' : berichtZahl(n) }
    if (geprueft.length === 1) {
      teile.push('als ' + BERICHT_GRAD[geprueft[0].pruefung.grad].label)
    } else {
      if (bilanz.erreicht) teile.push(zahlText(bilanz.erreicht) + ' als erreicht')
      if (bilanz.teilweise) teile.push(zahlText(bilanz.teilweise) + ' als teilweise erreicht')
      if (bilanz.nicht) teile.push(zahlText(bilanz.nicht) + ' als nicht erreicht')
    }
    var beispiel = geprueft.find(function (z) { return z.pruefung.grad === 'erreicht' && z.pruefung.ergebnis }) || geprueft.find(function (z) { return z.pruefung.ergebnis })
    argument(these,
      geprueft.length === 1 ? 'Das einzige überprüfte Ziel gilt ' + teile[0] : 'Von ' + berichtZahl(geprueft.length) + ' überprüften Zielen gelten ' + berichtAufzaehlung(teile),
      beispiel ? 'So hält die Überprüfung zum Ziel ' + berichtZitat(beispiel.formulierung, 90) + ' fest: ' + berichtZitat(beispiel.pruefung.ergebnis) : '',
      beispiel ? zielQuelle(beispiel) : null)
  }
  if (alleBewertungen.length) {
    var gut = zaehlen(alleBewertungen, 'gut')
    var schwach = zaehlen(alleBewertungen, 'schwach')
    var besteNotiz = bewertetePunkte.find(function (b) { return b.bewertung === 'gut' && b.notiz })
    argument(gut * 2 > alleBewertungen.length ? 'Die Durchführung wird insgesamt positiv beurteilt' : schwach * 2 > alleBewertungen.length ? 'Die Durchführung wird kritisch beurteilt' : 'Die Durchführung wird gemischt beurteilt',
      alleBewertungen.length === 1 ? 'Die bisher einzige Bewertung lautet «' + alleBewertungen[0].bewertung + '»'
        : 'Von ' + alleBewertungen.length + ' Bewertungen zu Ort, Programmtagen und Programmpunkten lauten ' + berichtAufzaehlung([gut ? gut + ' «gut»' : '', zaehlen(alleBewertungen, 'mittel') ? zaehlen(alleBewertungen, 'mittel') + ' «mittel»' : '', schwach ? schwach + ' «schwach»' : ''].filter(Boolean)),
      besteNotiz ? 'Beispielhaft steht dafür ' + berichtZitat(besteNotiz.punkt.titel, 60) + ', wozu das Team notiert: ' + berichtZitat(besteNotiz.notiz) : '',
      besteNotiz ? punktQuelle(besteNotiz) : null)
  }
  var outcomesBewertet = outcomes.filter(function (e) { return e.status && e.status !== 'offen' })
  if (outcomesBewertet.length) {
    var erreichteO = outcomes.filter(function (e) { return e.status === 'erreicht' })
    var beispielO = erreichteO.find(function (e) { return e.indikator }) || erreichteO[0]
    argument(erreichteO.length ? 'Bei der Zielgruppe sind Wirkungen erkennbar' : 'Wirkungen bei der Zielgruppe lassen sich noch nicht belegen',
      outcomes.length === 1 ? 'Die einzige im Wirkungsmodell beschriebene Wirkung bei der Zielgruppe gilt als ' + BERICHT_GRAD[outcomes[0].status || 'offen'].label
        : erreichteO.length ? berichtGross(berichtAnteil(erreichteO.length, outcomes.length, '', 'im Wirkungsmodell beschriebenen Wirkungen bei der Zielgruppe')) + (erreichteO.length === 1 ? ' gilt' : ' gelten') + ' als erreicht'
        : 'Keine der ' + berichtZahl(outcomes.length) + ' im Wirkungsmodell beschriebenen Wirkungen bei der Zielgruppe gilt bisher als erreicht',
      beispielO ? 'Dazu gehört ' + wmTitel(beispielO) + (beispielO.indikator ? ', gemessen am Indikator ' + berichtZitat(beispielO.indikator) : '') : '',
      beispielO ? wmQuelle(beispielO) : null)
  }
  if (feedbacks.length) {
    var daumen = antworten('daumen')
    var mittel = antworten('mittelfinger')
    argument(daumen.length >= mittel.length ? 'Das Team zieht eine überwiegend positive Bilanz' : 'Das Team sieht neben Gelungenem deutlichen Veränderungsbedarf',
      feedbacks.length === 1 ? 'Die bisher einzige Rückmeldung nennt ' + berichtAufzaehlung([daumen.length ? 'Gelungenes' : '', mittel.length ? 'Punkte, die geändert werden sollten' : ''].filter(Boolean))
        : 'Von ' + berichtZahl(feedbacks.length) + ' Rückmeldungen nennen ' + berichtZahl(daumen.length) + ' Gelungenes und ' + berichtZahl(mittel.length) + ' Punkte, die geändert werden sollten',
      daumen.length ? 'Eine Person schreibt etwa: ' + berichtZitat(daumen[0].finger.daumen, 160) : '',
      daumen.length ? fingerQuelle(daumen[0], 'daumen') : null)
  }
  if (!geprueft.length && !alleBewertungen.length && !outcomesBewertet.length && !feedbacks.length) {
    absatz([{ t: 'Bisher liegen noch keine Auswertungsdaten vor. Sobald Ziele überprüft, Ort, Tage und Programmpunkte bewertet, das Wirkungsmodell ausgefüllt und Rückmeldungen erfasst sind, entsteht hier eine begründete Zusammenfassung.' }])
  }

  /* 2 Ausgangslage */
  h1('Ausgangslage und Ziele')
  var dauer = event.tage.length
  absatz([
    { t: '«' + event.titel + '» dauerte ' + (dauer === 1 ? 'einen Tag' : berichtZahl(dauer) + ' Tage') + '.' + (event.ort ? ' Durchführungsort war ' + event.ort + '.' : '') },
    event.thema ? { t: 'Das Thema lautete ' + berichtZitat(event.thema) + '.' } : null,
    event.beschreibung ? { t: berichtSatz(event.beschreibung) } : null,
  ])
  var zg = konzept.zielgruppe
  if (zg && (zg.beschreibung || zg.anzahl || zg.alterVon)) {
    var zgQ = datenquelle('konzept', 'Ziele und Zielgruppe', 'Setup › Ziele')
    var alter = zg.alterVon && zg.alterBis ? ' im Alter von ' + zg.alterVon + ' bis ' + zg.alterBis + ' Jahren' : zg.alterVon ? ' ab ' + zg.alterVon + ' Jahren' : ''
    absatz([
      { t: 'Die Zielgruppe umfasste ' + (zg.anzahl ? 'rund ' + zg.anzahl + ' ' : '') + 'Teilnehmende' + alter + '.' + (zg.beschreibung ? ' Beschrieben ist sie als ' + berichtZitat(zg.beschreibung, 300) + '.' : ''), q: zgQ },
      zg.besonderheiten ? { t: 'Zu beachten war: ' + berichtSatz(zg.besonderheiten) } : null,
    ])
  }
  if (konzept.ziele.length) {
    absatz([{ t: 'Das Leitungsteam formulierte im Vorfeld ' + (konzept.ziele.length === 1 ? 'ein Ziel' : berichtZahl(konzept.ziele.length) + ' Ziele') + ' nach den SMART-Kriterien: spezifisch, messbar, erreichbar, relevant und terminiert.', q: literatur('smart') }])
    bloecke.push({ art: 'liste', eintraege: konzept.ziele.map(function (z) {
      return [{ t: berichtSatz(z.formulierung) }, z.messkriterium ? { t: 'Messkriterium: ' + berichtSatz(z.messkriterium) } : null].filter(Boolean)
    }) })
  }

  /* 3 Zielüberprüfung */
  if (ziele.length) {
    h1('Zielüberprüfung')
    bloecke.push({ art: 'tabelle', kopf: ['Ergebnis', 'Anzahl Ziele'], zeilen: [['Erreicht', String(bilanz.erreicht)], ['Teilweise erreicht', String(bilanz.teilweise)], ['Nicht erreicht', String(bilanz.nicht)], ['Noch offen', String(bilanz.offen)]] })
    ziele.forEach(function (z, i) {
      h2('Ziel ' + (i + 1) + ': ' + berichtZitat(z.formulierung, 70).slice(1, -1))
      var p = z.pruefung
      var grad = BERICHT_GRAD[p.grad || 'offen']
      if (!p.grad) {
        absatz([{ t: 'Die Überprüfung dieses Ziels steht noch aus.' }, p.wie ? { t: 'Vorgesehen ist: ' + berichtSatz(p.wie) } : null])
        return
      }
      argument('Dieses Ziel ' + grad.these,
        p.wie ? 'Geprüft wurde es so: ' + berichtSatz(p.wie).replace(/\.$/, '') : z.messkriterium ? 'Massstab war das Messkriterium ' + berichtZitat(z.messkriterium) : '',
        p.ergebnis ? 'Das Ergebnis: ' + berichtSatz(p.ergebnis) : '',
        zielQuelle(z))
      if (p.kommentar) absatz([{ t: 'Das Team hält dazu fest: ' + berichtSatz(p.kommentar), q: zielQuelle(z) }])
    })
  }

  /* 4 Durchführung */
  if (alleBewertungen.length) {
    h1('Durchführung')
    if (bewertungen.ort.bewertung) {
      h2('Ort und Unterkunft')
      var ortName = event.ort ? 'Ort und Unterkunft (' + event.ort + ')' : 'Ort und Unterkunft'
      var ortThese = { gut: 'haben sich bewährt', mittel: 'haben sich nur bedingt bewährt', schwach: 'haben sich nicht bewährt' }[bewertungen.ort.bewertung]
      argument(ortName + ' ' + ortThese,
        'Das Leitungsteam bewertet sie in der Nachbereitung mit «' + bewertungen.ort.bewertung + '»',
        bewertungen.ort.notiz ? 'Begründet wird dies so: ' + berichtZitat(bewertungen.ort.notiz) : '',
        ortQuelle(), bewertungen.ort.notiz ? null : ortQuelle())
    }
    if (bewerteteTage.length) {
      h2('Programmtage')
      var guteTage = bewerteteTage.filter(function (b) { return b.bewertung === 'gut' })
      var schwacheTage = bewerteteTage.filter(function (b) { return b.bewertung === 'schwach' })
      var tagName = function (b) { return berichtDatum(b.tag.datum).split(',')[0] + (b.tag.thema ? ' (' + berichtZitat(b.tag.thema, 40) + ')' : '') }
      if (guteTage.length) {
        var tagBeleg = guteTage.find(function (b) { return b.notiz })
        argument('Besonders gelungen ' + (guteTage.length === 1 ? 'war der ' : 'waren die Tage ') + berichtAufzaehlung(guteTage.map(tagName)),
          (guteTage.length === 1 ? 'Er wurde' : 'Sie wurden') + ' mit «gut» bewertet',
          tagBeleg ? 'Zum ' + berichtDatum(tagBeleg.tag.datum).split(',')[0] + ' notiert das Team: ' + berichtZitat(tagBeleg.notiz) : '',
          tagBeleg ? tagQuelle(tagBeleg) : null, tagBeleg ? null : tagQuelle(guteTage[0]))
      }
      if (schwacheTage.length) {
        var schwachBeleg = schwacheTage.find(function (b) { return b.notiz })
        argument('Schwächer ' + (schwacheTage.length === 1 ? 'fiel der ' : 'fielen die Tage ') + berichtAufzaehlung(schwacheTage.map(tagName)) + ' aus',
          (schwacheTage.length === 1 ? 'Er erhielt' : 'Sie erhielten') + ' die Bewertung «schwach»',
          schwachBeleg ? 'Als Grund nennt das Team: ' + berichtZitat(schwachBeleg.notiz) : '',
          schwachBeleg ? tagQuelle(schwachBeleg) : null, schwachBeleg ? null : tagQuelle(schwacheTage[0]))
      }
      bloecke.push({ art: 'tabelle', kopf: ['Tag', 'Thema', 'Bewertung', 'Notiz'], zeilen: bewerteteTage.map(function (b) {
        return [datumText(b.tag.datum + 'T12:00:00'), b.tag.thema || '–', b.bewertung, b.notiz || '–']
      }) })
    }
    if (bewertetePunkte.length) {
      h2('Programmpunkte')
      var starke = bewertetePunkte.filter(function (b) { return b.bewertung === 'gut' })
      var schwache = bewertetePunkte.filter(function (b) { return b.bewertung === 'schwach' })
      var titel = function (b) { return berichtZitat(b.punkt.titel, 50) }
      if (starke.length) {
        var starkBeleg = starke.find(function (b) { return b.notiz })
        argument('Die Stärken des Programms lagen bei ' + berichtAufzaehlung(starke.slice(0, 4).map(titel)) + (starke.length > 4 ? ' und ' + (starke.length - 4) + ' weiteren Punkten' : ''),
          (starke.length === 1 ? 'Dieser Programmpunkt wurde' : 'Diese Programmpunkte wurden') + ' mit «gut» bewertet',
          starkBeleg ? 'Zu ' + titel(starkBeleg) + ' heisst es: ' + berichtZitat(starkBeleg.notiz) : '',
          starkBeleg ? punktQuelle(starkBeleg) : null, starkBeleg ? null : punktQuelle(starke[0]))
      }
      if (schwache.length) {
        var schwachPBeleg = schwache.find(function (b) { return b.notiz })
        argument('Überarbeitungsbedarf besteht bei ' + berichtAufzaehlung(schwache.slice(0, 4).map(titel)),
          (schwache.length === 1 ? 'Dieser Programmpunkt erhielt' : 'Diese Programmpunkte erhielten') + ' die Bewertung «schwach»',
          schwachPBeleg ? 'Zu ' + titel(schwachPBeleg) + ' notiert das Team: ' + berichtZitat(schwachPBeleg.notiz) : '',
          schwachPBeleg ? punktQuelle(schwachPBeleg) : null, schwachPBeleg ? null : punktQuelle(schwache[0]))
      }
      var mittlere = bewertetePunkte.filter(function (b) { return b.bewertung === 'mittel' })
      if (mittlere.length) absatz([{ t: 'Als «mittel» beurteilt ' + (mittlere.length === 1 ? 'wurde ' : 'wurden ') + berichtAufzaehlung(mittlere.map(titel)) + '.' }])
    }
  }

  /* 5 Wirkungen */
  if (modell.eintraege.length) {
    h1('Wirkungen')
    absatz([
      { t: 'Die Wirkungen sind nach dem Wirkungsmodell des Quali-Tools beschrieben.', q: literatur('quali') },
      { t: 'Es unterscheidet, was ein Angebot leistet (Outputs), was sich dadurch bei der Zielgruppe verändert (Outcomes) und wozu es im weiteren Umfeld beiträgt (Impacts).', q: literatur('phineo') },
      modell.verantwortung ? { t: 'Verantwortlich für das Modell ist ' + modell.verantwortung + '.' } : null,
    ])
    var grundlagen = spalte('grundlagen').concat(spalte('umsetzung'))
    if (grundlagen.length) {
      h2('Grundlagen und Umsetzung')
      absatz([{ t: 'Das Modell beschreibt, worauf ' + (event.typ === 'camp' ? 'das Camp' : 'das Event') + ' aufbaut und wer es wie getragen hat:' }])
      bloecke.push({ art: 'liste', eintraege: grundlagen.map(function (e) {
        return [{ t: e.titel + (e.status ? ' (' + BERICHT_STAND[e.status] + ')' : '') + (e.text ? ': ' + berichtSatz(e.text) : '.'), q: wmQuelle(e) }]
      }) })
    }
    var leistungen = spalte('leistungen')
    if (leistungen.length) {
      h2('Leistungen')
      absatz([{ t: wen + ' erbrachte ' + (leistungen.length === 1 ? 'eine Leistung' : berichtZahl(leistungen.length) + ' Leistungen') + ', die die Teilnehmenden unmittelbar erlebten:' }])
      bloecke.push({ art: 'liste', eintraege: leistungen.map(function (e) {
        return [{ t: e.nummer + ' ' + e.titel + (e.text ? ': ' + berichtSatz(e.text) : '.'), q: wmQuelle(e) }]
      }) })
    }
    var wirkungDarstellen = function (e, art) {
      var grad = BERICHT_GRAD[e.status || 'offen']
      var davor = vorgaenger(e)
      var these = (art === 'outcome' ? 'Die Wirkung ' : 'Der Beitrag ') + wmTitel(e) + ' ' + (e.status && e.status !== 'offen' ? grad.these : 'ist noch nicht beurteilt')
      var begruendung = davor.length
        ? (art === 'outcome' ? 'Sie beruht auf ' + (davor.length === 1 ? 'der Leistung ' : 'den Leistungen ') : 'Er stützt sich auf ' + (davor.length === 1 ? 'die Wirkung ' : 'die Wirkungen ')) + berichtAufzaehlung(davor.map(wmTitel))
        : (art === 'outcome' ? 'Ihr ist im Modell noch keine Leistung zugeordnet' : 'Ihm ist im Modell noch keine Wirkung bei der Zielgruppe zugeordnet')
      var beleg = e.indikator ? 'Als Indikator dient ' + berichtZitat(e.indikator) + (e.text ? '; dazu hält das Modell fest: ' + berichtZitat(e.text) : '') : e.text ? 'Das Modell beschreibt dazu: ' + berichtZitat(e.text) : ''
      argument(these, begruendung, beleg, wmQuelle(e))
    }
    if (outcomes.length) {
      h2('Wirkungen bei der Zielgruppe')
      outcomes.forEach(function (e) { wirkungDarstellen(e, 'outcome') })
    }
    if (impacts.length) {
      h2('Wirkungen im weiteren Umfeld')
      absatz([{ t: 'Impacts lassen sich nicht allein durch ein Event bewirken; sie zeigen, wozu es beiträgt.' }])
      impacts.forEach(function (e) { wirkungDarstellen(e, 'impact') })
    }
  }

  /* 6 Rückmeldungen */
  if (feedbacks.length || konzept.teamkultur) {
    h1('Rückmeldungen aus dem Team')
    if (feedbacks.length) {
      absatz([{ t: 'Die Rückmeldungen folgen der Fünf-Finger-Methode: Daumen für Gelungenes, Zeigefinger für das, was man sich merkt, Mittelfinger für das, was man ändern würde, Ringfinger für das, was nahe ging, und kleiner Finger für das, was zu kurz kam.' },
        { t: 'Ausgewertet sind ' + (feedbacks.length === 1 ? 'eine Rückmeldung' : berichtZahl(feedbacks.length) + ' Rückmeldungen') + ' an das ganze Team. Sie erscheinen anonymisiert; persönliche Rückmeldungen an einzelne Personen sind nicht Teil dieses Berichts.' }])
      var FINGER_THESE = {
        daumen: ['Gelungenes wird häufig genannt', 'Gelungenes wird vereinzelt genannt'],
        zeigefinger: ['Das Team nimmt konkrete Erkenntnisse mit', 'Einzelne nehmen konkrete Erkenntnisse mit'],
        mittelfinger: ['Mehrere Rückmeldungen regen Änderungen an', 'Vereinzelt werden Änderungen angeregt'],
        ringfinger: [wen + ' hat die Beteiligten persönlich berührt', 'Einzelne Beteiligte schildern, was sie berührt hat'],
        kleinerfinger: ['Mehreren kam etwas zu kurz', 'Einzelnen kam etwas zu kurz'],
      }
      FEEDBACK_FINGER.forEach(function (finger) {
        var liste = antworten(finger.id)
        if (!liste.length) return
        h2(finger.name + ': ' + finger.frage.replace(/\?$/, ''))
        var stichworte = berichtStichworte(liste.map(function (f) { return f.finger[finger.id] }))
        var anteil = liste.length >= 2 && liste.length * 2 >= feedbacks.length
        var anteilText = berichtGross(berichtAnteil(liste.length, feedbacks.length, 'Rückmeldung', 'Rückmeldungen'))
        argument(FINGER_THESE[finger.id][anteil ? 0 : 1],
          anteilText + (liste.length === 1 || feedbacks.length === 1 ? ' äussert' : ' äussern') + ' sich dazu' + (stichworte.length ? '; mehrfach genannt ' + (stichworte.length === 1 ? 'wird ' : 'werden ') + berichtAufzaehlung(stichworte) : ''),
          'So schreibt eine Person: ' + berichtZitat(liste[0].finger[finger.id], 200),
          fingerQuelle(liste[0], finger.id))
        liste.slice(1, 3).forEach(function (f) { zitat(f.finger[finger.id], fingerQuelle(f, finger.id)) })
      })
    }
    if (konzept.teamkultur) {
      h2('Teamkultur')
      absatz([{ t: 'Zur Zusammenarbeit im Leitungsteam hält die Reflexion fest: ' + berichtZitat(konzept.teamkultur, 600), q: datenquelle('teamkultur', 'Reflexion der Teamkultur', 'Nachbereitung › Reflexion') }])
    }
  } else if (!darfFeedback) {
    h1('Rückmeldungen aus dem Team')
    absatz([{ t: 'Die Rückmeldungen nach der Fünf-Finger-Methode sind vertraulich. Sie fliessen nur in den Bericht von Personen ein, die das Feedback lesen dürfen, etwa der Event-Leitung.' }])
  }

  /* 7 Folgerungen */
  h1('Folgerungen und Empfehlungen')
  var empfehlungen = []
  ziele.filter(function (z) { return z.pruefung.grad === 'nicht' || z.pruefung.grad === 'teilweise' }).forEach(function (z) {
    empfehlungen.push([{ t: 'Das Ziel ' + berichtZitat(z.formulierung, 80) + ' sollte für ein nächstes Event überprüft und angepasst werden, denn es ' + BERICHT_GRAD[z.pruefung.grad].these + '.', rolle: 'these' },
      z.pruefung.ergebnis ? { t: 'Die Überprüfung ergab: ' + berichtSatz(z.pruefung.ergebnis), rolle: 'beleg', q: zielQuelle(z) } : null].filter(Boolean))
  })
  bewertetePunkte.filter(function (b) { return b.bewertung === 'schwach' }).forEach(function (b) {
    empfehlungen.push([{ t: 'Der Programmpunkt ' + berichtZitat(b.punkt.titel, 60) + ' sollte überarbeitet oder ersetzt werden, weil er als schwach beurteilt wurde.', rolle: 'these' },
      b.notiz ? { t: 'Notiz des Teams: ' + berichtZitat(b.notiz), rolle: 'beleg', q: punktQuelle(b) } : null].filter(Boolean))
  })
  var aendern = antworten('mittelfinger')
  if (aendern.length) {
    var worte = berichtStichworte(aendern.map(function (f) { return f.finger.mittelfinger }))
    empfehlungen.push([{ t: 'Die Anregungen aus dem Team sollten in die nächste Planung einfliessen' + (worte.length ? ', besonders zu ' + berichtAufzaehlung(worte) : '') + '.', rolle: 'these' },
      { t: 'Eine Person schlägt vor: ' + berichtZitat(aendern[0].finger.mittelfinger, 160), rolle: 'beleg', q: fingerQuelle(aendern[0], 'mittelfinger') }])
  }
  var kurz = antworten('kleinerfinger')
  if (kurz.length) {
    empfehlungen.push([{ t: 'Für das, was zu kurz kam, sollte mehr Raum eingeplant werden.', rolle: 'these' },
      { t: 'Genannt wird etwa: ' + berichtZitat(kurz[0].finger.kleinerfinger, 160), rolle: 'beleg', q: fingerQuelle(kurz[0], 'kleinerfinger') }])
  }
  outcomes.filter(function (e) { return e.status === 'nicht' || e.status === 'teilweise' }).forEach(function (e) {
    empfehlungen.push([{ t: 'Um die Wirkung ' + wmTitel(e) + ' besser zu erreichen, sollten die zugehörigen Leistungen geschärft werden.', rolle: 'these' },
      { t: 'Die Wirkung gilt derzeit als ' + BERICHT_GRAD[e.status].label + '.', rolle: 'beleg', q: wmQuelle(e) }])
  })
  var bewaehrt = bewertetePunkte.filter(function (b) { return b.bewertung === 'gut' })
  if (bewaehrt.length) {
    empfehlungen.push([{ t: 'Bewährtes sollte beibehalten werden, namentlich ' + berichtAufzaehlung(bewaehrt.slice(0, 3).map(function (b) { return berichtZitat(b.punkt.titel, 50) })) + '.', rolle: 'these' },
      { t: 'Diese Punkte wurden mit «gut» bewertet.', rolle: 'beleg', q: punktQuelle(bewaehrt[0]) }])
  }
  if (empfehlungen.length) {
    absatz([{ t: 'Aus der Auswertung ergeben sich die folgenden Empfehlungen. Jede ist mit dem Befund belegt, auf dem sie beruht.' }])
    bloecke.push({ art: 'liste', nummeriert: true, eintraege: empfehlungen })
  } else {
    absatz([{ t: 'Aus den erfassten Angaben ergeben sich keine dringenden Änderungen. Ergänzen Sie Zielüberprüfung, Bewertungen und Rückmeldungen, damit hier konkrete Empfehlungen entstehen.' }])
  }

  /* Quellenverzeichnis */
  kapitel++
  bloecke.push({ art: 'h1', text: 'Quellenverzeichnis', nummer: '', id: 'quellen' })
  if (quellen.length) {
    bloecke.push({ art: 'quellen', eintraege: quellen })
  } else {
    absatz([{ t: 'Keine Quellen.' }])
  }

  var vollstaendig = { ziele: geprueft.length > 0, bewertungen: alleBewertungen.length > 0, wirkungsmodell: outcomesBewertet.length > 0, feedback: !darfFeedback || feedbacks.length > 0 }
  return { titel: event.titel, stand: stand, bloecke: bloecke, quellen: quellen, vollstaendig: vollstaendig, verantwortung: modell.verantwortung || '' }
}

/* Ein Block als DOM-Element (ohne innerHTML, alle Texte als Textknoten). Dient der Seitenansicht, der Leseansicht und
   dem Vermessen beim Umbruch, damit alle drei gleich aussehen. */
function berichtSaetzeAnhaengen(ziel, saetze) {
  saetze.forEach(function (s, i) {
    if (i > 0) ziel.appendChild(document.createTextNode(' '))
    var span = document.createElement('span')
    span.className = 'b-satz' + (s.rolle ? ' b-satz--' + s.rolle : '')
    span.textContent = s.t
    ziel.appendChild(span)
    if (s.q) {
      var sup = document.createElement('sup')
      sup.className = 'b-fn'
      sup.textContent = s.q
      ziel.appendChild(sup)
    }
  })
}

function berichtBlockElement(block) {
  var el
  if (block.art === 'h1' || block.art === 'h2') {
    el = document.createElement(block.art === 'h1' ? 'h2' : 'h3')
    el.className = 'b-' + block.art
    el.id = 'bericht-' + block.id
    if (block.nummer) {
      var nr = document.createElement('span')
      nr.className = 'b-nr'
      nr.textContent = block.nummer
      el.appendChild(nr)
    }
    el.appendChild(document.createTextNode(block.text))
  } else if (block.art === 'p') {
    el = document.createElement('p')
    el.className = 'b-p' + (block.argument ? ' b-argument' : '')
    berichtSaetzeAnhaengen(el, block.saetze)
  } else if (block.art === 'zitat') {
    el = document.createElement('blockquote')
    el.className = 'b-zitat'
    berichtSaetzeAnhaengen(el, [{ t: block.t, q: block.q }])
  } else if (block.art === 'liste') {
    el = document.createElement(block.nummeriert ? 'ol' : 'ul')
    el.className = 'b-liste'
    if (block.start) el.start = block.start
    block.eintraege.forEach(function (saetze) {
      var li = document.createElement('li')
      berichtSaetzeAnhaengen(li, saetze)
      el.appendChild(li)
    })
  } else if (block.art === 'quellen') {
    el = document.createElement('ol')
    el.className = 'b-quellen'
    if (block.eintraege.length) el.start = block.eintraege[0].nummer
    block.eintraege.forEach(function (q) {
      var li = document.createElement('li')
      li.id = 'bericht-quelle-' + q.nummer
      li.textContent = q.text
      el.appendChild(li)
    })
  } else if (block.art === 'tabelle') {
    el = document.createElement('table')
    el.className = 'b-tabelle'
    var kopf = document.createElement('tr')
    block.kopf.forEach(function (k) {
      var th = document.createElement('th')
      th.textContent = k
      kopf.appendChild(th)
    })
    el.appendChild(kopf)
    block.zeilen.forEach(function (zeile) {
      var tr = document.createElement('tr')
      zeile.forEach(function (z) {
        var td = document.createElement('td')
        td.textContent = z
        tr.appendChild(td)
      })
      el.appendChild(tr)
    })
  }
  var huelle = document.createElement('div')
  huelle.className = 'b-block b-block--' + block.art
  huelle.appendChild(el)
  return huelle
}

/* Teilbare Blöcke in zwei Teile zerlegen: Absätze nach Sätzen, Listen nach Einträgen, Tabellen nach Zeilen */
function berichtTeilen(block, anzahl) {
  if (block.art === 'p') return [Object.assign({}, block, { saetze: block.saetze.slice(0, anzahl) }), Object.assign({}, block, { saetze: block.saetze.slice(anzahl), fortsetzung: true })]
  if (block.art === 'liste') {
    var start = block.start || 1
    return [Object.assign({}, block, { eintraege: block.eintraege.slice(0, anzahl) }), Object.assign({}, block, { eintraege: block.eintraege.slice(anzahl), start: start + anzahl })]
  }
  if (block.art === 'quellen') return [Object.assign({}, block, { eintraege: block.eintraege.slice(0, anzahl) }), Object.assign({}, block, { eintraege: block.eintraege.slice(anzahl) })]
  if (block.art === 'tabelle') return [Object.assign({}, block, { zeilen: block.zeilen.slice(0, anzahl) }), Object.assign({}, block, { zeilen: block.zeilen.slice(anzahl) })]
  return null
}

function berichtTeilAnzahl(block) {
  if (block.art === 'p') return block.saetze.length
  if (block.art === 'liste' || block.art === 'quellen') return block.eintraege.length
  if (block.art === 'tabelle') return block.zeilen.length
  return 0
}

/* Seitenumbruch: misst jeden Block im Messbehälter (gleiche Breite wie der Seiteninhalt) und verteilt die Blöcke auf
   Seiten der Höhe hoehe. Kapitel beginnen auf einer neuen Seite, Überschriften bleiben bei ihrem ersten Block, zu lange
   Blöcke werden geteilt. Liefert Seiten mit ihren Blöcken. */
function berichtUmbrechen(bloecke, messen, hoehe) {
  var seiten = [[]]
  var rest = hoehe
  var hoeheVon = function (block) {
    messen.textContent = ''
    messen.appendChild(berichtBlockElement(block))
    return messen.firstChild.getBoundingClientRect().height
  }
  var neueSeite = function () {
    if (seiten[seiten.length - 1].length) seiten.push([])
    rest = hoehe
  }
  var warteschlange = bloecke.slice()
  while (warteschlange.length) {
    var block = warteschlange.shift()
    if (block.art === 'h1') neueSeite()
    var h = hoeheVon(block)
    if (block.art === 'h1' || block.art === 'h2') {
      var naechster = warteschlange[0]
      var mitNaechstem = naechster ? h + Math.min(hoeheVon(naechster), 90) : h
      if (mitNaechstem > rest && seiten[seiten.length - 1].length) neueSeite()
      seiten[seiten.length - 1].push(block)
      rest -= h
      continue
    }
    if (h <= rest) {
      seiten[seiten.length - 1].push(block)
      rest -= h
      continue
    }
    var teile = berichtTeilAnzahl(block)
    var passend = 0
    if (teile > 1 && rest > 60) {
      for (var k = teile - 1; k >= 1; k--) {
        if (hoeheVon(berichtTeilen(block, k)[0]) <= rest) {
          passend = k
          break
        }
      }
    }
    if (passend) {
      var geteilt = berichtTeilen(block, passend)
      seiten[seiten.length - 1].push(geteilt[0])
      warteschlange.unshift(geteilt[1])
      neueSeite()
      continue
    }
    if (seiten[seiten.length - 1].length) {
      neueSeite()
      warteschlange.unshift(block)
      continue
    }
    /* Auch auf einer leeren Seite zu hoch und nicht teilbar: trotzdem setzen */
    seiten[seiten.length - 1].push(block)
    rest -= h
  }
  messen.textContent = ''
  return seiten
}
