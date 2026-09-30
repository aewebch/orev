/* Freigabe-Link öffnen. Angemeldet: Das Event wird sofort mit dem Konto verknüpft. Sonst: neues Konto mit den Rechten
   des Links eröffnen oder mit einem bestehenden Konto anmelden; in beiden Fällen folgt die Verknüpfung automatisch. */
var SeiteBeitreten = {
  props: { eventId: { type: String, required: true }, token: { type: String, required: true } },
  template: `
    <main class="seite seite--schmal">
      <ae-card v-if="!info && !fehler" padding="even"><p class="leise">Link wird geprüft …</p></ae-card>
      <ae-card v-else-if="!info" title="Freigabe-Link" padding="even">
        <div class="stapel">
          <ae-alert tone="danger">{{ fehler }}</ae-alert>
          <p class="leise">Bitten Sie die Event-Leitung um einen neuen Link.</p>
          <router-link :to="zustand.ich ? '/' : '/anmelden'" class="text-link">{{ zustand.ich ? 'Zur Übersicht' : 'Zur Anmeldung' }}</router-link>
        </div>
      </ae-card>
      <template v-else>
        <ae-card padding="even">
          <div class="stapel stapel--eng beitreten__event">
            <p class="seite__kicker">Einladung · {{ info.event.typ === 'camp' ? 'Camp' : 'Event' }}</p>
            <h1 class="beitreten__titel">{{ info.event.titel }}</h1>
            <p class="leise">{{ zeitraumText(info.event.startDatum, info.event.endDatum) }}<template v-if="info.event.ort"> · {{ info.event.ort }}</template></p>
            <div v-if="info.rollen.length || info.teams.length" class="chips">
              <span v-for="r in info.rollen" :key="'r' + r" class="chip chip--aktiv">{{ r }}</span>
              <span v-for="t in info.teams" :key="'t' + t" class="chip">Team {{ t }}</span>
            </div>
          </div>
        </ae-card>

        <ae-card v-if="zustand.ich" padding="even">
          <p v-if="!fehlerVerknuepfen" class="leise">Das Event wird mit Ihrem Konto verknüpft …</p>
          <ae-alert v-else tone="danger">{{ fehlerVerknuepfen }}</ae-alert>
        </ae-card>

        <form v-else class="ae-card ae-card--even formular" @submit.prevent="absenden">
          <span class="stufen stufen--voll" role="radiogroup" aria-label="Konto">
            <button type="button" role="radio" :aria-checked="art === 'neu'" :class="['stufe', art === 'neu' ? 'stufe--aktiv' : '']" @click="wechseln('neu')">Neues Konto</button>
            <button type="button" role="radio" :aria-checked="art === 'anmelden'" :class="['stufe', art === 'anmelden' ? 'stufe--aktiv' : '']" @click="wechseln('anmelden')">Ich habe ein Konto</button>
          </span>
          <template v-if="art === 'neu'">
            <p class="leise">Eröffnen Sie ein Konto. Sie erhalten damit die oben genannten Rechte in diesem Event.</p>
            <div class="formular__zeile">
              <ae-input v-model="neu.vorname" label="Vorname" required maxlength="80" autocomplete="given-name"></ae-input>
              <ae-input v-model="neu.name" label="Name" required maxlength="80" autocomplete="family-name"></ae-input>
            </div>
            <ae-input v-model="neu.email" label="E-Mail" type="email" icon="mail" required autocomplete="username" hint="Mit dieser Adresse melden Sie sich an."></ae-input>
            <ae-input v-model="neu.passwort" label="Passwort" type="password" icon="lock" required minlength="12" autocomplete="new-password" hint="Mindestens 12 Zeichen."></ae-input>
            <ae-input v-model="neu.passwort2" label="Passwort wiederholen" type="password" icon="lock" required autocomplete="new-password"></ae-input>
          </template>
          <template v-else>
            <p class="leise">Melden Sie sich an. Das Event wird danach mit Ihrem Konto verknüpft.</p>
            <ae-input v-model="anmeldung.email" label="E-Mail" type="email" icon="mail" required autocomplete="username"></ae-input>
            <ae-input v-model="anmeldung.passwort" label="Passwort" type="password" icon="lock" required autocomplete="current-password"></ae-input>
          </template>
          <ae-alert v-if="formFehler" tone="danger">{{ formFehler }}</ae-alert>
          <ae-button type="submit" block :disabled="laeuft">{{ art === 'neu' ? 'Konto eröffnen und beitreten' : 'Anmelden und beitreten' }}</ae-button>
          <p class="leise klein">Mit dem Konto gilt die <router-link to="/datenschutz">Datenschutzerklärung</router-link>.</p>
        </form>
      </template>
    </main>
  `,
  data() {
    return {
      zustand: zustand, info: null, fehler: '', fehlerVerknuepfen: '', formFehler: '', laeuft: false, art: 'neu',
      neu: { vorname: '', name: '', email: '', passwort: '', passwort2: '' },
      anmeldung: { email: '', passwort: '' },
    }
  },
  async created() {
    try {
      this.info = await api.anfrage('freigabe_pruefen', { eventId: this.eventId, token: this.token })
    } catch (fehler) {
      this.fehler = fehler.message
      return
    }
    if (zustand.ich) this.verknuepfen()
  },
  methods: {
    zeitraumText: zeitraumText,
    wechseln(art) {
      this.art = art
      this.formFehler = ''
    },
    async verknuepfen() {
      try {
        await api.anfrage('freigabe_einloesen', { eventId: this.eventId, token: this.token })
        this.$router.replace('/event/' + this.eventId)
      } catch (fehler) {
        this.fehlerVerknuepfen = fehler.message
      }
    },
    async absenden() {
      this.formFehler = ''
      if (this.art === 'neu' && this.neu.passwort !== this.neu.passwort2) {
        this.formFehler = 'Die beiden Passwörter stimmen nicht überein.'
        return
      }
      this.laeuft = true
      try {
        if (this.art === 'neu') {
          await api.anfrage('freigabe_konto_anlegen', { eventId: this.eventId, token: this.token, vorname: this.neu.vorname, name: this.neu.name, email: this.neu.email, passwort: this.neu.passwort })
        } else {
          await api.anfrage('anmelden', this.anmeldung)
          await api.anfrage('freigabe_einloesen', { eventId: this.eventId, token: this.token })
        }
        await api.statusLaden()
        this.$router.replace('/event/' + this.eventId)
      } catch (fehler) {
        /* Angemeldet, aber Verknüpfen fehlgeschlagen: Meldung in der Karte statt im Formular */
        await api.statusLaden().catch(function () {})
        if (zustand.ich) {
          this.fehlerVerknuepfen = fehler.message
        } else {
          this.formFehler = fehler.message
          this.anmeldung.passwort = ''
        }
      }
      this.laeuft = false
    },
  },
}
