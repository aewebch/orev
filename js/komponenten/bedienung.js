/* Bedienmuster für die Bearbeitung direkt im Inhalt (wie in Ormeet): schlanke Pillen öffnen Menüs oder Panels
   mit weiteren Einstellungen, «⋮» sammelt seltene Aktionen, Textfelder wachsen mit dem Inhalt. */

/* Pille oder «⋮»-Knopf mit Menü. Mit panel bleibt das Menü bei Klicks darin offen (Formularfelder). */
app.component('pillen-menue', {
  props: {
    text: { type: String, default: '' },
    icon: { type: String, default: 'ellipsis-vertical' },
    label: { type: String, default: 'Weitere Aktionen' },
    panel: { type: Boolean, default: false },
    rechts: { type: Boolean, default: false },
    leer: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  template: `
    <div ref="wurzel" class="aufklapp">
      <button v-if="text" type="button" :class="['pille', offen ? 'pille--offen' : '', leer ? 'pille--leer' : '']" :disabled="disabled" :aria-expanded="offen" @click="offen = !offen">
        <span class="pille__text">{{ text }}</span><ae-icon name="chevron-down" :size="14"></ae-icon>
      </button>
      <button v-else type="button" class="knopf-rund" :aria-label="label" :title="label" :disabled="disabled" :aria-expanded="offen" @click="offen = !offen"><ae-icon :name="icon" :size="18"></ae-icon></button>
      <div v-if="offen" :class="['aufklapp__menue', panel ? 'aufklapp__menue--panel' : '', rechts ? 'aufklapp__menue--rechts' : '']" @click="panel || (offen = false)">
        <slot></slot>
      </div>
    </div>
  `,
  data() {
    return { offen: false }
  },
  watch: {
    offen(neu) {
      this.$emit(neu ? 'offen' : 'zu')
    },
  },
  emits: ['offen', 'zu'],
  mounted() {
    document.addEventListener('click', this.aussen, true)
    document.addEventListener('keydown', this.taste)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.aussen, true)
    document.removeEventListener('keydown', this.taste)
  },
  methods: {
    aussen(ereignis) {
      if (this.offen && !this.$refs.wurzel.contains(ereignis.target)) this.offen = false
    },
    taste(ereignis) {
      if (ereignis.key === 'Escape') this.offen = false
    },
    schliessen() {
      this.offen = false
    },
  },
})

/* Textfeld wächst mit dem Inhalt (v-wachsen) */
function textfeldAnpassen(feld) {
  feld.style.height = 'auto'
  feld.style.height = feld.scrollHeight + 'px'
}
app.directive('wachsen', {
  mounted(feld) {
    textfeldAnpassen(feld)
    feld.addEventListener('input', function () { textfeldAnpassen(feld) })
  },
  updated(feld) {
    textfeldAnpassen(feld)
  },
})

/* Setzt beim Einblenden den Fokus (v-fokus) */
app.directive('fokus', {
  mounted(feld) {
    feld.focus()
  },
})

/* Kurzer Text für Zuständige: «Alle, MaH, Team Küche · sonst EbA» */
function zuweisungText(event, wer) {
  var teile = wer.alle ? ['Alle'] : []
  teile = teile.concat(wer.personen.map(function (id) { return personKurz(event.personen[id]) }))
  teile = teile.concat(event.teams.filter(function (t) { return wer.teams.includes(t.id) }).map(function (t) { return 'Team ' + t.name }))
  return [teile.join(', '), wer.zusatz || ''].filter(Boolean).join(' · ')
}

/* Pille für Zuständige (Personen, Teams, optional «Alle» und Freitext). modelValue: { personen, teams, alle, zusatz } */
app.component('zuweisung-pille', {
  props: {
    modelValue: { type: Object, required: true },
    event: { type: Object, required: true },
    label: { type: String, default: 'Wer' },
    mitAlle: { type: Boolean, default: false },
    mitZusatz: { type: Boolean, default: false },
    nurPersonen: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue', 'zu'],
  template: `
    <pillen-menue :text="label + ': ' + (text || '–')" :leer="!text" panel :disabled="disabled" @zu="$emit('zu')">
      <div class="stapel stapel--eng">
        <label v-if="mitAlle" class="auswahl-zeile"><input type="checkbox" :checked="modelValue.alle" @change="setzen('alle', $event.target.checked)"> Alle</label>
        <span class="aufklapp__titel">Personen</span>
        <div class="chips">
          <button v-for="p in personen" :key="p.id" type="button" :class="['chip', modelValue.personen.includes(p.id) ? 'chip--aktiv' : '']" @click="umschalten('personen', p.id)"><farb-punkt :farbe="p.farbe"></farb-punkt>{{ p.vorname }} {{ p.name }}</button>
          <span v-if="!personen.length" class="leise">Noch keine Personen im Event.</span>
        </div>
        <template v-if="!nurPersonen && event.teams.length">
          <span class="aufklapp__titel">Teams</span>
          <div class="chips">
            <button v-for="t in event.teams" :key="t.id" type="button" :class="['chip', modelValue.teams.includes(t.id) ? 'chip--aktiv' : '']" @click="umschalten('teams', t.id)"><farb-punkt :farbe="t.farbe"></farb-punkt>{{ t.name }}</button>
          </div>
        </template>
        <input v-if="mitZusatz" class="nahtlos nahtlos--rahmen" :value="modelValue.zusatz" maxlength="200" placeholder="Zusatz, z. B. «sonst EbA»" @input="setzen('zusatz', $event.target.value)">
      </div>
    </pillen-menue>
  `,
  computed: {
    personen() {
      return Object.values(this.event.personen).sort(function (a, b) { return (a.vorname + a.name).localeCompare(b.vorname + b.name, 'de') })
    },
    text() {
      return zuweisungText(this.event, Object.assign({ personen: [], teams: [], alle: false, zusatz: '' }, this.modelValue))
    },
  },
  methods: {
    setzen(feld, wert) {
      var neu = Object.assign({}, this.modelValue)
      neu[feld] = wert
      this.$emit('update:modelValue', neu)
    },
    umschalten(feld, id) {
      var liste = this.modelValue[feld].includes(id) ? this.modelValue[feld].filter(function (x) { return x !== id }) : this.modelValue[feld].concat([id])
      this.setzen(feld, liste)
    },
  },
})

/* Kurze relative Zeitangabe: «vor 5 Min.», «gestern», sonst Datum */
function zeitRelativ(iso) {
  var zeit = new Date(iso)
  var sekunden = Math.round((Date.now() - zeit.getTime()) / 1000)
  if (sekunden < 60) return 'gerade eben'
  if (sekunden < 3600) return 'vor ' + Math.floor(sekunden / 60) + ' Min.'
  if (sekunden < 86400) return 'vor ' + Math.floor(sekunden / 3600) + ' Std.'
  if (sekunden < 172800) return 'gestern'
  return zeit.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
