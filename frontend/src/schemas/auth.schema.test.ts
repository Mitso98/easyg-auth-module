import { describe, it, expect } from 'vitest';
import { signUpSchema } from './auth.schema';

const VALID = {
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  password: 'Sup3r$ecret',
  confirmPassword: 'Sup3r$ecret',
};

/** Collect the field paths that failed validation. */
function failedFields(payload: Record<string, unknown>): string[] {
  const result = signUpSchema.safeParse(payload);
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.path.join('.'));
}

describe('signUpSchema (mirrors backend password policy)', () => {
  it('accepts a fully valid payload', () => {
    expect(failedFields(VALID)).toEqual([]);
  });

  const cases: Array<{ name: string; payload: Record<string, unknown>; field: string }> = [
    { name: 'too short', payload: { ...VALID, password: 'Ab1$', confirmPassword: 'Ab1$' }, field: 'password' },
    { name: 'no letter', payload: { ...VALID, password: '12345678$', confirmPassword: '12345678$' }, field: 'password' },
    { name: 'no number', payload: { ...VALID, password: 'Abcdefgh$', confirmPassword: 'Abcdefgh$' }, field: 'password' },
    { name: 'no special', payload: { ...VALID, password: 'Abcdefg1h', confirmPassword: 'Abcdefg1h' }, field: 'password' },
    { name: 'too long', payload: { ...VALID, password: `A1$${'a'.repeat(130)}`, confirmPassword: `A1$${'a'.repeat(130)}` }, field: 'password' },
    { name: 'confirm mismatch', payload: { ...VALID, confirmPassword: 'Different1$' }, field: 'confirmPassword' },
    { name: 'invalid email', payload: { ...VALID, email: 'nope' }, field: 'email' },
  ];

  it.each(cases)('rejects: $name', ({ payload, field }) => {
    expect(failedFields(payload)).toContain(field);
  });
});
