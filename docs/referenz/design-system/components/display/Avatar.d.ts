export interface AvatarProps {
  src?: string;
  /** used for initials + alt */
  name?: string;
  /** px square, default 50 */
  size?: number;
  style?: React.CSSProperties;
}
export declare function Avatar(props: AvatarProps): JSX.Element;
