/* Card und CardRow (Design System: surfaces) */
app.component('ae-card', {
  props: {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    padding: { type: String, default: 'default' },
  },
  template: `
    <section :class="['ae-card', padding !== 'default' ? 'ae-card--' + padding : '']">
      <header v-if="title || $slots.actions" class="ae-card__head">
        <div>
          <h4 v-if="title" class="ae-card__title">{{ title }}</h4>
          <p v-if="subtitle" class="ae-card__sub">{{ subtitle }}</p>
        </div>
        <div v-if="$slots.actions" class="reihe"><slot name="actions"></slot></div>
      </header>
      <slot></slot>
    </section>
  `,
})

app.component('ae-card-row', {
  props: {
    title: { type: String, default: '' },
    meta: { type: String, default: '' },
    interaktiv: { type: Boolean, default: false },
  },
  template: `
    <div :class="['ae-row', interaktiv ? 'ae-row--interactive' : '']">
      <slot name="leading"></slot>
      <div class="ae-row__main">
        <div v-if="title" class="ae-row__title">{{ title }}</div>
        <div v-if="meta" class="ae-row__meta">{{ meta }}</div>
        <slot></slot>
      </div>
      <slot name="trailing"></slot>
    </div>
  `,
})
