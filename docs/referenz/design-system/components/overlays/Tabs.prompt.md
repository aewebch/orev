Folder-style tabs: active = white with 17px top radius (merges into the panel below), inactive = secondary/5%.

```jsx
<Tabs tabs={['Allgemein','Rechte']} value={tab} onChange={setTab}/>
```

- Active tab grows inverted (scooped) radii that flow into the content and slightly overlap neighbours; animates bottom→top on activation (`corner-shape: scoop`, radial-gradient fallback).
- Place directly on top of a white surface (modal body / card) so the active tab connects.
