/* App-Hülle: Kopfleiste, Hinweis nach einem Update, Seiteninhalt. Komponenten und Seiten registrieren sich danach. */
var app = Vue.createApp({
  template: `
    <header v-if="zustand.ich" class="kopf">
      <div class="kopf__innen">
        <router-link to="/" class="kopf__marke">{{ zustand.name }}</router-link>
        <span class="kopf__name">{{ zustand.ich.vorname }} {{ zustand.ich.name }}</span>
        <router-link to="/" custom v-slot="{ navigate }">
          <ae-icon-button label="Dashboard" variant="flat" @click="navigate"><ae-icon name="layout-dashboard" :size="20"></ae-icon></ae-icon-button>
        </router-link>
        <router-link to="/konto" custom v-slot="{ navigate }">
          <ae-icon-button label="Mein Konto" variant="flat" @click="navigate"><ae-icon name="user" :size="20"></ae-icon></ae-icon-button>
        </router-link>
        <router-link v-if="zustand.ich.istAdmin" to="/einstellungen" custom v-slot="{ navigate }">
          <ae-icon-button :label="zustand.updateVerfuegbar ? 'Einstellungen: Update verfügbar' : 'Einstellungen'" variant="flat" :class="{ 'hinweis-punkt': zustand.updateVerfuegbar }" @click="navigate"><ae-icon name="settings" :size="20"></ae-icon></ae-icon-button>
        </router-link>
        <ae-icon-button label="Abmelden" variant="flat" @click="abmelden"><ae-icon name="log-out" :size="20"></ae-icon></ae-icon-button>
      </div>
    </header>
    <div v-if="zustand.neueVersion" class="seite seite--ohne-abstand-unten">
      <ae-alert tone="warning" title="Orev wurde aktualisiert">
        <div class="reihe reihe--verteilt">
          <span>Version {{ zustand.neueVersion }} ist installiert. Bitte laden Sie die Seite neu.</span>
          <ae-button size="sm" @click="neuLaden">Neu laden</ae-button>
        </div>
      </ae-alert>
    </div>
    <router-view v-if="zustand.geladen"></router-view>
  `,
  data() {
    return { zustand: zustand }
  },
  methods: {
    async abmelden() {
      await api.anfrage('abmelden', {}).catch(function () {})
      zustand.ich = null
      this.$router.push('/anmelden')
    },
    neuLaden() {
      location.reload()
    },
  },
})
