import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayKey, localHour } from './day.ts';

const BKK = 'Asia/Bangkok'; // UTC+7, no DST

test('clips after 04:00 belong to the same calendar day', () => {
  // 2026-11-03 13:00 in Bangkok
  assert.equal(dayKey(new Date('2026-11-03T06:00:00Z'), BKK), '2026-11-03');
});

test('clips between 00:00 and 03:59 belong to the previous day', () => {
  // 2026-11-04 02:30 in Bangkok
  assert.equal(dayKey(new Date('2026-11-03T19:30:00Z'), BKK), '2026-11-03');
  // 2026-11-04 04:00 in Bangkok starts a new day
  assert.equal(dayKey(new Date('2026-11-03T21:00:00Z'), BKK), '2026-11-04');
});

test('boundary crosses month and year', () => {
  // 2027-01-01 01:00 in Bangkok
  assert.equal(dayKey(new Date('2026-12-31T18:00:00Z'), BKK), '2026-12-31');
});

test('localHour uses the given time zone', () => {
  assert.equal(localHour(new Date('2026-11-03T06:00:00Z'), BKK), 13);
});
