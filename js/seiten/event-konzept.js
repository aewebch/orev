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

var BEWERTUNGEN = [{ id: 'gut', label: 'Gut' }, { id: 'mittel', label: 'Mittel' }, { id: 'schwach', label: 'Schwach' }]

/* Eine Zeile der Auswertung: Titel, Bewertung (gut, mittel, schwach) und Notiz; speichert beim Wählen und beim Verlassen */
app.component('bewertung-zeile', {
  props: {
    titel: { type: String, required: true },
    meta: { type: String, default: '' },
    wert: { type: Object, default: null },
    darf: { type: Boolean, default: false },
    platzhalter: { type: String, default: 'Notiz …' },
  },
  emits: ['speichern'],
  template: `
    <div :class="['bewertung', entwurf.bewertung ? 'bewertung--' + entwurf.bewertung : '']">
      <div class="bewertung__kopf">
        <div class="dehnen">
          <strong class="bewertung__titel">{{ titel }}</strong>
          <span v-if="meta" class="leise bewertung__meta">{{ meta }}</span>
        </div>
        <span class="stufen" role="radiogroup" :aria-label="'Bewertung ' + titel">
          <button v-for="b in stufen" :key="b.id" type="button" role="radio" :aria-checked="entwurf.bewertung === b.id" :disabled="!darf"
            :class="['stufe', entwurf.bewertung === b.id ? 'stufe--aktiv stufe--' + b.id : '']" @click="waehlen(b.id)">{{ b.label }}</button>
        </span>
      </div>
      <textarea v-if="darf" v-model="entwurf.notiz" v-wachsen class="nahtlos bewertung__notiz" rows="1" maxlength="5000" :placeholder="platzhalter" :aria-label="'Notiz ' + titel" @blur="speichern"></textarea>
      <p v-else-if="entwurf.notiz" class="ablauf__text">{{ entwurf.notiz }}</p>
    </div>
  `,
  data() {
    return { stufen: BEWERTUNGEN, entwurf: { bewertung: '', notiz: '' } }
  },
  watch: {
    wert: {
      immediate: true,
      handler(w) {
        this.entwurf = { bewertung: w ? w.bewertung : '', notiz: w ? w.notiz : '' }
      },
    },
  },
  methods: {
    waehlen(id) {
      this.entwurf.bewertung = this.entwurf.bewertung === id ? '' : id
      this.speichern()
    },
    speichern() {
      var alt = this.wert || { bewertung: '', notiz: '' }
      if (alt.bewertung === this.entwurf.bewertung && alt.notiz === this.entwurf.notiz) return
      this.$emit('speichern', Object.assign({}, this.entwurf))
    },
  },
})

/* Nachbereitung: Ziele überprüfen, Ort, Tage und Programmpunkte bewerten, Teamkultur auswerten */
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

    <ae-card v-if="bewertungen" title="Ort und Unterkunft">
      <bewertung-zeile :titel="event.ort || 'Ort'" meta="Lage, Unterkunft, Infrastruktur, Verpflegung" :wert="bewertungen.ort" :darf="darf"
        platzhalter="Was hat gepasst, was fehlte? Würden wir wieder hierher gehen?" @speichern="bewerten('ort', '', $event)"></bewertung-zeile>
    </ae-card>

    <ae-card v-if="bewertungen" title="Programmtage">
      <template #actions><span class="bilanz"><span v-for="b in bilanzVon(bewertungen.tage)" :key="b.id" :class="['bilanz__eintrag', 'bilanz__eintrag--' + b.id]">{{ b.anzahl }} {{ b.label.toLowerCase() }}</span></span></template>
      <div class="stapel stapel--eng">
        <bewertung-zeile v-for="t in event.tage" :key="t.datum" :titel="wochentagText(t.datum) + ' ' + datumText(t.datum + 'T12:00:00')" :meta="tagMeta(t)"
          :wert="bewertungen.tage[t.datum]" :darf="darf" platzhalter="Stimmung, Energie, was an diesem Tag auffiel …" @speichern="bewerten('tag', t.datum, $event)"></bewertung-zeile>
      </div>
    </ae-card>

    <ae-card v-if="bewertungen" title="Programmpunkte">
      <template #actions><span class="bilanz"><span v-for="b in bilanzVon(bewertungen.punkte)" :key="b.id" :class="['bilanz__eintrag', 'bilanz__eintrag--' + b.id]">{{ b.anzahl }} {{ b.label.toLowerCase() }}</span></span></template>
      <p v-if="!punkteNachTag.length" class="leer">Noch keine Programmpunkte.</p>
      <div class="stapel stapel--eng">
        <details v-for="g in punkteNachTag" :key="g.schluessel" class="bewertung-gruppe" :open="offeneGruppen[g.schluessel] !== undefined ? offeneGruppen[g.schluessel] : g.offen" @toggle="offeneGruppen[g.schluessel] = $event.target.open">
          <summary class="bewertung-gruppe__kopf">
            <strong class="dehnen">{{ g.titel }}</strong>
            <span class="leise">{{ g.bewertet }} von {{ g.punkte.length }} bewertet</span>
          </summary>
          <div class="stapel stapel--eng">
            <bewertung-zeile v-for="p in g.punkte" :key="p.id" :titel="p.titel" :meta="p.start.slice(11) + (p.ende ? '–' + p.ende.slice(11) : '') + (p.ort ? ' · ' + p.ort : '')"
              :wert="bewertungen.punkte[p.id]" :darf="darf" platzhalter="Wie ist es gelaufen? Was ändern wir?" @speichern="bewerten('punkt', p.id, $event)"></bewertung-zeile>
          </div>
        </details>
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
      offeneGruppen: {},
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
    bewertungen() {
      return this.event.konzept.bewertungen
    },
    /* Programmpunkte nach Tagen; Vorbereitung (z. B. Elternabend) als eigene Gruppe. Offen ist der erste Tag mit Unbewertetem. */
    punkteNachTag() {
      var bewertungen = this.bewertungen ? this.bewertungen.punkte : {}
      var gruppen = []
      var vorbereitung = { schluessel: 'vorbereitung', titel: 'Vorbereitung', punkte: [] }
      var nachDatum = {}
      this.event.programmpunkte.forEach(function (p) {
        if (p.phase === 'vorbereitung') {
          vorbereitung.punkte.push(p)
          return
        }
        var datum = p.start.slice(0, 10)
        if (!nachDatum[datum]) {
          nachDatum[datum] = { schluessel: datum, titel: wochentagText(datum) + ' ' + datumText(datum + 'T12:00:00'), punkte: [] }
          gruppen.push(nachDatum[datum])
        }
        nachDatum[datum].punkte.push(p)
      })
      if (vorbereitung.punkte.length) gruppen.unshift(vorbereitung)
      var offenGesetzt = false
      gruppen.forEach(function (g) {
        g.bewertet = g.punkte.filter(function (p) { return bewertungen[p.id] && bewertungen[p.id].bewertung }).length
        g.offen = !offenGesetzt && g.bewertet < g.punkte.length
        if (g.offen) offenGesetzt = true
      })
      return gruppen
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
    wochentagText: wochentagText,
    datumText: datumText,
    tagMeta(t) {
      var personen = this.event.personen
      var tv = t.verantwortliche.map(function (id) { return personKurz(personen[id]) }).join(', ')
      return [t.thema, tv ? 'TV: ' + tv : ''].filter(Boolean).join(' · ')
    },
    bilanzVon(eintraege) {
      var werte = Object.values(eintraege || {})
      return BEWERTUNGEN.map(function (b) {
        return { id: b.id, label: b.label, anzahl: werte.filter(function (w) { return w.bewertung === b.id }).length }
      }).filter(function (b) { return b.anzahl })
    },
    async bewerten(art, schluessel, wert) {
      await this.eventAktion('bewertung_speichern', { art: art, schluessel: schluessel, bewertung: wert.bewertung, notiz: wert.notiz }).catch(function () {})
    },
    async teamkulturSpeichern() {
      if (this.teamkultur === (this.event.konzept.teamkultur || '')) return
      await this.eventAktion('teamkultur_speichern', { text: this.teamkultur }).catch(function () {})
    },
  },
})

/* Persönliche Feedbacks nach der Fünf-Finger-Methode. Vertraulich: nur für die verfassende Person und wer das Recht
   «Feedback» hat (Event-Leitung immer). Wer mehrere Feedbacks sieht, kann sie auch nach Fingern gebündelt lesen. */
var FEEDBACK_FINGER = [
  { id: 'daumen', nummer: 1, name: 'Daumen', frage: 'Was fand ich gut?', farbe: 'gruen' },
  { id: 'zeigefinger', nummer: 2, name: 'Zeigefinger', frage: 'Das merke ich mir', farbe: 'blau' },
  { id: 'mittelfinger', nummer: 3, name: 'Mittelfinger', frage: 'Das würde ich ändern (fand ich nicht so gut)', farbe: 'rot' },
  { id: 'ringfinger', nummer: 4, name: 'Ringfinger', frage: 'Das ging mir nahe', farbe: 'rosa' },
  { id: 'kleinerfinger', nummer: 5, name: 'Kleiner Finger', frage: 'Das kam mir zu kurz', farbe: 'orange' },
]

function fingerLeer() {
  var leer = {}
  FEEDBACK_FINGER.forEach(function (f) { leer[f.id] = '' })
  return leer
}

/* Fünf Fragen als nahtlose Felder mit Finger-Marke */
app.component('finger-eingabe', {
  props: { modelValue: { type: Object, required: true } },
  emits: ['update:modelValue'],
  template: `
    <div class="finger-liste">
      <label v-for="f in finger" :key="f.id" :class="['finger', 'farbe--' + f.farbe]">
        <span class="finger__marke" :title="f.name">{{ f.nummer }}</span>
        <span class="finger__inhalt">
          <span class="finger__frage"><strong>{{ f.name }}</strong> · {{ f.frage }}</span>
          <textarea v-wachsen class="nahtlos" rows="1" maxlength="5000" :value="modelValue[f.id]" :placeholder="platzhalter[f.id]" :aria-label="f.name + ': ' + f.frage" @input="setzen(f.id, $event.target.value)"></textarea>
        </span>
      </label>
    </div>
  `,
  data() {
    return {
      finger: FEEDBACK_FINGER,
      platzhalter: {
        daumen: 'Was hat mir gefallen, was hat gut funktioniert?',
        zeigefinger: 'Was nehme ich für mich oder fürs nächste Mal mit?',
        mittelfinger: 'Was lief nicht gut, was würde ich anders machen?',
        ringfinger: 'Welcher Moment hat mich berührt, gefreut, geärgert oder bewegt?',
        kleinerfinger: 'Wofür blieb zu wenig Zeit oder Aufmerksamkeit?',
      },
    }
  },
  methods: {
    setzen(id, wert) {
      var neu = Object.assign({}, this.modelValue)
      neu[id] = wert
      this.$emit('update:modelValue', neu)
    },
  },
})

app.component('event-feedback', {
  props: { event: { type: Object, required: true } },
  inject: ['eventAktion'],
  template: `
    <ae-card title="Feedback" subtitle="Fünf-Finger-Reflexion: Beantworten Sie die Fragen, die Ihnen etwas sagen. Keine ist Pflicht.">
      <template v-if="mehrere" #actions>
        <span class="stufen" role="radiogroup" aria-label="Ansicht">
          <button v-for="a in ansichten" :key="a.id" type="button" role="radio" :aria-checked="ansicht === a.id" :class="['stufe', ansicht === a.id ? 'stufe--aktiv' : '']" @click="ansicht = a.id">{{ a.label }}</button>
        </span>
      </template>
      <div class="stapel">
        <p class="hinweis-zeile leise"><ae-icon name="lock" :size="16"></ae-icon>Vertraulich: Ihr Feedback sehen nur Sie und die Event-Leitung{{ weitere ? ' sowie Personen mit dem Recht «Feedback»' : '' }}.</p>

        <template v-if="ansicht === 'eintraege'">
          <div v-if="event.ich.istMitglied">
            <button v-if="!schreiben" type="button" class="neue-zeile neue-zeile--knopf" @click="schreiben = true"><ae-icon name="message-square" :size="18"></ae-icon>Feedback schreiben</button>
            <div v-else class="feedback-neu">
              <finger-eingabe v-model="neu.finger"></finger-eingabe>
              <div class="reihe reihe--verteilt">
                <select v-model="neu.an" class="pille pille--auswahl" aria-label="An wen">
                  <option value="">Zum ganzen Event</option>
                  <option v-for="p in andere" :key="p.id" :value="p.id">An {{ p.vorname }} {{ p.name }}</option>
                </select>
                <span class="reihe">
                  <ae-button variant="tertiary" size="sm" @click="schreiben = false">Abbrechen</ae-button>
                  <ae-button size="sm" icon="send" :disabled="!hatInhalt(neu.finger)" @click="absenden">Speichern</ae-button>
                </span>
              </div>
            </div>
          </div>

          <p v-if="!event.feedbacks.length" class="leer">Noch kein Feedback.</p>
          <div v-for="f in event.feedbacks" :key="f.id" :class="['feedback', aktiv === f.id ? 'aufgabe--aktiv' : '', f.recht >= 2 && aktiv !== f.id ? 'aufgabe--editierbar' : '']" @click="oeffnen(f)">
            <div class="reihe reihe--verteilt">
              <span class="klein"><strong>{{ f.eigenes ? 'Ihr Feedback' : name(f.von) }}</strong> · {{ f.an ? 'an ' + name(f.an) : 'zum Event' }}</span>
              <span class="leise">{{ zeitRelativ(f.erstelltAm) }}</span>
            </div>
            <template v-if="aktiv === f.id">
              <div @click.stop><finger-eingabe v-model="entwurf.finger"></finger-eingabe></div>
              <textarea v-if="entwurf.text" v-model="entwurf.text" v-wachsen class="nahtlos" rows="2" maxlength="10000" aria-label="Früheres Feedback" @click.stop></textarea>
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
            <template v-else>
              <div v-for="fi in beantwortet(f)" :key="fi.id" :class="['finger', 'finger--lesen', 'farbe--' + fi.farbe]">
                <span class="finger__marke" :title="fi.name">{{ fi.nummer }}</span>
                <span class="finger__inhalt"><span class="finger__frage"><strong>{{ fi.name }}</strong> · {{ fi.frage }}</span><span class="ablauf__text">{{ f.finger[fi.id] }}</span></span>
              </div>
              <p v-if="f.text" class="ablauf__text">{{ f.text }}</p>
            </template>
          </div>
        </template>

        <div v-else class="stapel">
          <section v-for="fi in finger" :key="fi.id" :class="['finger-gruppe', 'farbe--' + fi.farbe]">
            <h4 class="finger-gruppe__titel"><span class="finger__marke">{{ fi.nummer }}</span><span class="dehnen">{{ fi.name }} · {{ fi.frage }}</span><span class="leise">{{ antworten(fi.id).length }}</span></h4>
            <p v-if="!antworten(fi.id).length" class="leise">Keine Antworten.</p>
            <blockquote v-for="a in antworten(fi.id)" :key="a.id" class="finger-gruppe__antwort">
              <span class="ablauf__text">{{ a.text }}</span>
              <span class="leise">{{ a.eigenes ? 'Sie' : name(a.von) }}{{ a.an ? ' an ' + name(a.an) : '' }}</span>
            </blockquote>
          </section>
        </div>
      </div>
    </ae-card>
  `,
  data() {
    return {
      finger: FEEDBACK_FINGER,
      ansichten: [{ id: 'eintraege', label: 'Einträge' }, { id: 'finger', label: 'Nach Fingern' }],
      ansicht: 'eintraege',
      schreiben: false,
      neu: { finger: fingerLeer(), an: '' },
      aktiv: null,
      entwurf: null,
      original: '',
    }
  },
  created() {
    this.schreiben = this.event.ich.istMitglied && !this.event.feedbacks.some(function (f) { return f.eigenes })
  },
  computed: {
    andere() {
      return this.anderePersonen(this.event.ich.personId)
    },
    weitere() {
      return this.event.ich.recht.feedback >= 1 && !this.event.ich.hatLeitungsrechte
    },
    /* Die Auswertung nach Fingern lohnt sich, sobald man Feedbacks anderer sieht */
    mehrere() {
      return this.event.feedbacks.some(function (f) { return !f.eigenes })
    },
  },
  methods: {
    zeitRelativ: zeitRelativ,
    hatInhalt(finger) {
      return Object.values(finger).some(function (t) { return t.trim() })
    },
    beantwortet(f) {
      return FEEDBACK_FINGER.filter(function (fi) { return f.finger[fi.id] })
    },
    antworten(fingerId) {
      return this.event.feedbacks.filter(function (f) { return f.finger[fingerId] }).map(function (f) {
        return { id: f.id, text: f.finger[fingerId], von: f.von, an: f.an, eigenes: f.eigenes }
      })
    },
    name(id) {
      var p = this.event.personen[id]
      return p ? p.vorname + ' ' + p.name : 'ehemaliges Mitglied'
    },
    anderePersonen(ausser) {
      return Object.values(this.event.personen).filter(function (p) { return p.id !== ausser }).sort(function (a, b) { return (a.vorname + a.name).localeCompare(b.vorname + b.name, 'de') })
    },
    async absenden() {
      try {
        await this.eventAktion('feedback_speichern', { id: '', an: this.neu.an, text: '', finger: this.neu.finger })
        this.neu = { finger: fingerLeer(), an: '' }
        this.schreiben = false
      } catch (fehler) {
        /* Meldung zeigt der Eventbereich */
      }
    },
    oeffnen(f) {
      if (f.recht < 2 || this.aktiv === f.id) return
      this.aktiv = f.id
      this.entwurf = { finger: Object.assign({}, f.finger), text: f.text, an: f.an }
      this.original = JSON.stringify(this.entwurf)
    },
    async fertig() {
      if (JSON.stringify(this.entwurf) !== this.original) {
        try {
          await this.eventAktion('feedback_speichern', { id: this.aktiv, an: this.entwurf.an, text: this.entwurf.text, finger: this.entwurf.finger })
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
