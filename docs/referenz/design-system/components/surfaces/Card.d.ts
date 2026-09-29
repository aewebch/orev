/**
 * White 20px-radius panel on the page-bg surface, near-invisible shadow.
 */
export interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** default 16px 32px 32px · even 32px · compact 16px */
  padding?: 'default' | 'even' | 'compact';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export declare function Card(props: CardProps): JSX.Element;
