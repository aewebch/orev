import React from 'react';
const VAR = { primary: 'primary', secondary: 'secondary', success: 'success', warning: 'warning', danger: 'danger' };
export function Badge({ color = 'primary', variant = 'tint', icon, className, style, children, ...rest }) {
  let bg, fg;
  if (color === 'neutral') { bg = 'var(--color-page-bg)'; fg = 'var(--color-text)'; }
  else if (variant === 'solid') { bg = 'var(--color-' + VAR[color] + ')'; fg = color === 'warning' ? 'var(--color-text)' : 'var(--color-white)'; }
  else { bg = 'var(--' + VAR[color] + '-20)'; fg = 'var(--color-text)'; }
  return <span className={('ae-badge ' + (className || '')).trim()} style={{ background: bg, color: fg, ...style }} {...rest}>{icon}{children}</span>;
}
