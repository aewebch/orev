/* App-Navigation (nach dem Vorbild von Orki): schmale Leiste links mit Logo, «Neues Event», den Hauptbereichen,
   unten Suche sowie Mitteilungen und Konto. Beim Überfahren klappt die Beschriftung als Pille aus.
   Suche und Mitteilungen öffnen ein Panel neben der Leiste; auf dem Handy liegt die Leiste unten. */
var LEISTE_ABFRAGE_MS = 60000

app.component('leiste-eintrag', {
  props: {
    icon: { type: String, required: true },
    label: { type: String, required: true },
    aktiv: { type: Boolean, default: false },
    zaehler: { type: Number, default: 0 },
  },
  emits: ['click'],
  template: `
    <button type="button" :class="['leiste__eintrag', aktiv ? 'leiste__eintrag--aktiv' : '']" :aria-label="label" :aria-current="aktiv ? 'page' : null" @click="$emit('click')">
      <span class="leiste__label" aria-hidden="true">{{ label }}</span>
      <span class="leiste__icon"><slot><ae-icon :name="icon" :size="20"></ae-icon></slot></span>
      <span v-if="zaehler" class="leiste__zaehler">{{ zaehler > 99 ? '99+' : zaehler }}</span>
    </button>
  `,
})

app.component('app-leiste', {
  template: `
    <nav class="leiste" aria-label="Hauptnavigation">
      <router-link to="/" class="leiste__logo" :aria-label="zustand.name + ', Übersicht'">O</router-link>
      <leiste-eintrag v-if="zustand.darfEventsAnlegen" class="leiste__neu" icon="plus" label="Neues Event" @click="gehe({ path: '/', query: { neu: '1' } })"></leiste-eintrag>
      <div class="leiste__mitte">
        <leiste-eintrag icon="layout-dashboard" label="Übersicht" :aktiv="$route.path === '/'" @click="gehe('/')"></leiste-eintrag>
        <leiste-eintrag icon="list-todo" label="Meine Aufgaben" :aktiv="$route.path === '/aufgaben'" @click="gehe('/aufgaben')"></leiste-eintrag>
        <leiste-eintrag icon="bell" label="Mitteilungen" :aktiv="$route.path === '/mitteilungen'" :zaehler="zustand.ungelesen" class="nur-mobil" @click="gehe('/mitteilungen')"></leiste-eintrag>
        <leiste-eintrag v-if="zustand.ich.istAdmin" icon="settings" label="Einstellungen" :aktiv="$route.path === '/einstellungen'" :zaehler="zustand.updateVerfuegbar ? 1 : 0" class="nur-desktop" @click="gehe('/einstellungen')"></leiste-eintrag>
      </div>
      <div class="leiste__unten">
        <leiste-eintrag icon="search" label="Suchen" :aktiv="panel === 'suche'" @click="umschalten('suche')"></leiste-eintrag>
        <leiste-eintrag icon="user" label="Mitteilungen und Konto" :aktiv="panel === 'konto'" :zaehler="zustand.ungelesen" class="leiste__konto" @click="umschalten('konto')">
          <span class="leiste__avatar">{{ initialen }}</span>
        </leiste-eintrag>
      </div>
    </nav>

    <div v-if="panel" class="leiste-schleier" @click="panel = null"></div>

    <aside v-if="panel === 'suche'" class="leiste-panel leiste-panel--breit" aria-label="Suche">
      <div class="leiste-panel__kopf">
        <span class="leiste-panel__titel">Suchen</span>
        <button type="button" class="knopf-rund" aria-label="Schliessen" @click="panel = null"><ae-icon name="x" :size="18"></ae-icon></button>
      </div>
      <label class="suchfeld">
        <ae-icon name="search" :size="18"></ae-icon>
        <input v-model="suche" v-fokus type="search" placeholder="Events, Programm, Aufgaben, Material, Personen …" autocomplete="off" @input="suchen">
      </label>
      <p v-if="suche.length >= 2 && !sucht && !treffer.length" class="leer">Nichts gefunden.</p>
      <p v-if="suche.length < 2" class="leise">Mindestens zwei Zeichen. Gesucht wird in allen Events, zu denen Sie gehören, und nur in dem, was Sie sehen dürfen.</p>
      <div class="leiste-panel__liste">
        <button v-for="(t, i) in treffer" :key="i" type="button" class="treffer" @click="gehe(t.link)">
          <ae-icon :name="trefferIcon(t.art)" :size="18"></ae-icon>
          <span class="dehnen"><strong>{{ t.titel }}</strong><span class="leise">{{ [t.text, t.eventTitel].filter(Boolean).join(' · ') }}</span></span>
        </button>
      </div>
    </aside>

    <aside v-if="panel === 'konto'" class="leiste-panel" aria-label="Mitteilungen und Konto">
      <div class="mitteilungen-kopf">
        <span>Mitteilungen<template v-if="zustand.ungelesen"> ({{ zustand.ungelesen }})</template></span>
        <button type="button" class="text-link" @click="gehe('/mitteilungen')">Alle anzeigen</button>
      </div>
      <div class="leiste-panel__liste">
        <p v-if="mitteilungen && !mitteilungen.length" class="leer">Keine Mitteilungen.</p>
        <mitteilung-karte v-for="m in (mitteilungen || []).slice(0, 6)" :key="m.id" :mitteilung="m" @oeffnen="mitteilungOeffnen"></mitteilung-karte>
      </div>
      <button v-if="zustand.ungelesen" type="button" class="text-link" @click="alleGelesen">Alle als gelesen markieren</button>

      <template v-if="zustand.ich.istAdmin">
        <div class="leiste-panel__abschnitt">System</div>
        <div class="knopf-raster">
          <button type="button" class="knopf-kachel" @click="gehe('/einstellungen')"><ae-icon name="settings" :size="16"></ae-icon>Einstellungen<span v-if="zustand.updateVerfuegbar" class="punkt-hinweis" title="Update verfügbar"></span></button>
          <button type="button" class="knopf-kachel" @click="gehe({ path: '/einstellungen', query: { tab: 'benutzer' } })"><ae-icon name="users" :size="16"></ae-icon>Benutzer</button>
        </div>
      </template>
      <div class="leiste-panel__abschnitt">{{ zustand.ich.vorname }} {{ zustand.ich.name }}</div>
      <div class="knopf-raster">
        <button type="button" class="knopf-kachel" @click="gehe('/konto')"><ae-icon name="user" :size="16"></ae-icon>Mein Konto</button>
        <button type="button" class="knopf-kachel knopf-kachel--gefahr" @click="abmelden"><ae-icon name="log-out" :size="16"></ae-icon>Abmelden</button>
      </div>
      <p class="fusszeile"><button type="button" class="text-link" @click="gehe('/datenschutz')">Datenschutz</button> · <a href="LICENSE" target="_blank" rel="noopener" class="text-link">Lizenz</a> · Orev {{ zustand.version }}</p>
    </aside>
  `,
  data() {
    return { zustand: zustand, panel: null, suche: '', treffer: [], sucht: false, suchZeit: null, mitteilungen: null, abfrage: null }
  },
  computed: {
    initialen() {
      var ich = this.zustand.ich
      return ((ich.vorname || '').charAt(0) + (ich.name || '').charAt(0)).toUpperCase()
    },
  },
  watch: {
    $route() {
      this.panel = null
      this.anzahlLaden()
    },
  },
  mounted() {
    var komponente = this
    this.anzahlLaden()
    this.abfrage = setInterval(function () { if (document.visibilityState === 'visible') komponente.anzahlLaden() }, LEISTE_ABFRAGE_MS)
    document.addEventListener('keydown', this.taste)
  },
  beforeUnmount() {
    clearInterval(this.abfrage)
    document.removeEventListener('keydown', this.taste)
  },
  methods: {
    gehe(ziel) {
      this.panel = null
      this.$router.push(ziel)
    },
    taste(ereignis) {
      if (ereignis.key === 'Escape') this.panel = null
    },
    umschalten(panel) {
      this.panel = this.panel === panel ? null : panel
      if (this.panel === 'konto') this.mitteilungenLaden()
    },
    async anzahlLaden() {
      if (!zustand.ich) return
      try {
        zustand.ungelesen = (await api.anfrage('benachrichtigungen_anzahl', {})).ungelesen
      } catch (fehler) {
        /* Nächster Versuch bei der nächsten Abfrage */
      }
    },
    async mitteilungenLaden() {
      var antwort = await api.anfrage('benachrichtigungen_liste', {})
      this.mitteilungen = antwort.benachrichtigungen
      zustand.ungelesen = antwort.ungelesen
    },
    async mitteilungOeffnen(m) {
      if (!m.gelesen) {
        var antwort = await api.anfrage('benachrichtigungen_gelesen', { ids: [m.id] }).catch(function () { return null })
        if (antwort) zustand.ungelesen = antwort.ungelesen
      }
      this.gehe(m.link)
    },
    async alleGelesen() {
      var antwort = await api.anfrage('benachrichtigungen_gelesen', { alle: true })
      this.mitteilungen = antwort.benachrichtigungen
      zustand.ungelesen = antwort.ungelesen
    },
    suchen() {
      clearTimeout(this.suchZeit)
      var komponente = this
      if (this.suche.trim().length < 2) {
        this.treffer = []
        return
      }
      this.sucht = true
      this.suchZeit = setTimeout(async function () {
        var suche = komponente.suche
        var antwort = await api.anfrage('suche', { suche: suche }).catch(function () { return { treffer: [] } })
        if (suche === komponente.suche) {
          komponente.treffer = antwort.treffer
          komponente.sucht = false
        }
      }, 250)
    },
    trefferIcon(art) {
      return { event: 'calendar', programm: 'calendar-days', ablauf: 'list-ordered', aufgabe: 'list-todo', material: 'package', ziel: 'target', person: 'user' }[art] || 'info'
    },
    async abmelden() {
      await api.anfrage('abmelden', {}).catch(function () {})
      zustand.ich = null
      this.panel = null
      this.$router.push('/anmelden')
    },
  },
})

/* Eine Mitteilung als Karte: persönliche mit Akzent in der Primärfarbe, ungelesene fett */
app.component('mitteilung-karte', {
  props: { mitteilung: { type: Object, required: true } },
  emits: ['oeffnen'],
  template: `
    <button type="button" :class="['mitteilung', mitteilung.persoenlich ? 'mitteilung--persoenlich' : '', mitteilung.gelesen ? '' : 'mitteilung--neu']" @click="$emit('oeffnen', mitteilung)">
      <span class="mitteilung__text"><strong>{{ mitteilung.von }}</strong> {{ mitteilung.text }}<template v-if="mitteilung.anzahl > 1"> ({{ mitteilung.anzahl }} Änderungen)</template></span>
      <span class="mitteilung__meta">{{ mitteilung.eventTitel }} · {{ zeitRelativ(mitteilung.zeit) }}<template v-if="mitteilung.persoenlich"> · betrifft Sie</template></span>
    </button>
  `,
  methods: {
    zeitRelativ: zeitRelativ,
  },
})
