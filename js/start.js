/* Start: Status laden, dann die App einhängen. Admins sehen einen verfügbaren Update-Hinweis am Zahnrad
   (der Server merkt sich das Prüfergebnis mehrere Stunden, GitHub wird also nicht bei jedem Aufruf gefragt). */
(async function () {
  try {
    await api.statusLaden()
  } catch (fehler) {
    document.getElementById('app').textContent = 'Orev ist nicht erreichbar: ' + fehler.message
    return
  }
  app.use(router)
  app.mount('#app')
  if (zustand.ich && zustand.ich.istAdmin) {
    api.anfrage('update_pruefen', { erzwingen: false }).then(function (antwort) {
      zustand.updateVerfuegbar = antwort.stand.verfuegbar
    }).catch(function () {})
  }
})()
