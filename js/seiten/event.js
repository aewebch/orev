/* Event: Kopf, Tabs nach den drei Phasen (durch einen Abstand getrennt), darunter der gewählte Bereich auf einer Fläche.
   Ohne gewählten Bereich öffnet ein eingerichtetes Event (mit Programmpunkten) das Programm, sonst die Übersicht.
   Die Bereiche erhalten das Event als Prop und ändern es über eventAktion() (provide/inject);
   jede Antwort des Servers liefert das Event in der Sicht der angemeldeten Person zurück. */
var EVENT_NAVIGATION = [
  { phase: 'Konzept und Vorbereitung', bereiche: [
    { id: 'uebersicht', label: 'Übersicht und Tage', kurz: 'Übersicht', icon: 'info', recht: 'stammdaten', komponente: 'event-uebersicht' },
    { id: 'konzept', label: 'Konzept: Ziele und Zielgruppe', kurz: 'Konzept', icon: 'target', recht: 'konzept', komponente: 'event-konzept' },
    { id: 'personen', label: 'Personen und Teams', kurz: 'Personen', icon: 'users', recht: 'personen', komponente: 'event-personen' },
    { id: 'rollen', label: 'Rollen und Rechte', kurz: 'Rollen', icon: 'shield-check', recht: 'personen', komponente: 'event-rollen' },
    { id: 'aufgaben', label: 'Aufgaben', icon: 'list-todo', recht: 'aufgaben', komponente: 'event-aufgaben' },
    { id: 'material', label: 'Material', icon: 'package', recht: 'material', komponente: 'event-material' },
  ] },
  { phase: 'Durchführung', bereiche: [
    { id: 'programm', label: 'Programm', icon: 'calendar-days', recht: 'programm', komponente: 'event-programm' },
    { id: 'ablauf', label: 'Ablaufpläne', icon: 'list-ordered', recht: 'ablauf', komponente: 'event-ablauf' },
  ] },
  { phase: 'Nachbereitung', bereiche: [
    { id: 'reflexion', label: 'Reflexion: Zielüberprüfung und Teamkultur', kurz: 'Reflexion', icon: 'lightbulb', recht: 'reflexion', komponente: 'event-reflexion' },
    { id: 'feedback', label: 'Persönliches Feedback', kurz: 'Feedback', icon: 'message-square', recht: 'feedback', komponente: 'event-feedback' },
  ] },
]

var SeiteEvent = {
  props: { id: { type: String, required: true }, bereich: { type: String, default: '' }, punktId: { type: String, default: '' } },
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
          <nav class="event-tabs nicht-drucken" aria-label="Bereiche des Events">
            <div role="tablist" class="ae-tabs">
              <template v-for="(gruppe, g) in navigation" :key="gruppe.phase">
                <span v-if="g > 0" class="event-tabs__trenner" aria-hidden="true"></span>
                <button v-for="b in gruppe.bereiche" :key="b.id" type="button" role="tab" :aria-selected="b.id === aktiv.id" :title="gruppe.phase + ': ' + b.label"
                  :class="['ae-tab', b.id === aktiv.id ? 'ae-tab--active' : '']" @click="oeffnen(b.id)">
                  <ae-icon :name="b.icon" :size="16"></ae-icon>{{ b.kurz || b.label }}
                </button>
              </template>
            </div>
          </nav>
          <div :class="['event__flaeche', aktiv.id === navigation[0].bereiche[0].id ? 'event__flaeche--erster' : '']">
            <ae-alert v-if="meldung" :tone="meldungFehler ? 'danger' : 'success'">{{ meldung }}</ae-alert>
            <component :is="aktiv.komponente" :event="event" v-bind="['ablauf', 'aufgaben'].includes(aktiv.id) ? { punktId: punktId } : {}"></component>
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
      /* Zuständige und Halter sehen ihre Aufgaben und ihr Material auch ohne Recht im Bereich */
      var aufgaben = this.event.aufgaben.length > 0
      var material = this.event.material.length > 0
      /* Feedback schreibt jedes Mitglied */
      var mitglied = this.event.ich.istMitglied
      return EVENT_NAVIGATION.map(function (gruppe) {
        return { phase: gruppe.phase, bereiche: gruppe.bereiche.filter(function (b) { return b.id === 'uebersicht' || recht[b.recht] >= 1 || (b.id === 'aufgaben' && aufgaben) || (b.id === 'material' && material) || (b.id === 'feedback' && mitglied) }) }
      }).filter(function (gruppe) { return gruppe.bereiche.length })
    },
    aktiv() {
      var alle = [].concat.apply([], this.navigation.map(function (g) { return g.bereiche }))
      var bereich = this.bereich
      if (!bereich) bereich = this.event.programmpunkte.length && this.event.ich.recht.programm >= 1 ? 'programm' : 'uebersicht'
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
