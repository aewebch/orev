export interface CheckboxProps {
  label?: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (e: any) => void;
  className?: string;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
