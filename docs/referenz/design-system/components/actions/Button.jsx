import React from 'react';
const cx = (...a) => a.filter(Boolean).join(' ');
const DEFAULT_SIZE = { primary: 'lg', danger: 'lg', secondary: 'sm', tertiary: 'sm', gradient: null };
export function Button({ variant = 'primary', size, block, icon, iconRight, lead, disabled, className, children, as, ...rest }) {
  const s = size || DEFAULT_SIZE[variant];
  const Tag = as || (rest.href ? 'a' : 'button');
  return (
    <Tag className={cx('ae-btn', 'ae-btn--' + variant, s && 'ae-btn--' + s, block && 'ae-btn--block', className)} disabled={Tag === 'button' ? disabled : undefined} aria-disabled={disabled || undefined} {...rest}>
      {variant === 'gradient' && lead ? <span className="ae-btn__lead">{lead}</span> : null}
      {icon}{children}{iconRight}
    </Tag>
  );
}
