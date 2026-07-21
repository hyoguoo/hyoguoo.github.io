// @ts-nocheck
// payment-platform 포트폴리오 · 딥링크·키보드 nav·스크롤 힌트·개요 로그·인쇄·테마 (이식된 로직).
import { reduce } from './util';

  /* ================= DEEP-LINK + KEYBOARD NAV ================= */
  (function(){
    /* 위임 핸들러 · 동적 생성 앵커(타임라인 근거 링크 등)까지 커버, details 자동 오픈 + 포커스 이동 */
    var backScn=document.getElementById("backToScn"),lastScnY=0;
    if(backScn)backScn.addEventListener("click",function(){
      backScn.hidden=true;window.scrollTo({top:lastScnY,behavior:reduce?"auto":"smooth"});
      var tl=document.getElementById("scnTimeline");
      if(tl){var cur=tl.querySelector(".scn-hop.cur")||tl;if(!cur.hasAttribute("tabindex"))cur.setAttribute("tabindex","-1");try{cur.focus({preventScroll:true});}catch(err){}}
    });
    document.addEventListener("click",function(e){
      var a=e.target&&e.target.closest?e.target.closest('a[href^="#"]'):null;
      if(!a)return;var id=a.getAttribute("href").slice(1);if(!id)return;
      var el=document.getElementById(id);if(!el)return;
      e.preventDefault();
      if(backScn){if(a.classList.contains("why-link")){lastScnY=window.scrollY;backScn.hidden=false;}else{backScn.hidden=true;}}
      if(el.tagName==="DETAILS")el.open=true;
      el.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
      if(!el.hasAttribute("tabindex"))el.setAttribute("tabindex","-1");
      try{el.focus({preventScroll:true});}catch(err){}
    });
    var state={};
    function writeHash(){var parts=[];["s","sm"].forEach(function(k){if(state[k]!=null&&state[k]!=="")parts.push(k+"="+encodeURIComponent(state[k]));});
      try{history.replaceState(null,"",parts.length?("#"+parts.join("&")):(location.pathname+location.search));}catch(e){}}
    function parseHash(){var o={};location.hash.replace(/^#/,"").split("&").forEach(function(kv){var p=kv.split("=");if(p[0])o[p[0]]=decodeURIComponent(p[1]||"");});return o;}
    var picker=document.getElementById("scnPicker");
    if(picker)picker.addEventListener("click",function(e){var b=e.target.closest?e.target.closest(".scn-btn"):null;if(b){state.s=b.dataset.i;writeHash();}});
    var smPay=document.getElementById("smTabPay"),smPg=document.getElementById("smTabPg");
    if(smPay)smPay.addEventListener("click",function(){state.sm="pay";writeHash();});
    if(smPg)smPg.addEventListener("click",function(){state.sm="pg";writeHash();});
    var theater=document.getElementById("scenario");
    if(theater&&picker)document.addEventListener("keydown",function(e){
      if(e.key!=="ArrowLeft"&&e.key!=="ArrowRight")return;
      var tg=e.target;if(tg&&(tg.tagName==="INPUT"||tg.tagName==="TEXTAREA"||tg.isContentEditable))return;
      var rc=theater.getBoundingClientRect();if(rc.bottom<140||rc.top>window.innerHeight-140)return;
      var btns=picker.querySelectorAll(".scn-btn");if(!btns.length)return;
      var cur=0;btns.forEach(function(b,i){if(b.getAttribute("aria-pressed")==="true")cur=i;});
      var nx=(cur+(e.key==="ArrowRight"?1:-1)+btns.length)%btns.length;
      e.preventDefault();btns[nx].click();btns[nx].focus();
    });
    var init=parseHash();
    if(init.sm==="pg"){var pg=document.getElementById("smTabPg");if(pg){pg.click();state.sm="pg";}}
    if(init.s!=null&&init.s!==""){var sb=document.querySelector('.scn-btn[data-i="'+init.s+'"]');if(sb){sb.click();state.s=init.s;}}
  })();

  /* 가로 스크롤 컨테이너 · 잘림 힌트 페이드 토글 */
  (function(){
    var sxUpds=[];
    document.querySelectorAll(".map-wrap, .swim-wrap, .dtable-wrap, .mtable-wrap, #nav").forEach(function(el){
      function upd(){el.classList.toggle("sx-more",el.scrollWidth-el.clientWidth-el.scrollLeft>8);}
      el.addEventListener("scroll",upd,{passive:true});
      window.addEventListener("resize",upd);
      sxUpds.push(upd);upd();
    });
    /* 접힌 details 안 표는 펼칠 때 폭이 생긴다 · 펼침 시 재계산 */
    document.querySelectorAll("details").forEach(function(d){d.addEventListener("toggle",function(){sxUpds.forEach(function(f){f();});});});
  })();

  /* 개요 로그 전시물 · 뷰포트 진입 시 1회 타이핑 재생 */
  (function(){
    var t=document.getElementById("ovTrace");
    if(!t||reduce||typeof IntersectionObserver==="undefined")return;
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){t.classList.add("play");io.disconnect();}});
    },{threshold:.5});
    io.observe(t);
  })();

  /* 인쇄 시 접힌 details(결정 카드·매트릭스) 펼침 */
  (function(){
    var opened=[];
    window.addEventListener("beforeprint",function(){opened=[];document.querySelectorAll("details:not([open])").forEach(function(d){d.open=true;opened.push(d);});});
    window.addEventListener("afterprint",function(){opened.forEach(function(d){d.open=false;});opened=[];});
  })();

  /* 히어로 진화 타임라인 · 페이즈 hover/focus 툴팁 (스크롤러 밖 공유 요소로 위치, 세로 클리핑 회피) */
  (function(){
    var tip=document.getElementById("evoTip"),evo=document.querySelector(".evo");
    if(!tip||!evo)return;
    var steps=evo.querySelectorAll(".evo-step[data-tip]");if(!steps.length)return;
    function show(step){
      tip.textContent=step.getAttribute("data-tip")||"";tip.hidden=false;
      var host=tip.offsetParent||document.body,hr=host.getBoundingClientRect(),r=step.getBoundingClientRect();
      var left=r.left-hr.left,max=host.clientWidth-tip.offsetWidth-4;
      if(left>max)left=max;if(left<0)left=0;
      tip.style.left=left+"px";tip.style.top=(r.bottom-hr.top+10)+"px";
    }
    function hide(){tip.hidden=true;}
    steps.forEach(function(s){
      s.addEventListener("mouseenter",function(){show(s);});
      s.addEventListener("mouseleave",hide);
      s.addEventListener("focus",function(){show(s);});
      s.addEventListener("blur",hide);
    });
    window.addEventListener("resize",hide);
  })();

  /* ================= THEME · 시스템 → 라이트 → 다크 순환 ================= */
  var themeBtn=document.getElementById("themeBtn"),themeLabel=document.getElementById("themeLabel"),root=document.documentElement;
  var MODES=["system","light","dark"],mode="system";
  try{var savedTheme=localStorage.getItem("pf-theme");if(savedTheme&&MODES.indexOf(savedTheme)>-1)mode=savedTheme;}catch(e){}
  var sysDark=null;try{sysDark=window.matchMedia("(prefers-color-scheme: dark)");}catch(e){}
  function apply(){
    if(mode==="system")root.removeAttribute("data-theme");else root.setAttribute("data-theme",mode);
    var sysNow=sysDark&&sysDark.matches?"다크":"라이트";
    themeLabel.textContent=mode==="system"?("시스템 · "+sysNow):(mode==="light"?"라이트":"다크");
  }
  apply();
  if(sysDark&&sysDark.addEventListener)sysDark.addEventListener("change",function(){if(mode==="system")apply();});
  themeBtn.addEventListener("click",function(){mode=MODES[(MODES.indexOf(mode)+1)%MODES.length];apply();try{localStorage.setItem("pf-theme",mode);}catch(e){}});
