/* Eingebaute Dokumentation. Jedes Thema hat eine Kurzfassung (für die Hilfe-Punkte «?» direkt in der Oberfläche)
   und ausführliche Absätze für die Hilfe-Seite (/hilfe). Die Reihenfolge folgt dem Ablauf eines Events. */
var HILFE_GRUPPEN = [
  { titel: 'Erste Schritte', themen: ['orev', 'setup', 'navigation'] },
  { titel: 'Setup', themen: ['grunddaten', 'tage', 'konzept', 'zielgruppe', 'personen', 'teams', 'rollen', 'aufgaben', 'vorbereitungstermine', 'material'] },
  { titel: 'Durchführung', themen: ['programm', 'agenda', 'bausteine', 'ablaufplan'] },
  { titel: 'Nachbereitung', themen: ['reflexion', 'bewertungen', 'wirkungsmodell', 'feedback'] },
  { titel: 'Rund um Orev', themen: ['mitteilungen', 'suche', 'kalender', 'datenschutz'] },
]

var HILFE = {
  orev: {
    titel: 'Was ist Orev?',
    kurz: 'Orev hilft einem Leitungsteam, Events und Camps zu planen, durchzuführen und auszuwerten.',
    absaetze: [
      'Ein Event durchläuft drei Phasen: Im Setup legen Sie fest, worum es geht, wer mitmacht und was vorzubereiten ist. In der Durchführung planen Sie das Programm und die Abläufe. In der Nachbereitung werten Sie aus, was gelungen ist.',
      'Jede Person sieht nur, was sie laut ihren Rollen sehen darf. Was Sie selbst betrifft, finden Sie unter «Meine Aufgaben», in den Mitteilungen und auf Wunsch in Ihrem eigenen Kalender.',
    ],
  },
  setup: {
    titel: 'Das geführte Setup',
    kurz: 'Das Setup führt Schritt für Schritt durch alles, was ein Event vor dem Programm braucht. Sie können jeden Schritt auch direkt anwählen.',
    absaetze: [
      'Die Schritte: Grunddaten und Tage, Ziele und Zielgruppe, Personen und Teams, Rollen und Rechte, Aufgaben, Material. Ein Haken zeigt, was schon erledigt ist. Optionale Schritte können Sie überspringen.',
      'Mit «Weiter» gelangen Sie zum nächsten Schritt, am Schluss direkt zum Programm. Sie können das Setup jederzeit verlassen und später fortsetzen; alles wird sofort gespeichert.',
    ],
  },
  navigation: {
    titel: 'Sich zurechtfinden',
    kurz: 'Links (auf dem Handy unten) ist die Hauptnavigation, in einem Event oben die Phasen Setup, Durchführung und Nachbereitung.',
    absaetze: [
      'In der Leiste finden Sie die Übersicht Ihrer Events, Ihre Aufgaben über alle Events, die Suche sowie Mitteilungen und Konto. Ein roter Punkt zeigt ungelesene Mitteilungen.',
      'Viele Dinge bearbeiten Sie direkt dort, wo sie stehen: Tippen Sie auf einen Eintrag, ändern Sie ihn und schliessen Sie mit «Fertig». Weitere Einstellungen stecken in kleinen Pillen, seltene Aktionen im Menü «⋮».',
      'Die kleinen Kreise mit einem Fragezeichen erklären, was an dieser Stelle zu tun ist.',
    ],
  },
  grunddaten: {
    titel: 'Grunddaten',
    kurz: 'Titel, Art (Event oder Camp), Thema, Ort und Zeitraum. Der Zeitraum bestimmt die Tage des Events.',
    absaetze: [
      'Verkürzen Sie den Zeitraum, fallen Thema und Tagesverantwortung der wegfallenden Tage weg. Programmpunkte ausserhalb des Zeitraums bleiben erhalten, wenn sie zur Vorbereitung gehören (zum Beispiel ein Elternabend).',
    ],
  },
  tage: {
    titel: 'Tage und Tagesverantwortung',
    kurz: 'Jeder Tag kann ein Thema und eine Tagesverantwortung (TV) haben. Beides erscheint im Kopf der Agenda.',
    absaetze: [
      'Die Tagesverantwortung ist die Person, die an diesem Tag den Überblick behält. Sie wird benachrichtigt, wenn sich an «ihrem» Tag etwas ändert.',
    ],
  },
  konzept: {
    titel: 'Ziele nach SMART',
    kurz: 'Gute Ziele sind spezifisch, messbar, erreichbar, relevant und terminiert. Die Buchstaben S M A R T zeigen, was noch fehlt.',
    absaetze: [
      'Formulieren Sie, was sich bei den Teilnehmenden verändern soll, nicht was Sie anbieten. Beispiel: «Jede Person findet in einer Kleingruppe Anschluss» statt «Wir machen Kleingruppen».',
      'Das Messkriterium beschreibt, woran Sie die Erfüllung erkennen. In der Nachbereitung dient es als Vorschlag, wie Sie das Ziel überprüfen.',
    ],
  },
  zielgruppe: {
    titel: 'Zielgruppe',
    kurz: 'Für wen ist das Event? Beschreibung, Alter, erwartete Anzahl und besondere Bedürfnisse.',
    absaetze: ['Die Zielgruppe hilft beim Formulieren der Ziele und fliesst in den Bericht (Wirkungsmodell) ein.'],
  },
  personen: {
    titel: 'Personen',
    kurz: 'Alle, die im Event mitwirken. Personen brauchen kein Konto; mit Konto können sie sich anmelden und sehen ihre Einträge.',
    absaetze: [
      'Fügen Sie Personen aus dem Verzeichnis hinzu oder erfassen Sie sie neu. Mit einer E-Mail-Adresse können Sie sie einladen; der Link ist sieben Tage gültig.',
      'Eine Farbe pro Person hilft in der Agenda, Zuständigkeiten auf einen Blick zu sehen.',
    ],
  },
  teams: {
    titel: 'Teams',
    kurz: 'Teams bündeln Personen, zum Beispiel Küche oder Sanität. Wer einem Team angehört, ist für alles zuständig, was dem Team zugewiesen ist.',
    absaetze: ['Eine Team-Leitung verwaltet ihr Team und darf alles bearbeiten, was dem Team zugewiesen ist.'],
  },
  rollen: {
    titel: 'Rollen und Rechte',
    kurz: 'Eine Rolle legt pro Bereich fest, ob man nichts sieht, lesen oder bearbeiten darf. Hat jemand mehrere Rollen, gilt jeweils das höchste Recht.',
    absaetze: [
      'Die Event-Leitung darf alles. Für Programm, Ablaufpläne, Aufgaben und Material lassen sich Rechte auch nur für einzelne Programmpunkte vergeben, etwa damit die Küche nur ihre Punkte bearbeitet.',
      'Feedbacks sind vertraulich: Sie sieht nur, wer es geschrieben hat, die Event-Leitung und wer das Recht «Feedback» ausdrücklich erhält.',
    ],
  },
  aufgaben: {
    titel: 'Aufgaben',
    kurz: 'Aufgaben hängen am Event, an einem Programmpunkt oder an einem Ablaufschritt. Zuständige sehen sie unter «Meine Aufgaben» und können sie abhaken.',
    absaetze: ['Neue Aufgaben tippen Sie ein und bestätigen mit Enter. Ein Tippen auf die Aufgabe öffnet sie: Zuständige, Fälligkeit, Zuordnung, Vorbereitungstermine und Material.'],
  },
  vorbereitungstermine: {
    titel: 'Vorbereitungstermine',
    kurz: 'Treffen, an denen eine Aufgabe vorbereitet wird. Jeder Termin erscheint einzeln im Kalender-Abo der Zuständigen.',
    absaetze: ['Eine Aufgabe kann beliebig viele Termine haben, jeweils mit Ort und Notiz.'],
  },
  material: {
    titel: 'Material',
    kurz: 'Erfassen Sie Material dort, wo es gebraucht wird. Die Gesamtliste zählt gleiche Posten zusammen und zeigt, wer was mitnimmt.',
    absaetze: [
      '«2 Flipchart» und Enter ergibt zwei Flipcharts. Gleicher Name und gleiche Einheit werden in der Gesamtliste zusammengezählt, auch bei anderer Gross- und Kleinschreibung.',
      'Wer etwas mitnehmen soll, sieht es in seinem Kalender-Abo unter «Bitte mitnehmen».',
    ],
  },
  programm: {
    titel: 'Programm',
    kurz: 'Das Programm zeigt alle Programmpunkte als Woche, Tag oder Liste. Filtern Sie nach Teams und Personen oder nur nach Ihrem Programm.',
    absaetze: [
      'Ein Programmpunkt hat Zeit, Ort, Zuständige und eine Farbe. Wiederkehrende Punkte wie Zmorge kopieren Sie mit wenigen Klicks auf weitere Tage.',
      'Punkte der Phase «Vorbereitung» dürfen vor dem Event liegen, zum Beispiel ein Elternabend.',
    ],
  },
  agenda: {
    titel: 'Agenda bedienen',
    kurz: 'Ziehen Sie Punkte auf eine andere Zeit, ändern Sie die Länge am unteren Rand oder ziehen Sie über eine freie Zeit, um einen Punkt einzufügen.',
    absaetze: [
      'Auf dem Handy tippen Sie auf eine freie Zeit und wählen im Dialog, was Sie einfügen möchten.',
      'Unter «⋮» stellen Sie ein, welche Uhrzeiten die Agenda zeigt, zum Beispiel den ganzen Tag.',
    ],
  },
  bausteine: {
    titel: 'Bausteine und Vorlagen',
    kurz: 'Bausteine sind Vorlagen und bestehende Punkte, die Sie in die Agenda ziehen. Vorlagen nehmen den Ablaufplan mit.',
    absaetze: ['Einen Programmpunkt speichern Sie über «Als Vorlage speichern». Vorlagen stehen danach in allen Events zur Verfügung.'],
  },
  ablaufplan: {
    titel: 'Ablaufplan',
    kurz: 'Jeder Programmpunkt hat einen Ablaufplan: Leitung, Ziele und Schritte mit Zeit, Was, Methode, Anmerkung und Wer.',
    absaetze: [
      'Tippen Sie auf eine Zeile, um sie zu bearbeiten. «Wer» kann Personen, Teams oder «Alle» enthalten, dazu einen Zusatz wie «sonst EbA». Material und Aufgaben hängen Sie direkt an den Schritt.',
      'Der Ablaufplan lässt sich drucken.',
    ],
  },
  reflexion: {
    titel: 'Reflexion',
    kurz: 'Überprüfen Sie jedes Ziel, bewerten Sie Ort, Tage und Programmpunkte und halten Sie fest, wie das Team zusammengearbeitet hat.',
    absaetze: ['Die Zielüberprüfung übernimmt das Messkriterium als Vorschlag, wie geprüft wird. Der Erreichungsgrad fliesst in den Bericht ein.'],
  },
  bewertungen: {
    titel: 'Ort, Tage und Programmpunkte bewerten',
    kurz: 'Gut, mittel oder schwach, dazu eine Notiz. So sehen Sie beim nächsten Mal, was sich bewährt hat.',
    absaetze: ['Die Programmpunkte sind nach Tagen gruppiert; geöffnet ist der erste Tag, bei dem noch etwas fehlt.'],
  },
  wirkungsmodell: {
    titel: 'Wirkungsmodell (Bericht)',
    kurz: 'Das Wirkungsmodell zeigt, wie Ihre Leistungen zu Wirkungen bei den Teilnehmenden und im weiteren Umfeld beitragen.',
    absaetze: [
      'Fünf Spalten: Grundlagen, Umsetzung, Leistungen (L), Wirkungen bei Zielgruppen (O) und Wirkungen im weiteren Umfeld (I). Pfeile führen von Leistungen zu Wirkungen und von dort ins Umfeld.',
      '«Aus dem Event übernehmen» füllt vieles aus Ihren Daten vor. Die Hinweise zeigen Lücken, etwa eine Leistung ohne Wirkung. Drucken ergibt ein A3-Querformat.',
      'Der Aufbau folgt dem Quali-Tool von DOJ/AFAJ.',
    ],
  },
  feedback: {
    titel: 'Feedback (Fünf-Finger-Methode)',
    kurz: 'Daumen: gut. Zeigefinger: merke ich mir. Mittelfinger: würde ich ändern. Ringfinger: ging mir nahe. Kleiner Finger: kam zu kurz.',
    absaetze: ['Beantworten Sie, was Ihnen etwas sagt. Ihr Feedback sehen nur Sie und die Event-Leitung.'],
  },
  mitteilungen: {
    titel: 'Mitteilungen',
    kurz: 'Sie erfahren, was sich geändert hat: persönlich, wenn es Sie betrifft, sonst allgemein, sofern Sie es sehen dürfen.',
    absaetze: ['Eigene Änderungen melden sich nicht. Mehrere Änderungen am selben Punkt innert einer Stunde werden zusammengefasst.'],
  },
  suche: {
    titel: 'Suche',
    kurz: 'Die Suche findet Events, Programmpunkte, Ablaufschritte, Ziele, Aufgaben, Material und Personen in allen Ihren Events.',
    absaetze: ['Gefunden wird nur, was Sie sehen dürfen.'],
  },
  kalender: {
    titel: 'Kalender-Abo',
    kurz: 'Unter «Mein Konto» erhalten Sie einen geheimen Link für Ihren Kalender. Er zeigt Ihre Programmpunkte und Vorbereitungstermine.',
    absaetze: [
      'Der Link funktioniert ohne Anmeldung, geben Sie ihn deshalb nicht weiter. Wurde er bekannt, erzeugen Sie einen neuen; der alte wird dann ungültig.',
      'Kalender-Apps holen Änderungen meist stündlich.',
    ],
  },
  datenschutz: {
    titel: 'Datenschutz',
    kurz: 'Alle Daten liegen verschlüsselt beim Betreiber dieser Installation. Es gibt kein Tracking.',
    absaetze: ['Die vollständige Datenschutzerklärung finden Sie unter «Datenschutz».'],
  },
}

/* Kleiner Kreis mit Fragezeichen; ein Klick zeigt die Kurzfassung des Themas und verlinkt zur Hilfe-Seite */
app.component('hilfe-punkt', {
  props: { thema: { type: String, required: true } },
  template: `
    <span ref="wurzel" class="hilfe-punkt">
      <button type="button" class="hilfe-punkt__knopf" :aria-label="'Hilfe: ' + eintrag.titel" :aria-expanded="offen" @click.stop="offen = !offen">?</button>
      <span v-if="offen" class="hilfe-punkt__blase" role="dialog" :aria-label="eintrag.titel" @click.stop>
        <strong>{{ eintrag.titel }}</strong>
        <span>{{ eintrag.kurz }}</span>
        <router-link :to="{ path: '/hilfe', query: { thema: thema } }" class="text-link" @click="offen = false">Mehr in der Hilfe</router-link>
      </span>
    </span>
  `,
  data() {
    return { offen: false }
  },
  computed: {
    eintrag() {
      return HILFE[this.thema] || { titel: 'Hilfe', kurz: '' }
    },
  },
  mounted() {
    var komponente = this
    this.aussen = function (e) { if (komponente.offen && !komponente.$refs.wurzel.contains(e.target)) komponente.offen = false }
    this.taste = function (e) { if (e.key === 'Escape') komponente.offen = false }
    document.addEventListener('click', this.aussen, true)
    document.addEventListener('keydown', this.taste)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.aussen, true)
    document.removeEventListener('keydown', this.taste)
  },
})

/* Hilfe-Seite: alle Themen nach Gruppen, mit Suche; ?thema=… springt zum Thema */
var SeiteHilfe = {
  template: `
    <main class="seite seite--mittel">
      <div>
        <p class="seite__kicker">Hilfe</p>
        <h1>So funktioniert Orev</h1>
      </div>
      <label class="suchfeld">
        <ae-icon name="search" :size="18"></ae-icon>
        <input v-model="suche" type="search" placeholder="Wonach suchen Sie?" aria-label="Hilfe durchsuchen">
      </label>
      <p v-if="!gruppen.length" class="leer">Nichts gefunden. Versuchen Sie ein anderes Wort.</p>
      <section v-for="g in gruppen" :key="g.titel" class="stapel stapel--eng">
        <h2 class="hilfe__gruppe">{{ g.titel }}</h2>
        <details v-for="t in g.themen" :key="t.id" :id="'hilfe-' + t.id" class="hilfe__thema" :open="t.id === thema || !!suche.trim()">
          <summary class="hilfe__kopf">{{ t.titel }}</summary>
          <p class="hilfe__kurz">{{ t.kurz }}</p>
          <p v-for="(a, i) in t.absaetze" :key="i">{{ a }}</p>
        </details>
      </section>
      <p class="fusszeile"><router-link to="/datenschutz">Datenschutz</router-link> · Orev {{ version }}</p>
    </main>
  `,
  data() {
    return { suche: '', version: zustand.version }
  },
  computed: {
    thema() {
      return String(this.$route.query.thema || '')
    },
    gruppen() {
      var suche = this.suche.trim().toLowerCase()
      return HILFE_GRUPPEN.map(function (g) {
        return {
          titel: g.titel,
          themen: g.themen.map(function (id) { return Object.assign({ id: id }, HILFE[id]) }).filter(function (t) {
            return !suche || (t.titel + ' ' + t.kurz + ' ' + t.absaetze.join(' ')).toLowerCase().includes(suche)
          }),
        }
      }).filter(function (g) { return g.themen.length })
    },
  },
  mounted() {
    var ziel = this.thema && document.getElementById('hilfe-' + this.thema)
    if (ziel) ziel.scrollIntoView({ block: 'start' })
  },
}
