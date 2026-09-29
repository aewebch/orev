Primary action control — solid brand button for the main action, tint/neutral variants for everything else.

```jsx
<Button>Anmelden</Button>
<Button variant="secondary" icon={<Icon name="plus" size={16}/>}>Neu</Button>
<Button variant="tertiary">Schliessen</Button>
<Button variant="gradient" lead={<Icon name="key-round"/>}>Mit Partner anmelden</Button>
```

- One primary per view/modal footer. Tertiary for "Schliessen/Abbrechen".
- Gradient is reserved for a single partner/premium CTA.
- Labels render uppercase automatically — write them in sentence case.
