import test from 'node:test';
import assert from 'node:assert/strict';
import { leadValidationSchema } from '../src/app/sanitize/lead.sanitize.js';

test('Lead Module - Create Lead Validation', async (t) => {
    await t.test('TC-LEAD-01: passes with complete valid lead data', () => {
        const payload = {
            name: 'Aarav Sharma',
            email: 'aarav.sharma@example.com',
            phone: '+91 98765 43210',
            source: 'Website',
            notes: 'Client requested demo for team of 15',
            stage: 'NEW',
            followUpDate: '2026-10-05T10:00:00.000Z'
        };
        const { error, value } = leadValidationSchema.createLeadSchema.validate(payload);
        assert.equal(error, undefined);
        assert.equal(value.name, 'Aarav Sharma');
        assert.equal(value.email, 'aarav.sharma@example.com');
        assert.equal(value.stage, 'NEW');
    });

    await t.test('TC-LEAD-02: fails when lead name is missing', () => {
        const payload = {
            email: 'test@example.com',
            phone: '+91 98765 43210',
            source: 'Website'
        };
        const { error } = leadValidationSchema.createLeadSchema.validate(payload);
        assert.ok(error);
        assert.match(error.message, /Lead name is required/i);
    });

    await t.test('TC-LEAD-03: fails when email format is invalid', () => {
        const payload = {
            name: 'Pooja Patel',
            email: 'not-an-email',
            phone: '+91 98765 43210',
            source: 'Referral'
        };
        const { error } = leadValidationSchema.createLeadSchema.validate(payload);
        assert.ok(error);
        assert.match(error.message, /valid email address/i);
    });

    await t.test('TC-LEAD-04: fails when phone number is too short (< 7 characters)', () => {
        const payload = {
            name: 'Rohan Gupta',
            email: 'rohan.gupta@example.com',
            phone: '123',
            source: 'Website'
        };
        const { error } = leadValidationSchema.createLeadSchema.validate(payload);
        assert.ok(error);
        assert.match(error.message, /at least 7 characters/i);
    });

    await t.test('TC-LEAD-05: fails when stage is not a valid lifecycle enum value', () => {
        const payload = {
            name: 'Vikram Singh',
            email: 'vikram.singh@example.com',
            phone: '+91 91234 56789',
            source: 'LinkedIn',
            stage: 'PENDING_APPROVAL'
        };
        const { error } = leadValidationSchema.createLeadSchema.validate(payload);
        assert.ok(error);
        assert.match(error.message, /Stage must be one of/i);
    });

    await t.test('TC-LEAD-06: accepts valid stage transitions across all 5 allowed statuses', () => {
        const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'];
        for (const stage of stages) {
            const { error, value } = leadValidationSchema.createLeadSchema.validate({
                name: 'Valid Prospect',
                email: 'prospect@example.com',
                phone: '+91 98765 43210',
                source: 'Organic',
                stage
            });
            assert.equal(error, undefined);
            assert.equal(value.stage, stage);
        }
    });
});

test('Lead Module - Update & Status Transitions', async (t) => {
    await t.test('TC-LEAD-07: updateStageSchema passes with valid stage', () => {
        const { error, value } = leadValidationSchema.updateStageSchema.validate({
            stage: 'QUALIFIED'
        });
        assert.equal(error, undefined);
        assert.equal(value.stage, 'QUALIFIED');
    });

    await t.test('TC-LEAD-08: updateStageSchema fails when stage is omitted', () => {
        const { error } = leadValidationSchema.updateStageSchema.validate({});
        assert.ok(error);
        assert.match(error.message, /Stage is required/i);
    });

    await t.test('TC-LEAD-09: leadIdParamSchema accepts valid UUID', () => {
        const validUUID = 'a3bb189e-8bf9-4888-9912-ace4e6543002';
        const { error, value } = leadValidationSchema.leadIdParamSchema.validate({
            leadId: validUUID
        });
        assert.equal(error, undefined);
        assert.equal(value.leadId, validUUID);
    });

    await t.test('TC-LEAD-10: leadIdParamSchema rejects malformed UUID', () => {
        const { error } = leadValidationSchema.leadIdParamSchema.validate({
            leadId: '12345-not-a-valid-uuid'
        });
        assert.ok(error);
        assert.match(error.message, /valid UUID/i);
    });
});
