/* App-eigene Bausteine: Bereiche und Stufen der Rechte, Rechte-Matrix, Personenauswahl, Farben */
var BEREICHE = [
  { id: 'stammdaten', label: 'Event-Stammdaten' },
  { id: 'konzept', label: 'Konzept (Ziele, Zielgruppe)' },
  { id: 'personen', label: 'Personen, Teams und Rollen' },
  { id: 'programm', label: 'Programm' },
  { id: 'ablauf', label: 'Ablaufpläne' },
  { id: 'aufgaben', label: 'Aufgaben' },
  { id: 'material', label: 'Material' },
  { id: 'reflexion', label: 'Reflexion' },
  { id: 'feedback', label: 'Feedback' },
]
var STUFEN = [{ wert: 0, text: 'Keine' }, { wert: 1, text: 'Lesen' }, { wert: 2, text: 'Bearbeiten' }]

/* Rechte für das ganze Event: modelValue ist eine Liste { bereich, stufe } (fehlende Bereiche = keine) */
app.component('rechte-matrix', {
  props: {
    modelValue: { type: Array, required: true },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  template: `
    <div class="rechte">
      <div v-for="b in bereiche" :key="b.id" class="rechte__zeile">
        <span class="klein">{{ b.label }}</span>
        <span class="stufen" role="radiogroup" :aria-label="b.label">
          <button v-for="s in stufen" :key="s.wert" type="button" role="radio" :aria-checked="stufe(b.id) === s.wert"
            :class="['stufe', stufe(b.id) === s.wert ? 'stufe--aktiv' : '']" :disabled="disabled" @click="setzen(b.id, s.wert)">{{ s.text }}</button>
        </span>
      </div>
    </div>
  `,
  data() {
    return { bereiche: BEREICHE, stufen: STUFEN }
  },
  methods: {
    stufe(bereich) {
      var recht = this.modelValue.find(function (r) { return r.bereich === bereich && !r.programmpunktId })
      return recht ? recht.stufe : 0
    },
    setzen(bereich, stufe) {
      var rechte = this.modelValue.filter(function (r) { return r.bereich !== bereich || r.programmpunktId })
      if (stufe > 0) rechte.push({ bereich: bereich, stufe: stufe, programmpunktId: null })
      this.$emit('update:modelValue', rechte)
    },
  },
})

/* Mehrere Personen per Klick wählen; personen als [{ id, vorname, name, kuerzel }] */
app.component('personen-auswahl', {
  props: {
    modelValue: { type: Array, required: true },
    personen: { type: Array, required: true },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  template: `
    <div class="chips">
      <button v-for="p in personen" :key="p.id" type="button" :aria-pressed="modelValue.includes(p.id)" :disabled="disabled"
        :class="['chip', modelValue.includes(p.id) ? 'chip--aktiv' : '']" @click="umschalten(p.id)">{{ p.vorname }} {{ p.name }}<template v-if="p.kuerzel"> ({{ p.kuerzel }})</template></button>
      <span v-if="!personen.length" class="leise">Noch keine Personen im Event.</span>
    </div>
  `,
  methods: {
    umschalten(id) {
      var liste = this.modelValue.includes(id) ? this.modelValue.filter(function (x) { return x !== id }) : this.modelValue.concat([id])
      this.$emit('update:modelValue', liste)
    },
  },
})

function personenName(person) {
  if (!person) return 'Unbekannt'
  return person.vorname + ' ' + person.name + (person.kuerzel ? ' (' + person.kuerzel + ')' : '')
}

function wochentagText(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('de-CH', { weekday: 'short' })
}

function zeitraumText(start, ende) {
  return start === ende ? datumText(start + 'T12:00:00') : datumText(start + 'T12:00:00') + ' – ' + datumText(ende + 'T12:00:00')
}

/* Feste Farbpalette (wie src/events.php farben()); die Werte stehen in css/orev.css unter .farbe--* */
var FARBEN = [
  { id: 'rot', label: 'Rot' }, { id: 'orange', label: 'Orange' }, { id: 'gelb', label: 'Gelb' }, { id: 'gruen', label: 'Grün' },
  { id: 'tuerkis', label: 'Türkis' }, { id: 'blau', label: 'Blau' }, { id: 'violett', label: 'Violett' }, { id: 'rosa', label: 'Rosa' },
  { id: 'braun', label: 'Braun' }, { id: 'grau', label: 'Grau' },
]

function farbKlasse(farbe) {
  return farbe ? 'farbe--' + farbe : ''
}

app.component('farbe-auswahl', {
  props: {
    modelValue: { type: String, default: '' },
    label: { type: String, default: 'Farbe' },
    ohneText: { type: String, default: 'Keine' },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  template: `
    <div class="feld">
      <span class="klein">{{ label }}</span>
      <div class="farben" role="radiogroup" :aria-label="label">
        <button type="button" role="radio" :aria-checked="modelValue === ''" :disabled="disabled" :title="ohneText"
          :class="['farbe-wahl', 'farbe-wahl--ohne', modelValue === '' ? 'farbe-wahl--aktiv' : '']" @click="$emit('update:modelValue', '')"><span class="sr-only">{{ ohneText }}</span></button>
        <button v-for="f in farben" :key="f.id" type="button" role="radio" :aria-checked="modelValue === f.id" :disabled="disabled" :title="f.label"
          :class="['farbe-wahl', 'farbe--' + f.id, modelValue === f.id ? 'farbe-wahl--aktiv' : '']" @click="$emit('update:modelValue', f.id)"><span class="sr-only">{{ f.label }}</span></button>
      </div>
    </div>
  `,
  data() {
    return { farben: FARBEN }
  },
})

/* Kleiner Farbpunkt vor Namen von Personen und Teams */
app.component('farb-punkt', {
  props: { farbe: { type: String, default: '' } },
  template: `<span v-if="farbe" :class="['farb-punkt', 'farbe--' + farbe]" aria-hidden="true"></span>`,
})

/* Kürzel oder Vorname einer Person für enge Darstellungen (Agenda, Ablaufplan) */
function personKurz(person) {
  return person ? (person.kuerzel || person.vorname) : '?'
}

/* Farbe eines Programmpunkts: eigene Farbe, sonst die des ersten farbigen Teams, sonst der ersten farbigen Person */
function punktFarbe(punkt, event) {
  if (punkt.farbe) return punkt.farbe
  for (var i = 0; i < punkt.teams.length; i++) {
    var team = event.teams.find(function (t) { return t.id === punkt.teams[i] })
    if (team && team.farbe) return team.farbe
  }
  for (var j = 0; j < punkt.personen.length; j++) {
    var person = event.personen[punkt.personen[j]]
    if (person && person.farbe) return person.farbe
  }
  return ''
}

/* Datum plus Minuten als JJJJ-MM-TTTHH:MM (lokale Zeit, über Mitternacht hinaus) */
function zeitpunktPlus(datum, minuten) {
  var d = new Date(datum + 'T00:00:00')
  d.setMinutes(d.getMinutes() + minuten)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

function dauerText(minuten) {
  if (!minuten) return 'offen'
  var h = Math.floor(minuten / 60)
  var m = minuten % 60
  return (h ? h + ' h' : '') + (h && m ? ' ' : '') + (m ? m + ' min' : '')
}