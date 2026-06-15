import { useCallback, useState } from 'react';

/** Show/hide state for a password input (drives the eye toggle). */
export function usePasswordToggle() {
  const [visible, setVisible] = useState(false);
  const toggle = useCallback(() => setVisible((v) => !v), []);
  return { visible, toggle };
}
