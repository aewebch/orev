/**
 * Uppercase, 0.5px-tracked action button. Hover = darker fill + inset ring.
 */
export interface ButtonProps {
  /** primary = solid brand (10px radius, 12px 32px) · secondary = secondary-10 tint (5px, 8px 12px) · tertiary = neutral page-bg (5px) · danger · gradient = partner CTA only */
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'gradient';
  /** sm 8px 12px · md 12px 16px · lg 12px 32px. Default depends on variant. */
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  /** Leading node, typically <Icon/> */
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  /** gradient variant only: content of the white 40px lead tile (logo/icon) */
  lead?: React.ReactNode;
  disabled?: boolean;
  href?: string;
  as?: any;
  className?: string;
  onClick?: (e: any) => void;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
