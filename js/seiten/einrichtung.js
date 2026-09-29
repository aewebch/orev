/* Einrichtungsassistent: Voraussetzungen, Einrichtungscode und Datenordner, erster Admin */
var SeiteEinrichtung = {
  template: `
    <main class="seite seite--schmal">
      <div>
        <p class="seite__kicker">Orev {{ status ? status.version : '' }}</p>
        <h1>Einrichtung</h1>
      </div>
      <ol class="schritte">
        <li v-for="(titel, i) in schritte" :key="i" :class="['schritt', schritt === i ? 'schritt--aktiv' : '']">{{ i + 1 }}. {{ titel }}</li>
      </ol>

      <ae-card v-if="!status" padding="even"><p class="leise">Prüfe Voraussetzungen …</p></ae-card>

      <ae-card v-else-if="schritt === 0" title="Voraussetzungen" padding="even">
        <div class="stapel">
          <div v-for="p in status.pruefungen" :key="p.name" :class="['pruefung', p.ok ? 'pruefung--ok' : (p.pflicht ? 'pruefung--fehlt' : 'pruefung--warnung')]">
            <ae-icon :name="p.ok ? 'circle-check' : (p.pflicht ? 'circle-alert' : 'triangle-alert')" :size="18"></ae-icon>
            <span class="dehnen">{{ p.name }}</span><span class="leise">{{ p.wert }}</span>
          </div>
          <ae-alert v-if="!voraussetzungenOk" tone="danger" title="Einrichtung nicht möglich">Bitte beheben Sie die rot markierten Punkte beim Hosting und laden Sie die Seite neu.</ae-alert>
          <ae-alert v-else-if="!httpsOk" tone="warning" title="Ohne HTTPS">Orev sollte nur über HTTPS betrieben werden. Ohne HTTPS lassen sich Passwörter und Daten unterwegs mitlesen.</ae-alert>
          <div class="formular__aktionen"><ae-button :disabled="!voraussetzungenOk" @click="schritt = 1">Weiter</ae-button></div>
        </div>
      </ae-card>

      <form v-else-if="schritt === 1" class="ae-card ae-card--even formular" @submit.prevent="schritt = 2">
        <ae-alert tone="info" title="Einrichtungscode">
          Auf dem Server liegt im Orev-Ordner die Datei <strong>{{ status.codeDatei }}</strong>. Sie ist über das Web gesperrt;
          öffnen Sie sie per FTP oder im Dateimanager des Hostings. So kann niemand ausser Ihnen diese Installation übernehmen.
        </ae-alert>
        <ae-input v-model="code" label="Einrichtungscode" icon="key-round" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" autocomplete="off" required></ae-input>
        <ae-input v-model="name" label="Name der Installation" placeholder="z. B. Kirchgemeinde Degersheim" required maxlength="80"></ae-input>
        <ae-input v-model="datenPfad" label="Datenordner" required
          hint="Absoluter Pfad. Am sichersten ausserhalb des Web-Verzeichnisses. Alle Dateien darin werden mit AES-256 verschlüsselt."></ae-input>
        <div class="formular__aktionen">
          <ae-button variant="tertiary" @click="schritt = 0">Zurück</ae-button>
          <ae-button type="submit">Weiter</ae-button>
        </div>
      </form>

      <form v-else class="ae-card ae-card--even formular" @submit.prevent="abschliessen">
        <p class="leise">Das erste Konto ist Installations-Admin. Weitere Personen laden Sie danach in den Einstellungen ein.</p>
        <div class="formular__zeile">
          <ae-input v-model="admin.vorname" label="Vorname" required autocomplete="given-name"></ae-input>
          <ae-input v-model="admin.name" label="Name" required autocomplete="family-name"></ae-input>
        </div>
        <div class="formular__zeile">
          <ae-input v-model="admin.kuerzel" label="Kürzel" placeholder="z. B. EbA" maxlength="10"></ae-input>
          <ae-input v-model="admin.email" label="E-Mail" type="email" icon="mail" required autocomplete="username"></ae-input>
        </div>
        <ae-input v-model="admin.passwort" label="Passwort" type="password" icon="lock" required minlength="12" autocomplete="new-password" hint="Mindestens 12 Zeichen."></ae-input>
        <ae-input v-model="passwort2" label="Passwort wiederholen" type="password" icon="lock" required autocomplete="new-password"></ae-input>
        <ae-alert v-if="fehler" tone="danger">{{ fehler }}</ae-alert>
        <ae-alert tone="warning" title="Sicherung">Sichern Sie künftig den Datenordner <strong>und</strong> die Datei orev-konfiguration.php. Ohne diese Datei lassen sich die Daten nicht mehr entschlüsseln.</ae-alert>
        <div class="formular__aktionen">
          <ae-button variant="tertiary" @click="schritt = 1">Zurück</ae-button>
          <ae-button type="submit" :disabled="laeuft">Einrichten</ae-button>
        </div>
      </form>
    </main>
  `,
  data() {
    return {
      status: null,
      schritt: 0,
      schritte: ['Voraussetzungen', 'Speicherort', 'Admin-Konto'],
      code: '',
      name: 'Orev',
      datenPfad: '',
      admin: { vorname: '', name: '', kuerzel: '', email: '', passwort: '' },
      passwort2: '',
      fehler: '',
      laeuft: false,
    }
  },
  computed: {
    voraussetzungenOk() {
      return this.status.pruefungen.every(function (p) { return p.ok || !p.pflicht })
    },
    httpsOk() {
      return this.status.pruefungen.every(function (p) { return p.name !== 'HTTPS' || p.ok })
    },
  },
  async created() {
    this.status = await api.anfrage('status')
    this.datenPfad = this.status.datenPfad
  },
  methods: {
    async abschliessen() {
      this.fehler = ''
      if (this.admin.passwort !== this.passwort2) {
        this.fehler = 'Die beiden Passwörter stimmen nicht überein.'
        return
      }
      this.laeuft = true
      try {
        await api.anfrage('einrichtung_abschliessen', { code: this.code, name: this.name, datenPfad: this.datenPfad, admin: this.admin })
        await api.statusLaden()
        this.$router.replace('/')
      } catch (fehler) {
        this.fehler = fehler.message
        if (fehler.status === 403) this.schritt = 1
      }
      this.laeuft = false
    },
  },
}
