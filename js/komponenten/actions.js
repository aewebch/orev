/* Button und IconButton (Design System: actions) */
var AE_BUTTON_GROESSE = { primary: 'lg', danger: 'lg', secondary: 'sm', tertiary: 'sm', gradient: null }

app.component('ae-button', {
  props: {
    variant: { type: String, default: 'primary' },
    size: { type: String, default: '' },
    block: { type: Boolean, default: false },
    icon: { type: String, default: '' },
    type: { type: String, default: 'button' },
    disabled: { type: Boolean, default: false },
  },
  template: `
    <button :type="type" :class="klassen" :disabled="disabled" :aria-disabled="disabled || undefined">
      <ae-icon v-if="icon" :name="icon" :size="16"></ae-icon><slot></slot>
    </button>
  `,
  computed: {
    klassen() {
      var groesse = this.size || AE_BUTTON_GROESSE[this.variant]
      return ['ae-btn', 'ae-btn--' + this.variant, groesse ? 'ae-btn--' + groesse : '', this.block ? 'ae-btn--block' : '']
    },
  },
})

app.component('ae-icon-button', {
  props: {
    label: { type: String, required: true },
    variant: { type: String, default: 'soft' },
    size: { type: Number, default: 40 },
    type: { type: String, default: 'button' },
  },
  template: `
    <button :type="type" :aria-label="label" :title="label" :class="['ae-iconbtn', variant !== 'soft' ? 'ae-iconbtn--' + variant : '']" :style="{ width: size + 'px', height: size + 'px' }">
      <slot></slot>
    </button>
  `,
})
