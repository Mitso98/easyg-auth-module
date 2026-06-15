import type { ReactNode } from 'react';
import styles from './FormField.module.css';

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  /** The input control — caller wires id + aria-invalid + aria-describedby. */
  children: ReactNode;
}

/**
 * Label + control + error, wired for a11y. The error is `role="alert"` with id
 * `${id}-error` so the control can point to it via aria-describedby.
 */
export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
