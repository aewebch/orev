/* Konzept (Zielgruppe, SMART-Ziele), Reflexion (Zielüberprüfung, Teamkultur) und persönliche Feedbacks.
   Alles wird direkt im Inhalt bearbeitet: Texte speichern beim Verlassen des Feldes, Zahlen und Zeitbezug stehen
   in Pillen, ein Ziel öffnet sich per Klick zur Bearbeitung. */
var ZIEL_GRADE = [{ id: 'erreicht', label: 'Erreicht' }, { id: 'teilweise', label: 'Teilweise' }, { id: 'nicht', label: 'Nicht erreicht' }]

/* Welche SMART-Angaben ein Ziel schon hat */
function smartStand(ziel) {
  return [
    { buchstabe: 'S', label: 'Spezifisch', ok: !!ziel.formulierung },
    { buchstabe: 'M', label: 'Messbar', ok: !!ziel.messkriterium },
    { buchstabe: 'A', label: 'Erreichbar', ok: !!ziel.erreichbarkeit },
    { buchstabe: 'R', label: 'Relevant', ok: !!ziel.relevanz },
    { buchstabe: 'T', label: 'Terminiert', ok: !!ziel.termin },
  ]
}

app.component('event-konzept', {
  props: { event: { type: Object, required: true } },
  inject: ['eventAktion'],
  template: `
    <ae-card title="Zielgruppe">
      <div v-if="gruppe" class="stapel">
        <textarea v-if="darf" v-model="gruppe.beschreibung" v-wachsen class="nahtlos" rows="1" maxlength="5000" placeholder="Wen möchten wir erreichen?" aria-label="Beschreibung der Zielgruppe" @blur="gruppeSpeichern"></textarea>
        <p v-else class="ablauf__text">{{ gruppe.beschreibung || 'Noch nicht beschrieben.' }}</p>
        <div class="werkzeuge">
          <pillen-menue :text="'Alter: ' + (alterText || '–')" :leer="!alterText" panel :disabled="!darf" @zu="gruppeSpeichern">
            <div class="reihe">
              <input v-model.number="gruppe.alterVon" class="nahtlos nahtlos--rahmen nahtlos--kurz" type="number" min="0" max="120" placeholder="von" aria-label="Mindestalter">
              <span class="leise">bis</span>
              <input v-model.number="gruppe.alterBis" class="nahtlos nahtlos--rahmen nahtlos--kurz" type="number" min="0" max="120" placeholder="bis" aria-label="Höchstalter">
              <span class="leise">Jahre</span>
            </div>
          </pillen-menue>
          <pillen-menue :text="'Erwartet: ' + (gruppe.anzahl ? gruppe.anzahl + ' Personen' : '–')" :leer="!gruppe.anzahl" panel :disabled="!darf" @zu="gruppeSpeichern">
            <div class="reihe">
              <input v-model.number="gruppe.anzahl" class="nahtlos nahtlos--rahmen nahtlos--kurz" type="number" min="0" placeholder="Anzahl" aria-label="Erwartete Anzahl">
              <span class="leise">Personen</span>
            </div>
          </pillen-menue>
        </div>
        <div>
          <span class="werte__label">Besonderheiten und Bedürfnisse</span>
          <textarea v-if="darf" v-model="gruppe.besonderheiten" v-wachsen class="nahtlos" rows="1" maxlength="5000" placeholder="z. B. Allergien, Mobilität, Vorwissen …" aria-label="Besonderheiten und Bedürfnisse" @blur="gruppeSpeichern"></textarea>
          <p v-else class="ablauf__text">{{ gruppe.besonderheiten || '–' }}</p>
        </div>
      </div>
    </ae-card>

    <ae-card title="Ziele" subtitle="Nach SMART: spezifisch, messbar, erreichbar, relevant, terminiert. In der Nachbereitung werden sie überprüft.">
      <div class="stapel">
        <div v-if="darf" class="neue-zeile">
          <ae-icon name="target" :size="18"></ae-icon>
          <input v-model="neu" class="nahtlos dehnen" maxlength="1000" placeholder="Neues Ziel formulieren, mit Enter erfassen" aria-label="Neues Ziel" @keydown.enter.prevent="anlegen">
        </div>
        <p v-if="!ziele.length" class="leer">Noch keine Ziele.</p>
        <div class="aufgaben">
          <div v-for="(z, i) in ziele" :key="z.id" :class="['aufgabe', aktiv === z.id ? 'aufgabe--aktiv' : '', darf && aktiv !== z.id ? 'aufgabe--editierbar' : '']" @click="oeffnen(z)">
            <div class="aufgabe__kopf">
              <span class="ziel__nummer">{{ i + 1 }}</span>
              <textarea v-if="aktiv === z.id" v-model="entwurf.formulierung" v-wachsen v-fokus class="nahtlos nahtlos--titel dehnen" rows="1" maxlength="1000" aria-label="Formulierung"></textarea>
              <div v-else class="dehnen">
                <strong class="aufgabe__titel">{{ z.formulierung }}</strong>
                <span v-if="z.messkriterium" class="leise aufgabe__meta">Messbar: {{ z.messkriterium }}</span>
                <span v-if="z.termin" class="leise aufgabe__meta">Bis: {{ z.termin }}</span>
              </div>
              <span class="smart" :aria-label="'SMART: ' + smartStand(aktiv === z.id ? entwurf : z).filter(function (s) { return s.ok }).map(function (s) { return s.label }).join(', ')">
                <span v-for="s in smartStand(aktiv === z.id ? entwurf : z)" :key="s.buchstabe" :class="['smart__buchstabe', s.ok ? 'smart__buchstabe--ok' : '']" :title="s.label">{{ s.buchstabe }}</span>
              </span>
              <pillen-menue v-if="aktiv === z.id" label="Weitere Aktionen" rechts>
                <button type="button" class="menue-eintrag" :disabled="i === 0" @click="verschieben(z, -1)">Nach oben</button>
                <button type="button" class="menue-eintrag" :disabled="i === ziele.length - 1" @click="verschieben(z, 1)">Nach unten</button>
                <button type="button" class="menue-eintrag menue-eintrag--gefahr" @click="loeschen(z)">Ziel löschen</button>
              </pillen-menue>
            </div>
            <div v-if="aktiv === z.id" class="aufgabe__bearbeiten" @click.stop>
              <div>
                <span class="werte__label">Messbar</span>
                <textarea v-model="entwurf.messkriterium" v-wachsen class="nahtlos" rows="1" maxlength="2000" placeholder="Woran erkennen wir, dass das Ziel erreicht ist?" aria-label="Messkriterium"></textarea>
              </div>
              <div class="werkzeuge">
                <pillen-menue :text="'Bis: ' + (entwurf.termin || '–')" :leer="!entwurf.termin" panel>
                  <input v-model="entwurf.termin" class="nahtlos nahtlos--rahmen" maxlength="200" placeholder="z. B. Ende des Camps" aria-label="Zeitbezug">
                </pillen-menue>
                <pillen-menue :text="'Erreichbar: ' + (entwurf.erreichbarkeit ? 'notiert' : '–')" :leer="!entwurf.erreichbarkeit" panel>
                  <textarea v-model="entwurf.erreichbarkeit" v-wachsen class="nahtlos nahtlos--rahmen" rows="2" maxlength="2000" placeholder="Warum ist das Ziel realistisch?" aria-label="Erreichbarkeit"></textarea>
                </pillen-menue>
                <pillen-menue :text="'Relevant: ' + (entwurf.relevanz ? 'notiert' : '–')" :leer="!entwurf.relevanz" panel>
                  <textarea v-model="entwurf.relevanz" v-wachsen class="nahtlos nahtlos--rahmen" rows="2" maxlength="2000" placeholder="Warum ist das Ziel wichtig?" aria-label="Relevanz"></textarea>
                </pillen-menue>
              </div>
              <ae-alert v-if="fehler" tone="danger">{{ fehler }}</ae-alert>
              <div class="reihe reihe--verteilt"><span></span><ae-button size="sm" @click="fertig().catch(function () {})">Fertig</ae-button></div>
            </div>
          </div>
        </div>
      </div>
    </ae-card>
  `,
  data() {
    return { gruppe: null, gruppeOriginal: '', neu: '', aktiv: null, entwurf: null, original: '', fehler: '' }
  },
  computed: {
    darf() {
      return this.event.ich.recht.konzept >= 2
    },
    ziele() {
      return this.event.konzept.ziele
    },
    alterText() {
      var g = this.gruppe
      if (!g || (!g.alterVon && g.alterVon !== 0 && !g.alterBis)) return ''
      if (g.alterVon && g.alterBis) return g.alterVon + '–' + g.alterBis + ' Jahre'
      return g.alterVon ? 'ab ' + g.alterVon + ' Jahren' : 'bis ' + g.alterBis + ' Jahre'
    },
  },
  watch: {
    'event.konzept.zielgruppe': {
      immediate: true,
      handler(z) {
        if (!z) return
        this.gruppe = Object.assign({}, z)
        this.gruppeOriginal = JSON.stringify(this.gruppe)
      },
    },
  },
  methods: {
    smartStand: smartStand,
    zahl(wert) {
      return wert === '' || wert === null || wert === undefined ? null : parseInt(wert, 10)
    },
    async gruppeSpeichern() {
      if (!this.darf || JSON.stringify(this.gruppe) === this.gruppeOriginal) return
      var g = this.gruppe
      await this.eventAktion('zielgruppe_speichern', { beschreibung: g.beschreibung, alterVon: this.zahl(g.alterVon), alterBis: this.zahl(g.alterBis), anzahl: this.zahl(g.anzahl), besonderheiten: g.besonderheiten }).catch(function () {})
    },
    async anlegen() {
      var text = this.neu.trim()
      if (!text) return
      try {
        await this.eventAktion('ziel_speichern', { id: '', formulierung: text, messkriterium: '', termin: '', erreichbarkeit: '', relevanz: '' })
        this.neu = ''
        var neu = this.ziele[this.ziele.length - 1]
        if (neu) this.oeffnen(neu)
      } catch (fehler) {
        /* Meldung zeigt der Eventbereich */
      }
    },
    async oeffnen(z) {
      if (!this.darf || this.aktiv === z.id) return
      if (this.aktiv) {
        try {
          await this.fertig()
        } catch (fehler) {
          return
        }
      }
      this.fehler = ''
      this.aktiv = z.id
      this.entwurf = { formulierung: z.formulierung, messkriterium: z.messkriterium, termin: z.termin, erreichbarkeit: z.erreichbarkeit, relevanz: z.relevanz }
      this.original = JSON.stringify(this.entwurf)
    },
    async fertig() {
      if (!this.entwurf) return
      if (JSON.stringify(this.entwurf) !== this.original) {
        try {
          await this.eventAktion('ziel_speichern', Object.assign({ id: this.aktiv }, this.entwurf))
        } catch (fehler) {
          this.fehler = fehler.message
          throw fehler
        }
      }
      this.aktiv = null
      this.entwurf = null
    },
    async verschieben(z, richtung) {
      await this.eventAktion('ziel_verschieben', { id: z.id, richtung: richtung }).catch(function () {})
    },
    async loeschen(z) {
      if (!confirm('Ziel löschen? Auch seine Überprüfung geht verloren.')) return
      try {
        await this.eventAktion('ziel_loeschen', { id: z.id })
        this.aktiv = null
        this.entwurf = null
      } catch (fehler) {
        /* Meldung zeigt der Eventbereich */
      }
    },
  },
})

/* Nachbereitung: jedes Ziel überprüfen (wie, Ergebnis, Erreichungsgrad, Kommentar) und die Teamkultur auswerten */
app.component('event-reflexion', {
  props: { event: { type: Object, required: true } },
  inject: ['eventAktion'],
  template: `
    <ae-card title="Zielüberprüfung">
      <template #actions>
        <span v-if="ziele.length" class="bilanz">
          <span class="bilanz__eintrag bilanz__eintrag--erreicht">{{ bilanz.erreicht }} erreicht</span>
          <span class="bilanz__eintrag bilanz__eintrag--teilweise">{{ bilanz.teilweise }} teilweise</span>
          <span class="bilanz__eintrag bilanz__eintrag--nicht">{{ bilanz.nicht }} nicht erreicht</span>
          <span v-if="bilanz.offen" class="bilanz__eintrag">{{ bilanz.offen }} offen</span>
        </span>
      </template>
      <p v-if="!ziele.length" class="leer">Im Konzept formulierte Ziele erscheinen hier zur Überprüfung.</p>
      <div class="stapel">
        <div v-for="(z, i) in ziele" :key="z.id" class="pruefung-karte">
          <div class="aufgabe__kopf">
            <span class="ziel__nummer">{{ i + 1 }}</span>
            <div class="dehnen">
              <strong>{{ z.formulierung }}</strong>
              <span v-if="z.messkriterium" class="leise aufgabe__meta">Messbar: {{ z.messkriterium }}</span>
            </div>
            <span class="stufen" role="radiogroup" :aria-label="'Erreichungsgrad von Ziel ' + (i + 1)">
              <button v-for="g in grade" :key="g.id" type="button" role="radio" :aria-checked="p(z).grad === g.id" :disabled="!darf"
                :class="['stufe', p(z).grad === g.id ? 'stufe--aktiv stufe--' + g.id : '']" @click="gradSetzen(z, g.id)">{{ g.label }}</button>
            </span>
          </div>
          <div class="pruefung-karte__felder">
            <label v-for="f in felder" :key="f.id" class="pruefung-feld">
              <span class="werte__label">{{ f.label }}</span>
              <textarea v-if="darf" v-model="p(z)[f.id]" v-wachsen class="nahtlos" rows="1" :maxlength="f.max" :placeholder="f.platzhalter" @blur="speichern(z)"></textarea>
              <span v-else class="ablauf__text">{{ p(z)[f.id] || '–' }}</span>
            </label>
          </div>
        </div>
      </div>
    </ae-card>

    <ae-card title="Teamkultur" subtitle="Wie war das Miteinander im Team? Was nehmen wir mit?">
      <textarea v-if="darf" v-model="teamkultur" v-wachsen class="nahtlos teamkultur" rows="3" maxlength="20000" placeholder="Auswertung des Miteinanders …" aria-label="Teamkultur" @blur="teamkulturSpeichern"></textarea>
      <p v-else class="ablauf__text">{{ teamkultur || 'Noch keine Auswertung.' }}</p>
    </ae-card>
  `,
  data() {
    return {
      grade: ZIEL_GRADE,
      felder: [
        { id: 'wie', label: 'Wie wir prüfen', platzhalter: 'z. B. Umfrage, Beobachtung, Zählung', max: 2000 },
        { id: 'ergebnis', label: 'Ergebnis', platzhalter: 'Was haben wir festgestellt?', max: 5000 },
        { id: 'kommentar', label: 'Kommentar', platzhalter: 'Gründe, Erkenntnisse, nächstes Mal …', max: 5000 },
      ],
      entwuerfe: {},
      teamkultur: '',
    }
  },
  computed: {
    darf() {
      return this.event.ich.recht.reflexion >= 2
    },
    ziele() {
      return this.event.konzept.ziele.filter(function (z) { return z.pruefung })
    },
    bilanz() {
      var entwuerfe = this.entwuerfe
      var bilanz = { erreicht: 0, teilweise: 0, nicht: 0, offen: 0 }
      this.ziele.forEach(function (z) {
        var grad = (entwuerfe[z.id] || z.pruefung).grad
        bilanz[grad || 'offen']++
      })
      return bilanz
    },
  },
  watch: {
    'event.konzept': {
      immediate: true,
      handler(konzept) {
        var entwuerfe = {}
        konzept.ziele.forEach(function (z) { if (z.pruefung) entwuerfe[z.id] = Object.assign({}, z.pruefung) })
        this.entwuerfe = entwuerfe
        if (document.activeElement === null || !document.activeElement.classList.contains('teamkultur')) this.teamkultur = konzept.teamkultur || ''
      },
    },
  },
  methods: {
    p(z) {
      return this.entwuerfe[z.id]
    },
    async speichern(z) {
      var e = this.entwuerfe[z.id]
      if (JSON.stringify(e) === JSON.stringify(z.pruefung)) return
      await this.eventAktion('ziel_pruefung_speichern', Object.assign({ id: z.id }, e)).catch(function () {})
    },
    gradSetzen(z, grad) {
      var e = this.entwuerfe[z.id]
      e.grad = e.grad === grad ? '' : grad
      this.speichern(z)
    },
    async teamkulturSpeichern() {
      if (this.teamkultur === (this.event.konzept.teamkultur || '')) return
      await this.eventAktion('teamkultur_speichern', { text: this.teamkultur }).catch(function () {})
    },
  },
})

/* Persönliche Feedbacks: vertraulich, nur für die verfassende Person und wer das Recht «Feedback» hat */
app.component('event-feedback', {
  props: { event: { type: Object, required: true } },
  inject: ['eventAktion'],
  template: `
    <ae-card title="Feedback">
      <div class="stapel">
        <p class="reihe leise"><ae-icon name="lock" :size="16"></ae-icon>Vertraulich: Ihr Feedback sehen nur Sie und die Event-Leitung{{ weitere ? ' sowie Personen mit dem Recht «Feedback»' : '' }}.</p>
        <div v-if="event.ich.istMitglied" class="feedback-neu">
          <textarea v-model="neu.text" v-wachsen class="nahtlos" rows="2" maxlength="10000" placeholder="Was war gut, was nehmen wir mit, was würden Sie ändern?" aria-label="Neues Feedback"></textarea>
          <div class="reihe reihe--verteilt">
            <select v-model="neu.an" class="pille pille--auswahl" aria-label="An wen">
              <option value="">Zum ganzen Event</option>
              <option v-for="p in andere" :key="p.id" :value="p.id">An {{ p.vorname }} {{ p.name }}</option>
            </select>
            <ae-button size="sm" icon="send" :disabled="!neu.text.trim()" @click="absenden">Speichern</ae-button>
          </div>
        </div>
        <p v-if="!event.feedbacks.length" class="leer">Noch kein Feedback.</p>
        <div v-for="f in event.feedbacks" :key="f.id" :class="['feedback', aktiv === f.id ? 'aufgabe--aktiv' : '', f.recht >= 2 && aktiv !== f.id ? 'aufgabe--editierbar' : '']" @click="oeffnen(f)">
          <div class="reihe reihe--verteilt">
            <span class="klein"><strong>{{ f.eigenes ? 'Ihr Feedback' : name(f.von) }}</strong> · {{ f.an ? 'an ' + name(f.an) : 'zum Event' }}</span>
            <span class="leise">{{ zeitRelativ(f.erstelltAm) }}</span>
          </div>
          <template v-if="aktiv === f.id">
            <textarea v-model="entwurf.text" v-wachsen v-fokus class="nahtlos" rows="2" maxlength="10000" aria-label="Feedback" @click.stop></textarea>
            <div class="reihe reihe--verteilt" @click.stop>
              <select v-model="entwurf.an" class="pille pille--auswahl" aria-label="An wen">
                <option value="">Zum ganzen Event</option>
                <option v-for="p in anderePersonen(f.von)" :key="p.id" :value="p.id">An {{ p.vorname }} {{ p.name }}</option>
              </select>
              <span class="reihe">
                <pillen-menue label="Weitere Aktionen" rechts>
                  <button type="button" class="menue-eintrag menue-eintrag--gefahr" @click="loeschen(f)">Feedback löschen</button>
                </pillen-menue>
                <ae-button size="sm" @click="fertig">Fertig</ae-button>
              </span>
            </div>
          </template>
          <p v-else class="ablauf__text">{{ f.text }}</p>
        </div>
      </div>
    </ae-card>
  `,
  data() {
    return { neu: { text: '', an: '' }, aktiv: null, entwurf: null }
  },
  computed: {
    andere() {
      return this.anderePersonen(this.event.ich.personId)
    },
    weitere() {
      return this.event.ich.recht.feedback >= 1 && !this.event.ich.hatLeitungsrechte
    },
  },
  methods: {
    zeitRelativ: zeitRelativ,
    name(id) {
      var p = this.event.personen[id]
      return p ? p.vorname + ' ' + p.name : 'ehemaliges Mitglied'
    },
    anderePersonen(ausser) {
      return Object.values(this.event.personen).filter(function (p) { return p.id !== ausser }).sort(function (a, b) { return (a.vorname + a.name).localeCompare(b.vorname + b.name, 'de') })
    },
    async absenden() {
      try {
        await this.eventAktion('feedback_speichern', { id: '', an: this.neu.an, text: this.neu.text })
        this.neu = { text: '', an: '' }
      } catch (fehler) {
        /* Meldung zeigt der Eventbereich */
      }
    },
    oeffnen(f) {
      if (f.recht < 2 || this.aktiv === f.id) return
      this.aktiv = f.id
      this.entwurf = { text: f.text, an: f.an }
    },
    async fertig() {
      var f = this.event.feedbacks.find(function (x) { return x.id === this.aktiv }, this)
      if (f && (f.text !== this.entwurf.text || f.an !== this.entwurf.an)) {
        try {
          await this.eventAktion('feedback_speichern', { id: f.id, an: this.entwurf.an, text: this.entwurf.text })
        } catch (fehler) {
          return
        }
      }
      this.aktiv = null
      this.entwurf = null
    },
    async loeschen(f) {
      if (!confirm('Feedback löschen?')) return
      await this.eventAktion('feedback_loeschen', { id: f.id }).catch(function () {})
      this.aktiv = null
      this.entwurf = null
    },
  },
})
