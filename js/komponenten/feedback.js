/* Badge und Alert (Design System: feedback) */
app.component('ae-badge', {
  props: {
    color: { type: String, default: 'primary' },
    variant: { type: String, default: 'tint' },
  },
  template: `<span class="ae-badge" :style="stil"><slot></slot></span>`,
  computed: {
    stil() {
      if (this.color === 'neutral') return { background: 'var(--color-page-bg)', color: 'var(--color-text)' }
      if (this.variant === 'solid') return { background: 'var(--color-' + this.color + ')', color: this.color === 'warning' ? 'var(--color-text)' : 'var(--color-white)' }
      return { background: 'var(--' + this.color + '-20)', color: 'var(--color-text)' }
    },
  },
})

var AE_ALERT_ICON = { info: 'info', success: 'circle-check', warning: 'triangle-alert', danger: 'circle-alert', primary: 'info' }
var AE_ALERT_FARBE = { info: 'secondary', success: 'success', warning: 'warning', danger: 'danger', primary: 'primary' }

app.component('ae-alert', {
  props: {
    tone: { type: String, default: 'info' },
    title: { type: String, default: '' },
  },
  template: `
    <div role="status" class="ae-alert" :style="stil">
      <span class="ae-alert__icon"><ae-icon :name="icon" :size="18"></ae-icon></span>
      <div class="dehnen"><strong v-if="title" class="ae-alert__title">{{ title }}</strong><slot></slot></div>
    </div>
  `,
  computed: {
    icon() {
      return AE_ALERT_ICON[this.tone]
    },
    stil() {
      var farbe = AE_ALERT_FARBE[this.tone]
      return { background: 'var(--' + farbe + '-20)', borderColor: 'var(--' + farbe + '-10)', color: 'var(--' + farbe + '-ink)' }
    },
  },
})
