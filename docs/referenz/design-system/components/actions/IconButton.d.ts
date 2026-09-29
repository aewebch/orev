export interface IconButtonProps {
  /** soft = white + shadow-soft (default) · flat = transparent, tint on hover · primary = brand fill */
  variant?: 'soft' | 'flat' | 'primary';
  /** px square, default 40 */
  size?: number;
  /** accessible label (required) */
  label: string;
  disabled?: boolean;
  onClick?: (e: any) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
