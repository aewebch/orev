/* Auswertungsbericht der Nachbereitung (Text aus js/seiten/bericht-text.js). Zwei Ansichten: «Seiten» zeigt A4-Seiten
   mit Titelblatt, Inhaltsverzeichnis mit Seitenzahlen, Kopf- und Fusszeile (so wird auch gedruckt), «Lesen» einen
   fortlaufenden Text für das Handy. Auf Wunsch sind Behauptung, Begründung und Beleg farbig hervorgehoben. */
var BERICHT_TOC_PRO_SEITE = 30

app.directive('bericht-block', {
  mounted(el, bindung) {
    el.appendChild(berichtBlockElement(bindung.value))
  },
  updated(el, bindung) {
    if (bindung.value === bindung.oldValue) return
    el.textContent = ''
    el.appendChild(berichtBlockElement(bindung.value))
  },
})

app.component('event-bericht', {
  props: { event: { type: Object, required: true } },
  template: `
    <div :class="['bericht', dreischritt ? 'bericht--dreischritt' : '']">
      <div class="bericht-leiste nicht-drucken">
        <span class="stufen" role="radiogroup" aria-label="Ansicht">
          <button v-for="a in ansichten" :key="a.id" type="button" role="radio" :aria-checked="ansicht === a.id" :class="['stufe', 'reihe', ansicht === a.id ? 'stufe--aktiv' : '']" @click="ansicht = a.id"><ae-icon :name="a.icon" :size="16"></ae-icon>{{ a.label }}</button>
        </span>
        <span class="dehnen"></span>
        <hilfe-punkt thema="bericht"></hilfe-punkt>
        <ae-icon-button label="Drucken oder als PDF sichern" variant="flat" @click="drucken"><ae-icon name="printer" :size="18"></ae-icon></ae-icon-button>
        <pillen-menue label="Weitere Aktionen" rechts>
          <button type="button" class="menue-eintrag menue-eintrag--icon" @click="dreischritt = !dreischritt"><ae-icon :name="dreischritt ? 'check' : 'sparkles'" :size="16"></ae-icon>Dreischritt hervorheben</button>
          <button type="button" class="menue-eintrag menue-eintrag--icon" @click="drucken"><ae-icon name="printer" :size="16"></ae-icon>Drucken oder als PDF sichern</button>
        </pillen-menue>
      </div>

      <div v-if="fehlt.length" class="bericht-hinweis nicht-drucken">
        <ae-icon name="info" :size="18"></ae-icon>
        <span>Der Bericht wird aussagekräftiger mit: <template v-for="(f, i) in fehlt" :key="f.id"><router-link :to="'/event/' + event.id + '/' + f.bereich" class="text-link">{{ f.text }}</router-link>{{ i < fehlt.length - 1 ? ', ' : '.' }}</template></span>
      </div>

      <p v-if="dreischritt" class="bericht-legende nicht-drucken">
        <span class="b-satz b-satz--these">Behauptung</span> <span class="b-satz b-satz--begruendung">Begründung</span> <span class="b-satz b-satz--beleg">Beleg</span>
      </p>

      <div ref="messen" class="bericht-messen" aria-hidden="true"></div>

      <div v-show="ansicht === 'seiten'" ref="rahmen" class="bericht-rahmen">
        <div class="bericht-skala" :style="{ height: skalaHoehe ? skalaHoehe + 'px' : null }">
          <div ref="innen" class="bericht-skala__innen" :style="{ transform: faktor < 1 ? 'scale(' + faktor + ')' : null }">
            <section class="bericht-seite bericht-seite--titel">
              <div class="bericht-titel__band"></div>
              <p class="bericht-titel__kicker">Auswertungsbericht</p>
              <h1 class="bericht-titel__titel">{{ event.titel }}</h1>
              <p v-if="event.thema" class="bericht-titel__thema">{{ event.thema }}</p>
              <dl class="bericht-titel__angaben">
                <dt>Art</dt><dd>{{ event.typ === 'camp' ? 'Camp' : 'Event' }}</dd>
                <dt>Zeitraum</dt><dd>{{ zeitraumText(event.startDatum, event.endDatum) }}</dd>
                <template v-if="event.ort"><dt>Ort</dt><dd>{{ event.ort }}</dd></template>
                <template v-if="bericht.verantwortung"><dt>Verantwortung</dt><dd>{{ bericht.verantwortung }}</dd></template>
                <dt>Stand</dt><dd>{{ bericht.stand }}</dd>
              </dl>
              <p class="bericht-titel__fuss">Erstellt mit Orev aus den Angaben der Nachbereitung</p>
            </section>
            <section v-for="(teil, t) in tocSeiten" :key="'toc' + t" class="bericht-seite">
              <header class="bericht-seite__kopf"><span>{{ event.titel }}</span><span>Auswertungsbericht</span></header>
              <div class="bericht-seite__inhalt">
                <h2 v-if="t === 0" class="b-h1 bericht-toc__titel">Inhalt</h2>
                <ol class="bericht-toc">
                  <li v-for="e in teil" :key="e.id" :class="['bericht-toc__eintrag', 'bericht-toc__eintrag--' + e.art]">
                    <span class="bericht-toc__nr">{{ e.nummer }}</span><span class="bericht-toc__text">{{ e.text }}</span><span class="bericht-toc__punkte"></span><span class="bericht-toc__seite">{{ e.seite }}</span>
                  </li>
                </ol>
              </div>
              <footer class="bericht-seite__fuss">Seite {{ t + 2 }} von {{ seitenTotal }}</footer>
            </section>
            <section v-for="(seite, i) in seiten" :key="'s' + i + '-' + version" class="bericht-seite">
              <header class="bericht-seite__kopf"><span>{{ event.titel }}</span><span>Auswertungsbericht</span></header>
              <div class="bericht-seite__inhalt">
                <div v-for="(b, j) in seite" :key="j" v-bericht-block="b"></div>
              </div>
              <footer class="bericht-seite__fuss">Seite {{ i + 2 + tocSeiten.length }} von {{ seitenTotal }}</footer>
            </section>
          </div>
        </div>
      </div>

      <article v-if="ansicht === 'lesen'" class="bericht-lesen">
        <p class="bericht-titel__kicker">Auswertungsbericht · Stand {{ bericht.stand }}</p>
        <h1 class="bericht-lesen__titel">{{ event.titel }}</h1>
        <nav class="bericht-lesen__inhalt" aria-label="Inhalt">
          <button v-for="e in inhalt.filter(function (x) { return x.art === 'h1' })" :key="e.id" type="button" class="text-link" @click="springen(e.id)">{{ e.nummer ? e.nummer + ' ' : '' }}{{ e.text }}</button>
        </nav>
        <div v-for="(b, j) in bericht.bloecke" :key="j + '-' + version" v-bericht-block="b"></div>
      </article>
    </div>
  `,
  data() {
    var schmal = window.matchMedia('(max-width: 799px)').matches
    return {
      ansicht: schmal ? 'lesen' : 'seiten',
      ansichten: [{ id: 'seiten', label: 'Seiten', icon: 'file-text' }, { id: 'lesen', label: 'Lesen', icon: 'list' }],
      dreischritt: false, seiten: [], seiteVon: {}, faktor: 1, skalaHoehe: 0, version: 0,
    }
  },
  computed: {
    bericht() {
      return berichtErstellen(this.event)
    },
    inhalt() {
      var seiteVon = this.seiteVon
      return this.bericht.bloecke.filter(function (b) { return b.art === 'h1' || b.art === 'h2' }).map(function (b) {
        return { id: b.id, art: b.art, nummer: b.nummer, text: b.text, seite: seiteVon[b.id] || '' }
      })
    },
    tocSeiten() {
      var teile = []
      for (var i = 0; i < this.inhalt.length; i += BERICHT_TOC_PRO_SEITE) teile.push(this.inhalt.slice(i, i + BERICHT_TOC_PRO_SEITE))
      return teile.length ? teile : [[]]
    },
    seitenTotal() {
      return 1 + this.tocSeiten.length + this.seiten.length
    },
    fehlt() {
      var v = this.bericht.vollstaendig
      var liste = []
      if (!v.ziele) liste.push({ id: 'ziele', bereich: 'reflexion', text: 'Zielüberprüfung' })
      if (!v.bewertungen) liste.push({ id: 'bewertungen', bereich: 'reflexion', text: 'Bewertungen von Ort, Tagen und Programm' })
      if (!v.wirkungsmodell) liste.push({ id: 'wm', bereich: 'wirkungsmodell', text: 'Wirkungsmodell mit beurteilten Outcomes' })
      if (!v.feedback) liste.push({ id: 'feedback', bereich: 'feedback', text: 'Rückmeldungen' })
      return liste
    },
  },
  watch: {
    bericht() {
      this.$nextTick(this.umbrechen)
    },
    ansicht(neu) {
      if (neu === 'seiten') this.$nextTick(this.skalieren)
    },
  },
  mounted() {
    var komponente = this
    this.beobachter = new ResizeObserver(function () { komponente.skalieren() })
    this.beobachter.observe(this.$refs.rahmen)
    this.umbrechen()
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { komponente.umbrechen() })
    this.druckEnde = function () {
      var link = document.getElementById('druck-bericht')
      if (link) link.remove()
      if (komponente.ansichtVorDruck) {
        komponente.ansicht = komponente.ansichtVorDruck
        komponente.ansichtVorDruck = ''
      }
    }
    window.addEventListener('afterprint', this.druckEnde)
  },
  beforeUnmount() {
    if (this.beobachter) this.beobachter.disconnect()
    window.removeEventListener('afterprint', this.druckEnde)
    this.druckEnde()
  },
  methods: {
    zeitraumText: zeitraumText,
    /* Seiten neu aufteilen; die Höhe des Seiteninhalts liefert ein Probe-Element mit der Höhe aus dem Stil */
    umbrechen() {
      var messen = this.$refs.messen
      if (!messen) return
      var probe = document.createElement('div')
      probe.className = 'bericht-seite__inhalt'
      messen.appendChild(probe)
      var hoehe = probe.getBoundingClientRect().height
      messen.textContent = ''
      var seiten = berichtUmbrechen(this.bericht.bloecke, messen, hoehe)
      var start = 2 + this.tocSeiten.length
      var seiteVon = {}
      seiten.forEach(function (seite, i) {
        seite.forEach(function (b) { if (b.id && !seiteVon[b.id]) seiteVon[b.id] = start + i })
      })
      this.seiten = seiten
      this.seiteVon = seiteVon
      this.version++
      this.$nextTick(this.skalieren)
    },
    skalieren() {
      var rahmen = this.$refs.rahmen
      var innen = this.$refs.innen
      if (!rahmen || !innen || this.ansicht !== 'seiten') return
      var seite = innen.querySelector('.bericht-seite')
      if (!seite) return
      this.faktor = Math.min(1, rahmen.clientWidth / seite.offsetWidth)
      this.skalaHoehe = innen.offsetHeight * this.faktor
    },
    springen(id) {
      var ziel = document.getElementById('bericht-' + id)
      if (ziel) ziel.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    async drucken() {
      if (this.ansicht !== 'seiten') {
        this.ansichtVorDruck = this.ansicht
        this.ansicht = 'seiten'
        await this.$nextTick()
        this.umbrechen()
        await this.$nextTick()
      }
      if (document.getElementById('druck-bericht')) {
        window.print()
        return
      }
      var link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'css/druck-bericht.css?v=' + zustand.version
      link.id = 'druck-bericht'
      link.onload = function () { requestAnimationFrame(function () { window.print() }) }
      document.head.appendChild(link)
    },
  },
})
