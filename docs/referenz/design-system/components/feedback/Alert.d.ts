export interface AlertProps {
  tone?: 'info' | 'primary' | 'success' | 'warning' | 'danger';
  title?: React.ReactNode;
  /** override icon; pass null to hide */
  icon?: React.ReactNode;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function Alert(props: AlertProps): JSX.Element;
