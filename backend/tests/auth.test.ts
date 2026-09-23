import { describe, it } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateToken } from '../src/modules/auth/service';
import { env } from '../src/config/env';

describe('Auth Service — Password Hashing & JWT', () => {
  it('should hash and verify passwords with bcrypt', async () => {
    const password = 'SuperSecurePassword123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    assert.notStrictEqual(password, hash);
    const isValid = await bcrypt.compare(password, hash);
    assert.strictEqual(isValid, true);

    const isInvalid = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isInvalid, false);
  });

  it('should generate valid JWT tokens signed with JWT_SECRET', () => {
    const payload = { id: 'user-uuid-123', email: 'test@splitpay.local' };
    const token = generateToken(payload);

    assert.ok(token);
    assert.strictEqual(typeof token, 'string');

    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string };
    assert.strictEqual(decoded.id, payload.id);
    assert.strictEqual(decoded.email, payload.email);
  });
});
