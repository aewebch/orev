/* Freigabe-Links (nur Event-Leitung): Wer einen Link öffnet, wird Mitglied mit dessen Rollen und Teams.
   Alles direkt in der Zeile: Bezeichnung als Textfeld, Rollen, Teams und Ablauf als Pillen, Link zum Kopieren
   oder Teilen, Erneuern und Löschen im Menü «⋮». Standard ist ein unbegrenzt gültiger Link. */
app.component('event-freigaben', {
  props: { event: { type: Object, required: true } },
  inject: ['eventAktion'],
  template: `
    <ae-card id="freigaben" title="Freigabe-Links" subtitle="Wer einen Link öffnet, kommt mit den gewählten Rollen und Teams ins Event, auch ohne bestehendes Konto.">
      <template #actions><hilfe-punkt thema="freigaben"></hilfe-punkt></template>
      <div class="stapel">
        <div v-for="f in event.freigaben" :key="f.id" :class="['freigabe', f.abgelaufen ? 'freigabe--abgelaufen' : '']">
          <div class="freigabe__kopf">
            <ae-icon name="link" :size="18"></ae-icon>
            <input v-model="entwurf(f).bezeichnung" class="nahtlos freigabe__titel dehnen" maxlength="80" placeholder="Bezeichnung, z. B. Leitende" aria-label="Bezeichnung" @blur="speichern(f)" @keydown.enter="$event.target.blur()">
            <ae-badge v-if="f.abgelaufen" color="neutral">Abgelaufen</ae-badge>
            <pillen-menue label="Weitere Aktionen" rechts>
              <button type="button" class="menue-eintrag menue-eintrag--icon" @click="erneuern(f)"><ae-icon name="refresh-cw" :size="16"></ae-icon>Link erneuern</button>
              <button type="button" class="menue-eintrag menue-eintrag--gefahr menue-eintrag--icon" @click="loeschen(f)"><ae-icon name="trash-2" :size="16"></ae-icon>Link löschen</button>
            </pillen-menue>
          </div>
          <div class="werkzeuge">
            <pillen-menue :text="'Rollen: ' + (namen(event.rollen, entwurf(f).rollen) || 'keine')" :leer="!entwurf(f).rollen.length" panel @zu="speichern(f)">
              <div class="chips">
                <button v-for="r in event.rollen" :key="r.id" type="button" :class="['chip', entwurf(f).rollen.includes(r.id) ? 'chip--aktiv' : '']" @click="umschalten(entwurf(f).rollen, r.id)">{{ r.name }}</button>
              </div>
            </pillen-menue>
            <pillen-menue v-if="event.teams.length" :text="'Teams: ' + (namen(event.teams, entwurf(f).teams) || 'keine')" :leer="!entwurf(f).teams.length" panel @zu="speichern(f)">
              <div class="chips">
                <button v-for="t in event.teams" :key="t.id" type="button" :class="['chip', entwurf(f).teams.includes(t.id) ? 'chip--aktiv' : '']" @click="umschalten(entwurf(f).teams, t.id)"><farb-punkt :farbe="t.farbe"></farb-punkt>{{ t.name }}</button>
              </div>
            </pillen-menue>
            <pillen-menue :text="entwurf(f).gueltigBis ? 'Gültig bis ' + datumText(entwurf(f).gueltigBis + 'T12:00:00') : 'Unbegrenzt gültig'" panel @zu="speichern(f)">
              <div class="stapel stapel--eng">
                <label class="auswahl-zeile"><input type="radio" :checked="!entwurf(f).gueltigBis" @change="entwurf(f).gueltigBis = ''"> Unbegrenzt</label>
                <label class="auswahl-zeile"><input type="radio" :checked="!!entwurf(f).gueltigBis" @change="entwurf(f).gueltigBis = standardAblauf()"> Bis zu einem Datum</label>
                <input v-if="entwurf(f).gueltigBis" v-model="entwurf(f).gueltigBis" type="date" class="nahtlos nahtlos--rahmen" :min="heute" aria-label="Gültig bis und mit">
              </div>
            </pillen-menue>
          </div>
          <p v-if="warnung(f)" class="leise klein freigabe__warnung"><ae-icon name="triangle-alert" :size="14"></ae-icon>{{ warnung(f) }}</p>
          <div class="freigabe__link">
            <input class="nahtlos nahtlos--rahmen dehnen" :value="f.link" readonly aria-label="Link" @focus="$event.target.select()">
            <ae-icon-button :label="kopiert === f.id ? 'Kopiert' : 'Link kopieren'" variant="flat" @click="kopieren(f)"><ae-icon :name="kopiert === f.id ? 'check' : 'copy'" :size="18"></ae-icon></ae-icon-button>
            <ae-icon-button v-if="kannTeilen" label="Teilen" variant="flat" @click="teilen(f)"><ae-icon name="share-2" :size="18"></ae-icon></ae-icon-button>
          </div>
          <p class="leise klein">{{ f.beitritte === 1 ? '1 Beitritt' : f.beitritte + ' Beitritte' }}<template v-if="f.zuletzt"> · zuletzt {{ zeitRelativ(f.zuletzt) }}</template></p>
        </div>
        <p v-if="!event.freigaben.length" class="leer">Noch keine Links. Ein Link eignet sich, um viele Personen auf einmal einzuladen, etwa über einen Gruppenchat.</p>
        <div><ae-button variant="secondary" icon="link" :disabled="laeuft" @click="anlegen">Link erstellen</ae-button></div>
      </div>
    </ae-card>
  `,
  data() {
    return { entwuerfe: {}, kopiert: '', laeuft: false, heute: new Date().toISOString().slice(0, 10), kannTeilen: typeof navigator.share === 'function' }
  },
  watch: {
    'event.freigaben': function () {
      this.entwuerfe = {}
    },
  },
  methods: {
    datumText: datumText,
    zeitRelativ: zeitRelativ,
    entwurf(f) {
      if (!this.entwuerfe[f.id]) this.entwuerfe[f.id] = { bezeichnung: f.bezeichnung, rollen: f.rollen.slice(), teams: f.teams.slice(), gueltigBis: f.gueltigBis }
      return this.entwuerfe[f.id]
    },
    namen(liste, ids) {
      return liste.filter(function (x) { return ids.includes(x.id) }).map(function (x) { return x.name }).join(', ')
    },
    umschalten(liste, id) {
      var i = liste.indexOf(id)
      if (i >= 0) liste.splice(i, 1)
      else liste.push(id)
    },
    standardAblauf() {
      var ende = this.event.endDatum >= this.heute ? this.event.endDatum : this.heute
      return ende
    },
    warnung(f) {
      var e = this.entwurf(f)
      var leitung = this.event.rollen.some(function (r) { return r.istEventLeitung && e.rollen.includes(r.id) })
      if (leitung) return 'Wer diesen Link öffnet, wird Event-Leitung und darf alles. Geben Sie ihn nur gezielt weiter.'
      if (!e.rollen.length && !e.teams.length) return 'Ohne Rolle sehen Beitretende nur die Grunddaten, ihre eigenen Aufgaben und das Feedback.'
      return ''
    },
    async speichern(f) {
      var e = this.entwuerfe[f.id]
      if (!e) return
      var gleich = e.bezeichnung === f.bezeichnung && e.rollen.join() === f.rollen.join() && e.teams.join() === f.teams.join() && e.gueltigBis === f.gueltigBis
      if (gleich) return
      await this.eventAktion('freigabe_speichern', Object.assign({ id: f.id }, e)).catch(function () {})
    },
    async anlegen() {
      this.laeuft = true
      var standard = this.event.rollen.find(function (r) { return !r.istEventLeitung })
      await this.eventAktion('freigabe_speichern', { bezeichnung: 'Freigabe-Link', rollen: standard ? [standard.id] : [], teams: [], gueltigBis: '' }).catch(function () {})
      this.laeuft = false
    },
    async erneuern(f) {
      if (!confirm('Einen neuen Link erzeugen? Der bisherige Link funktioniert danach nicht mehr. Bereits beigetretene Personen bleiben im Event.')) return
      await this.eventAktion('freigabe_erneuern', { id: f.id }).catch(function () {})
    },
    async loeschen(f) {
      if (!confirm('Link «' + f.bezeichnung + '» löschen? Bereits beigetretene Personen bleiben im Event.')) return
      await this.eventAktion('freigabe_loeschen', { id: f.id }).catch(function () {})
    },
    async kopieren(f) {
      var komponente = this
      try {
        await navigator.clipboard.writeText(f.link)
      } catch (fehler) {
        /* Ohne Zwischenablage (kein HTTPS): Link zum Kopieren anzeigen */
        window.prompt('Link kopieren:', f.link)
        return
      }
      this.kopiert = f.id
      setTimeout(function () { komponente.kopiert = '' }, 2000)
    },
    teilen(f) {
      navigator.share({ title: this.event.titel, text: 'Einladung zu «' + this.event.titel + '»', url: f.link }).catch(function () {})
    },
  },
})
