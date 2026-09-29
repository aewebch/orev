/* Aufgaben eines Events: «Meine», «Offen» (Überblick der Leitung) und «Alle». Neue Aufgaben entstehen durch Tippen
   und Enter; ein Klick auf eine Aufgabe öffnet sie zur Bearbeitung direkt in der Liste. Zuständige, Fälligkeit und
   Zuordnung stehen in Pillen, Vorbereitungstermine und Material direkt darunter. */
app.component('event-aufgaben', {
  props: {
    event: { type: Object, required: true },
    punktId: { type: String, default: '' },
  },
  inject: ['eventAktion'],
  template: `
    <ae-card>
      <div class="stapel">
        <div class="werkzeuge">
          <span class="stufen" role="radiogroup" aria-label="Ansicht">
            <button v-for="a in ansichten" :key="a.id" type="button" role="radio" :aria-checked="ansicht === a.id" :class="['stufe', ansicht === a.id ? 'stufe--aktiv' : '']" @click="ansicht = a.id">{{ a.label }} <span class="leise">{{ anzahl(a.id) }}</span></button>
          </span>
        </div>

        <div v-if="darfAnlegen" class="neue-zeile">
          <ae-icon name="plus" :size="18"></ae-icon>
          <input v-model="neu.titel" class="nahtlos dehnen" maxlength="200" placeholder="Neue Aufgabe, mit Enter erfassen" aria-label="Neue Aufgabe" @keydown.enter.prevent="anlegen">
          <select v-model="neu.ziel" class="pille pille--auswahl" aria-label="Gehört zu">
            <option v-for="z in zielOptionen" :key="z.wert" :value="z.wert">{{ z.text }}</option>
          </select>
        </div>

        <p v-if="!liste.length" class="leer">{{ leerText }}</p>
        <div class="aufgaben">
          <div v-for="a in liste" :key="a.id" :ref="'aufgabe-' + a.id" :class="['aufgabe', aktiv === a.id ? 'aufgabe--aktiv' : '', a.recht >= 2 && aktiv !== a.id ? 'aufgabe--editierbar' : '', a.status === 'erledigt' ? 'aufgabe--erledigt' : '']" @click="oeffnen(a)">
            <div class="aufgabe__kopf">
              <button type="button" class="haken" :disabled="!a.darfStatus" :aria-label="a.status === 'erledigt' ? 'Wieder öffnen' : 'Als erledigt markieren'" :aria-pressed="a.status === 'erledigt'" @click.stop="umschalten(a)">
                <ae-icon :name="a.status === 'erledigt' ? 'circle-check' : 'circle'" :size="20"></ae-icon>
              </button>
              <input v-if="aktiv === a.id" v-model="entwurf.titel" v-fokus class="nahtlos nahtlos--titel dehnen" maxlength="200" aria-label="Titel">
              <div v-else class="dehnen">
                <strong class="aufgabe__titel">{{ a.titel }}</strong>
                <span class="leise aufgabe__meta">{{ metaText(a) }}</span>
              </div>
              <pillen-menue v-if="aktiv === a.id" label="Weitere Aktionen" rechts>
                <button type="button" class="menue-eintrag menue-eintrag--gefahr" @click="loeschen(a)">Aufgabe löschen</button>
              </pillen-menue>
            </div>

            <div v-if="aktiv === a.id" class="aufgabe__bearbeiten" @click.stop>
              <textarea v-model="entwurf.beschreibung" v-wachsen class="nahtlos" rows="1" maxlength="5000" placeholder="Beschreibung …" aria-label="Beschreibung"></textarea>
              <div class="werkzeuge">
                <zuweisung-pille v-model="entwurf.wer" :event="event" label="Zuständig"></zuweisung-pille>
                <pillen-menue :text="'Fällig: ' + (entwurf.faellig ? datumText(entwurf.faellig + 'T12:00:00') : '–')" :leer="!entwurf.faellig" panel>
                  <input v-model="entwurf.faellig" class="nahtlos nahtlos--rahmen" type="date" aria-label="Fällig am">
                  <button v-if="entwurf.faellig" type="button" class="menue-eintrag" @click="entwurf.faellig = ''">Ohne Fälligkeit</button>
                </pillen-menue>
                <select v-model="entwurf.ziel" class="pille pille--auswahl" aria-label="Gehört zu">
                  <option v-for="z in zielOptionenAlle" :key="z.wert" :value="z.wert">{{ z.text }}</option>
                </select>
              </div>

              <div class="stapel stapel--eng">
                <span class="aufklapp__titel">Vorbereitungstermine</span>
                <div v-for="(t, i) in entwurf.termine" :key="t.schluessel" class="termin">
                  <ae-icon name="calendar-clock" :size="16"></ae-icon>
                  <input v-model="t.datum" class="nahtlos nahtlos--rahmen" type="date" aria-label="Datum">
                  <input v-model="t.von" class="nahtlos nahtlos--rahmen nahtlos--kurz" type="time" aria-label="Von">
                  <span class="leise">bis</span>
                  <input v-model="t.bis" class="nahtlos nahtlos--rahmen nahtlos--kurz" type="time" aria-label="Bis">
                  <input v-model="t.ort" class="nahtlos nahtlos--rahmen" maxlength="200" placeholder="Ort" aria-label="Ort">
                  <input v-model="t.notiz" class="nahtlos nahtlos--rahmen dehnen" maxlength="2000" placeholder="Notiz" aria-label="Notiz">
                  <button type="button" class="knopf-rund" aria-label="Termin entfernen" @click="entwurf.termine.splice(i, 1)"><ae-icon name="x" :size="16"></ae-icon></button>
                </div>
                <button type="button" class="text-link" @click="terminHinzufuegen">+ Vorbereitungstermin</button>
              </div>

              <div class="stapel stapel--eng">
                <span class="aufklapp__titel">Material</span>
                <material-liste :event="event" art="aufgabe" :ziel-id="a.id" :darf="materialDarf(a)"></material-liste>
              </div>
              <ae-alert v-if="fehler" tone="danger">{{ fehler }}</ae-alert>
              <div class="reihe reihe--verteilt">
                <span class="leise">{{ a.ziel.titel }}</span>
                <ae-button size="sm" @click="fertig().catch(function () {})">Fertig</ae-button>
              </div>
            </div>
            <template v-else>
              <div v-if="a.beschreibung" class="aufgabe__text">{{ a.beschreibung }}</div>
              <div v-if="a.termine.length" class="aufgabe__termine">
                <span v-for="t in a.termine" :key="t.id" class="chip chip--leise"><ae-icon name="calendar-clock" :size="14"></ae-icon>{{ terminText(t) }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </ae-card>
  `,
  data() {
    return {
      ansicht: 'meine',
      ansichten: [{ id: 'meine', label: 'Meine' }, { id: 'offen', label: 'Offen' }, { id: 'alle', label: 'Alle' }],
      neu: { titel: '', ziel: 'event|' },
      aktiv: null,
      entwurf: null,
      fehler: '',
    }
  },
  created() {
    if (!this.event.aufgaben.some(function (a) { return a.meine })) this.ansicht = 'offen'
    if (!this.darfEventAufgaben) this.neu.ziel = this.zielOptionen.length ? this.zielOptionen[0].wert : 'event|'
  },
  mounted() {
    this.ausAdresse()
  },
  watch: {
    punktId: 'ausAdresse',
  },
  computed: {
    darfEventAufgaben() {
      return this.event.ich.eventweit.aufgaben >= 2
    },
    darfAnlegen() {
      return this.zielOptionen.length > 0
    },
    liste() {
      var ansicht = this.ansicht
      var aktiv = this.aktiv
      return this.event.aufgaben.filter(function (a) {
        if (a.id === aktiv) return true
        if (ansicht === 'meine') return a.meine
        if (ansicht === 'offen') return a.status === 'offen'
        return true
      }).slice().sort(function (a, b) {
        if (a.status !== b.status) return a.status === 'offen' ? -1 : 1
        return (a.faellig || '9999').localeCompare(b.faellig || '9999')
      })
    },
    leerText() {
      if (this.ansicht === 'meine') return 'Ihnen ist keine Aufgabe zugewiesen.'
      if (this.ansicht === 'offen') return 'Keine offenen Aufgaben.'
      return 'Noch keine Aufgaben.'
    },
    /* Wo neue Aufgaben hängen dürfen: am Event (Recht für das ganze Event) oder an Punkten mit Aufgaben-Recht */
    zielOptionenAlle() {
      var liste = [{ wert: 'event|', text: 'Gehört zu: Event', darf: this.darfEventAufgaben }]
      this.event.programmpunkte.forEach(function (p) {
        var text = wochentagText(p.start.slice(0, 10)) + ' ' + p.start.slice(11) + ' · ' + p.titel
        liste.push({ wert: 'programmpunkt|' + p.id, text: 'Gehört zu: ' + text, darf: p.rechtAufgaben >= 2 })
        if (p.ablauf) {
          p.ablauf.schritte.forEach(function (s) {
            liste.push({ wert: 'schritt|' + p.id + '|' + s.id, text: '    Schritt: ' + (s.zeit ? s.zeit + ' ' : '') + s.titel, darf: p.rechtAufgaben >= 2 })
          })
        }
      })
      return liste.filter(function (z) { return z.darf })
    },
    zielOptionen() {
      return this.zielOptionenAlle.filter(function (z) { return !z.wert.startsWith('schritt|') })
    },
  },
  methods: {
    datumText: datumText,
    /* Material einer Aufgabe folgt dem Programmpunkt der Aufgabe, sonst dem Recht für das ganze Event */
    materialDarf(a) {
      var punkt = a.ziel.punktId ? this.event.programmpunkte.find(function (p) { return p.id === a.ziel.punktId }) : null
      return punkt ? punkt.rechtMaterial >= 2 : this.event.ich.eventweit.material >= 2
    },
    anzahl(ansicht) {
      return this.event.aufgaben.filter(function (a) {
        if (ansicht === 'meine') return a.meine && a.status === 'offen'
        if (ansicht === 'offen') return a.status === 'offen'
        return true
      }).length
    },
    metaText(a) {
      var teile = []
      var wer = zuweisungText(this.event, { personen: a.personen, teams: a.teams, alle: false, zusatz: '' })
      if (wer) teile.push(wer)
      if (a.faellig) teile.push('fällig ' + datumText(a.faellig + 'T12:00:00'))
      if (a.ziel.art !== 'event') teile.push(a.ziel.titel)
      var material = this.event.material.filter(function (m) { return m.ziel.art === 'aufgabe' && m.ziel.aufgabeId === a.id }).length
      if (material) teile.push(material + ' Material')
      return teile.join(' · ')
    },
    terminText(t) {
      return wochentagText(t.start.slice(0, 10)) + ' ' + datumText(t.start.slice(0, 10) + 'T12:00:00') + ', ' + t.start.slice(11) + (t.ende ? '–' + t.ende.slice(11) : '') + (t.ort ? ' · ' + t.ort : '')
    },
    zielWert(ziel) {
      if (ziel.art === 'event') return 'event|'
      if (ziel.art === 'schritt') return 'schritt|' + ziel.punktId + '|' + ziel.schrittId
      return 'programmpunkt|' + ziel.punktId
    },
    zielAusWert(wert) {
      var teile = wert.split('|')
      return { art: teile[0], punktId: teile[1] || '', schrittId: teile[2] || '' }
    },
    ausAdresse() {
      var id = this.punktId
      var a = this.event.aufgaben.find(function (x) { return x.id === id })
      if (!a) return
      this.ansicht = 'alle'
      this.oeffnen(a, true)
      var komponente = this
      this.$nextTick(function () {
        var el = komponente.$refs['aufgabe-' + id]
        if (el && el[0]) el[0].scrollIntoView({ block: 'center' })
      })
    },
    async oeffnen(a, auchLesen) {
      if (this.aktiv === a.id) return
      if (a.recht < 2 && !auchLesen) return
      if (this.aktiv) {
        try {
          await this.fertig()
        } catch (fehler) {
          return
        }
      }
      if (a.recht < 2) return
      this.fehler = ''
      this.aktiv = a.id
      this.entwurf = {
        titel: a.titel,
        beschreibung: a.beschreibung,
        faellig: a.faellig,
        ziel: this.zielWert(a.ziel),
        wer: { personen: a.personen.slice(), teams: a.teams.slice(), alle: false, zusatz: '' },
        termine: a.termine.map(function (t) {
          return { id: t.id, schluessel: t.id, datum: t.start.slice(0, 10), von: t.start.slice(11), bis: t.ende ? t.ende.slice(11) : '', ort: t.ort, notiz: t.notiz }
        }),
      }
      this.original = JSON.stringify(this.entwurf)
    },
    terminHinzufuegen() {
      var letzter = this.entwurf.termine[this.entwurf.termine.length - 1]
      this.entwurf.termine.push({ id: '', schluessel: 'neu-' + Date.now(), datum: letzter ? letzter.datum : heuteIso(), von: letzter ? letzter.von : '19:00', bis: '', ort: letzter ? letzter.ort : '', notiz: '' })
    },
    /* Speichert nur, wenn sich etwas geändert hat; bei Fehlern bleibt die Aufgabe offen */
    async fertig() {
      var e = this.entwurf
      var id = this.aktiv
      if (!e) return
      if (JSON.stringify(e) === this.original) {
        this.aktiv = null
        this.entwurf = null
        return
      }
      try {
        await this.eventAktion('aufgabe_speichern', {
          id: id,
          titel: e.titel.trim(),
          beschreibung: e.beschreibung,
          faellig: e.faellig,
          personen: e.wer.personen,
          teams: e.wer.teams,
          ziel: this.zielAusWert(e.ziel),
          termine: e.termine.map(function (t) {
            var ende = ''
            if (t.bis) ende = (t.bis <= t.von ? zeitpunktPlus(t.datum, 24 * 60).slice(0, 10) : t.datum) + 'T' + t.bis
            return { id: t.id, start: t.datum + 'T' + t.von, ende: ende, ort: t.ort, notiz: t.notiz }
          }),
        })
        this.aktiv = null
        this.entwurf = null
      } catch (fehler) {
        this.fehler = fehler.message
        throw fehler
      }
    },
    async anlegen() {
      if (!this.neu.titel.trim()) return
      try {
        var antwort = await this.eventAktion('aufgabe_speichern', {
          id: '', titel: this.neu.titel.trim(), beschreibung: '', faellig: '', personen: [], teams: [], termine: [], ziel: this.zielAusWert(this.neu.ziel),
        })
        this.neu.titel = ''
        if (this.ansicht === 'meine') this.ansicht = 'offen'
        var neu = this.event.aufgaben.find(function (a) { return a.id === antwort.aufgabeId })
        if (neu) this.oeffnen(neu)
      } catch (fehler) {
        /* Meldung zeigt der Eventbereich */
      }
    },
    async umschalten(a) {
      await this.eventAktion('aufgabe_status', { id: a.id, erledigt: a.status !== 'erledigt' }).catch(function () {})
    },
    async loeschen(a) {
      if (!confirm('Aufgabe «' + a.titel + '» löschen? Ihr Material wird mit entfernt.')) return
      try {
        await this.eventAktion('aufgabe_loeschen', { id: a.id })
        this.aktiv = null
        this.entwurf = null
      } catch (fehler) {
        /* Meldung zeigt der Eventbereich */
      }
    },
  },
})
