/* Programm eines Events in drei Ansichten desselben Datenbestands: Woche (Tage als Spalten), Tag und Liste.
   Überschneidende Punkte stehen im Raster nebeneinander (Spuren). In der Agenda lassen sich Punkte verschieben
   (Ziehen), in der Länge ändern (Griff unten), Bausteine aus Vorlagen oder dem Event hineinziehen und freie Zeiten
   aufziehen. Auf Touch-Geräten öffnet ein Tippen auf eine freie Zeit denselben Dialog. */
var RASTER_STUNDE = 80
var RASTER_RASTER = 15

/* Was gerade gezogen wird (HTML-Drag-and-Drop gibt die Daten erst beim Ablegen heraus) */
var rasterZiehen = null

function minutenAmTag(zeitpunkt, datum) {
  if (zeitpunkt.slice(0, 10) > datum) return 24 * 60
  return parseInt(zeitpunkt.slice(11, 13), 10) * 60 + parseInt(zeitpunkt.slice(14, 16), 10)
}

function dauerMinuten(start, ende) {
  if (!ende) return 0
  return Math.round((new Date(ende + ':00') - new Date(start + ':00')) / 60000)
}

/* Ordnet Punkten eines Tages Spuren zu: Überlappende Punkte bilden eine Gruppe und teilen sich die Breite */
function spurenBerechnen(punkte, datum) {
  var eintraege = punkte.map(function (p) {
    var von = minutenAmTag(p.start, datum)
    var bis = p.ende ? minutenAmTag(p.ende, datum) : von + 30
    return { punkt: p, von: von, bis: Math.max(bis, von + 15), spur: 0, spuren: 1 }
  }).sort(function (a, b) { return a.von - b.von || b.bis - a.bis })
  var gruppe = []
  var spurEnden = []
  var gruppenEnde = -1
  function abschliessen() {
    gruppe.forEach(function (e) { e.spuren = spurEnden.length })
    gruppe = []
    spurEnden = []
  }
  eintraege.forEach(function (e) {
    if (e.von >= gruppenEnde) abschliessen()
    var spur = spurEnden.findIndex(function (ende) { return ende <= e.von })
    if (spur < 0) spur = spurEnden.length
    spurEnden[spur] = e.bis
    e.spur = spur
    gruppe.push(e)
    gruppenEnde = Math.max(gruppenEnde, e.bis)
  })
  abschliessen()
  return eintraege
}

app.component('programm-raster', {
  props: {
    event: { type: Object, required: true },
    tage: { type: Array, required: true },
    punkte: { type: Array, required: true },
    meine: { type: Array, default: function () { return [] } },
    /* Darf neue Punkte anlegen (Aufziehen, Bausteine ablegen) */
    anlegen: { type: Boolean, default: false },
  },
  emits: ['oeffnen', 'aufziehen', 'verschieben', 'ablegen'],
  template: `
    <div class="raster">
      <div class="raster__gitter" :style="{ gridTemplateColumns: '48px repeat(' + tage.length + ', minmax(' + (tage.length > 1 ? 132 : 240) + 'px, 1fr))' }">
        <div class="raster__kopf"></div>
        <div v-for="tag in tage" :key="'k' + tag.datum" class="raster__kopf">
          <div class="raster__tag">{{ wochentagText(tag.datum) }} {{ datumKurz(tag.datum) }}</div>
          <div class="raster__thema" :title="tag.thema">{{ tag.thema || ' ' }}</div>
          <div class="raster__thema">TV: {{ tvText(tag) }}</div>
        </div>
        <div class="raster__zeiten" :style="{ height: hoehe + 'px' }">
          <span v-for="h in stunden" :key="h" class="raster__zeit" :style="{ top: (h - vonStunde) * stunde + 'px' }">{{ String(h).padStart(2, '0') }}:00</span>
        </div>
        <div v-for="tag in tage" :key="'s' + tag.datum" :class="['raster__spalte', anlegen ? 'raster__spalte--frei' : '']" :style="{ height: hoehe + 'px', '--stunde': stunde + 'px' }"
          @pointerdown="auswahlStart($event, tag.datum)" @pointermove="auswahlZiehen($event)" @pointerup="auswahlEnde($event)" @click="tippen($event, tag.datum)"
          @dragover="ueber($event, tag.datum)" @dragleave="vorschau = null" @drop="ablegen($event, tag.datum)">
          <div v-for="e in spuren(tag.datum)" :key="e.punkt.id" class="raster__punkt" :style="position(e)">
            <button type="button" :class="['raster__karte', farbKlasse(e.punkt), meine.includes(e.punkt.id) ? 'raster__karte--mein' : '', groesse && groesse.id === e.punkt.id ? 'raster__karte--aktiv' : '']"
              :title="e.punkt.titel" :draggable="e.punkt.recht >= 2" @dragstart="ziehenStart($event, e)" @dragend="ziehenEnde" @click="$emit('oeffnen', e.punkt)">
              <strong>{{ e.punkt.titel }}</strong>{{ e.punkt.start.slice(11) }}{{ endeText(e) }}<template v-if="e.punkt.ort"> · {{ e.punkt.ort }}</template>
            </button>
            <span v-if="e.punkt.recht >= 2" class="raster__griff" title="Ende ziehen" @pointerdown.stop="groesseStart($event, e, tag.datum)" @pointermove="groesseZiehen($event)" @pointerup="groesseEnde($event)"></span>
          </div>
          <div v-if="auswahl && auswahl.datum === tag.datum" class="raster__auswahl" :style="block(auswahl.von, auswahl.bis)">{{ uhrzeit(auswahl.von) }}–{{ uhrzeit(auswahl.bis) }}</div>
          <div v-if="vorschau && vorschau.datum === tag.datum" class="raster__auswahl" :style="block(vorschau.von, vorschau.bis)">{{ uhrzeit(vorschau.von) }}</div>
        </div>
      </div>
    </div>
  `,
  data() {
    return { stunde: RASTER_STUNDE, auswahl: null, vorschau: null, groesse: null, maus: false }
  },
  computed: {
    /* Sichtbarer Zeitraum aus den Agenda-Einstellungen, erweitert um frühere oder spätere Punkte */
    vonStunde() {
      var datum = this.tage.map(function (t) { return t.datum })
      var frueheste = this.punkte.filter(function (p) { return datum.includes(p.start.slice(0, 10)) }).map(function (p) { return parseInt(p.start.slice(11, 13), 10) })
      return Math.min.apply(null, [this.event.agenda.von].concat(frueheste))
    },
    bisStunde() {
      var datum = this.tage.map(function (t) { return t.datum })
      var spaeteste = this.punkte.filter(function (p) { return p.ende && datum.includes(p.start.slice(0, 10)) }).map(function (p) { return Math.ceil(minutenAmTag(p.ende, p.start.slice(0, 10)) / 60) })
      return Math.min(24, Math.max.apply(null, [this.event.agenda.bis].concat(spaeteste)))
    },
    stunden() {
      var liste = []
      for (var h = this.vonStunde; h < this.bisStunde; h++) liste.push(h)
      return liste
    },
    hoehe() {
      return (this.bisStunde - this.vonStunde) * this.stunde
    },
  },
  methods: {
    wochentagText: wochentagText,
    datumKurz(datum) {
      return datum.slice(8, 10) + '.' + datum.slice(5, 7) + '.'
    },
    farbKlasse(punkt) {
      return farbKlasse(punktFarbe(punkt, this.event))
    },
    tvText(tag) {
      var personen = this.event.personen
      return tag.verantwortliche.map(function (id) { return personKurz(personen[id]) }).join(', ') || '–'
    },
    uhrzeit(minuten) {
      return String(Math.floor(minuten / 60) % 24).padStart(2, '0') + ':' + String(minuten % 60).padStart(2, '0')
    },
    endeText(e) {
      if (this.groesse && this.groesse.id === e.punkt.id) return '–' + this.uhrzeit(this.groesse.bis)
      return e.punkt.ende ? '–' + e.punkt.ende.slice(11) : ''
    },
    spuren(datum) {
      var groesse = this.groesse
      var punkte = this.punkte.filter(function (p) { return p.start.slice(0, 10) === datum })
      var eintraege = spurenBerechnen(punkte, datum)
      if (groesse) eintraege.forEach(function (e) { if (e.punkt.id === groesse.id) e.bis = groesse.bis })
      return eintraege
    },
    position(e) {
      var oben = Math.max(0, (e.von - this.vonStunde * 60) / 60 * this.stunde)
      var unten = Math.min(this.hoehe, (e.bis - this.vonStunde * 60) / 60 * this.stunde)
      return { top: oben + 'px', height: (unten - oben) + 'px', left: (e.spur / e.spuren * 100) + '%', width: (100 / e.spuren) + '%' }
    },
    block(von, bis) {
      var oben = (von - this.vonStunde * 60) / 60 * this.stunde
      return { top: oben + 'px', height: Math.max(12, (bis - von) / 60 * this.stunde) + 'px' }
    },
    /* Minuten ab Mitternacht an einer Bildschirmposition in der Spalte, auf 15 Minuten gerundet */
    minutenBei(ereignis, spalte, aufrunden) {
      var y = ereignis.clientY - spalte.getBoundingClientRect().top
      var roh = this.vonStunde * 60 + y / this.stunde * 60
      var gerundet = (aufrunden ? Math.ceil : Math.floor)(roh / RASTER_RASTER) * RASTER_RASTER
      return Math.max(this.vonStunde * 60, Math.min(this.bisStunde * 60, gerundet))
    },
    /* Freie Zeit mit der Maus aufziehen */
    auswahlStart(ereignis, datum) {
      this.maus = ereignis.pointerType === 'mouse'
      if (!this.anlegen || !this.maus || ereignis.button !== 0 || ereignis.target !== ereignis.currentTarget) return
      var anker = this.minutenBei(ereignis, ereignis.currentTarget, false)
      this.auswahl = { datum: datum, anker: anker, von: anker, bis: anker + RASTER_RASTER, gezogen: false }
      ereignis.currentTarget.setPointerCapture(ereignis.pointerId)
    },
    auswahlZiehen(ereignis) {
      if (!this.auswahl) return
      var jetzt = this.minutenBei(ereignis, ereignis.currentTarget, true)
      var a = this.auswahl
      if (jetzt > a.anker) {
        a.von = a.anker
        a.bis = jetzt
      } else {
        a.von = Math.min(a.anker, this.minutenBei(ereignis, ereignis.currentTarget, false))
        a.bis = a.anker + RASTER_RASTER
      }
      if (a.bis - a.von > RASTER_RASTER) a.gezogen = true
    },
    auswahlEnde() {
      var a = this.auswahl
      if (!a) return
      this.auswahl = null
      this.$emit('aufziehen', { start: zeitpunktPlus(a.datum, a.von), ende: a.gezogen ? zeitpunktPlus(a.datum, a.bis) : '' })
    },
    /* Touch und Stift: Tippen auf eine freie Zeit */
    tippen(ereignis, datum) {
      if (!this.anlegen || this.maus || ereignis.target !== ereignis.currentTarget) return
      this.$emit('aufziehen', { start: zeitpunktPlus(datum, this.minutenBei(ereignis, ereignis.currentTarget, false)), ende: '' })
    },
    /* Bestehenden Punkt verschieben */
    ziehenStart(ereignis, e) {
      var karte = ereignis.currentTarget.getBoundingClientRect()
      var versatz = Math.floor((ereignis.clientY - karte.top) / this.stunde * 60 / RASTER_RASTER) * RASTER_RASTER
      rasterZiehen = { art: 'verschieben', punkt: e.punkt, versatz: versatz, dauer: dauerMinuten(e.punkt.start, e.punkt.ende) }
      ereignis.dataTransfer.effectAllowed = 'move'
      ereignis.dataTransfer.setData('text/plain', e.punkt.titel)
    },
    ziehenEnde() {
      rasterZiehen = null
      this.vorschau = null
    },
    zielMinuten(ereignis) {
      var start = this.minutenBei(ereignis, ereignis.currentTarget, false) - (rasterZiehen.versatz || 0)
      return Math.max(this.vonStunde * 60, start)
    },
    ueber(ereignis, datum) {
      if (!rasterZiehen) return
      if (rasterZiehen.art !== 'verschieben' && !this.anlegen) return
      ereignis.preventDefault()
      var von = this.zielMinuten(ereignis)
      this.vorschau = { datum: datum, von: von, bis: von + (rasterZiehen.dauer || 60) }
    },
    ablegen(ereignis, datum) {
      if (!rasterZiehen) return
      ereignis.preventDefault()
      var ziehen = rasterZiehen
      var start = zeitpunktPlus(datum, this.zielMinuten(ereignis))
      rasterZiehen = null
      this.vorschau = null
      if (ziehen.art === 'verschieben') {
        if (start === ziehen.punkt.start) return
        this.$emit('verschieben', { punkt: ziehen.punkt, start: start, ende: ziehen.punkt.ende ? zeitpunktPlus(start.slice(0, 10), minutenAmTag(start, start.slice(0, 10)) + ziehen.dauer) : '' })
      } else {
        this.$emit('ablegen', { art: ziehen.art, id: ziehen.id, start: start })
      }
    },
    /* Länge ändern mit dem Griff am unteren Rand */
    groesseStart(ereignis, e, datum) {
      if (ereignis.button !== 0) return
      ereignis.preventDefault()
      this.groesse = { id: e.punkt.id, punkt: e.punkt, datum: datum, von: e.von, bis: e.bis, spalte: ereignis.currentTarget.closest('.raster__spalte') }
      ereignis.currentTarget.setPointerCapture(ereignis.pointerId)
    },
    groesseZiehen(ereignis) {
      if (!this.groesse) return
      this.groesse.bis = Math.max(this.groesse.von + RASTER_RASTER, this.minutenBei(ereignis, this.groesse.spalte, true))
    },
    groesseEnde() {
      var g = this.groesse
      if (!g) return
      var ende = zeitpunktPlus(g.datum, g.bis)
      if (ende !== g.punkt.ende) this.$emit('verschieben', { punkt: g.punkt, start: g.punkt.start, ende: ende })
      /* Anzeige erst nach der Antwort des Servers zurücksetzen, sonst springt die Karte kurz zurück */
      var komponente = this
      setTimeout(function () { if (komponente.groesse === g) komponente.groesse = null }, ende !== g.punkt.ende ? 600 : 0)
    },
  },
})

/* Bausteine zum Hineinziehen: Programmvorlagen der Installation und Punkte, die es im Event schon gibt */
app.component('programm-bausteine', {
  props: {
    vorlagen: { type: Array, required: true },
    eventPunkte: { type: Array, required: true },
  },
  template: `
    <aside class="bausteine" aria-label="Bausteine">
      <ae-input v-model="suche" placeholder="Bausteine suchen" icon="list" autocomplete="off"></ae-input>
      <p class="leise">In die Agenda ziehen oder dort eine freie Zeit aufziehen.</p>
      <template v-for="gruppe in gruppen" :key="gruppe.titel">
        <h4 class="bausteine__titel">{{ gruppe.titel }}</h4>
        <p v-if="!gruppe.eintraege.length" class="leise">{{ gruppe.leer }}</p>
        <div v-for="b in gruppe.eintraege" :key="b.id" :class="['baustein', farbKlasse(b.farbe)]" draggable="true" @dragstart="ziehen($event, b, gruppe.art)" @dragend="ende">
          <strong>{{ b.titel }}</strong>
          <span class="leise">{{ dauerText(b.dauer) }}<template v-if="b.schritte"> · {{ b.schritte }} {{ b.schritte === 1 ? 'Schritt' : 'Schritte' }}</template></span>
        </div>
      </template>
    </aside>
  `,
  data() {
    return { suche: '' }
  },
  computed: {
    gruppen() {
      var suche = this.suche.trim().toLowerCase()
      function passt(b) { return !suche || b.titel.toLowerCase().includes(suche) }
      return [
        { titel: 'Vorlagen', art: 'vorlage', leer: 'Keine Vorlagen. Speichern Sie einen Programmpunkt als Vorlage.', eintraege: this.vorlagen.filter(passt) },
        { titel: 'Aus diesem Event', art: 'punkt', leer: 'Noch keine Programmpunkte.', eintraege: this.eventPunkte.filter(passt) },
      ]
    },
  },
  methods: {
    dauerText: dauerText,
    farbKlasse: farbKlasse,
    ziehen(ereignis, b, art) {
      rasterZiehen = { art: art, id: b.id, dauer: b.dauer || 60 }
      ereignis.dataTransfer.effectAllowed = 'copy'
      ereignis.dataTransfer.setData('text/plain', b.titel)
    },
    ende() {
      rasterZiehen = null
    },
  },
})

/* Punkte des Events als Bausteine: pro Titel der jüngste, damit wiederkehrende Punkte nur einmal erscheinen */
function eventBausteine(event) {
  var nachTitel = {}
  event.programmpunkte.forEach(function (p) {
    var schluessel = p.titel.trim().toLowerCase()
    if (!nachTitel[schluessel] || nachTitel[schluessel].start < p.start) nachTitel[schluessel] = p
  })
  return Object.values(nachTitel).map(function (p) {
    return { id: p.id, titel: p.titel, dauer: dauerMinuten(p.start, p.ende), farbe: punktFarbe(p, event), schritte: p.ablauf ? p.ablauf.schritte.length : 0 }
  }).sort(function (a, b) { return a.titel.localeCompare(b.titel, 'de') })
}

app.component('event-programm', {
  props: { event: { type: Object, required: true } },
  inject: ['eventAktion', 'eventMeldung'],
  template: `
    <ae-card>
      <div class="stapel">
        <div class="werkzeuge">
          <span class="stufen" role="radiogroup" aria-label="Ansicht">
            <button v-for="a in ansichten" :key="a.id" type="button" role="radio" :aria-checked="ansicht === a.id"
              :class="['stufe', 'reihe', ansicht === a.id ? 'stufe--aktiv' : '']" @click="ansicht = a.id"><ae-icon :name="a.icon" :size="16"></ae-icon>{{ a.label }}</button>
          </span>
          <span class="dehnen"></span>
          <ae-button v-if="anlegen && ansicht !== 'liste'" variant="tertiary" icon="list" @click="bausteineOffen = !bausteineOffen">{{ bausteineOffen ? 'Bausteine ausblenden' : 'Bausteine' }}</ae-button>
          <ae-button v-if="anlegen" variant="tertiary" icon="settings" @click="agendaOeffnen">Agenda</ae-button>
          <ae-button v-if="anlegen" icon="plus" size="md" @click="oeffnen(null)">Programmpunkt</ae-button>
        </div>
        <div class="werkzeuge">
          <template v-if="ansicht === 'tag'">
            <ae-icon-button label="Vorheriger Tag" variant="flat" :disabled="tagIndex === 0" @click="tagIndex--"><ae-icon name="chevron-left" :size="20"></ae-icon></ae-icon-button>
            <ae-select v-model="tagDatum" :optionen="tagOptionen"></ae-select>
            <ae-icon-button label="Nächster Tag" variant="flat" :disabled="tagIndex === event.tage.length - 1" @click="tagIndex++"><ae-icon name="chevron-right" :size="20"></ae-icon></ae-icon-button>
          </template>
          <ae-select v-model="filterTeam" :optionen="teamOptionen"></ae-select>
          <ae-select v-model="filterPerson" :optionen="personOptionen"></ae-select>
          <ae-checkbox v-model="nurMeine" label="Mein Programm"></ae-checkbox>
        </div>

        <div v-if="ansicht !== 'liste'" :class="['agenda', mitBausteinen ? 'agenda--mit-bausteinen' : '']">
          <programm-bausteine v-if="mitBausteinen" :vorlagen="vorlagen" :event-punkte="bausteine"></programm-bausteine>
          <programm-raster :event="event" :tage="ansicht === 'woche' ? event.tage : [event.tage[tagIndex]]" :punkte="gefiltert" :meine="meineIds" :anlegen="anlegen"
            @oeffnen="oeffnen" @aufziehen="aufziehen" @verschieben="verschieben" @ablegen="ablegen"></programm-raster>
        </div>
        <p v-if="ansicht !== 'liste' && ausserhalb" class="leise">{{ ausserhalb }} {{ ausserhalb === 1 ? 'Punkt liegt' : 'Punkte liegen' }} ausserhalb der Eventtage (Vorbereitung) und {{ ausserhalb === 1 ? 'erscheint' : 'erscheinen' }} in der Liste.</p>

        <div v-if="ansicht === 'liste'">
          <p v-if="!gefiltert.length" class="leer">Keine Programmpunkte.</p>
          <template v-for="gruppe in nachTag" :key="gruppe.datum">
            <h4 class="liste__tag">{{ wochentagText(gruppe.datum) }} {{ datumText(gruppe.datum + 'T12:00:00') }}<span v-if="gruppe.thema" class="leise"> · {{ gruppe.thema }}</span></h4>
            <ae-card-row v-for="p in gruppe.punkte" :key="p.id" :title="p.titel" :meta="punktMeta(p)" interaktiv @click="oeffnen(p)">
              <template #leading><span class="liste__zeit">{{ p.start.slice(11) }}{{ p.ende ? '–' + p.ende.slice(11) : '' }}</span></template>
              <template #trailing>
                <div class="reihe">
                  <ae-badge v-if="p.phase === 'vorbereitung'" color="warning">Vorbereitung</ae-badge>
                  <ae-badge v-if="meineIds.includes(p.id)" color="secondary">Meins</ae-badge>
                  <farb-punkt :farbe="punktFarbe(p, event)"></farb-punkt>
                </div>
              </template>
            </ae-card-row>
          </template>
        </div>
      </div>
    </ae-card>

    <ae-modal v-if="punkt" :title="punkt.id ? (darfBearbeiten ? 'Programmpunkt bearbeiten' : punkt.titel) : 'Neuer Programmpunkt'" :width="640" @schliessen="punkt = null">
      <form v-if="darfBearbeiten" id="punkt-formular" class="formular" @submit.prevent="speichern">
        <ae-input v-model="punkt.titel" label="Titel" required maxlength="120" placeholder="z. B. Zmorge"></ae-input>
        <div class="formular__zeile">
          <ae-input v-model="punkt.datum" label="Datum" type="date" required></ae-input>
          <ae-input v-model="punkt.von" label="Von" type="time" required></ae-input>
          <ae-input v-model="punkt.bis" label="Bis" type="time" hint="Optional. Früher als «Von» heisst: am Folgetag."></ae-input>
        </div>
        <div class="formular__zeile">
          <ae-input v-model="punkt.ort" label="Ort" icon="map-pin" maxlength="200"></ae-input>
          <ae-select v-model="punkt.phase" label="Phase" :optionen="[{ wert: 'durchfuehrung', text: 'Durchführung' }, { wert: 'vorbereitung', text: 'Vorbereitung (z. B. Elternabend)' }]"></ae-select>
        </div>
        <ae-textarea v-model="punkt.beschreibung" label="Beschreibung" maxlength="5000" :rows="3"></ae-textarea>
        <farbe-auswahl v-model="punkt.farbe" ohne-text="Keine (Farbe des Teams oder der Person)"></farbe-auswahl>
        <span class="klein">Zuständige Personen</span>
        <personen-auswahl v-model="punkt.personen" :personen="personenListe"></personen-auswahl>
        <template v-if="event.teams.length">
          <span class="klein">Zuständige Teams</span>
          <div class="chips">
            <button v-for="t in event.teams" :key="t.id" type="button" :class="['chip', punkt.teams.includes(t.id) ? 'chip--aktiv' : '']" @click="umschalten(punkt.teams, t.id)"><farb-punkt :farbe="t.farbe"></farb-punkt>{{ t.name }}</button>
          </div>
        </template>
        <template v-if="punkt.id && anlegen">
          <hr class="ae-divider ae-divider--dashed">
          <span class="klein">Auf weitere Tage kopieren (z. B. Zmorge an jedem Tag)</span>
          <div class="chips">
            <button v-for="t in event.tage" :key="t.datum" type="button" :disabled="t.datum === punkt.datum"
              :class="['chip', kopieTage.includes(t.datum) ? 'chip--aktiv' : '']" @click="umschalten(kopieTage, t.datum)">{{ wochentagText(t.datum) }} {{ t.datum.slice(8, 10) }}.{{ t.datum.slice(5, 7) }}.</button>
          </div>
          <div class="reihe"><ae-button variant="secondary" icon="copy" :disabled="!kopieTage.length" @click="kopieren">Kopieren</ae-button></div>
        </template>
        <ae-alert v-if="fehler" tone="danger">{{ fehler }}</ae-alert>
        <ae-alert v-if="hinweis" tone="success">{{ hinweis }}</ae-alert>
        <div v-if="punkt.id" class="reihe">
          <ae-button v-if="punkt.rechtAblauf >= 1" variant="secondary" icon="list-ordered" @click="ablaufOeffnen">Ablaufplan</ae-button>
          <ae-button v-if="darfVorlagen" variant="tertiary" icon="copy" @click="alsVorlage">Als Vorlage speichern</ae-button>
          <ae-button variant="tertiary" icon="trash-2" @click="loeschen">Programmpunkt löschen</ae-button>
        </div>
      </form>
      <div v-else class="stapel">
        <div class="reihe leise"><ae-icon name="clock" :size="16"></ae-icon>{{ wochentagText(punkt.datum) }} {{ datumText(punkt.datum + 'T12:00:00') }}, {{ punkt.von }}{{ punkt.bis ? '–' + punkt.bis : '' }}</div>
        <div v-if="punkt.ort" class="reihe leise"><ae-icon name="map-pin" :size="16"></ae-icon>{{ punkt.ort }}</div>
        <p v-if="punkt.beschreibung" class="notizen">{{ punkt.beschreibung }}</p>
        <div><span class="werte__label">Zuständig</span>{{ zustaendigText(punkt) || 'Niemand eingetragen' }}</div>
        <div v-if="punkt.rechtAblauf >= 1 || darfVorlagen" class="reihe">
          <ae-button v-if="punkt.rechtAblauf >= 1" variant="secondary" icon="list-ordered" @click="ablaufOeffnen">Ablaufplan</ae-button>
          <ae-button v-if="darfVorlagen" variant="tertiary" icon="copy" @click="alsVorlage">Als Vorlage speichern</ae-button>
        </div>
        <ae-alert v-if="hinweis" tone="success">{{ hinweis }}</ae-alert>
      </div>
      <template #footer>
        <ae-button variant="tertiary" @click="punkt = null">Schliessen</ae-button>
        <ae-button v-if="darfBearbeiten" type="submit" form="punkt-formular" size="md">Speichern</ae-button>
      </template>
    </ae-modal>

    <ae-modal v-if="einfuegen" title="Programmpunkt einfügen" :width="560" @schliessen="einfuegen = null">
      <div class="formular">
        <div class="formular__zeile">
          <ae-input v-model="einfuegen.datum" label="Datum" type="date" required></ae-input>
          <ae-input v-model="einfuegen.von" label="Von" type="time" required></ae-input>
          <ae-input v-model="einfuegen.bis" label="Bis" type="time" hint="Leer: Dauer des Bausteins."></ae-input>
        </div>
        <ae-input v-model="einfuegen.suche" label="Baustein wählen" placeholder="Vorlage oder bestehenden Punkt suchen" icon="list" autocomplete="off"></ae-input>
        <div class="stapel stapel--eng auswahl-liste">
          <ae-card-row title="Neuer, leerer Programmpunkt" meta="Titel und Zuständige selbst erfassen" interaktiv @click="einfuegenLeer">
            <template #leading><ae-icon name="plus" :size="20"></ae-icon></template>
          </ae-card-row>
          <template v-for="gruppe in einfuegenGruppen" :key="gruppe.titel">
            <h4 v-if="gruppe.eintraege.length" class="bausteine__titel">{{ gruppe.titel }}</h4>
            <ae-card-row v-for="b in gruppe.eintraege" :key="b.id" :title="b.titel" :meta="dauerText(b.dauer) + (b.schritte ? ' · Ablaufplan mit ' + b.schritte + (b.schritte === 1 ? ' Schritt' : ' Schritten') : '')" interaktiv @click="einfuegenAus(gruppe.art, b.id)">
              <template #trailing><farb-punkt :farbe="b.farbe"></farb-punkt></template>
            </ae-card-row>
          </template>
        </div>
        <ae-alert v-if="fehler" tone="danger">{{ fehler }}</ae-alert>
      </div>
      <template #footer><ae-button variant="tertiary" @click="einfuegen = null">Abbrechen</ae-button></template>
    </ae-modal>

    <ae-modal v-if="agenda" title="Agenda-Einstellungen" :width="480" @schliessen="agenda = null">
      <form id="agenda-formular" class="formular" @submit.prevent="agendaSpeichern">
        <p class="leise">Welche Uhrzeiten die Wochen- und Tagesansicht zeigt. Programmpunkte ausserhalb erweitern die Anzeige automatisch.</p>
        <div class="formular__zeile">
          <ae-select v-model.number="agenda.von" label="Von" :optionen="stundenOptionen(0, 23)"></ae-select>
          <ae-select v-model.number="agenda.bis" label="Bis" :optionen="stundenOptionen(1, 24)"></ae-select>
        </div>
        <div class="reihe">
          <ae-button variant="secondary" @click="agenda.von = 0; agenda.bis = 24">Ganzer Tag (24 Stunden)</ae-button>
          <ae-button variant="tertiary" @click="agenda.von = 7; agenda.bis = 24">Standard (07 bis 24 Uhr)</ae-button>
        </div>
        <ae-alert v-if="fehler" tone="danger">{{ fehler }}</ae-alert>
      </form>
      <template #footer>
        <ae-button variant="tertiary" @click="agenda = null">Abbrechen</ae-button>
        <ae-button type="submit" form="agenda-formular" size="md">Speichern</ae-button>
      </template>
    </ae-modal>
  `,
  data() {
    return {
      ansicht: window.innerWidth < 700 ? 'tag' : 'woche',
      ansichten: [{ id: 'woche', label: 'Woche', icon: 'calendar-days' }, { id: 'tag', label: 'Tag', icon: 'calendar' }, { id: 'liste', label: 'Liste', icon: 'list' }],
      tagIndex: 0,
      filterTeam: '',
      filterPerson: '',
      nurMeine: false,
      punkt: null,
      kopieTage: [],
      fehler: '',
      hinweis: '',
      vorlagen: [],
      bausteineOffen: window.innerWidth >= 1100,
      einfuegen: null,
      agenda: null,
    }
  },
  created() {
    var heute = heuteIso()
    var i = this.event.tage.findIndex(function (t) { return t.datum === heute })
    if (i >= 0) this.tagIndex = i
    if (this.anlegen) this.vorlagenLaden()
  },
  computed: {
    anlegen() {
      return this.event.ich.darfProgrammAnlegen
    },
    darfVorlagen() {
      return zustand.ich.istAdmin || zustand.ich.darfEventsAnlegen
    },
    mitBausteinen() {
      return this.anlegen && this.bausteineOffen
    },
    bausteine() {
      return eventBausteine(this.event)
    },
    einfuegenGruppen() {
      var suche = this.einfuegen.suche.trim().toLowerCase()
      function passt(b) { return !suche || b.titel.toLowerCase().includes(suche) }
      return [
        { titel: 'Vorlagen', art: 'vorlage', eintraege: this.vorlagen.filter(passt) },
        { titel: 'Aus diesem Event', art: 'punkt', eintraege: this.bausteine.filter(passt) },
      ]
    },
    tagDatum: {
      get() { return this.event.tage[this.tagIndex].datum },
      set(datum) { this.tagIndex = this.event.tage.findIndex(function (t) { return t.datum === datum }) },
    },
    personenListe() {
      return Object.values(this.event.personen).sort(function (a, b) { return (a.vorname + a.name).localeCompare(b.vorname + b.name, 'de') })
    },
    tagOptionen() {
      return this.event.tage.map(function (t) { return { wert: t.datum, text: wochentagText(t.datum) + ' ' + datumText(t.datum + 'T12:00:00') + (t.thema ? ' · ' + t.thema : '') } })
    },
    teamOptionen() {
      return [{ wert: '', text: 'Alle Teams' }].concat(this.event.teams.map(function (t) { return { wert: t.id, text: t.name } }))
    },
    personOptionen() {
      return [{ wert: '', text: 'Alle Personen' }].concat(this.personenListe.map(function (p) { return { wert: p.id, text: personenName(p) } }))
    },
    /* Punkte, für die die angemeldete Person direkt, über eines ihrer Teams oder in einem Ablaufschritt eingetragen ist */
    meineIds() {
      var ich = this.event.ich.personId
      var meineTeams = this.event.teams.filter(function (t) { return t.mitglieder.some(function (m) { return m.personId === ich }) }).map(function (t) { return t.id })
      function betrifft(personen, teams) {
        return personen.includes(ich) || teams.some(function (t) { return meineTeams.includes(t) })
      }
      return this.event.programmpunkte.filter(function (p) {
        return betrifft(p.personen, p.teams) || (p.ablauf && p.ablauf.schritte.some(function (s) { return betrifft(s.wer.personen, s.wer.teams) }))
      }).map(function (p) { return p.id })
    },
    gefiltert() {
      var team = this.filterTeam
      var person = this.filterPerson
      var meine = this.nurMeine ? this.meineIds : null
      var teams = this.event.teams
      return this.event.programmpunkte.filter(function (p) {
        if (meine && !meine.includes(p.id)) return false
        if (team && !p.teams.includes(team)) return false
        if (person) {
          var ueberTeam = teams.some(function (t) { return p.teams.includes(t.id) && t.mitglieder.some(function (m) { return m.personId === person }) })
          if (!p.personen.includes(person) && !ueberTeam) return false
        }
        return true
      })
    },
    ausserhalb() {
      var start = this.event.startDatum
      var ende = this.event.endDatum
      return this.gefiltert.filter(function (p) { return p.start.slice(0, 10) < start || p.start.slice(0, 10) > ende }).length
    },
    nachTag() {
      var gruppen = []
      var tage = this.event.tage
      this.gefiltert.forEach(function (p) {
        var datum = p.start.slice(0, 10)
        var gruppe = gruppen[gruppen.length - 1]
        if (!gruppe || gruppe.datum !== datum) {
          var tag = tage.find(function (t) { return t.datum === datum })
          gruppe = { datum: datum, thema: tag ? tag.thema : '', punkte: [] }
          gruppen.push(gruppe)
        }
        gruppe.punkte.push(p)
      })
      return gruppen
    },
    darfBearbeiten() {
      return this.punkt.id ? this.punkt.recht >= 2 : this.anlegen
    },
  },
  methods: {
    wochentagText: wochentagText,
    datumText: datumText,
    personenName: personenName,
    punktFarbe: punktFarbe,
    dauerText: dauerText,
    umschalten(liste, wert) {
      var i = liste.indexOf(wert)
      if (i >= 0) liste.splice(i, 1)
      else liste.push(wert)
    },
    stundenOptionen(von, bis) {
      var liste = []
      for (var h = von; h <= bis; h++) liste.push({ wert: h, text: String(h).padStart(2, '0') + ':00' })
      return liste
    },
    zustaendigText(p) {
      var personen = this.event.personen
      var namen = p.personen.map(function (id) { return personen[id] ? personen[id].vorname + ' ' + personen[id].name : '?' })
      var teams = this.event.teams.filter(function (t) { return p.teams.includes(t.id) }).map(function (t) { return 'Team ' + t.name })
      return namen.concat(teams).join(', ')
    },
    punktMeta(p) {
      return [p.ort, this.zustaendigText(p)].filter(Boolean).join(' · ')
    },
    async vorlagenLaden() {
      try {
        this.vorlagen = (await api.anfrage('programmvorlagen_liste', {})).vorlagen
      } catch (fehler) {
        this.vorlagen = []
      }
    },
    oeffnen(p, vorgabe) {
      this.fehler = ''
      this.hinweis = ''
      this.kopieTage = []
      var tag = this.ansicht === 'tag' ? this.event.tage[this.tagIndex].datum : this.event.startDatum
      this.punkt = p
        ? { id: p.id, titel: p.titel, beschreibung: p.beschreibung, datum: p.start.slice(0, 10), von: p.start.slice(11), bis: p.ende ? p.ende.slice(11) : '', ort: p.ort, phase: p.phase, farbe: p.farbe, personen: p.personen.slice(), teams: p.teams.slice(), recht: p.recht, rechtAblauf: p.rechtAblauf }
        : Object.assign({ id: '', titel: '', beschreibung: '', datum: tag, von: '08:00', bis: '', ort: '', phase: 'durchfuehrung', farbe: '', personen: [], teams: [], recht: 2, rechtAblauf: 0 }, vorgabe || {})
    },
    ablaufOeffnen() {
      this.$router.push('/event/' + this.event.id + '/ablauf/' + this.punkt.id)
    },
    async speichern() {
      var p = this.punkt
      var ende = ''
      if (p.bis) {
        var endDatum = p.datum
        if (p.bis <= p.von) endDatum = zeitpunktPlus(p.datum, 24 * 60).slice(0, 10)
        ende = endDatum + 'T' + p.bis
      }
      try {
        await this.eventAktion('programmpunkt_speichern', {
          id: p.id, titel: p.titel, beschreibung: p.beschreibung, start: p.datum + 'T' + p.von, ende: ende,
          ort: p.ort, phase: p.phase, farbe: p.farbe, personen: p.personen, teams: p.teams,
        })
        this.punkt = null
      } catch (fehler) {
        this.fehler = fehler.message
      }
    },
    async kopieren() {
      try {
        await this.eventAktion('programmpunkt_kopieren', { id: this.punkt.id, daten: this.kopieTage })
        this.punkt = null
      } catch (fehler) {
        this.fehler = fehler.message
      }
    },
    async loeschen() {
      if (!confirm('Programmpunkt «' + this.punkt.titel + '» löschen?')) return
      try {
        await this.eventAktion('programmpunkt_loeschen', { id: this.punkt.id })
        this.punkt = null
      } catch (fehler) {
        this.fehler = fehler.message
      }
    },
    async alsVorlage() {
      this.fehler = ''
      try {
        var antwort = await this.eventAktion('programmvorlage_aus_punkt', { id: this.punkt.id })
        this.hinweis = 'Als Vorlage «' + antwort.vorlage.titel + '» gespeichert.'
        this.vorlagenLaden()
      } catch (fehler) {
        this.fehler = fehler.message
      }
    },
    /* Verschieben und Länge ändern direkt in der Agenda; Fehler erscheinen als Meldung über dem Bereich */
    async verschieben(daten) {
      await this.eventAktion('programmpunkt_verschieben', { id: daten.punkt.id, start: daten.start, ende: daten.ende }).catch(function () {})
    },
    async ablegen(daten) {
      try {
        var antwort = await this.eventAktion('programmpunkt_einfuegen', { art: daten.art, quelleId: daten.id, start: daten.start, ende: '' })
        this.neuOeffnen(antwort.neuId)
      } catch (fehler) {
        /* Meldung zeigt der Eventbereich */
      }
    },
    neuOeffnen(id) {
      var neu = this.event.programmpunkte.find(function (p) { return p.id === id })
      if (neu) this.oeffnen(neu)
    },
    aufziehen(daten) {
      this.fehler = ''
      this.einfuegen = { datum: daten.start.slice(0, 10), von: daten.start.slice(11), bis: daten.ende ? daten.ende.slice(11) : '', suche: '' }
    },
    einfuegenZeiten() {
      var e = this.einfuegen
      var ende = ''
      if (e.bis) ende = (e.bis <= e.von ? zeitpunktPlus(e.datum, 24 * 60).slice(0, 10) : e.datum) + 'T' + e.bis
      return { start: e.datum + 'T' + e.von, ende: ende }
    },
    einfuegenLeer() {
      var e = this.einfuegen
      this.einfuegen = null
      this.oeffnen(null, { datum: e.datum, von: e.von, bis: e.bis })
    },
    async einfuegenAus(art, id) {
      var zeiten = this.einfuegenZeiten()
      try {
        var antwort = await this.eventAktion('programmpunkt_einfuegen', { art: art, quelleId: id, start: zeiten.start, ende: zeiten.ende })
        this.einfuegen = null
        this.neuOeffnen(antwort.neuId)
      } catch (fehler) {
        this.fehler = fehler.message
      }
    },
    agendaOeffnen() {
      this.fehler = ''
      this.agenda = { von: this.event.agenda.von, bis: this.event.agenda.bis }
    },
    async agendaSpeichern() {
      if (this.agenda.bis <= this.agenda.von) {
        this.fehler = '«Bis» muss nach «Von» liegen.'
        return
      }
      try {
        await this.eventAktion('agenda_speichern', { von: this.agenda.von, bis: this.agenda.bis })
        this.agenda = null
      } catch (fehler) {
        this.fehler = fehler.message
      }
    },
  },
})
