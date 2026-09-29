import React from 'react';
import { Tabs } from './Tabs.jsx';
import { IconButton } from '../actions/IconButton.jsx';
import { Icon } from '../icons/Icon.jsx';
export function Modal({ open = true, title, tabs, tab, onTabChange, footer, onClose, inline, width = 560, children }) {
  if (!open) return null;
  const tabbed = tabs && tabs.length;
  return (
    <div className={'ae-overlay' + (inline ? ' ae-overlay--inline' : '')} onClick={e => { if (e.target === e.currentTarget && onClose) onClose(); }}>
      <div role="dialog" aria-modal="true" className={'ae-modal' + (tabbed ? ' ae-modal--tabbed' : '')} style={{ maxWidth: width }}>
        {tabbed ? <Tabs tabs={tabs} value={tab} onChange={onTabChange} /> : null}
        <div className="ae-modal__panel">
          {title || onClose ? (
            <div className="ae-modal__head">
              {title ? <h4 className="ae-modal__title">{title}</h4> : <span />}
              {onClose ? <IconButton variant="flat" size={32} label="Schliessen" onClick={onClose}><Icon name="x" size={18} /></IconButton> : null}
            </div>
          ) : null}
          <div className="ae-modal__body">{children}</div>
        </div>
        {footer ? <div className="ae-modal__foot">{footer}</div> : null}
      </div>
    </div>
  );
}
