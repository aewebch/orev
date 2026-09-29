/* NavItem und Avatar (Design System: navigation, display) */
app.component('ae-nav-item', {
  props: {
    icon: { type: String, default: '' },
    active: { type: Boolean, default: false },
  },
  template: `
    <button type="button" :class="['ae-nav', active ? 'ae-nav--active' : '']" :aria-current="active || undefined">
      <ae-icon v-if="icon" :name="icon" :size="18"></ae-icon><span class="dehnen"><slot></slot></span><slot name="badge"></slot>
    </button>
  `,
})

app.component('ae-avatar', {
  props: {
    name: { type: String, default: '' },
    size: { type: Number, default: 50 },
  },
  template: `<span class="ae-avatar" :title="name" :style="stil">{{ initialen }}</span>`,
  computed: {
    initialen() {
      return this.name.split(/\s+/).filter(Boolean).slice(0, 2).map(function (wort) { return wort[0] }).join('').toUpperCase()
    },
    stil() {
      return { width: this.size + 'px', height: this.size + 'px', fontSize: Math.round(this.size * 0.34) + 'px', borderRadius: this.size < 36 ? 'var(--radius-md)' : 'var(--radius-lg)' }
    },
  },
})
