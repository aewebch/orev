/* Einstellungen der Installation (nur Installations-Admins) */
var SeiteEinstellungen = {
  template: `
    <main class="seite">
      <div>
        <p class="seite__kicker">Installations-Admin</p>
        <h1>Einstellungen</h1>
      </div>
      <div class="mit-tabs">
        <ae-tabs v-model="tab" :tabs="tabs"></ae-tabs>

        <form v-if="tab === 'allgemein' && werte" class="ae-card formular" @submit.prevent="speichern">
          <div class="formular__zeile">
            <ae-input v-model="werte.name" label="Name der Installation" required maxlength="80"></ae-input>
            <ae-select v-model="werte.zeitzone" label="Zeitzone" :optionen="[{ wert: 'Europe/Zurich', text: 'Europe/Zurich' }]"></ae-select>
          </div>
          <ae-select v-model="werte.eventsAnlegen" label="Wer darf Events anlegen?"
            :optionen="[{ wert: 'admins', text: 'Nur Installations-Admins' }, { wert: 'alle', text: 'Alle Personen mit Konto' }]"></ae-select>
          <ae-checkbox v-model="werte.icalGanzesProgramm" label="Kalender-Abo: standardmässig das ganze Programm eines Events statt nur der eigenen Einträge"></ae-checkbox>
          <ae-alert v-if="meldung" :tone="fehler ? 'danger' : 'success'">{{ meldung }}</ae-alert>
          <div class="formular__aktionen"><ae-button type="submit" :disabled="laeuft">Speichern</ae-button></div>
        </form>

        <form v-if="tab === 'mail' && werte" class="ae-card formular" @submit.prevent="speichern">
          <p class="leise">Einladungen versendet Orev über die E-Mail-Funktion des Hostings. Ohne Versand kopieren Sie den Einladungslink und schicken ihn selbst.</p>
          <ae-checkbox v-model="werte.mailAktiv" label="Einladungen per E-Mail versenden"></ae-checkbox>
          <ae-input v-model="werte.mailAbsender" label="Absender-Adresse" type="email" icon="mail" placeholder="orev@ihre-domain.ch"
            hint="Eine Adresse Ihrer eigenen Domain, damit die E-Mails nicht als Spam gelten."></ae-input>
          <ae-alert v-if="meldung" :tone="fehler ? 'danger' : 'success'">{{ meldung }}</ae-alert>
          <div class="formular__aktionen"><ae-button type="submit" :disabled="laeuft">Speichern</ae-button></div>
        </form>

        <ae-card v-if="tab === 'benutzer'">
          <template #actions><ae-button variant="secondary" icon="user-plus" @click="personOeffnen(null)">Person erfassen</ae-button></template>
          <p v-if="!personen" class="leise">Lade …</p>
          <ae-card-row v-for="p in personen" :key="p.id" :title="p.vorname + ' ' + p.name + (p.kuerzel ? ' (' + p.kuerzel + ')' : '')" :meta="personMeta(p)" interaktiv @click="personOeffnen(p)">
            <template #leading><ae-avatar :name="p.vorname + ' ' + p.name" :size="40"></ae-avatar></template>
            <template #trailing>
              <div class="reihe">
                <ae-badge v-if="p.istAdmin" color="secondary" variant="solid">Admin</ae-badge>
                <ae-badge v-if="p.hatKonto" color="success">Konto</ae-badge>
                <ae-badge v-else-if="p.eingeladenBis" color="warning">Eingeladen</ae-badge>
                <ae-badge v-else color="neutral">Ohne Konto</ae-badge>
              </div>
            </template>
          </ae-card-row>
        </ae-card>

        <ae-card v-if="tab === 'updates'">
          <template #actions><ae-button variant="secondary" icon="refresh-cw" :disabled="laeuft" @click="updatePruefen(true)">Auf Updates prüfen</ae-button></template>
          <div class="stapel">
            <div class="werte">
              <div><span class="werte__label">Installierte Version</span>{{ zustand.version }}</div>
              <div><span class="werte__label">Neueste Version</span>{{ stand && stand.aktuell ? stand.aktuell : '–' }}</div>
              <div><span class="werte__label">Zuletzt geprüft</span>{{ stand ? datumZeitText(stand.geprueft * 1000) : '–' }}</div>
            </div>
            <ae-alert v-if="stand && stand.fehler" tone="danger" title="Prüfung fehlgeschlagen">{{ stand.fehler }}</ae-alert>
            <ae-alert v-else-if="stand && stand.verfuegbar" tone="warning" :title="'Version ' + stand.aktuell + ' ist verfügbar'">
              <div class="stapel stapel--eng">
                <div v-if="stand.notizen" class="notizen">{{ stand.notizen }}</div>
                <div class="reihe">
                  <a v-if="stand.url" :href="stand.url" target="_blank" rel="noopener noreferrer">Release auf GitHub</a>
                  <ae-button size="sm" icon="download" :disabled="laeuft" @click="updateInstallieren">Update installieren</ae-button>
                </div>
                <span class="klein">Vorher empfiehlt sich eine Sicherung des Datenordners und der Datei orev-konfiguration.php. Diese beiden bleiben beim Update unberührt.</span>
              </div>
            </ae-alert>
            <ae-alert v-else-if="stand && stand.aktuell" tone="success">Orev ist auf dem neuesten Stand.</ae-alert>
            <ae-alert v-if="updateMeldung" :tone="fehler ? 'danger' : 'success'">{{ updateMeldung }}</ae-alert>
          </div>
          <hr class="ae-divider ae-divider--dashed">
          <form v-if="werte" class="formular" @submit.prevent="speichern">
            <div class="formular__zeile">
              <ae-input v-model="werte.githubRepo" label="GitHub-Repository" placeholder="aewebch/orev" required></ae-input>
              <ae-input v-model="githubToken" label="GitHub-Token (nur Lesezugriff)" type="password" autocomplete="off"
                :placeholder="werte.githubTokenGesetzt ? 'gespeichert, leer lassen zum Behalten' : 'nur für private Repositories'"></ae-input>
            </div>
            <p class="leise">Die Prüfung fragt nur nach dem neuesten Release; es werden keine Daten dieser Installation übermittelt. Der Token wird verschlüsselt gespeichert und nie angezeigt.</p>
            <div class="formular__aktionen">
              <ae-button v-if="werte.githubTokenGesetzt" variant="tertiary" @click="tokenEntfernen">Token entfernen</ae-button>
              <ae-button type="submit" :disabled="laeuft">Speichern</ae-button>
            </div>
          </form>
        </ae-card>
      </div>

      <ae-modal v-if="person" :title="person.id ? person.vorname + ' ' + person.name : 'Person erfassen'" @schliessen="person = null">
        <form id="person-formular" class="formular" @submit.prevent="personSpeichern">
          <div class="formular__zeile">
            <ae-input v-model="person.vorname" label="Vorname" required maxlength="80"></ae-input>
            <ae-input v-model="person.name" label="Name" required maxlength="80"></ae-input>
          </div>
          <div class="formular__zeile">
            <ae-input v-model="person.kuerzel" label="Kürzel" maxlength="10" placeholder="z. B. EbA"></ae-input>
            <ae-input v-model="person.email" label="E-Mail" type="email" icon="mail"></ae-input>
          </div>
          <template v-if="person.id">
            <ae-checkbox v-if="person.hatKonto" v-model="person.istAdmin" label="Installations-Admin" :disabled="person.id === zustand.ich.id" @update:modelValue="adminSetzen"></ae-checkbox>
            <div v-if="einladungsLink" class="stapel stapel--eng">
              <span class="klein">{{ einladungGesendet ? 'Die Einladung wurde per E-Mail versendet. Link zum Weitergeben:' : 'Einladungslink (7 Tage gültig, nur einmal verwendbar):' }}</span>
              <div class="code">{{ einladungsLink }}</div>
              <div class="reihe"><ae-button variant="secondary" icon="copy" @click="kopieren">{{ kopiert ? 'Kopiert' : 'Kopieren' }}</ae-button></div>
            </div>
            <div class="reihe">
              <ae-button variant="secondary" icon="send" :disabled="!person.email" @click="einladen">{{ person.hatKonto ? 'Link zum Zurücksetzen' : (person.eingeladenBis ? 'Neu einladen' : 'Einladen') }}</ae-button>
              <ae-button v-if="person.eingeladenBis && !einladungsLink" variant="tertiary" @click="einladungZurueckziehen">Einladung zurückziehen</ae-button>
              <ae-button v-if="person.hatKonto && person.id !== zustand.ich.id" variant="tertiary" icon="trash-2" @click="kontoEntfernen">Konto entfernen</ae-button>
            </div>
          </template>
          <ae-alert v-if="personFehler" tone="danger">{{ personFehler }}</ae-alert>
        </form>
        <template #footer>
          <ae-button variant="tertiary" @click="person = null">Schliessen</ae-button>
          <ae-button type="submit" form="person-formular" size="md">Speichern</ae-button>
        </template>
      </ae-modal>
    </main>
  `,
  data() {
    return {
      zustand: zustand,
      tab: 'allgemein',
      tabs: [
        { id: 'allgemein', label: 'Allgemein', icon: 'settings' },
        { id: 'benutzer', label: 'Benutzer und Einladungen', icon: 'users' },
        { id: 'mail', label: 'E-Mail', icon: 'mail' },
        { id: 'updates', label: 'Version und Updates', icon: 'refresh-cw' },
      ],
      werte: null,
      githubToken: '',
      meldung: '',
      fehler: false,
      laeuft: false,
      personen: null,
      person: null,
      personFehler: '',
      einladungsLink: '',
      einladungGesendet: false,
      kopiert: false,
      stand: null,
      updateMeldung: '',
    }
  },
  watch: {
    tab(neu) {
      this.meldung = ''
      if (neu === 'benutzer' && !this.personen) this.personenLaden()
      if (neu === 'updates' && !this.stand) this.updatePruefen(false)
    },
  },
  async created() {
    this.werte = (await api.anfrage('einstellungen_lesen')).einstellungen
  },
  methods: {
    datumZeitText: datumZeitText,
    async speichern() {
      this.laeuft = true
      this.meldung = ''
      var daten = Object.assign({}, this.werte)
      if (this.githubToken !== '') daten.githubToken = this.githubToken
      try {
        this.werte = (await api.anfrage('einstellungen_speichern', daten)).einstellungen
        this.githubToken = ''
        zustand.name = this.werte.name
        document.title = this.werte.name
        this.fehler = false
        this.meldung = 'Gespeichert.'
        if (this.tab === 'updates') this.updateMeldung = 'Gespeichert.'
      } catch (fehler) {
        this.fehler = true
        this.meldung = fehler.message
        if (this.tab === 'updates') this.updateMeldung = fehler.message
      }
      this.laeuft = false
    },
    async tokenEntfernen() {
      this.githubToken = ''
      var daten = Object.assign({}, this.werte, { githubToken: '' })
      this.werte = (await api.anfrage('einstellungen_speichern', daten)).einstellungen
    },
    async personenLaden() {
      this.personen = (await api.anfrage('benutzer_liste')).personen
    },
    personMeta(p) {
      if (p.hatKonto) return p.email + (p.letzteAnmeldung ? ' · zuletzt angemeldet ' + datumText(p.letzteAnmeldung) : '')
      if (p.eingeladenBis) return p.email + ' · Einladung gültig bis ' + datumText(p.eingeladenBis)
      return p.email || 'ohne E-Mail'
    },
    personOeffnen(p) {
      this.person = p ? Object.assign({}, p) : { id: '', vorname: '', name: '', kuerzel: '', email: '' }
      this.personFehler = ''
      this.einladungsLink = ''
      this.kopiert = false
    },
    async personSpeichern() {
      this.personFehler = ''
      try {
        var gespeichert = (await api.anfrage('person_speichern', this.person)).person
        await this.personenLaden()
        if (this.person.id) this.person = null
        else this.person = Object.assign({}, gespeichert)
      } catch (fehler) {
        this.personFehler = fehler.message
      }
    },
    async einladen() {
      this.personFehler = ''
      try {
        var ergebnis = await api.anfrage('einladen', { id: this.person.id })
        this.einladungsLink = ergebnis.link
        this.einladungGesendet = ergebnis.gesendet
        this.person = Object.assign({}, this.person, ergebnis.person)
        this.personenLaden()
      } catch (fehler) {
        this.personFehler = fehler.message
      }
    },
    async einladungZurueckziehen() {
      await api.anfrage('einladung_zurueckziehen', { id: this.person.id })
      this.person.eingeladenBis = ''
      this.personenLaden()
    },
    async adminSetzen(wert) {
      this.personFehler = ''
      try {
        await api.anfrage('admin_setzen', { id: this.person.id, istAdmin: wert })
        this.personenLaden()
      } catch (fehler) {
        this.person.istAdmin = !wert
        this.personFehler = fehler.message
      }
    },
    async kontoEntfernen() {
      if (!confirm('Konto entfernen? Die Person bleibt im Verzeichnis, kann sich aber nicht mehr anmelden.')) return
      await api.anfrage('konto_entfernen', { id: this.person.id })
      this.person = null
      this.personenLaden()
    },
    async kopieren() {
      await navigator.clipboard.writeText(this.einladungsLink)
      this.kopiert = true
    },
    async updatePruefen(erzwingen) {
      this.laeuft = true
      this.updateMeldung = ''
      try {
        this.stand = (await api.anfrage('update_pruefen', { erzwingen: erzwingen })).stand
        zustand.updateVerfuegbar = this.stand.verfuegbar
      } catch (fehler) {
        this.fehler = true
        this.updateMeldung = fehler.message
      }
      this.laeuft = false
    },
    async updateInstallieren() {
      if (!confirm('Update auf Version ' + this.stand.aktuell + ' jetzt installieren?')) return
      this.laeuft = true
      this.updateMeldung = 'Das Update wird geladen und installiert …'
      try {
        var ergebnis = await api.anfrage('update_installieren', {})
        this.fehler = false
        this.updateMeldung = 'Version ' + ergebnis.version + ' ist installiert (' + ergebnis.dateien.length + ' Dateien). Die Seite lädt neu.'
        setTimeout(function () { location.reload() }, 2500)
      } catch (fehler) {
        this.fehler = true
        this.updateMeldung = fehler.message
        this.laeuft = false
      }
    },
  },
}
