/* Input (Wrapper-Muster), Auswahl, Textfeld und Checkbox (Design System: forms).
   Alle mit v-model; weitere Attribute (type, placeholder, autocomplete …) gehen an das eigentliche Feld. */
app.component('ae-input', {
  inheritAttrs: false,
  props: {
    modelValue: { type: [String, Number], default: '' },
    label: { type: String, default: '' },
    icon: { type: String, default: '' },
    hint: { type: String, default: '' },
    error: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  template: `
    <div class="feld">
      <label :class="['ae-input', error ? 'ae-input--error' : '', disabled ? 'ae-input--disabled' : '']">
        <span v-if="label" class="ae-input__label">{{ label }}</span>
        <span class="ae-input__row">
          <ae-icon v-if="icon" :name="icon" :size="16"></ae-icon>
          <input class="ae-input__field" v-bind="$attrs" :value="modelValue" :disabled="disabled" @input="$emit('update:modelValue', $event.target.value)">
          <slot name="trailing"></slot>
        </span>
      </label>
      <span v-if="error" class="ae-input__hint ae-input__hint--error">{{ error }}</span>
      <span v-else-if="hint" class="ae-input__hint">{{ hint }}</span>
    </div>
  `,
})

app.component('ae-textarea', {
  inheritAttrs: false,
  props: {
    modelValue: { type: String, default: '' },
    label: { type: String, default: '' },
    hint: { type: String, default: '' },
    rows: { type: Number, default: 4 },
  },
  emits: ['update:modelValue'],
  template: `
    <div class="feld">
      <label class="ae-input">
        <span v-if="label" class="ae-input__label">{{ label }}</span>
        <textarea class="ae-input__field" v-bind="$attrs" :rows="rows" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"></textarea>
      </label>
      <span v-if="hint" class="ae-input__hint">{{ hint }}</span>
    </div>
  `,
})

/* Auswahl im Stil des Inputs; optionen als [{ wert, text }] */
app.component('ae-select', {
  inheritAttrs: false,
  props: {
    modelValue: { type: [String, Number], default: '' },
    label: { type: String, default: '' },
    optionen: { type: Array, required: true },
    hint: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  template: `
    <div class="feld">
      <label class="ae-input">
        <span v-if="label" class="ae-input__label">{{ label }}</span>
        <span class="ae-input__row">
          <select class="ae-input__field ae-input__field--select" v-bind="$attrs" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
            <option v-for="o in optionen" :key="o.wert" :value="o.wert">{{ o.text }}</option>
          </select>
        </span>
      </label>
      <span v-if="hint" class="ae-input__hint">{{ hint }}</span>
    </div>
  `,
})

app.component('ae-checkbox', {
  props: {
    modelValue: { type: Boolean, default: false },
    label: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  template: `
    <label class="ae-check">
      <input type="checkbox" :checked="modelValue" :disabled="disabled" @change="$emit('update:modelValue', $event.target.checked)"><span class="ae-check__box"></span><span v-if="label">{{ label }}</span>
    </label>
  `,
})
