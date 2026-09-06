// @ts-nocheck
// payment-platform 포트폴리오 · 공용 렌더 헬퍼 (이스케이프·SVG 빌더·색 토큰). 이식된 vanilla JS.
export const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export function esc(s){return String(s).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];});}
export function escBr(s){return esc(s).replace(/\n/g,"<br>");}  /* 줄바꿈(\n)만 <br>로 · 불렛 산문용 */
export function chips(a){return (a||[]).map(function(c){return '<span class="chip">'+esc(c)+"</span>";}).join("");}
const SVGNS="http://www.w3.org/2000/svg";
export function sv(t,a){var e=document.createElementNS(SVGNS,t);for(var k in a)e.setAttribute(k,a[k]);return e;}
export const CV={ready:"--st-ready",inprog:"--st-inprog",done:"--st-done",failed:"--st-failed",quar:"--st-quar",expired:"--st-expired",recover:"--st-recover",
          payment:"--svc-payment",pg:"--svc-pg",product:"--svc-product",user:"--svc-user",infra:"--svc-infra"};
