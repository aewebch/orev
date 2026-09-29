/* Dashboard: Events der angemeldeten Person (Installations-Admins: alle Events), Tabs «Kommende» und «Vergangene».
   Vergangen ist ein Event, dessen letzter Tag vor heute liegt. */
function heuteIso() {
  var d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

var SeiteDashboard = {
  template: `
    <main class="seite">
      <div class="seite__kopf">
        <div>
          <p class="seite__kicker">{{ zustand.name }}</p>
          <h1>{{ zustand.ich.istAdmin ? 'Events' : 'Meine Events' }}</h1>
        </div>
        <ae-button v-if="zustand.darfEventsAnlegen" icon="plus" @click="neuOeffnen">Neues Event</ae-button>
      </div>
      <div class="mit-tabs">
        <ae-tabs v-model="tab" :tabs="tabs"></ae-tabs>
        <ae-card>
          <p v-if="events === null" class="leise">Lade …</p>
          <p v-else-if="!liste.length" class="leer">{{ tab === 'kommende' ? 'Keine kommenden Events.' : 'Keine vergangenen Events.' }}</p>
          <ae-card-row v-for="e in liste" :key="e.id" :title="e.titel" :meta="meta(e)" interaktiv @click="$router.push('/event/' + e.id)">
            <template #leading><ae-avatar :name="e.titel" :size="40"></ae-avatar></template>
            <template #trailing>
              <div class="reihe">
                <ae-badge v-for="r in e.rollen" :key="r" color="secondary">{{ r }}</ae-badge>
                <ae-badge v-for="t in e.teams" :key="t" color="primary">{{ t }}</ae-badge>
              </div>
            </template>
          </ae-card-row>
        </ae-card>
      </div>

      <ae-modal v-if="neu" title="Neues Event" @schliessen="neu = null">
        <form id="event-neu" class="formular" @submit.prevent="anlegen">
          <div class="formular__zeile">
            <ae-input v-model="neu.titel" label="Titel" required maxlength="120" placeholder="z. B. BeachCamp 2026" autofocus></ae-input>
            <ae-select v-model="neu.typ" label="Art" :optionen="[{ wert: 'event', text: 'Event' }, { wert: 'camp', text: 'Camp' }]"></ae-select>
          </div>
          <div class="formular__zeile">
            <ae-input v-model="neu.startDatum" label="Erster Tag" type="date" required></ae-input>
            <ae-input v-model="neu.endDatum" label="Letzter Tag" type="date" required :min="neu.startDatum"></ae-input>
          </div>
          <div class="formular__zeile">
            <ae-input v-model="neu.thema" label="Thema oder Motto" maxlength="200"></ae-input>
            <ae-input v-model="neu.ort" label="Ort" maxlength="200"></ae-input>
          </div>
          <p class="leise">Sie werden Event-Leitung. Die Rollen werden aus den Rollenvorlagen übernommen.</p>
          <ae-alert v-if="fehler" tone="danger">{{ fehler }}</ae-alert>
        </form>
        <template #footer>
          <ae-button variant="tertiary" @click="neu = null">Schliessen</ae-button>
          <ae-button type="submit" form="event-neu" size="md" :disabled="laeuft">Anlegen</ae-button>
        </template>
      </ae-modal>
    </main>
  `,
  data() {
    return {
      zustand: zustand,
      tab: 'kommende',
      tabs: [{ id: 'kommende', label: 'Kommende' }, { id: 'vergangene', label: 'Vergangene' }],
      events: null,
      neu: null,
      fehler: '',
      laeuft: false,
    }
  },
  computed: {
    liste() {
      if (!this.events) return []
      var heute = heuteIso()
      if (this.tab === 'kommende') {
        return this.events.filter(function (e) { return e.endDatum >= heute }).sort(function (a, b) { return a.startDatum.localeCompare(b.startDatum) })
      }
      return this.events.filter(function (e) { return e.endDatum < heute }).sort(function (a, b) { return b.startDatum.localeCompare(a.startDatum) })
    },
  },
  async created() {
    this.events = (await api.anfrage('events_liste')).events
  },
  methods: {
    meta(e) {
      return [e.typ === 'camp' ? 'Camp' : 'Event', zeitraumText(e.startDatum, e.endDatum), e.ort].filter(Boolean).join(' · ')
    },
    neuOeffnen() {
      var heute = heuteIso()
      this.fehler = ''
      this.neu = { titel: '', typ: 'event', startDatum: heute, endDatum: heute, thema: '', ort: '', beschreibung: '' }
    },
    async anlegen() {
      this.laeuft = true
      this.fehler = ''
      try {
        var id = (await api.anfrage('event_anlegen', this.neu)).id
        this.$router.push('/event/' + id)
      } catch (fehler) {
        this.fehler = fehler.message
      }
      this.laeuft = false
    },
  },
}
