import React from 'react';
export function NavItem({ icon, active, badge, children, ...rest }) {
  return <button className={'ae-nav' + (active ? ' ae-nav--active' : '')} aria-current={active || undefined} {...rest}>{icon}<span style={{ flex: 1 }}>{children}</span>{badge}</button>;
}
