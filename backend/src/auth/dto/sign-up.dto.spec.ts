import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SignUpDto } from './sign-up.dto';

const VALID = {
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  password: 'Sup3r$ecret',
};

async function fieldsWithErrors(
  payload: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(SignUpDto, payload);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.map((e) => e.property);
}

describe('SignUpDto validation (password policy mirror)', () => {
  it('accepts a fully valid payload', async () => {
    expect(await fieldsWithErrors(VALID)).toEqual([]);
  });

  // Table-driven: each rule the policy must enforce, plus email + name.
  const cases: Array<{
    name: string;
    payload: Record<string, unknown>;
    field: string;
  }> = [
    {
      name: 'password too short',
      payload: { ...VALID, password: 'Ab1$' },
      field: 'password',
    },
    {
      name: 'password without a letter',
      payload: { ...VALID, password: '12345678$' },
      field: 'password',
    },
    {
      name: 'password without a number',
      payload: { ...VALID, password: 'Abcdefgh$' },
      field: 'password',
    },
    {
      name: 'password without a special char',
      payload: { ...VALID, password: 'Abcdefg1h' },
      field: 'password',
    },
    {
      name: 'password over 128 chars',
      payload: { ...VALID, password: `A1$${'a'.repeat(130)}` },
      field: 'password',
    },
    {
      name: 'invalid email format',
      payload: { ...VALID, email: 'not-an-email' },
      field: 'email',
    },
    {
      name: 'name shorter than 3',
      payload: { ...VALID, name: 'Ad' },
      field: 'name',
    },
    // NoSQL operator object must be rejected as a non-string, not treated as a query.
    {
      name: 'email as an operator object',
      payload: { ...VALID, email: { $gt: '' } },
      field: 'email',
    },
  ];

  it.each(cases)('rejects: $name', async ({ payload, field }) => {
    expect(await fieldsWithErrors(payload)).toContain(field);
  });
});
