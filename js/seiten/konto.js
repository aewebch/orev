/* Eigenes Konto: Passwort ändern, alle Geräte abmelden */
var SeiteKonto = {
  template: `
    <main class="seite seite--schmal">
      <div>
        <p class="seite__kicker">Mein Konto</p>
        <h1>{{ zustand.ich.vorname }} {{ zustand.ich.name }}</h1>
        <p class="leise">{{ zustand.ich.email }}<template v-if="zustand.ich.kuerzel"> · {{ zustand.ich.kuerzel }}</template></p>
      </div>

      <form class="ae-card formular" @submit.prevent="passwortAendern">
        <h4 class="ae-card__title">Passwort ändern</h4>
        <ae-input v-model="alt" label="Bisheriges Passwort" type="password" icon="lock" required autocomplete="current-password"></ae-input>
        <ae-input v-model="neu" label="Neues Passwort" type="password" icon="lock" required minlength="12" autocomplete="new-password" hint="Mindestens 12 Zeichen. Andere Geräte werden dabei abgemeldet."></ae-input>
        <ae-input v-model="neu2" label="Neues Passwort wiederholen" type="password" icon="lock" required autocomplete="new-password"></ae-input>
        <ae-alert v-if="meldung" :tone="fehler ? 'danger' : 'success'">{{ meldung }}</ae-alert>
        <div class="formular__aktionen"><ae-button type="submit" :disabled="laeuft">Speichern</ae-button></div>
      </form>

      <ae-card title="Angemeldete Geräte">
        <p class="leise">Beendet die Anmeldung auf allen Geräten, auch auf diesem.</p>
        <div class="formular__aktionen"><ae-button variant="secondary" icon="log-out" @click="ueberallAbmelden">Überall abmelden</ae-button></div>
      </ae-card>
    </main>
  `,
  data() {
    return { zustand: zustand, alt: '', neu: '', neu2: '', meldung: '', fehler: false, laeuft: false }
  },
  methods: {
    async passwortAendern() {
      this.meldung = ''
      if (this.neu !== this.neu2) {
        this.fehler = true
        this.meldung = 'Die beiden neuen Passwörter stimmen nicht überein.'
        return
      }
      this.laeuft = true
      try {
        await api.anfrage('passwort_aendern', { alt: this.alt, neu: this.neu })
        this.fehler = false
        this.meldung = 'Das Passwort wurde geändert.'
        this.alt = this.neu = this.neu2 = ''
      } catch (fehler) {
        this.fehler = true
        this.meldung = fehler.message
      }
      this.laeuft = false
    },
    async ueberallAbmelden() {
      if (!confirm('Auf allen Geräten abmelden?')) return
      await api.anfrage('ueberall_abmelden', {})
      zustand.ich = null
      this.$router.replace('/anmelden')
    },
  },
}
