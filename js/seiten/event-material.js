/* Material und Aufgaben dort, wo sie entstehen (Programmpunkt, Ablaufschritt, Aufgabe), sowie die Gesamtliste.
   Posten erscheinen als Pillen; ein Klick öffnet ein kleines Panel für Menge, Einheit, wer es mitnimmt und Notiz.
   Neue Posten entstehen durch Tippen und Enter («2 Flipchart» ergibt Menge 2). */

function zielPasst(ziel, art, id) {
  if (ziel.art !== art) return false
  if (art === 'programmpunkt') return ziel.punktId === id
  if (art === 'schritt') return ziel.schrittId === id
  if (art === 'aufgabe') return ziel.aufgabeId === id
  return true
}

/* «2 Flipchart» → { menge: 2, name: 'Flipchart' }; «0,5 kg Mehl» → Menge 0.5, Name «kg Mehl» (Einheit im Panel) */
function materialEingabe(text) {
  var teile = text.trim().match(/^(\d+(?:[.,]\d+)?)\s*[x×]?\s+(.+)$/)
  if (!teile) return { menge: 1, name: text.trim() }
  return { menge: parseFloat(teile[1].replace(',', '.')), name: teile[2].trim() }
}

function mengeAnzeige(menge, einheit) {
  return String(menge).replace('.', ',') + (einheit ? ' ' + einheit : ' ×')
}

app.component('material-liste', {
  props: {
    event: { type: Object, required: true },
    art: { type: String, required: true },
    zielId: { type: String, required: true },
    punktId: { type: String, default: '' },
    darf: { type: Boolean, default: false },
  },
  inject: ['eventAktion'],
  template: `
    <div class="material-liste">
      <pillen-menue v-for="p in posten" :key="p.id" :text="mengeAnzeige(p.menge, p.einheit) + ' ' + p.name + (p.halter ? ' · ' + kurz(p.halter) : '')" panel :disabled="false" @zu="speichern(p)" @offen="bearbeiten(p)">
        <div v-if="entwurf && entwurf.id === p.id" class="stapel stapel--eng material-panel">
          <input v-model="entwurf.name" class="nahtlos nahtlos--rahmen" maxlength="120" :disabled="!darfPosten(p)" :list="listenId" aria-label="Name">
          <div class="reihe">
            <input v-model.number="entwurf.menge" class="nahtlos nahtlos--rahmen nahtlos--kurz" type="number" min="0.001" step="any" :disabled="!darfPosten(p)" aria-label="Menge">
            <input v-model="entwurf.einheit" class="nahtlos nahtlos--rahmen nahtlos--kurz" maxlength="30" placeholder="Einheit" :disabled="!darfPosten(p)" aria-label="Einheit">
          </div>
          <select v-model="entwurf.halter" class="pille pille--auswahl" :disabled="!darfPosten(p)" aria-label="Wer nimmt es mit">
            <option value="">Nimmt mit: noch offen</option>
            <option v-for="person in personen" :key="person.id" :value="person.id">Nimmt mit: {{ person.vorname }} {{ person.name }}</option>
          </select>
          <input v-model="entwurf.notiz" class="nahtlos nahtlos--rahmen" maxlength="500" placeholder="Notiz, z. B. «liegt im Keller»" :disabled="!darfPosten(p)" aria-label="Notiz">
          <button v-if="darfPosten(p)" type="button" class="menue-eintrag menue-eintrag--gefahr" @click="loeschen(p)">Entfernen</button>
        </div>
      </pillen-menue>
      <input v-if="darf" v-model="neu" class="nahtlos material-liste__neu" :list="listenId" placeholder="+ Material" aria-label="Material hinzufügen" @keydown.enter.prevent="hinzufuegen">
      <span v-if="!darf && !posten.length" class="leise">–</span>
      <datalist v-if="darf" :id="listenId"><option v-for="n in namen" :key="n" :value="n"></option></datalist>
    </div>
  `,
  data() {
    return { neu: '', entwurf: null }
  },
  computed: {
    listenId() {
      return 'material-namen-' + this.zielId
    },
    posten() {
      var art = this.art
      var id = this.zielId
      return this.event.material.filter(function (p) { return zielPasst(p.ziel, art, id) })
    },
    personen() {
      return Object.values(this.event.personen).sort(function (a, b) { return (a.vorname + a.name).localeCompare(b.vorname + b.name, 'de') })
    },
    namen() {
      var gesehen = {}
      return this.event.material.map(function (p) { return p.name }).filter(function (n) {
        var k = n.trim().toLowerCase()
        if (gesehen[k]) return false
        gesehen[k] = true
        return true
      }).sort(function (a, b) { return a.localeCompare(b, 'de') })
    },
  },
  methods: {
    mengeAnzeige: mengeAnzeige,
    kurz(id) {
      return personKurz(this.event.personen[id])
    },
    darfPosten(p) {
      return p.recht >= 2
    },
    ziel() {
      return { art: this.art, punktId: this.art === 'aufgabe' ? '' : this.punktId, schrittId: this.art === 'schritt' ? this.zielId : '', aufgabeId: this.art === 'aufgabe' ? this.zielId : '' }
    },
    bearbeiten(p) {
      this.entwurf = { id: p.id, name: p.name, menge: p.menge, einheit: p.einheit, halter: p.halter, notiz: p.notiz }
    },
    async speichern(p) {
      var e = this.entwurf
      this.entwurf = null
      if (!e || !this.darfPosten(p)) return
      if (e.name === p.name && e.menge === p.menge && e.einheit === p.einheit && e.halter === p.halter && e.notiz === p.notiz) return
      if (!e.name.trim() || !(e.menge > 0)) return
      await this.eventAktion('material_speichern', Object.assign({}, e, { ziel: this.ziel() })).catch(function () {})
    },
    async hinzufuegen() {
      var eingabe = materialEingabe(this.neu)
      if (!eingabe.name) return
      try {
        await this.eventAktion('material_speichern', { id: '', name: eingabe.name, menge: eingabe.menge, einheit: '', halter: '', notiz: '', ziel: this.ziel() })
        this.neu = ''
      } catch (fehler) {
        /* Meldung zeigt der Eventbereich */
      }
    },
    async loeschen(p) {
      this.entwurf = null
      await this.eventAktion('material_loeschen', { id: p.id }).catch(function () {})
    },
  },
})

/* Aufgaben, die an einem Programmpunkt oder Ablaufschritt hängen: abhaken, öffnen, neu erfassen per Enter */
app.component('aufgaben-kurz', {
  props: {
    event: { type: Object, required: true },
    art: { type: String, required: true },
    zielId: { type: String, required: true },
    punktId: { type: String, default: '' },
    darf: { type: Boolean, default: false },
  },
  inject: ['eventAktion'],
  template: `
    <div class="aufgaben-kurz">
      <div v-for="a in aufgaben" :key="a.id" :class="['aufgaben-kurz__eintrag', a.status === 'erledigt' ? 'aufgabe-zeile--erledigt' : '']">
        <button type="button" class="haken haken--klein" :disabled="!a.darfStatus" :aria-label="a.status === 'erledigt' ? 'Wieder öffnen' : 'Als erledigt markieren'" @click="umschalten(a)"><ae-icon :name="a.status === 'erledigt' ? 'circle-check' : 'circle'" :size="16"></ae-icon></button>
        <router-link :to="'/event/' + event.id + '/aufgaben/' + a.id">{{ a.titel }}</router-link>
        <span v-if="a.personen.length || a.teams.length" class="leise">{{ zuweisungText(event, { personen: a.personen, teams: a.teams, alle: false, zusatz: '' }) }}</span>
      </div>
      <input v-if="darf" v-model="neu" class="nahtlos aufgaben-kurz__neu" maxlength="200" placeholder="+ Aufgabe" aria-label="Aufgabe hinzufügen" @keydown.enter.prevent="hinzufuegen">
    </div>
  `,
  data() {
    return { neu: '' }
  },
  computed: {
    aufgaben() {
      var art = this.art
      var id = this.zielId
      return this.event.aufgaben.filter(function (a) { return zielPasst(a.ziel, art, id) })
    },
  },
  methods: {
    zuweisungText: zuweisungText,
    async umschalten(a) {
      await this.eventAktion('aufgabe_status', { id: a.id, erledigt: a.status !== 'erledigt' }).catch(function () {})
    },
    async hinzufuegen() {
      if (!this.neu.trim()) return
      try {
        await this.eventAktion('aufgabe_speichern', {
          id: '', titel: this.neu.trim(), beschreibung: '', faellig: '', personen: [], teams: [], termine: [],
          ziel: { art: this.art, punktId: this.punktId, schrittId: this.art === 'schritt' ? this.zielId : '' },
        })
        this.neu = ''
      } catch (fehler) {
        /* Meldung zeigt der Eventbereich */
      }
    },
  },
})

/* Gesamtliste: gleiche Namen und Einheiten zusammengeführt, Mengen summiert, aufgeschlüsselt nach Haltern.
   Filter nach Halter und Programmpunkt rechnet der Server. Druckfreundlich. */
app.component('event-material', {
  props: { event: { type: Object, required: true } },
  inject: ['eventAktion'],
  template: `
    <ae-card>
      <div class="stapel">
        <div class="werkzeuge">
          <div>
            <h3 class="ae-card__title">Material</h3>
            <p class="leise">Erfasst wird Material dort, wo es gebraucht wird: im Ablaufplan oder bei einer Aufgabe.</p>
          </div>
          <span class="dehnen"></span>
          <hilfe-punkt thema="material" class="nicht-drucken"></hilfe-punkt>
          <ae-icon-button label="Drucken" variant="flat" class="nicht-drucken" @click="drucken"><ae-icon name="printer" :size="18"></ae-icon></ae-icon-button>
        </div>
        <div class="werkzeuge nicht-drucken">
          <select v-model="halter" class="pille pille--auswahl" aria-label="Wer nimmt mit">
            <option value="">Wer: alle</option>
            <option value="ohne">Wer: noch offen</option>
            <option v-for="p in personen" :key="p.id" :value="p.id">Wer: {{ p.vorname }} {{ p.name }}</option>
          </select>
          <select v-model="punktId" class="pille pille--auswahl" aria-label="Programmpunkt">
            <option value="">Programmpunkt: alle</option>
            <option v-for="p in event.programmpunkte" :key="p.id" :value="p.id">{{ wochentagText(p.start.slice(0, 10)) }} {{ p.start.slice(8, 10) }}.{{ p.start.slice(5, 7) }}. {{ p.start.slice(11) }} · {{ p.titel }}</option>
          </select>
        </div>
        <p v-if="liste && !liste.length" class="leer">Kein Material{{ halter || punktId ? ' für diese Auswahl' : '' }}.</p>
        <div v-if="liste && liste.length" class="material-tabelle" role="table" aria-label="Materialliste">
          <div class="material-tabelle__zeile material-tabelle__zeile--kopf" role="row">
            <span role="columnheader">Menge</span><span role="columnheader">Material</span><span role="columnheader">Wer nimmt mit</span><span role="columnheader">Notizen</span><span role="columnheader">Woher</span>
          </div>
          <div v-for="z in liste" :key="z.name + '|' + z.einheit" class="material-tabelle__zeile" role="row">
            <span class="material-tabelle__menge" role="cell">{{ mengeAnzeige(z.menge, z.einheit) }}</span>
            <strong role="cell">{{ z.name }}</strong>
            <span role="cell">{{ halterText(z) }}</span>
            <span role="cell" class="leise">{{ z.notizen.join('; ') }}</span>
            <span role="cell" class="material-tabelle__quellen">
              <router-link v-for="(q, i) in z.quellen" :key="i" :to="quelleLink(q)">{{ q.titel }}</router-link>
            </span>
          </div>
        </div>
      </div>
    </ae-card>
  `,
  data() {
    return { halter: '', punktId: '', liste: null }
  },
  computed: {
    personen() {
      return Object.values(this.event.personen).sort(function (a, b) { return (a.vorname + a.name).localeCompare(b.vorname + b.name, 'de') })
    },
  },
  watch: {
    halter: 'laden',
    punktId: 'laden',
    'event.material': { handler: 'laden', immediate: true },
  },
  methods: {
    wochentagText: wochentagText,
    mengeAnzeige: mengeAnzeige,
    async laden() {
      if (!this.halter && !this.punktId) {
        this.liste = this.event.materialGesamt
        return
      }
      this.liste = (await this.eventAktion('material_gesamtliste', { halter: this.halter, punktId: this.punktId }).catch(function () { return { liste: [] } })).liste
    },
    halterText(z) {
      var personen = this.event.personen
      return z.halter.map(function (h) { return (h.personId ? personKurz(personen[h.personId]) : 'noch offen') + ': ' + String(h.menge).replace('.', ',') }).join(', ')
    },
    quelleLink(q) {
      if (q.art === 'aufgabe') return '/event/' + this.event.id + '/aufgaben/' + q.aufgabeId
      return '/event/' + this.event.id + '/ablauf/' + q.punktId
    },
    drucken() {
      window.print()
    },
  },
})
