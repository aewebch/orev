import React from 'react';
export function Tooltip({ content, placement = 'top', open, children }) {
  return (
    <span className={['ae-tip', placement === 'bottom' && 'ae-tip--bottom', open && 'ae-tip--open'].filter(Boolean).join(' ')}>
      {children}<span role="tooltip" className="ae-tip__bubble">{content}</span>
    </span>
  );
}
