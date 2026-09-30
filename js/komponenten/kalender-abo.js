/* Kalender-Abo: persönlicher, geheimer Link für Apple-, Google- oder Outlook-Kalender.
   Der Link lautet /ical/<token>.ics, wenn der Server die Rewrite-Regel kennt, sonst ical.php/<token>.ics. */
app.component('kalender-abo', {
  props: { eventId: { type: String, default: '' } },
  template: `
    <ae-card id="kalender" title="Kalender abonnieren" subtitle="Ihre Programmpunkte und Vorbereitungstermine erscheinen in Ihrem Kalender und aktualisieren sich von selbst.">
      <div v-if="ical" class="stapel">
        <template v-if="!ical.token">
          <ul class="kalender-inhalt">
            <li>Programmpunkte, für die Sie eingetragen sind (direkt, über ein Team oder in einem Ablaufschritt), mit Ort, Ihren Schritten, Aufgaben und Material</li>
            <li>Jeder Vorbereitungstermin Ihrer Aufgaben als eigener Eintrag</li>
          </ul>
          <div class="reihe"><ae-button icon="calendar" @click="erzeugen">Abo-Link erstellen</ae-button></div>
        </template>
        <template v-else>
          <div class="werkzeuge">
            <select v-model="filter" class="pille pille--auswahl" aria-label="Welche Events">
              <option value="">Alle meine Events</option>
              <option v-for="e in ical.events" :key="e.id" :value="e.id">Nur {{ e.titel }}</option>
            </select>
            <span class="stufen" role="radiogroup" aria-label="Inhalt">
              <button type="button" role="radio" :aria-checked="!ical.ganzesProgramm" :class="['stufe', !ical.ganzesProgramm ? 'stufe--aktiv' : '']" @click="inhalt(false)">Was mich betrifft</button>
              <button type="button" role="radio" :aria-checked="ical.ganzesProgramm" :class="['stufe', ical.ganzesProgramm ? 'stufe--aktiv' : '']" @click="inhalt(true)">Ganzes Programm</button>
            </span>
          </div>
          <label class="abo-link">
            <ae-icon name="lock" :size="16"></ae-icon>
            <input :value="link" readonly class="nahtlos" aria-label="Abo-Link" @focus="$event.target.select()">
          </label>
          <div class="reihe">
            <a :href="webcal" class="ae-btn ae-btn--primary ae-btn--md abo-knopf"><ae-icon name="calendar" :size="16"></ae-icon>Im Kalender öffnen</a>
            <ae-button variant="secondary" icon="copy" @click="kopieren">{{ kopiert ? 'Kopiert' : 'Link kopieren' }}</ae-button>
            <pillen-menue label="Weitere Aktionen">
              <button type="button" class="menue-eintrag" @click="erzeugen">Neuen Link erzeugen (der alte wird ungültig)</button>
              <button type="button" class="menue-eintrag menue-eintrag--gefahr" @click="beenden">Abo beenden</button>
            </pillen-menue>
          </div>
          <p class="hinweis-zeile leise"><ae-icon name="info" :size="16"></ae-icon>Der Link ist geheim: Wer ihn kennt, sieht Ihre Einträge ohne Anmeldung. Geben Sie ihn nicht weiter. Wurde er bekannt, erzeugen Sie einen neuen.</p>
          <p v-if="!ical.eigeneWahl" class="leise">«{{ ical.standard ? 'Ganzes Programm' : 'Was mich betrifft' }}» ist die Voreinstellung dieser Installation.</p>
          <details class="bewertung-gruppe">
            <summary class="bewertung-gruppe__kopf"><strong class="dehnen">So abonnieren Sie</strong></summary>
            <ul class="kalender-inhalt">
              <li><strong>Apple (iPhone, Mac):</strong> «Im Kalender öffnen» antippen und bestätigen.</li>
              <li><strong>Google Kalender:</strong> Link kopieren, dann in Google Kalender «Weitere Kalender», «Per URL» und einfügen.</li>
              <li><strong>Outlook:</strong> Link kopieren, dann «Kalender hinzufügen», «Aus dem Internet abonnieren» und einfügen.</li>
            </ul>
            <p class="leise">Kalender-Apps holen Änderungen meist stündlich, Google teils seltener.</p>
          </details>
        </template>
        <ae-alert v-if="fehler" tone="danger">{{ fehler }}</ae-alert>
      </div>
    </ae-card>
  `,
  data() {
    return { ical: null, filter: this.eventId, schoen: false, kopiert: false, fehler: '' }
  },
  computed: {
    link() {
      var basis = new URL('.', document.baseURI).href
      var pfad = this.schoen ? 'ical/' : 'ical.php/'
      return basis + pfad + this.ical.token + '.ics' + (this.filter ? '?event=' + this.filter : '')
    },
    webcal() {
      return this.link.replace(/^https?:/, 'webcal:')
    },
  },
  async created() {
    this.laden()
    /* Kennt der Server die kurze Adresse? ical.php antwortet dann mit dem Kopf X-Orev-Ical */
    try {
      var antwort = await fetch(new URL('ical/pruefen.ics', document.baseURI).href, { method: 'GET', cache: 'no-store' })
      this.schoen = antwort.headers.get('X-Orev-Ical') === '1'
    } catch (fehler) {
      this.schoen = false
    }
  },
  methods: {
    uebernehmen(antwort) {
      this.ical = antwort.ical
      this.fehler = ''
    },
    async ausfuehren(aktion, daten) {
      try {
        this.uebernehmen(await api.anfrage(aktion, daten || {}))
      } catch (fehler) {
        this.fehler = fehler.message
      }
    },
    laden() {
      return this.ausfuehren('ical_status')
    },
    erzeugen() {
      if (this.ical.token && !confirm('Neuen Link erzeugen? Kalender, die den alten Link abonniert haben, erhalten keine Einträge mehr.')) return
      this.ausfuehren('ical_token_erzeugen')
    },
    beenden() {
      if (!confirm('Abo beenden? Der Link wird ungültig.')) return
      this.ausfuehren('ical_beenden')
    },
    inhalt(ganzes) {
      if (ganzes === this.ical.ganzesProgramm) return
      this.ausfuehren('ical_einstellung_speichern', { ganzesProgramm: ganzes })
    },
    async kopieren() {
      try {
        await navigator.clipboard.writeText(this.link)
        this.kopiert = true
        var komponente = this
        setTimeout(function () { komponente.kopiert = false }, 2000)
      } catch (fehler) {
        this.fehler = 'Kopieren ist hier nicht möglich. Markieren Sie den Link und kopieren Sie ihn von Hand.'
      }
    },
  },
})
