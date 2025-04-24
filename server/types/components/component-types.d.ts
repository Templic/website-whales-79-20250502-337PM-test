/**
 * Component Type Definitions
 * 
 * This file defines types for UI components used in the application.
 * These types ensure consistent props and state management across components.
 */

import { ReactNode, CSSProperties, MouseEvent, KeyboardEvent, FormEvent } from 'react';

/**
 * Common properties for all components
 */
export interface BaseComponentProps {
  id?: string;
  className?: string;
  style?: CSSProperties;
  testId?: string;
  children?: ReactNode;
}

/**
 * Text input component props
 */
export interface TextInputProps extends BaseComponentProps {
  name: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  type?: 'text' | 'password' | 'email' | 'tel' | 'url' | 'search';
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  helperText?: string;
  onChange?: (value: string, event: FormEvent<HTMLInputElement>) => void;
  onBlur?: (event: FormEvent<HTMLInputElement>) => void;
  onFocus?: (event: FormEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'filled' | 'standard';
  prefixElement?: ReactNode;
  suffixElement?: ReactNode;
}

/**
 * Button component props
 */
export interface ButtonProps extends BaseComponentProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'tertiary' | 'text' | 'outlined' | 'link';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  fullWidth?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  rel?: string;
  ariaLabel?: string;
  form?: string;
  name?: string;
  value?: string;
}

/**
 * Select component props
 */
export interface SelectProps extends BaseComponentProps {
  name: string;
  value?: string | string[];
  defaultValue?: string | string[];
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
    group?: string;
  }>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  multiple?: boolean;
  onChange?: (value: string | string[], event: FormEvent<HTMLSelectElement>) => void;
  onBlur?: (event: FormEvent<HTMLSelectElement>) => void;
  onFocus?: (event: FormEvent<HTMLSelectElement>) => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'filled' | 'standard';
  clearable?: boolean;
  searchable?: boolean;
  loading?: boolean;
  loadingText?: string;
  noOptionsText?: string;
  renderOption?: (option: any) => ReactNode;
  creatable?: boolean;
  createOptionText?: string;
}

/**
 * Checkbox component props
 */
export interface CheckboxProps extends BaseComponentProps {
  name: string;
  checked?: boolean;
  defaultChecked?: boolean;
  value?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  onChange?: (checked: boolean, event: FormEvent<HTMLInputElement>) => void;
  onBlur?: (event: FormEvent<HTMLInputElement>) => void;
  indeterminate?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

/**
 * Radio component props
 */
export interface RadioProps extends BaseComponentProps {
  name: string;
  value: string;
  checked?: boolean;
  defaultChecked?: boolean;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (value: string, event: FormEvent<HTMLInputElement>) => void;
  onBlur?: (event: FormEvent<HTMLInputElement>) => void;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

/**
 * Radio group component props
 */
export interface RadioGroupProps extends BaseComponentProps {
  name: string;
  value?: string;
  defaultValue?: string;
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  onChange?: (value: string, event: FormEvent<HTMLInputElement>) => void;
  row?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Switch component props
 */
export interface SwitchProps extends BaseComponentProps {
  name: string;
  checked?: boolean;
  defaultChecked?: boolean;
  value?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  onChange?: (checked: boolean, event: FormEvent<HTMLInputElement>) => void;
  onBlur?: (event: FormEvent<HTMLInputElement>) => void;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

/**
 * Slider component props
 */
export interface SliderProps extends BaseComponentProps {
  name: string;
  value?: number | [number, number];
  defaultValue?: number | [number, number];
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  marks?: boolean | Array<{ value: number; label?: string }>;
  valueLabelDisplay?: 'auto' | 'on' | 'off';
  orientation?: 'horizontal' | 'vertical';
  track?: 'normal' | 'inverted' | false;
  onChange?: (value: number | [number, number], event: Event) => void;
  onChangeCommitted?: (value: number | [number, number], event: Event) => void;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

/**
 * Date picker component props
 */
export interface DatePickerProps extends BaseComponentProps {
  name: string;
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date | null, event?: any) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  format?: string;
  minDate?: Date;
  maxDate?: Date;
  disablePast?: boolean;
  disableFuture?: boolean;
  showTodayButton?: boolean;
  clearable?: boolean;
  inputVariant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium' | 'large';
  views?: Array<'year' | 'month' | 'day'>;
  openTo?: 'year' | 'month' | 'day';
  disableToolbar?: boolean;
  autoOk?: boolean;
}

/**
 * Time picker component props
 */
export interface TimePickerProps extends BaseComponentProps {
  name: string;
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date | null, event?: any) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  format?: string;
  minTime?: Date;
  maxTime?: Date;
  ampm?: boolean;
  clearable?: boolean;
  inputVariant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium' | 'large';
  views?: Array<'hours' | 'minutes' | 'seconds'>;
  openTo?: 'hours' | 'minutes' | 'seconds';
  disableToolbar?: boolean;
  autoOk?: boolean;
}

/**
 * File upload component props
 */
export interface FileUploadProps extends BaseComponentProps {
  name: string;
  value?: File | File[] | null;
  defaultValue?: File | File[] | null;
  onChange?: (files: File | File[] | null, event: FormEvent<HTMLInputElement>) => void;
  onBlur?: (event: FormEvent<HTMLInputElement>) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  multiple?: boolean;
  accept?: string;
  maxSize?: number;
  minSize?: number;
  maxFiles?: number;
  capture?: boolean | 'user' | 'environment';
  dropzoneProps?: any;
  variant?: 'button' | 'dragdrop';
  showFileList?: boolean;
  onRemove?: (file: File, index: number) => void;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Form component props
 */
export interface FormProps extends BaseComponentProps {
  onSubmit?: (data: any, event: FormEvent<HTMLFormElement>) => void;
  onReset?: (event: FormEvent<HTMLFormElement>) => void;
  autoComplete?: 'on' | 'off';
  noValidate?: boolean;
}

/**
 * Toast notification props
 */
export interface ToastProps {
  id?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  autoClose?: boolean | number;
  closeButton?: boolean;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
  onClose?: () => void;
  icon?: ReactNode;
  action?: ReactNode;
}

/**
 * Modal component props
 */
export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  fullScreen?: boolean;
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  preventBodyScroll?: boolean;
  footer?: ReactNode;
  header?: ReactNode;
  showCloseButton?: boolean;
  centered?: boolean;
  scrollable?: boolean;
  contentClassName?: string;
  overlayClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
}

/**
 * Tab component props
 */
export interface TabProps extends BaseComponentProps {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

/**
 * Tab panel component props
 */
export interface TabPanelProps extends BaseComponentProps {
  value: string;
  tabValue: string;
}

/**
 * Tabs component props
 */
export interface TabsProps extends BaseComponentProps {
  value: string;
  onChange: (value: string) => void;
  variant?: 'standard' | 'scrollable' | 'fullWidth';
  orientation?: 'horizontal' | 'vertical';
  centered?: boolean;
  scrollButtons?: 'auto' | 'desktop' | 'on' | 'off';
  indicatorColor?: 'primary' | 'secondary';
  textColor?: 'primary' | 'secondary' | 'inherit';
}

/**
 * Type guards
 */

/**
 * Type guard to check if props are BaseComponentProps
 */
export function isBaseComponentProps(props: any): props is BaseComponentProps {
  return (
    props !== null &&
    typeof props === 'object' &&
    (props.id === undefined || typeof props.id === 'string') &&
    (props.className === undefined || typeof props.className === 'string') &&
    (props.style === undefined || typeof props.style === 'object') &&
    (props.testId === undefined || typeof props.testId === 'string')
  );
}

/**
 * Type guard to check if props are ButtonProps
 */
export function isButtonProps(props: any): props is ButtonProps {
  return (
    isBaseComponentProps(props) &&
    (props.type === undefined || ['button', 'submit', 'reset'].includes(props.type)) &&
    (props.disabled === undefined || typeof props.disabled === 'boolean') &&
    (props.loading === undefined || typeof props.loading === 'boolean')
  );
}

/**
 * Type guard to check if props are TextInputProps
 */
export function isTextInputProps(props: any): props is TextInputProps {
  return (
    isBaseComponentProps(props) &&
    typeof props.name === 'string' &&
    (props.value === undefined || typeof props.value === 'string') &&
    (props.placeholder === undefined || typeof props.placeholder === 'string') &&
    (props.disabled === undefined || typeof props.disabled === 'boolean')
  );
}