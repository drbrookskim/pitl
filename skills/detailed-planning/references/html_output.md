# HTML Output — structure, interactivity, styling

The deliverable is ONE self-contained interactive HTML file written to `/mnt/user-data/outputs/` and
presented with `present_files`. It must render the 5-stage plan as a navigable, interactive document —
"structured AND interactive," per the user's requirement. No external assets, no build step, no
localStorage/sessionStorage.

## Required structure (in order)

1. **Header** — plan title (derived from the input concept), a one-line 핵심 메시지 subtitle, and, if
   any assumption was made, a visible `가정:` chip.
2. **Stage navigation** — a sticky tab/step bar with the 5 stages (0 왜 · 1 개념 · 2 시나리오 ·
   3 가지치기·가치검증 · 4 스토리텔링). Clicking a tab reveals that stage's panel. The pipeline order
   must be visible — this is the spine of the method.
3. **Stage 0 — 왜:** the real (Unmet) Need statement, plus the 1–3 "왜" questions that surfaced it,
   shown as a short ladder.
4. **Stage 1 — 개념:** four labelled cards (핵심 가치 / 사용자 이점 / 핵심 메시지 / 왜) plus a
   **positioning lens** block that shows the chosen call (e.g., a toggle/segmented control highlighting
   대체재 vs 보완재, 보편성 vs 차별성, etc., with the selected side emphasized and a one-line rationale).
5. **Stage 2 — 시나리오:** the user storyline as numbered steps, and a **Problem → Solution table**.
   Each scenario item carries a **Must-have / Nice-to-have badge** that the user can *toggle to filter*
   (a control that shows All / Must-have only / Nice-to-have only).
6. **Stage 3 — 가지치기 + 가치검증:** a **before → after pruning view** (what was considered vs what
   survived), and an interactive **가치 게이트**: each surviving item passes the question "이 가치가
   맞는가?" — render it as a checklist the user can tick, with pruned items visibly struck through.
   Include the 핍진성 checklist (구체성 · 진정성 · 일관성).
7. **Stage 4 — 스토리텔링:** the persuasive narrative close in the authorial voice, ending on the
   reflective question.
8. **Footer** — a compact one-glance summary line (real need → concept → core scenario → essence).

## Interactive elements (must include at least these)

- Stage tab/step navigation (reveals one stage panel at a time, with prev/next).
- Must-have / Nice-to-have filter on the scenario.
- The value-check gate as tickable items, with pruned items struck through.
- A positioning-lens selector that visibly marks the chosen side.

Keep JS vanilla and inline. All interactivity is client-side state in JS variables / DOM — never
browser storage.

## Styling

- Self-contained `<style>` block. Clean, editorial, readable — this is a thinking document, not a
  dashboard. Generous whitespace, a clear type hierarchy, restrained palette (one accent color for the
  active stage and the value-gate pass state).
- Stage panels visually distinct but consistent. Cards for the 개념 elements. A real table for
  Problem → Solution.
- Mobile-friendly: stack cards and let the tab bar wrap. The user is often on mobile.
- Korean and English must both render cleanly; use a system font stack that covers Hangul
  (e.g., `-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif`).
- Do not use emojis as decoration; if a marker is needed, prefer simple typographic ones.

## Skeleton (adapt; do not ship verbatim)

```html
<!-- write to /mnt/user-data/outputs/<concept-slug>-plan.html -->
<div id="plan">
  <header>… title · 핵심 메시지 · 가정 chip …</header>
  <nav class="stages">… 5 buttons …</nav>

  <section data-stage="0">…real need + why-ladder…</section>
  <section data-stage="1" hidden>…4 concept cards + positioning lens selector…</section>
  <section data-stage="2" hidden>…storyline steps + Problem/Solution table + M/N filter…</section>
  <section data-stage="3" hidden>…pruning before→after + value-gate checklist + 핍진성…</section>
  <section data-stage="4" hidden>…storytelling narrative + closing question…</section>

  <footer>…one-glance summary…</footer>
</div>
<style>/* editorial, mobile-friendly, Hangul-safe */</style>
<script>
  // vanilla: tab switching, M/N filter, value-gate ticking. No localStorage.
</script>
```

## Reminders

- Match the input language throughout the artifact.
- The narrative prose follows `voice.md`; the structure follows this file.
- After writing, call `present_files` with the HTML path and keep the chat message to 2–4 sentences.
