export interface TooltipProps {
  content: React.ReactNode;
  placement?: 'top' | 'bottom';
  /** force visible (docs/demos) */
  open?: boolean;
  children: React.ReactNode;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
