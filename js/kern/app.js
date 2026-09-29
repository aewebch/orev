/* App-Hülle: Navigationsleiste (js/komponenten/leiste.js), Hinweis nach einem Update, Seiteninhalt. Komponenten und Seiten registrieren sich danach. */
var app = Vue.createApp({
  template: `
    <app-leiste v-if="zustand.ich"></app-leiste>
    <div :class="zustand.ich ? 'mit-leiste' : ''">
      <div v-if="zustand.neueVersion" class="seite seite--ohne-abstand-unten">
        <ae-alert tone="warning" title="Orev wurde aktualisiert">
          <div class="reihe reihe--verteilt">
            <span>Version {{ zustand.neueVersion }} ist installiert. Bitte laden Sie die Seite neu.</span>
            <ae-button size="sm" @click="neuLaden">Neu laden</ae-button>
          </div>
        </ae-alert>
      </div>
      <router-view v-if="zustand.geladen"></router-view>
    </div>
  `,
  data() {
    return { zustand: zustand }
  },
  methods: {
    neuLaden() {
      location.reload()
    },
  },
})
