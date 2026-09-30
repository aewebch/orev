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
          <h1 class="reihe">{{ zustand.ich.istAdmin ? 'Events' : 'Meine Events' }} <hilfe-punkt thema="orev"></hilfe-punkt></h1>
        </div>
        <div v-if="zustand.darfEventsAnlegen" class="reihe">
          <ae-button icon="plus" class="nur-desktop" @click="neuOeffnen">Neues Event</ae-button>
          <pillen-menue label="Weitere Aktionen" rechts>
            <button type="button" class="menue-eintrag menue-eintrag--icon" @click="importWaehlen"><ae-icon name="upload" :size="16"></ae-icon>Event importieren</button>
          </pillen-menue>
        </div>
        <input ref="datei" type="file" accept=".zip,.json,application/zip,application/json" hidden @change="importieren">
      </div>
      <ae-alert v-if="importMeldung" :tone="importFehler ? 'danger' : 'info'">{{ importMeldung }}</ae-alert>
      <div class="mit-tabs" data-tour="events">
        <ae-tabs v-model="tab" :tabs="tabs"></ae-tabs>
        <ae-card>
          <p v-if="events === null" class="leise">Lade …</p>
          <div v-else-if="!liste.length && tab === 'kommende' && !events.length" class="einstieg">
            <ae-icon name="calendar-days" :size="32"></ae-icon>
            <h2>Willkommen bei Orev</h2>
            <p v-if="zustand.darfEventsAnlegen">Legen Sie Ihr erstes Event oder Camp an. Danach führt Sie ein geführtes Setup Schritt für Schritt durch Ziele, Team, Rollen, Aufgaben und Material.</p>
            <p v-else>Sobald Sie jemand zu einem Event hinzufügt, erscheint es hier. Ihre Aufgaben finden Sie dann unter «Meine Aufgaben».</p>
            <ae-button v-if="zustand.darfEventsAnlegen" icon="plus" @click="neuOeffnen">Erstes Event anlegen</ae-button>
            <button v-if="zustand.darfEventsAnlegen" type="button" class="text-link" @click="importWaehlen">Oder ein Event aus einer Datei importieren</button>
            <router-link to="/hilfe" class="text-link">So funktioniert Orev</router-link>
          </div>
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
      importMeldung: '',
      importFehler: false,
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
  watch: {
    '$route.query.neu'(neu) {
      if (neu && zustand.darfEventsAnlegen) this.neuOeffnen()
    },
  },
  async created() {
    if (this.$route.query.neu && zustand.darfEventsAnlegen) this.neuOeffnen()
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
    importWaehlen() {
      this.$refs.datei.value = ''
      this.$refs.datei.click()
    },
    /* Datei als Base64 an den Server; er erkennt JSON oder ZIP selbst */
    importieren(ereignis) {
      var datei = ereignis.target.files[0]
      if (!datei) return
      var komponente = this
      var leser = new FileReader()
      this.importFehler = false
      this.importMeldung = '«' + datei.name + '» wird importiert …'
      leser.onload = async function () {
        try {
          var base64 = String(leser.result).split(',')[1] || ''
          var antwort = await api.anfrage('event_import', { datei: base64 })
          komponente.$router.push('/event/' + antwort.id)
        } catch (fehler) {
          komponente.importFehler = true
          komponente.importMeldung = fehler.message
        }
      }
      leser.readAsDataURL(datei)
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
