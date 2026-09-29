/* Event: Kopf, Navigation nach den drei Phasen, darunter der gewählte Bereich.
   Die Bereiche erhalten das Event als Prop und ändern es über eventAktion() (provide/inject);
   jede Antwort des Servers liefert das Event in der Sicht der angemeldeten Person zurück. */
var EVENT_NAVIGATION = [
  { phase: 'Konzept und Vorbereitung', bereiche: [
    { id: 'uebersicht', label: 'Übersicht und Tage', icon: 'info', recht: 'stammdaten', komponente: 'event-uebersicht' },
    { id: 'personen', label: 'Personen und Teams', icon: 'users', recht: 'personen', komponente: 'event-personen' },
    { id: 'rollen', label: 'Rollen und Rechte', icon: 'shield-check', recht: 'personen', komponente: 'event-rollen' },
  ] },
  { phase: 'Durchführung', bereiche: [
    { id: 'programm', label: 'Programm', icon: 'calendar-days', recht: 'programm', komponente: 'event-programm' },
    { id: 'ablauf', label: 'Ablaufpläne', icon: 'list-ordered', recht: 'ablauf', komponente: 'event-ablauf' },
  ] },
]

var SeiteEvent = {
  props: { id: { type: String, required: true }, bereich: { type: String, default: 'uebersicht' }, punktId: { type: String, default: '' } },
  template: `
    <main class="seite">
      <ae-card v-if="!event && fehler" padding="even"><ae-alert tone="danger">{{ fehler }}</ae-alert></ae-card>
      <template v-if="event">
        <div class="seite__kopf">
          <div>
            <p class="seite__kicker">{{ event.typ === 'camp' ? 'Camp' : 'Event' }} · {{ zeitraumText(event.startDatum, event.endDatum) }}<template v-if="event.ort"> · {{ event.ort }}</template></p>
            <h1>{{ event.titel }}</h1>
            <p v-if="event.thema" class="leise">{{ event.thema }}</p>
          </div>
          <div class="reihe">
            <ae-badge v-for="r in event.ich.rollen" :key="r" color="secondary">{{ r }}</ae-badge>
            <ae-badge v-if="event.ich.istAdmin && !event.ich.istMitglied" color="warning">Installations-Admin</ae-badge>
          </div>
        </div>
        <div class="event">
          <nav class="event__nav nicht-drucken" aria-label="Bereiche des Events">
            <template v-for="gruppe in navigation" :key="gruppe.phase">
              <div class="event__phase">{{ gruppe.phase }}</div>
              <ae-nav-item v-for="b in gruppe.bereiche" :key="b.id" :icon="b.icon" :active="b.id === aktiv.id" @click="oeffnen(b.id)">{{ b.label }}</ae-nav-item>
            </template>
          </nav>
          <div class="event__inhalt">
            <ae-alert v-if="meldung" :tone="meldungFehler ? 'danger' : 'success'">{{ meldung }}</ae-alert>
            <component :is="aktiv.komponente" :event="event" v-bind="aktiv.id === 'ablauf' ? { punktId: punktId } : {}"></component>
          </div>
        </div>
      </template>
    </main>
  `,
  data() {
    return { event: null, fehler: '', meldung: '', meldungFehler: false }
  },
  provide() {
    return { eventAktion: this.aktion, eventMeldung: this.melden }
  },
  computed: {
    /* Nur Bereiche, für die die Person mindestens Leserecht hat; die Übersicht sehen alle Mitglieder */
    navigation() {
      var recht = this.event.ich.recht
      return EVENT_NAVIGATION.map(function (gruppe) {
        return { phase: gruppe.phase, bereiche: gruppe.bereiche.filter(function (b) { return b.id === 'uebersicht' || recht[b.recht] >= 1 }) }
      }).filter(function (gruppe) { return gruppe.bereiche.length })
    },
    aktiv() {
      var alle = [].concat.apply([], this.navigation.map(function (g) { return g.bereiche }))
      var bereich = this.bereich
      return alle.find(function (b) { return b.id === bereich }) || alle[0]
    },
  },
  watch: {
    id: { immediate: true, handler: 'laden' },
    bereich() {
      this.meldung = ''
    },
  },
  methods: {
    zeitraumText: zeitraumText,
    async laden() {
      try {
        this.event = (await api.anfrage('event_laden', { eventId: this.id })).event
      } catch (fehler) {
        this.fehler = fehler.message
      }
    },
    oeffnen(bereich) {
      this.$router.push('/event/' + this.id + '/' + bereich)
    },
    /* Aktion im Event ausführen; Fehler erscheinen als Meldung über dem Bereich und werden weitergereicht */
    async aktion(name, daten) {
      this.meldung = ''
      try {
        var antwort = await api.anfrage(name, Object.assign({ eventId: this.id }, daten))
        if (antwort.event) this.event = antwort.event
        return antwort
      } catch (fehler) {
        this.melden(fehler.message, true)
        throw fehler
      }
    },
    melden(text, istFehler) {
      this.meldung = text
      this.meldungFehler = !!istFehler
    },
  },
}
