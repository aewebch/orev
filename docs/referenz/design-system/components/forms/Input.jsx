import React from 'react';
const cx = (...a) => a.filter(Boolean).join(' ');
export function Input({ label, icon, trailing, hint, error, disabled, className, style, ...rest }) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      <label className={cx('ae-input', error && 'ae-input--error', disabled && 'ae-input--disabled')}>
        {label ? <span className="ae-input__label">{label}</span> : null}
        <span className="ae-input__row">{icon}<input className="ae-input__field" disabled={disabled} {...rest} />{trailing}</span>
      </label>
      {error && typeof error === 'string' ? <span className="ae-input__hint ae-input__hint--error">{error}</span> : hint ? <span className="ae-input__hint">{hint}</span> : null}
    </div>
  );
}
