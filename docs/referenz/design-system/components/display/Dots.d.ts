export interface DotsProps {
  count?: number;
  value?: number;
  onChange?: (index: number) => void;
  /** light = white dots on coloured ground (default) · dark = secondary dots on white */
  tone?: 'light' | 'dark';
}
export declare function Dots(props: DotsProps): JSX.Element;
