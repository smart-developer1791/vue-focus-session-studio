import { computed, onMounted, onScopeDispose, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { phaseAt, remainingSeconds, type Entry, type Phase, type Settings } from '../domain/session'
export function useSessionClock(
  settings: MaybeRefOrGetter<Settings>,
  completed: (entry: Entry) => void,
) {
  const index = ref(0),
    state = ref<'ready' | 'running' | 'paused' | 'complete'>('ready'),
    captured = ref<Phase | null>(null),
    elapsed = ref(0)
  const phase = computed(() => captured.value ?? phaseAt(index.value, toValue(settings))),
    next = computed(() => phaseAt(index.value + 1, toValue(settings))),
    remaining = computed(() =>
      phase.value ? remainingSeconds(phase.value.seconds, elapsed.value) : 0,
    )
  let anchor = 0,
    carried = 0,
    started = '',
    timer: ReturnType<typeof setInterval> | undefined
  function tick() {
    if (state.value !== 'running' || !captured.value) return
    elapsed.value = carried + performance.now() - anchor
    if (remaining.value > 0) return
    const finished = captured.value
    state.value = 'ready'
    captured.value = null
    elapsed.value = 0
    carried = 0
    index.value++
    if (!phaseAt(index.value, toValue(settings))) state.value = 'complete'
    completed({
      id: `entry-${crypto.randomUUID()}`,
      kind: finished.kind,
      label: finished.label,
      seconds: finished.seconds,
      started,
      finished: new Date().toISOString(),
    })
  }
  function start() {
    if (state.value === 'running' || state.value === 'complete' || !phase.value) return
    if (!captured.value) {
      captured.value = { ...phase.value }
      started = new Date().toISOString()
      carried = 0
      elapsed.value = 0
    }
    anchor = performance.now()
    state.value = 'running'
  }
  function pause() {
    if (state.value !== 'running') return
    tick()
    if (state.value === 'running') {
      carried = elapsed.value
      state.value = 'paused'
    }
  }
  function reset() {
    state.value = 'ready'
    captured.value = null
    index.value = 0
    elapsed.value = 0
    carried = 0
  }
  onMounted(() => {
    timer = setInterval(tick, 250)
  })
  onScopeDispose(() => {
    if (timer !== undefined) clearInterval(timer)
  })
  return { phase, next, remaining, state, index, start, pause, reset }
}
