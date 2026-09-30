var SeiteAnmelden = {
  template: `
    <main class="seite seite--schmal">
      <form class="ae-card ae-card--even formular" @submit.prevent="anmelden">
        <div>
          <p class="seite__kicker">{{ zustand.name }}</p>
          <h2>Anmelden</h2>
        </div>
        <ae-alert v-if="fehler" tone="danger" title="Anmeldung fehlgeschlagen">{{ fehler }}</ae-alert>
        <ae-input v-model="email" label="E-Mail" type="email" icon="mail" required autocomplete="username" autofocus></ae-input>
        <ae-input v-model="passwort" label="Passwort" type="password" icon="lock" required autocomplete="current-password"></ae-input>
        <ae-button type="submit" block :disabled="laeuft">Anmelden</ae-button>
        <p class="leise">Noch kein Konto oder Passwort vergessen? Bitten Sie eine Person mit Admin-Rechten um eine Einladung.</p>
      </form>
      <p class="fusszeile"><router-link to="/datenschutz">Datenschutz</router-link> · <a href="LICENSE" target="_blank" rel="noopener">Lizenz</a></p>
    </main>
  `,
  data() {
    return { zustand: zustand, email: '', passwort: '', fehler: '', laeuft: false }
  },
  methods: {
    async anmelden() {
      this.laeuft = true
      this.fehler = ''
      try {
        await api.anfrage('anmelden', { email: this.email, passwort: this.passwort })
        await api.statusLaden()
        var weiter = this.$route.query.weiter
        this.$router.replace(typeof weiter === 'string' && weiter.charAt(0) === '/' ? weiter : '/')
      } catch (fehler) {
        this.fehler = fehler.message
        this.passwort = ''
      }
      this.laeuft = false
    },
  },
}
