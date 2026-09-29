/* Modal und Tabs (Design System: overlays) */
app.component('ae-tabs', {
  props: {
    tabs: { type: Array, required: true },
    modelValue: { type: String, required: true },
  },
  emits: ['update:modelValue'],
  template: `
    <div role="tablist" class="ae-tabs">
      <button v-for="t in tabs" :key="t.id" type="button" role="tab" :aria-selected="modelValue === t.id"
        :class="['ae-tab', modelValue === t.id ? 'ae-tab--active' : '']" @click="$emit('update:modelValue', t.id)">
        <ae-icon v-if="t.icon" :name="t.icon" :size="16"></ae-icon>{{ t.label }}
      </button>
    </div>
  `,
})

/* Escape oder Klick auf den Hintergrund schliesst; Fusszeile über den Slot «footer» */
app.component('ae-modal', {
  props: {
    title: { type: String, default: '' },
    width: { type: Number, default: 560 },
  },
  emits: ['schliessen'],
  template: `
    <div class="ae-overlay" @click.self="$emit('schliessen')">
      <div role="dialog" aria-modal="true" :aria-label="title" class="ae-modal" :style="{ maxWidth: width + 'px' }">
        <div class="ae-modal__panel">
          <div class="ae-modal__head">
            <h4 class="ae-modal__title">{{ title }}</h4>
            <ae-icon-button label="Schliessen" variant="flat" :size="32" @click="$emit('schliessen')"><ae-icon name="x" :size="18"></ae-icon></ae-icon-button>
          </div>
          <div class="ae-modal__body"><slot></slot></div>
        </div>
        <div v-if="$slots.footer" class="ae-modal__foot"><slot name="footer"></slot></div>
      </div>
    </div>
  `,
  mounted() {
    document.addEventListener('keydown', this.taste)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.taste)
  },
  methods: {
    taste(ereignis) {
      if (ereignis.key === 'Escape') this.$emit('schliessen')
    },
  },
})
