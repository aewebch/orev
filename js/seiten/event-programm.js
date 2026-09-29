/* Programm eines Events in drei Ansichten desselben Datenbestands: Woche (Tage als Spalten), Tag und Liste.
   Überschneidende Punkte stehen im Raster nebeneinander (Spuren). */
var RASTER_STUNDE = 80

function minutenAmTag(zeitpunkt, datum) {
  if (zeitpunkt.slice(0, 10) > datum) return 24 * 60
  return parseInt(zeitpunkt.slice(11, 13), 10) * 60 + parseInt(zeitpunkt.slice(14, 16), 10)
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
  },
  emits: ['oeffnen'],
  template: `
    <div class="raster">
      <div class="raster__gitter" :style="{ gridTemplateColumns: '48px repeat(' + tage.length + ', minmax(' + (tage.length > 1 ? 132 : 240) + 'px, 1fr))' }">
        <div class="raster__kopf"></div>
        <div v-for="tag in tage" :key="'k' + tag.datum" class="raster__kopf">
          <div class="raster__tag">{{ wochentagText(tag.datum) }} {{ datumKurz(tag.datum) }}</div>
          <div class="raster__thema" :title="tag.thema">{{ tag.thema || ' ' }}</div>
          <div class="raster__thema">TV: {{ tvText(tag) }}</div>
        </div>
        <div class="raster__zeiten" :style="{ height: hoehe + 'px' }">
          <span v-for="h in stunden" :key="h" class="raster__zeit" :style="{ top: (h - vonStunde) * stunde + 'px' }">{{ String(h).padStart(2, '0') }}:00</span>
        </div>
        <div v-for="tag in tage" :key="'s' + tag.datum" class="raster__spalte" :style="{ height: hoehe + 'px', '--stunde': stunde + 'px' }">
          <div v-for="e in spuren(tag.datum)" :key="e.punkt.id" class="raster__punkt" :style="position(e)">
            <button type="button" :class="['raster__karte', meine.includes(e.punkt.id) ? 'raster__karte--mein' : '']" :title="e.punkt.titel" @click="$emit('oeffnen', e.punkt)">
              <strong>{{ e.punkt.titel }}</strong>{{ e.punkt.start.slice(11) }}{{ e.punkt.ende ? '–' + e.punkt.ende.slice(11) : '' }}<template v-if="e.punkt.ort"> · {{ e.punkt.ort }}</template>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return { stunde: RASTER_STUNDE }
  },
  computed: {
    /* Sichtbarer Zeitraum: mindestens 07 bis 23 Uhr, erweitert um frühere oder spätere Punkte */
    vonStunde() {
      var datum = this.tage.map(function (t) { return t.datum })
      var frueheste = this.punkte.filter(function (p) { return datum.includes(p.start.slice(0, 10)) }).map(function (p) { return parseInt(p.start.slice(11, 13), 10) })
      return Math.min.apply(null, [7].concat(frueheste))
    },
    bisStunde() {
      var datum = this.tage.map(function (t) { return t.datum })
      var spaeteste = this.punkte.filter(function (p) { return p.ende && datum.includes(p.ende.slice(0, 10)) }).map(function (p) { return Math.ceil(minutenAmTag(p.ende, p.ende.slice(0, 10)) / 60) })
      return Math.min(24, Math.max.apply(null, [23].concat(spaeteste)))
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
    tvText(tag) {
      var personen = this.event.personen
      return tag.verantwortliche.map(function (id) { return personen[id] ? (personen[id].kuerzel || personen[id].vorname) : '?' }).join(', ') || '–'
    },
    spuren(datum) {
      return spurenBerechnen(this.punkte.filter(function (p) { return p.start.slice(0, 10) === datum }), datum)
    },
    position(e) {
      var oben = Math.max(0, (e.von - this.vonStunde * 60) / 60 * this.stunde)
      var unten = Math.min(this.hoehe, (e.bis - this.vonStunde * 60) / 60 * this.stunde)
      return { top: oben + 'px', height: (unten - oben) + 'px', left: (e.spur / e.spuren * 100) + '%', width: (100 / e.spuren) + '%' }
    },
  },
})

app.component('event-programm', {
  props: { event: { type: Object, required: true } },
  inject: ['eventAktion'],
  template: `
    <ae-card>
      <div class="stapel">
        <div class="werkzeuge">
          <span class="stufen" role="radiogroup" aria-label="Ansicht">
            <button v-for="a in ansichten" :key="a.id" type="button" role="radio" :aria-checked="ansicht === a.id"
              :class="['stufe', 'reihe', ansicht === a.id ? 'stufe--aktiv' : '']" @click="ansicht = a.id"><ae-icon :name="a.icon" :size="16"></ae-icon>{{ a.label }}</button>
          </span>
          <span class="dehnen"></span>
          <ae-button v-if="event.ich.darfProgrammAnlegen" icon="plus" size="md" @click="oeffnen(null)">Programmpunkt</ae-button>
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

        <programm-raster v-if="ansicht === 'woche'" :event="event" :tage="event.tage" :punkte="gefiltert" :meine="meineIds" @oeffnen="oeffnen"></programm-raster>
        <programm-raster v-if="ansicht === 'tag'" :event="event" :tage="[event.tage[tagIndex]]" :punkte="gefiltert" :meine="meineIds" @oeffnen="oeffnen"></programm-raster>
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
        <span class="klein">Zuständige Personen</span>
        <personen-auswahl v-model="punkt.personen" :personen="personenListe"></personen-auswahl>
        <template v-if="event.teams.length">
          <span class="klein">Zuständige Teams</span>
          <div class="chips">
            <button v-for="t in event.teams" :key="t.id" type="button" :class="['chip', punkt.teams.includes(t.id) ? 'chip--aktiv' : '']" @click="umschalten(punkt.teams, t.id)">{{ t.name }}</button>
          </div>
        </template>
        <template v-if="punkt.id && event.ich.darfProgrammAnlegen">
          <hr class="ae-divider ae-divider--dashed">
          <span class="klein">Auf weitere Tage kopieren (z. B. Zmorge an jedem Tag)</span>
          <div class="chips">
            <button v-for="t in event.tage" :key="t.datum" type="button" :disabled="t.datum === punkt.datum"
              :class="['chip', kopieTage.includes(t.datum) ? 'chip--aktiv' : '']" @click="umschalten(kopieTage, t.datum)">{{ wochentagText(t.datum) }} {{ t.datum.slice(8, 10) }}.{{ t.datum.slice(5, 7) }}.</button>
          </div>
          <div class="reihe"><ae-button variant="secondary" icon="copy" :disabled="!kopieTage.length" @click="kopieren">Kopieren</ae-button></div>
        </template>
        <ae-alert v-if="fehler" tone="danger">{{ fehler }}</ae-alert>
        <div v-if="punkt.id" class="reihe"><ae-button variant="tertiary" icon="trash-2" @click="loeschen">Programmpunkt löschen</ae-button></div>
      </form>
      <div v-else class="stapel">
        <div class="reihe leise"><ae-icon name="clock" :size="16"></ae-icon>{{ wochentagText(punkt.datum) }} {{ datumText(punkt.datum + 'T12:00:00') }}, {{ punkt.von }}{{ punkt.bis ? '–' + punkt.bis : '' }}</div>
        <div v-if="punkt.ort" class="reihe leise"><ae-icon name="map-pin" :size="16"></ae-icon>{{ punkt.ort }}</div>
        <p v-if="punkt.beschreibung" class="notizen">{{ punkt.beschreibung }}</p>
        <div><span class="werte__label">Zuständig</span>{{ zustaendigText(punkt) || 'Niemand eingetragen' }}</div>
      </div>
      <template #footer>
        <ae-button variant="tertiary" @click="punkt = null">Schliessen</ae-button>
        <ae-button v-if="darfBearbeiten" type="submit" form="punkt-formular" size="md">Speichern</ae-button>
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
    }
  },
  created() {
    var heute = heuteIso()
    var i = this.event.tage.findIndex(function (t) { return t.datum === heute })
    if (i >= 0) this.tagIndex = i
  },
  computed: {
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
    /* Punkte, für die die angemeldete Person direkt oder über eines ihrer Teams zuständig ist */
    meineIds() {
      var ich = this.event.ich.personId
      var meineTeams = this.event.teams.filter(function (t) { return t.mitglieder.some(function (m) { return m.personId === ich }) }).map(function (t) { return t.id })
      return this.event.programmpunkte.filter(function (p) {
        return p.personen.includes(ich) || p.teams.some(function (t) { return meineTeams.includes(t) })
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
      return this.punkt.id ? this.punkt.recht >= 2 : this.event.ich.darfProgrammAnlegen
    },
  },
  methods: {
    wochentagText: wochentagText,
    datumText: datumText,
    personenName: personenName,
    umschalten(liste, wert) {
      var i = liste.indexOf(wert)
      if (i >= 0) liste.splice(i, 1)
      else liste.push(wert)
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
    oeffnen(p) {
      this.fehler = ''
      this.kopieTage = []
      var tag = this.ansicht === 'tag' ? this.event.tage[this.tagIndex].datum : this.event.startDatum
      this.punkt = p
        ? { id: p.id, titel: p.titel, beschreibung: p.beschreibung, datum: p.start.slice(0, 10), von: p.start.slice(11), bis: p.ende ? p.ende.slice(11) : '', ort: p.ort, phase: p.phase, personen: p.personen.slice(), teams: p.teams.slice(), recht: p.recht }
        : { id: '', titel: '', beschreibung: '', datum: tag, von: '08:00', bis: '', ort: '', phase: 'durchfuehrung', personen: [], teams: [], recht: 2 }
    },
    async speichern() {
      var p = this.punkt
      var ende = ''
      if (p.bis) {
        var endDatum = p.datum
        if (p.bis <= p.von) {
          var d = new Date(p.datum + 'T12:00:00')
          d.setDate(d.getDate() + 1)
          endDatum = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
        }
        ende = endDatum + 'T' + p.bis
      }
      try {
        await this.eventAktion('programmpunkt_speichern', {
          id: p.id, titel: p.titel, beschreibung: p.beschreibung, start: p.datum + 'T' + p.von, ende: ende,
          ort: p.ort, phase: p.phase, personen: p.personen, teams: p.teams,
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
  },
})
