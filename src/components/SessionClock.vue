<script setup lang="ts">
import { computed } from 'vue'
import { useSessionClock } from '../composables/useSessionClock'
import type { Entry, Settings } from '../domain/session'
const { work, rest, longRest, cycles, longEvery } = defineProps<Settings>()
const emit = defineEmits<{ completed: [entry: Entry] }>()
// Getters retain compiler-transformed prop access when crossing the composable boundary.
const { phase, next, remaining, state, start, pause, reset } = useSessionClock(
  () => ({ work, rest, longRest, cycles, longEvery }),
  (entry) => emit('completed', entry),
)
const display = computed(
  () =>
    `${Math.floor(remaining.value / 60)
      .toString()
      .padStart(2, '0')}:${(remaining.value % 60).toString().padStart(2, '0')}`,
)
const progress = computed(() => (phase.value ? 1 - remaining.value / phase.value.seconds : 1))
defineExpose({ reset })
</script>
<template>
  <div
    data-ui="session-stage"
    class="h-132.5 bg-surface border border-solid border-line rounded-[22px] flex flex-col items-center py-[35px] px-[25px] [@media(width<=700px)]:h-130 [@media(width<=700px)]:py-7.5 [@media(width<=700px)]:px-[15px] [@media(700px<width<=1100px)]:h-137.5 [@media(700px<width<=1100px)]:px-4.5 [@media(width<=1100px)]:[&_[data-ui~=eyebrow]]:text-center"
  >
    <p data-ui="eyebrow" class="text-[length:10px] font-[750] tracking-[1.8px] text-muted">
      {{
        state === 'complete'
          ? 'A LITTLE SESSION, COMPLETE'
          : phase?.kind === 'work'
            ? 'ONE THING AT A TIME'
            : 'A LITTLE SPACE BETWEEN THINGS'
      }}
    </p>
    <div
      class="w-70 h-70 rounded-[50%] [background:conic-gradient(var(--accent)_var(--progress),_var(--hover)_0deg)] p-[7px] my-6 mx-0 [@media(width<=700px)]:w-60 [@media(width<=700px)]:h-60 [@media(700px<width<=1100px)]:w-62.5 [@media(700px<width<=1100px)]:h-62.5 [&_>_div]:bg-surface [&_>_div]:rounded-[50%] [&_>_div]:h-full [&_>_div]:flex [&_>_div]:flex-col [&_>_div]:items-center [&_>_div]:justify-center"
      :style="{ '--progress': `${progress * 360}deg` }"
    >
      <div>
        <span
          class="not-italic font-normal text-[length:64px] leading-[normal] font-[family-name:'Bricolage_Grotesque_Variable'] tabular-nums tracking-[-2px] [@media(width<=700px)]:text-[length:56px]"
          role="timer"
          aria-label="Time remaining"
          >{{ display }}</span
        ><span class="text-[length:12px] text-muted mt-[7px]">{{
          state === 'complete' ? 'Well done. Take a breath.' : phase?.label
        }}</span>
      </div>
    </div>
    <div data-ui="clock-actions" class="flex items-center gap-3 min-h-11 [&_button]:min-w-37.5">
      <button
        v-if="state !== 'running'"
        class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-accent text-on-accent py-2.5 px-[15px] [&:hover]:[filter:brightness(0.96)]"
        :disabled="state === 'complete'"
        @click="start"
      >
        {{
          state === 'paused'
            ? 'Resume interval'
            : phase?.kind === 'rest'
              ? 'Start rest'
              : 'Start focus'
        }}</button
      ><button
        v-else
        class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink py-2.5 px-[15px] [&:hover]:bg-hover"
        @click="pause"
      >
        Pause interval</button
      ><span
        data-ui="small-pill"
        class="text-[length:10px] font-semibold bg-hover border border-solid border-line rounded-[6px] whitespace-nowrap py-1 px-[7px]"
        >{{ state.toUpperCase() }}</span
      >
    </div>
    <p data-ui="next-phase" class="text-[length:11px] mt-4.5 text-accent">
      {{
        state === 'complete'
          ? 'Your completed intervals are kept in the journal.'
          : next
            ? `Next: ${next.label} · ${next.seconds / 60} min`
            : 'This is the final focus interval.'
      }}
    </p>
    <p class="text-[length:10px] text-center text-muted max-w-85 mt-2.5">
      Each interval starts when you are ready. Changes to the plan apply to the next interval.
    </p>
  </div>
</template>
