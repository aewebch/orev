/* Einführung: eine Tour mit Spotlight über die wichtigsten Stellen. Die Schritte richten sich nach den Rechten der
   Person: Event-Bereiche erscheinen nur, wenn sie sie sehen darf (sichtbarePhasen() in js/seiten/event.js), Bearbeitungs-
   hinweise nur mit Bearbeitungsrecht. Sie startet bei der ersten Anmeldung von selbst, lässt sich überspringen und im
   Konto-Menü sowie auf der Hilfe-Seite erneut aufrufen. Gesehen wird am Konto vermerkt (einfuehrung_speichern). */
var einfuehrung = Vue.reactive({ aktiv: false, laedt: false, gestartet: false, index: 0, schritte: [] })

async function einfuehrungStarten() {
  if (einfuehrung.aktiv || einfuehrung.laedt || !zustand.ich) return
  einfuehrung.laedt = true
  einfuehrung.gestartet = true
  var event = null
  try {
    /* Bevorzugt das gerade offene Event, sonst das nächste kommende */
    var offen = router.currentRoute.value.path.indexOf('/event/') === 0 ? router.currentRoute.value.params.id : ''
    var eventId = offen
    if (!eventId) {
      var heute = new Date().toISOString().slice(0, 10)
      var liste = (await api.anfrage('events_liste', {})).events.slice().sort(function (a, b) { return a.startDatum.localeCompare(b.startDatum) })
      var wahl = liste.find(function (e) { return e.endDatum >= heute }) || liste[liste.length - 1]
      if (wahl) eventId = wahl.id
    }
    if (eventId) event = (await api.anfrage('event_laden', { eventId: eventId })).event
  } catch (fehler) {
    /* Ohne Event zeigt die Tour nur die allgemeinen Stellen */
  }
  einfuehrung.schritte = einfuehrungSchritte({ ich: zustand.ich, darfEventsAnlegen: zustand.darfEventsAnlegen, event: event })
  einfuehrung.index = 0
  einfuehrung.aktiv = true
  einfuehrung.laedt = false
}

function einfuehrungBeenden() {
  einfuehrung.aktiv = false
  if (!zustand.ich) return
  zustand.ich.einfuehrungGesehen = true
  api.anfrage('einfuehrung_speichern', { gesehen: true }).catch(function () {})
}

/* Schritt: titel, text, optional route (wird geöffnet) und ziel (CSS-Selektor oder Liste in Vorrangreihenfolge;
   ohne sichtbares Ziel erscheint die Karte in der Mitte) */
function einfuehrungSchritte(k) {
  var s = []
  s.push({ titel: 'Willkommen, ' + k.ich.vorname, text: 'Diese kurze Einführung zeigt Ihnen die wichtigsten Stellen, passend zu Ihren Rechten. Sie können sie jederzeit überspringen und später im Konto-Menü unter «Einführung» wieder starten.' })
  s.push({ route: '/', ziel: '[data-tour="events"]', titel: 'Ihre Events', text: 'Hier stehen alle Events und Camps, zu denen Sie gehören. Vergangene finden Sie im Register daneben.' })
  if (k.darfEventsAnlegen) s.push({ route: '/', ziel: '[data-tour="neu"]', titel: 'Neues Event', text: 'Mit dem Plus legen Sie ein Event oder Camp an. Ein geführtes Setup begleitet Sie danach Schritt für Schritt.' })
  s.push({ ziel: '[data-tour="aufgaben"]', titel: 'Meine Aufgaben', text: 'Alle Aufgaben, für die Sie zuständig sind, aus allen Events an einem Ort. Erledigtes haken Sie direkt ab.' })
  s.push({ ziel: '[data-tour="suche"]', titel: 'Suchen', text: 'Die Suche findet Programmpunkte, Aufgaben, Material und Personen in allen Ihren Events, aber nur, was Sie sehen dürfen.' })
  s.push({ ziel: '[data-tour="konto"]', titel: 'Mitteilungen und Konto', text: 'Hier erfahren Sie, was sich geändert hat und Sie betrifft. Im selben Menü liegen Ihr Konto, die Hilfe und diese Einführung.' })

  var e = k.event
  if (e) {
    var recht = e.ich.recht
    var basis = '/event/' + e.id
    var phasen = sichtbarePhasen(e)
    var phase = function (id) { return phasen.find(function (p) { return p.id === id }) }
    var hat = function (bereich) { return phasen.some(function (p) { return p.bereiche.some(function (b) { return b.id === bereich }) }) }
    var setup = phase('setup')
    var setupBearbeiten = setup && setup.bereiche.some(function (b) { return recht[b.recht] >= 2 })

    s.push({ route: basis, ziel: '[data-tour="phasen"]', titel: 'Ein Event in Phasen', text: '«' + e.titel + '» gliedert sich in ' + phasen.map(function (p) { return p.label }).join(', ').replace(/, ([^,]*)$/, ' und $1') + '. Sie sehen nur die Bereiche, für die Sie Rechte haben.' })
    if (setupBearbeiten) {
      s.push({ route: basis + '/' + setup.bereiche[0].id, ziel: '[data-tour="setup"]', titel: 'Geführtes Setup', text: 'Das Setup führt durch alles, was vor dem Programm nötig ist. Haken zeigen, was erledigt ist; mit «Weiter» gelangen Sie zum nächsten Schritt. Alles wird sofort gespeichert.' })
    }
    if (e.ich.hatLeitungsrechte) {
      s.push({ route: basis + '/personen', ziel: ['#freigaben', '[data-tour="schritt-personen"]'], titel: 'Personen per Link einladen', text: 'Mit einem Freigabe-Link laden Sie viele Personen auf einmal ein. Wer ihn öffnet, erhält die Rollen und Teams, die Sie festlegen, und kann bei Bedarf gleich ein Konto eröffnen.' })
    }
    if (hat('programm')) {
      s.push({ route: basis + '/programm', ziel: ['[data-tour="programm"]', '[data-tour="phase-durchfuehrung"]'], titel: 'Programm',
        text: e.ich.darfProgrammAnlegen
          ? 'Die Agenda zeigt alle Programmpunkte. Ziehen Sie über eine freie Zeit, um einen Punkt anzulegen, und verschieben Sie Punkte mit Maus oder Finger.'
          : 'Die Agenda zeigt das Programm. Tippen Sie auf einen Punkt, um Details und den Ablaufplan zu sehen.' })
      s.push({ route: basis + '/programm', ziel: '[data-tour="programm-filter"]', titel: 'Nur, was Sie betrifft', text: 'Mit dem Filter sehen Sie nur Ihr Programm, ein Team oder einzelne Personen. Im Menü «⋮» abonnieren Sie das Programm in Ihrem Kalender.' })
    }
    if (hat('ablauf')) {
      s.push({ route: basis + '/ablauf', ziel: ['[data-tour="bereich-ablauf"]', '[data-tour="phase-durchfuehrung"]'], titel: 'Ablaufpläne',
        text: 'Zu jedem Programmpunkt gibt es einen Ablaufplan: Schritt für Schritt, mit Zeit, Zuständigen und Material.' + (recht.ablauf >= 2 ? ' Sie können ihn direkt in der Tabelle bearbeiten.' : '') })
    }
    if (hat('aufgaben')) {
      s.push({ route: basis + '/aufgaben', ziel: ['[data-tour="schritt-aufgaben"]', '[data-tour="phase-setup"]'], titel: 'Aufgaben',
        text: recht.aufgaben >= 2
          ? 'Erfassen Sie, was vorbereitet werden muss, und weisen Sie es Personen oder Teams zu. Vorbereitungstermine erscheinen im Kalender der Zuständigen.'
          : 'Hier stehen die Aufgaben, die Sie sehen dürfen. Ihre eigenen haken Sie ab, sobald sie erledigt sind.' })
    }
    var nach = phase('nachbereitung')
    if (nach) {
      var teile = []
      if (hat('reflexion')) teile.push('Nach dem Event überprüfen Sie die Ziele, bewerten Ort, Tage und Programm und erhalten daraus einen Bericht.')
      if (hat('feedback')) teile.push('Im Feedback halten Sie nach der Fünf-Finger-Methode fest, was gut war und was Sie ändern würden.')
      s.push({ route: basis + '/' + nach.bereiche[0].id, ziel: '[data-tour="phase-nachbereitung"]', titel: 'Nachbereitung', text: teile.join(' ') })
    }
  } else if (!k.darfEventsAnlegen) {
    s.push({ route: '/', titel: 'Noch kein Event', text: 'Sobald Sie jemand zu einem Event hinzufügt oder Sie einen Freigabe-Link öffnen, erscheint es in der Übersicht.' })
  }

  s.push({ ziel: '.seite .hilfe-punkt', titel: 'Hilfe an Ort und Stelle', text: 'Kleine Kreise mit Fragezeichen erklären, was an dieser Stelle zu tun ist. Die ganze Dokumentation finden Sie unter «Hilfe».' })
  s.push({ titel: 'Bereit', text: 'Das war die Einführung. Sie finden sie jederzeit wieder im Konto-Menü unter «Einführung».' })
  return s
}

/* Erstes sichtbares Element zu einem Selektor oder einer Liste von Selektoren */
function einfuehrungZiel(ziel) {
  var liste = Array.isArray(ziel) ? ziel : [ziel]
  for (var i = 0; i < liste.length; i++) {
    var treffer = document.querySelectorAll(liste[i])
    for (var j = 0; j < treffer.length; j++) {
      var r = treffer[j].getBoundingClientRect()
      if (r.width > 0 && r.height > 0 && getComputedStyle(treffer[j]).visibility !== 'hidden') return treffer[j]
    }
  }
  return null
}

app.component('einfuehrung-tour', {
  template: `
    <div v-if="t.aktiv" class="tour" role="dialog" aria-modal="true" :aria-label="'Einführung: ' + schritt.titel">
      <div :class="['tour__schleier', rahmen ? 'tour__schleier--klar' : '']"></div>
      <div v-if="rahmen" class="tour__spot" :style="{ top: rahmen.top + 'px', left: rahmen.left + 'px', width: rahmen.width + 'px', height: rahmen.height + 'px' }"></div>
      <div ref="karte" :class="['tour__karte', 'tour__karte--' + lage]" :style="kartenStil">
        <p class="tour__zaehler">{{ t.index + 1 }} von {{ t.schritte.length }}</p>
        <h2 class="tour__titel">{{ schritt.titel }}</h2>
        <p class="tour__text">{{ schritt.text }}</p>
        <div class="tour__punkte" aria-hidden="true"><span v-for="(x, i) in t.schritte" :key="i" :class="['tour__punkt', i === t.index ? 'tour__punkt--aktiv' : '', i < t.index ? 'tour__punkt--fertig' : '']"></span></div>
        <div class="tour__knoepfe">
          <button v-if="!letzter" type="button" class="text-link" @click="beenden">Überspringen</button>
          <span class="dehnen"></span>
          <ae-icon-button v-if="t.index > 0" label="Zurück" variant="flat" @click="gehe(-1)"><ae-icon name="arrow-left" :size="18"></ae-icon></ae-icon-button>
          <ae-button ref="weiter" size="md" @click="letzter ? beenden() : gehe(1)">{{ letzter ? 'Fertig' : 'Weiter' }}</ae-button>
        </div>
      </div>
    </div>
  `,
  data() {
    return { t: einfuehrung, rahmen: null, lage: 'mitte', kartenStil: {}, element: null, lauf: 0 }
  },
  computed: {
    schritt() {
      return this.t.schritte[this.t.index] || { titel: '', text: '' }
    },
    letzter() {
      return this.t.index === this.t.schritte.length - 1
    },
  },
  watch: {
    't.aktiv': function (aktiv) {
      if (aktiv) this.zeigen()
    },
    't.index': function () {
      this.zeigen()
    },
  },
  mounted() {
    this.anpassen = this.positionieren.bind(this)
    window.addEventListener('resize', this.anpassen)
    window.addEventListener('scroll', this.anpassen, true)
    document.addEventListener('keydown', this.taste)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.anpassen)
    window.removeEventListener('scroll', this.anpassen, true)
    document.removeEventListener('keydown', this.taste)
  },
  methods: {
    gehe(richtung) {
      var i = this.t.index + richtung
      if (i >= 0 && i < this.t.schritte.length) this.t.index = i
    },
    beenden() {
      this.rahmen = null
      einfuehrungBeenden()
    },
    taste(ereignis) {
      if (!this.t.aktiv) return
      if (ereignis.key === 'Escape') this.beenden()
      else if (ereignis.key === 'ArrowRight' && !this.letzter) this.gehe(1)
      else if (ereignis.key === 'ArrowLeft') this.gehe(-1)
    },
    /* Route öffnen, auf das Ziel warten (Seiten laden ihre Daten nachträglich), hinscrollen, Spotlight setzen */
    async zeigen() {
      var lauf = ++this.lauf
      var schritt = this.schritt
      this.element = null
      this.rahmen = null
      if (schritt.route && this.$router.currentRoute.value.path !== schritt.route) {
        await this.$router.push(schritt.route).catch(function () {})
      }
      if (schritt.ziel) {
        for (var versuch = 0; versuch < 30 && lauf === this.lauf; versuch++) {
          this.element = einfuehrungZiel(schritt.ziel)
          if (this.element) break
          await new Promise(function (fertig) { setTimeout(fertig, 100) })
        }
      }
      if (lauf !== this.lauf) return
      if (this.element) this.element.scrollIntoView({ block: 'center', inline: 'nearest' })
      await this.$nextTick()
      this.positionieren()
      var knopf = this.$refs.weiter && this.$refs.weiter.$el
      if (knopf && knopf.focus) knopf.focus({ preventScroll: true })
    },
    positionieren() {
      if (!this.t.aktiv) return
      var breite = window.innerWidth
      var hoehe = window.innerHeight
      var schmal = breite < 700
      var karte = this.$refs.karte
      var kartenHoehe = karte ? karte.offsetHeight : 220
      if (!this.element || !this.element.isConnected) {
        this.rahmen = null
        this.lage = schmal ? 'unten' : 'mitte'
        this.kartenStil = {}
        return
      }
      var r = this.element.getBoundingClientRect()
      var abstand = 6
      var top = Math.max(4, r.top - abstand)
      var left = Math.max(4, r.left - abstand)
      this.rahmen = { top: top, left: left, width: Math.min(breite - 4, r.right + abstand) - left, height: Math.min(hoehe - 4, r.bottom + abstand) - top }

      if (schmal) {
        /* Handy: Karte als Blatt oben oder unten, je nachdem wo das Ziel liegt */
        this.lage = r.top + r.height / 2 > hoehe / 2 ? 'oben' : 'unten'
        this.kartenStil = {}
        return
      }
      var kartenBreite = 360
      var stil = {}
      if (r.width < 120 && r.right + 16 + kartenBreite < breite) {
        this.lage = 'rechts'
        stil.left = (r.right + 16) + 'px'
        stil.top = Math.min(Math.max(16, r.top + r.height / 2 - kartenHoehe / 2), hoehe - kartenHoehe - 16) + 'px'
      } else {
        this.lage = 'frei'
        stil.left = Math.min(Math.max(16, r.left), breite - kartenBreite - 16) + 'px'
        var unten = r.bottom + 16
        var oben = r.top - 16 - kartenHoehe
        if (unten + kartenHoehe < hoehe - 16) {
          stil.top = unten + 'px'
        } else if (oben >= 16) {
          stil.top = oben + 'px'
        } else {
          /* Grosses Ziel: Karte unten rechts über dem Ziel */
          stil.top = (hoehe - kartenHoehe - 24) + 'px'
          stil.left = (breite - kartenBreite - 24) + 'px'
        }
      }
      this.kartenStil = stil
    },
  },
})
