/* Event-Stammdaten und Tage (Tagesthema, Tagesverantwortung) */
app.component('event-uebersicht', {
  props: { event: { type: Object, required: true } },
  inject: ['eventAktion', 'eventMeldung'],
  template: `
    <form class="ae-card formular" @submit.prevent="speichern">
      <header class="ae-card__head">
        <h4 class="ae-card__title">{{ event.typ === 'camp' ? 'Camp' : 'Event' }}</h4>
        <ae-button v-if="event.ich.hatLeitungsrechte" variant="tertiary" icon="trash-2" @click="loeschen">Löschen</ae-button>
      </header>
      <div class="formular__zeile">
        <ae-input v-model="felder.titel" label="Titel" required maxlength="120" :disabled="!darf"></ae-input>
        <ae-select v-model="felder.typ" label="Art" :optionen="[{ wert: 'event', text: 'Event' }, { wert: 'camp', text: 'Camp' }]" :disabled="!darf"></ae-select>
      </div>
      <div class="formular__zeile">
        <ae-input v-model="felder.thema" label="Thema oder Motto" maxlength="200" :disabled="!darf"></ae-input>
        <ae-input v-model="felder.ort" label="Ort" maxlength="200" :disabled="!darf"></ae-input>
      </div>
      <div class="formular__zeile">
        <ae-input v-model="felder.startDatum" label="Erster Tag" type="date" required :disabled="!darf"></ae-input>
        <ae-input v-model="felder.endDatum" label="Letzter Tag" type="date" required :disabled="!darf"
          hint="Verkürzen Sie den Zeitraum, fallen Tagesthema und Tagesverantwortung der wegfallenden Tage weg."></ae-input>
      </div>
      <ae-textarea v-if="event.ich.recht.stammdaten >= 1" v-model="felder.beschreibung" label="Beschreibung" maxlength="5000" :disabled="!darf"></ae-textarea>
      <div v-if="darf" class="formular__aktionen"><ae-button type="submit">Speichern</ae-button></div>
    </form>

    <ae-card title="Tage" :subtitle="event.tage.length + (event.tage.length === 1 ? ' Tag' : ' Tage')">
      <div v-for="tag in event.tage" :key="tag.datum" class="tag">
        <div class="tag__datum"><span class="tag__wochentag">{{ wochentagText(tag.datum) }}</span>{{ datumText(tag.datum + 'T12:00:00') }}</div>
        <div class="stapel stapel--eng">
          <template v-if="darf">
            <ae-input :model-value="tag.thema" placeholder="Tagesthema" maxlength="200" @change="tagSpeichern(tag, { thema: $event.target.value })"></ae-input>
            <span class="klein">Tagesverantwortung</span>
            <personen-auswahl :model-value="tag.verantwortliche" :personen="mitglieder" @update:model-value="tagSpeichern(tag, { verantwortliche: $event })"></personen-auswahl>
          </template>
          <template v-else>
            <strong v-if="tag.thema">{{ tag.thema }}</strong>
            <span class="leise">Tagesverantwortung: {{ verantwortlicheText(tag) }}</span>
          </template>
        </div>
      </div>
    </ae-card>
  `,
  data() {
    return { felder: {} }
  },
  computed: {
    darf() {
      return this.event.ich.recht.stammdaten >= 2
    },
    mitglieder() {
      return Object.values(this.event.personen).sort(function (a, b) { return (a.vorname + a.name).localeCompare(b.vorname + b.name, 'de') })
    },
  },
  watch: {
    event: {
      immediate: true,
      handler(event) {
        this.felder = { titel: event.titel, typ: event.typ, thema: event.thema, ort: event.ort, startDatum: event.startDatum, endDatum: event.endDatum, beschreibung: event.beschreibung }
      },
    },
  },
  methods: {
    datumText: datumText,
    wochentagText: wochentagText,
    verantwortlicheText(tag) {
      var personen = this.event.personen
      return tag.verantwortliche.map(function (id) { return personen[id] ? personen[id].vorname : '?' }).join(', ') || 'offen'
    },
    async speichern() {
      try {
        await this.eventAktion('event_speichern', this.felder)
        this.eventMeldung('Gespeichert.')
      } catch (fehler) {
        /* Meldung zeigt die Event-Seite */
      }
    },
    tagSpeichern(tag, aenderung) {
      var daten = Object.assign({ datum: tag.datum, thema: tag.thema, verantwortliche: tag.verantwortliche }, aenderung)
      this.eventAktion('tag_speichern', daten).catch(function () {})
    },
    async loeschen() {
      if (!confirm('«' + this.event.titel + '» mit allen Daten endgültig löschen? Das lässt sich nicht rückgängig machen.')) return
      await this.eventAktion('event_loeschen', {})
      this.$router.replace('/')
    },
  },
})
