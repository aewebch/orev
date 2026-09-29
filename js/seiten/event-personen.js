/* Personen des Events (hinzufügen, Rollen, einladen, entfernen) und Teams (Mitglieder, Team-Leitung) */
app.component('event-personen', {
  props: { event: { type: Object, required: true } },
  inject: ['eventAktion', 'eventMeldung'],
  template: `
    <ae-card title="Personen" :subtitle="mitglieder.length + (mitglieder.length === 1 ? ' Person' : ' Personen')">
      <template v-if="darf" #actions><ae-button variant="secondary" icon="user-plus" @click="hinzufuegenOeffnen">Person hinzufügen</ae-button></template>
      <ae-card-row v-for="m in mitglieder" :key="m.person.id" :title="personenName(m.person)" :meta="personMeta(m)" :interaktiv="darf" @click="darf && personOeffnen(m)">
        <template #leading><ae-avatar :name="m.person.vorname + ' ' + m.person.name" :size="40"></ae-avatar></template>
        <template #trailing>
          <div class="reihe">
            <ae-badge v-for="r in m.rollen" :key="r.id" :color="r.istEventLeitung ? 'primary' : 'secondary'" :variant="r.istEventLeitung ? 'solid' : 'tint'">{{ r.name }}</ae-badge>
            <ae-badge v-if="!m.person.hatKonto" color="neutral">{{ m.person.eingeladenBis ? 'Eingeladen' : 'Ohne Konto' }}</ae-badge>
          </div>
        </template>
      </ae-card-row>
    </ae-card>

    <ae-card title="Teams">
      <template v-if="darf" #actions><ae-button variant="secondary" icon="plus" @click="teamOeffnen(null)">Team anlegen</ae-button></template>
      <p v-if="!event.teams.length" class="leer">Noch keine Teams.</p>
      <ae-card-row v-for="t in event.teams" :key="t.id" :title="t.name" :meta="teamMeta(t)" :interaktiv="darfTeam(t)" @click="darfTeam(t) && teamOeffnen(t)">
        <template #leading><ae-avatar :name="t.name" :size="40"></ae-avatar></template>
      </ae-card-row>
    </ae-card>

    <ae-modal v-if="hinzufuegen" title="Person hinzufügen" @schliessen="hinzufuegen = null">
      <div class="formular">
        <ae-tabs v-model="hinzufuegen.art" :tabs="[{ id: 'suche', label: 'Aus dem Verzeichnis' }, { id: 'neu', label: 'Neu erfassen' }]"></ae-tabs>
        <template v-if="hinzufuegen.art === 'suche'">
          <ae-input v-model="hinzufuegen.suche" label="Suche" icon="user" placeholder="Name, Kürzel oder E-Mail" autocomplete="off" @input="suchen"></ae-input>
          <ae-card-row v-for="p in hinzufuegen.treffer" :key="p.id" :title="personenName(p)" :meta="p.email" interaktiv @click="hinzufuegen.personId = p.id">
            <template #trailing><ae-icon v-if="hinzufuegen.personId === p.id" name="circle-check" :size="20"></ae-icon></template>
          </ae-card-row>
          <p v-if="hinzufuegen.suche.length >= 2 && !hinzufuegen.treffer.length" class="leise">Keine Person gefunden. Erfassen Sie sie neu.</p>
        </template>
        <template v-else>
          <div class="formular__zeile">
            <ae-input v-model="hinzufuegen.neu.vorname" label="Vorname" required maxlength="80"></ae-input>
            <ae-input v-model="hinzufuegen.neu.name" label="Name" required maxlength="80"></ae-input>
          </div>
          <div class="formular__zeile">
            <ae-input v-model="hinzufuegen.neu.kuerzel" label="Kürzel" maxlength="10" placeholder="z. B. EbA"></ae-input>
            <ae-input v-model="hinzufuegen.neu.email" label="E-Mail" type="email" icon="mail" hint="Nur nötig für eine Einladung."></ae-input>
          </div>
        </template>
        <template v-if="event.ich.hatLeitungsrechte">
          <span class="klein">Rollen</span>
          <div class="chips">
            <button v-for="r in event.rollen" :key="r.id" type="button" :class="['chip', hinzufuegen.rollen.includes(r.id) ? 'chip--aktiv' : '']" @click="umschalten(hinzufuegen.rollen, r.id)">{{ r.name }}</button>
          </div>
        </template>
        <ae-alert v-if="dialogFehler" tone="danger">{{ dialogFehler }}</ae-alert>
      </div>
      <template #footer>
        <ae-button variant="tertiary" @click="hinzufuegen = null">Schliessen</ae-button>
        <ae-button size="md" :disabled="hinzufuegen.art === 'suche' && !hinzufuegen.personId" @click="hinzufuegenSpeichern">Hinzufügen</ae-button>
      </template>
    </ae-modal>

    <ae-modal v-if="person" :title="personenName(person.person)" @schliessen="person = null">
      <div class="formular">
        <template v-if="!person.person.hatKonto">
          <div class="formular__zeile">
            <ae-input v-model="person.angaben.vorname" label="Vorname" required maxlength="80"></ae-input>
            <ae-input v-model="person.angaben.name" label="Name" required maxlength="80"></ae-input>
          </div>
          <div class="formular__zeile">
            <ae-input v-model="person.angaben.kuerzel" label="Kürzel" maxlength="10"></ae-input>
            <ae-input v-model="person.angaben.email" label="E-Mail" type="email" icon="mail"></ae-input>
          </div>
          <div class="reihe"><ae-button variant="secondary" @click="angabenSpeichern">Angaben speichern</ae-button></div>
        </template>
        <p v-else class="leise">{{ person.person.email }} · Angaben von Personen mit Konto ändert ein Installations-Admin.</p>

        <template v-if="event.ich.hatLeitungsrechte">
          <span class="klein">Rollen</span>
          <div class="chips">
            <button v-for="r in event.rollen" :key="r.id" type="button" :class="['chip', person.rollen.includes(r.id) ? 'chip--aktiv' : '']" @click="rolleUmschalten(r.id)">{{ r.name }}</button>
          </div>
        </template>

        <div v-if="einladungsLink" class="stapel stapel--eng">
          <span class="klein">{{ einladungGesendet ? 'Die Einladung wurde per E-Mail versendet. Link zum Weitergeben:' : 'Einladungslink (7 Tage gültig, nur einmal verwendbar):' }}</span>
          <div class="code">{{ einladungsLink }}</div>
        </div>
        <div class="reihe">
          <ae-button v-if="!person.person.hatKonto" variant="secondary" icon="send" :disabled="!person.person.email" @click="einladen">{{ person.person.eingeladenBis ? 'Neu einladen' : 'Einladen' }}</ae-button>
          <ae-button variant="tertiary" icon="trash-2" @click="entfernen">Aus dem Event entfernen</ae-button>
        </div>
        <ae-alert v-if="dialogFehler" tone="danger">{{ dialogFehler }}</ae-alert>
      </div>
      <template #footer><ae-button variant="tertiary" @click="person = null">Schliessen</ae-button></template>
    </ae-modal>

    <ae-modal v-if="team" :title="team.id ? team.name : 'Team anlegen'" @schliessen="team = null">
      <form id="team-formular" class="formular" @submit.prevent="teamSpeichern">
        <ae-input v-model="team.name" label="Name" required maxlength="80" placeholder="z. B. Küche"></ae-input>
        <span class="klein">Mitglieder</span>
        <personen-auswahl v-model="team.mitglieder" :personen="personenListe"></personen-auswahl>
        <template v-if="team.mitglieder.length">
          <span class="klein">Team-Leitung</span>
          <personen-auswahl v-model="team.leitung" :personen="personenListe.filter(function (p) { return team.mitglieder.includes(p.id) })"></personen-auswahl>
        </template>
        <div v-if="team.id && darf" class="reihe"><ae-button variant="tertiary" icon="trash-2" @click="teamLoeschen">Team löschen</ae-button></div>
        <ae-alert v-if="dialogFehler" tone="danger">{{ dialogFehler }}</ae-alert>
      </form>
      <template #footer>
        <ae-button variant="tertiary" @click="team = null">Schliessen</ae-button>
        <ae-button type="submit" form="team-formular" size="md">Speichern</ae-button>
      </template>
    </ae-modal>
  `,
  data() {
    return { hinzufuegen: null, person: null, team: null, einladungsLink: '', einladungGesendet: false, suchZeit: null, dialogFehler: '' }
  },
  computed: {
    darf() {
      return this.event.ich.recht.personen >= 2
    },
    personenListe() {
      return Object.values(this.event.personen).sort(function (a, b) { return (a.vorname + a.name).localeCompare(b.vorname + b.name, 'de') })
    },
    mitglieder() {
      var event = this.event
      return this.personenListe.map(function (person) {
        var mitglied = event.mitglieder.find(function (m) { return m.personId === person.id }) || { rollen: [] }
        return {
          person: person,
          rollen: event.rollen.filter(function (r) { return mitglied.rollen.includes(r.id) }),
          teams: event.teams.filter(function (t) { return t.mitglieder.some(function (tm) { return tm.personId === person.id }) }),
        }
      })
    },
  },
  methods: {
    personenName: personenName,
    personMeta(m) {
      var teile = []
      if (m.person.email) teile.push(m.person.email)
      if (m.teams.length) teile.push('Teams: ' + m.teams.map(function (t) { return t.name }).join(', '))
      return teile.join(' · ')
    },
    teamMeta(t) {
      var personen = this.event.personen
      if (!t.mitglieder.length) return 'Keine Mitglieder'
      return t.mitglieder.map(function (m) { return (personen[m.personId] ? personen[m.personId].vorname : '?') + (m.istLeitung ? ' (Leitung)' : '') }).join(', ')
    },
    darfTeam(t) {
      return this.darf || this.event.ich.teamLeitung.includes(t.id)
    },
    umschalten(liste, id) {
      var i = liste.indexOf(id)
      if (i >= 0) liste.splice(i, 1)
      else liste.push(id)
    },
    hinzufuegenOeffnen() {
      this.dialogFehler = ''
      this.hinzufuegen = { art: 'suche', suche: '', treffer: [], personId: '', neu: { vorname: '', name: '', kuerzel: '', email: '' }, rollen: [] }
    },
    suchen() {
      clearTimeout(this.suchZeit)
      var komponente = this
      this.suchZeit = setTimeout(async function () {
        var suche = komponente.hinzufuegen.suche
        komponente.hinzufuegen.treffer = suche.length < 2 ? [] : (await komponente.eventAktion('personen_suche', { suche: suche })).personen
      }, 250)
    },
    async hinzufuegenSpeichern() {
      var h = this.hinzufuegen
      var daten = h.art === 'suche' ? { personId: h.personId, rollen: h.rollen } : Object.assign({ rollen: h.rollen }, h.neu)
      try {
        await this.eventAktion('mitglied_hinzufuegen', daten)
        this.hinzufuegen = null
      } catch (fehler) {
        this.dialogFehler = fehler.message
      }
    },
    personOeffnen(m) {
      this.dialogFehler = ''
      this.einladungsLink = ''
      this.person = {
        person: m.person,
        rollen: m.rollen.map(function (r) { return r.id }),
        angaben: { vorname: m.person.vorname, name: m.person.name, kuerzel: m.person.kuerzel, email: m.person.email || '' },
      }
    },
    async angabenSpeichern() {
      var k = this
      await this.eventAktion('mitglied_angaben_speichern', Object.assign({ personId: this.person.person.id }, this.person.angaben)).catch(function (f) { k.dialogFehler = f.message })
      this.person.person = this.event.personen[this.person.person.id]
    },
    async rolleUmschalten(id) {
      var vorher = this.person.rollen.slice()
      this.umschalten(this.person.rollen, id)
      try {
        await this.eventAktion('mitglied_rollen', { personId: this.person.person.id, rollen: this.person.rollen })
      } catch (fehler) {
        this.person.rollen = vorher
        this.dialogFehler = fehler.message
      }
    },
    async einladen() {
      var k = this
      var ergebnis = await this.eventAktion('mitglied_einladen', { personId: this.person.person.id }).catch(function (f) { k.dialogFehler = f.message; return null })
      if (!ergebnis) return
      this.einladungsLink = ergebnis.link
      this.einladungGesendet = ergebnis.gesendet
    },
    async entfernen() {
      if (!confirm(personenName(this.person.person) + ' aus dem Event entfernen?')) return
      try {
        await this.eventAktion('mitglied_entfernen', { personId: this.person.person.id })
        this.person = null
      } catch (fehler) {
        this.dialogFehler = fehler.message
      }
    },
    teamOeffnen(t) {
      this.dialogFehler = ''
      this.team = t
        ? { id: t.id, name: t.name, mitglieder: t.mitglieder.map(function (m) { return m.personId }), leitung: t.mitglieder.filter(function (m) { return m.istLeitung }).map(function (m) { return m.personId }) }
        : { id: '', name: '', mitglieder: [], leitung: [] }
    },
    async teamSpeichern() {
      var t = this.team
      var mitglieder = t.mitglieder.map(function (id) { return { personId: id, istLeitung: t.leitung.includes(id) } })
      try {
        await this.eventAktion('team_speichern', { teamId: t.id, name: t.name, mitglieder: mitglieder })
        this.team = null
      } catch (fehler) {
        this.dialogFehler = fehler.message
      }
    },
    async teamLoeschen() {
      if (!confirm('Team «' + this.team.name + '» löschen?')) return
      await this.eventAktion('team_loeschen', { teamId: this.team.id }).catch(function () {})
      this.team = null
    },
  },
})
