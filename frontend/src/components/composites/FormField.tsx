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
 *
 * The error `<p>` is rendered UNCONDITIONALLY (empty when there's no error) and
 * its CSS reserves a fixed slot, so onChange validation toggling a message never
 * reflows the fields below it (no layout shift while typing). Keeping the live
 * region permanently mounted also means `role="alert"` announces an inserted
 * message correctly without remounting the node.
 */
export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      <p id={`${id}-error`} role="alert" className={styles.error}>
        {error}
      </p>
    </div>
  );
}
