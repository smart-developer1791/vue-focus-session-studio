export interface Task {
  id: string
  title: string
  done: boolean
}
export interface Entry {
  id: string
  kind: 'work' | 'rest'
  label: string
  started: string
  finished: string
  seconds: number
}
export interface Settings {
  work: number
  rest: number
  longRest: number
  cycles: number
  longEvery: number
}
export interface Workspace extends Settings {
  format: 'FS/1'
  title: string
  tasks: Task[]
  journal: Entry[]
}
export interface Phase {
  kind: 'work' | 'rest'
  label: string
  seconds: number
  cycle: number
}
export const sample: Workspace = {
  format: 'FS/1',
  title: 'A little room to focus',
  work: 25,
  rest: 5,
  longRest: 15,
  cycles: 4,
  longEvery: 2,
  tasks: [
    { id: 'task-draft', title: 'Give the first draft a little shape', done: false },
    { id: 'task-details', title: 'Finish one small, useful detail', done: false },
    { id: 'task-read', title: 'Read it once with fresh eyes', done: false },
  ],
  journal: [],
}
const text = (value: unknown, max: number): value is string =>
  typeof value === 'string' && !!value.trim() && value.length <= max && !/[\r\n]/.test(value)
const integer = (value: number, min: number, max: number) =>
  Number.isInteger(value) && value >= min && value <= max
function date(value: string) {
  if (
    typeof value !== 'string' ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  )
    throw new Error('Use complete UTC timestamps in the journal.')
  return value
}
export function parseWorkspace(value: unknown): Workspace {
  if (!value || typeof value !== 'object') throw new Error('Use an FS/1 session workspace.')
  const w = value as Workspace
  if (w.format !== 'FS/1' || !text(w.title, 80))
    throw new Error('Use FS/1 and a single-line title of 1–80 characters.')
  if (
    !integer(w.work, 1, 90) ||
    !integer(w.rest, 1, 30) ||
    !integer(w.longRest, 1, 60) ||
    !integer(w.cycles, 1, 8) ||
    !integer(w.longEvery, 2, 6)
  )
    throw new Error(
      'Use 1–90 minute focus, 1–30 minute rest, 1–60 minute long rest, 1–8 cycles, and a long rest every 2–6 cycles.',
    )
  if (
    !Array.isArray(w.tasks) ||
    w.tasks.length > 12 ||
    !Array.isArray(w.journal) ||
    w.journal.length > 100
  )
    throw new Error('Keep up to 12 tasks and the latest 100 completed intervals.')
  const ids = new Set<string>()
  function id(value: string, prefix: string) {
    if (
      typeof value !== 'string' ||
      !new RegExp(`^${prefix}-[a-z0-9-]{1,42}$`).test(value) ||
      ids.has(value)
    )
      throw new Error('Use safe, unique record identities.')
    ids.add(value)
    return value
  }
  const tasks = w.tasks.map((t) => {
    if (!t || !text(t.title, 80) || typeof t.done !== 'boolean')
      throw new Error('Each task needs a short title and completion flag.')
    return { id: id(t.id, 'task'), title: t.title, done: t.done }
  })
  const journal = w.journal.map((e) => {
    if (
      !e ||
      !['work', 'rest'].includes(e.kind) ||
      !text(e.label, 80) ||
      !integer(e.seconds, 60, 5400)
    )
      throw new Error('Use valid completed intervals of 60–5400 seconds.')
    const started = date(e.started),
      finished = date(e.finished)
    if (finished < started) throw new Error('Intervals must finish after they start.')
    return {
      id: id(e.id, 'entry'),
      kind: e.kind,
      label: e.label,
      started,
      finished,
      seconds: e.seconds,
    }
  })
  return {
    format: 'FS/1',
    title: w.title,
    work: w.work,
    rest: w.rest,
    longRest: w.longRest,
    cycles: w.cycles,
    longEvery: w.longEvery,
    tasks,
    journal,
  }
}
export function phaseAt(index: number, settings: Settings): Phase | null {
  if (!Number.isInteger(index) || index < 0 || index >= settings.cycles * 2 - 1) return null
  const cycle = Math.floor(index / 2) + 1,
    kind = index % 2 === 0 ? 'work' : 'rest',
    long = kind === 'rest' && cycle % settings.longEvery === 0
  return {
    kind,
    label:
      kind === 'work'
        ? `Focus ${cycle} of ${settings.cycles}`
        : long
          ? 'A longer little rest'
          : 'A little rest',
    seconds: (kind === 'work' ? settings.work : long ? settings.longRest : settings.rest) * 60,
    cycle,
  }
}
export const timeline = (settings: Settings) =>
  Array.from({ length: settings.cycles * 2 - 1 }, (_, i) => phaseAt(i, settings)!)
export function remainingSeconds(total: number, elapsed: number) {
  return Math.max(0, Math.ceil((total * 1000 - elapsed) / 1000))
}
export function journalCSV(value: Workspace) {
  const workspace = parseWorkspace(value),
    cell = (v: string | number) =>
      '"' +
      String(v)
        .replace(/^[=+\-@]/, "'$&")
        .replaceAll('"', '""') +
      '"'
  return (
    [
      ['phase', 'label', 'started_utc', 'finished_utc', 'planned_seconds'],
      ...workspace.journal.map((e) => [e.kind, e.label, e.started, e.finished, e.seconds]),
    ]
      .map((row) => row.map(cell).join(','))
      .join('\r\n') + '\r\n'
  )
}
