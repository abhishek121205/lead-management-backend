import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdminAuthorized, isAuthorized } from '../src/app/middlewares/authorization.middleware.js';
import { generateAccessToken } from '../src/app/utils/token.utils.js';

process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'lead-management-access-secret-token-key-2026';

test('Authorization & RBAC Middleware', async (t) => {
    await t.test('TC-AUTH-RBAC-01: isAdminAuthorized allows request when user has ADMIN role', () => {
        const token = generateAccessToken({ userId: '101', role: 'ADMIN' });
        const req = {
            headers: {
                authorization: `Bearer ${token}`
            }
        };
        let nextCalled = false;
        const res = {
            status: () => res,
            json: () => res
        };

        isAdminAuthorized(req, res, () => {
            nextCalled = true;
        });

        assert.equal(nextCalled, true);
        assert.equal(req.user.role, 'ADMIN');
    });

    await t.test('TC-AUTH-RBAC-02: isAdminAuthorized blocks request with 403 when user is not ADMIN', () => {
        const token = generateAccessToken({ userId: '102', role: 'USER' });
        const req = {
            headers: {
                authorization: `Bearer ${token}`
            }
        };
        let statusCode = null;
        let responseBody = null;
        let nextCalled = false;

        const res = {
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: (body) => {
                responseBody = body;
                return res;
            }
        };

        isAdminAuthorized(req, res, () => {
            nextCalled = true;
        });

        assert.equal(nextCalled, false);
        assert.equal(statusCode, 403);
        assert.equal(responseBody.status, 0);
        assert.match(responseBody.message, /Admin access required/i);
    });

    await t.test('TC-AUTH-RBAC-03: isAuthorized blocks request with 401 when Authorization header is missing', () => {
        const req = { headers: {} };
        let statusCode = null;
        let responseBody = null;
        let nextCalled = false;

        const res = {
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: (body) => {
                responseBody = body;
                return res;
            }
        };

        isAuthorized(req, res, () => {
            nextCalled = true;
        });

        assert.equal(nextCalled, false);
        assert.equal(statusCode, 401);
        assert.equal(responseBody.status, 0);
        assert.match(responseBody.message, /token missing/i);
    });

    await t.test('TC-AUTH-RBAC-04: isAuthorized validates valid Bearer token and attaches user payload', () => {
        const token = generateAccessToken({ userId: 'u-555', role: 'ADMIN' });
        const req = {
            headers: {
                authorization: `Bearer ${token}`
            }
        };
        let nextCalled = false;
        const res = {
            status: () => res,
            json: () => res
        };

        isAuthorized(req, res, () => {
            nextCalled = true;
        });

        assert.equal(nextCalled, true);
        assert.equal(req.user.userId, 'u-555');
        assert.equal(req.user.role, 'ADMIN');
    });

    await t.test('TC-AUTH-RBAC-05: isAuthorized blocks request with 401 when Bearer token is tampered/invalid', () => {
        const req = {
            headers: {
                authorization: 'Bearer invalid.tampered.token.here'
            }
        };
        let statusCode = null;
        let nextCalled = false;
        const res = {
            status: (code) => {
                statusCode = code;
                return res;
            },
            json: () => res
        };

        isAuthorized(req, res, () => {
            nextCalled = true;
        });

        assert.equal(nextCalled, false);
        assert.equal(statusCode, 401);
    });
});
