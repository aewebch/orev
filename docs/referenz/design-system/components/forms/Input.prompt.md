Text field using the wrapper pattern — no border on the native input; the wrapper carries radius 10px, 8px padding, page-bg fill and the focus ring.

```jsx
<Input label="E-Mail" type="email" placeholder="name@firma.ch" icon={<Icon name="mail" size={16}/>}/>
```

- Stack fields with 32px gap. Focused wrapper turns white + `--shadow-input-focus`.
- `error="…"` shows danger ring and message.
