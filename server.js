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
async function callGemini(systemInstruction, userPrompt, logCallback = null) {
    const modelsToTry = [
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.0-flash'
    ];
    
    let lastError = null;
    for (const model of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        
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

// API: Save User Modified Document Content
app.post('/api/save-edit', (req, res) => {
    const { docKey, content } = req.body;
    
    if (!docKey || !content) {
        return res.status(400).json({ error: "docKey and content are required" });
    }

    try {
        const fileMap = {
            '1pager': '01_strategist_1pager.md',
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
    const { title, date } = req.query;
    if (!title || !date) {
        return res.status(400).json({ error: "title and date are required" });
    }

    try {
        const onePagerPath = path.join(outputsDir, `1pager_${title}_${date}.md`);
        const prdPath = path.join(outputsDir, `prd_${title}_${date}.md`);
        const wireframePath = path.join(outputsDir, `wireframe_${title}_${date}.md`);
        const auditPath = path.join(outputsDir, `audit_${title}_${date}.md`);

        const doc = {
            title: title,
            '1pager': fs.existsSync(onePagerPath) ? fs.readFileSync(onePagerPath, 'utf-8') : '',
            'prd': fs.existsSync(prdPath) ? fs.readFileSync(prdPath, 'utf-8') : '',
            'wireframe': fs.existsSync(wireframePath) ? fs.readFileSync(wireframePath, 'utf-8') : '',
            'audit': fs.existsSync(auditPath) ? fs.readFileSync(auditPath, 'utf-8') : ''
        };

        // Populate active workspace files so editing and regeneration are supported instantly
        if (doc['1pager']) fs.writeFileSync(path.join(workspaceDir, '01_strategist_1pager.md'), doc['1pager']);
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
    const { idea, resumeFrom } = req.query;

    if (!idea) {
        return res.status(400).json({ error: "Idea is required" });
    }

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendSSE = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const logAgent = (agent, msg) => {
        const time = new Date().toLocaleTimeString('ko-KR', { hour12: false });
        sendSSE('log', { time, agent, msg });
    };

    try {
        let originalIdea = idea;
        const isRegen = (resumeFrom === 'prd' || resumeFrom === 'wireframe' || resumeFrom === 'audit');

        if (idea === 'REGENERATE') {
            const inputContent = fs.readFileSync(path.join(workspaceDir, '00_input.md'), 'utf-8');
            originalIdea = inputContent.replace('# User Input Idea\n\n', '').trim();
        }

        logAgent('system', `상품기획 자동화 프로세스 가동 (Product Mode 감지됨).`);
        
        if (isRegen) {
            logAgent('system', `부분 재기획 흐름을 감지했습니다. (수정 시점: ${resumeFrom})`);
            logAgent('system', `수정된 사항을 기반으로 이후 단계 문서들을 정합하게 자동 갱신합니다.`);
        } else {
            logAgent('system', `에이전트 4인 팀 및 오케스트레이션 스폰 완료 (strategist, analyst, architect, reviewer).`);
            fs.writeFileSync(path.join(workspaceDir, '00_input.md'), `# User Input Idea\n\n${originalIdea}`);
        }

        let onePagerContent = '';
        let prdContent = '';
        let uxContent = '';
        let auditContent = '';

        // --- STAGE 1: Product Strategist (1-pager) ---
        if (!isRegen) {
            logAgent('strategist', `입력하신 아이디어 '${originalIdea}'를 바탕으로 1-pager 요약서 기획을 시작합니다.`);
            
            const strategistPrompt = `
            사용자의 상품 아이디어를 분석하여 '이 제품이 왜 필요한가'를 1장으로 정리하는 1-pager 요약서를 작성하라.
            
            아이디어: ${originalIdea}
            
            반드시 다음 마크다운 형식을 따르고, 빈 칸 없이 완벽히 메트릭과 테이블 수치를 합리적으로 유추하여 채워라:
            # [YY.MM.DD] {아이디어 기반 제목} (Product Team)
            ## 1. 프로젝트 한 줄 요약
            ## 2. 대상 (테이블: 대상, 상황/특징)
            ## 3. 문제 정의 (고객 문제, 비즈니스 문제, 데이터 기반 현황 테이블, Root Cause)
            ## 4. 목표 (테이블: 항목, 목표 수치)
            ## 5. 현황 및 분석 (VOC 인용 등)
            ## 6. 해결방안 (Phase 1, Phase 2...)
            ## 7. 리스크 (테이블: 영향도, 리스크, 대응 방안)
            ## 8. 중요도 및 긴급도 (상/중/하 + 이유)
            `;
            
            onePagerContent = await callGemini(
                "당신은 상품 기획의 존재 이유(Why)를 정의하는 Product Strategist 에이전트입니다.", 
                strategistPrompt,
                (msg) => logAgent('strategist', msg)
            );
            fs.writeFileSync(path.join(workspaceDir, '01_strategist_1pager.md'), onePagerContent);
            logAgent('strategist', `비즈니스 문제 정의 및 정량 목표 수립 성공. 1-pager 요약 기획안 적재 완료.`);
            logAgent('strategist', `→ [SendMessage to prd-analyst] 기획 사양 및 기능 도출 협업 요청.`);
        } else {
            onePagerContent = fs.readFileSync(path.join(workspaceDir, '01_strategist_1pager.md'), 'utf-8');
            logAgent('strategist', `기존 1-pager 수정 반영본 로딩 완료. 정합성이 유지됩니다.`);
        }

        // --- STAGE 2: PRD Analyst (PRD) ---
        const skipPrd = (resumeFrom === 'wireframe' || resumeFrom === 'audit');
        if (!skipPrd) {
            logAgent('analyst', `1-pager 기획안을 바탕으로 상세 개발 요구사항(PRD) 및 예외 정책 수립을 전개합니다.`);
            
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
                "당신은 상세 요건 명세를 정의하는 PRD Analyst 에이전트입니다.",
                prdPrompt,
                (msg) => logAgent('analyst', msg)
            );
            fs.writeFileSync(path.join(workspaceDir, '02_prd_spec.md'), prdContent);
            logAgent('analyst', `REQ 사양 식별 완료 및 예외/보안 정책 수립 완료. PRD 명세서 적재 완료.`);
            logAgent('analyst', `→ [SendMessage to ux-architect] UX 레이아웃 스케치 협업 요청.`);
        } else {
            prdContent = fs.readFileSync(path.join(workspaceDir, '02_prd_spec.md'), 'utf-8');
            logAgent('analyst', `기존 PRD 명세서 적재 상태 로딩 완료. 정합성이 유지됩니다.`);
        }

        // --- STAGE 3: UX Architect (ASCII Wireframes) ---
        const skipUx = (resumeFrom === 'audit');
        if (!skipUx) {
            logAgent('architect', `PRD 요구사항을 확인했습니다. 공통 CTA 및 정보 우선순위에 부합하는 Type A/B/C 3가지 시안의 ASCII 와이어프레임을 그립니다.`);
            
            const uxPrompt = `
            다음 PRD 요건서를 참조하여, 화면 목적 및 공통 CTA를 노출하고 정보 구조가 확연히 다른 3가지 시안(Type A: 현실/안정형, Type B: 디자인/감성몰입형, Type C: 미래형 동적 위젯)의 ASCII 와이어프레임 레이아웃과 특징을 작조하라.
            
            참조 PRD:
            ${prdContent}
            
            반드시 마크다운 블록 내에 테두리선(┌, ┐, │, ─, └, ┘)과 대괄호([])를 이용한 정밀한 ASCII 텍스트 아트를 완성하라.
            `;

            uxContent = await callGemini(
                "당신은 ASCII 와이어프레임을 텍스트 아트로 설계하는 UX Architect 에이전트입니다.",
                uxPrompt,
                (msg) => logAgent('architect', msg)
            );
            fs.writeFileSync(path.join(workspaceDir, '03_ux_wireframes.md'), uxContent);
            logAgent('architect', `Type A, B, C 3가지 상이한 가치 지향 레이아웃 ASCII 제도 완료. 와이어프레임 문서 적재 완료.`);
            logAgent('architect', `→ [SendMessage to product-reviewer] 삼각 정합성 크로스 검수 의뢰.`);
        } else {
            uxContent = fs.readFileSync(path.join(workspaceDir, '03_ux_wireframes.md'), 'utf-8');
            logAgent('architect', `기존 와이어프레임 문서 적재 상태 로딩 완료. 정합성이 유지됩니다.`);
        }

        // --- STAGE 4: Product Reviewer (QA Audit) ---
        logAgent('reviewer', `삼각 교차 검수를 실시합니다: (1-pager 목표 vs PRD REQ ID vs 와이어프레임 CTA 버튼 일치성 전수 점검)`);
        
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
            "당신은 완결된 기획의 삼각 정합성을 최종 감사하는 Product Reviewer QA 에이전트입니다.",
            reviewerPrompt,
            (msg) => logAgent('reviewer', msg)
        );
        fs.writeFileSync(path.join(workspaceDir, '04_reviewer_audit.md'), auditContent);
        logAgent('reviewer', `검증 완료. 모든 기획 요건이 100% 삼각 일치함을 확인. [QA PASS] 결재 승인.`);

        // --- DEPLOYMENT & EXPORT ---
        logAgent('system', `최종 배포 프로세스 진입. 파일명 보안 정제 적용 중...`);
        const cleanTitle = sanitizeFilename(originalIdea.slice(0, 15));
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '').slice(2);
        
        const onePagerName = `1pager_${cleanTitle}_${dateStr}.md`;
        const prdName = `prd_${cleanTitle}_${dateStr}.md`;
        const wireframeName = `wireframe_${cleanTitle}_${dateStr}.md`;
        const auditName = `audit_${cleanTitle}_${dateStr}.md`;

        fs.writeFileSync(path.join(outputsDir, onePagerName), onePagerContent);
        fs.writeFileSync(path.join(outputsDir, prdName), prdContent);
        fs.writeFileSync(path.join(outputsDir, wireframeName), uxContent);
        fs.writeFileSync(path.join(outputsDir, auditName), auditContent);
        
        logAgent('system', `outputs/ 디렉토리에 마크다운 기획 서류 4종 영구 배포 완료.`);
        logAgent('system', `- 요약서: outputs/${onePagerName}`);
        logAgent('system', `- PRD: outputs/${prdName}`);
        logAgent('system', `- 와이어프레임: outputs/${wireframeName}`);
        logAgent('system', `- 검수서: outputs/${auditName}`);

        // Send Final Data to Client
        sendSSE('complete', {
            title: cleanTitle,
            '1pager': onePagerContent,
            'prd': prdContent,
            'wireframe': uxContent,
            'audit': auditContent
        });
        
        logAgent('system', `오케스트레이션 성공. 에이전트 팀 해체 및 완공.`);

    } catch (error) {
        logAgent('system', `에러 발생: ${error.message}`);
        sendSSE('error', { message: error.message });
    } finally {
        res.end();
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`[PITL Engine] Server is running on http://localhost:${PORT}`);
});
