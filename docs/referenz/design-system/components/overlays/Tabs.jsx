import React from 'react';
export function Tabs({ tabs = [], value, onChange, className, style }) {
  return (
    <div role="tablist" className={('ae-tabs ' + (className || '')).trim()} style={style}>
      {tabs.map(t => {
        const id = typeof t === 'string' ? t : t.id; const label = typeof t === 'string' ? t : t.label;
        return <button key={id} role="tab" aria-selected={value === id} className={'ae-tab' + (value === id ? ' ae-tab--active' : '')} onClick={() => onChange && onChange(id)}>{t.icon}{label}</button>;
      })}
    </div>
  );
}
