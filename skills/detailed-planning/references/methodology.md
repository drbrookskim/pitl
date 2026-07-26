# Planning Methodology — the DHK 기획 method

This is the reasoning engine of the skill. The 5-stage pipeline in SKILL.md is the *procedure*; this
file is *why each stage exists* and how to do it well. A plan that follows the layout but skips the
reasoning is a hollow plan ("내용 없는 사고는 공허하고, 개념 없는 직관은 맹목적이다"). Read this before
writing.

The method rests on one conviction: **기획은 머릿속 상상을 현실로 가져와 구현하는 작업이며, 그 완성은
'개념(Concept)'과 '시나리오(Scenario)' 두 가지로 끝난다.** Everything below serves those two pillars.

---

## The 5 stages, in depth

### Stage 0 — 왜(Why): frame the real need

Planning starts with self-questioning (자문), not answers. Ask "왜?" repeatedly — the 5 Why discipline —
to move from the surface request to the underlying value. "왜(Why)를 묻다 보면 무엇(What)을 해야 할지
답이 나온다."

The trap to avoid is mistaking the *stated* request for the *real* need. A user who asks for "a faster
horse" actually wants to get somewhere faster (Unmet Need). Surface the real (Unmet) Need explicitly;
it becomes the **decision criterion** that every later stage is checked against. When the plan later
drifts (and it will — "기획의 왜곡"), this is the anchor you return to.

Output of this stage: a crisp statement of the real need behind the input, plus the 1–3 "왜" questions
that exposed it.

### Stage 1 — 개념(Concept): the ideal space

The concept is what the project *points to* — it lives in "이상 공간," floating above reality. Define:

- **핵심 가치 (User Value)** — the value it ultimately delivers. Not a feature; a value. "무언가를
  만들려 하지 말고, 가치를 만들어라. 가치에 주목할 때 제품은 거들 뿐이다."
- **사용자 이점 (User Benefit)** — the concrete benefit the user receives from that value.
- **핵심 메시지 (Message)** — the one-line essence. If a reader can't think "말 되네" after this line,
  the concept isn't sharp enough.
- **왜 (목적·근거·명분)** — why do this, why is it needed, on what grounds. This is the logical
  justification that future decisions will be measured against (Simon Sinek's "Start with Why").

Then pick the **positioning lens(es)** that fit and *make the call* — don't just list them:

- **새로움 vs 개선** — is this a new thing (a 대체재 candidate) or an improvement of an existing thing?
- **대체재 vs 보완재** — does it replace something (substitute) or multiply the value of something
  else (complement)? Note that positioning often *migrates* over time (대체재 → 보완재); say so if
  relevant.
- **보편성 vs 차별성** — a strong plan takes a universal behavior and makes it feel distinctly better.
  Being a follower of a universal form isn't enough; the differentiator is what makes it #1.
- **Vertical vs Horizontal** — a focused specialized offering, or a broad one? (Apps tend to start
  vertical and converge horizontal; AI services the reverse. Either way they converge on sustained
  user retention.)

### Stage 2 — 시나리오(Scenario): grounding in reality

If the concept is the floating ideal, the scenario is what "현실 공간에서 구체화"한다. It is a
storyline — a 사용자 시나리오 — that lets everyone involved *empathize* with the user and raises
concrete executability.

Write it as: **"특정 상황을 가정하여, 사용자는 ___한 상황을 접하고, 이 기획이 그 상황과 문제를 ___한
방법으로 해결해 준다."** Use a Step-by-Step form.

Then build the **Problem → Solution mapping**. The discipline here is the lesson of the 무선 이어폰
example: a real plan doesn't patch the symptom, it **changes the concept**.

> 유선 이어폰의 문제: ① 선이 꼬인다 ② 귀에서 빠진다 ③ ANC 부품이 선 중간에 달려 거추장스럽다.
> 약한 해결책 = "덜 꼬이는 소재로 바꾼다" (소재가 낡으면 또 꼬인다 — 근본 해결이 아님).
> 강한 해결책 = ① 선 자체를 없앤다(콘셉트 변경) ② 선이 없으니 행동이 자유롭다 ③ 본체에 배터리·ANC를
> 일체화(디자인 개선). → 문제를 분석한 게 아니라 전혀 새로운 형태를 고안했다.

For each scenario element, mark **Must-have vs Nice-to-have**. The Must-haves are non-negotiable to
the core value; Nice-to-haves are candidates for the next stage's pruning.

### Stage 3 — 가지치기(Pruning) + 가치 검증(Value check): converge

Now subtract. "현상은 복잡하다. 법칙은 단순하다. ……버릴 게 무엇인지 알아내라." (Feynman) The hardest
and most important planning act is not deciding what to add — it's the *courage to prune*. Apply
Occam's razor:

- prune the **feature list** to the core that solves the real need,
- prune the **target persona** — serve the core customer perfectly instead of everyone passably,
- prune the **UX** — cut steps, clicks, and text for an elegant path.

Then run the **value gate** — the single most important question in the whole method:

> **"사용자에게 주려는 가치가 정말 이게 맞는가?"**

발산(divergence) is fine while generating ideas, but 수렴(convergence) must always resolve back to
value-centered thinking. Anything that doesn't serve the Stage-0 real need gets pruned here. This is
the guard against 기획의 왜곡 — the drift that happens when "여기저기서 숟가락을 얹어" the original
intent disappears.

Close with a **핍진성(verisimilitude) check** — is the plan credible and plausible? Three tests:
- **구체성** — specific evidence and concrete examples, not vague superlatives.
- **진정성** — grounded in real user behavior / experience, not creator convenience.
- **일관성** — the logic of the message holds together with its surroundings.

### Stage 4 — 스토리텔링(Storytelling): make it land

Information and features become persuasive only as a *story*. "정보(재료)가 스토리로 구사"되어야 한다.
The aim: the reader/consumer thinks **"음, 말 되네"** — that's already half the battle won.

Remember both halves: **무엇(What)을 만드느냐**도 중요하지만 **어떻게(How) 파느냐/전달하느냐**도
똑같이 중요하다. End the plan with a short narrative that ties value, benefit, scenario, and the pruned
essence into one line a stakeholder would repeat.

---

## The 14 underlying principles (the "why" behind the stages)

Use these as the texture of the reasoning. They are the recurring convictions across the source essays.

1. **개념 + 시나리오 = 기획 완성.** A plan is done when the concept (가치·이점·메시지·왜) and the
   scenario (쓰임새 storyline) are both there. This is the spine.
2. **Why → What.** Curiosity-driven self-questioning; 5 Why surfaces the real need.
3. **가치 중심적 사고.** Converge to value. Value ≠ price. Make value, not things.
4. **본질 명확화 = 단순화.** Pruning/subtraction. Less is more; the courage to cut.
5. **상상 → 추상 → 묘사.** Planning = imagining, then abstracting (needs 설명) and describing
   (needs 묘사). Bring the imagined into the real.
6. **스토리텔링.** Weave features/info into a story; "말 되네" = half-success.
7. **포지셔닝 이분법.** 대체재/보완재, 보편성/차별성, 새로움/개선, Vertical/Horizontal — framing lenses.
8. **핍진성.** 구체성·진정성·일관성 → credibility & plausibility.
9. **귀납 + 절충형 사고.** 관찰→분류→개념. Plans are hypotheses ("유용할 것이다"); accept that the user
   may differ. "인생에 '반드시'는 없다. 상황에 따라 '적절하게' 대처할 뿐."
10. **사용자 중심(≠ 창작자 중심).** Design from the user's POV (역지사지), end-to-end; first impression
    decides. The constant temptation is to design for creator convenience — resist it.
11. **최초의 정의자 / 명명(Naming).** Planning finds hidden connections and gives them a new name.
    Combine bold imagination with cold realistic efficiency-check → "심미적 실용성."
12. **스스로 설득 먼저.** You can't persuade others with what you haven't convinced yourself of. The
    self-referential cycle: 계획 → 실험·실행 → 피드백.
13. **기획다움.** 목표·미래 지향 / 체계적·분석적 / 지속적·포괄적 / 유연·창의적 / 가치 창출적.
14. **과유불급 / 적당함.** Balance 시급성 vs 충족성; not everything needs maximal depth — match the
    situation.

---

## A note on register

The method is humble and inductive. Prefer "~할 것이다 / 유용할 것이다 / ~이지 않을까" framings over
absolute claims. State assumptions openly. Offer the reasoning, not just the conclusion — the reader
should be able to follow *why* a concept was chosen and *why* something was pruned.
