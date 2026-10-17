import test from 'node:test'
import assert from 'node:assert/strict'
import {
  journalCSV,
  parseWorkspace,
  phaseAt,
  remainingSeconds,
  sample,
  timeline,
} from '../src/domain/session.ts'
test('session imports reconstruct detached bounded plans and reject malformed records', () => {
  const input = structuredClone(sample),
    value = parseWorkspace({ ...input, provenance: { marker: 'fixture' } })
  assert.deepEqual(value, sample)
  value.tasks[0]!.title = 'Changed'
  assert.equal(input.tasks[0]!.title, sample.tasks[0]!.title)
  for (const patch of [
    { work: 0 },
    { rest: 31 },
    { longEvery: 1 },
    { cycles: 9 },
    { work: NaN },
    { title: '\nBad' },
    { tasks: [...sample.tasks, sample.tasks[0]] },
    {
      journal: [
        {
          id: 'entry-bad',
          kind: 'work',
          label: 'Bad',
          started: 'not-a-date',
          finished: 'not-a-date',
          seconds: 60,
        },
      ],
    },
  ])
    assert.throws(() => parseWorkspace({ ...sample, ...patch }))
})
test('phase plans alternate focus and rest with longer rests and no trailing break', () => {
  const phases = timeline(sample)
  assert.equal(phases.length, 7)
  assert.deepEqual(
    phases.map((p) => p.kind),
    ['work', 'rest', 'work', 'rest', 'work', 'rest', 'work'],
  )
  assert.equal(phases[3]!.seconds, 900)
  assert.equal(
    phases.reduce((n, p) => n + p.seconds, 0),
    7500,
  )
  assert.equal(phaseAt(7, sample), null)
  assert.equal(phaseAt(-1, sample), null)
  assert.equal(timeline({ ...sample, cycles: 1 }).length, 1)
})
test('remaining time derives from elapsed milliseconds rather than a tick count', () => {
  assert.equal(remainingSeconds(60, 0), 60)
  assert.equal(remainingSeconds(60, 1999), 59)
  assert.equal(remainingSeconds(60, 58250), 2)
  assert.equal(remainingSeconds(60, 90000), 0)
})
test('journal CSV quotes multiline-sensitive fields and neutralizes spreadsheet formulas', () => {
  const workspace = {
    ...sample,
    journal: [
      {
        id: 'entry-fixture',
        kind: 'work' as const,
        label: '=A1,"B"',
        started: '2026-04-18T14:00:00.000Z',
        finished: '2026-04-18T14:01:00.000Z',
        seconds: 60,
      },
    ],
  }
  const csv = journalCSV(workspace)
  assert.ok(csv.includes('"\'=A1,""B"""'))
  assert.equal(csv.split('\r\n').length, 3)
  assert.ok(csv.endsWith('\r\n'))
  assert.equal(parseWorkspace(JSON.parse(JSON.stringify(workspace))).journal[0]!.label, '=A1,"B"')
})
