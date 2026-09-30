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
          <ae-checkbox v-model="werte.icalGanzesProgramm" label="Kalender-Abo: standardmässig das ganze Programm eines Events statt nur der eigenen Einträge"></ae-checkbox>
          <ae-alert v-if="meldung" :tone="fehler ? 'danger' : 'success'">{{ meldung }}</ae-alert>
          <div class="formular__aktionen"><ae-button type="submit" :disabled="laeuft">Speichern</ae-button></div>
        </form>

        <form v-if="tab === 'datenschutz' && werte" class="ae-card formular" @submit.prevent="speichern">
          <p class="leise">Orev bringt eine Datenschutzerklärung mit, die beschreibt, was die Software technisch tut. Verantwortlich ist, wer diese Installation betreibt: Ergänzen Sie Ihre Angaben und prüfen Sie den Text für Ihre Organisation. Die Erklärung ist ohne Anmeldung unter <router-link to="/datenschutz" target="_blank">Datenschutz</router-link> erreichbar.</p>
          <ae-textarea v-model="werte.betreiber" label="Verantwortliche Stelle" :rows="3" maxlength="1000" placeholder="Name der Organisation, Adresse"></ae-textarea>
          <ae-input v-model="werte.datenschutzKontakt" label="E-Mail für Datenschutzanfragen" type="email" icon="mail"></ae-input>
          <ae-textarea v-model="werte.datenschutzZusatz" label="Ergänzende Angaben (optional)" :rows="4" maxlength="20000" hint="Erscheint am Schluss der Erklärung, z. B. Hosting-Anbieter und Serverstandort."></ae-textarea>
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
                <ae-badge v-else-if="p.darfEventsAnlegen" color="secondary">Events anlegen</ae-badge>
                <ae-badge v-if="p.hatKonto" color="success">Konto</ae-badge>
                <ae-badge v-else-if="p.eingeladenBis" color="warning">Eingeladen</ae-badge>
                <ae-badge v-else color="neutral">Ohne Konto</ae-badge>
              </div>
            </template>
          </ae-card-row>
        </ae-card>

        <ae-card v-if="tab === 'vorlagen' && werte" subtitle="Neue Events übernehmen diese Rollen. Bestehende Events ändern sich dadurch nicht.">
          <template #actions><ae-button variant="secondary" icon="plus" @click="vorlageOeffnen(-1)">Vorlage anlegen</ae-button></template>
          <ae-card-row v-for="(v, i) in werte.rollenvorlagen" :key="v.id" :title="v.name" :meta="vorlageMeta(v)" interaktiv @click="vorlageOeffnen(i)">
            <template #leading><ae-avatar :name="v.name" :size="40"></ae-avatar></template>
          </ae-card-row>
          <p v-if="!werte.rollenvorlagen.length" class="leer">Keine Vorlagen. Neue Events haben dann nur die Rolle Event-Leitung.</p>
          <ae-alert v-if="meldung" :tone="fehler ? 'danger' : 'success'">{{ meldung }}</ae-alert>
        </ae-card>

        <ae-card v-if="tab === 'programmvorlagen'" subtitle="Bausteine für die Agenda aller Events, samt Ablaufplan. Neue Vorlagen entstehen im Programm über «Als Vorlage speichern».">
          <template #actions><ae-button variant="secondary" icon="plus" @click="programmvorlageOeffnen(null)">Vorlage anlegen</ae-button></template>
          <p v-if="programmvorlagen && !programmvorlagen.length" class="leer">Noch keine Programmvorlagen.</p>
          <ae-card-row v-for="v in programmvorlagen" :key="v.id" :title="v.titel" :meta="programmvorlageMeta(v)" interaktiv @click="programmvorlageOeffnen(v)">
            <template #trailing><farb-punkt :farbe="v.farbe"></farb-punkt></template>
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
          <p class="leise">Die Prüfung fragt nur beim offiziellen Orev-Repository nach dem neuesten Release; es werden keine Daten dieser Installation übermittelt.</p>
        </ae-card>
      </div>

      <ae-modal v-if="vorlage" :title="vorlage.id ? vorlage.name : 'Vorlage anlegen'" :width="640" @schliessen="vorlage = null">
        <form id="vorlage-formular" class="formular" @submit.prevent="vorlageSpeichern">
          <ae-input v-model="vorlage.name" label="Name" required maxlength="80" placeholder="z. B. Küche"></ae-input>
          <rechte-matrix v-model="vorlage.rechte"></rechte-matrix>
          <div v-if="vorlage.index >= 0" class="reihe"><ae-button variant="tertiary" icon="trash-2" @click="vorlageLoeschen">Vorlage löschen</ae-button></div>
        </form>
        <template #footer>
          <ae-button variant="tertiary" @click="vorlage = null">Schliessen</ae-button>
          <ae-button type="submit" form="vorlage-formular" size="md">Speichern</ae-button>
        </template>
      </ae-modal>

      <ae-modal v-if="programmvorlage" :title="programmvorlage.id ? programmvorlage.titel : 'Programmvorlage anlegen'" :width="560" @schliessen="programmvorlage = null">
        <form id="programmvorlage-formular" class="formular" @submit.prevent="programmvorlageSpeichern">
          <ae-input v-model="programmvorlage.titel" label="Titel" required maxlength="120"></ae-input>
          <div class="formular__zeile">
            <ae-input v-model.number="programmvorlage.dauer" label="Dauer in Minuten" type="number" min="0" max="1440" step="5" hint="0 heisst ohne Ende."></ae-input>
            <ae-input v-model="programmvorlage.ort" label="Ort" icon="map-pin" maxlength="200"></ae-input>
          </div>
          <ae-textarea v-model="programmvorlage.beschreibung" label="Beschreibung" maxlength="5000" :rows="3"></ae-textarea>
          <farbe-auswahl v-model="programmvorlage.farbe"></farbe-auswahl>
          <p v-if="programmvorlage.schritte" class="leise">Enthält einen Ablaufplan mit {{ programmvorlage.schritte }} {{ programmvorlage.schritte === 1 ? 'Schritt' : 'Schritten' }}.</p>
          <ae-alert v-if="personFehler" tone="danger">{{ personFehler }}</ae-alert>
          <div v-if="programmvorlage.id" class="reihe"><ae-button variant="tertiary" icon="trash-2" @click="programmvorlageLoeschen">Vorlage löschen</ae-button></div>
        </form>
        <template #footer>
          <ae-button variant="tertiary" @click="programmvorlage = null">Schliessen</ae-button>
          <ae-button type="submit" form="programmvorlage-formular" size="md">Speichern</ae-button>
        </template>
      </ae-modal>

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
            <div v-if="person.hatKonto" class="stapel stapel--eng">
              <ae-checkbox v-model="person.istAdmin" label="Installations-Admin: verwaltet die Installation und hat in jedem Event alle Rechte" :disabled="person.id === zustand.ich.id" @update:modelValue="kontoRechteSetzen"></ae-checkbox>
              <ae-checkbox v-model="person.darfEventsAnlegen" label="Darf Events anlegen" :disabled="person.istAdmin" @update:modelValue="kontoRechteSetzen"></ae-checkbox>
            </div>
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
        { id: 'vorlagen', label: 'Rollenvorlagen', icon: 'shield-check' },
        { id: 'programmvorlagen', label: 'Programmvorlagen', icon: 'list' },
        { id: 'mail', label: 'E-Mail', icon: 'mail' },
        { id: 'datenschutz', label: 'Datenschutz', icon: 'lock' },
        { id: 'updates', label: 'Version und Updates', icon: 'refresh-cw' },
      ],
      werte: null,
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
      vorlage: null,
      programmvorlagen: null,
      programmvorlage: null,
    }
  },
  watch: {
    tab(neu) {
      this.meldung = ''
      if (neu === 'benutzer' && !this.personen) this.personenLaden()
      if (neu === 'updates' && !this.stand) this.updatePruefen(false)
      if (neu === 'programmvorlagen' && !this.programmvorlagen) this.programmvorlagenLaden()
    },
  },
  async created() {
    if (this.$route.query.tab && this.tabs.some(function (t) { return t.id === this.$route.query.tab }, this)) this.tab = this.$route.query.tab
    this.werte = (await api.anfrage('einstellungen_lesen')).einstellungen
  },
  methods: {
    datumZeitText: datumZeitText,
    async programmvorlagenLaden() {
      this.programmvorlagen = (await api.anfrage('programmvorlagen_liste', {})).vorlagen
    },
    programmvorlageMeta(v) {
      return [dauerText(v.dauer), v.ort, v.schritte ? 'Ablaufplan mit ' + v.schritte + (v.schritte === 1 ? ' Schritt' : ' Schritten') : ''].filter(Boolean).join(' · ')
    },
    programmvorlageOeffnen(v) {
      this.personFehler = ''
      this.programmvorlage = v ? Object.assign({}, v) : { id: '', titel: '', beschreibung: '', dauer: 60, ort: '', farbe: '', schritte: 0 }
    },
    async programmvorlageSpeichern() {
      var v = this.programmvorlage
      try {
        this.programmvorlagen = (await api.anfrage('programmvorlage_speichern', { id: v.id, titel: v.titel, beschreibung: v.beschreibung, dauer: parseInt(v.dauer, 10) || 0, ort: v.ort, farbe: v.farbe })).vorlagen
        this.programmvorlage = null
      } catch (fehler) {
        this.personFehler = fehler.message
      }
    },
    async programmvorlageLoeschen() {
      if (!confirm('Programmvorlage «' + this.programmvorlage.titel + '» löschen? Bestehende Programmpunkte bleiben erhalten.')) return
      try {
        this.programmvorlagen = (await api.anfrage('programmvorlage_loeschen', { id: this.programmvorlage.id })).vorlagen
        this.programmvorlage = null
      } catch (fehler) {
        this.personFehler = fehler.message
      }
    },
    async speichern() {
      this.laeuft = true
      this.meldung = ''
      var daten = Object.assign({}, this.werte)
      try {
        this.werte = (await api.anfrage('einstellungen_speichern', daten)).einstellungen
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
    vorlageMeta(v) {
      return BEREICHE.filter(function (b) { return v.rechte.some(function (r) { return r.bereich === b.id }) }).map(function (b) {
        return b.label + ': ' + (v.rechte.find(function (r) { return r.bereich === b.id }).stufe === 2 ? 'bearbeiten' : 'lesen')
      }).join(' · ') || 'Keine Rechte'
    },
    vorlageOeffnen(index) {
      this.meldung = ''
      var v = index >= 0 ? this.werte.rollenvorlagen[index] : { id: '', name: '', rechte: [] }
      this.vorlage = { index: index, id: v.id, name: v.name, rechte: v.rechte.map(function (r) { return Object.assign({}, r) }) }
    },
    async vorlagenSpeichern(vorlagen) {
      try {
        this.werte = (await api.anfrage('rollenvorlagen_speichern', { rollenvorlagen: vorlagen })).einstellungen
        this.fehler = false
        this.meldung = 'Gespeichert.'
        this.vorlage = null
      } catch (fehler) {
        this.fehler = true
        this.meldung = fehler.message
      }
    },
    vorlageSpeichern() {
      var vorlagen = this.werte.rollenvorlagen.slice()
      var neu = { id: this.vorlage.id, name: this.vorlage.name, rechte: this.vorlage.rechte }
      if (this.vorlage.index >= 0) vorlagen[this.vorlage.index] = neu
      else vorlagen.push(neu)
      this.vorlagenSpeichern(vorlagen)
    },
    vorlageLoeschen() {
      if (!confirm('Vorlage «' + this.vorlage.name + '» löschen?')) return
      var index = this.vorlage.index
      this.vorlagenSpeichern(this.werte.rollenvorlagen.filter(function (v, i) { return i !== index }))
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
    async kontoRechteSetzen() {
      this.personFehler = ''
      try {
        await api.anfrage('konto_rechte', { id: this.person.id, istAdmin: this.person.istAdmin, darfEventsAnlegen: this.person.darfEventsAnlegen })
        if (this.person.id === zustand.ich.id) await api.statusLaden()
      } catch (fehler) {
        this.personFehler = fehler.message
      }
      await this.personenLaden()
      var id = this.person.id
      var aktuell = this.personen.find(function (p) { return p.id === id })
      this.person.istAdmin = aktuell.istAdmin
      this.person.darfEventsAnlegen = aktuell.darfEventsAnlegen
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
