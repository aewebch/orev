import React from 'react';
import { Icon } from '../icons/Icon.jsx';
const ICON = { info: 'info', success: 'circle-check', warning: 'triangle-alert', danger: 'circle-alert', primary: 'info' };
const KEY = { info: 'secondary', success: 'success', warning: 'warning', danger: 'danger', primary: 'primary' };
export function Alert({ tone = 'info', title, icon, children, style, ...rest }) {
  const k = KEY[tone];
  return (
    <div role="status" className="ae-alert" style={{ background: 'var(--' + k + '-20)', borderColor: 'var(--' + k + '-10)', color: 'var(--' + k + '-ink)', ...style }} {...rest}>
      <span className="ae-alert__icon">{icon === undefined ? <Icon name={ICON[tone]} size={18} /> : icon}</span>
      <div>{title ? <strong className="ae-alert__title">{title}</strong> : null}{children}</div>
    </div>
  );
}
