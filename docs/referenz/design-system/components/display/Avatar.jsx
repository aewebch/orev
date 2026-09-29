import React from 'react';
export function Avatar({ src, name = '', size = 50, style, ...rest }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return <span className="ae-avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.34), borderRadius: size < 36 ? 'var(--radius-md)' : 'var(--radius-lg)', ...style }} title={name} {...rest}>{src ? <img src={src} alt={name} /> : initials}</span>;
}
