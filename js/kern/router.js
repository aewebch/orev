/* Hash-Router: läuft auf jedem Webserver ohne Rewrite-Regeln. Die Rechte prüft der Server; hier wird nur umgeleitet. */
var router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes: [
    { path: '/einrichtung', component: SeiteEinrichtung, meta: { oeffentlich: true } },
    { path: '/anmelden', component: SeiteAnmelden, meta: { oeffentlich: true } },
    { path: '/einladung/:token', component: SeiteEinladung, props: true, meta: { oeffentlich: true } },
    { path: '/', component: SeiteDashboard },
    { path: '/konto', component: SeiteKonto },
    { path: '/event/:id/:bereich?', component: SeiteEvent, props: true },
    { path: '/einstellungen', component: SeiteEinstellungen, meta: { admin: true } },
    { path: '/:pfad(.*)*', redirect: '/' },
  ],
})

router.beforeEach(function (ziel) {
  if (!zustand.eingerichtet) return ziel.path === '/einrichtung' ? true : '/einrichtung'
  if (ziel.path === '/einrichtung') return '/'
  if (ziel.meta.oeffentlich) return ziel.path === '/anmelden' && zustand.ich ? '/' : true
  if (!zustand.ich) return { path: '/anmelden', query: ziel.fullPath !== '/' ? { weiter: ziel.fullPath } : {} }
  if (ziel.meta.admin && !zustand.ich.istAdmin) return '/'
  return true
})
