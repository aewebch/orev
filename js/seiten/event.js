/* Event: Kopf, drei Phasen als Tabs (Setup, Durchführung, Nachbereitung) mit umgekehrten Radien, darunter eine Fläche.
   Das Setup ist ein geführter Assistent (Schritte mit Fortschritt, frei anwählbar, «Zurück» und «Weiter»);
   Durchführung und Nachbereitung haben Untertabs als Pillen, die zur aktiven scrollen.
   Ohne gewählten Bereich öffnet ein eingerichtetes Event (mit Programmpunkten) das Programm, sonst den ersten offenen
   Setup-Schritt. Die Bereiche erhalten das Event als Prop und ändern es über eventAktion() (provide/inject). */
var EVENT_PHASEN = [
  { id: 'setup', label: 'Setup', icon: 'list-todo', assistent: true, bereiche: [
    { id: 'uebersicht', label: 'Grunddaten und Tage', kurz: 'Grunddaten', icon: 'info', recht: 'stammdaten', komponente: 'event-uebersicht', hilfe: 'grunddaten',
      frage: 'Worum geht es, wann und wo? Legen Sie für jeden Tag ein Thema und die Tagesverantwortung fest.',
      erledigt: function (e) { return !!e.ort && e.tage.some(function (t) { return t.thema || t.verantwortliche.length }) } },
    { id: 'konzept', label: 'Ziele und Zielgruppe', kurz: 'Ziele', icon: 'target', recht: 'konzept', komponente: 'event-konzept', hilfe: 'konzept',
      frage: 'Für wen ist das Event, und was soll es bei den Teilnehmenden bewirken?',
      erledigt: function (e) { return e.konzept.ziele.length > 0 } },
    { id: 'personen', label: 'Personen und Teams', kurz: 'Personen', icon: 'users', recht: 'personen', komponente: 'event-personen', hilfe: 'personen',
      frage: 'Wer macht mit? Fassen Sie Personen bei Bedarf zu Teams zusammen.',
      erledigt: function (e) { return Object.keys(e.personen).length > 1 } },
    { id: 'rollen', label: 'Rollen und Rechte', kurz: 'Rollen', icon: 'shield-check', recht: 'personen', komponente: 'event-rollen', hilfe: 'rollen', optional: true,
      frage: 'Wer darf was sehen und bearbeiten? Die Vorlagen passen oft schon; Sie können diesen Schritt überspringen.',
      erledigt: function (e) { return e.mitglieder.filter(function (m) { return m.rollen.length }).length > 1 } },
    { id: 'aufgaben', label: 'Aufgaben', icon: 'list-todo', recht: 'aufgaben', komponente: 'event-aufgaben', hilfe: 'aufgaben', optional: true,
      frage: 'Was muss vorbereitet werden, und wer kümmert sich darum?',
      erledigt: function (e) { return e.aufgaben.length > 0 } },
    { id: 'material', label: 'Material', icon: 'package', recht: 'material', komponente: 'event-material', hilfe: 'material', optional: true,
      frage: 'Was braucht es, und wer nimmt es mit? Material erfassen Sie meist direkt im Ablaufplan oder bei einer Aufgabe.',
      erledigt: function (e) { return e.material.length > 0 } },
  ] },
  { id: 'durchfuehrung', label: 'Durchführung', icon: 'calendar-days', bereiche: [
    { id: 'programm', label: 'Programm', icon: 'calendar-days', recht: 'programm', komponente: 'event-programm', hilfe: 'programm' },
    { id: 'ablauf', label: 'Ablaufpläne', icon: 'list-ordered', recht: 'ablauf', komponente: 'event-ablauf', hilfe: 'ablaufplan' },
  ] },
  { id: 'nachbereitung', label: 'Nachbereitung', icon: 'lightbulb', bereiche: [
    { id: 'reflexion', label: 'Reflexion', icon: 'lightbulb', recht: 'reflexion', komponente: 'event-reflexion', hilfe: 'reflexion' },
    { id: 'wirkungsmodell', label: 'Wirkungsmodell', icon: 'workflow', recht: 'reflexion', komponente: 'event-wirkungsmodell', hilfe: 'wirkungsmodell' },
    { id: 'feedback', label: 'Feedback', icon: 'message-square', recht: 'feedback', komponente: 'event-feedback', hilfe: 'feedback' },
  ] },
]

/* Scrollt einen waagrechten Bereich so, dass das aktive Element sichtbar und möglichst mittig ist */
function aktivesMittig(behaelter) {
  if (!behaelter) return
  var aktiv = behaelter.querySelector('[aria-selected="true"], [aria-current="step"]')
  if (!aktiv) return
  var ziel = aktiv.offsetLeft - (behaelter.clientWidth - aktiv.offsetWidth) / 2
  behaelter.scrollTo({ left: Math.max(0, ziel), behavior: 'smooth' })
}

var SeiteEvent = {
  props: { id: { type: String, required: true }, bereich: { type: String, default: '' }, punktId: { type: String, default: '' } },
  template: `
    <main class="seite seite--event">
      <ae-card v-if="!event && fehler" padding="even"><ae-alert tone="danger">{{ fehler }}</ae-alert></ae-card>
      <template v-if="event">
        <div class="event-kopf">
          <p class="seite__kicker">{{ event.typ === 'camp' ? 'Camp' : 'Event' }} · {{ zeitraumText(event.startDatum, event.endDatum) }}<template v-if="event.ort"> · {{ event.ort }}</template></p>
          <h1 class="event-kopf__titel">{{ event.titel }}</h1>
          <p v-if="event.thema" class="leise event-kopf__thema">{{ event.thema }}</p>
        </div>

        <div class="event">
          <nav class="event-phasen nicht-drucken" aria-label="Phasen des Events">
            <div role="tablist" class="ae-tabs">
              <button v-for="p in phasen" :key="p.id" type="button" role="tab" :aria-selected="p.id === phase.id"
                :class="['ae-tab', p.id === phase.id ? 'ae-tab--active' : '']" @click="phaseOeffnen(p)">
                <ae-icon :name="p.icon" :size="16" class="event-phasen__icon"></ae-icon><span class="event-phasen__text">{{ p.label }}</span>
                <span v-if="p.id === 'setup' && setupOffen" class="event-phasen__zahl" :title="setupOffen + ' Schritte offen'">{{ setupOffen }}</span>
              </button>
            </div>
          </nav>

          <div :class="['event__flaeche', phaseIndex === 0 ? 'event__flaeche--erster' : '', phaseIndex === phasen.length - 1 ? 'event__flaeche--letzter' : '']">
            <template v-if="phase.assistent">
              <div class="setup-kopf nicht-drucken">
                <div class="setup-fortschritt" role="progressbar" :aria-valuenow="setupErledigt" aria-valuemin="0" :aria-valuemax="phase.bereiche.length" :aria-label="'Setup ' + setupErledigt + ' von ' + phase.bereiche.length + ' erledigt'">
                  <span class="setup-fortschritt__balken" :style="{ width: (setupErledigt / phase.bereiche.length * 100) + '%' }"></span>
                </div>
                <ol ref="schritte" class="setup-schritte" role="tablist" aria-label="Setup-Schritte">
                  <li v-for="(b, i) in phase.bereiche" :key="b.id">
                    <button type="button" role="tab" :aria-selected="b.id === aktiv.id" :aria-current="b.id === aktiv.id ? 'step' : null"
                      :class="['setup-schritt', b.id === aktiv.id ? 'setup-schritt--aktiv' : '', b.erledigt(event) ? 'setup-schritt--erledigt' : '']" @click="oeffnen(b.id)">
                      <span class="setup-schritt__nummer"><ae-icon v-if="b.erledigt(event)" name="check" :size="14"></ae-icon><template v-else>{{ i + 1 }}</template></span>
                      <span class="setup-schritt__text">{{ b.kurz || b.label }}</span>
                    </button>
                  </li>
                </ol>
                <div class="setup-frage">
                  <div class="dehnen">
                    <p class="setup-frage__schritt">Schritt {{ schrittIndex + 1 }} von {{ phase.bereiche.length }}<template v-if="aktiv.optional"> · optional</template></p>
                    <h2 class="setup-frage__titel">{{ aktiv.label }} <hilfe-punkt :thema="aktiv.hilfe"></hilfe-punkt></h2>
                    <p class="leise">{{ aktiv.frage }}</p>
                  </div>
                </div>
              </div>
            </template>
            <nav v-else-if="phase.bereiche.length > 1" ref="untertabs" class="untertabs nicht-drucken" role="tablist" :aria-label="phase.label">
              <button v-for="b in phase.bereiche" :key="b.id" type="button" role="tab" :aria-selected="b.id === aktiv.id"
                :class="['untertab', b.id === aktiv.id ? 'untertab--aktiv' : '']" @click="oeffnen(b.id)">
                <ae-icon :name="b.icon" :size="16"></ae-icon>{{ b.kurz || b.label }}
              </button>
              <hilfe-punkt :thema="aktiv.hilfe" class="untertabs__hilfe"></hilfe-punkt>
            </nav>

            <button v-if="phase.id === 'durchfuehrung' && setupOffen && hatSetup" type="button" class="setup-hinweis nicht-drucken" @click="setupFortsetzen">
              <ae-icon name="list-todo" :size="18"></ae-icon>
              <span class="dehnen">Setup: {{ setupErledigt }} von {{ setupPhase.bereiche.length }} Schritten erledigt</span>
              <span class="text-link">Fortsetzen</span>
            </button>

            <ae-alert v-if="meldung" :tone="meldungFehler ? 'danger' : 'success'">{{ meldung }}</ae-alert>
            <component :is="aktiv.komponente" :event="event" v-bind="['ablauf', 'aufgaben'].includes(aktiv.id) ? { punktId: punktId } : {}"></component>

            <div v-if="phase.assistent" class="setup-weiter nicht-drucken">
              <ae-button v-if="schrittIndex > 0" variant="tertiary" icon="arrow-left" @click="oeffnen(phase.bereiche[schrittIndex - 1].id)">Zurück</ae-button>
              <span class="dehnen"></span>
              <ae-button v-if="schrittIndex < phase.bereiche.length - 1" icon="arrow-right" @click="oeffnen(phase.bereiche[schrittIndex + 1].id)">
                {{ aktiv.optional && !aktiv.erledigt(event) ? 'Überspringen' : 'Weiter' }}: {{ phase.bereiche[schrittIndex + 1].kurz || phase.bereiche[schrittIndex + 1].label }}
              </ae-button>
              <ae-button v-else-if="zielNachSetup" icon="arrow-right" @click="oeffnen(zielNachSetup)">Setup abschliessen: zum Programm</ae-button>
            </div>
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
    /* Nur Bereiche, für die die Person mindestens Leserecht hat; Grunddaten sehen alle Mitglieder.
       Zuständige und Halter sehen ihre Aufgaben und ihr Material auch ohne Recht; Feedback schreibt jedes Mitglied. */
    phasen() {
      var event = this.event
      var recht = event.ich.recht
      var sichtbar = function (b) {
        return b.id === 'uebersicht' || recht[b.recht] >= 1 || (b.id === 'aufgaben' && event.aufgaben.length > 0)
          || (b.id === 'material' && event.material.length > 0) || (b.id === 'feedback' && event.ich.istMitglied)
      }
      return EVENT_PHASEN.map(function (p) { return Object.assign({}, p, { bereiche: p.bereiche.filter(sichtbar) }) }).filter(function (p) { return p.bereiche.length })
    },
    setupPhase() {
      return this.phasen.find(function (p) { return p.id === 'setup' }) || { bereiche: [] }
    },
    /* Das geführte Setup lohnt sich nur für Personen, die im Setup etwas bearbeiten dürfen */
    hatSetup() {
      var recht = this.event.ich.recht
      return this.setupPhase.bereiche.some(function (b) { return recht[b.recht] >= 2 })
    },
    setupErledigt() {
      var event = this.event
      return this.setupPhase.bereiche.filter(function (b) { return b.erledigt(event) }).length
    },
    setupOffen() {
      if (!this.hatSetup) return 0
      var event = this.event
      return this.setupPhase.bereiche.filter(function (b) { return !b.optional && !b.erledigt(event) }).length
    },
    aktiv() {
      var alle = [].concat.apply([], this.phasen.map(function (p) { return p.bereiche }))
      var bereich = this.bereich || this.standardBereich()
      return alle.find(function (b) { return b.id === bereich }) || alle[0]
    },
    phase() {
      var id = this.aktiv.id
      return this.phasen.find(function (p) { return p.bereiche.some(function (b) { return b.id === id }) })
    },
    phaseIndex() {
      return this.phasen.indexOf(this.phase)
    },
    schrittIndex() {
      return this.phase.bereiche.indexOf(this.aktiv)
    },
    zielNachSetup() {
      var programm = this.phasen.some(function (p) { return p.bereiche.some(function (b) { return b.id === 'programm' }) })
      return programm ? 'programm' : ''
    },
  },
  watch: {
    id: { immediate: true, handler: 'laden' },
    bereich() {
      this.meldung = ''
      this.$nextTick(this.mittig)
    },
  },
  methods: {
    zeitraumText: zeitraumText,
    mittig() {
      aktivesMittig(this.$refs.schritte)
      aktivesMittig(this.$refs.untertabs)
    },
    standardBereich() {
      if (this.event.programmpunkte.length && this.event.ich.recht.programm >= 1) return 'programm'
      return this.ersterOffenerSchritt() || 'programm'
    },
    ersterOffenerSchritt() {
      var event = this.event
      var offen = this.setupPhase.bereiche.find(function (b) { return !b.erledigt(event) })
      return offen ? offen.id : ''
    },
    async laden() {
      try {
        this.event = (await api.anfrage('event_laden', { eventId: this.id })).event
        this.$nextTick(this.mittig)
      } catch (fehler) {
        this.fehler = fehler.message
      }
    },
    oeffnen(bereich) {
      this.$router.push('/event/' + this.id + '/' + bereich)
    },
    /* Phase wechseln: im Setup zum ersten offenen Schritt, sonst zum ersten Bereich */
    phaseOeffnen(p) {
      if (p.id === this.phase.id) return
      if (p.assistent) this.oeffnen(this.ersterOffenerSchritt() || p.bereiche[0].id)
      else this.oeffnen(p.bereiche[0].id)
    },
    setupFortsetzen() {
      this.oeffnen(this.ersterOffenerSchritt() || this.setupPhase.bereiche[0].id)
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
