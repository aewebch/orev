/**
 * Blur-backed dialog: 20px outer radius, page-bg frame with white content inset 3px (inner radius 17px), --shadow-modal, right-aligned footer on the frame.
 */
export interface ModalProps {
  open?: boolean;
  title?: React.ReactNode;
  /** optional folder tabs above the panel */
  tabs?: Array<{ id: string; label: React.ReactNode } | string>;
  tab?: string;
  onTabChange?: (id: string) => void;
  /** action buttons, right aligned — tertiary "Schliessen" + one primary */
  footer?: React.ReactNode;
  onClose?: () => void;
  /** render in-flow instead of position:fixed (docs, previews) */
  inline?: boolean;
  /** max panel width px, default 560 */
  width?: number;
  children?: React.ReactNode;
}
export declare function Modal(props: ModalProps): JSX.Element;
