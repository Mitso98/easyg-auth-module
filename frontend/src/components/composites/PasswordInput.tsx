import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../ui/Input';
import { IconButton } from '../ui/IconButton';
import { usePasswordToggle } from '../../hooks/usePasswordToggle';
import styles from './PasswordInput.module.css';

export type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> & { invalid?: boolean };

/**
 * Password field that owns its show/hide eye toggle. The toggle is a
 * `type="button"` (never submits) with aria-label + aria-pressed for a11y.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const { visible, toggle } = usePasswordToggle();
    return (
      <div className={styles.wrap}>
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={styles.input}
          {...props}
        />
        <IconButton
          className={styles.toggle}
          onClick={toggle}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </IconButton>
      </div>
    );
  },
);
