/* App-eigene Bausteine: Bereiche und Stufen der Rechte, Rechte-Matrix, Personenauswahl */
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
