---
name: pitl-orchestrator
description: "Planning-in-the-Loop(PITL) 기반 에세이 및 상품 기획 자동화 팀 오케스트레이터. 새로운 주제의 에세이 집필, 주어진 입력에 따른 유동적인 상품기획프로세스(1-pager 요약서, PRD 요구서, 와이어프레임 3안) 설계, 또는 기존 생성 결과에 대한 다시 실행, 재실행, 업데이트, 수정, 보완, 다시, 이전 결과 기반 개선 등을 요청할 때 반드시 이 스킬을 호출할 것."
---

# PITL (Planning-in-the-Loop) Unified Orchestrator

이 스킬은 **Essay Writing (에세이 창작)** 및 **Product Planning (상품 기획 프로세스)** 두 가지 모드를 자체 판별하여 에이전트 팀을 스폰하고 조율하는 최상위 오케스트레이터입니다.

## 실행 모드: 에이전트 팀 (Agent Team)

---

## 1. 모드별 에이전트 및 스킬 구성

모든 Agent 호출에는 `model: "opus"`를 지정하여 최고의 추론 품질을 보장합니다.

### A. 에세이 창작 모드 (Essay Mode)
| 팀원 | 타입 | 역할 | 전용 스킬 | 출력 산출물 |
| :--- | :--- | :--- | :--- | :--- |
| **pitl-planner** | general-purpose | 철학적 뼈대 및 지식 그래프 엣지 기획 | `essay-planner` | `_workspace/01_planner_structure.md` |
| **thought-writer** | general-purpose | 작가 고유의 성찰적 톤 에세이 집필 | `essay-writer` | `_workspace/02_writer_draft.md` |
| **thought-critic** | general-purpose | 정량/정성 교차 QA 및 연결성 검증 | `essay-critic` | `_workspace/03_critic_review.md` |

### B. 상품 기획 모드 (Product Mode)
| 팀원 | 타입 | 역할 | 전용 스킬 | 출력 산출물 |
| :--- | :--- | :--- | :--- | :--- |
| **product-strategist** | general-purpose | 문제 정의 및 비즈니스 1-pager 기획 | `product-strategist` | `_workspace/01_strategist_1pager.md` |
| **prd-analyst** | general-purpose | 제품 기능 명세 및 예외 정책 PRD 작성 | `prd-analyst` | `_workspace/02_prd_spec.md` |
| **ux-architect** | general-purpose | 3가지 가치 지향(Type A/B/C) ASCII 와이어프레임 설계 | `ux-architect` | `_workspace/03_ux_wireframes.md` |
| **product-reviewer** | general-purpose | 1-pager, PRD, 와이어프레임 삼각 QA 검증 | `product-reviewer` | `_workspace/04_reviewer_audit.md` |

---

## 2. 워크플로우

### Phase 0: 컨텍스트 확인 (후속 및 부분 재실행 지원)
1. 현재 작업 경로 하위에 `_workspace/` 디렉토리가 존재하는지 확인합니다.
2. 실행 시나리오를 세 가지로 판별하여 분기합니다:
   - **`_workspace/` 미존재 (초기 실행)**: Phase 1로 진입하여 새로운 작업을 시작합니다.
   - **`_workspace/` 존재 + 사용자가 부분 수정/보완 요청 (부분 재실행)**: 기존 산출물들을 보존한 채, 해당 부분 담당 에이전트와 Reviewer만 재호출하여 특정 문맥이나 설계 요소만 수정 및 검증합니다.
   - **`_workspace/` 존재 + 완전 새로운 주제 입력 (새 실행)**: 기존의 `_workspace/` 디렉토리를 `_workspace_prev_{YYYYMMDD_HHMMSS}/`로 안전하게 백업 이동한 후, 신규 `_workspace/`를 생성하여 Phase 1을 시작합니다.

### Phase 1: 준비 및 모드 판별 (Mode Detection)
1. 사용자의 입력을 분석하여 기획할 작업 도메인을 감지합니다:
   - **에세이/철학/Brunch 키워드 감지** → **Essay Mode** 선택.
   - **상품기획/프로세스/1-pager/PRD/와이어프레임 키워드 감지** → **Product Mode** 선택.
2. 작업 디렉토리 `_workspace/`를 생성하고, 사용자의 초기 요구사항을 `_workspace/00_input.md`로 기록해 보존합니다.

### Phase 2: 에이전트 팀 구성 및 태스크 할당

#### Essay Mode 팀 구성:
```
TeamCreate(
  team_name: "pitl-essay-team",
  members: [
    { name: "pitl-planner", agent_type: "general-purpose", model: "opus", prompt: "essay-planner 스킬을 탑재하고 철학적 논리 구조 설계 및 지식 그래프 엣지 기획을 전담하라." },
    { name: "thought-writer", agent_type: "general-purpose", model: "opus", prompt: "essay-writer 스킬을 탑재하고 작가 특유의 introspective Korean 문체로 풀텍스트 집필을 전담하라." },
    { name: "thought-critic", agent_type: "general-purpose", model: "opus", prompt: "essay-critic 스킬을 탑재하고 정량/정성 품질 평가 및 incremental QA 검수를 전담하라." }
  ]
)
```
- 태스크: [1] 철학적 뼈대 및 지식 그래프 기획 (`pitl-planner`) → [2] 작가 특유의 문체로 풀텍스트 초안 집필 (`thought-writer`) → [3] 종합 정합성 검수 및 품질 평가 (`thought-critic`).

#### Product Mode 팀 구성:
```
TeamCreate(
  team_name: "pitl-product-team",
  members: [
    { name: "product-strategist", agent_type: "general-purpose", model: "opus", prompt: "product-strategist 스킬을 탑재하고 1-pager 비즈니스 목표 수립을 전담하라." },
    { name: "prd-analyst", agent_type: "general-purpose", model: "opus", prompt: "prd-analyst 스킬을 탑재하고 상세 KPI 명세 및 예외 정책 수립을 전담하라." },
    { name: "ux-architect", agent_type: "general-purpose", model: "opus", prompt: "ux-architect 스킬을 탑재하고 Type A/B/C ASCII 와이어프레임 작조를 전담하라." },
    { name: "product-reviewer", agent_type: "general-purpose", model: "opus", prompt: "product-reviewer 스킬을 탑재하고 1-pager, PRD, 와이어프레임 간 삼각 정합성 검수를 전담하라." }
  ]
)
```
- 태스크 등록 (`TaskCreate`):
  ```
  TaskCreate(tasks: [
    { title: "비즈니스 1-pager 기획 요약서 생성", description: "문제를 정의하고 정량 목표가 담긴 1-pager 요약서를 작성하라.", assignee: "product-strategist" },
    { title: "상세 기능 요건 및 예외 정책 PRD 정의", description: "1-pager를 토대로 REQ ID, KPI식, 예외 정책이 담긴 정교한 PRD를 설계하라.", assignee: "prd-analyst", depends_on: ["비즈니스 1-pager 기획 요약서 생성"] },
    { title: "Type A/B/C 3안 ASCII 와이어프레임 설계", description: "PRD 요구조건이 완전히 반영된 3가지 서로 다른 UI 시안을 ASCII로 작조하라.", assignee: "ux-architect", depends_on: ["상세 기능 요건 및 예외 정책 PRD 정의"] },
    { title: "종합 삼각 정합성 QA 검수", description: "1-pager, PRD, 와이어프레임 간에 비즈니스 및 기능적 괴리가 없는지 교차 정합성을 검증하라.", assignee: "product-reviewer", depends_on: ["Type A/B/C 3안 ASCII 와이어프레임 설계"] }
  ])
  ```

### Phase 3: 에이전트 협업 실행 (자체 조율)
- 팀원들은 `TaskCreate`/`TaskUpdate`를 활용하여 진척 상황을 실시간 공유하며, `SendMessage`를 통해 피드백과 아이디어를 긴밀하게 교환합니다.
- **피드백 루프**: Reviewer가 `[REVISION NEEDED]` 판정을 내릴 경우 관련 에이전트에게 `SendMessage`로 반려 사유와 수정 권장안을 전송하며, 최대 2회까지 루프 보강을 거칩니다.

### Phase 4: 최종 산출물 수집 및 통합 배포

#### Essay Mode:
1. `_workspace/02_writer_draft.md`를 parent 디렉토리 `../brunch_articles/{clean_title}.md`로 영구 배포합니다.
2. 지식 그래프 업데이트를 위해 카테고리 인덱스 파일(예: `../기획론.md` 등) 및 `../index.html` 지식 그래프 데이터를 동기화합니다.

#### Product Mode:
1. 기획 산출물의 파일명을 **보안 검증** 규칙에 맞추어 정제(Sanitize)합니다:
   - 영문, 한글, 숫자, 하이픈(`-`), 언더바(`_`)만 허용하며, 경로 이탈 문자(`..`, `/`, `\`) 및 쉘 메타 문자를 완전히 제거합니다.
2. 정제된 파일명으로 프로젝트 디렉토리 내 `outputs/` 폴더에 마크다운 파일로 저장합니다:
   - `1pager_[제목요약]_[YYMMDD].md`
   - `prd_[제목요약]_[YYMMDD].md`
   - `wireframe_[제목요약]_[YYMMDD].md`
3. **Command Safety 규칙 준수 PDF 변환**:
   - 사용자가 PDF 변환 출력을 요청한 경우, `pandoc --version`을 먼저 실행하여 설치 여부를 체크합니다.
   - pandoc이 설치되어 있으면 파일명을 싱글 쿼트(`'`)로 안전하게 감싸서 `pandoc '[input.md]' -o '[output.pdf]'` 형태로 호출 및 컴파일을 완료합니다.

### Phase 5: 정리 및 최종 보고
1. `TeamDelete`를 호출하여 스폰된 에이전트 팀 인스턴스들을 말끔히 해체합니다.
2. `_workspace/` 및 중간 산출물 히스토리는 향후 부분 재작업 요구에 대응하기 위해 보존합니다.
3. 배포된 최종 파일 경로를 포함한 완성 기획 프로세스를 사용자에게 사실적으로 요약 보고합니다.

---

## 에러 핸들링 및 예외 복구

| 시나리오 | 대응 전략 |
| :--- | :--- |
| **품질 검수 2회 반려 돌파** | Reviewer가 2회 이상 동일 사안에 대해 보완 지시를 내렸음에도 일관성이 불충족될 경우, Reviewer가 직접 해당 안의 정합성 대안 문장을 작성하여 `diff` 형식으로 통합 및 강제 통과시킵니다. |
| **pandoc 누락 에러** | PDF 컴파일 실패 시 즉시 복구 흐름으로 전환하여 마크다운(.md) 파일 출력을 확실하게 안전하게 보존하고, 사용자에게 pandoc 설치 명령어 가이드를 띄웁니다. |

---

## 테스트 시나리오

### 1. 정상 흐름 (Happy Path - Product Mode)
- **입력**: "구글 뉴스 API 기반 온디맨드 주식 뉴스 핀더 서비스 상품기획프로세스 만들어줘."
- **진행**:
  1. `_workspace/` 생성 및 모드 판별 (Product Mode 감지).
  2. 에이전트 4인팀 `TeamCreate`로 생성 및 태스크 등록.
  3. `product-strategist`가 1-pager 요약서 완성 (`01_strategist_1pager.md`).
  4. `prd-analyst`가 API 타임아웃 예외 처리, KPI, 요구사항 테이블이 탑재된 PRD 완성 (`02_prd_spec.md`).
  5. `ux-architect`가 3안(안정 탭바 안 / 뉴스 카드 중심 안 / AI 대화 챗 패널 안)의 정교한 ASCII 와이어프레임 설계 완성 (`03_ux_wireframes.md`).
  6. `product-reviewer`가 삼각 교차 검증 수행 후 `[PASS]` 판정.
  7. 최종 안전 파일명으로 `outputs/`에 마크다운 기획 서류 3종 완공 배포.

### 2. 에러 복구 흐름 (Error Recovery - File Sanitization)
- **입력**: "이름이 `개선안; rm -rf *`인 1-pager 저장해줘."
- **진행**:
  1. 기획 단계 진행 후 배포 시점에 파일 저장 루틴 실행.
  2. `pitl-orchestrator`가 파일명에서 쉘 메타문자 `;`, `*` 및 공백을 정밀 필터링하여 파일명을 `1pager_개선안-rm-rf`로 안전하게 변환.
  3. 덮어쓰기 여부를 확인 후 충돌이 없으면 `outputs/`에 안전하게 디스크 기록 완료.
