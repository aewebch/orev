/* Icon: lokale Lucide-SVGs als CSS-Maske, erben currentColor (Design System: Icon).
   Die Adresse muss absolut sein, sonst löst der Browser sie relativ zu aeweb.css auf. */
var AE_ICON_BASIS = new URL('icons/', document.baseURI).href

app.component('ae-icon', {
  props: {
    name: { type: String, required: true },
    size: { type: Number, default: 18 },
  },
  template: `<span aria-hidden="true" class="ae-icon" :style="stil"></span>`,
  computed: {
    stil() {
      return { width: this.size + 'px', height: this.size + 'px', '--icon': 'url(' + AE_ICON_BASIS + this.name + '.svg?v=' + zustand.version + ')' }
    },
  },
})
