import React from 'react';
export function Dots({ count = 3, value = 0, onChange, tone = 'light' }) {
  return (
    <div className={'ae-dots' + (tone === 'dark' ? ' ae-dots--dark' : '')}>
      {Array.from({ length: count }).map((_, i) => <button key={i} aria-label={'Seite ' + (i + 1)} aria-current={i === value || undefined} className={'ae-dot' + (i === value ? ' ae-dot--active' : '')} onClick={() => onChange && onChange(i)} />)}
    </div>
  );
}
