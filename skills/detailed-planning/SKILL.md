---
name: detailed-planning
description: >
  Turn any concept, question, or request into a complete, structured plan and render it as an
  interactive HTML artifact. The plan is built on a 개념(Concept) → 시나리오(Scenario) spine:
  it defines the concept (core value, user benefit, message, and the *why*), then derives concrete
  use cases / user scenarios (step-by-step, Must-have vs Nice-to-have), prunes to the essence around
  a value-check, and wraps it in a persuasive storyline. ALWAYS use this skill when the user says
  "detailed plan", "make the plan", "plan this", "기획해줘", "기획안", "이거 기획", "개념/시나리오",
  "use case", "기획서", or hands over a raw idea/topic/problem and wants it developed into a worked-out
  plan — even if they don't literally say the word "plan". Do NOT use it for a quick one-line answer,
  a simple list, code, or pure factual lookup; use it when the request deserves a worked-out,
  rendered plan. Output language ALWAYS matches the language of the user's input.
---

# Detailed Planning (개념·시나리오 기획)

This skill produces a **worked-out plan** from a single input — a concept, a question, a topic, or
a half-formed request — and renders it as a **structured, interactive HTML artifact**. It encodes a
specific planning philosophy (the "DHK 기획" method) rather than a generic template. The point is not
to fill boxes but to *think through* the input the way a seasoned 기획자 would: ask why, define the
concept, imagine the scenario, prune to the essence, and tell the story.

## When this triggers

Use it whenever the user wants an idea developed into a real plan: "이거 기획해줘", "make a detailed
plan for X", "plan this feature/service/product/campaign", "what's the concept and use case for…",
"기획안 만들어줘". A bare topic or problem statement ("무선 이어폰", "사내 지식 검색 도구", "a habit
app for busy parents") is a valid trigger — treat it as the seed concept and run the full pipeline.

If the input is genuinely too thin to plan, make ONE reasonable assumption, state it inline at the top
of the plan ("가정:…"), and proceed. Do not interrogate the user with a list of questions first.

## The pipeline (run in order)

The plan is the output of a 5-stage pipeline. Each stage feeds the next. Read
`references/methodology.md` for the full reasoning behind each stage and the source principles — do
this before writing the plan, every time, because the quality lives in the *reasoning*, not the layout.

0. **왜 (Why) — frame the real need.** Ask "왜?" repeatedly (5 Why) to get past the surface request to
   the underlying value the user is actually after. Separate the stated request from the real
   (Unmet) Need. This becomes the future decision criterion for everything downstream.

1. **개념 (Concept) — the ideal.** Define what the project points to:
   - 핵심 가치 (User Value) — the value it ultimately delivers
   - 사용자 이점 (User Benefit) — the concrete benefit to the user
   - 핵심 메시지 (Message) — the one-line essence ("말 되네")
   - 왜 (목적·근거·명분) — why do this, why it's needed
   - **Positioning lens** — pick the one(s) that fit and state the call: 새로움 vs 개선 /
     대체재 vs 보완재 / 보편성 vs 차별성 / Vertical vs Horizontal.

2. **시나리오 (Scenario) — the real.** Ground the floating concept. Write the user storyline:
   "특정 상황을 가정하여, 사용자는 ___한 상황을 접하고, 이 기획이 그것을 ___한 방법으로 해결해 준다."
   - Step-by-step usage flow
   - Problem → Solution mapping (each problem's solution should change the *concept*, not just patch
     the symptom — see the 무선 이어폰 example in methodology.md)
   - **Must-have vs Nice-to-have** split.

3. **가지치기 (Pruning) + 가치 검증 (Value check) — converge.** Now subtract. Prune features, persona,
   and steps to the essence ("버릴 게 무엇인지 알아내라"). Then run the value gate:
   **"사용자에게 주려는 가치가 정말 이게 맞는가?"** Anything that doesn't serve the Stage-0 value is
   pruned. Finish with a 핍진성(verisimilitude) check: 구체성 · 진정성 · 일관성.

4. **스토리텔링 (Storytelling) — make it land.** Wrap the whole thing in a short persuasive narrative so
   a reader thinks "말 되네." Both What(만들기) and How(팔기/전달) matter.

## Output: structured + interactive HTML

The deliverable is a single self-contained interactive HTML artifact, NOT prose in the chat. Read
`references/html_output.md` for the required structure, the interactive elements (stage navigation,
Must/Nice-to-have toggles, the value-check gate, pruning before/after), and the styling constraints.

Write the HTML to `/mnt/user-data/outputs/` and present it with `present_files`. Keep a short (2–4
sentence) framing message in the chat; the plan itself lives in the artifact.

## Voice

The prose *inside* the artifact — the concept narrative, the rationale, the storytelling — must carry
the author's reflective, analogy-driven, value-centered voice. Read `references/voice.md` before
writing any narrative text. The structure is crisp and scannable; the narrative is contemplative.

## Language

Detect the language of the user's input and produce the entire plan in that language. Korean input →
Korean plan; English input → English plan. Keep the established Korean planning terms
(개념/시나리오/가치/Must-have 등) where they are the natural term, even in an English plan, if that is
how the author would write it.

## Reference files

- `references/methodology.md` — the full 5-stage pipeline, the 14 core principles, and worked examples.
  **Read this first, every run.**
- `references/voice.md` — voice and tone guide with do/don't and example phrasings.
- `references/html_output.md` — required HTML structure, interactive elements, and styling.
