// payment-platform 포트폴리오(/payment-platform-portfolio/)를 PDF로 추출한다.
// 포트폴리오 소스(astro/css/ts)는 전혀 건드리지 않는다 — 브라우저 런타임에서만 조작한다.
//
// 사용법:
//   node scripts/export-portfolio-pdf.mjs
//
// 환경변수:
//   FORMAT=print (기본) 각 섹션을 개별 페이지로 분할 및 병합 · 잘림 원천 방지
//   FORMAT=web         콘텐츠 폭 그대로 세로 분할 · 넓은 레이아웃 보존
//   FORMAT=long        페이지를 나누지 않는 통짜 1장 (화면 제출용)
//   FORMAT=a4          A4 가로 (표준 용지지만 세로 긴 요소가 밀려 빈 여백 多)
//   OUT=<경로>          출력 PDF 경로 (기본 export-portfolio/payment-platform-portfolio.pdf)
//   SERVER=<url>        이미 떠 있는 dev 서버 재사용 (예: http://localhost:4321) · 미지정 시 자동 기동

import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import QRCode from 'qrcode';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROUTE = process.env.ROUTE || '/payment-platform-portfolio/';
const SITE = 'https://hyoguoo.github.io/payment-platform-portfolio'; // QR·딥링크가 가리킬 배포 주소
const OUT = process.env.OUT || 'export-portfolio/payment-platform-portfolio.pdf';
const FORMAT = (process.env.FORMAT || 'print').toLowerCase();
const REUSE = process.env.SERVER || '';

const log = (...a) => console.log('[export-pdf]', ...a);

// astro dev 서버를 띄우고 stdout 에서 실제 URL 을 감지한다.
function startDevServer() {
  return new Promise((resolve, reject) => {
    log('astro dev 서버 기동 중…');
    const proc = spawn('npm', ['run', 'dev', '--', '--port', '4333'], {
      cwd: process.cwd(),
      env: process.env,
      detached: true, // 프로세스 그룹 리더 → 종료 시 astro 자식까지 함께 정리
    });
    let settled = false;
    const onData = (buf) => {
      const s = buf.toString();
      const m = s.match(/https?:\/\/localhost:(\d+)\/?/);
      if (m && !settled) {
        settled = true;
        resolve({ proc, base: `http://localhost:${m[1]}` });
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('exit', (c) => {
      if (!settled) { settled = true; reject(new Error(`dev 서버가 코드 ${c} 로 종료됨`)); }
    });
    setTimeout(() => {
      if (!settled) { settled = true; reject(new Error('dev 서버 기동 시간 초과(60s)')); }
    }, 60000);
  });
}

function stopDevServer(proc) {
  if (!proc) return;
  try { process.kill(-proc.pid, 'SIGTERM'); } catch { /* 이미 종료됨 */ }
}

async function main() {
  let server = null;
  let base = REUSE;
  if (!base) {
    server = await startDevServer();
    base = server.base;
  }
  log('대상 URL:', base + ROUTE);

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 1600 },
      deviceScaleFactor: 2,
      reducedMotion: 'reduce', // 핵심: motion.ts 가 js-reveal 을 아예 안 켜 → 리빌 요소가 처음부터 보인다
      colorScheme: 'light',
    });
    const page = await context.newPage();

    await page.goto(base + ROUTE, { waitUntil: 'networkidle', timeout: 60000 });

    // 클라이언트 스크립트가 SVG 다이어그램을 다 그릴 때까지 대기
    await page.waitForSelector('svg.archmap', { timeout: 15000 }).catch(() => {});
    await page.waitForSelector('svg.scnmap', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // ── 런타임 조작 (소스 무수정) ─────────────────────────────
    const applied = await page.evaluate(() => {
      const r = {};
      // 접힌 details(설계 결정 카드 등) 전부 펼침 — page.pdf() 는 beforeprint 를 안 띄우므로 직접 연다
      const dets = document.querySelectorAll('details:not([open])');
      dets.forEach((d) => { d.open = true; });
      r.details = dets.length;

      // 리빌/스태거 강제 노출 (reducedMotion 로 이미 해제되지만 이중 안전장치)
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
      document.querySelectorAll('.stagger').forEach((el) => el.classList.add('in'));
      document.querySelectorAll('.stagger > .st-i').forEach((el) => el.classList.add('in'));

      // 아키텍처 지도 draw-in 완료 상태로
      const arch = document.querySelector('svg.archmap');
      if (arch) arch.classList.add('drawn');
      document.querySelectorAll('svg.archmap .aedge').forEach((p) => { p.style.strokeDashoffset = '0'; });

      // 상태머신 — 결제(Payment)·PG 두 패널 노출
      const smPay = document.getElementById('sm-payment');
      const smPg = document.getElementById('sm-pg');
      if (smPay) smPay.hidden = false;
      if (smPg) smPg.hidden = false;
      r.stateShown = !!(smPay && smPg);

      // 대표 사례 선택 — 클릭을 트리거해 상세 패널을 대표 내용으로 채운다 (나머지는 QR 로 유도)
      const click = (sel) => { const el = document.querySelector(sel); if (el) { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; } return false; };
      r.repArch = click('#archWrap .anode[data-id="payment"]');       // 아키텍처: 중심 오케스트레이터
      r.repPay = click('#smWrap .snode[data-state="IN_PROGRESS"]');   // 결제 상태: 진행 중
      r.repPg = click('#pgSmWrap .snode[data-state="IN_PROGRESS"]');  // PG 상태: self-loop 재시도

      // 단계별 세부 프로세스(#stages) 제거 — 양이 많아 PDF 에선 잘림/여백을 유발.
      // 22단계 시퀀스 다이어그램은 남기고, 세부 메서드는 QR 인터랙티브로 유도한다.
      const stages = document.getElementById('stages');
      if (stages) {
        const prev = stages.previousElementSibling;
        if (prev && prev.classList && prev.classList.contains('sub-label')) prev.remove();
        stages.remove();
        r.stagesRemoved = true;
      }
      return r;
    });
    log(`details ${applied.details}개 펼침 · 상태머신 대표 pay/pg: ${applied.repPay}/${applied.repPg}`);

    // ── 인터랙션 유도: 처음(핵심 역량) 한 곳에만 전체 인터랙티브 버전 안내 ──
    const introQr = await QRCode.toDataURL(SITE, { margin: 1, width: 240, color: { dark: '#111111', light: '#ffffff' } });
    const ctaInjected = await page.evaluate(({ SITE, qr }) => {
      let count = 0;
      
      // 1. 1페이지 (hero) 영역 하단에 QR 안내 추가
      const heroHost = document.querySelector('.hero-inner') || document.querySelector('.hero');
      if (heroHost) {
        const heroBox = document.createElement('div');
        heroBox.className = 'qr-cta hero-qr-cta';
        heroBox.innerHTML =
          '<img src="' + qr + '" alt="QR" width="84" height="84">' +
          '<div class="qr-tx">' +
            '<div class="qr-h">인터랙티브 다이어그램이 포함된 전체 웹 버전을 확인해 보세요.</div>' +
            '<div class="qr-s">웹 포트폴리오 주소 →</div>' +
            '<a href="' + SITE + '">' + SITE + '</a>' +
          '</div>';
        heroHost.appendChild(heroBox);
        count++;
      }

      // 2. 기존 영역(역량 밴드 혹은 overview)에 QR 안내 추가
      const host = document.querySelector('.cap-band-sec') || document.querySelector('#overview');
      if (host) {
        const box = document.createElement('div');
        box.className = 'qr-cta';
        box.innerHTML =
          '<img src="' + qr + '" alt="QR" width="84" height="84">' +
          '<div class="qr-tx">' +
            '<div class="qr-h">노드·상태·시나리오를 직접 눌러보는 인터랙티브 버전이 있습니다</div>' +
            '<div class="qr-s">전체 인터랙티브 버전 →</div>' +
            '<a href="' + SITE + '">' + SITE + '</a>' +
          '</div>';
        host.appendChild(box);
        count++;
      }
      return count;
    }, { SITE, qr: introQr });
    log(`인터랙티브 안내(QR) 삽입: ${ctaInjected}곳 완료`);

    // 잘림 방지 CSS 주입 — 잘리면 안 되는 모든 블록에 break-inside:avoid.
    // (소스 무수정: 브라우저 런타임에만 얹는다. 측정 결과 모든 블록이 한 페이지(1810px)
    //  보다 작아, avoid 를 걸면 어떤 것도 페이지 경계에서 잘리지 않는다 — 다이어그램 포함)
    await page.addStyleTag({
      content: `@media print {
        table tr,
        .pstage, .dcard, .solve, .limit, .lcard, .card, .const, .const-item, .wf-card,
        .branch, .steps > li, .scn-btn, .svc-row, .qr-cta,
        svg, .map-wrap, .swim-wrap, .statemachine, .bench-row,
        .arch-layout, .sm-layout, .mod-layout, .scn-theater, .trace-strip {
          break-inside: avoid; page-break-inside: avoid;
        }
        .sub-label, summary, .sec-head, h2, h3 {
          break-after: avoid; page-break-after: avoid;
        }
      }
      /* QR·URL 유도 박스 (런타임 삽입 요소 · 원본 색 토큰 재사용) */
      .qr-cta {
        margin-top: 16px; display: flex; gap: 16px; align-items: center;
        padding: 14px 16px; border: 1px solid var(--accent-line);
        border-radius: 12px; background: var(--accent-soft);
      }
      .hero-qr-cta {
        margin-top: 32px;
        max-width: 600px;
      }
      .qr-cta img { flex: none; border-radius: 6px; background: #fff; padding: 5px; box-shadow: 0 0 0 1px var(--hairline); }
      .qr-tx { min-width: 0; }
      .qr-h { font-weight: 650; color: var(--ink); font-size: 14px; line-height: 1.4; }
      .qr-s { margin-top: 6px; font-size: 12px; color: var(--muted); }
      .qr-cta a { display: inline-block; font-family: var(--mono, monospace); font-size: 12px; color: var(--accent-text); word-break: break-all; text-decoration: none; }`,
    });

    // print 미디어로 전환 (reducedMotion 설정은 유지된다)
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(300);

    // ── PDF 출력 ─────────────────────────────────────────────
    await mkdir(path.dirname(OUT), { recursive: true });
    if (FORMAT === 'print') {
      // 기존 웹 페이지의 각 섹션을 논리적 페이지로 자른다. 섹션만 보이게 하고 콘텐츠
      // 높이만큼 개별 PDF 로 뽑아 병합 → 섹션=페이지 1장 · 잘림 0 · 하단 여백 0 · 밀도 그대로.
      const { PDFDocument } = await import('pdf-lib');
      const { writeFile } = await import('node:fs/promises');
      const SEC = '.hero, main > section';
      const W = 1280; // 웹 레이아웃 폭 고정
      const count = await page.$$eval(SEC, (els) => els.length);
      const merged = await PDFDocument.create();
      for (let i = 0; i < count; i++) {
        const h = await page.evaluate((a) => {
          const secs = [...document.querySelectorAll(a.sel)];
          secs.forEach((s, k) => { s.style.display = k === a.idx ? '' : 'none'; });
          return Math.ceil(secs[a.idx].getBoundingClientRect().height);
        }, { sel: SEC, idx: i });
        const buf = await page.pdf({
          width: `${W}px`, height: `${h}px`, printBackground: true, pageRanges: '1',
          margin: { top: '0', bottom: '0', left: '0', right: '0' },
        });
        const doc = await PDFDocument.load(buf);
        const [pg] = await merged.copyPages(doc, [0]);
        merged.addPage(pg);
      }
      await page.evaluate((sel) => document.querySelectorAll(sel).forEach((s) => { s.style.display = ''; }), SEC);
      await writeFile(OUT, await merged.save());
      log(`저장 완료 → ${OUT} (FORMAT=print · ${count}섹션 = ${count}페이지)`);
    } else {
      const opts = { path: OUT, printBackground: true, timeout: 60000 };
      if (FORMAT === 'long') {
        const full = await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight));
        opts.width = '1280px';
        opts.height = `${full + 40}px`;
        opts.pageRanges = '1';
        opts.margin = { top: '0', bottom: '0', left: '0', right: '0' };
      } else if (FORMAT === 'web') {
        opts.width = '1280px';
        opts.height = '1810px';
        opts.margin = { top: '0', bottom: '0', left: '0', right: '0' };
      } else {
        opts.format = 'A4';
        opts.landscape = true;
        opts.scale = 0.86;
        opts.margin = { top: '10px', bottom: '10px', left: '10px', right: '10px' };
      }
      await page.pdf(opts);
      log('저장 완료 →', OUT, `(FORMAT=${FORMAT})`);
    }
  } finally {
    await browser.close();
    stopDevServer(server && server.proc);
  }
}

main().catch((e) => {
  console.error('[export-pdf] 실패:', e.message);
  process.exit(1);
});
