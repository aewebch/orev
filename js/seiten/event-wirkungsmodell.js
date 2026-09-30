/* Wirkungsmodell als Bericht der Nachbereitung (Aufbau nach dem Quali-Tool von DOJ/AFAJ):
   Grundlagen → Umsetzung → Leistungen (Outputs) → Wirkungen bei Zielgruppen (Outcomes) → Wirkungen im Umfeld (Impacts).
   Breite Bildschirme zeigen alle Spalten mit Pfeilen (Überfahren hebt die ganze Wirkungskette hervor), mittlere
   scrollen waagrecht, das Handy zeigt eine Spalte mit Pillen zum Wechseln und Verbindungen als Chips.
   Bearbeitet wird direkt in der Karte; Pfeile setzt man, indem man bei einer Leistung oder einem Outcome «Pfeile setzen»
   wählt und die Ziele in der nächsten Spalte antippt. Drucken ergibt ein A3-Querformat. */
var WM_SPALTEN = [
  { id: 'grundlagen', titel: 'Grundlagen', kurz: 'Grundlagen', farbe: 'blau',
    info: 'Worauf das Event aufbaut: Auftrag und Beschlüsse, Leitbild, Konzept, Zielgruppe, Zeitraum. Wenn möglich mit Quelle.' },
  { id: 'umsetzung', titel: 'Umsetzung', kurz: 'Umsetzung', farbe: 'tuerkis',
    info: 'Wer das Event trägt und wie: Leitung, Teams, Zusammenarbeit, Ressourcen (Finanzen, Personen, Infrastruktur) und Abläufe.' },
  { id: 'leistungen', titel: 'Leistungen (Outputs)', kurz: 'Leistungen', farbe: 'gruen', ziel: 'outcomes',
    info: 'Was die Zielgruppen konkret sehen, erleben und nutzen können. Jede Leistung soll in mindestens eine Wirkung bei den Zielgruppen münden.' },
  { id: 'outcomes', titel: 'Wirkungen bei Zielgruppen (Outcomes)', kurz: 'Outcomes', farbe: 'orange', ziel: 'impacts',
    info: 'Was sich bei den Zielgruppen verändern soll (Haltung, Wissen, Verhalten). Daran wird die Arbeit gemessen: erreichbar formulieren und mit einem Indikator versehen. Jedes Outcome trägt zu einer Wirkung im Umfeld bei.' },
  { id: 'impacts', titel: 'Wirkungen im weiteren Umfeld (Impacts)', kurz: 'Impacts', farbe: 'rot',
    info: 'Wozu das Event im weiteren Umfeld beiträgt. Das lässt sich nicht allein bewirken; die Impacts dienen als Orientierung für die Outcomes.' },
]
var WM_STATUS = {
  grundlagen: [{ id: 'etabliert', label: 'Etabliert' }, { id: 'aufbau', label: 'Im Aufbau' }, { id: 'klaerung', label: 'Klärung nötig' }],
  wirkung: [{ id: 'erreicht', label: 'Erreicht' }, { id: 'teilweise', label: 'Teilweise' }, { id: 'nicht', label: 'Nicht erreicht' }, { id: 'offen', label: 'Offen' }],
}
var WM_SCHMAL = '(max-width: 799px)'

function wmStatusListe(spalte) {
  return spalte === 'grundlagen' || spalte === 'umsetzung' ? WM_STATUS.grundlagen : WM_STATUS.wirkung
}

app.component('event-wirkungsmodell', {
  props: { event: { type: Object, required: true } },
  inject: ['eventAktion'],
  template: `
    <div :class="['wm', vorschau ? 'wm--vorschau' : '', druck ? 'wm--druck' : '']">
      <div class="wm__kopf">
        <div class="dehnen">
          <p class="seite__kicker">Bericht · Wirkungsmodell</p>
          <input v-if="darf && !vorschau" v-model="kopf.titel" class="nahtlos wm__titel" maxlength="200" :placeholder="'Wirkungsmodell ' + event.titel" aria-label="Titel" @blur="kopfSpeichern">
          <h2 v-else class="wm__titel">{{ modell.titel || 'Wirkungsmodell ' + event.titel }}</h2>
          <div class="wm__meta">
            <span class="reihe">Verantwortung:
              <input v-if="darf && !vorschau" v-model="kopf.verantwortung" class="nahtlos wm__verantwortung" maxlength="200" placeholder="Name" aria-label="Verantwortung" @blur="kopfSpeichern">
              <strong v-else>{{ modell.verantwortung || '–' }}</strong>
            </span>
            <span v-if="modell.geaendertAm">Zuletzt bearbeitet: {{ datumText(modell.geaendertAm) }}</span>
          </div>
        </div>
        <div class="reihe nicht-drucken wm__aktionen">
          <ae-button v-if="darf && !vorschau" variant="secondary" icon="sparkles" title="Aus dem Event übernehmen" @click="uebernehmen"><span class="nur-desktop">Aus dem Event übernehmen</span><span class="nur-mobil">Übernehmen</span></ae-button>
          <ae-button v-if="vorschau" variant="tertiary" icon="x" @click="vorschau = false">Vorschau schliessen</ae-button>
          <hilfe-punkt thema="wirkungsmodell"></hilfe-punkt>
          <pillen-menue label="Weitere Aktionen" rechts>
            <button v-if="!vorschau" type="button" class="menue-eintrag menue-eintrag--icon" @click="vorschau = true"><ae-icon name="maximize-2" :size="16"></ae-icon>Vorschau</button>
            <button type="button" class="menue-eintrag menue-eintrag--icon" @click="drucken"><ae-icon name="printer" :size="16"></ae-icon>A3 drucken oder als PDF sichern</button>
          </pillen-menue>
        </div>
      </div>

      <ae-alert v-if="meldung" tone="success" class="nicht-drucken">{{ meldung }}</ae-alert>

      <div v-if="verbinden" class="wm__verbinden nicht-drucken" role="status">
        <ae-icon name="arrow-right" :size="18"></ae-icon>
        <span class="dehnen">Pfeile von <strong>{{ nummer(verbinden) }} {{ eintrag(verbinden).titel }}</strong> setzen: Tippen Sie auf {{ zielSpalte(verbinden).kurz }}.</span>
        <ae-button size="sm" @click="verbinden = null">Fertig</ae-button>
      </div>

      <div v-if="darf && !vorschau && modell.hinweise.length" class="wm__hinweise nicht-drucken">
        <pillen-menue :text="modell.hinweise.length + (modell.hinweise.length === 1 ? ' Hinweis' : ' Hinweise') + ' zur Methode'" panel>
          <button v-for="(h, i) in modell.hinweise" :key="i" type="button" class="menue-eintrag" @click="zeigen(h.id)">{{ h.text }}</button>
        </pillen-menue>
      </div>

      <div v-if="schmal && !druck" class="wm__wahl nicht-drucken" role="tablist" aria-label="Spalte">
        <button v-for="s in spalten" :key="s.id" type="button" role="tab" :aria-selected="aktiveSpalte === s.id" :class="['wm__wahl-knopf', 'farbe--' + s.farbe, aktiveSpalte === s.id ? 'wm__wahl-knopf--aktiv' : '']" @click="aktiveSpalte = s.id">
          {{ s.kurz }} <span class="wm__anzahl">{{ inSpalte(s.id).length }}</span>
        </button>
      </div>

      <div ref="brett" class="wm__brett" @scroll="neuZeichnen">
        <svg v-if="!schmal || druck" class="wm__pfeile" :width="flaeche.w" :height="flaeche.h" aria-hidden="true">
          <defs>
            <marker v-for="s in ['leistungen', 'outcomes']" :key="s" :id="'wm-spitze-' + s" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" :class="'wm__spitze--' + s"></path>
            </marker>
          </defs>
          <path v-for="p in pfade" :key="p.id" :d="p.d" :class="['wm__pfad', 'wm__pfad--' + p.spalte, pfadKlasse(p)]" :marker-end="'url(#wm-spitze-' + p.spalte + ')'"></path>
        </svg>

        <section v-for="s in sichtbareSpalten" :key="s.id" :class="['wm__spalte', 'farbe--' + s.farbe]" :aria-label="s.titel">
          <header class="wm__spaltenkopf">
            <h3>{{ s.titel }}</h3>
            <pillen-menue icon="info" :label="'Was gehört zu ' + s.kurz + '?'" rechts class="nicht-drucken">
              <p class="wm__info">{{ s.info }}</p>
            </pillen-menue>
          </header>

          <div class="wm__karten">
            <article v-for="e in inSpalte(s.id)" :key="e.id" :data-id="e.id" :tabindex="darf && !vorschau ? 0 : -1"
              :class="['wm__karte', kartenKlasse(e)]" @mouseenter="hover = e.id" @mouseleave="hover = null" @click="klick(e)" @keydown.enter.self="klick(e)">
              <template v-if="aktiv === e.id">
                <div class="reihe" @click.stop>
                  <span v-if="e.nummer" class="wm__nummer">{{ e.nummer }}</span>
                  <input v-model="entwurf.titel" v-fokus class="nahtlos nahtlos--fett dehnen" maxlength="300" placeholder="Titel" aria-label="Titel" @keydown.enter.prevent="fertig">
                  <pillen-menue label="Weitere Aktionen" rechts>
                    <button type="button" class="menue-eintrag" @click="verschieben(e, -1)">Nach oben</button>
                    <button type="button" class="menue-eintrag" @click="verschieben(e, 1)">Nach unten</button>
                    <button type="button" class="menue-eintrag menue-eintrag--gefahr" @click="loeschen(e)">Eintrag löschen</button>
                  </pillen-menue>
                </div>
                <textarea v-model="entwurf.text" v-wachsen class="nahtlos" rows="2" maxlength="10000" placeholder="Beschreibung …" aria-label="Beschreibung" @click.stop></textarea>
                <label v-if="e.spalte !== 'grundlagen' && e.spalte !== 'umsetzung'" class="wm__indikator" @click.stop>
                  <ae-icon name="target" :size="14"></ae-icon>
                  <input v-model="entwurf.indikator" class="nahtlos" maxlength="2000" placeholder="Indikator: woran erkennen wir die Erfüllung?" aria-label="Indikator">
                </label>
                <div class="wm__status" role="radiogroup" aria-label="Stand" @click.stop>
                  <button v-for="st in statusListe(e.spalte)" :key="st.id" type="button" role="radio" :aria-checked="entwurf.status === st.id"
                    :class="['wm__status-knopf', 'wm__status--' + st.id, entwurf.status === st.id ? 'wm__status-knopf--aktiv' : '']" @click="entwurf.status = entwurf.status === st.id ? '' : st.id">{{ st.label }}</button>
                </div>
                <div class="reihe reihe--verteilt" @click.stop>
                  <ae-button v-if="s.ziel" size="sm" variant="secondary" icon="arrow-right" @click="verbindenStarten(e)">Pfeile setzen</ae-button>
                  <span v-else></span>
                  <ae-button size="sm" @click="fertig">Fertig</ae-button>
                </div>
              </template>
              <template v-else>
                <div class="wm__karten-kopf">
                  <span v-if="e.nummer" class="wm__nummer">{{ e.nummer }}</span>
                  <strong class="dehnen">{{ e.titel }}</strong>
                  <span v-if="e.status" :class="['wm__status-chip', 'wm__status--' + e.status]">{{ statusText(e) }}</span>
                  <span v-if="verbinden && zielSpalte(verbinden).id === e.spalte" :class="['wm__verbunden', istVerbunden(verbinden, e.id) ? 'wm__verbunden--ja' : '']">
                    <ae-icon :name="istVerbunden(verbinden, e.id) ? 'check' : 'plus'" :size="14"></ae-icon>
                  </span>
                </div>
                <p v-if="e.text" class="wm__text">{{ e.text }}</p>
                <p v-if="e.indikator" class="wm__indikator"><ae-icon name="target" :size="14"></ae-icon>{{ e.indikator }}</p>
                <div v-if="(schmal && !druck) && (ausgehend(e).length || eingehend(e).length)" class="wm__bezuege">
                  <button v-for="z in eingehend(e)" :key="'e' + z.id" type="button" class="chip chip--leise" @click.stop="zeigen(z.id)">← {{ z.nummer }}</button>
                  <button v-for="z in ausgehend(e)" :key="'a' + z.id" type="button" class="chip chip--leise" @click.stop="zeigen(z.id)">→ {{ z.nummer }}</button>
                </div>
              </template>
            </article>
            <p v-if="!inSpalte(s.id).length && (!darf || vorschau)" class="leise wm__leer">Noch keine Einträge.</p>
          </div>

          <input v-if="darf && !vorschau && !verbinden" v-model="neu[s.id]" class="nahtlos wm__neu nicht-drucken" maxlength="300" :placeholder="'+ ' + s.kurz" :aria-label="'Eintrag zu ' + s.kurz + ' hinzufügen'" @keydown.enter.prevent="anlegen(s.id)">
        </section>
      </div>
      <p class="leise wm__quelle">Aufbau nach dem Wirkungsmodell des Quali-Tools (DOJ/AFAJ).</p>
    </div>
  `,
  data() {
    return {
      spalten: WM_SPALTEN,
      kopf: { titel: '', verantwortung: '' },
      neu: { grundlagen: '', umsetzung: '', leistungen: '', outcomes: '', impacts: '' },
      aktiv: null,
      entwurf: null,
      original: '',
      verbinden: null,
      hover: null,
      vorschau: false,
      druck: false,
      schmal: false,
      aktiveSpalte: 'leistungen',
      pfade: [],
      flaeche: { w: 0, h: 0 },
      meldung: '',
      zeichnenGeplant: false,
      markiert: null,
    }
  },
  computed: {
    darf() {
      return this.event.ich.recht.reflexion >= 2
    },
    modell() {
      return this.event.wirkungsmodell
    },
    sichtbareSpalten() {
      if (!this.schmal || this.druck) return this.spalten
      var aktiv = this.aktiveSpalte
      return this.spalten.filter(function (s) { return s.id === aktiv })
    },
    /* Ganze Kette einer Karte (vorwärts und rückwärts), für die Hervorhebung beim Überfahren */
    kette() {
      var start = this.hover
      if (!start || this.aktiv) return null
      var verbindungen = this.modell.verbindungen
      var menge = {}
      menge[start] = true
      function folgen(id, richtung) {
        verbindungen.forEach(function (v) {
          var von = richtung > 0 ? v.von : v.zu
          var zu = richtung > 0 ? v.zu : v.von
          if (von === id && !menge[zu]) {
            menge[zu] = true
            folgen(zu, richtung)
          }
        })
      }
      folgen(start, 1)
      folgen(start, -1)
      return menge
    },
  },
  watch: {
    'event.wirkungsmodell': {
      immediate: true,
      handler(m) {
        var fokus = document.activeElement
        if (!fokus || !fokus.classList || !(fokus.classList.contains('wm__titel') || fokus.classList.contains('wm__verantwortung'))) {
          this.kopf = { titel: m.titel, verantwortung: m.verantwortung }
        }
        this.neuZeichnen()
      },
    },
    schmal: 'neuZeichnen',
    aktiveSpalte: 'neuZeichnen',
    vorschau: 'neuZeichnen',
  },
  mounted() {
    var komponente = this
    this.medien = window.matchMedia(WM_SCHMAL)
    this.schmal = this.medien.matches
    this.medienWechsel = function (e) { komponente.schmal = e.matches }
    this.medien.addEventListener('change', this.medienWechsel)
    this.beobachter = new ResizeObserver(function () { komponente.neuZeichnen() })
    this.beobachter.observe(this.$refs.brett)
    this.nachDruck = function () { komponente.druckEnde() }
    window.addEventListener('afterprint', this.nachDruck)
    this.taste = function (e) { if (e.key === 'Escape') { komponente.verbinden = null; komponente.vorschau = false } }
    document.addEventListener('keydown', this.taste)
    this.neuZeichnen()
  },
  updated() {
    this.neuZeichnen()
  },
  beforeUnmount() {
    this.medien.removeEventListener('change', this.medienWechsel)
    this.beobachter.disconnect()
    window.removeEventListener('afterprint', this.nachDruck)
    document.removeEventListener('keydown', this.taste)
  },
  methods: {
    datumText: datumText,
    statusListe: wmStatusListe,
    inSpalte(spalte) {
      return this.modell.eintraege.filter(function (e) { return e.spalte === spalte })
    },
    eintrag(id) {
      return this.modell.eintraege.find(function (e) { return e.id === id }) || { titel: '', spalte: '' }
    },
    nummer(id) {
      return this.eintrag(id).nummer
    },
    zielSpalte(id) {
      var spalte = this.eintrag(id).spalte
      var quelle = WM_SPALTEN.find(function (s) { return s.id === spalte })
      return WM_SPALTEN.find(function (s) { return quelle && s.id === quelle.ziel }) || { id: '', kurz: '' }
    },
    statusText(e) {
      var st = wmStatusListe(e.spalte).find(function (s) { return s.id === e.status })
      return st ? st.label : ''
    },
    istVerbunden(von, zu) {
      return this.modell.verbindungen.some(function (v) { return v.von === von && v.zu === zu })
    },
    ausgehend(e) {
      var modell = this
      return this.modell.verbindungen.filter(function (v) { return v.von === e.id }).map(function (v) { return modell.eintrag(v.zu) })
    },
    eingehend(e) {
      var modell = this
      return this.modell.verbindungen.filter(function (v) { return v.zu === e.id }).map(function (v) { return modell.eintrag(v.von) })
    },
    kartenKlasse(e) {
      var klassen = []
      if (this.aktiv === e.id) klassen.push('wm__karte--aktiv')
      else if (this.darf && !this.vorschau) klassen.push('wm__karte--editierbar')
      if (this.kette && !this.kette[e.id]) klassen.push('wm__karte--gedimmt')
      if (this.kette && this.kette[e.id]) klassen.push('wm__karte--kette')
      if (this.verbinden === e.id) klassen.push('wm__karte--quelle')
      if (this.verbinden && this.zielSpalte(this.verbinden).id === e.spalte) klassen.push('wm__karte--ziel')
      if (this.markiert === e.id) klassen.push('wm__karte--markiert')
      return klassen
    },
    pfadKlasse(p) {
      if (this.verbinden) return p.von === this.verbinden ? 'wm__pfad--aktiv' : 'wm__pfad--gedimmt'
      if (!this.kette) return ''
      return this.kette[p.von] && this.kette[p.zu] ? 'wm__pfad--aktiv' : 'wm__pfad--gedimmt'
    },
    /* Pfeile als Kurven von der rechten Kante der Quelle zur linken Kante des Ziels; nur wenn die Spalten nebeneinander stehen */
    neuZeichnen() {
      if (this.zeichnenGeplant) return
      this.zeichnenGeplant = true
      var komponente = this
      requestAnimationFrame(function () {
        komponente.zeichnenGeplant = false
        komponente.zeichnen()
      })
    },
    zeichnen() {
      var brett = this.$refs.brett
      if (!brett || (this.schmal && !this.druck)) {
        if (this.pfade.length) this.pfade = []
        return
      }
      var basis = brett.getBoundingClientRect()
      var spalteVon = {}
      this.modell.eintraege.forEach(function (e) { spalteVon[e.id] = e.spalte })
      var pfade = []
      this.modell.verbindungen.forEach(function (v) {
        var a = brett.querySelector('[data-id="' + v.von + '"]')
        var b = brett.querySelector('[data-id="' + v.zu + '"]')
        if (!a || !b) return
        var ra = a.getBoundingClientRect()
        var rb = b.getBoundingClientRect()
        if (rb.left < ra.right) return
        var x1 = ra.right - basis.left + brett.scrollLeft
        var y1 = ra.top + Math.min(ra.height / 2, 28) - basis.top + brett.scrollTop
        var x2 = rb.left - basis.left + brett.scrollLeft - 2
        var y2 = rb.top + Math.min(rb.height / 2, 28) - basis.top + brett.scrollTop
        var dx = Math.max(12, (x2 - x1) / 2)
        pfade.push({
          id: v.von + '>' + v.zu, von: v.von, zu: v.zu, spalte: spalteVon[v.von],
          d: 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' C' + (x1 + dx).toFixed(1) + ' ' + y1.toFixed(1) + ' ' + (x2 - dx).toFixed(1) + ' ' + y2.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1),
        })
      })
      var neu = JSON.stringify(pfade)
      if (neu !== JSON.stringify(this.pfade)) this.pfade = pfade
      if (this.flaeche.w !== brett.scrollWidth || this.flaeche.h !== brett.scrollHeight) this.flaeche = { w: brett.scrollWidth, h: brett.scrollHeight }
    },
    /* Zu einer Karte springen (Hinweise, Chips auf dem Handy) und sie kurz hervorheben */
    zeigen(id) {
      var komponente = this
      this.aktiveSpalte = this.eintrag(id).spalte
      this.markiert = id
      this.$nextTick(function () {
        var el = komponente.$refs.brett.querySelector('[data-id="' + id + '"]')
        if (el) el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
        setTimeout(function () { if (komponente.markiert === id) komponente.markiert = null }, 1600)
      })
    },
    async kopfSpeichern() {
      if (this.kopf.titel === this.modell.titel && this.kopf.verantwortung === this.modell.verantwortung) return
      await this.eventAktion('wirkung_kopf_speichern', this.kopf).catch(function () {})
    },
    async uebernehmen() {
      this.meldung = ''
      try {
        var antwort = await this.eventAktion('wirkung_uebernehmen', {})
        this.meldung = antwort.neu ? antwort.neu + (antwort.neu === 1 ? ' Eintrag' : ' Einträge') + ' aus Konzept, Personen, Programm und Zielüberprüfung übernommen. Ergänzen Sie Pfeile und Impacts.' : 'Es gibt nichts Neues zu übernehmen.'
      } catch (fehler) {
        /* Meldung zeigt der Eventbereich */
      }
    },
    klick(e) {
      if (this.verbinden) {
        if (this.zielSpalte(this.verbinden).id === e.spalte) this.umschalten(this.verbinden, e.id)
        return
      }
      if (!this.darf || this.vorschau || this.aktiv === e.id) return
      this.oeffnen(e)
    },
    async oeffnen(e) {
      if (this.aktiv && !(await this.fertig())) return
      this.aktiv = e.id
      this.entwurf = { titel: e.titel, text: e.text, indikator: e.indikator, status: e.status }
      this.original = JSON.stringify(this.entwurf)
    },
    async fertig() {
      if (!this.entwurf) return true
      var e = this.eintrag(this.aktiv)
      if (JSON.stringify(this.entwurf) !== this.original) {
        try {
          await this.eventAktion('wirkung_eintrag_speichern', Object.assign({ id: e.id, spalte: e.spalte }, this.entwurf))
        } catch (fehler) {
          return false
        }
      }
      this.aktiv = null
      this.entwurf = null
      return true
    },
    async anlegen(spalte) {
      var titel = this.neu[spalte].trim()
      if (!titel) return
      try {
        var antwort = await this.eventAktion('wirkung_eintrag_speichern', { id: '', spalte: spalte, titel: titel, text: '', indikator: '', status: '' })
        this.neu[spalte] = ''
        var neu = this.eintrag(antwort.eintragId)
        if (neu.id) this.oeffnen(neu)
      } catch (fehler) {
        /* Meldung zeigt der Eventbereich */
      }
    },
    async verschieben(e, richtung) {
      if (!(await this.fertig())) return
      await this.eventAktion('wirkung_eintrag_verschieben', { id: e.id, richtung: richtung }).catch(function () {})
    },
    async loeschen(e) {
      if (!confirm('Eintrag «' + (e.titel || e.nummer) + '» löschen? Seine Pfeile werden mit entfernt.')) return
      try {
        await this.eventAktion('wirkung_eintrag_loeschen', { id: e.id })
        this.aktiv = null
        this.entwurf = null
      } catch (fehler) {
        /* Meldung zeigt der Eventbereich */
      }
    },
    async verbindenStarten(e) {
      if (!(await this.fertig())) return
      this.verbinden = e.id
      this.aktiveSpalte = this.zielSpalte(e.id).id
    },
    async umschalten(von, zu) {
      await this.eventAktion('wirkung_verbindung', { von: von, zu: zu, an: !this.istVerbunden(von, zu) }).catch(function () {})
    },
    /* A3 quer: eigenes Druck-Stylesheet einhängen, alle Spalten nebeneinander in Druckbreite, Pfeile neu berechnen */
    drucken() {
      var komponente = this
      this.aktiv = null
      this.entwurf = null
      this.verbinden = null
      this.druck = true
      var link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'css/druck-a3.css?v=' + zustand.version
      link.id = 'druck-a3'
      link.onload = function () {
        komponente.$nextTick(function () {
          komponente.zeichnen()
          requestAnimationFrame(function () { window.print() })
        })
      }
      document.head.appendChild(link)
    },
    druckEnde() {
      var link = document.getElementById('druck-a3')
      if (link) link.remove()
      this.druck = false
      this.neuZeichnen()
    },
  },
})
