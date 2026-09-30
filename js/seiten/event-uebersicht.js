/* Grunddaten und Tage: direkt im Inhalt bearbeitbar. Texte speichern beim Verlassen des Feldes, Art und Zeitraum stehen
   in Pillen, jeder Tag hat ein Thema und eine Tagesverantwortung (Pille). Löschen steckt im Menü «⋮». */
app.component('event-uebersicht', {
  props: { event: { type: Object, required: true } },
  inject: ['eventAktion', 'eventMeldung'],
  template: `
    <ae-card>
      <div class="stapel grunddaten">
        <div class="reihe reihe--verteilt grunddaten__kopf">
          <input v-if="darf" v-model="felder.titel" class="nahtlos grunddaten__titel dehnen" maxlength="120" placeholder="Titel des Events" aria-label="Titel" @blur="speichern">
          <h2 v-else class="grunddaten__titel">{{ event.titel }}</h2>
          <pillen-menue v-if="event.ich.hatLeitungsrechte" label="Weitere Aktionen" rechts>
            <button type="button" class="menue-eintrag menue-eintrag--gefahr menue-eintrag--icon" @click="loeschen"><ae-icon name="trash-2" :size="16"></ae-icon>Event löschen</button>
          </pillen-menue>
        </div>
        <div class="werkzeuge">
          <select v-if="darf" v-model="felder.typ" class="pille pille--auswahl" aria-label="Art" @change="speichern">
            <option value="event">Art: Event</option>
            <option value="camp">Art: Camp</option>
          </select>
          <span v-else class="pille">{{ event.typ === 'camp' ? 'Camp' : 'Event' }}</span>
          <pillen-menue :text="'Zeitraum: ' + zeitraumText(felder.startDatum, felder.endDatum)" panel :disabled="!darf" @zu="speichern">
            <div class="stapel stapel--eng">
              <label class="feld"><span class="aufklapp__titel">Erster Tag</span><input v-model="felder.startDatum" class="nahtlos nahtlos--rahmen" type="date" @change="endeAnpassen"></label>
              <label class="feld"><span class="aufklapp__titel">Letzter Tag</span><input v-model="felder.endDatum" class="nahtlos nahtlos--rahmen" type="date" :min="felder.startDatum"></label>
              <p class="leise klein">Fallen Tage weg, gehen deren Thema und Tagesverantwortung verloren.</p>
            </div>
          </pillen-menue>
          <hilfe-punkt thema="grunddaten"></hilfe-punkt>
        </div>
        <div class="grunddaten__felder">
          <label class="grunddaten__feld">
            <ae-icon name="map-pin" :size="18"></ae-icon>
            <input v-if="darf" v-model="felder.ort" class="nahtlos" maxlength="200" placeholder="Ort" aria-label="Ort" @blur="speichern">
            <span v-else>{{ event.ort || '–' }}</span>
          </label>
          <label class="grunddaten__feld">
            <ae-icon name="sparkles" :size="18"></ae-icon>
            <input v-if="darf" v-model="felder.thema" class="nahtlos" maxlength="200" placeholder="Thema oder Motto" aria-label="Thema" @blur="speichern">
            <span v-else>{{ event.thema || '–' }}</span>
          </label>
        </div>
        <textarea v-if="darf" v-model="felder.beschreibung" v-wachsen class="nahtlos" rows="2" maxlength="5000" placeholder="Beschreibung, Hinweise fürs Team …" aria-label="Beschreibung" @blur="speichern"></textarea>
        <p v-else-if="event.beschreibung" class="ablauf__text">{{ event.beschreibung }}</p>
      </div>
    </ae-card>

    <ae-card title="Tage" :subtitle="event.tage.length + (event.tage.length === 1 ? ' Tag' : ' Tage') + ' mit Thema und Tagesverantwortung (TV)'">
      <template #actions><hilfe-punkt thema="tage"></hilfe-punkt></template>
      <div class="tage">
        <div v-for="tag in event.tage" :key="tag.datum" class="tag-zeile">
          <div class="tag-zeile__datum"><span class="tag__wochentag">{{ wochentagText(tag.datum) }}</span>{{ tag.datum.slice(8, 10) }}.{{ tag.datum.slice(5, 7) }}.</div>
          <div class="tag-zeile__inhalt">
            <input v-if="darf" :value="tag.thema" class="nahtlos" maxlength="200" placeholder="Tagesthema" :aria-label="'Thema ' + tag.datum" @change="tagSpeichern(tag, { thema: $event.target.value })">
            <strong v-else-if="tag.thema">{{ tag.thema }}</strong>
            <zuweisung-pille v-if="darf" :model-value="{ personen: tagEntwurf(tag), teams: [], alle: false, zusatz: '' }" :event="event" label="TV" nur-personen
              @update:model-value="tagEntwuerfe[tag.datum] = $event.personen" @zu="tagVerantwortungSpeichern(tag)"></zuweisung-pille>
            <span v-else class="leise">TV: {{ verantwortlicheText(tag) }}</span>
          </div>
        </div>
      </div>
    </ae-card>
  `,
  data() {
    return { felder: {}, original: '', tagEntwuerfe: {} }
  },
  computed: {
    darf() {
      return this.event.ich.recht.stammdaten >= 2
    },
  },
  watch: {
    event: {
      immediate: true,
      handler(event) {
        var fokus = document.activeElement
        if (fokus && fokus.closest && fokus.closest('.grunddaten')) return
        this.felder = { titel: event.titel, typ: event.typ, thema: event.thema, ort: event.ort, startDatum: event.startDatum, endDatum: event.endDatum, beschreibung: event.beschreibung }
        this.original = JSON.stringify(this.felder)
        this.tagEntwuerfe = {}
      },
    },
  },
  methods: {
    datumText: datumText,
    wochentagText: wochentagText,
    zeitraumText: zeitraumText,
    verantwortlicheText(tag) {
      var personen = this.event.personen
      return tag.verantwortliche.map(function (id) { return personKurz(personen[id]) }).join(', ') || 'offen'
    },
    endeAnpassen() {
      if (this.felder.endDatum < this.felder.startDatum) this.felder.endDatum = this.felder.startDatum
    },
    async speichern() {
      if (!this.darf || JSON.stringify(this.felder) === this.original) return
      if (!this.felder.titel.trim()) {
        this.felder.titel = this.event.titel
        return
      }
      var weniger = this.felder.startDatum > this.event.startDatum || this.felder.endDatum < this.event.endDatum
      if (weniger && !confirm('Der Zeitraum wird kürzer. Thema und Tagesverantwortung der wegfallenden Tage gehen verloren. Fortfahren?')) {
        this.felder.startDatum = this.event.startDatum
        this.felder.endDatum = this.event.endDatum
        return
      }
      try {
        await this.eventAktion('event_speichern', this.felder)
      } catch (fehler) {
        /* Meldung zeigt die Event-Seite */
      }
    },
    tagEntwurf(tag) {
      return this.tagEntwuerfe[tag.datum] || tag.verantwortliche
    },
    tagSpeichern(tag, aenderung) {
      var daten = Object.assign({ datum: tag.datum, thema: tag.thema, verantwortliche: tag.verantwortliche }, aenderung)
      this.eventAktion('tag_speichern', daten).catch(function () {})
    },
    tagVerantwortungSpeichern(tag) {
      var neu = this.tagEntwuerfe[tag.datum]
      if (!neu || neu.join() === tag.verantwortliche.join()) return
      this.tagSpeichern(tag, { verantwortliche: neu })
    },
    async loeschen() {
      if (!confirm('«' + this.event.titel + '» mit allen Daten endgültig löschen? Das lässt sich nicht rückgängig machen.')) return
      await this.eventAktion('event_loeschen', {})
      this.$router.replace('/')
    },
  },
})
