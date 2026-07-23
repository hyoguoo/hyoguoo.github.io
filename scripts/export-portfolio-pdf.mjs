// payment-platform 포트폴리오(/payment-platform-portfolio/)를 PDF로 추출한다.
// 포트폴리오 소스(astro/css/ts)는 전혀 건드리지 않는다 — 브라우저 런타임에서만 조작한다.
//
// 사용법:
//   node scripts/export-portfolio-pdf.mjs
//
// 환경변수:
//   OUT=<경로>          출력 PDF 경로 (기본 export-portfolio/payment-platform-portfolio.pdf)
//   SERVER=<url>        이미 떠 있는 dev 서버 재사용 (예: http://localhost:4321) · 미지정 시 자동 기동

import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import QRCode from 'qrcode';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// --- 전역 설정 (유지보수를 위해 변경될 수 있는 값들을 상단으로 분리) ---
const CONFIG = {
  route: process.env.ROUTE || '/payment-platform-portfolio/',
  siteUrl: 'https://hyoguoo.github.io/payment-platform-portfolio',
  outPath: process.env.OUT || 'export-portfolio/payment-platform-portfolio.pdf',
  reuseServer: process.env.SERVER || '',
  devServerPort: 4333,
  
  pdf: {
    width: 1280,
    viewportHeight: 1600,
    sectionSelector: '.hero, main > section'
  },

  // DOM 조작 시 사용할 셀렉터 모음
  selectors: {
    waitFor: ['svg.archmap', 'svg.scnmap'],
    revealClasses: ['.reveal', '.stagger', '.stagger > .st-i'],
    archMap: 'svg.archmap',
    archEdges: 'svg.archmap .aedge',
    statePanels: ['sm-payment'], // PDF에서는 결제 상태 머신 하나만 대표로 노출
    clickTargets: [
      '#archWrap .anode[data-id="payment"]',
      '#smWrap .snode[data-state="IN_PROGRESS"]'
    ],
    removeSelectors: ['#stages', '.cap-band-sec .sub-label']
  },

  // 인쇄 시 잘림 방지 스타일 지정 대상
  styles: {
    avoidBreakInside: [
      'table tr', '.pstage', '.dcard', '.solve', '.limit', '.lcard', '.card', '.const', '.const-item', '.wf-card',
      '.branch', '.steps > li', '.scn-btn', '.svc-row', '.qr-cta',
      'svg', '.map-wrap', '.swim-wrap', '.statemachine', '.bench-row',
      '.arch-layout', '.sm-layout', '.mod-layout', '.scn-theater', '.trace-strip'
    ],
    avoidBreakAfter: ['.sub-label', 'summary', '.sec-head', 'h2', 'h3']
  },
  
  qr: {
    heroSelector: '.hero-inner, .hero',
    heroMsg: 'Interactive Web Version',
    heroSubMsg: 'PDF 환경에서는 동적 컴포넌트가 동작하지 않습니다.<br>상태 머신 조작 및 시나리오 시뮬레이션은 웹 버전을 이용해 주세요.'
  }
};

const log = (...args) => console.log('[export-pdf]', ...args);

// --- 1. 개발 서버 관리 ---
function startDevServer() {
  return new Promise((resolve, reject) => {
    log(`astro dev 서버 기동 중... (포트: ${CONFIG.devServerPort})`);
    const proc = spawn('npm', ['run', 'dev', '--', '--port', String(CONFIG.devServerPort)], {
      cwd: process.cwd(),
      env: process.env,
      detached: true,
    });
    
    let settled = false;
    const onData = (buf) => {
      const match = buf.toString().match(/https?:\/\/localhost:(\d+)\/?/);
      if (match && !settled) {
        settled = true;
        resolve({ proc, base: `http://localhost:${match[1]}` });
      }
    };
    
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('exit', (code) => {
      if (!settled) { settled = true; reject(new Error(`dev 서버 종료 (코드: ${code})`)); }
    });
    
    setTimeout(() => {
      if (!settled) { settled = true; reject(new Error('dev 서버 기동 시간 초과 (60s)')); }
    }, 60000);
  });
}

function stopDevServer(proc) {
  if (!proc) return;
  try { process.kill(-proc.pid, 'SIGTERM'); } catch { /* 무시 */ }
}

// --- 2. 렌더링 환경 최적화 (DOM 조작) ---
async function prepareRuntimeEnvironment(page) {
  // SVG 렌더링 완료 대기
  for (const sel of CONFIG.selectors.waitFor) {
    await page.waitForSelector(sel, { timeout: 15000 }).catch(() => {});
  }
  await page.waitForTimeout(1000);

  // 런타임 DOM 조작 (Playwright evaluate 컨텍스트로 환경 변수 주입)
  const stats = await page.evaluate((sel) => {
    let detailsCount = 0;
    
    // 1. 모든 숨겨진 details 요소 펼침
    document.querySelectorAll('details:not([open])').forEach((el) => {
      el.open = true;
      detailsCount++;
    });

    // 2. 스크롤 애니메이션 요소 강제 노출
    sel.revealClasses.forEach(cls => {
      document.querySelectorAll(cls).forEach((el) => el.classList.add('in'));
    });

    // 3. SVG 다이어그램 선 긋기 애니메이션 완료 처리
    const arch = document.querySelector(sel.archMap);
    if (arch) arch.classList.add('drawn');
    document.querySelectorAll(sel.archEdges).forEach((el) => {
      el.style.strokeDashoffset = '0';
    });

    // 4. 상태 머신 패널 숨김 해제
    sel.statePanels.forEach(id => {
      const panel = document.getElementById(id);
      if (panel) panel.hidden = false;
    });

    // 5. 대표 사례 데이터 노출을 위한 강제 클릭 트리거
    sel.clickTargets.forEach(target => {
      const el = document.querySelector(target);
      if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // 6. PDF 출력을 위해 불필요한 영역 제거
    sel.removeSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        const prev = el.previousElementSibling;
        if (prev && prev.classList.contains('sub-label')) prev.remove();
        el.remove();
      });
    });

    // 7. 핵심 역량 섹션을 Overview 섹션으로 병합 (한 페이지로 동시 출력)
    const overview = document.getElementById('overview');
    const capBand = document.querySelector('.cap-band-sec');
    if (overview && capBand) {
      overview.appendChild(capBand);
    }

    return { detailsCount };
  }, CONFIG.selectors);
  
  log(`런타임 조작 완료: details ${stats.detailsCount}개 펼침`);
}

// --- 3. QR 코드 및 인터랙티브 안내 유도부 삽입 ---
async function injectInteractiveQRCodes(page) {
  const qrDataUrl = await QRCode.toDataURL(CONFIG.siteUrl, {
    margin: 1, width: 240, color: { dark: '#111111', light: '#ffffff' }
  });
  
  const insertedCount = await page.evaluate(({ qrConf, url, qr }) => {
    let count = 0;
    const injectCta = (selector, msg, subMsg, extraClass = '') => {
      const host = document.querySelector(selector);
      if (host) {
        const box = document.createElement('div');
        box.className = `qr-cta ${extraClass}`.trim();
        box.innerHTML = `
          <img src="${qr}" alt="QR" width="84" height="84">
          <div class="qr-tx">
            <div class="qr-h">${msg}</div>
            <div class="qr-s">${subMsg}</div>
            <a href="${url}">${url}</a>
          </div>
        `;
        host.appendChild(box);
        count++;
      }
    };

    // 상단(Hero) 안내 삽입
    injectCta(qrConf.heroSelector, qrConf.heroMsg, qrConf.heroSubMsg, 'hero-qr-cta');

    return count;
  }, { qrConf: CONFIG.qr, url: CONFIG.siteUrl, qr: qrDataUrl });
  
  log(`안내용 QR 삽입 완료: ${insertedCount}곳`);
}

// --- 4. PDF 인쇄용 최적화 스타일 (CSS) 적용 ---
async function injectPrintStyles(page) {
  const css = `
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      /* 애니메이션 멈춤에 의한 투명화 및 축소 현상 강제 방지 */
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
      .bb-fill, .bb-lb, .reveal, .stagger > .st-i {
        transform: none !important;
        opacity: 1 !important;
      }
      
      ${CONFIG.styles.avoidBreakInside.join(', ')} {
        break-inside: avoid; page-break-inside: avoid;
      }
      ${CONFIG.styles.avoidBreakAfter.join(', ')} {
        break-after: avoid; page-break-after: avoid;
      }
    }
    
    .qr-cta {
      margin-top: 40px; display: inline-flex; gap: 20px; align-items: center;
      padding: 16px 20px; border: 1px solid var(--line);
      border-radius: 6px; background: transparent;
    }
    .qr-cta img { flex: none; width: 64px; height: 64px; background: #fff; padding: 4px; border: 1px solid var(--line); border-radius: 4px; }
    .qr-tx { display: flex; flex-direction: column; justify-content: center; max-width: 420px; }
    .qr-h { font-family: var(--mono, monospace); font-weight: 600; color: var(--ink); font-size: 12.5px; margin-bottom: 6px; letter-spacing: 0.02em; }
    .qr-s { font-size: 12.5px; color: var(--ink-soft); line-height: 1.5; margin-bottom: 8px; }
    .qr-cta a { 
      font-family: var(--mono, monospace); font-size: 11.5px; font-weight: 500; 
      color: var(--accent); text-decoration: none; 
    }
    .qr-cta a:hover { text-decoration: underline; }
  `;
  
  await page.addStyleTag({ content: css });
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(300);
}

// --- 5. 최종 PDF 섹션별 추출 및 병합 ---
async function exportSectionsToPdf(page) {
  await page.evaluate(() => document.fonts.ready); // 폰트 렌더링 완전 보장 (텍스트 밀림 방지)
  await mkdir(path.dirname(CONFIG.outPath), { recursive: true });

  const sectionSelector = CONFIG.pdf.sectionSelector;
  const count = await page.$$eval(sectionSelector, (els) => els.length);
  
  const mergedPdf = await PDFDocument.create();
  
  for (let i = 0; i < count; i++) {
    // 특정 섹션 높이 계산 및 렌더링 포커스
    const height = await page.evaluate(({ sel, idx }) => {
      const sections = [...document.querySelectorAll(sel)];
      sections.forEach((el, k) => { el.style.display = (k === idx) ? '' : 'none'; });
      // margin 등에 의해 미세하게 잘리는 현상 방지를 위해 40px 여유 공간 추가
      return Math.ceil(sections[idx].getBoundingClientRect().height) + 40;
    }, { sel: sectionSelector, idx: i });
    
    const pdfBuffer = await page.pdf({
      width: `${CONFIG.pdf.width}px`, 
      height: `${height}px`, 
      printBackground: true, 
      pageRanges: '1',
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    
    const doc = await PDFDocument.load(pdfBuffer);
    const [copiedPage] = await mergedPdf.copyPages(doc, [0]);
    mergedPdf.addPage(copiedPage);
  }
  
  // 병합된 PDF에 페이지 번호 삽입 (우측 상단)
  const font = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const pages = mergedPdf.getPages();
  const totalPages = pages.length;
  
  pages.forEach((p, idx) => {
    const { width, height } = p.getSize();
    const text = `${idx + 1} / ${totalPages}`;
    const textSize = 13;
    const textWidth = font.widthOfTextAtSize(text, textSize);
    
    p.drawText(text, {
      x: width - textWidth - 36, // 우측 여백 36px
      y: height - 36,            // 상단 여백 36px (pdf-lib은 좌측 하단이 0,0 기준점)
      size: textSize,
      font: font,
      color: rgb(0.5, 0.5, 0.5), // 회색
    });
  });
  
  // 페이지 내 요소 상태 원래대로 복구
  await page.evaluate((sel) => {
    document.querySelectorAll(sel).forEach((el) => { el.style.display = ''; });
  }, sectionSelector);
  
  await writeFile(CONFIG.outPath, await mergedPdf.save());
  log(`PDF 추출 완료 → ${CONFIG.outPath} (총 ${count}섹션 = ${count}페이지)`);
}

// --- 메인 파이프라인 ---
async function main() {
  let serverInfo = null;
  let baseUrl = CONFIG.reuseServer;
  
  if (!baseUrl) {
    serverInfo = await startDevServer();
    baseUrl = serverInfo.base;
  }
  log('타겟 URL:', baseUrl + CONFIG.route);

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: CONFIG.pdf.width, height: CONFIG.pdf.viewportHeight },
      deviceScaleFactor: 2,
      reducedMotion: 'reduce',
      colorScheme: 'light',
    });
    const page = await context.newPage();

    await page.goto(baseUrl + CONFIG.route, { waitUntil: 'networkidle', timeout: 60000 });

    await prepareRuntimeEnvironment(page);
    await injectInteractiveQRCodes(page);
    await injectPrintStyles(page);
    await exportSectionsToPdf(page);
    
  } finally {
    await browser.close();
    if (serverInfo) stopDevServer(serverInfo.proc);
  }
}

main().catch((err) => {
  console.error('[export-pdf] 실패:', err.message);
  process.exit(1);
});
