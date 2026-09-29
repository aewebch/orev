export interface CardRowProps {
  leading?: React.ReactNode;
  title?: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  /** makes row interactive: page-bg on hover */
  onClick?: (e: any) => void;
  className?: string;
  children?: React.ReactNode;
}
export declare function CardRow(props: CardRowProps): JSX.Element;
