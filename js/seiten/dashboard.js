/* Dashboard: Events der angemeldeten Person, Tabs «Kommende» und «Vergangene» (ab Meilenstein 3 mit Inhalt) */
var SeiteDashboard = {
  template: `
    <main class="seite">
      <div class="seite__kopf">
        <div>
          <p class="seite__kicker">{{ zustand.name }}</p>
          <h1>Meine Events</h1>
        </div>
      </div>
      <div class="mit-tabs">
        <ae-tabs v-model="tab" :tabs="tabs"></ae-tabs>
        <ae-card>
          <p class="leer">{{ tab === 'kommende' ? 'Keine kommenden Events.' : 'Keine vergangenen Events.' }}</p>
        </ae-card>
      </div>
    </main>
  `,
  data() {
    return {
      zustand: zustand,
      tab: 'kommende',
      tabs: [{ id: 'kommende', label: 'Kommende' }, { id: 'vergangene', label: 'Vergangene' }],
    }
  },
}
