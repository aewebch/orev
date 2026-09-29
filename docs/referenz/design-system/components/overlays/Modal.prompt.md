Dialog over a blurred (not darkened) backdrop; optional tabs, right-aligned footer.

```jsx
<Modal title="Benutzer bearbeiten" onClose={close} tabs={['Allgemein','Rechte']} tab={t} onTabChange={setT}
  footer={<><Button variant="tertiary" onClick={close}>Schliessen</Button><Button size="md">Speichern</Button></>}>
  …
</Modal>
```

- Shell: radius 20px, 3px page-bg frame around the white content (inner radius 17px = 20 − 3); footer sits on the frame.
- Backdrop = `backdrop-filter: blur(15px)` + faint page-bg wash, no black scrim.
- `inline` for static previews.
