/* Einladungslink: Passwort festlegen (neues Konto oder Zurücksetzen eines bestehenden) */
var SeiteEinladung = {
  props: { token: { type: String, required: true } },
  template: `
    <main class="seite seite--schmal">
      <ae-card v-if="!einladung && !fehler" padding="even"><p class="leise">Einladung wird geprüft …</p></ae-card>
      <ae-card v-else-if="!einladung" title="Einladung" padding="even">
        <ae-alert tone="danger">{{ fehler }}</ae-alert>
      </ae-card>
      <form v-else class="ae-card ae-card--even formular" @submit.prevent="einloesen">
        <div>
          <p class="seite__kicker">{{ zustand.name }}</p>
          <h2>{{ einladung.hatKonto ? 'Neues Passwort' : 'Willkommen' }}</h2>
          <p class="leise">{{ einladung.vorname }} {{ einladung.name }} · {{ einladung.email }}</p>
        </div>
        <ae-input v-model="passwort" label="Passwort" type="password" icon="lock" required minlength="12" autocomplete="new-password" hint="Mindestens 12 Zeichen."></ae-input>
        <ae-input v-model="passwort2" label="Passwort wiederholen" type="password" icon="lock" required autocomplete="new-password"></ae-input>
        <ae-alert v-if="fehler" tone="danger">{{ fehler }}</ae-alert>
        <ae-button type="submit" block :disabled="laeuft">{{ einladung.hatKonto ? 'Passwort speichern' : 'Konto anlegen' }}</ae-button>
      </form>
      <p class="fusszeile"><router-link to="/datenschutz">Datenschutz</router-link></p>
    </main>
  `,
  data() {
    return { zustand: zustand, einladung: null, passwort: '', passwort2: '', fehler: '', laeuft: false }
  },
  async created() {
    try {
      this.einladung = await api.anfrage('einladung_pruefen', { token: this.token })
    } catch (fehler) {
      this.fehler = fehler.message
    }
  },
  methods: {
    async einloesen() {
      this.fehler = ''
      if (this.passwort !== this.passwort2) {
        this.fehler = 'Die beiden Passwörter stimmen nicht überein.'
        return
      }
      this.laeuft = true
      try {
        await api.anfrage('einladung_einloesen', { token: this.token, passwort: this.passwort })
        await api.statusLaden()
        this.$router.replace('/')
      } catch (fehler) {
        this.fehler = fehler.message
      }
      this.laeuft = false
    },
  },
}
