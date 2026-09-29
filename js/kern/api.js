/* Verbindung zu api.php. Die Anmeldung steckt im HttpOnly-Cookie; der Header X-Orev weist die Anfrage als eigene aus. */
var zustand = Vue.reactive({
  geladen: false,
  eingerichtet: true,
  name: 'Orev',
  version: document.querySelector('meta[name="orev-version"]').content,
  neueVersion: '',
  ich: null,
  darfEventsAnlegen: false,
  updateVerfuegbar: false,
  ungelesen: 0,
})

var api = {
  async anfrage(aktion, daten) {
    var antwort = await fetch('api.php?aktion=' + encodeURIComponent(aktion), {
      method: daten === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      headers: { 'X-Orev': '1', 'Content-Type': 'application/json' },
      body: daten === undefined ? undefined : JSON.stringify(daten),
    })
    var serverVersion = antwort.headers.get('X-Orev-Version')
    if (serverVersion && serverVersion !== zustand.version) zustand.neueVersion = serverVersion
    var inhalt = await antwort.json().catch(function () { return {} })
    if (!antwort.ok) {
      var fehler = new Error(inhalt.fehler || 'Serverfehler ' + antwort.status)
      fehler.status = antwort.status
      if (antwort.status === 401 && zustand.ich && aktion !== 'anmelden') zustand.ich = null
      throw fehler
    }
    return inhalt
  },

  async statusLaden() {
    var status = await api.anfrage('status')
    zustand.eingerichtet = status.eingerichtet
    zustand.name = status.name || 'Orev'
    zustand.ich = status.ich || null
    zustand.darfEventsAnlegen = !!status.darfEventsAnlegen
    zustand.geladen = true
    document.title = zustand.name
    return status
  },
}

/* Datum und Zeit in Schweizer Schreibweise */
function datumText(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function datumZeitText(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })
}
