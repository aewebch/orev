export interface NavItemProps {
  icon?: React.ReactNode;
  active?: boolean;
  badge?: React.ReactNode;
  onClick?: (e: any) => void;
  children?: React.ReactNode;
}
export declare function NavItem(props: NavItemProps): JSX.Element;
