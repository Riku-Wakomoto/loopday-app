import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayQualifies, groupStreak, previousDay } from './streak.ts';

test('previousDay crosses months and years', () => {
  assert.equal(previousDay('2026-03-01'), '2026-02-28');
  assert.equal(previousDay('2027-01-01'), '2026-12-31');
});

test('two posters qualify a group day, one qualifies a solo day', () => {
  assert.equal(dayQualifies(1, 4), false);
  assert.equal(dayQualifies(2, 4), true);
  assert.equal(dayQualifies(1, 1), true);
  assert.equal(dayQualifies(0, 1), false);
});

test('counts consecutive qualifying days ending today', () => {
  const days = {
    '2026-11-03': ['A', 'B'],
    '2026-11-02': ['A', 'C'],
    '2026-11-01': ['B'], // only one poster: breaks the run
    '2026-10-31': ['A', 'B'],
  };
  assert.equal(groupStreak(days, 4, '2026-11-03'), 2);
});

test('an unfinished today keeps yesterday\'s streak', () => {
  const days = { '2026-11-03': ['A'], '2026-11-02': ['A', 'B'], '2026-11-01': ['A', 'B'] };
  assert.equal(groupStreak(days, 3, '2026-11-03'), 2);
});

test('the same member twice counts once', () => {
  assert.equal(groupStreak({ '2026-11-03': ['A', 'A'] }, 3, '2026-11-03'), 0);
});
