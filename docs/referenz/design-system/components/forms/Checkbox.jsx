import React from 'react';
export function Checkbox({ label, className, ...rest }) {
  return (
    <label className={('ae-check ' + (className || '')).trim()}>
      <input type="checkbox" {...rest} /><span className="ae-check__box" />{label ? <span>{label}</span> : null}
    </label>
  );
}
