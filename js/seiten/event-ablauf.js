/* Ablaufpläne: Übersicht aller Programmpunkte mit Ablaufplan und der Plan eines Punkts wie im Start-Tag-Dokument
   (Kopf mit Leitung und Zielen, Tabelle Zeit | Was | Methode/Sozialform | Anmerkung/Material | Wer, gegliedert nach
   Abschnitten). Bearbeitet wird direkt in der Tabelle: Ein Klick auf eine Zeile macht sie bearbeitbar, «Wer» und
   Abschnitt stehen in Pillen, Material und Aufgaben hängen direkt am Schritt. Gespeichert wird mit «Fertig» oder beim
   Wechsel zur nächsten Zeile. */
app.component('event-ablauf', {
  props: {
    event: { type: Object, required: true },
    punktId: { type: String, default: '' },
  },
  inject: ['eventAktion'],
  template: `
    <ae-card v-if="!punktId" title="Ablaufpläne" subtitle="Jeder Programmpunkt hat einen Ablaufplan. Wählen Sie einen Punkt.">
      <template #actions><hilfe-punkt thema="ablaufplan"></hilfe-punkt></template>
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
        <hilfe-punkt thema="ablaufplan"></hilfe-punkt>
        <ae-icon-button v-if="punkt" label="Drucken" variant="flat" @click="drucken"><ae-icon name="printer" :size="18"></ae-icon></ae-icon-button>
      </div>
      <ae-card v-if="!punkt" padding="even"><ae-alert tone="danger">Diesen Ablaufplan gibt es nicht, oder Sie dürfen ihn nicht sehen.</ae-alert></ae-card>
      <template v-else>
        <ae-card>
          <div class="stapel">
            <div>
              <p class="seite__kicker">Ablaufplan · {{ wochentagText(punkt.start.slice(0, 10)) }} {{ datumText(punkt.start.slice(0, 10) + 'T12:00:00') }}, {{ punkt.start.slice(11) }}{{ punkt.ende ? '–' + punkt.ende.slice(11) : '' }}<template v-if="punkt.ort"> · {{ punkt.ort }}</template></p>
              <h2 class="ablauf__titel">{{ punkt.titel }}</h2>
            </div>
            <div class="werkzeuge">
              <zuweisung-pille v-if="darf" v-model="leitung" :event="event" label="Leitung" nur-personen @zu="leitungSpeichern"></zuweisung-pille>
              <span v-else class="klein"><strong>Leitung:</strong> {{ leitungText || '–' }}</span>
              <span v-if="zustaendigText" class="leise">Im Programm zuständig: {{ zustaendigText }}</span>
            </div>
            <div>
              <span class="werte__label">Ziele</span>
              <textarea v-if="darf" v-model="ziele" v-wachsen class="nahtlos ablauf__ziele" rows="1" maxlength="5000" placeholder="Was soll dieser Programmpunkt erreichen?" aria-label="Ziele" @blur="zieleSpeichern"></textarea>
              <p v-else-if="punkt.ablauf.ziele" class="ablauf__text">{{ punkt.ablauf.ziele }}</p>
              <p v-else class="leise">Noch keine Ziele erfasst.</p>
            </div>
            <div class="ablauf__anhang">
              <div v-if="punkt.rechtMaterial >= 1">
                <span class="werte__label">Material für den ganzen Programmpunkt</span>
                <material-liste :event="event" art="programmpunkt" :ziel-id="punkt.id" :punkt-id="punkt.id" :darf="punkt.rechtMaterial >= 2"></material-liste>
              </div>
              <div v-if="punkt.rechtAufgaben >= 1 || aufgabenZuPunkt">
                <span class="werte__label">Aufgaben</span>
                <aufgaben-kurz :event="event" art="programmpunkt" :ziel-id="punkt.id" :punkt-id="punkt.id" :darf="punkt.rechtAufgaben >= 2"></aufgaben-kurz>
              </div>
            </div>
          </div>
        </ae-card>

        <ae-card title="Ablauf">
          <div class="ablauf" role="table" aria-label="Ablauf">
            <div class="ablauf__zeile ablauf__zeile--kopf" role="row">
              <span role="columnheader">Zeit</span><span role="columnheader">Was</span><span role="columnheader">Methode / Sozialform</span>
              <span role="columnheader">Anmerkung / Material</span><span role="columnheader">Wer</span>
            </div>
            <p v-if="!zeilen.length" class="leer">Noch keine Ablaufschritte.</p>
            <template v-for="(s, i) in zeilen" :key="s.id || 'neu'">
              <div v-if="s.abschnitt && (i === 0 || zeilen[i - 1].abschnitt !== s.abschnitt)" class="ablauf__abschnitt" role="row"><span role="cell">{{ s.abschnitt }}</span></div>

              <div v-if="aktiv === (s.id || 'neu')" class="ablauf__zeile ablauf__zeile--bearbeiten" role="row" @click.stop>
                <span role="cell"><input v-model="entwurf.zeit" class="nahtlos nahtlos--zeit" type="time" aria-label="Zeit"></span>
                <span role="cell" class="stapel stapel--eng">
                  <input v-model="entwurf.titel" v-fokus class="nahtlos nahtlos--fett" maxlength="200" placeholder="Was geschieht?" aria-label="Was" @keydown.enter.prevent="fertig">
                  <textarea v-model="entwurf.beschreibung" v-wachsen class="nahtlos" rows="1" maxlength="5000" placeholder="Beschreibung …" aria-label="Beschreibung"></textarea>
                </span>
                <span role="cell"><span class="ablauf__label">Methode / Sozialform</span><textarea v-model="entwurf.methode" v-wachsen class="nahtlos" rows="1" maxlength="5000" placeholder="Methode …" aria-label="Methode oder Sozialform"></textarea></span>
                <span role="cell" class="stapel stapel--eng">
                  <span class="ablauf__label">Anmerkung / Material</span>
                  <textarea v-model="entwurf.anmerkung" v-wachsen class="nahtlos" rows="1" maxlength="5000" placeholder="Anmerkung …" aria-label="Anmerkung"></textarea>
                  <material-liste v-if="s.id && punkt.rechtMaterial >= 1" :event="event" art="schritt" :ziel-id="s.id" :punkt-id="punkt.id" :darf="punkt.rechtMaterial >= 2"></material-liste>
                </span>
                <span role="cell"><zuweisung-pille v-model="entwurf.wer" :event="event" mit-alle mit-zusatz></zuweisung-pille></span>
                <div class="ablauf__leiste">
                  <pillen-menue :text="'Abschnitt: ' + (entwurf.abschnitt || '–')" :leer="!entwurf.abschnitt" panel>
                    <input v-model="entwurf.abschnitt" class="nahtlos nahtlos--rahmen" maxlength="80" placeholder="z. B. Freitag, Nachmittag" :list="'abschnitte-' + punkt.id" aria-label="Abschnitt">
                    <datalist :id="'abschnitte-' + punkt.id"><option v-for="a in abschnitte" :key="a" :value="a"></option></datalist>
                  </pillen-menue>
                  <aufgaben-kurz v-if="s.id && punkt.rechtAufgaben >= 1" :event="event" art="schritt" :ziel-id="s.id" :punkt-id="punkt.id" :darf="punkt.rechtAufgaben >= 2"></aufgaben-kurz>
                  <span v-if="!s.id" class="leise">Material und Aufgaben nach dem ersten Speichern.</span>
                  <span class="dehnen"></span>
                  <pillen-menue v-if="s.id" label="Weitere Aktionen" rechts>
                    <button type="button" class="menue-eintrag" :disabled="i === 0" @click="verschieben(s, -1)">Nach oben</button>
                    <button type="button" class="menue-eintrag" :disabled="i === zeilen.length - 1" @click="verschieben(s, 1)">Nach unten</button>
                    <button type="button" class="menue-eintrag menue-eintrag--gefahr" @click="loeschen(s)">Schritt löschen</button>
                  </pillen-menue>
                  <ae-button size="sm" @click="fertig">Fertig</ae-button>
                </div>
                <ae-alert v-if="fehler" tone="danger" class="ablauf__fehler">{{ fehler }}</ae-alert>
              </div>

              <div v-else :class="['ablauf__zeile', darf ? 'ablauf__zeile--editierbar' : '']" role="row" @click="oeffnen(s)">
                <span class="ablauf__zeit" role="cell">{{ s.zeit || '–' }}</span>
                <span role="cell">
                  <strong>{{ s.titel }}</strong><span v-if="s.beschreibung" class="ablauf__text">{{ s.beschreibung }}</span>
                  <span v-if="aufgabenVon(s).length" class="ablauf__aufgaben">
                    <span v-for="a in aufgabenVon(s)" :key="a.id" :class="['chip', 'chip--leise', a.status === 'erledigt' ? 'aufgabe-zeile--erledigt' : '']"><ae-icon :name="a.status === 'erledigt' ? 'circle-check' : 'list-todo'" :size="14"></ae-icon>{{ a.titel }}</span>
                  </span>
                </span>
                <span role="cell" :class="s.methode ? '' : 'ablauf__leer'"><span class="ablauf__label">Methode / Sozialform</span><span class="ablauf__text">{{ s.methode }}</span></span>
                <span role="cell" :class="s.anmerkung || materialVon(s).length ? '' : 'ablauf__leer'">
                  <span class="ablauf__label">Anmerkung / Material</span><span class="ablauf__text">{{ s.anmerkung }}</span>
                  <span v-if="materialVon(s).length" class="ablauf__material">
                    <span v-for="m in materialVon(s)" :key="m.id" class="chip chip--leise"><ae-icon name="package" :size="14"></ae-icon>{{ mengeAnzeige(m.menge, m.einheit) }} {{ m.name }}<template v-if="m.halter"> · {{ kurz(m.halter) }}</template></span>
                  </span>
                </span>
                <span role="cell" :class="werText(s) ? '' : 'ablauf__leer'"><span class="ablauf__label">Wer</span>{{ werText(s) }}</span>
              </div>
            </template>
          </div>
          <button v-if="darf && aktiv !== 'neu'" type="button" class="neue-zeile neue-zeile--knopf nicht-drucken" @click="neuerSchritt"><ae-icon name="plus" :size="18"></ae-icon>Schritt hinzufügen</button>
        </ae-card>
      </template>
    </template>
  `,
  data() {
    return { aktiv: null, entwurf: null, original: '', fehler: '', leitung: { personen: [], teams: [] }, ziele: '' }
  },
  computed: {
    punkt() {
      var id = this.punktId
      return this.event.programmpunkte.find(function (p) { return p.id === id && p.ablauf }) || null
    },
    darf() {
      return !!this.punkt && this.punkt.rechtAblauf >= 2
    },
    /* Gespeicherte Schritte plus ein neuer Entwurf am Ende */
    zeilen() {
      var schritte = this.punkt ? this.punkt.ablauf.schritte.slice() : []
      if (this.aktiv === 'neu') schritte.push(Object.assign({ id: '' }, this.entwurf))
      return schritte
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
    leitungText() {
      var personen = this.event.personen
      return this.punkt.ablauf.leitung.map(function (id) { return personenName(personen[id]) }).join(', ')
    },
    zustaendigText() {
      return zuweisungText(this.event, { personen: this.punkt.personen, teams: this.punkt.teams, alle: false, zusatz: '' })
    },
    abschnitte() {
      var liste = []
      this.punkt.ablauf.schritte.forEach(function (s) { if (s.abschnitt && !liste.includes(s.abschnitt)) liste.push(s.abschnitt) })
      return liste
    },
    aufgabenZuPunkt() {
      var id = this.punkt.id
      return this.event.aufgaben.some(function (a) { return a.ziel.art === 'programmpunkt' && a.ziel.punktId === id })
    },
  },
  watch: {
    punkt: {
      immediate: true,
      handler(punkt) {
        if (!punkt) return
        this.leitung = { personen: punkt.ablauf.leitung.slice(), teams: [] }
        if (document.activeElement === null || !document.activeElement.classList.contains('ablauf__ziele')) this.ziele = punkt.ablauf.ziele
      },
    },
    punktId() {
      this.aktiv = null
      this.entwurf = null
    },
  },
  methods: {
    wochentagText: wochentagText,
    datumText: datumText,
    mengeAnzeige: mengeAnzeige,
    kurz(id) {
      return personKurz(this.event.personen[id])
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
    werText(s) {
      return zuweisungText(this.event, s.wer)
    },
    materialVon(s) {
      return this.event.material.filter(function (m) { return m.ziel.art === 'schritt' && m.ziel.schrittId === s.id })
    },
    aufgabenVon(s) {
      return this.event.aufgaben.filter(function (a) { return a.ziel.art === 'schritt' && a.ziel.schrittId === s.id })
    },
    async leitungSpeichern() {
      if (this.leitung.personen.join() === this.punkt.ablauf.leitung.join()) return
      await this.eventAktion('ablauf_kopf_speichern', { punktId: this.punkt.id, leitung: this.leitung.personen, ziele: this.punkt.ablauf.ziele }).catch(function () {})
    },
    async zieleSpeichern() {
      if (this.ziele === this.punkt.ablauf.ziele) return
      await this.eventAktion('ablauf_kopf_speichern', { punktId: this.punkt.id, leitung: this.punkt.ablauf.leitung, ziele: this.ziele }).catch(function () {})
    },
    entwurfAus(s) {
      return {
        id: s.id, zeit: s.zeit, abschnitt: s.abschnitt, titel: s.titel, beschreibung: s.beschreibung, methode: s.methode, anmerkung: s.anmerkung,
        wer: { personen: s.wer.personen.slice(), teams: s.wer.teams.slice(), alle: s.wer.alle, zusatz: s.wer.zusatz },
      }
    },
    /* Eine Zeile bearbeiten; die bisher offene wird vorher gespeichert */
    async oeffnen(s) {
      if (!this.darf || this.aktiv === s.id) return
      if (this.aktiv && !(await this.fertig())) return
      this.fehler = ''
      this.aktiv = s.id
      this.entwurf = this.entwurfAus(s)
      this.original = JSON.stringify(this.entwurf)
    },
    async neuerSchritt() {
      if (this.aktiv && !(await this.fertig())) return
      var schritte = this.punkt.ablauf.schritte
      var letzter = schritte[schritte.length - 1]
      this.fehler = ''
      this.entwurf = { id: '', zeit: '', abschnitt: letzter ? letzter.abschnitt : '', titel: '', beschreibung: '', methode: '', anmerkung: '', wer: { personen: [], teams: [], alle: false, zusatz: '' } }
      this.original = JSON.stringify(this.entwurf)
      this.aktiv = 'neu'
    },
    /* Speichert, falls nötig; liefert false, wenn die Zeile wegen eines Fehlers offen bleibt */
    async fertig() {
      var e = this.entwurf
      if (!e) return true
      var unveraendert = JSON.stringify(e) === this.original
      if (unveraendert || (!e.id && !e.titel.trim())) {
        this.aktiv = null
        this.entwurf = null
        return true
      }
      try {
        await this.eventAktion('ablaufschritt_speichern', Object.assign({ punktId: this.punkt.id }, e, { titel: e.titel.trim() }))
        this.aktiv = null
        this.entwurf = null
        return true
      } catch (fehler) {
        this.fehler = fehler.message
        return false
      }
    },
    async loeschen(s) {
      if (!confirm('Schritt «' + s.titel + '» löschen? Aufgaben und Material daran werden mit entfernt.')) return
      try {
        await this.eventAktion('ablaufschritt_loeschen', { punktId: this.punkt.id, id: s.id })
        this.aktiv = null
        this.entwurf = null
      } catch (fehler) {
        this.fehler = fehler.message
      }
    },
    async verschieben(s, richtung) {
      if (!(await this.fertig())) return
      await this.eventAktion('ablaufschritt_verschieben', { punktId: this.punkt.id, id: s.id, richtung: richtung }).catch(function () {})
    },
  },
})
