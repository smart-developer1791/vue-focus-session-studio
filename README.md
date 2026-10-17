<div align="center">

# ⏳ Focus Session Studio

**One small thing. A little room to focus.**

![Vue](https://img.shields.io/badge/Vue-3-42b883?style=for-the-badge&logo=vuedotjs&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=ffffff)
![License](https://img.shields.io/badge/License-MIT-a48750?style=for-the-badge)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

_Vue focus session planner with reactive prop getters, a deadline-based timer, local tasks, completed-interval history, and JSON/CSV exports._

</div>

---

## ✨ Highlights

- **An Intentional Rhythm:** Configure focus, short rest, longer rest, cycles, and the long-rest interval.
- **One Interval at a Time:** Start each phase when ready, pause/resume, and restart with confirmation.
- **Stable Running Time:** Capture each started interval while live plan changes update later phases.
- **A Few Clear Intentions:** Add, edit, mark, and remove up to twelve small tasks independently of the timer.
- **A Little Record:** Keep the latest hundred completed intervals and export editable JSON or quoted CSV.
- **Local Workspace:** Validated device-local persistence and failure-preserving imports.
- **Project Identity:** Original artwork, CodeSculptor attribution, and deterministic workspace markers.

## 🧱 Project Structure

```text
public/
|-- favicon.svg                         # Original identity
|-- og.svg                              # Original 1200 × 630 social artwork
|-- font-licenses.txt                   # Copyright and OFL text for local fonts
`-- sample-workspace.json               # Complete importable workspace
src/
|-- components/
|   |-- AppDialog.vue                   # Native modal Teleport and focus lifecycle
|   |-- AppIcon.vue                     # Native interface SVG
|   `-- SessionClock.vue                # Reactive destructured props and timer controls
|-- composables/
|   `-- useSessionClock.ts              # Getter normalization, captured phases, and cleanup
|-- domain/
|   `-- session.ts                      # FS/1 validation, phase plans, remaining time, and CSV
|-- services/
|   |-- draft.ts                        # Validated local persistence
|   `-- files.ts                        # Downloads and deterministic stamps
|-- App.vue                             # Plan, tasks, journal, and data exchange
|-- base.css                            # Tailwind theme and native element defaults
|-- main.ts                             # Vue application entry
`-- style.css                           # Brand tokens and domain-specific styles
tests/
|-- e2e/session.spec.ts
`-- session.test.ts
index.html                              # English metadata and application mount
package.json                            # Project-local dependencies and scripts
playwright.config.ts                    # Production browser workflows
vite.config.ts                          # Vue/Tailwind configuration
vercel.json                             # Explicit routing, cache, and response headers
```

## 🛠️ Tech Stack

Vue 3, TypeScript 6, Vite 8, Tailwind CSS 4, and locally bundled DM Sans/Bricolage Grotesque variable fonts. Prettier handles formatting; Node's native test runner checks domain boundaries; Playwright checks the actual production app. All dependencies are installed in this project. No external data service is required.

## 🎨 Tailwind Styling

The application uses Tailwind CSS 4 utilities directly in Vue templates for layout, spacing, typography, borders, colors, and visible states. Responsive and selector variants preserve the existing desktop and narrow-screen layouts. Utility names are complete source strings that Tailwind can detect during the Vite build.

`src/base.css` defines the font and spacing theme, maps project colors through `@theme inline`, and uses `@apply` for native element defaults. `src/style.css` holds the original brand tokens and any remaining domain-specific rules. Dynamic classes express Vue states, while explicit `data-ui` attributes identify elements used by descendant utilities or browser tests. Unused class names are removed. The spacing unit is `4px` to preserve the original pixel measurements independently of the root font size.

The progress angle remains a reactive CSS custom property; Tailwind styles the timer, plan, and journal.

## 📦 Included Demo Data

`public/sample-workspace.json` is a complete importable FS/1 fixture with matching canonical provenance. Defaults are also included in the application source; startup does not fetch this fixture. Parsers reconstruct known fields and ignore unknown metadata.

The original sample is a four-cycle 25-minute focus plan with five-minute short rests and fifteen-minute longer rests every second cycle. It includes three original task intentions and an empty completed-interval journal. No completed work is invented at startup.

## 🚀 Local Development

Requires Node.js 24 or later.

```bash
npm ci
npm run dev
```

Open the Local URL printed by Vite, normally `http://localhost:5173`.

```bash
npm run build
npm run preview
```

## ◈ Vue Implementation

`SessionClock.vue` destructures `work`, `rest`, `longRest`, `cycles`, and `longEvery` from `defineProps`. Vue 3.5+ preserves reactivity through its compiler transform. An explicit getter passes those values to `useSessionClock`, whose `MaybeRefOrGetter` argument is normalized with `toValue`. The composable derives ready/next phases from current props and captures a detached phase when it starts. Paused intervals retain that capture. Changing the plan updates the next interval without remounting the timer or altering its elapsed time. Scoped disposal clears the native interval.

References: [Vue reactive props destructure](https://vuejs.org/api/sfc-script-setup.html#reactive-props-destructure), [toValue](https://vuejs.org/api/reactivity-utilities.html#tovalue).

## 💾 Local Drafts & Data Exchange

Validated plans, task marks, and completed intervals save to localStorage. Invalid direct edits keep the last valid saved plan and preview and disable exports. Completed intervals can still enter the in-memory journal while a draft is invalid; correcting the draft saves them. Timer index, elapsed time, pause state, and editor tab belong to the current mounted tab. Reload starts the first interval ready, with the saved plan and history.

The storage key is `focus-session-studio:FS1`. Corrupted or unavailable saved data falls back to the sample. Storage errors appear in the desktop header; exports provide a portable copy before clearing browser data or changing devices. No tracking or data-upload requests are made.

## ◈ Project Markers

JSON provenance identifies `vue-focus-session-studio`, CodeSculptor, and a deterministic `FS-XXXXXXXX` checksum. Canonical field/collection ordering gives the same valid workspace the same stamp. This is an identity aid, not a cryptographic signature or uniqueness guarantee. Export filenames/source comments carry the marker where relevant. Original favicon/social artwork identify this project.

## 🔌 Extension Notes & Nuances

Focus uses integer 1–90 minutes; short rest 1–30; long rest 1–60; cycles 1–8; long-rest cadence 2–6. The plan alternates focus/rest and ends after its final focus, without a trailing break. Each phase requires an explicit start; finishing one phase never silently runs the next. Reducing cycles below the current phase ends the session after that captured interval finishes. After a session is complete, restart to run a changed plan.

Timing uses elapsed `performance.now()` milliseconds plus carried pause time, rather than decrementing a counter per callback. A delayed callback completes one interval and records it once; the next waits for the user. Browser throttling can delay visible updates and the recorded completion timestamp. Closed pages do not run timers. This is a focus aid, not a background alarm; there are no notifications or sound permissions.

Tasks need safe unique identities and single-line titles up to 80 characters. Workspaces use FS/1 and titles up to 80 characters. Journal entries require supported phase kinds, canonical ISO UTC timestamps, safe identities, and 60–5400 planned seconds. The journal stores completed intervals, not abandoned/reset ones. It keeps the latest 100 records. CSV labels are quoted and formula-leading characters are prefixed for spreadsheet safety; CSV records planned duration and UTC start/finish times, including wall time spent paused.

JSON files may be at most 100 KB. Valid imports replace the complete workspace and reset timer progress; rejected imports preserve both. Restart keeps tasks/history; sample restore replaces them and resets the timer; journal clearing keeps the current interval running. These actions use explicit confirmation dialogs.

Panels/cards reserve space across tabs, selections, story expansion, and modes; longer content scrolls inside. Layouts support 320 px screens and reduced motion. Native dialogs manage modal focus and Escape. Social artwork is SVG; convert it to PNG for services requiring raster artwork.

## 🧪 Build & Checks

```bash
npm run format:check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Four native tests cover detached/bounded imports, alternating phase plans and final boundaries, elapsed-time calculations, and CSV escaping/formula guards. Four production browser workflows use accelerated browser clocks to verify captured durations, pause/resume, changed future phases, single completion, actual JSON/CSV downloads, reload, task persistence, rejected imports, invalid fields, confirmed restart, and stable 320 px panels. Browser tests use the production build. Generated builds, browser output, and traces are ignored by Git.

## 🌐 Pages & Vercel Deployment

- `/` — application
- `/sample-workspace.json` — importable FS/1 fixture
- `/font-licenses.txt` — bundled font license text

Import this directory as the Vercel project root. The explicit configuration uses the Vite preset, `npm ci`, `npm run build`, and `dist`. The development command forwards `$PORT` to Vite with `--strictPort`.

- `/` serves the app; `/index.html` permanently redirects to `/`.
- Trailing slashes are removed, with no catch-all rewrite.
- HTML, sample files, artwork, and font license text require revalidation.
- Content-hashed JS, CSS, and WOFF2 files in `/assets/` receive a one-year immutable cache policy.
- Responses include `X-Content-Type-Options: nosniff` and `Referrer-Policy`.
- Static files keep their paths; missing files do not fall back to HTML.

Vite preview does not emulate Vercel routing/headers. Local schema, route, asset, and `$PORT` checks do not replace HTTP checks against an actual deployment.

## 📄 License

MIT License. See [LICENSE](./LICENSE). The local fonts retain original copyright and OFL text in [font-licenses.txt](./public/font-licenses.txt).
