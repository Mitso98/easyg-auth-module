import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
// Registers jest-dom matchers (and their types) on vitest's expect.
import '@testing-library/jest-dom/vitest';

// Unmount React trees between tests (no globals() reliance).
afterEach(() => {
  cleanup();
});
