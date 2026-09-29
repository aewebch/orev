import React from 'react';
export function CardRow({ leading, title, meta, trailing, onClick, className, children, ...rest }) {
  return (
    <div className={['ae-row', onClick && 'ae-row--interactive', className].filter(Boolean).join(' ')} onClick={onClick} {...rest}>
      {leading}
      <div className="ae-row__main">{title ? <div className="ae-row__title">{title}</div> : null}{meta ? <div className="ae-row__meta">{meta}</div> : null}{children}</div>
      {trailing}
    </div>
  );
}
