/* @ds-bundle: {"format":4,"namespace":"AewebDesignSystem_20be84","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"IconButton","sourcePath":"components/actions/IconButton.jsx"},{"name":"Avatar","sourcePath":"components/display/Avatar.jsx"},{"name":"Dots","sourcePath":"components/display/Dots.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"},{"name":"NavItem","sourcePath":"components/navigation/NavItem.jsx"},{"name":"Modal","sourcePath":"components/overlays/Modal.jsx"},{"name":"Tabs","sourcePath":"components/overlays/Tabs.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"CardRow","sourcePath":"components/surfaces/CardRow.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"2ca4e065b459","components/actions/IconButton.jsx":"68f524c04fe2","components/display/Avatar.jsx":"5434354777e8","components/display/Dots.jsx":"40502ad6f232","components/feedback/Alert.jsx":"646e0b5e550e","components/feedback/Badge.jsx":"af0dc52613c0","components/feedback/Tooltip.jsx":"3f9fe37f4bfb","components/forms/Checkbox.jsx":"7bd243805ea1","components/forms/Input.jsx":"a8db90bc2ef2","components/icons/Icon.jsx":"6a7a1d78e206","components/navigation/NavItem.jsx":"c7dc9a054330","components/overlays/Modal.jsx":"382ca67a5482","components/overlays/Tabs.jsx":"72fac80bcb95","components/surfaces/Card.jsx":"1114a85c59c3","components/surfaces/CardRow.jsx":"52f4eefd2b18","ui_kits/business-app/Login.jsx":"1a62f59d9070","ui_kits/business-app/Screens.jsx":"2a50f4fd9350","ui_kits/business-app/Shell.jsx":"0028c253e324"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AewebDesignSystem_20be84 = window.AewebDesignSystem_20be84 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
const DEFAULT_SIZE = {
  primary: 'lg',
  danger: 'lg',
  secondary: 'sm',
  tertiary: 'sm',
  gradient: null
};
function Button({
  variant = 'primary',
  size,
  block,
  icon,
  iconRight,
  lead,
  disabled,
  className,
  children,
  as,
  ...rest
}) {
  const s = size || DEFAULT_SIZE[variant];
  const Tag = as || (rest.href ? 'a' : 'button');
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cx('ae-btn', 'ae-btn--' + variant, s && 'ae-btn--' + s, block && 'ae-btn--block', className),
    disabled: Tag === 'button' ? disabled : undefined,
    "aria-disabled": disabled || undefined
  }, rest), variant === 'gradient' && lead ? /*#__PURE__*/React.createElement("span", {
    className: "ae-btn__lead"
  }, lead) : null, icon, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function IconButton({
  variant = 'soft',
  size = 40,
  label,
  className,
  style,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    title: label,
    className: cx('ae-iconbtn', variant !== 'soft' && 'ae-iconbtn--' + variant, className),
    style: {
      width: size,
      height: size,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Avatar({
  src,
  name = '',
  size = 50,
  style,
  ...rest
}) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: "ae-avatar",
    style: {
      width: size,
      height: size,
      fontSize: Math.round(size * 0.34),
      borderRadius: size < 36 ? 'var(--radius-md)' : 'var(--radius-lg)',
      ...style
    },
    title: name
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name
  }) : initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/display/Dots.jsx
try { (() => {
function Dots({
  count = 3,
  value = 0,
  onChange,
  tone = 'light'
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'ae-dots' + (tone === 'dark' ? ' ae-dots--dark' : '')
  }, Array.from({
    length: count
  }).map((_, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    "aria-label": 'Seite ' + (i + 1),
    "aria-current": i === value || undefined,
    className: 'ae-dot' + (i === value ? ' ae-dot--active' : ''),
    onClick: () => onChange && onChange(i)
  })));
}
Object.assign(__ds_scope, { Dots });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Dots.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const VAR = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  warning: 'warning',
  danger: 'danger'
};
function Badge({
  color = 'primary',
  variant = 'tint',
  icon,
  className,
  style,
  children,
  ...rest
}) {
  let bg, fg;
  if (color === 'neutral') {
    bg = 'var(--color-page-bg)';
    fg = 'var(--color-text)';
  } else if (variant === 'solid') {
    bg = 'var(--color-' + VAR[color] + ')';
    fg = color === 'warning' ? 'var(--color-text)' : 'var(--color-white)';
  } else {
    bg = 'var(--' + VAR[color] + '-20)';
    fg = 'var(--color-text)';
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ('ae-badge ' + (className || '')).trim(),
    style: {
      background: bg,
      color: fg,
      ...style
    }
  }, rest), icon, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  content,
  placement = 'top',
  open,
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: ['ae-tip', placement === 'bottom' && 'ae-tip--bottom', open && 'ae-tip--open'].filter(Boolean).join(' ')
  }, children, /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    className: "ae-tip__bubble"
  }, content));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  label,
  className,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: ('ae-check ' + (className || '')).trim()
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox"
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "ae-check__box"
  }), label ? /*#__PURE__*/React.createElement("span", null, label) : null);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Input({
  label,
  icon,
  trailing,
  hint,
  error,
  disabled,
  className,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: className,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      ...style
    }
  }, /*#__PURE__*/React.createElement("label", {
    className: cx('ae-input', error && 'ae-input--error', disabled && 'ae-input--disabled')
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "ae-input__label"
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    className: "ae-input__row"
  }, icon, /*#__PURE__*/React.createElement("input", _extends({
    className: "ae-input__field",
    disabled: disabled
  }, rest)), trailing)), error && typeof error === 'string' ? /*#__PURE__*/React.createElement("span", {
    className: "ae-input__hint ae-input__hint--error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "ae-input__hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const LUCIDE = 'https://unpkg.com/lucide-static@0.468.0/icons/';
function Icon({
  name,
  size = 18,
  className = '',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    "aria-hidden": "true",
    className: ('ae-icon ' + className).trim(),
    style: {
      width: size,
      height: size,
      '--icon': `url(${LUCIDE}${name}.svg)`,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const ICON = {
  info: 'info',
  success: 'circle-check',
  warning: 'triangle-alert',
  danger: 'circle-alert',
  primary: 'info'
};
const KEY = {
  info: 'secondary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  primary: 'primary'
};
function Alert({
  tone = 'info',
  title,
  icon,
  children,
  style,
  ...rest
}) {
  const k = KEY[tone];
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    className: "ae-alert",
    style: {
      background: 'var(--' + k + '-20)',
      borderColor: 'var(--' + k + '-10)',
      color: 'var(--' + k + '-ink)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "ae-alert__icon"
  }, icon === undefined ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: ICON[tone],
    size: 18
  }) : icon), /*#__PURE__*/React.createElement("div", null, title ? /*#__PURE__*/React.createElement("strong", {
    className: "ae-alert__title"
  }, title) : null, children));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavItem.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function NavItem({
  icon,
  active,
  badge,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    className: 'ae-nav' + (active ? ' ae-nav--active' : ''),
    "aria-current": active || undefined
  }, rest), icon, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, children), badge);
}
Object.assign(__ds_scope, { NavItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavItem.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Tabs.jsx
try { (() => {
function Tabs({
  tabs = [],
  value,
  onChange,
  className,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    className: ('ae-tabs ' + (className || '')).trim(),
    style: style
  }, tabs.map(t => {
    const id = typeof t === 'string' ? t : t.id;
    const label = typeof t === 'string' ? t : t.label;
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      role: "tab",
      "aria-selected": value === id,
      className: 'ae-tab' + (value === id ? ' ae-tab--active' : ''),
      onClick: () => onChange && onChange(id)
    }, t.icon, label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Modal.jsx
try { (() => {
function Modal({
  open = true,
  title,
  tabs,
  tab,
  onTabChange,
  footer,
  onClose,
  inline,
  width = 560,
  children
}) {
  if (!open) return null;
  const tabbed = tabs && tabs.length;
  return /*#__PURE__*/React.createElement("div", {
    className: 'ae-overlay' + (inline ? ' ae-overlay--inline' : ''),
    onClick: e => {
      if (e.target === e.currentTarget && onClose) onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    className: 'ae-modal' + (tabbed ? ' ae-modal--tabbed' : ''),
    style: {
      maxWidth: width
    }
  }, tabbed ? /*#__PURE__*/React.createElement(__ds_scope.Tabs, {
    tabs: tabs,
    value: tab,
    onChange: onTabChange
  }) : null, /*#__PURE__*/React.createElement("div", {
    className: "ae-modal__panel"
  }, title || onClose ? /*#__PURE__*/React.createElement("div", {
    className: "ae-modal__head"
  }, title ? /*#__PURE__*/React.createElement("h4", {
    className: "ae-modal__title"
  }, title) : /*#__PURE__*/React.createElement("span", null), onClose ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    variant: "flat",
    size: 32,
    label: "Schliessen",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 18
  })) : null) : null, /*#__PURE__*/React.createElement("div", {
    className: "ae-modal__body"
  }, children)), footer ? /*#__PURE__*/React.createElement("div", {
    className: "ae-modal__foot"
  }, footer) : null));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Modal.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const cx = (...a) => a.filter(Boolean).join(' ');
function Card({
  title,
  subtitle,
  actions,
  padding = 'default',
  className,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("section", _extends({
    className: cx('ae-card', padding !== 'default' && 'ae-card--' + padding, className)
  }, rest), title || actions ? /*#__PURE__*/React.createElement("header", {
    className: "ae-card__head"
  }, /*#__PURE__*/React.createElement("div", null, title ? /*#__PURE__*/React.createElement("h4", {
    className: "ae-card__title"
  }, title) : null, subtitle ? /*#__PURE__*/React.createElement("p", {
    className: "ae-card__sub"
  }, subtitle) : null), actions ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, actions) : null) : null, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/CardRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function CardRow({
  leading,
  title,
  meta,
  trailing,
  onClick,
  className,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['ae-row', onClick && 'ae-row--interactive', className].filter(Boolean).join(' '),
    onClick: onClick
  }, rest), leading, /*#__PURE__*/React.createElement("div", {
    className: "ae-row__main"
  }, title ? /*#__PURE__*/React.createElement("div", {
    className: "ae-row__title"
  }, title) : null, meta ? /*#__PURE__*/React.createElement("div", {
    className: "ae-row__meta"
  }, meta) : null, children), trailing);
}
Object.assign(__ds_scope, { CardRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/CardRow.jsx", error: String((e && e.message) || e) }); }

// ui_kits/business-app/Login.jsx
try { (() => {
const {
  Button,
  Input,
  Checkbox,
  Alert,
  Icon,
  Dots
} = window.AewebDesignSystem_20be84;
function LoginScreen({
  onLogin
}) {
  const [err, setErr] = React.useState(false);
  const [slide, setSlide] = React.useState(0);
  const submit = e => {
    e.preventDefault();
    const v = e.target.email.value;
    if (!v) {
      setErr(true);
      return;
    }
    onLogin(v);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
      background: 'var(--color-page-bg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32
    }
  }, /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    className: "ae-card ae-card--even",
    style: {
      width: '100%',
      maxWidth: 440,
      display: 'flex',
      flexDirection: 'column',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--color-primary)',
      letterSpacing: .5,
      textTransform: 'uppercase'
    }
  }, "aeweb"), /*#__PURE__*/React.createElement("h2", {
    style: {
      marginTop: 8
    }
  }, "Anmelden")), err ? /*#__PURE__*/React.createElement(Alert, {
    tone: "danger",
    title: "Anmeldung fehlgeschlagen"
  }, "Bitte E-Mail-Adresse eingeben.") : /*#__PURE__*/React.createElement(Alert, {
    tone: "warning"
  }, "Wartungsfenster am Sonntag, 02:00\u201304:00 Uhr."), /*#__PURE__*/React.createElement(Input, {
    name: "email",
    label: "E-Mail",
    type: "email",
    placeholder: "name@firma.ch",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "mail",
      size: 16
    }),
    defaultValue: "a.keller@muster.ch"
  }), /*#__PURE__*/React.createElement(Input, {
    name: "pw",
    label: "Passwort",
    type: "password",
    defaultValue: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "lock",
      size: 16
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: -8
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Angemeldet bleiben",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      fontSize: 14
    }
  }, "Passwort vergessen?")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    block: true
  }, "Anmelden"), /*#__PURE__*/React.createElement(Button, {
    type: "button",
    variant: "gradient",
    block: true,
    lead: /*#__PURE__*/React.createElement(Icon, {
      name: "key-round",
      size: 20
    }),
    onClick: () => onLogin('partner@muster.ch')
  }, "Mit Partner-Konto anmelden")))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--color-primary)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: 48,
      color: '#fff',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      maxWidth: 420
    }
  }, ['Alles an einem Ort.', 'Zusammenarbeit ohne Umwege.', 'Sicher in der Schweiz gehostet.'][slide]), /*#__PURE__*/React.createElement(Dots, {
    count: 3,
    value: slide,
    onChange: setSlide
  })));
}
window.LoginScreen = LoginScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/business-app/Login.jsx", error: String((e && e.message) || e) }); }

// ui_kits/business-app/Screens.jsx
try { (() => {
const {
  Card,
  CardRow,
  Badge,
  Button,
  Icon,
  Avatar,
  Input,
  Checkbox,
  Modal,
  Alert
} = window.AewebDesignSystem_20be84;
const USERS = [{
  n: 'Anna Keller',
  m: 'a.keller@muster.ch',
  r: ['Admin', 'secondary', 'solid']
}, {
  n: 'Marco Brunner',
  m: 'm.brunner@muster.ch',
  r: ['Redaktion', 'primary', 'tint']
}, {
  n: 'Lea Frei',
  m: 'l.frei@muster.ch',
  r: ['Eingeladen', 'warning', 'tint']
}, {
  n: 'Jonas Meier',
  m: 'j.meier@muster.ch',
  r: ['Extern', 'danger', 'tint']
}];
function Stat({
  label,
  value,
  badge
}) {
  return /*#__PURE__*/React.createElement(Card, {
    padding: "compact",
    style: {
      padding: '16px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--color-text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 30,
      fontWeight: 700
    }
  }, value), badge));
}
function Dashboard({
  openUser
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Aktive Benutzer",
    value: "48",
    badge: /*#__PURE__*/React.createElement(Badge, {
      color: "success"
    }, "+4")
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Offene Einladungen",
    value: "6"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Dokumente",
    value: "1'204",
    badge: /*#__PURE__*/React.createElement(Badge, {
      color: "primary"
    }, "3 neu")
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)',
      gap: 24,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement(UserList, {
    openUser: openUser,
    limit: 3
  }), /*#__PURE__*/React.createElement(Card, {
    title: "Hinweise"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Alert, {
    tone: "info"
  }, "2 Benutzer haben ihre E-Mail noch nicht best\xE4tigt."), /*#__PURE__*/React.createElement(Alert, {
    tone: "success"
  }, "Backup erfolgreich um 03:00 Uhr.")))));
}
function UserList({
  openUser,
  limit
}) {
  const list = limit ? USERS.slice(0, limit) : USERS;
  return /*#__PURE__*/React.createElement(Card, {
    title: "Benutzer",
    subtitle: USERS.length + ' Konten',
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "plus",
        size: 16
      }),
      onClick: () => openUser(null)
    }, "Einladen")
  }, list.map(u => /*#__PURE__*/React.createElement(CardRow, {
    key: u.n,
    onClick: () => openUser(u),
    leading: /*#__PURE__*/React.createElement(Avatar, {
      name: u.n,
      size: 40
    }),
    title: u.n,
    meta: u.m,
    trailing: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Badge, {
      color: u.r[1],
      variant: u.r[2]
    }, u.r[0]), /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-right",
      size: 18,
      style: {
        color: 'var(--color-text-muted)'
      }
    }))
  })));
}
function Settings() {
  return /*#__PURE__*/React.createElement(Card, {
    title: "Profil",
    style: {
      maxWidth: 640
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Vorname",
    defaultValue: "Anna"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Nachname",
    defaultValue: "Keller"
  })), /*#__PURE__*/React.createElement(Input, {
    label: "E-Mail",
    defaultValue: "a.keller@muster.ch",
    hint: "Wird f\xFCr die Anmeldung verwendet"
  }), /*#__PURE__*/React.createElement("hr", {
    className: "ae-divider ae-divider--dashed",
    style: {
      margin: 0
    }
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "E-Mail-Benachrichtigungen",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "tertiary"
  }, "Abbrechen"), /*#__PURE__*/React.createElement(Button, {
    size: "md"
  }, "Speichern"))));
}
function Empty({
  label
}) {
  return /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--color-text-muted)'
    }
  }, label, " \u2014 in diesem UI-Kit bewusst leer gelassen."));
}
function UserModal({
  user,
  onClose
}) {
  const [tab, setTab] = React.useState('allg');
  const [first, last] = user ? user.n.split(' ') : ['', ''];
  return /*#__PURE__*/React.createElement(Modal, {
    title: user ? 'Benutzer bearbeiten' : 'Benutzer einladen',
    onClose: onClose,
    tabs: [{
      id: 'allg',
      label: 'Allgemein'
    }, {
      id: 'rechte',
      label: 'Rechte'
    }],
    tab: tab,
    onTabChange: setTab,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "tertiary",
      onClick: onClose
    }, "Schliessen"), /*#__PURE__*/React.createElement(Button, {
      size: "md",
      onClick: onClose
    }, user ? 'Speichern' : 'Einladen'))
  }, tab === 'allg' ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Vorname",
    defaultValue: first
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Nachname",
    defaultValue: last
  })), /*#__PURE__*/React.createElement(Input, {
    label: "E-Mail",
    defaultValue: user ? user.m : '',
    placeholder: "name@firma.ch"
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Benutzer verwalten",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Dokumente bearbeiten",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Rechnungen einsehen"
  })));
}
Object.assign(window, {
  Dashboard,
  UserList,
  Settings,
  Empty,
  UserModal
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/business-app/Screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/business-app/Shell.jsx
try { (() => {
const {
  NavItem,
  Icon,
  Avatar,
  IconButton,
  Tooltip,
  Badge
} = window.AewebDesignSystem_20be84;
function Shell({
  page,
  setPage,
  user,
  onLogout,
  children
}) {
  const items = [['dash', 'layout-dashboard', 'Dashboard'], ['users', 'users', 'Benutzer'], ['docs', 'file-text', 'Dokumente'], ['set', 'settings', 'Einstellungen']];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--color-page-bg)'
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 248,
      flex: 'none',
      background: 'var(--color-surface)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      boxShadow: 'var(--shadow-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 12px 24px',
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--color-primary)',
      letterSpacing: .5,
      textTransform: 'uppercase'
    }
  }, "aeweb"), items.map(([id, ic, l]) => /*#__PURE__*/React.createElement(NavItem, {
    key: id,
    active: page === id,
    onClick: () => setPage(id),
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: ic,
      size: 18
    }),
    badge: id === 'docs' ? /*#__PURE__*/React.createElement(Badge, {
      color: "primary"
    }, "3") : null
  }, l)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "log-out",
      size: 18
    }),
    onClick: onLogout
  }, "Abmelden")), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      minWidth: 0,
      padding: 32,
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      flex: 1
    }
  }, items.find(i => i[0] === page)[2]), /*#__PURE__*/React.createElement(Tooltip, {
    content: "Mitteilungen",
    placement: "bottom"
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Mitteilungen"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bell",
    size: 20
  }))), /*#__PURE__*/React.createElement(Avatar, {
    name: user
  })), children));
}
window.Shell = Shell;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/business-app/Shell.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Dots = __ds_scope.Dots;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.NavItem = __ds_scope.NavItem;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CardRow = __ds_scope.CardRow;

})();
