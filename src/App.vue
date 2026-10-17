<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import AppDialog from './components/AppDialog.vue'
import AppIcon from './components/AppIcon.vue'
import SessionClock from './components/SessionClock.vue'
import {
  journalCSV,
  parseWorkspace,
  sample,
  timeline,
  type Entry,
  type Workspace,
} from './domain/session'
import { useDraft } from './services/draft'
import { clone, download, stamp } from './services/files'
const { draft, storageStatus } = useDraft(
    'focus-session-studio:FS1',
    clone(sample),
    parseWorkspace,
  ),
  valid = ref<Workspace>(parseWorkspace(draft.value)),
  problem = ref('')
watch(
  draft,
  (v) => {
    try {
      valid.value = parseWorkspace(v)
      problem.value = ''
    } catch (e) {
      problem.value = (e as Error).message
    }
  },
  { deep: true, flush: 'sync' },
)
const clock = useTemplateRef('clock'),
  tab = ref('plan'),
  marker = computed(() => stamp('FS', valid.value)),
  phases = computed(() => timeline(valid.value)),
  focusCount = computed(() => valid.value.journal.filter((e) => e.kind === 'work').length)
const exchange = ref(false),
  importOpen = ref(false),
  resetOpen = ref(false),
  restore = ref(false),
  clear = ref(false),
  importText = ref(''),
  importError = ref(''),
  status = ref('One small thing. A little room to do it well.')
function record(entry: Entry) {
  draft.value.journal.push(entry)
  if (draft.value.journal.length > 100) draft.value.journal.shift()
  status.value = `${entry.label} complete. Start the next interval when you are ready.`
}
function addTask() {
  if (problem.value || draft.value.tasks.length >= 12) return
  draft.value.tasks.push({
    id: `task-${crypto.randomUUID()}`,
    title: 'One small thing to do',
    done: false,
  })
}
function removeTask(id: string) {
  draft.value.tasks = draft.value.tasks.filter((t) => t.id !== id)
}
function exportJSON() {
  download(
    'focus-session.json',
    JSON.stringify(
      {
        ...valid.value,
        provenance: {
          project: 'vue-focus-session-studio',
          author: 'CodeSculptor',
          marker: marker.value,
        },
      },
      null,
      2,
    ),
  )
}
function importWorkspace() {
  try {
    const next = parseWorkspace(JSON.parse(importText.value))
    draft.value = next
    clock.value?.reset()
    importOpen.value = false
    importError.value = ''
    status.value = 'Plan and journal imported. The timer is ready to start.'
  } catch (e) {
    importError.value = (e as Error).message
  }
}
async function readFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 100000) {
    importError.value = 'Use workspace JSON below 100 KB.'
    return
  }
  try {
    importText.value = await file.text()
  } catch {
    importError.value = 'This file could not be read.'
  }
}
function restart() {
  clock.value?.reset()
  resetOpen.value = false
  status.value = 'A fresh start. Your journal stays with you.'
}
function restoreSample() {
  draft.value = clone(sample)
  clock.value?.reset()
  restore.value = false
  status.value = 'The original plan, ready for a little focus.'
}
function clearJournal() {
  draft.value.journal = []
  clear.value = false
}
</script>
<template>
  <div
    class="[&_main]:max-w-380 [&_main]:py-0 [&_main]:px-9.5 [&_main]:my-0 [&_main]:mx-auto [@media(width<=700px)]:[&_main]:px-4 [@media(700px<width<=1100px)]:[&_main]:px-6"
  >
    <header
      class="min-h-21.5 flex items-center justify-between gap-6 border-b [border-bottom-style:solid] border-b-line bg-surface py-5 px-9.5 [@media(width<=700px)]:gap-4 [@media(width<=700px)]:flex-wrap [@media(width<=700px)]:p-4 [@media(700px<width<=1100px)]:py-4.5 [@media(700px<width<=1100px)]:px-6 [@media(1600px<=width)]:px-[max(38px,_calc((100vw_-_1444px)_/_2))]"
    >
      <a
        class="font-display flex gap-[13px] items-center text-[length:24px] font-[650] tracking-[-0.8px] [@media(width<=700px)]:text-[length:22px]"
        href="/"
        aria-label="Focus Session Studio home"
        ><span
          class="w-10.5 h-10.5 rounded-[13px] bg-accent text-on-accent grid place-items-center text-[length:30px] relative [&_span]:text-[length:16px] [&_span]:absolute [&_span]:right-[5px] [&_span]:bottom-1"
          >◷</span
        ><span
          >Room to Focus<span
            class="block font-sans text-[length:8px] tracking-[1.5px] font-semibold text-muted mt-[3px]"
            >THE FOCUS SESSION STUDIO</span
          ></span
        ></a
      >
      <div
        class="flex items-center gap-3 [@media(width<=700px)]:gap-2 [@media(width<=700px)]:w-full [@media(width<=700px)]:justify-end [@media(width<=700px)]:[&_>_button]:flex-1"
      >
        <span
          class="flex items-center gap-[7px] text-[length:11px] text-muted mr-3 [@media(width<=1100px)]:hidden"
          ><span class="inline-block w-1.5 h-1.5 rounded-[50%] bg-accent shrink-0" />{{
            storageStatus
          }}</span
        ><button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink py-2.5 px-[15px] [&:hover]:bg-hover"
          @click="importOpen = true"
        >
          <AppIcon name="upload" />Import</button
        ><button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-accent text-on-accent py-2.5 px-[15px] [&:hover]:[filter:brightness(0.96)]"
          :disabled="!!problem"
          @click="exchange = true"
        >
          <AppIcon name="download" />Export
        </button>
      </div>
    </header>
    <main>
      <section
        class="flex justify-between items-center min-h-60 gap-8 py-8.5 px-0 [@media(width<=700px)]:min-h-auto [@media(width<=700px)]:py-7.5 [@media(700px<width<=1100px)]:min-h-55 [&_[data-ui~=eyebrow]]:mb-[15px] [&_>_div_>_p:last-child]:mt-4 [&_>_div_>_p:last-child]:text-[length:14px] [&_>_div_>_p:last-child]:text-muted [@media(width<=700px)]:[&_>_div_>_p:last-child]:text-[length:13px]"
      >
        <div>
          <p data-ui="eyebrow" class="text-[length:10px] font-[750] tracking-[1.8px] text-muted">
            A LITTLE RHYTHM FOR YOUR DAY
          </p>
          <h1>One small thing.<br /><span class="text-accent">A little room to focus.</span></h1>
          <p>Make a plan, give it your attention, and leave a little space between things.</p>
        </div>
        <div
          class="w-[195px] h-[195px] shrink-0 border border-solid border-line rounded-[50%] flex flex-col items-center justify-center relative bg-[#e0eadc] mr-[35px] [@media(width<=700px)]:w-37.5 [@media(width<=700px)]:h-37.5 [@media(width<=700px)]:hidden [@media(width<=700px)]:m-0 [@media(700px<width<=1100px)]:w-37.5 [@media(700px<width<=1100px)]:h-37.5 [@media(700px<width<=1100px)]:m-0 [&_>_span]:not-italic [&_>_span]:font-normal [&_>_span]:text-[length:75px] [&_>_span]:leading-[1] [&_>_span]:font-[family-name:'Bricolage_Grotesque_Variable'] [&_small]:text-[length:7px] [&_small]:tracking-[1.4px] [&_small]:mt-[15px] [&_i]:absolute [&_i]:top-3.5 [&_i]:left-10.5 [&_i]:w-5 [&_i]:h-5 [&_i]:bg-accent [&_i]:border-[length:5px] [&_i]:border-solid [&_i]:border-bg [&_i]:rounded-[50%]"
          aria-hidden="true"
        >
          <span>25</span><small>MINUTES FOR ONE GOOD THING</small><i />
        </div>
      </section>
      <div
        class="grid grid-cols-[350px_minmax(0,_1fr)] gap-6.5 [@media(width<=700px)]:grid-cols-[minmax(0,_1fr)] [@media(width<=700px)]:gap-5 [@media(700px<width<=1100px)]:grid-cols-[300px_minmax(0,_1fr)] [@media(700px<width<=1100px)]:gap-5"
      >
        <section
          data-ui="editor-pane"
          class="bg-surface border border-solid border-line rounded-[var(--radius)] min-w-0 h-222.5 flex flex-col p-[23px] [@media(width<=700px)]:h-212.5 [@media(width<=700px)]:p-5 [@media(700px<width<=1100px)]:h-240 [&_[data-ui~=side-note]]:mt-4.5"
        >
          <div class="flex items-center justify-between gap-3 mb-2 [&_+_p]:mb-5">
            <h2>Your little rhythm</h2>
            <span
              data-ui="small-pill"
              class="text-[length:10px] font-semibold bg-hover border border-solid border-line rounded-[6px] whitespace-nowrap py-1 px-[7px]"
              >FS/1</span
            >
          </div>
          <div
            class="flex gap-2.5 border-b [border-bottom-style:solid] border-b-line mb-5.5 py-4.5 px-0 [&_button]:flex-1 [&_button]:border-0 [&_button]:bg-transparent [&_button]:rounded-[8px] [&_button]:text-[length:11px] [&_button]:text-muted [&_button]:py-[11px] [&_button]:px-[3px] [&_.active]:bg-hover [&_.active]:text-accent [&_.active]:font-bold"
          >
            <button :class="{ active: tab === 'plan' }" @click="tab = 'plan'">The plan</button
            ><button :class="{ active: tab === 'tasks' }" @click="tab = 'tasks'">
              Small tasks
            </button>
          </div>
          <div class="flex-1 overflow-auto min-h-0 py-0.5 px-[3px]">
            <div v-if="tab === 'plan'">
              <label>Session title<input v-model="draft.title" maxlength="80" /></label>
              <div class="grid grid-cols-2 gap-3.5">
                <label
                  >Focus · minutes<input
                    v-model.number="draft.work"
                    type="number"
                    min="1"
                    max="90" /></label
                ><label
                  >Rest · minutes<input v-model.number="draft.rest" type="number" min="1" max="30"
                /></label>
              </div>
              <label
                >Long rest · minutes<input
                  v-model.number="draft.longRest"
                  type="number"
                  min="1"
                  max="60"
              /></label>
              <div class="grid grid-cols-2 gap-3.5">
                <label
                  >Focus cycles<input
                    v-model.number="draft.cycles"
                    type="number"
                    min="1"
                    max="8" /></label
                ><label
                  >Long rest every<input
                    v-model.number="draft.longEvery"
                    type="number"
                    min="2"
                    max="6"
                /></label>
              </div>
              <div
                class="[&_[data-ui~=eyebrow]]:mt-5 [&_[data-ui~=eyebrow]]:mb-3 [&_[data-ui~=eyebrow]]:mx-0 [&_>_div]:flex [&_>_div]:items-center [&_>_div]:gap-3 [&_>_div]:border-b [&_>_div]:[border-bottom-style:solid] [&_>_div]:border-b-line [&_>_div]:text-[length:11px] [&_>_div]:py-3 [&_>_div]:px-0 [&_b]:ml-auto [&_b]:whitespace-nowrap [&_b]:font-medium"
              >
                <p
                  data-ui="eyebrow"
                  class="text-[length:10px] font-[750] tracking-[1.8px] text-muted"
                >
                  THE SHAPE OF YOUR SESSION
                </p>
                <div v-for="(phase, i) in phases" :key="i">
                  <span
                    class="h-2 w-2 rounded-[50%] shrink-0 bg-[#b7c9aa] [&.work]:bg-accent"
                    :class="phase.kind"
                  /><span>{{ phase.label }}</span
                  ><b>{{ phase.seconds / 60 }} min</b>
                </div>
              </div>
            </div>
            <div v-else>
              <p data-ui="muted" class="text-muted text-[length:12px]">
                A few clear intentions. Task marks are independent of the timer.
              </p>
              <div class="my-5 mx-0">
                <div
                  v-for="task in draft.tasks"
                  :key="task.id"
                  class="flex gap-2.5 items-center my-[15px] mx-0 [&_>_input[type='checkbox']]:shrink-0 [&_>_input:not([type='checkbox'])]:text-[length:11px] [&_>_input:not([type='checkbox'])]:m-0 [&_[data-ui~=icon-button]]:w-[27px] [&_[data-ui~=icon-button]]:min-h-8 [&_[data-ui~=icon-button]]:border-0 [&_[data-ui~=icon-button]]:shrink-0 [&_[data-ui~=icon-button]]:p-[3px] [&_svg]:w-3.5"
                >
                  <input
                    v-model="task.done"
                    type="checkbox"
                    :aria-label="`Complete ${task.title}`"
                  /><input v-model="task.title" maxlength="80" aria-label="Task title" /><button
                    data-ui="icon-button"
                    class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] w-9.5 bg-[transparent] p-2 [&:hover]:bg-hover"
                    :aria-label="`Remove ${task.title}`"
                    @click="removeTask(task.id)"
                  >
                    <AppIcon name="close" />
                  </button>
                </div>
                <p v-if="!draft.tasks.length" class="text-muted text-[length:13px] text-center p-6">
                  A little space for the first thing.
                </p>
              </div>
              <button
                class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink w-full py-2.5 px-[15px] [&:hover]:bg-hover"
                :disabled="!!problem || draft.tasks.length >= 12"
                @click="addTask"
              >
                Add a small task
              </button>
            </div>
          </div>
          <p
            data-ui="side-note"
            class="border-t [border-top-style:solid] border-t-line pt-5 flex items-start gap-[9px] text-muted text-[length:11px] [&_svg]:text-accent [&_svg]:mt-[3px]"
          >
            <AppIcon name="check" />Your plan and completed intervals save here. The running timer
            belongs to this tab.
          </p>
        </section>
        <section>
          <div
            class="flex items-center justify-between gap-[15px] min-h-13.5 pb-5 [@media(width<=700px)]:pt-2 [@media(width<=700px)]:flex-wrap [&_h2]:overflow-hidden [&_h2]:text-ellipsis [&_h2]:whitespace-nowrap"
          >
            <h2>{{ valid.title }}</h2>
            <span
              data-ui="small-pill"
              class="text-[length:10px] font-semibold bg-hover border border-solid border-line rounded-[6px] whitespace-nowrap py-1 px-[7px]"
              >{{ focusCount }} FOCUS COMPLETE</span
            >
          </div>
          <SessionClock
            ref="clock"
            :work="valid.work"
            :rest="valid.rest"
            :long-rest="valid.longRest"
            :cycles="valid.cycles"
            :long-every="valid.longEvery"
            @completed="record"
          />
          <div
            class="flex justify-between gap-3 items-center border-b [border-bottom-style:solid] border-b-line text-muted text-[length:11px] py-4.5 px-0 [@media(width<=700px)]:text-[length:9px] [@media(width<=700px)]:[&_button]:text-[length:10px]"
          >
            <span>{{ phases.reduce((n, p) => n + p.seconds, 0) / 60 }} min in the current plan</span
            ><button
              class="inline-flex items-center justify-center gap-[9px] min-h-8 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-[transparent] text-muted py-[7px] px-0.5"
              @click="resetOpen = true"
            >
              Restart session
            </button>
          </div>
          <div
            class="flex justify-between items-center gap-[15px] pt-[25px] pb-[15px] px-0 [@media(width<=1100px)]:items-start [&_h2]:text-[length:17px] [@media(width<=1100px)]:[&_h2]:max-w-47.5"
          >
            <h2>A little record of the day</h2>
            <button
              class="inline-flex items-center justify-center gap-[9px] min-h-8 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-[transparent] text-muted py-[7px] px-0.5"
              :disabled="!valid.journal.length"
              @click="clear = true"
            >
              Clear journal
            </button>
          </div>
          <div
            data-ui="journal-list"
            class="h-50 overflow-auto border border-solid border-line rounded-[15px] bg-surface py-3 px-5 [@media(width<=700px)]:px-3 [&_article]:flex [&_article]:items-center [&_article]:gap-[13px] [&_article]:border-b [&_article]:[border-bottom-style:solid] [&_article]:border-b-line [&_article]:text-[length:11px] [&_article]:py-[13px] [&_article]:px-0 [&_article_>_span:last-child]:ml-auto [&_article_>_span:last-child]:whitespace-nowrap [&_small]:block [&_small]:text-[length:9px] [&_small]:text-muted [&_small]:mt-[5px]"
          >
            <article v-for="entry in [...valid.journal].reverse()" :key="entry.id">
              <span
                class="h-2 w-2 rounded-[50%] shrink-0 bg-[#b7c9aa] [&.work]:bg-accent"
                :class="entry.kind"
              />
              <div>
                <b>{{ entry.label }}</b
                ><small
                  >{{
                    new Date(entry.finished).toLocaleString('en-GB', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: 'UTC',
                    })
                  }}
                  · UTC</small
                >
              </div>
              <span>{{ entry.seconds / 60 }} min</span>
            </article>
            <div
              v-if="!valid.journal.length"
              class="h-full flex items-center justify-center gap-5 text-[length:12px] text-muted [@media(width<=1100px)]:gap-3 [&_>_span]:text-[length:36px] [&_>_span]:text-[#a6b99b] [@media(width<=700px)]:[&_p]:text-[length:11px]"
            >
              <span>✓</span>
              <p>
                Good work leaves a little trace.<br />Your completed intervals will appear here.
              </p>
            </div>
          </div>
        </section>
      </div>
      <div
        class="flex justify-between gap-5 min-h-19.5 text-[length:11px] text-muted border-b [border-bottom-style:solid] border-b-line py-[27px] px-0 [@media(width<=700px)]:gap-2 [@media(width<=700px)]:flex-col [&_[data-ui~=mono]]:text-[length:10px] [&_[data-ui~=mono]]:whitespace-nowrap"
        aria-live="polite"
      >
        <span :class="{ 'text-danger': !!problem }">{{ problem || status }}</span
        ><span
          data-ui="mono"
          class="font-[family-name:ui-monospace,_SFMono-Regular,_Consolas,_monospace]"
          >{{ marker }}</span
        >
      </div>
      <footer
        class="flex justify-between gap-[15px] text-[length:9px] tracking-[1.3px] text-muted py-7.5 px-0 [@media(width<=700px)]:flex-col [@media(width<=700px)]:py-6 [&_>_span:first-child]:font-bold [&_>_span:first-child]:text-ink [&_[data-ui~=muted]]:font-normal [&_[data-ui~=muted]]:tracking-[0]"
      >
        <span
          >A little attention goes a long way. <span class="text-accent">CodeSculptor</span></span
        ><button
          class="inline-flex items-center justify-center gap-[9px] min-h-8 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-[transparent] text-muted py-[7px] px-0.5"
          @click="restore = true"
        >
          Restore the sample
        </button>
      </footer>
    </main>
    <AppDialog v-model="exchange" title="Take your little rhythm"
      ><p data-ui="muted" class="text-muted">
        JSON saves your plan, tasks, and completed intervals. CSV contains the journal. Running
        timer progress is session-only.
      </p>
      <div
        class="flex flex-wrap gap-2.5 my-5 mx-0 [@media(width<=700px)]:[&_>_button]:flex-1 [@media(width<=700px)]:[&_>_button]:min-w-32.5"
      >
        <button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-accent text-on-accent py-2.5 px-[15px] [&:hover]:[filter:brightness(0.96)]"
          @click="exportJSON"
        >
          Download session JSON</button
        ><button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink py-2.5 px-[15px] [&:hover]:bg-hover"
          @click="download(`focus-journal-${marker}.csv`, journalCSV(valid), 'text/csv')"
        >
          Download journal CSV
        </button>
      </div></AppDialog
    >
    <AppDialog v-model="importOpen" title="Import a focus session"
      ><label
        >Choose workspace JSON<input
          type="file"
          accept=".json,application/json"
          @change="readFile" /></label
      ><label
        >Or paste FS/1 JSON<textarea v-model="importText" rows="7" spellcheck="false" />
      </label>
      <p class="text-danger" role="alert">{{ importError }}</p>
      <div
        class="flex flex-wrap gap-2.5 my-5 mx-0 [@media(width<=700px)]:[&_>_button]:flex-1 [@media(width<=700px)]:[&_>_button]:min-w-32.5"
      >
        <button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-accent text-on-accent py-2.5 px-[15px] [&:hover]:[filter:brightness(0.96)]"
          @click="importWorkspace"
        >
          Import session</button
        ><a
          href="/sample-workspace.json"
          download
          class="inline-flex items-center justify-center gap-[9px] min-h-8 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-[transparent] text-muted py-[7px] px-0.5"
          >Download sample JSON</a
        >
      </div>
      <p data-ui="muted" class="text-muted text-[length:12px]">
        A valid import replaces the plan and journal and resets the running timer.
      </p></AppDialog
    >
    <AppDialog v-model="resetOpen" title="Start the session again?"
      ><p>
        This resets the running interval. Completed intervals and tasks stay in your workspace.
      </p>
      <div
        class="flex flex-wrap gap-2.5 my-5 mx-0 [@media(width<=700px)]:[&_>_button]:flex-1 [@media(width<=700px)]:[&_>_button]:min-w-32.5"
      >
        <button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-accent text-on-accent py-2.5 px-[15px] [&:hover]:[filter:brightness(0.96)]"
          @click="restart"
        >
          Restart timer</button
        ><button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink py-2.5 px-[15px] [&:hover]:bg-hover"
          @click="resetOpen = false"
        >
          Keep going
        </button>
      </div></AppDialog
    >
    <AppDialog v-model="restore" title="Restore the original rhythm?"
      ><p>This replaces your plan, tasks, and journal, and resets the timer.</p>
      <div
        class="flex flex-wrap gap-2.5 my-5 mx-0 [@media(width<=700px)]:[&_>_button]:flex-1 [@media(width<=700px)]:[&_>_button]:min-w-32.5"
      >
        <button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-accent text-on-accent py-2.5 px-[15px] [&:hover]:[filter:brightness(0.96)]"
          @click="restoreSample"
        >
          Restore sample</button
        ><button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink py-2.5 px-[15px] [&:hover]:bg-hover"
          @click="restore = false"
        >
          Keep my session
        </button>
      </div></AppDialog
    >
    <AppDialog v-model="clear" title="Clear the completed intervals?"
      ><p>This clears the saved journal. Your current interval keeps running.</p>
      <div
        class="flex flex-wrap gap-2.5 my-5 mx-0 [@media(width<=700px)]:[&_>_button]:flex-1 [@media(width<=700px)]:[&_>_button]:min-w-32.5"
      >
        <button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-accent text-on-accent py-2.5 px-[15px] [&:hover]:[filter:brightness(0.96)]"
          @click="clearJournal"
        >
          Clear completed intervals</button
        ><button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink py-2.5 px-[15px] [&:hover]:bg-hover"
          @click="clear = false"
        >
          Keep the journal
        </button>
      </div></AppDialog
    >
  </div>
</template>
