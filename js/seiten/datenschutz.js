/* Datenschutzerklärung, öffentlich (auch ohne Anmeldung). Verantwortlich ist, wer diese Installation betreibt;
   Betreiber, Kontakt und ein eigener Zusatz kommen aus den Einstellungen. Der Text beschreibt, was Orev technisch tut. */
var SeiteDatenschutz = {
  template: `
    <main class="seite seite--mittel datenschutz">
      <div>
        <p class="seite__kicker">{{ d ? d.name : 'Orev' }}</p>
        <h1>Datenschutzerklärung</h1>
      </div>
      <ae-card v-if="d">
        <div class="stapel datenschutz__text">
          <section>
            <h2>Verantwortliche Stelle</h2>
            <p v-if="d.betreiber" class="ablauf__text">{{ d.betreiber }}</p>
            <p v-else class="leise">Die Betreiberin oder der Betreiber dieser Installation hat noch keine Angaben hinterlegt.</p>
            <p v-if="d.kontakt">Anfragen zum Datenschutz: <a :href="'mailto:' + d.kontakt">{{ d.kontakt }}</a></p>
            <p>Diese Installation von Orev wird von der oben genannten Stelle betrieben. Sie entscheidet, wer Zugang erhält und wofür die Daten verwendet werden.</p>
          </section>

          <section>
            <h2>Wofür Orev Daten bearbeitet</h2>
            <p>Orev dient Leitungsteams dazu, Events und Camps zu planen, durchzuführen und auszuwerten. Personendaten werden nur dafür bearbeitet.</p>
          </section>

          <section>
            <h2>Welche Daten</h2>
            <ul>
              <li><strong>Personen:</strong> Vorname, Name, Kürzel und, falls erfasst, E-Mail-Adresse. Personen können auch ohne Konto erfasst werden, damit man ihnen Aufgaben zuweisen kann.</li>
              <li><strong>Konto:</strong> E-Mail-Adresse als Anmeldename, das Passwort nur als nicht umkehrbarer Hash (Argon2id), Zeitpunkt der letzten Anmeldung.</li>
              <li><strong>Mitwirkung in Events:</strong> Rollen, Teams, Zuständigkeiten im Programm und in Ablaufplänen, Aufgaben, Vorbereitungstermine und Material, das jemand mitnimmt.</li>
              <li><strong>Nachbereitung:</strong> Auswertungen und persönliche Feedbacks. Feedbacks sind vertraulich: Sie sehen nur die verfassende Person, die Event-Leitung und wer dafür ausdrücklich berechtigt wurde.</li>
              <li><strong>Mitteilungen:</strong> Hinweise auf Änderungen, die Sie betreffen oder die Sie sehen dürfen.</li>
              <li><strong>Technisch nötige Daten:</strong> ein Sitzungs-Cookie für die Anmeldung und, zum Schutz vor dem Erraten von Passwörtern, fehlgeschlagene Anmeldeversuche. Die IP-Adresse wird dafür nicht im Klartext gespeichert, sondern nur als verschlüsselter Prüfwert, und nach 15 Minuten verworfen.</li>
            </ul>
          </section>

          <section>
            <h2>Cookies und Tracking</h2>
            <p>Orev setzt ein einziges, technisch notwendiges Cookie für die Anmeldung. Es gibt kein Tracking, keine Analyse- oder Werbedienste und keine eingebetteten Inhalte Dritter. Schriften, Symbole und Programmbibliotheken werden vom eigenen Server geladen.</p>
          </section>

          <section>
            <h2>Speicherung und Sicherheit</h2>
            <p>Alle Daten liegen auf dem Server, auf dem diese Installation betrieben wird, und sind dort verschlüsselt gespeichert (AES-256-GCM). Der Zugriff ist durch Rollen und Rechte eingeschränkt; die Rechte werden auf dem Server geprüft. Die Verbindung sollte ausschliesslich verschlüsselt (HTTPS) erfolgen.</p>
          </section>

          <section>
            <h2>Weitergabe</h2>
            <p>Orev gibt keine Daten an Dritte weiter. Ausnahmen:</p>
            <ul>
              <li v-if="d.mailAktiv"><strong>E-Mail-Versand:</strong> Einladungen werden über den E-Mail-Dienst des Hostings verschickt; dabei werden Name und E-Mail-Adresse der eingeladenen Person übermittelt.</li>
              <li><strong>Kalender-Abo:</strong> Wer ein Kalender-Abo einrichtet, lässt seine eigenen Einträge von der eigenen Kalender-App (zum Beispiel Apple, Google oder Microsoft) abrufen. Der Link ist geheim; wer ihn kennt, sieht diese Einträge. Er lässt sich jederzeit neu erzeugen oder beenden.</li>
              <li><strong>Updates:</strong> Der Server fragt beim öffentlichen Orev-Repository auf GitHub nach neuen Versionen. Dabei werden keine Personendaten übermittelt.</li>
            </ul>
          </section>

          <section>
            <h2>Aufbewahrung</h2>
            <p>Daten bleiben gespeichert, solange sie für ein Event gebraucht werden, und werden gelöscht, wenn die Event-Leitung ein Event löscht oder ein Installations-Admin ein Konto entfernt. Anmeldungen verfallen nach 14 Tagen ohne Nutzung. Mitteilungen werden auf die neuesten 200 pro Person begrenzt.</p>
          </section>

          <section>
            <h2>Ihre Rechte</h2>
            <p>Sie können Auskunft über Ihre Daten verlangen, falsche Daten berichtigen und Daten löschen lassen, soweit keine Pflicht zur Aufbewahrung besteht. Wenden Sie sich dafür an die verantwortliche Stelle. Sie haben zudem das Recht, sich bei der zuständigen Aufsichtsbehörde zu beschweren, in der Schweiz beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB).</p>
            <p>Die Erklärung richtet sich nach dem Schweizer Datenschutzgesetz (DSG); soweit anwendbar auch nach der Datenschutz-Grundverordnung der EU (DSGVO).</p>
          </section>

          <section v-if="d.zusatz">
            <h2>Ergänzende Angaben</h2>
            <p class="ablauf__text">{{ d.zusatz }}</p>
          </section>

          <p class="leise">Orev {{ d.version }}</p>
        </div>
      </ae-card>
      <p><router-link :to="zustand.ich ? '/' : '/anmelden'">{{ zustand.ich ? 'Zur Übersicht' : 'Zur Anmeldung' }}</router-link></p>
    </main>
  `,
  data() {
    return { zustand: zustand, d: null }
  },
  async created() {
    this.d = (await api.anfrage('datenschutz', {})).datenschutz
  },
}
