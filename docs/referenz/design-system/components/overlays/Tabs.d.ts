export interface TabItem { id: string; label: React.ReactNode; icon?: React.ReactNode }
export interface TabsProps {
  tabs: Array<TabItem | string>;
  value: string;
  onChange?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Tabs(props: TabsProps): JSX.Element;
