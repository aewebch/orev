import React from 'react';
const cx = (...a) => a.filter(Boolean).join(' ');
export function IconButton({ variant = 'soft', size = 40, label, className, style, children, ...rest }) {
  return <button aria-label={label} title={label} className={cx('ae-iconbtn', variant !== 'soft' && 'ae-iconbtn--' + variant, className)} style={{ width: size, height: size, ...style }} {...rest}>{children}</button>;
}
