export interface BadgeProps {
  /** Category colour — used for distinction, not strict traffic-light semantics */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
  /** tint = colour/20% + dark text (default) · solid = full colour + white text */
  variant?: 'tint' | 'solid';
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;
