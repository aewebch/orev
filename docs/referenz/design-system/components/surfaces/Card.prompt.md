Outer panel for grouping content — white on page-bg, radius 20px, `--shadow-card`.

```jsx
<Card title="Mitglieder" actions={<Button variant="secondary">Alle</Button>}>
  <CardRow title="Anna Keller" meta="Admin" />
</Card>
```

- Never nest shadowed cards; inner items use CardRow (no radius, no shadow).
- Space cards 24px apart.
