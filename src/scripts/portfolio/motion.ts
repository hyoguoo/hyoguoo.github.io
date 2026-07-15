// @ts-nocheck
// payment-platform 포트폴리오 — 스크롤 모션 (리빌·스태거·카운트업·지도 draw-in) (이식된 로직).

/* ================= 스크롤 모션 (리빌 / 스태거 / 카운트업 / 지도 draw-in) ================= */
(function(){
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("js-reveal");

  function once(list, cb, opts){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ cb(e.target); io.unobserve(e.target); } });
    }, opts || { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
    (typeof list === "string" ? document.querySelectorAll(list) : list).forEach(function(el){ io.observe(el); });
  }

  /* 스크롤 리빌 */
  once(".reveal", function(el){ el.classList.add("in"); });

  /* 순서형 리스트 스태거 — 진짜 순서가 있는 것만 (진화 타임라인 / 결제 단계) */
  ["#stages", ".evo"].forEach(function(sel){
    var g = document.querySelector(sel); if (!g) return;
    g.classList.add("stagger");
    Array.prototype.forEach.call(g.children, function(ch, i){
      ch.classList.add("st-i"); ch.style.setProperty("--i", i);
    });
  });
  once(".stagger", function(el){ el.classList.add("in"); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.02 });

  /* 지표 카운트업 (실측 수치만) */
  function countUp(node, target, decimals, prefix){
    var start = null, dur = 1100;
    function fmt(v){ return prefix + (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString()); }
    function step(ts){
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - t, 3);
      node.textContent = fmt(target * e);
      if (t < 1) requestAnimationFrame(step); else node.textContent = fmt(target);
    }
    requestAnimationFrame(step);
  }
  var NUM = /^([+\-]?)(\d[\d,]*)(\.\d+)?$/;
  var metrics = [];
  document.querySelectorAll(".s-metric-val").forEach(function(el){
    var raw = el.firstChild;
    if (raw && raw.nodeType === 3 && NUM.test(raw.textContent.trim())) metrics.push(el);
  });
  once(metrics, function(el){
    var raw = el.firstChild, m = raw.textContent.trim().match(NUM);
    var prefix = m[1], decimals = m[3] ? m[3].length - 1 : 0;
    var target = parseFloat(m[2].replace(/,/g, "") + (m[3] || ""));
    var node = document.createTextNode(prefix + "0");
    el.replaceChild(node, raw);
    countUp(node, target, decimals, prefix);
  }, { threshold: 0.6 });

  /* 시스템 아키텍처 draw-in — 엣지가 흐르듯 그려진다 */
  (function(){
    var svg = document.querySelector("#archWrap svg.archmap"); if (!svg) return;
    var solids = Array.prototype.slice.call(svg.querySelectorAll(".aedge:not(.dash)"));
    solids.forEach(function(p, i){
      var len; try { len = p.getTotalLength(); } catch (_) { return; }
      if (!len) return;
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.style.transition = "stroke-dashoffset .85s cubic-bezier(.22,1,.36,1)";
      p.style.transitionDelay = (i * 35) + "ms";
    });
    once([svg], function(){
      svg.classList.add("drawn");
      solids.forEach(function(p){ p.style.strokeDashoffset = "0"; });
    }, { threshold: 0.25 });
  })();

  /* 안전장치: 2s 후에도 화면 근처인데 안 뜬 요소는 강제 노출 (prerender / 헤드리스 대비) */
  setTimeout(function(){
    document.querySelectorAll(".reveal:not(.in), .stagger:not(.in)").forEach(function(el){
      if (el.getBoundingClientRect().top < window.innerHeight * 1.2) el.classList.add("in");
    });
  }, 2000);
})();
