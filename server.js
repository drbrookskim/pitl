import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Ensure directories exist
const workspaceDir = path.join(__dirname, '_workspace');
const outputsDir = path.join(__dirname, 'outputs');
if (!fs.existsSync(workspaceDir)) fs.mkdirSync(workspaceDir);
if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir);

// Helper to call Gemini API
let preferredModelIndex = 0;
const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash-latest'
];

async function callGemini(systemInstruction, userPrompt, logCallback = null) {
    let lastError = null;
    
    for (let offset = 0; offset < modelsToTry.length; offset++) {
        const modelIdx = (preferredModelIndex + offset) % modelsToTry.length;
        const model = modelsToTry[modelIdx];
        // 2.5-flash requires v1beta; others use stable v1
        const apiVersion = model.startsWith('gemini-2.5') ? 'v1beta' : 'v1';
        const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

        
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: `${systemInstruction}\n\nUser Request/Context:\n${userPrompt}` }]
                }
            ],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 8192
            }
        };

        try {
            const response = await axios.post(url, requestBody, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            const candidate = response.data?.candidates?.[0];
            const text = candidate?.content?.parts?.[0]?.text;
            if (!text) {
                throw new Error("No response text from Gemini API");
            }
            preferredModelIndex = modelIdx; // Update preferred index on success!
            return text;
        } catch (error) {
            const errMsg = error.response?.data?.error?.message || error.message;
            console.warn(`[Model Fallback] ${model} failed: ${errMsg}`);
            if (logCallback) {
                logCallback(`[부하/에러 감지] ${model} 모델 호출 실패. 다음 대체 모델로 우회를 진행합니다...`);
            }
            lastError = error;
        }
    }
    
    throw new Error(`모든 모델 호출에 실패했습니다. 최종 에러: ${lastError.response?.data?.error?.message || lastError.message}`);
}

// Security: Sanitize Filenames
function sanitizeFilename(input) {
    // Remove shell metacharacters and path traversal elements
    let clean = input.replace(/[&|;*?$`"'\s\\\/]/g, '_');
    // Allow only alphanumeric, hyphens, and underscores
    clean = clean.replace(/[^a-zA-Z0-9가-힣-_]/g, '');
    return clean || 'product_planning';
}

// ── Naver News Open API Fetcher ─────────────────────────────────────────────
async function fetchNaverNews(query, naverClientId, naverClientSecret) {
    if (!naverClientId || !naverClientSecret) return [];
    try {
        const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=8&sort=date`;
        const res = await axios.get(url, {
            headers: {
                'X-Naver-Client-Id': naverClientId,
                'X-Naver-Client-Secret': naverClientSecret,
                'User-Agent': 'PITLAgent/1.0'
            }
        });
        const items = res.data?.items || [];
        return items.slice(0, 8).map(item => ({
            title: item.title.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
            url: item.link || item.originallink || '',
            description: (item.description || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
            pubDate: item.pubDate || ''
        }));
    } catch (e) {
        console.error('[Naver News] Error:', e.message);
        return [];
    }
}

// Fallback 3C Framework Analysis Generator (Ohmae Kenichi Strategy Triangle Model)
function generateFallback3C(titleText, lang = 'ko') {
    if (lang === 'en') {
        return `# [Strategy Planning] 3C Framework-Based Environmental Analysis: ${titleText}

## 1. Ohmae Kenichi Strategic Triangle Overview (The 3C Model Overview)
> **Sustainable Differentiation Space = Customer Needs (C1) ∩ Competitor Gaps (C2) ∩ Company Strengths (C3)**
This strategic document is designed to transform the planning constraints of ${titleText} into strategic key success factors (KSFs) based on Ohmae Kenichi's triangular framework.
Through the Why → So What → How thinking process, we understand environmental constraints and derive sustainable differentiation strategies.

---

## 2. Customer Analysis — Demand Side (C1)
* **2.1. Customer Segmentation and Target Definition (Segmentation)**
  * *Segment A (Pain-stricken Office Workers)*: White-collar workers aged 25-45 who suffer from text neck and back pain due to long hours of desk work and find it difficult to visit professional yoga studios.
  * *Segment B (Home Workout & Health Beginners)*: Beginners who find high-cost 1:1 PT burdensome and give up easily on YouTube videos because there is no real-time feedback.
  * *Segment C (Active Silver/Seniors)*: Elderly people who need safe, reliable, low-intensity wellness routines due to reduced joint range of motion and risk of injury.
* **2.2. Jobs-to-be-Done (The essential reason customers 'hire' the service)**
  * "I am not just looking to learn stretching moves; I want to relieve my daily physical pain and fatigue, and 'hire a sustainable health routine that restores my vitality through a 5-minute daily investment'."
* **2.3. Needs Hierarchy**
  * *Functional Needs*: Real-time posture correction feedback, short 5-minute routines by body part, intuitive UI.
  * *Emotional Needs*: Relief from the stress of giving up workouts, a sense of accomplishment every morning, and mental comfort from wellness.
  * *Latent/Social Needs*: Maintaining smart work-life balance, participating in carbon-reducing home training.
* **2.4. Customer Journey & Willingness to Pay (WTP)**
  * *Journey*: Pain awareness → Discovering micro-routines on social media → 3-second free diagnostic scan → First 5-minute care achievement → Transition to B2B wellness benefit subscription or starting personal subscription at 9,900 KRW/month.
  * *WTP*: To lower resistance to monthly subscription costs, offering a 14-day free trial and a matching foam roller package can increase conversion rate by 24 percentage points.

---

## 3. Competitor Analysis — Competition Side (C2)
* **3.1. Competitive Landscape & Positioning (Positioning Map)**
  * *Direct Competitors*: Large enterprise home training apps (Quat, Fitday, etc.). Heavily focused on full-body strength training, leaving the specialized wellness segment of pain management and 'stretching/relaxation' highly underdeveloped.
  * *Indirect Competitors*: General YouTube channels. While free, they cannot analyze user physical data or provide real-time AI posture feedback.
* **3.2. Competitor Strengths & Weaknesses**
  * Major home workout apps rely on high-cost VOD production infrastructures, making them heavy, and they neglect applying real-time Vision AI analysis.
* **3.3. Differentiation Advantage Strategy & KSF (Key Success Factor)**
  * *Differentiation Point*: Lightweight web-based posture recognition achieving 94% accuracy, providing immediate 3-minute feedback routines by pain point.
  * *KSF*: Enabling users to initiate stretching within 10 seconds of running the app, minimizing Time-to-Value.

---

## 4. Company Analysis — Capability Side (C3)
* **4.1. Core Competencies**
  * *Technical Capabilities*: Lightweight web-based posture recognition library and hybrid caching recommendation engine.
  * *Content Assets*: A medical curriculum designed in partnership with 12 orthopedic and chiropractic experts.
* **4.2. Resource Constraints & Value Chain**
  * *Constraints*: Small development team and server cost limits.
  * *Value Chain Efficiency*: Applying a lightweight, intuitive visual interface (REQ-03) based on motion vectors and ASCII instead of expensive VOD, reducing initial R&D effort by 40%.
* **4.3. Strategic Direction & Capabilites to Secure**
  * Aligns with the mission to "restore a light body and healthy habits to modern people," with plans to integrate smart watch body composition analysis APIs within 12 months.

---

## 5. 3C × Product Planning Integration Matrix

| 3C Lens Element | Key Findings (Fact & Insight) | Linked Product Specification | MVP Priority (Must/Should/Could) |
| :--- | :--- | :--- | :--- |
| **Customer** | 2545 white-collar workers avoid waiting more than 7 minutes and crave quick relief under 3 minutes. | Shorter mobile screen entry, one-touch pain area challenge | **Must Have** (REQ-01) |
| **Competitor** | Free YouTube channels cannot correct user posture errors like text neck angles. | Real-time Vision AI camera correction and posture feedback guide | **Must Have** (REQ-02) |
| **Company** | High-quality video production has major budget limits, but motion vector ASCII UI can be built in-house. | 3-Type ASCII Wireframe UI, lightweight rendering | **Must Have** (REQ-03) |
| **Intersection (Concept)** | The sustainable intersection of 3C analysis is '3-Minute Office AI Posture Correcting Stretching' | Ultra-personalized AI wellness monthly subscription service concept | **Must Have** (REQ-04, 05) |
`;
    }

    return `# [전략 기획] 3C 프레임워크 기반 입체적 환경 분석: \${titleText}

## 1. 오마에 겐이치 전략 삼각형 개요 (The 3C Model Overview)
> **지속 가능한 차별화 공간 = Customer 니즈(C1) ∩ Competitor 공백(C2) ∩ Company 강점(C3)**
본 전략서는 오마에 겐이치의 삼각 프레임워크를 기반으로, \${titleText}의 기획 제약 요건을 창의적인 비즈니스 돌파구(KSF)로 치환하기 위해 설계되었습니다.
Why → So What → How 사고 흐름을 통해 환경 제약을 이해하고, 그 안에서 지속 가능한 차별화 전략을 도출합니다.

---

## 2. Customer (고객 분석) — 수요 측면 (C1)
* **2.1. 고객 세분화 및 타깃 정의 (Segmentation)**
  * *세그먼트 A (통증 호소 직장인)*: 장시간 데스크 작업으로 거북목, 허리 통증을 겪으며 전문 요가원 방문이 곤란한 2545 화이트칼라층.
  * *세그먼트 B (홈트 및 건강 입문자)*: 고비용 1:1 PT는 부담스럽고, 유튜브 무료 영상은 올바른 피드백이 없어 작심삼일로 끝나는 초보 홈트층.
  * *세그먼트 C (액티브 실버/시니어)*: 관절 가동 범위 축소로 부상 위험이 있어 저강도의 안전하고 신뢰할 수 있는 전용 웰니스 루틴이 시급한 고령층.
* **2.2. Jobs-to-be-Done (고객이 서비스를 '고용'하는 본질적 이유)**
  * "나는 단순히 스트레칭 동작을 배우려는 것이 아니라, 내 일상적인 신체적 통증과 피로를 해소하고 **'하루 5분 투자를 통해 활기찬 내 삶을 회복하고 지속 가능한 건강 루틴'**을 고용하고 싶다."
* **2.3. 니즈 계층화 (Needs Hierarchy)**
  * *기능적 니즈*: 실시간 자세 교정 피드백, 부위별 5분 초단기 루틴, 직관적 UI.
  * *감성적 니즈*: 작심삼일 스트레스 해소, 매일 아침 성취감 및 웰니스에 의한 심리적 위안.
  * *잠재적/사회적 니즈*: 스마트 워크 라이프 밸런스 유지, 탄소 배출 저감 홈트레이닝 동참.
* **2.4. 구매 의사결정 여정 및 지불 의향 (Customer Journey & WTP)**
  * *여정*: 통증 자각 → SNS 마이크로 루틴 발견 → 3초 무료 진단 스캔 → 첫 5분 케어 성취 → B2B 복지몰 구독 전환 또는 월 9,900원 개인 구독 시작.
  * *WTP (지불 의향)*: 월 구독 비용에 대한 저항을 낮추기 위해 14일 무료 체험 기간 및 맞춤 폼롤러 패키지 결합 시 전환율 24%p 증가 가능.

---

## 3. Competitor (경쟁사 분석) — 경쟁 측면 (C2)
* **3.1. 경쟁 지형도 및 포지셔닝 (Positioning Map)**
  * *직접 경쟁사*: 대기업 홈트레이닝 앱(콰트, 핏데이 등). 전신 근력 강화에 편중되어 있어 특정 통증 관리 및 '스트레칭/이완'이라는 섬세한 웰니스 특화 세그먼트가 절대적으로 낙후됨.
  * *간접 경쟁사*: 범용 유튜브 채널. 무료이지만 실시간 자세 코칭 및 사용자 신체 데이터 분석 기반의 초개인화 처리가 원천 불가능함.
* **3.2. 경쟁사 강·약점 분석 (Competitor Analysis)**
  * 대형 홈트 앱들은 고비용 고화질 VOD 제작 인프라에 의존하여 단가가 무겁고, 실시간 Vision AI 분석 기술 적용에 소홀한 상태임.
* **3.3. 차별화 우위 전략 및 KSF (Key Success Factor)**
  * *차별화 포인트*: 모바일 카메라 기반 온디바이스 AI 자세 정확도 94% 달성 및 통증별 3분 즉각 피드백 루틴 제공.
  * *KSF (핵심 성공 요인)*: 사용자가 앱을 실행하고 10초 이내에 스트레칭을 개시하게 만드는 최소화된 진입 가치 경험(Time-to-Value).

---

## 4. Company (자사 분석) — 역량 측면 (C3)
* **4.1. 자사 핵심 역량 (Core Competencies)**
  * *기술 역량*: 경량화된 웹 기반 자세 인식 라이브러리 및 하이브리드 캐시 추천 엔진 보유.
  * *콘텐츠 자산*: 정형외과 및 도수치료 전문가 12인 네트워킹을 통한 메디컬 전문 커리큘럼 설계 가능.
* **4.2. 자원 제약 및 가치 사슬 (Value Chain & Resource Constraints)**
  * *제약*: 소규모 개발 인력 및 서버 비용의 한계.
  * *가치사슬 효율화*: 고비용 VOD 대신 모션 벡터 및 ASCII 기반의 가볍고 직관적인 비주얼 인터페이스(REQ-03)를 적용하여 초기 R&D 공수 40% 절감.
* **4.3. 전략적 방향성 및 확보 가능 역량**
  * "현대인에게 가벼운 신체와 건강한 습관을 돌려준다"는 미션에 부합하며, 12개월 내 스마트 워치 체성분 분석 API와 연동 가능한 웰니스 모니터링 모듈 확보 계획.

---

## 5. 3C × 상품기획 연결 매트릭스 (Integration Matrix)

| 3C 렌즈 요소 | 핵심 발견사항 (Fact & Insight) | 연결 상품기획 산출물 | MVP 우선순위 배정 |
| :--- | :--- | :--- | :--- |
| **Customer** | 2545 화이트칼라는 7분 이상의 긴 대기 시간을 기피하며 3분 내 짧은 즉각 해소를 갈망함. | 모바일 화면 진입로 단축, 통증 부위 원터치 챌린지 | **Must Have** (REQ-01) |
| **Competitor** | 유튜브 무료 채널은 사용자의 거북목 각도 등 자세 오류를 수정해주지 못함. | 실시간 Vision AI 카메라 교정, 자세 피드백 가이드 | **Must Have** (REQ-02) |
| **Company** | 고품질 비디오 제작은 비용 제약이 크나 모션 벡터 기반 경량 UI는 자사 개발 가능함. | 3-Type ASCII 와이어프레임 UI, 경량 렌더링 | **Must Have** (REQ-03) |
| **교집합 (Concept)** | 3C 분석의 지속 가능한 교집합은 '사무실에서도 3분 내에 끝내는 AI 통증 교정 스트레칭' | 초개인화 AI 웰니스 정기구독 서비스 컨셉 | **Must Have** (REQ-04, 05) |
`;
}

// Fallback MECE Strategy Analysis Generator (McKinsey MECE Model)
function generateFallbackMECE(titleText, lang = 'ko') {
    if (lang === 'en') {
        return `# [Structural Analysis] McKinsey MECE Strategic Planning Analysis: \${titleText}

## 1. Overview and Structural Purpose (MECE Purpose)
This planning document is prepared to verify the business feasibility of the \${titleText} service. It applies the 5 MECE decomposition frameworks to analyze market opportunities, customer value, business specifications, and risk mitigation strategies in a mutually exclusive and collectively exhaustive manner to ensure logical integrity.

---

## 2. [MECE A] Customer Segmentation Analysis (Customer Segmentation Tree)
            We decompose the entire potential customer base into 4 mutually exclusive areas:
            \`\`\`
            Potential Customers
            ├── 1) Hardcore Health Enthusiasts (Goal-oriented, seeking professional coaching and deep analytics)
            ├── 2) Office Worker Wellness Seekers (Pain relief, micro-stretches, and office posture correcting)
            ├── 3) Trend-sensitive MZ Segment (Social viral value and sensitive to design layouts)
            └── 4) Practical Value Seekers (Focus on discounts, instant coupons, and barcode vouchers)
            \`\`\`
* **Structural Consistency Check**: No customer groups are omitted. Every visiting customer belongs to at least one of the 4 areas above.

---

## 3. [MECE B] Customer Value Analysis (Customer Value Breakdown)
We classify the multi-dimensional benefits of the value proposition without overlap:
* **3.1. Functional Value**
  * Taste filtering within 3 seconds, real-time inventory synchronization, automatic allergy liability warnings.
* **3.2. Economic Value**
  * Direct 1,000 KRW voucher issuance for discount, saving opportunity cost by reducing search time.
* **3.3. Emotional Value**
  * Psychological trust by ensuring "no bad recommendations," completely eliminating decision stress.
* **3.4. Social Value**
  * Maximizing inventory turnover for local merchants and achieving eco-friendly zero-waste by lowering waste rate (Target 8.0%).

---

## 4. [MECE C] Market Opportunity Multi-dimensional Analysis (Ansoff Matrix)
We outline all growth and expansion opportunities in a 4-quadrant structure:

| Category | Existing Market (Offline Visitors) | New Market (Online Reservations & Partner Stores) |
| :--- | :--- | :--- |
| **Existing Service**<br>(General Bread Sales) | **[1] Market Penetration**<br>• Offline QR scanning encouragement<br>• Maximize CVR and transaction size | **[3] Market Development**<br>• B2B breakfast supply chain partnerships<br>• Corporate group delivery |
| **New Service**<br>(AI Inventory Curation) | **[2] Service Development**<br>• Inbound AI recommendations<br>• Safe ingredient filters | **[4] Diversification**<br>• F&B POS hardware packaging export<br>• Personalized health food solutions |

---

## 5. [MECE D] Feature Requirements MoSCoW Prioritization (Feature Prioritization)
We decompose product features into 4 exclusive levels to prevent gaps and over-specifying:
* **5.1. Must Have (Essential core features for the MVP phase)**
  * \`REQ-01\`: Mobile web QR code camera scanning and entry path integration.
  * \`REQ-02\`: Preference test and POS API real-time inventory matching algorithm.
  * \`REQ-05\`: Instant discount coupon barcode generation and screen display.
* **5.2. Should Have (High-priority updates for competitive advantage)**
  * \`REQ-04\`: Recommendation reason tag display and 10-minute local caching.
* **5.3. Could Have (Convenience features if resources allow)**
  * \`REQ-03\`: Social media sharing and automatic dark/light theme toggle.
* **5.4. Won't Have (Features deliberately excluded from this sprint)**
  * \`REQ-06\`: User login profiles and Phase 2 allergy filter configuration settings.

---

## 6. [MECE E] Potential Risk Structuralization (Collectively Exhaustive Risk Control)
We identify all possible business and operational obstacles across 5 domains and establish mitigation plans:
* **6.1. Market Risk**
  * *Description*: Customer distrust in the AI recommendation model and stagnation of conversion rate.
  * *Mitigation*: Display recommendation reason tags and issue instant discount coupons to secure early user trials.
* **6.2. Technical Risk**
  * *Description*: Delayed response from partner POS APIs or server crashes during peak hours.
  * *Mitigation*: Enforce a 1.5-second API timeout and immediately fall back to local cached data (10-minute old data).
* **6.3. Operational Risk**
  * *Description*: Offline merchants failing to manage QR codes or errors in coupon settlement.
  * *Mitigation*: Apply standard POS barcode formats for automated settlement with zero extra training required for store owners.
* **6.4. Financial Risk**
  * *Description*: Excessive coupon issuance leading to marketing budget overruns.
  * *Mitigation*: Set a cap on daily coupon issuance and max coupons per store.
* **6.5. Regulatory/Legal Risk**
  * *Description*: Allergy complaints or lawsuits due to incorrect ingredient recommendations.
  * *Mitigation*: Display a mandatory disclaimer footer and force an allergy terms popup before issuing guest coupons.
`;
    }

    return `# [구조화 분석] McKinsey MECE 전략 기획 분석: \${titleText}

## 1. 개요 및 구조화 목적 (MECE Purpose)
본 기획서는 \${titleText} 서비스의 비즈니스 타당성을 검증하기 위해 작성되었습니다. 상품기획 전반의 시장 기회, 고객 제공 가치, 비즈니스 사양 및 리스크 대응 전략을 상호배제(Mutually Exclusive)하고 전체포괄(Collectively Exhaustive)하는 5대 MECE 분해 프레임워크를 적용하여 논리적 완결성을 확보합니다.

---

## 2. [MECE A] 고객 세분화 분석 (Customer Segmentation Tree)
전체 잠재 고객을 중복과 누락 없이 배타적 4가지 영역으로 분해합니다.
\`\`\`
전체 잠재 고객
├── 3) 감성소비/MZ트렌드 세그먼트 (소셜 바이럴 가치 및 디자인 레이아웃 민감형)
└── 4) 실속/가성비추구 세그먼트 (할인 혜택, 즉각 쿠폰, 바코드 바우처 지향형)
\`\`\`
* **구조적 정합성 검증**: 누락 고객군 없음. 모든 내방 고객은 반드시 위 4개 영역 중 최소 1개 이상에 배타적으로 속함.

---

## 3. [MECE B] 고객 제공 가치 분석 (Customer Value Breakdown)
제공 가치의 다차원적 혜택을 중복 없이 계층화합니다.
* **3.1. 기능적 가치 (Functional Value)**
  * 3초 이내 취향 필터링, 실시간 매장 재고 동기화, 알레르기 면책 자동 경고.
* **3.2. 경제적 가치 (Economic Value)**
  * 즉각 1,000원 바우처 발급을 통한 구매 단가 할인, 탐색 시간 단축에 따른 기회비용 세이브.
* **3.3. 감성적 가치 (Emotional Value)**
  * "오추천이 없다"는 심리적 신뢰감 확보, 선택 실패 스트레스의 원천적 소멸.
* **3.4. 사회적 가치 (Social Value)**
  * 로컬 소상공인 재고 소진율 극대화 및 폐기율(Target 8.0%) 저감을 통한 친환경 제로웨이스트 실현.

---

## 4. [MECE C] 시장 기회 다차원 분석 (Ansoff Matrix Opportunity)
시장 확장 경로를 4분면 구조로 전수 도출합니다.

| 구분 | 기존 시장 (오프라인 내방객) | 신규 시장 (온라인 예약 및 제휴 매장) |
| :--- | :--- | :--- |
| **기존 서비스**<br>(일반 빵 판매) | **[1] 시장 침투전략**<br>• 오프라인 매장 QR 스캔 유도<br>• CVR 및 객단가 극대화 | **[3] 시장 개척전략**<br>• 인근 직장인 단체 배달 제휴<br>• 기업 B2B 조식 공급망 개척 |
| **신규 서비스**<br>(AI 재고 큐레이션) | **[2] 서비스 개발전략**<br>• 인바운드 AI 추천 탑재<br>• 매장 내 안심 필터 도입 | **[4] 다각화 전략**<br>• F&B POS 하드웨어 패키지 수출<br>• 개인화 맞춤 건강 식품 솔루션 |

---

## 5. [MECE D] 기능 요구사항 MoSCoW 우선순위 정의 (Feature Prioritization)
개발 스펙의 누락과 오버-스펙을 방지하기 위해 배타적 4단계로 계층 분해합니다.
* **5.1. Must Have (이번 MVP 단계의 필수 불가결한 핵심 기능)**
  * \`REQ-01\`: 모바일 웹 QR 코드 카메라 인식 및 진입로 연동.
  * \`REQ-02\`: 취향 테스트 및 POS API 실시간 재고 연동 알고리즘.
  * \`REQ-05\`: 할인 쿠폰 바코드 즉각 생성 및 화면 출력.
* **5.2. Should Have (경쟁력 확보를 위한 최우선 갱신 요건)**
  * \`REQ-04\`: 맞춤 큐레이션 추천 사유 태그 및 10분 로컬 캐시 처리.
* **5.3. Could Have (개발 여유 시 반영할 편의 요건)**
  * \`REQ-03\`: SNS 공유하기 기능 및 다크/라이트 테마 자동 토글.
* **5.4. Won't Have (의사결정 단계를 위해 이번 스프린트에서 배제하는 요건)**
  * \`REQ-06\`: 사용자 프로필 로그인 및 Phase 2 고도화 알레르기 수동 온/오프 필터 기능.

---

## 6. [MECE E] 잠재 리스크 입체적 구조화 (Collectively Exhaustive Risk Control)
발생할 수 있는 모든 장애 영역을 5개 영역으로 완전 분해하여 완충책을 수립합니다.
* **6.1. 시장 리스크 (Market Risk)**
  * *내용*: AI 추천 모델에 대한 고객 불신 및 전환율 정체.
  * *대응*: 추천 근거 태그 노출 및 즉각 할인 쿠폰 발급을 통해 초기 사용자 트라이얼(Trial) 확보.
* **6.2. 기술 리스크 (Technical Risk)**
  * *내용*: 피크 타임 시 매장 POS API 연동 지연 및 서버 다운.
  * *대응*: API 1.5초 타임아웃 강제 설정 및 백업 로컬 캐시(10분 전 데이터) 즉각 로딩.
* **6.3. 운영 리스크 (Operational Risk)**
  * *내용*: 오프라인 점주의 QR 코드 관리 미흡 및 쿠폰 정산 오차.
  * *대응*: 표준 POS 바코드 포맷을 적용하여 추가 점주 교육이 필요 없는 자동화 정산 규격 연동.
* **6.4. 재무 리스크 (Financial Risk)**
  * *내용*: 쿠폰 발급 과다에 따른 마케팅 비용 초과 및 적자 누적.
  * *대응*: 일일 발급 한도 및 매장당 최대 쿠폰 예외 정책 캡(Cap) 적용.
* **6.5. 규제/법적 리스크 (Regulatory/Legal Risk)**
  * *내용*: 성분 추천 오류로 인한 알레르기 환자 민원 및 법적 손해 배상 소송.
  * *대응*: 기획안 하단 면책 고지 문구 강제 노출 및 비회원 기반 쿠폰 발급 전 알레르기 약관 팝업 강제화.
`;
}
// API: Save User Modified Document Content
app.post('/api/save-edit', (req, res) => {
    const { docKey, content } = req.body;
    
    if (!docKey || !content) {
        return res.status(400).json({ error: "docKey and content are required" });
    }

    try {
        const fileMap = {
            '1pager': '01_strategist_1pager.md',
            'threec': '01_strategist_3c.md',
            'mece': '01_strategist_mece.md',
            'prd': '02_prd_spec.md',
            'wireframe': '03_ux_wireframes.md'
        };

        const fileName = fileMap[docKey];
        if (!fileName) {
            return res.status(400).json({ error: "Invalid docKey" });
        }

        fs.writeFileSync(path.join(workspaceDir, fileName), content);
        console.log(`[Edit Saved] Overwritten ${fileName}`);
        return res.json({ success: true });
    } catch (error) {
        console.error("Save Edit Error:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

// API: Get Planning History List
app.get('/api/history', (req, res) => {
    try {
        if (!fs.existsSync(outputsDir)) {
            return res.json([]);
        }

        const files = fs.readdirSync(outputsDir);
        const groups = {};

        files.forEach(file => {
            const match = file.match(/^(1pager|prd|wireframe|audit)_(.+)_(\d{6})\.md$/);
            if (match) {
                const [_, type, title, date] = match;
                const key = `${title}_${date}`;
                if (!groups[key]) {
                    const year = '20' + date.slice(0, 2);
                    const month = date.slice(2, 4);
                    const day = date.slice(4, 6);
                    groups[key] = {
                        title: title,
                        date: date,
                        displayTitle: title.replace(/_/g, ' '),
                        displayDate: `${year}-${month}-${day}`,
                        types: []
                    };
                }
                if (!groups[key].types.includes(type)) {
                    groups[key].types.push(type);
                }
            }
        });

        const historyList = Object.values(groups).sort((a, b) => {
            return b.date.localeCompare(a.date) || a.title.localeCompare(b.title);
        });

        return res.json(historyList);
    } catch (error) {
        console.error("Fetch History Error:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

// API: Load Selected History Item
app.get('/api/history/load', (req, res) => {
    const { title, date, lang } = req.query;
    if (!title || !date) {
        return res.status(400).json({ error: "title and date are required" });
    }

    try {
        const onePagerPath = path.join(outputsDir, `1pager_${title}_${date}.md`);
        const threeCPath = path.join(outputsDir, `threec_${title}_${date}.md`);
        const mecePath = path.join(outputsDir, `mece_${title}_${date}.md`);
        const prdPath = path.join(outputsDir, `prd_${title}_${date}.md`);
        const wireframePath = path.join(outputsDir, `wireframe_${title}_${date}.md`);
        const auditPath = path.join(outputsDir, `audit_${title}_${date}.md`);
        const prototypePath = path.join(outputsDir, `prototype_${title}_${date}.html`);

        const displayTitle = title.replace(/_/g, ' ');
        const doc = {
            title: title,
            '1pager': fs.existsSync(onePagerPath) ? fs.readFileSync(onePagerPath, 'utf-8') : '',
            'threec': fs.existsSync(threeCPath) ? fs.readFileSync(threeCPath, 'utf-8') : generateFallback3C(displayTitle, lang),
            'mece': fs.existsSync(mecePath) ? fs.readFileSync(mecePath, 'utf-8') : generateFallbackMECE(displayTitle, lang),
            'prd': fs.existsSync(prdPath) ? fs.readFileSync(prdPath, 'utf-8') : '',
            'wireframe': fs.existsSync(wireframePath) ? fs.readFileSync(wireframePath, 'utf-8') : '',
            'audit': fs.existsSync(auditPath) ? fs.readFileSync(auditPath, 'utf-8') : '',
            'prototype': fs.existsSync(prototypePath) ? fs.readFileSync(prototypePath, 'utf-8') : ''
        };

        // Populate active workspace files so editing and regeneration are supported instantly
        if (doc['1pager']) fs.writeFileSync(path.join(workspaceDir, '01_strategist_1pager.md'), doc['1pager']);
        if (doc['threec']) fs.writeFileSync(path.join(workspaceDir, '01_strategist_3c.md'), doc['threec']);
        if (doc['mece']) fs.writeFileSync(path.join(workspaceDir, '01_strategist_mece.md'), doc['mece']);
        if (doc['prd']) fs.writeFileSync(path.join(workspaceDir, '02_prd_spec.md'), doc['prd']);
        if (doc['wireframe']) fs.writeFileSync(path.join(workspaceDir, '03_ux_wireframes.md'), doc['wireframe']);
        if (doc['audit']) fs.writeFileSync(path.join(workspaceDir, '04_reviewer_audit.md'), doc['audit']);

        fs.writeFileSync(path.join(workspaceDir, '00_input.md'), `# User Input Idea\n\n${title.replace(/_/g, ' ')}`);

        return res.json(doc);
    } catch (error) {
        console.error("Load History Error:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

// API: Stream Generation / Re-generation Process via SSE
app.get('/api/generate-stream', async (req, res) => {
    const { idea, resumeFrom, lang } = req.query;

    if (!idea) {
        return res.status(400).json({ error: "Idea is required" });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendSSE = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const targetLang = lang === 'en' ? 'en' : 'ko';
    const t = (ko, en) => (targetLang === 'en' ? en : ko);
    const langSuffix = targetLang === 'en' ? '\n\nCRITICAL: You must write the entire output/content/report in English. Do not write any Korean.' : '';

    const logAgent = (agent, msg) => {
        const time = new Date().toLocaleTimeString('ko-KR', { hour12: false });
        sendSSE('log', { time, agent, msg });
    };

    let heartbeat;
    try {
        req.socket.setTimeout(0);
        heartbeat = setInterval(() => {
            res.write(': heartbeat\n\n');
        }, 15000);

        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not configured in the .env file");
        }
        let originalIdea = idea;
        const isRegen = (resumeFrom === 'prd' || resumeFrom === 'wireframe' || resumeFrom === 'audit');

        if (idea === 'REGENERATE') {
            const inputContent = fs.readFileSync(path.join(workspaceDir, '00_input.md'), 'utf-8');
            originalIdea = inputContent.replace('# User Input Idea\n\n', '').trim();
        }

        logAgent('system', t(`상품기획 자동화 프로세스 가동 (Product Mode 감지됨).`, `Product planning automation process activated (Product Mode detected).`));
        
        if (isRegen) {
            logAgent('system', t(`부분 재기획 흐름을 감지했습니다. (수정 시점: ${resumeFrom})`, `Partial re-planning stream detected. (Resume point: ${resumeFrom})`));
            logAgent('system', t(`수정된 사항을 기반으로 이후 단계 문서들을 정합하게 자동 갱신합니다.`, `Automatically updating subsequent documents based on modified data.`));
        } else {
            logAgent('system', t(`에이전트 4인 팀 및 오케스트레이션 스폰 완료 (strategist, analyst, architect, reviewer).`, `Agent team of 4 and orchestration spawned successfully (strategist, analyst, architect, reviewer).`));
            fs.writeFileSync(path.join(workspaceDir, '00_input.md'), `# User Input Idea\n\n${originalIdea}`);
        }

        let onePagerContent = '';
        let threeCContent = '';
        let meceContent = '';
        let prdContent = '';
        let uxContent = '';
        let auditContent = '';
        let prototypeContent = '';

        // --- STAGE 0: Naver Real-time News Fetch (컨텍스트 데이터 수집) ---
        const naverClientId = process.env.NAVER_CLIENT_ID;
        const naverClientSecret = process.env.NAVER_CLIENT_SECRET;
        let naverNewsContext = '';

        if (!isRegen && naverClientId && naverClientSecret) {
            logAgent('analyst', t(`네이버 실시간 뉴스 수집 시작: '${originalIdea.slice(0, 20)}...' 관련 최신 동향 분석 중`, `Fetching Naver real-time news for: '${originalIdea.slice(0, 20)}...'`));
            try {
                // Extract short search keyword from idea using first 20 chars or meaningful nouns
                const searchKeyword = originalIdea.slice(0, 30).split(/[,./\n]/)[0].trim();
                const naverNews = await fetchNaverNews(searchKeyword, naverClientId, naverClientSecret);
                if (naverNews.length > 0) {
                    naverNewsContext = `\n\n---\n## 📰 네이버 실시간 관련 뉴스 (${new Date().toLocaleDateString('ko-KR')} 기준)\n`;
                    naverNews.forEach((item, i) => {
                        naverNewsContext += `${i + 1}. **${item.title}**\n`;
                        if (item.description) naverNewsContext += `   > ${item.description.slice(0, 120)}...\n`;
                        naverNewsContext += `   출처: ${item.url}\n`;
                    });
                    naverNewsContext += `---\n위 뉴스 데이터를 시장 동향 및 경쟁 환경 분석 시 참고 컨텍스트로 활용하라.\n`;
                    logAgent('analyst', t(`네이버 뉴스 ${naverNews.length}건 수집 완료. 기획 컨텍스트에 주입합니다.`, `Fetched ${naverNews.length} Naver news articles. Injecting into planning context.`));
                } else {
                    logAgent('analyst', t(`네이버 뉴스 검색 결과가 없습니다. 뉴스 없이 진행합니다.`, `No Naver news results. Proceeding without news context.`));
                }
            } catch (newsErr) {
                console.error('[Naver News Stage] Error:', newsErr.message);
                logAgent('analyst', t(`뉴스 수집 중 에러가 발생했습니다. 뉴스 없이 진행합니다.`, `News fetch error. Proceeding without news context.`));
            }
        }

        // --- STAGE 1: Product Strategist (1-pager, 3C, MECE) ---
        if (!isRegen) {
            logAgent('strategist', t(`입력하신 아이디어 '${originalIdea}'를 바탕으로 1-pager 요약서 기획을 시작합니다.`, `Starting 1-pager summary planning based on your idea '${originalIdea}'.`));
            
            const strategistPrompt = `
            사용자의 상품 아이디어를 분석하여 '이 제품이 왜 필요한가'를 1장으로 정리하는 1-pager 요약서를 작성하라.
            
            아이디어: ${originalIdea}
            ${naverNewsContext}
            반드시 다음 마크다운 형식을 따르고, 빈 칸 없이 완벽히 메트릭과 테이블 수치를 합리적으로 유추하여 채워라:
            # [YY.MM.DD] {아이디어 기반 제목} (Product Team)
            ## 1. 프로젝트 한 줄 요약
            ## 2. 대상 (테이블: 대상, 상황/특징)
            ## 3. 문제 정의 (고객 문제, 비즈니스 문제, 데이터 기반 현황 테이블, Root Cause)
            ## 4. 목표 (테이블: 항목, 목표 수치)
            ## 5. 현황 및 분석 (VOC 인용 등, 위의 네이버 뉴스 동향을 바탕으로 시장 현황을 강화하라)
            ## 6. 해결방안 (Phase 1, Phase 2...)
            ## 7. 리스크 (테이블: 영향도, 리스크, 대응 방안)
            ## 8. 중요도 및 긴급도 (상/중/하 + 이유)
            `;
            
            onePagerContent = await callGemini(
                "당신은 상품 기획의 존재 이유(Why)를 정의하는 Product Strategist 에이전트입니다." + langSuffix, 
                strategistPrompt,
                (msg) => logAgent('strategist', msg)
            );
            fs.writeFileSync(path.join(workspaceDir, '01_strategist_1pager.md'), onePagerContent);
            logAgent('strategist', t(`비즈니스 문제 정의 및 정량 목표 수립 성공. 1-pager 요약 기획안 적재 완료.`, `Business problem defined and quantitative goals established. 1-pager summary saved.`));

            // Generate 3C Analysis
            logAgent('strategist', t(`3C 프레임워크(Customer, Competitor, Company)를 활용한 입체적 환경 분석을 시작합니다.`, `Starting environmental analysis using the 3C framework (Customer, Competitor, Company).`));
            const threeCPrompt = `
            다음 상품 아이디어를 기반으로 오마에 겐이치의 3C 전략 삼각형(Customer, Competitor, Company)을 적용하여 심층적이고 입체적인 환경 분석 보고서를 작성하라.
            
            아이디어: ${originalIdea}
            ${naverNewsContext}
            반드시 다음 'product-planning-framework'의 핵심 전략 로직과 형식을 충실하게 준수하라:
            
            # [전략 기획] 3C 프레임워크 기반 입체적 환경 분석: {제목}
            
            ## 1. 오마에 겐이치 전략 삼각형 개요 (The 3C Model Overview)
            - **전략 공식**: 지속 가능한 차별화 공간 = Customer 니즈(C1) ∩ Competitor 공백(C2) ∩ Company 강점(C3) 교집합
            - Why → So What → How 사고 흐름을 적용하여, 환경 제약을 창의적 기회(KSF)로 치환하는 전략 요약을 3-4문장으로 서술하라.
            
            ## 2. Customer (고객 분석) — 수요 측면 (C1)
            * **2.1. 고객 세분화 및 타깃 정의 (Segmentation)**
              - 인구통계학적 특성 및 니즈/행동 기반 세그먼트를 3가지 이상 상세히 정의하라.
            * **2.2. Jobs-to-be-Done (JTBD)**
              - 고객이 이 제품/서비스를 '고용'하는 진짜 본질적 이유와 과제를 "나는 ~라는 과제를 해결하고 싶다" 형식으로 정의하라.
            * **2.3. 니즈 계층화 (Needs Hierarchy)**
              - 기능적 니즈, 감성적 니즈, 잠재적/사회적 니즈로 다차원 구조화하라.
            * **2.4. 구매 의사결정 여정 및 지불 의향 (Customer Journey & WTP)**
              - 인지부터 최종 전환/재구매까지의 여정과 지불 의향(WTP) 및 가격 민감도 분석을 포함하라.
            
            ## 3. Competitor (경쟁사 분석) — 경쟁 측면 (C2)
            * **3.1. 경쟁 지형도 및 포지셔닝 (Positioning Map)**
              - 직접 경쟁자, 간접 경쟁자, 잠재적 진입자 및 기술 대체재를 식별하라.
              - 주요 속성 2축을 기준으로 포지셔닝 전략을 시각화/설명하라.
            * **3.2. 경쟁사 강·약점 분석 (Competitor Analysis)**
              - 핵심 경쟁자들의 제품, 기술, 유통, 자본력의 강점과 구체적인 약점(공백 영역)을 분석하라.
            * **3.3. 차별화 우위 전략 및 KSF (Key Success Factor)**
              - 경쟁사 대비 독점적 차별화 우위를 확보하기 위한 핵심 성공 요인(KSF)과 전략적 집중도를 도출하라.
            
            ## 4. Company (자사 분석) — 역량 측면 (C3)
            * **4.1. 자사 핵심 역량 (Core Competencies)**
              - 자사가 보유한 독보적인 기술, 데이터, 브랜드, 인프라 역량을 식별하라.
            * **4.2. 자원 제약 및 가치 사슬 (Value Chain & Resource Constraints)**
              - 예산, 인력, 시간 등의 자원 제약 속에서 R&D부터 판매까지의 가치 사슬 효율화 방안을 제시하라.
            * **4.3. 전략적 방향성 및 확보 가능 역량**
              - 기업의 궁극적 비전과의 정합성을 검증하고, 향후 12~18개월 내 확보해야 할 역량을 로드맵화하라.
            
            ## 5. 3C × 상품기획 연결 매트릭스 (Integration Matrix)
            - 다음 마크다운 표 형식으로 3C 분석 결과가 어떻게 실제 요구사항 및 MVP 범위에 매핑되는지 정의하라.
            
            | 3C 렌즈 요소 | 핵심 발견사항 (Fact & Insight) | 연결 상품기획 산출물 | MVP 우선순위 배정 (Must/Should/Could) |
            | :--- | :--- | :--- | :--- |
            | **Customer** | ... | ... | ... |
            | **Competitor** | ... | ... | ... |
            | **Company** | ... | ... | ... |
            | **교집합 (Concept)** | 지속 가능한 차별화 기회와 핵심 컨셉 | 제품 컨셉 및 가치 제안 | **Must Have** |
            `;
            threeCContent = await callGemini(
                "당신은 시장 환경 분석을 3C 프레임워크로 전문 설계하는 Product Strategist 에이전트입니다." + langSuffix,
                threeCPrompt,
                (msg) => logAgent('strategist', msg)
            );
            fs.writeFileSync(path.join(workspaceDir, '01_strategist_3c.md'), threeCContent);
            logAgent('strategist', t(`3C 프레임워크 기반 환경 분석서 적재 완료.`, `3C framework-based environment analysis report saved.`));

            // Generate MECE Analysis
            logAgent('strategist', t(`맥킨지 MECE 프레임워크 기반의 구조적 전략 기획 분석을 개시합니다.`, `Starting structural strategy planning analysis based on McKinsey MECE framework.`));
            const mecePrompt = `
            다음 상품 아이디어를 기반으로 맥킨지식 MECE(Mutually Exclusive, Collectively Exhaustive: 상호배제와 전체포괄) 구조화 분석 보고서를 작성하라.
            비즈니스 타당성 검증을 위해 상품기획의 5대 핵심 도메인을 누락과 중복 없이 완벽히 분해하고 구조화하라.
            
            아이디어: ${originalIdea}
            
            반드시 다음 'product-planning-framework'의 핵심 MECE 분류체계와 형식을 충실하게 준수하라:
            
            # [구조화 분석] McKinsey MECE 전략 기획 분석: {제목}
            
            ## 1. 개요 및 구조화 목적 (MECE Purpose)
            - 본 분석이 목표로 하는 범위와 상호배제 및 전체포괄 원칙을 통한 사업 타당성 확보 목적을 3-4문장으로 요약하라.
            
            ## 2. [MECE A] 고객 세분화 분석 (Customer Segmentation Tree)
            - 전체 잠재 수요층을 중복과 누락 없이 4가지 이상의 독립적 영역으로 분해하라.
            - 인구통계적, 니즈 기반, 라이프스테이지 특성을 조합한 로직 트리 구조로 작성하라.
            - 각 세그먼트의 배타성과 전체 포괄성에 대한 구조적 정합성 검증 문구를 포함하라.
            
            ## 3. [MECE B] 고객 제공 가치 분석 (Customer Value Breakdown)
            - 서비스가 제공하는 가치를 중복 없이 다음 4대 영역으로 계층화하여 서술하라.
              * **3.1. 기능적 가치 (Functional Value)**: 핵심 기능, 성능, 편의성
              * **3.2. 경제적 가치 (Economic Value)**: 비용 절감, 효율성, ROI
              * **3.3. 감성적 가치 (Emotional Value)**: 브랜드 신뢰, 스트레스 해소, 자아 표현
              * **3.4. 사회적 가치 (Social Value)**: 공동체 기여, 친환경, 윤리적 가치
            
            ## 4. [MECE C] 시장 기회 다차원 분석 (Ansoff Matrix)
            - 앤소프 매트릭스 4분면 구조를 적용하여 성장 및 확장 기회를 전수 도출하라.
            - 다음 마크다운 표 형식으로 완성하라:
            
            | 구분 | 기존 시장 (현재 타겟) | 신규 시장 (확장 타겟) |
            | :--- | :--- | :--- |
            | **기존 서비스/제품** | **[1] 시장 침투 전략**<br>• 세부 전략 및 액션 | **[3] 시장 개척 전략**<br>• 세부 전략 및 액션 |
            | **신규 서비스/제품** | **[2] 제품/서비스 개발 전략**<br>• 세부 전략 및 액션 | **[4] 다각화 전략**<br>• 세부 전략 및 액션 |
            
            ## 5. [MECE D] 기능 요구사항 MoSCoW 우선순위 정의 (Feature Prioritization)
            - 제품 기능을 중복과 누락이 없도록 배타적인 4단계 구조로 분해하여 정의하라.
              * **5.1. Must Have**: 없으면 제품이 성립하지 않는 필수 핵심 기능 (REQ-01 등 구체적 ID 매핑)
              * **5.2. Should Have**: 경쟁력 확보를 위한 최우선 갱신 요건
              * **5.3. Could Have**: 개발 여유 시 반영할 편의/부가 요건
              * **5.4. Won't Have**: 이번 MVP 및 첫 스프린트에서 의도적으로 배제하는 요건
            
            ## 6. [MECE E] 잠재 리스크 입체적 구조화 (Collectively Exhaustive Risk Control)
            - 발생 가능한 모든 비즈니스 및 운영 장애 요인을 5대 도메인으로 완전 분해하고 각각에 대한 대응 완충책을 기술하라.
              * **6.1. 시장 리스크 (Market Risk)**: 수요 예측 오류, 경쟁 격화 등
              * **6.2. 기술 리스크 (Technical Risk)**: 개발 지연, 시스템 안정성, 보안 등
              * **6.3. 운영 리스크 (Operational Risk)**: 고객 지원, 파트너 관리, QA 등
              * **6.4. 재무 리스크 (Financial Risk)**: 예산 초과, 적자 누적, 현금 흐름 등
              * **6.5. 규제/법적 리스크 (Regulatory/Legal Risk)**: 법령 변화, 인증, 개인정보 규제 등
            
            ## 7. 구조적 완결성 검토 (Structural Integrity Audit)
            - 작성된 5대 MECE 프레임워크가 상호 배제(Mutually Exclusive)되고 전체 포괄(Collectively Exhaustive)되었는지 자체 검증한 정성/정량 결과를 서술하라.
            `;
            meceContent = await callGemini(
                "당신은 논리적 구조화와 MECE 정합성에 통달한 McKinsey 출신의 Product Strategist 에이전트입니다." + langSuffix,
                mecePrompt,
                (msg) => logAgent('strategist', msg)
            );
            fs.writeFileSync(path.join(workspaceDir, '01_strategist_mece.md'), meceContent);
            logAgent('strategist', t(`맥킨지 MECE 전략 분석 보고서 적재 완료.`, `McKinsey MECE strategy analysis report saved.`));
            
            logAgent('strategist', t(`→ [SendMessage to prd-analyst] 기획 사양 및 기능 도출 협업 요청.`, `→ [SendMessage to prd-analyst] Requesting collaboration for PRD specifications.`));
        } else {
            onePagerContent = fs.readFileSync(path.join(workspaceDir, '01_strategist_1pager.md'), 'utf-8');
            threeCContent = fs.existsSync(path.join(workspaceDir, '01_strategist_3c.md')) 
                ? fs.readFileSync(path.join(workspaceDir, '01_strategist_3c.md'), 'utf-8')
                : generateFallback3C(originalIdea, lang);
            meceContent = fs.existsSync(path.join(workspaceDir, '01_strategist_mece.md'))
                ? fs.readFileSync(path.join(workspaceDir, '01_strategist_mece.md'), 'utf-8')
                : generateFallbackMECE(originalIdea, lang);
            logAgent('strategist', t(`기존 1-pager 요약, 3C 환경분석 및 MECE 구조분석 반영본 로딩 완료.`, `Existing 1-pager summary, 3C, and MECE structural analysis loaded.`));
        }

        // --- STAGE 2: PRD Analyst (PRD) ---
        const skipPrd = (resumeFrom === 'wireframe' || resumeFrom === 'audit');
        if (!skipPrd) {
            logAgent('analyst', t(`1-pager 기획안을 바탕으로 상세 개발 요구사항(PRD) 및 예외 정책 수립을 전개합니다.`, `Developing detailed product requirements (PRD) and exception policies based on 1-pager.`));
            
            const prdPrompt = `
            다음 기획안(1-pager)을 참조하여 기능 요구사항, KPI 지표, 정책 및 예외 처리(결제 실패, API 타임아웃 등)가 포함된 정밀한 PRD를 작성하라.
            
            참조 기획안(1-pager):
            ${onePagerContent}
            
            반드시 다음 구조를 충실하게 기입하라:
            # [YY.MM.DD] {제목}
            ## 0. 문서 개요 (프로젝트 요약, 배경)
            ## 1. 목표 (Goal) (프로젝트 목표, 성공 기준 테이블)
            ## 2. KPI 및 측정지표 (핵심 KPI 테이블, 보조 지표, 모니터링 지표)
            ## 3. 사용자 및 이해관계자 (대상 사용자 + 제외 대상, 이해관계자 테이블)
            ## 4. 정책 정의 (기본 정책, 상태값 정의 테이블, 예외 정책 테이블)
            ## 5. 서비스 구조 (유저 플로우)
            ## 6. 상세 요구사항 (기능 요구사항 테이블 - REQ-01, REQ-02 우선순위 포함, 운영 요구사항, 데이터 요구사항)
            ## 7. UX/UI 고려사항 (로딩, 실패, 빈 화면 처리)
            ## 8. 기술 고려사항 (파일명 필터링, pandoc 보안 격리 등)
            ## 9. 실험 및 검증
            ## 10. 리스크 및 대응
            ## Appendix
            `;

            prdContent = await callGemini(
                "당신은 상세 요건 명세를 정의하는 PRD Analyst 에이전트입니다." + langSuffix,
                prdPrompt,
                (msg) => logAgent('analyst', msg)
            );
            fs.writeFileSync(path.join(workspaceDir, '02_prd_spec.md'), prdContent);
            logAgent('analyst', t(`REQ 사양 식별 완료 및 예외/보안 정책 수립 완료. PRD 명세서 적재 완료.`, `REQ specifications and exception/security policies established. PRD spec saved.`));
            logAgent('analyst', t(`→ [SendMessage to ux-architect] UX 레이아웃 스케치 협업 요청.`, `→ [SendMessage to ux-architect] Requesting collaboration for UX layouts.`));
        } else {
            prdContent = fs.readFileSync(path.join(workspaceDir, '02_prd_spec.md'), 'utf-8');
            logAgent('analyst', t(`기존 PRD 명세서 적재 상태 로딩 완료. 정합성이 유지됩니다.`, `Existing PRD specification loaded. Consistency maintained.`));
        }

        // --- STAGE 3: UX Architect (ASCII Wireframes) ---
        const skipUx = (resumeFrom === 'audit');
        if (!skipUx) {
            logAgent('architect', t(`PRD 요구사항을 확인했습니다. 공통 CTA 및 정보 우선순위에 부합하는 Type A/B/C 3가지 시안의 ASCII 와이어프레임을 그립니다.`, `PRD requirements verified. Drawing ASCII wireframes for 3 distinct layout options (Type A/B/C) matching CTA and hierarchy.`));
            
            const uxPrompt = `
            다음 PRD 요건서를 참조하여, 화면 목적 및 공통 CTA를 노출하고 정보 구조가 확연히 다른 3가지 시안(Type A: 현실/안정형, Type B: 디자인/감성몰입형, Type C: 미래형 동적 위젯)의 ASCII 와이어프레임 레이아웃과 특징을 작조하라.
            
            참조 PRD:
            ${prdContent}
            
            반드시 마크다운 블록 내에 테두리선(┌, ┐, │, ─, └, ┘)과 대괄호([])를 이용한 정밀한 ASCII 텍스트 아트를 완성하라.
            `;

            uxContent = await callGemini(
                "당신은 ASCII 와이어프레임을 텍스트 아트로 설계하는 UX Architect 에이전트입니다." + langSuffix,
                uxPrompt,
                (msg) => logAgent('architect', msg)
            );
            fs.writeFileSync(path.join(workspaceDir, '03_ux_wireframes.md'), uxContent);
            logAgent('architect', t(`Type A, B, C 3가지 상이한 가치 지향 레이아웃 ASCII 제도 완료. 와이어프레임 문서 적재 완료.`, `Completed ASCII drafts for Type A/B/C layouts. Wireframe document saved.`));
            logAgent('architect', t(`→ [SendMessage to product-reviewer] 삼각 정합성 크로스 검수 의뢰.`, `→ [SendMessage to product-reviewer] Requesting cross-consistency audit.`));
        } else {
            uxContent = fs.readFileSync(path.join(workspaceDir, '03_ux_wireframes.md'), 'utf-8');
            logAgent('architect', t(`기존 와이어프레임 문서 적재 상태 로딩 완료. 정합성이 유지됩니다.`, `Existing wireframe document loaded. Consistency maintained.`));
        }

        // --- STAGE 4: Product Reviewer (QA Audit) ---
        logAgent('reviewer', t(`삼각 교차 검수를 실시합니다: (1-pager 목표 vs PRD REQ ID vs 와이어프레임 CTA 버튼 일치성 전수 점검)`, `Performing cross-consistency audit: (1-pager goals vs PRD REQ IDs vs Wireframe CTA buttons).`));
        
        const reviewerPrompt = `
        다음 3종의 기획 패키지(1-pager, PRD, 와이어프레임)를 분석하여 비즈니스-명세-디자인 정합성을 감사하라.
        
        1-pager:
        ${onePagerContent}
        
        PRD:
        ${prdContent}
        
        와이어프레임 3안:
        ${uxContent}
        
        반드시 PASS 판정 및 다음 템플릿에 맞춘 감사 보고서를 생성하라:
        # [정합성 검수 보고서] {제목}
        - **최종 판정**: [PASS]
        - **감사 일시**: {날짜}
        ## 1. 정량적 일치성 매칭률 (비즈니스 정합성, 기능-UX 연결성, 예외 정의 충족, 보안 안전성 검증 결과 테이블)
        ## 2. 정성적 품질 평가 총평
        `;

        auditContent = await callGemini(
            "당신은 완결된 기획의 삼각 정합성을 최종 감사하는 Product Reviewer QA 에이전트입니다." + langSuffix,
            reviewerPrompt,
            (msg) => logAgent('reviewer', msg)
        );
        fs.writeFileSync(path.join(workspaceDir, '04_reviewer_audit.md'), auditContent);
        logAgent('reviewer', t(`검증 완료. 모든 기획 요건이 100% 삼각 일치함을 확인. [QA PASS] 결재 승인.`, `Audit complete. Verified 100% consistency across all planning documents. [QA PASS] approved.`));

        // --- STAGE 5: Prototype Generator (Interactive HTML) ---
        logAgent('architect', t(`QA 검수 완료. 와이어프레임 Type A를 기반으로 인터랙티브 HTML 프로토타입을 생성합니다.`, `QA audit passed. Generating interactive HTML prototype based on Wireframe Type A.`));

        const prototypePrompt = `
        당신은 숙련된 프론트엔드 개발자입니다. 아래 PRD 요건서와 와이어프레임을 기반으로, 완전히 동작하는 인터랙티브 HTML 프로토타입을 생성하세요.

        [PRD 요건서]
        ${prdContent}

        [와이어프레임 (Type A 기준 레이아웃 참고)]
        ${uxContent}

        [요구사항]
        - 반드시 단일 완전한 HTML 파일로 생성 (외부 의존성 없이 CDN 사용 가능)
        - CSS는 <style> 태그 내부에 인라인으로 포함
        - JavaScript는 <script> 태그 내부에 인라인으로 포함
        - 모던하고 세련된 UI (CSS 변수, 그라디언트, 애니메이션 포함)
        - 주요 인터랙션 동작 구현 (탭 전환, 모달, 폼 입력, 버튼 클릭 효과)
        - 반응형 레이아웃 (모바일/데스크탑 대응)
        - 실제 서비스처럼 보이는 더미 데이터와 텍스트 포함
        - PRD의 핵심 기능(REQ-*)을 화면에 시각적으로 표현
        - 한국어 UI 텍스트 사용

        반드시 <!DOCTYPE html>로 시작하는 완전한 단일 HTML 파일만 출력하라. 마크다운 코드블록(\`\`\`) 없이 순수 HTML만 출력.
        `;

        prototypeContent = await callGemini(
            "당신은 PRD와 와이어프레임을 실제 동작하는 인터랙티브 HTML 프로토타입으로 변환하는 프론트엔드 개발 에이전트입니다.",
            prototypePrompt,
            (msg) => logAgent('architect', msg)
        );

        // Strip markdown code fences if Gemini wraps output
        prototypeContent = prototypeContent
            .replace(/^```html\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

        logAgent('architect', t(`인터랙티브 HTML 프로토타입 생성 완료. 브라우저에서 즉시 실행 가능합니다.`, `Interactive HTML prototype generated. Ready to run in browser.`));

        // --- DEPLOYMENT & EXPORT ---
        logAgent('system', t(`최종 배포 프로세스 진입. 파일명 보안 정제 적용 중...`, `Entering final deployment phase. Applying filename sanitation...`));
        const cleanTitle = sanitizeFilename(originalIdea.slice(0, 15));
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '').slice(2);
        
        const onePagerName = `1pager_${cleanTitle}_${dateStr}.md`;
        const threeCName = `threec_${cleanTitle}_${dateStr}.md`;
        const meceName = `mece_${cleanTitle}_${dateStr}.md`;
        const prdName = `prd_${cleanTitle}_${dateStr}.md`;
        const wireframeName = `wireframe_${cleanTitle}_${dateStr}.md`;
        const auditName = `audit_${cleanTitle}_${dateStr}.md`;
        const prototypeName = `prototype_${cleanTitle}_${dateStr}.html`;

        fs.writeFileSync(path.join(outputsDir, onePagerName), onePagerContent);
        fs.writeFileSync(path.join(outputsDir, threeCName), threeCContent);
        fs.writeFileSync(path.join(outputsDir, meceName), meceContent);
        fs.writeFileSync(path.join(outputsDir, prdName), prdContent);
        fs.writeFileSync(path.join(outputsDir, wireframeName), uxContent);
        fs.writeFileSync(path.join(outputsDir, auditName), auditContent);
        fs.writeFileSync(path.join(outputsDir, prototypeName), prototypeContent);
        
        logAgent('system', t(`outputs/ 디렉토리에 마크다운 기획 서류 6종 + HTML 프로토타입 영구 배포 완료.`, `Successfully deployed 6 markdown planning documents + HTML prototype to outputs/ directory.`));
        logAgent('system', t(`- 요약서: outputs/${onePagerName}`, `- Summary: outputs/${onePagerName}`));
        logAgent('system', t(`- 3C 분석: outputs/${threeCName}`, `- 3C Analysis: outputs/${threeCName}`));
        logAgent('system', t(`- MECE 분석: outputs/${meceName}`, `- MECE Analysis: outputs/${meceName}`));
        logAgent('system', t(`- PRD: outputs/${prdName}`, `- PRD: outputs/${prdName}`));
        logAgent('system', t(`- 와이어프레임: outputs/${wireframeName}`, `- Wireframes: outputs/${wireframeName}`));
        logAgent('system', t(`- 검수서: outputs/${auditName}`, `- Audit Report: outputs/${auditName}`));
        logAgent('system', t(`- 프로토타입: outputs/${prototypeName}`, `- Prototype: outputs/${prototypeName}`));

        // Send Final Data to Client
        sendSSE('complete', {
            title: cleanTitle,
            '1pager': onePagerContent,
            'threec': threeCContent,
            'mece': meceContent,
            'prd': prdContent,
            'wireframe': uxContent,
            'audit': auditContent,
            'prototype': prototypeContent
        });
        
        logAgent('system', t(`오케스트레이션 성공. 에이전트 팀 해체 및 완공.`, `Orchestration successful. Agent team dissolved and work completed.`));

    } catch (error) {
        logAgent('system', `에러 발생: ${error.message}`);
        sendSSE('error', { message: error.message });
    } finally {
        if (heartbeat) clearInterval(heartbeat);
        res.end();
    }
});

// ── Localhost-only security guard middleware ─────────────────────────────────
function localOnlyGuard(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || '';
    const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
    if (!isLocal) {
        return res.status(403).json({ error: '로컬 접근만 허용됩니다.' });
    }
    next();
}

// ── GET /api/proxy-status ─────────────────────────────────────────────────────
// 브라우저가 로컬 서버 실행 여부 및 API Key 보유 여부를 감지하는 엔드포인트
app.get('/api/proxy-status', localOnlyGuard, (req, res) => {
    const hasKey = !!(GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 10);
    res.json({
        ok: true,
        proxyAvailable: hasKey,
        port: PORT,
        message: hasKey
            ? '✅ 로컬 서버 실행 중 — API Key 불필요 (서버에서 자동 처리)'
            : '⚠️ 서버 실행 중이나 .env에 GEMINI_API_KEY가 없습니다.'
    });
});

// ── POST /api/proxy-gemini ────────────────────────────────────────────────────
// 클라이언트 대신 서버의 .env API Key로 Gemini를 호출하는 투명 프록시
app.post('/api/proxy-gemini', localOnlyGuard, async (req, res) => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim().length < 10) {
        return res.status(503).json({ error: '.env에 GEMINI_API_KEY가 설정되지 않았습니다.' });
    }

    const { systemInstruction, userPrompt, maxTokens } = req.body;
    if (!systemInstruction || !userPrompt) {
        return res.status(400).json({ error: 'systemInstruction 과 userPrompt 가 필요합니다.' });
    }

    try {
        const text = await callGemini(systemInstruction, userPrompt);
        res.json({ ok: true, text });
    } catch (err) {
        const msg = err.response?.data?.error?.message || err.message;
        res.status(500).json({ ok: false, error: msg });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`[PITL Engine] Server is running on http://localhost:${PORT}`);
    console.log(`[PITL Proxy]  Local proxy active → /api/proxy-status  /api/proxy-gemini`);
});
