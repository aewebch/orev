import React from 'react';
const LUCIDE = 'https://unpkg.com/lucide-static@0.468.0/icons/';
export function Icon({ name, size = 18, className = '', style, ...rest }) {
  return <span aria-hidden="true" className={('ae-icon ' + className).trim()} style={{ width: size, height: size, '--icon': `url(${LUCIDE}${name}.svg)`, ...style }} {...rest} />;
}
