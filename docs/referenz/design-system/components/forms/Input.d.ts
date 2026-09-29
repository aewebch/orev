/**
 * Wrapper-pattern text field: label + input live inside one page-bg wrapper; focus ring on :focus-within.
 */
export interface InputProps {
  /** Bold 13px label rendered inside the wrapper, 8px above the value */
  label?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  hint?: string;
  /** true or message — danger ring */
  error?: boolean | string;
  disabled?: boolean;
  type?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (e: any) => void;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Input(props: InputProps): JSX.Element;
