import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageInYears, ageStatus, formatBirthdateInput, parseBirthdate } from './age.ts';
import { COUNTRIES } from './countries.ts';

const now = new Date(2026, 10, 3); // 2026-11-03

test('ageInYears counts birthdays by calendar date', () => {
  assert.equal(ageInYears(new Date(2013, 10, 3), now), 13);
  assert.equal(ageInYears(new Date(2013, 10, 4), now), 12);
});

test('Thailand: under 13 blocked, 13-19 minor, 20+ adult', () => {
  assert.equal(ageStatus(new Date(2014, 0, 1), COUNTRIES.TH, now), 'blocked');
  assert.equal(ageStatus(new Date(2010, 0, 1), COUNTRIES.TH, now), 'minor');
  assert.equal(ageStatus(new Date(2007, 0, 1), COUNTRIES.TH, now), 'minor'); // 19
  assert.equal(ageStatus(new Date(2006, 0, 1), COUNTRIES.TH, now), 'adult'); // 20
});

test('Saudi Arabia: under 18 blocked', () => {
  assert.equal(ageStatus(new Date(2010, 0, 1), COUNTRIES.SA, now), 'blocked');
  assert.equal(ageStatus(new Date(2008, 0, 1), COUNTRIES.SA, now), 'adult');
});

test('formatBirthdateInput inserts hyphens while typing digits', () => {
  assert.equal(formatBirthdateInput('2010'), '2010');
  assert.equal(formatBirthdateInput('20100'), '2010-0');
  assert.equal(formatBirthdateInput('2010021'), '2010-02-1');
  assert.equal(formatBirthdateInput('20100201'), '2010-02-01');
  // Pasted or partially typed hyphens and extra digits are normalised.
  assert.equal(formatBirthdateInput('2010-02-0199'), '2010-02-01');
});

test('parseBirthdate rejects impossible dates', () => {
  assert.equal(parseBirthdate('2010-02-30'), null);
  assert.equal(parseBirthdate('2010/02/01'), null);
  assert.deepEqual(parseBirthdate('2010-02-01'), new Date(2010, 1, 1));
});
