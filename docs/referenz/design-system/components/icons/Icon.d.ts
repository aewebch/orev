export interface IconProps {
  /** Lucide icon name in kebab-case, e.g. "log-in", "chevron-right" */
  name: string;
  /** px, default 18 */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
