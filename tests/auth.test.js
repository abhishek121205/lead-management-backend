import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../src/app/utils/token.utils.js';
import { authValidationSchema } from '../src/app/sanitize/auth.sanitize.js';

// Setup test secrets in case not present in process.env
process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'lead-management-access-secret-token-key-2026';
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'lead-management-refresh-secret-token-key-2026';

test('Authentication Module - JWT & Password Security', async (t) => {
    await t.test('TC-AUTH-01: generateAccessToken returns valid decodeable JWT with correct payload', () => {
        const payload = { userId: 'usr-101', email: 'admin@crm.com', role: 'ADMIN' };
        const token = generateAccessToken(payload);
        assert.ok(typeof token === 'string' && token.length > 0);

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        assert.equal(decoded.userId, 'usr-101');
        assert.equal(decoded.email, 'admin@crm.com');
        assert.equal(decoded.role, 'ADMIN');
    });

    await t.test('TC-AUTH-02: generateRefreshToken returns valid token with longer lifespan', () => {
        const payload = { userId: 'usr-101', role: 'ADMIN' };
        const token = generateRefreshToken(payload);
        assert.ok(typeof token === 'string' && token.length > 0);

        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        assert.equal(decoded.userId, 'usr-101');
    });

    await t.test('TC-AUTH-03: bcrypt hashes raw password and verifies match correctly', async () => {
        const rawPassword = 'Password123!';
        const hashed = await bcrypt.hash(rawPassword, 10);
        assert.notEqual(hashed, rawPassword);

        const isMatch = await bcrypt.compare(rawPassword, hashed);
        assert.equal(isMatch, true);
    });

    await t.test('TC-AUTH-04: bcrypt rejects incorrect password', async () => {
        const rawPassword = 'Password123!';
        const hashed = await bcrypt.hash(rawPassword, 10);

        const isMatch = await bcrypt.compare('WrongPassword999', hashed);
        assert.equal(isMatch, false);
    });
});

test('Authentication Module - Login Validation Schemas', async (t) => {
    await t.test('TC-AUTH-05: accepts valid credentials with email and password', () => {
        const { error, value } = authValidationSchema.loginSchema.validate({
            email: 'admin@crm.com',
            password: 'Password123!'
        });
        assert.equal(error, undefined);
        assert.equal(value.email, 'admin@crm.com');
    });

    await t.test('TC-AUTH-06: fails when password is missing', () => {
        const { error } = authValidationSchema.loginSchema.validate({
            email: 'admin@crm.com'
        });
        assert.ok(error);
        assert.match(error.message, /Password is required/i);
    });

    await t.test('TC-AUTH-07: fails when email format is invalid', () => {
        const { error } = authValidationSchema.loginSchema.validate({
            email: 'invalid-email-address',
            password: 'Password123!'
        });
        assert.ok(error);
        assert.match(error.message, /valid email/i);
    });

    await t.test('TC-AUTH-08: fails when both email and identifier are omitted', () => {
        const { error } = authValidationSchema.loginSchema.validate({
            password: 'Password123!'
        });
        assert.ok(error);
    });
});

test('Authentication Module - Register Validation Schemas', async (t) => {
    await t.test('TC-AUTH-09: accepts valid registration payload', () => {
        const { error } = authValidationSchema.registerSchema.validate({
            userName: 'Manager User',
            email: 'manager@crm.com',
            password: 'Password123!'
        });
        assert.equal(error, undefined);
    });

    await t.test('TC-AUTH-10: rejects registration with password shorter than 6 characters', () => {
        const { error } = authValidationSchema.registerSchema.validate({
            userName: 'Manager User',
            email: 'manager@crm.com',
            password: '123'
        });
        assert.ok(error);
        assert.match(error.message, /at least 6 characters/i);
    });
});
