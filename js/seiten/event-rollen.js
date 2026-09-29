/* Rollen des Events mit ihren Rechten. Anlegen, ändern und löschen darf die Event-Leitung. */
app.component('event-rollen', {
  props: { event: { type: Object, required: true } },
  inject: ['eventAktion'],
  template: `
    <ae-card title="Rollen" subtitle="Eine Person kann mehrere Rollen haben; es gilt jeweils das höchste Recht.">
      <template v-if="darf" #actions><ae-button variant="secondary" icon="plus" @click="oeffnen(null)">Rolle anlegen</ae-button></template>
      <ae-card-row v-for="r in event.rollen" :key="r.id" :title="r.name" :meta="rolleMeta(r)" interaktiv @click="oeffnen(r)">
        <template #leading><ae-avatar :name="r.name" :size="40"></ae-avatar></template>
        <template #trailing><ae-badge color="neutral">{{ anzahl(r) }}</ae-badge></template>
      </ae-card-row>
    </ae-card>

    <ae-modal v-if="rolle" :title="rolle.id ? rolle.name : 'Rolle anlegen'" :width="640" @schliessen="rolle = null">
      <form id="rolle-formular" class="formular" @submit.prevent="speichern">
        <ae-input v-model="rolle.name" label="Name" required maxlength="80" :disabled="!darf" placeholder="z. B. Küche"></ae-input>
        <ae-alert v-if="rolle.istEventLeitung" tone="info">Die Event-Leitung hat Vollzugriff auf alles im Event. Mindestens eine Person muss diese Rolle behalten.</ae-alert>
        <rechte-matrix v-else v-model="rolle.rechte" :disabled="!darf"></rechte-matrix>
        <p v-if="!rolle.istEventLeitung" class="leise">Rechte für einzelne Programmpunkte lassen sich festlegen, sobald es Programmpunkte gibt.</p>
        <ae-alert v-if="fehler" tone="danger">{{ fehler }}</ae-alert>
        <div v-if="darf && rolle.id && !rolle.istEventLeitung" class="reihe"><ae-button variant="tertiary" icon="trash-2" @click="loeschen">Rolle löschen</ae-button></div>
      </form>
      <template #footer>
        <ae-button variant="tertiary" @click="rolle = null">Schliessen</ae-button>
        <ae-button v-if="darf" type="submit" form="rolle-formular" size="md">Speichern</ae-button>
      </template>
    </ae-modal>
  `,
  data() {
    return { rolle: null, fehler: '' }
  },
  computed: {
    darf() {
      return this.event.ich.hatLeitungsrechte
    },
  },
  methods: {
    anzahl(r) {
      var n = this.event.mitglieder.filter(function (m) { return m.rollen.includes(r.id) }).length
      return n + (n === 1 ? ' Person' : ' Personen')
    },
    rolleMeta(r) {
      if (r.istEventLeitung) return 'Vollzugriff'
      var bearbeiten = BEREICHE.filter(function (b) { return r.rechte.some(function (x) { return x.bereich === b.id && x.stufe === 2 && !x.programmpunktId }) })
      var lesen = BEREICHE.filter(function (b) { return r.rechte.some(function (x) { return x.bereich === b.id && x.stufe === 1 && !x.programmpunktId }) })
      var teile = []
      if (bearbeiten.length) teile.push('Bearbeiten: ' + bearbeiten.map(function (b) { return b.label }).join(', '))
      if (lesen.length) teile.push('Lesen: ' + lesen.map(function (b) { return b.label }).join(', '))
      return teile.join(' · ') || 'Keine Rechte'
    },
    oeffnen(r) {
      this.fehler = ''
      this.rolle = r
        ? { id: r.id, name: r.name, istEventLeitung: r.istEventLeitung, rechte: r.rechte.map(function (x) { return Object.assign({}, x) }) }
        : { id: '', name: '', istEventLeitung: false, rechte: [] }
    },
    async speichern() {
      try {
        await this.eventAktion('rolle_speichern', { rolleId: this.rolle.id, name: this.rolle.name, rechte: this.rolle.rechte })
        this.rolle = null
      } catch (fehler) {
        this.fehler = fehler.message
      }
    },
    async loeschen() {
      if (!confirm('Rolle «' + this.rolle.name + '» löschen? Wer sie hat, verliert die damit verbundenen Rechte.')) return
      try {
        await this.eventAktion('rolle_loeschen', { rolleId: this.rolle.id })
        this.rolle = null
      } catch (fehler) {
        this.fehler = fehler.message
      }
    },
  },
})
