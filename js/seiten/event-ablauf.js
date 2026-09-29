/* Ablaufpläne: Übersicht aller Programmpunkte mit Ablaufplan und der Plan eines Punkts wie im Start-Tag-Dokument
   (Kopf mit Leitung und Zielen, Tabelle Zeit | Was | Methode/Sozialform | Anmerkung/Material | Wer, gegliedert nach Abschnitten). */
app.component('event-ablauf', {
  props: {
    event: { type: Object, required: true },
    punktId: { type: String, default: '' },
  },
  inject: ['eventAktion'],
  template: `
    <ae-card v-if="!punktId" title="Ablaufpläne" subtitle="Jeder Programmpunkt hat einen Ablaufplan. Wählen Sie einen Punkt.">
      <p v-if="!liste.length" class="leer">Keine Programmpunkte, deren Ablaufplan Sie sehen dürfen.</p>
      <template v-for="gruppe in liste" :key="gruppe.datum">
        <h4 class="liste__tag">{{ wochentagText(gruppe.datum) }} {{ datumText(gruppe.datum + 'T12:00:00') }}</h4>
        <ae-card-row v-for="p in gruppe.punkte" :key="p.id" :title="p.titel" :meta="uebersichtMeta(p)" interaktiv @click="zeigen(p.id)">
          <template #leading><span class="liste__zeit">{{ p.start.slice(11) }}{{ p.ende ? '–' + p.ende.slice(11) : '' }}</span></template>
          <template #trailing><ae-badge :color="p.ablauf.schritte.length ? 'secondary' : 'neutral'">{{ p.ablauf.schritte.length }} {{ p.ablauf.schritte.length === 1 ? 'Schritt' : 'Schritte' }}</ae-badge></template>
        </ae-card-row>
      </template>
    </ae-card>

    <template v-else>
      <div class="werkzeuge nicht-drucken">
        <ae-button variant="tertiary" icon="arrow-left" @click="zeigen('')">Alle Ablaufpläne</ae-button>
        <span class="dehnen"></span>
        <ae-button v-if="punkt" variant="tertiary" icon="printer" @click="drucken">Drucken</ae-button>
      </div>
      <ae-card v-if="!punkt" padding="even"><ae-alert tone="danger">Diesen Ablaufplan gibt es nicht, oder Sie dürfen ihn nicht sehen.</ae-alert></ae-card>
      <template v-else>
        <ae-card>
          <div class="stapel">
            <div class="reihe reihe--verteilt">
              <div>
                <p class="seite__kicker">Ablaufplan · {{ wochentagText(punkt.start.slice(0, 10)) }} {{ datumText(punkt.start.slice(0, 10) + 'T12:00:00') }}, {{ punkt.start.slice(11) }}{{ punkt.ende ? '–' + punkt.ende.slice(11) : '' }}</p>
                <h2 class="ablauf__titel">{{ punkt.titel }}</h2>
                <p v-if="punkt.ort" class="reihe leise"><ae-icon name="map-pin" :size="16"></ae-icon>{{ punkt.ort }}</p>
              </div>
              <ae-button v-if="darf" variant="secondary" icon="pencil" class="nicht-drucken" @click="kopfOeffnen">Leitung und Ziele</ae-button>
            </div>
            <div class="werte">
              <div><span class="werte__label">Leitung</span>{{ leitungText || 'Noch niemand eingetragen' }}</div>
              <div><span class="werte__label">Zuständig im Programm</span>{{ zustaendigText || 'Niemand eingetragen' }}</div>
            </div>
            <div>
              <span class="werte__label">Ziele</span>
              <p v-if="punkt.ablauf.ziele" class="ablauf__text">{{ punkt.ablauf.ziele }}</p>
              <p v-else class="leise">Noch keine Ziele erfasst.</p>
            </div>
          </div>
        </ae-card>

        <ae-card title="Ablauf">
          <template v-if="darf" #actions><ae-button variant="secondary" icon="plus" class="nicht-drucken" @click="schrittOeffnen(null)">Schritt</ae-button></template>
          <p v-if="!punkt.ablauf.schritte.length" class="leer">Noch keine Ablaufschritte.</p>
          <div v-else class="ablauf" role="table" aria-label="Ablauf">
            <div class="ablauf__zeile ablauf__zeile--kopf" role="row">
              <span role="columnheader">Zeit</span><span role="columnheader">Was</span><span role="columnheader">Methode / Sozialform</span>
              <span role="columnheader">Anmerkung / Material</span><span role="columnheader">Wer</span><span v-if="darf" class="nicht-drucken"></span>
            </div>
            <template v-for="(s, i) in punkt.ablauf.schritte" :key="s.id">
              <div v-if="s.abschnitt && (i === 0 || punkt.ablauf.schritte[i - 1].abschnitt !== s.abschnitt)" class="ablauf__abschnitt" role="row"><span role="cell">{{ s.abschnitt }}</span></div>
              <div :class="['ablauf__zeile', darf ? 'ablauf__zeile--aktiv' : '']" role="row">
                <span class="ablauf__zeit" role="cell">{{ s.zeit || '–' }}</span>
                <span role="cell"><strong>{{ s.titel }}</strong><span v-if="s.beschreibung" class="ablauf__text">{{ s.beschreibung }}</span></span>
                <span role="cell" :class="s.methode ? '' : 'ablauf__leer'"><span class="ablauf__label">Methode / Sozialform</span><span class="ablauf__text">{{ s.methode }}</span></span>
                <span role="cell" :class="s.anmerkung ? '' : 'ablauf__leer'"><span class="ablauf__label">Anmerkung / Material</span><span class="ablauf__text">{{ s.anmerkung }}</span></span>
                <span role="cell" :class="werText(s) ? '' : 'ablauf__leer'"><span class="ablauf__label">Wer</span>{{ werText(s) }}</span>
                <span v-if="darf" class="ablauf__aktionen nicht-drucken" role="cell">
                  <ae-icon-button label="Bearbeiten" variant="flat" @click="schrittOeffnen(s)"><ae-icon name="pencil" :size="16"></ae-icon></ae-icon-button>
                  <ae-icon-button label="Nach oben" variant="flat" :disabled="i === 0" @click="verschieben(s, -1)"><ae-icon name="arrow-up" :size="16"></ae-icon></ae-icon-button>
                  <ae-icon-button label="Nach unten" variant="flat" :disabled="i === punkt.ablauf.schritte.length - 1" @click="verschieben(s, 1)"><ae-icon name="arrow-down" :size="16"></ae-icon></ae-icon-button>
                </span>
              </div>
            </template>
          </div>
        </ae-card>
      </template>
    </template>

    <ae-modal v-if="kopf" title="Leitung und Ziele" :width="640" @schliessen="kopf = null">
      <form id="kopf-formular" class="formular" @submit.prevent="kopfSpeichern">
        <span class="klein">Leitung</span>
        <personen-auswahl v-model="kopf.leitung" :personen="personenListe"></personen-auswahl>
        <ae-textarea v-model="kopf.ziele" label="Ziele" maxlength="5000" :rows="6" placeholder="Was soll dieser Programmpunkt erreichen?"></ae-textarea>
        <ae-alert v-if="fehler" tone="danger">{{ fehler }}</ae-alert>
      </form>
      <template #footer>
        <ae-button variant="tertiary" @click="kopf = null">Abbrechen</ae-button>
        <ae-button type="submit" form="kopf-formular" size="md">Speichern</ae-button>
      </template>
    </ae-modal>

    <ae-modal v-if="schritt" :title="schritt.id ? 'Schritt bearbeiten' : 'Neuer Schritt'" :width="640" @schliessen="schritt = null">
      <form id="schritt-formular" class="formular" @submit.prevent="schrittSpeichern">
        <div class="formular__zeile">
          <ae-input v-model="schritt.zeit" label="Zeit" type="time" hint="Optional. Neue Schritte werden nach der Zeit eingereiht."></ae-input>
          <ae-input v-model="schritt.abschnitt" label="Abschnitt" maxlength="80" placeholder="z. B. Freitag, Vormittag" list="ablauf-abschnitte" autocomplete="off"></ae-input>
        </div>
        <datalist id="ablauf-abschnitte"><option v-for="a in abschnitte" :key="a" :value="a"></option></datalist>
        <ae-input v-model="schritt.titel" label="Was" required maxlength="200" placeholder="z. B. Spiel: Lüge und Wahrheit"></ae-input>
        <ae-textarea v-model="schritt.beschreibung" label="Beschreibung" maxlength="5000" :rows="4" placeholder="Ablauf, Gruppeneinteilung, Auflösung …"></ae-textarea>
        <div class="formular__zeile">
          <ae-textarea v-model="schritt.methode" label="Methode / Sozialform" maxlength="5000" :rows="3"></ae-textarea>
          <ae-textarea v-model="schritt.anmerkung" label="Anmerkung / Material" maxlength="5000" :rows="3"></ae-textarea>
        </div>
        <span class="klein">Wer</span>
        <ae-checkbox v-model="schritt.wer.alle" label="Alle"></ae-checkbox>
        <personen-auswahl v-model="schritt.wer.personen" :personen="personenListe"></personen-auswahl>
        <div v-if="event.teams.length" class="chips">
          <button v-for="t in event.teams" :key="t.id" type="button" :class="['chip', schritt.wer.teams.includes(t.id) ? 'chip--aktiv' : '']" @click="umschalten(schritt.wer.teams, t.id)"><farb-punkt :farbe="t.farbe"></farb-punkt>Team {{ t.name }}</button>
        </div>
        <ae-input v-model="schritt.wer.zusatz" label="Zusatz zu «Wer»" maxlength="200" placeholder="z. B. WiK? sonst EbA"></ae-input>
        <ae-alert v-if="fehler" tone="danger">{{ fehler }}</ae-alert>
        <div v-if="schritt.id" class="reihe"><ae-button variant="tertiary" icon="trash-2" @click="schrittLoeschen">Schritt löschen</ae-button></div>
      </form>
      <template #footer>
        <ae-button variant="tertiary" @click="schritt = null">Abbrechen</ae-button>
        <ae-button type="submit" form="schritt-formular" size="md">Speichern</ae-button>
      </template>
    </ae-modal>
  `,
  data() {
    return { kopf: null, schritt: null, fehler: '' }
  },
  computed: {
    punkt() {
      var id = this.punktId
      return this.event.programmpunkte.find(function (p) { return p.id === id && p.ablauf }) || null
    },
    darf() {
      return this.punkt && this.punkt.rechtAblauf >= 2
    },
    liste() {
      var gruppen = []
      this.event.programmpunkte.filter(function (p) { return p.ablauf }).forEach(function (p) {
        var datum = p.start.slice(0, 10)
        var gruppe = gruppen[gruppen.length - 1]
        if (!gruppe || gruppe.datum !== datum) {
          gruppe = { datum: datum, punkte: [] }
          gruppen.push(gruppe)
        }
        gruppe.punkte.push(p)
      })
      return gruppen
    },
    personenListe() {
      return Object.values(this.event.personen).sort(function (a, b) { return (a.vorname + a.name).localeCompare(b.vorname + b.name, 'de') })
    },
    leitungText() {
      var personen = this.event.personen
      return this.punkt.ablauf.leitung.map(function (id) { return personenName(personen[id]) }).join(', ')
    },
    zustaendigText() {
      var personen = this.event.personen
      var p = this.punkt
      var namen = p.personen.map(function (id) { return personenName(personen[id]) })
      var teams = this.event.teams.filter(function (t) { return p.teams.includes(t.id) }).map(function (t) { return 'Team ' + t.name })
      return namen.concat(teams).join(', ')
    },
    abschnitte() {
      var liste = []
      this.punkt.ablauf.schritte.forEach(function (s) { if (s.abschnitt && !liste.includes(s.abschnitt)) liste.push(s.abschnitt) })
      return liste
    },
  },
  methods: {
    wochentagText: wochentagText,
    datumText: datumText,
    umschalten(liste, wert) {
      var i = liste.indexOf(wert)
      if (i >= 0) liste.splice(i, 1)
      else liste.push(wert)
    },
    zeigen(id) {
      this.$router.push('/event/' + this.event.id + '/ablauf' + (id ? '/' + id : ''))
    },
    drucken() {
      window.print()
    },
    uebersichtMeta(p) {
      var personen = this.event.personen
      var leitung = p.ablauf.leitung.map(function (id) { return personKurz(personen[id]) }).join(', ')
      return [p.ort, leitung ? 'Leitung: ' + leitung : ''].filter(Boolean).join(' · ')
    },
    /* «Wer» wie im Word-Dokument: Alle, Kürzel, Teams, dann der Freitext */
    werText(s) {
      var personen = this.event.personen
      var teile = s.wer.alle ? ['Alle'] : []
      teile = teile.concat(s.wer.personen.map(function (id) { return personKurz(personen[id]) }))
      teile = teile.concat(this.event.teams.filter(function (t) { return s.wer.teams.includes(t.id) }).map(function (t) { return 'Team ' + t.name }))
      return [teile.join(', '), s.wer.zusatz].filter(Boolean).join(' ')
    },
    kopfOeffnen() {
      this.fehler = ''
      this.kopf = { leitung: this.punkt.ablauf.leitung.slice(), ziele: this.punkt.ablauf.ziele }
    },
    async kopfSpeichern() {
      try {
        await this.eventAktion('ablauf_kopf_speichern', { punktId: this.punkt.id, leitung: this.kopf.leitung, ziele: this.kopf.ziele })
        this.kopf = null
      } catch (fehler) {
        this.fehler = fehler.message
      }
    },
    schrittOeffnen(s) {
      this.fehler = ''
      var letzter = this.punkt.ablauf.schritte[this.punkt.ablauf.schritte.length - 1]
      this.schritt = s
        ? { id: s.id, zeit: s.zeit, abschnitt: s.abschnitt, titel: s.titel, beschreibung: s.beschreibung, methode: s.methode, anmerkung: s.anmerkung,
            wer: { personen: s.wer.personen.slice(), teams: s.wer.teams.slice(), alle: s.wer.alle, zusatz: s.wer.zusatz } }
        : { id: '', zeit: '', abschnitt: letzter ? letzter.abschnitt : '', titel: '', beschreibung: '', methode: '', anmerkung: '',
            wer: { personen: [], teams: [], alle: false, zusatz: '' } }
    },
    async schrittSpeichern() {
      try {
        await this.eventAktion('ablaufschritt_speichern', Object.assign({ punktId: this.punkt.id }, this.schritt))
        this.schritt = null
      } catch (fehler) {
        this.fehler = fehler.message
      }
    },
    async schrittLoeschen() {
      if (!confirm('Schritt «' + this.schritt.titel + '» löschen?')) return
      try {
        await this.eventAktion('ablaufschritt_loeschen', { punktId: this.punkt.id, id: this.schritt.id })
        this.schritt = null
      } catch (fehler) {
        this.fehler = fehler.message
      }
    },
    async verschieben(s, richtung) {
      await this.eventAktion('ablaufschritt_verschieben', { punktId: this.punkt.id, id: s.id, richtung: richtung }).catch(function () {})
    },
  },
})
