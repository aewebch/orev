/* Alle Mitteilungen der angemeldeten Person, filterbar; ein Klick öffnet die Stelle und markiert sie als gelesen */
var SeiteMitteilungen = {
  template: `
    <main class="seite seite--mittel">
      <div class="seite__kopf">
        <div>
          <p class="seite__kicker">Mitteilungen</p>
          <h1>Was sich geändert hat</h1>
        </div>
        <div class="reihe">
          <button v-if="ungelesen" type="button" class="pille" @click="alleGelesen"><span class="pille__text">Alle als gelesen markieren</span></button>
          <pillen-menue label="Weitere Aktionen" rechts>
            <button type="button" class="menue-eintrag" @click="leeren">Gelesene entfernen</button>
          </pillen-menue>
        </div>
      </div>
      <span class="stufen" role="radiogroup" aria-label="Filter">
        <button v-for="f in filterListe" :key="f.id" type="button" role="radio" :aria-checked="filter === f.id" :class="['stufe', filter === f.id ? 'stufe--aktiv' : '']" @click="filter = f.id">{{ f.label }}</button>
      </span>
      <ae-card>
        <p v-if="liste && !gefiltert.length" class="leer">Keine Mitteilungen.</p>
        <div class="stapel stapel--eng">
          <template v-for="gruppe in nachTag" :key="gruppe.tag">
            <h4 class="liste__tag">{{ gruppe.tag }}</h4>
            <mitteilung-karte v-for="m in gruppe.eintraege" :key="m.id" :mitteilung="m" @oeffnen="oeffnen"></mitteilung-karte>
          </template>
        </div>
      </ae-card>
      <p class="leise">Sie erhalten Mitteilungen zu Änderungen, die Sie betreffen, und zu allem, was Sie in Ihren Events sehen dürfen. Eigene Änderungen erscheinen nicht.</p>
    </main>
  `,
  data() {
    return {
      liste: null,
      ungelesen: 0,
      filter: 'alle',
      filterListe: [{ id: 'alle', label: 'Alle' }, { id: 'persoenlich', label: 'Betrifft mich' }, { id: 'ungelesen', label: 'Ungelesen' }],
    }
  },
  created() {
    this.laden()
  },
  computed: {
    gefiltert() {
      var filter = this.filter
      return (this.liste || []).filter(function (m) {
        if (filter === 'persoenlich') return m.persoenlich
        if (filter === 'ungelesen') return !m.gelesen
        return true
      })
    },
    nachTag() {
      var gruppen = []
      this.gefiltert.forEach(function (m) {
        var tag = datumText(m.zeit)
        var gruppe = gruppen[gruppen.length - 1]
        if (!gruppe || gruppe.tag !== tag) {
          gruppe = { tag: tag, eintraege: [] }
          gruppen.push(gruppe)
        }
        gruppe.eintraege.push(m)
      })
      return gruppen
    },
  },
  methods: {
    uebernehmen(antwort) {
      this.liste = antwort.benachrichtigungen
      this.ungelesen = antwort.ungelesen
      zustand.ungelesen = antwort.ungelesen
    },
    async laden() {
      this.uebernehmen(await api.anfrage('benachrichtigungen_liste', {}))
    },
    async oeffnen(m) {
      if (!m.gelesen) await api.anfrage('benachrichtigungen_gelesen', { ids: [m.id] }).catch(function () {})
      this.$router.push(m.link)
    },
    async alleGelesen() {
      this.uebernehmen(await api.anfrage('benachrichtigungen_gelesen', { alle: true }))
    },
    async leeren() {
      this.uebernehmen(await api.anfrage('benachrichtigungen_leeren', {}))
    },
  },
}

/* Aufgaben aus allen Events, für die die angemeldete Person zuständig ist */
var SeiteMeineAufgaben = {
  template: `
    <main class="seite seite--mittel">
      <div class="seite__kopf">
        <div>
          <p class="seite__kicker">Über alle Events</p>
          <h1>Meine Aufgaben</h1>
        </div>
        <span class="stufen" role="radiogroup" aria-label="Filter">
          <button v-for="f in [{ id: 'offen', label: 'Offen' }, { id: 'alle', label: 'Alle' }]" :key="f.id" type="button" role="radio" :aria-checked="filter === f.id" :class="['stufe', filter === f.id ? 'stufe--aktiv' : '']" @click="filter = f.id">{{ f.label }}</button>
        </span>
      </div>
      <ae-card>
        <p v-if="aufgaben && !gefiltert.length" class="leer">{{ filter === 'offen' ? 'Keine offenen Aufgaben.' : 'Keine Aufgaben.' }}</p>
        <template v-for="gruppe in nachEvent" :key="gruppe.eventId">
          <h4 class="liste__tag"><router-link :to="'/event/' + gruppe.eventId + '/aufgaben'">{{ gruppe.eventTitel }}</router-link></h4>
          <div v-for="a in gruppe.aufgaben" :key="a.id" :class="['aufgabe-zeile', a.status === 'erledigt' ? 'aufgabe-zeile--erledigt' : '']">
            <button type="button" class="haken" :aria-label="a.status === 'erledigt' ? 'Wieder öffnen' : 'Als erledigt markieren'" :aria-pressed="a.status === 'erledigt'" @click="umschalten(a)">
              <ae-icon :name="a.status === 'erledigt' ? 'circle-check' : 'circle'" :size="20"></ae-icon>
            </button>
            <router-link :to="'/event/' + a.eventId + '/aufgaben/' + a.id" class="dehnen aufgabe-zeile__inhalt">
              <strong>{{ a.titel }}</strong>
              <span class="leise">{{ [a.ziel.art !== 'event' ? a.ziel.titel : '', a.faellig ? 'fällig ' + datumText(a.faellig + 'T12:00:00') : '', a.termine.length ? a.termine.length + (a.termine.length === 1 ? ' Termin' : ' Termine') : ''].filter(Boolean).join(' · ') }}</span>
            </router-link>
          </div>
        </template>
      </ae-card>
    </main>
  `,
  data() {
    return { aufgaben: null, filter: 'offen' }
  },
  created() {
    this.laden()
  },
  computed: {
    gefiltert() {
      var filter = this.filter
      return (this.aufgaben || []).filter(function (a) { return filter === 'alle' || a.status === 'offen' })
    },
    nachEvent() {
      var gruppen = {}
      var reihenfolge = []
      this.gefiltert.forEach(function (a) {
        if (!gruppen[a.eventId]) {
          gruppen[a.eventId] = { eventId: a.eventId, eventTitel: a.eventTitel, aufgaben: [] }
          reihenfolge.push(a.eventId)
        }
        gruppen[a.eventId].aufgaben.push(a)
      })
      return reihenfolge.map(function (id) { return gruppen[id] })
    },
  },
  methods: {
    datumText: datumText,
    async laden() {
      this.aufgaben = (await api.anfrage('meine_aufgaben', {})).aufgaben
    },
    async umschalten(a) {
      var erledigt = a.status !== 'erledigt'
      a.status = erledigt ? 'erledigt' : 'offen'
      try {
        await api.anfrage('aufgabe_status', { eventId: a.eventId, id: a.id, erledigt: erledigt })
      } catch (fehler) {
        a.status = erledigt ? 'offen' : 'erledigt'
      }
    },
  },
}
