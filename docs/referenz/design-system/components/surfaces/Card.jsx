import React from 'react';
const cx = (...a) => a.filter(Boolean).join(' ');
export function Card({ title, subtitle, actions, padding = 'default', className, children, ...rest }) {
  return (
    <section className={cx('ae-card', padding !== 'default' && 'ae-card--' + padding, className)} {...rest}>
      {title || actions ? (
        <header className="ae-card__head">
          <div>{title ? <h4 className="ae-card__title">{title}</h4> : null}{subtitle ? <p className="ae-card__sub">{subtitle}</p> : null}</div>
          {actions ? <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
