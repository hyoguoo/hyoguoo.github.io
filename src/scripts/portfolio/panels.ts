// @ts-nocheck
// payment-platform 포트폴리오 — 설계결정·경합·PG상태머신·알람·요약 렌더 + 상태머신 탭 (이식된 로직).
import { reduce, esc, escBr, chips, sv, CV } from './util';
import { PG_STATES, PG_NPOS, PG_SEDGES, SCN_MATRIX, DECISIONS, RACES, ALERTS, SOLVES, LIMITS } from '../../data/paymentPortfolio';

  /* ================= §06 DESIGN DECISIONS ================= */
  (function(){
    var dw=document.getElementById("decisions-grid");
    if(!dw)return;
    /* 열 2개를 독립 컨테이너로 — 카드 펼침이 옆 열에 빈 공간을 만들지 않게 */
    var colL=document.createElement("div"),colR=document.createElement("div");
    colL.className="dec-col";colR.className="dec-col";
    var half=Math.ceil(DECISIONS.length/2);
    DECISIONS.forEach(function(d,i){var det=document.createElement("details");det.className="dcard";det.id="dec-"+i;
      det.innerHTML='<summary class="d-top"><span class="d-caret" aria-hidden="true">\u25b8</span><span class="d-t">'+esc(d.t)+'</span><span class="d-tag">'+esc(d.tag)+'</span></summary>'
        +'<div class="d-line ctx"><b>상황</b>'+escBr(d.ctx)+'</div>'
        +'<div class="d-line prob"><b>문제</b>'+escBr(d.why)+'</div>'
        +'<div class="d-line bad"><b>기각된 대안</b>'+escBr(d.alt)+'</div>'
        +'<div class="d-line pick"><b>채택된 방안</b>'+escBr(d.tradeoff)+'</div>';
      (i<half?colL:colR).appendChild(det);});
    dw.appendChild(colL);dw.appendChild(colR);
  })();

  /* ================= §07 RACE WINDOWS ================= */
  (function(){
    var tb=document.querySelector("#races-table tbody");
    if(!tb)return;
    RACES.forEach(function(r,i){var tr=document.createElement("tr");
      var no=(i+1)<10?("0"+(i+1)):(""+(i+1));
      tr.innerHTML='<td class="t-no">'+no+'</td><td class="t-name">'+esc(r.t)+'</td><td>'+esc(r.haz)+'</td><td>'+esc(r.def)+'</td><td><span class="t-mech">'+esc(r.mech)+'</span></td>';
      tb.appendChild(tr);});
  })();

  /* ================= §04b PG STATE MACHINE ================= */
  (function(){
    var mount=document.getElementById("pgSmWrap");if(!mount)return;
    var det=document.getElementById("pgCfDetail"),hint=document.getElementById("pgSmHint");
    var mv=sv("svg",{viewBox:"0 0 840 450",class:"statemachine",role:"group","aria-label":"PgInboxStatus 상태 전이"});
    var defs=sv("defs",{});var m=sv("marker",{id:"pgarw0",markerWidth:"9",markerHeight:"9",refX:"7",refY:"3",orient:"auto",markerUnits:"userSpaceOnUse"});m.appendChild(sv("path",{d:"M0,0 L7,3 L0,6 Z",class:"arrow-s"}));defs.appendChild(m);mv.appendChild(defs);
    var eEls=[];
    PG_SEDGES.forEach(function(e){var p=sv("path",{d:e.d,class:"edge2","marker-end":"url(#pgarw0)"});p.dataset.from=e.from;mv.appendChild(p);
      var l=sv("text",{x:e.lx,y:e.ly,class:"elabel","text-anchor":e.anchor||"middle"});l.textContent=e.label;mv.appendChild(l);
      eEls.push({p:p,l:l,from:e.from,to:e.to});});
    var nEls={};
    Object.keys(PG_NPOS).forEach(function(id){var p=PG_NPOS[id],st=PG_STATES[id],w=124,h=46;var g=sv("g",{class:"snode",tabindex:"0",role:"button","aria-label":id+" 상태"});g.dataset.state=id;
      var r=sv("rect",{x:p.x-w/2,y:p.y-h/2,width:w,height:h,rx:10,class:"node-box2",style:"--nc:var("+CV[st.color]+")"+(st.terminal?";stroke-width:2.2;--tstroke:var("+CV[st.color]+")":"")});
      g.appendChild(r);
      var t=sv("text",{x:p.x,y:p.y+(st.terminal?1:5),"text-anchor":"middle",class:"node-label2"});t.textContent=id;g.appendChild(t);
      if(st.terminal){var tt=sv("text",{x:p.x,y:p.y+15,"text-anchor":"middle",class:"node-term2"});tt.textContent="종결";g.appendChild(tt);}
      g.addEventListener("click",function(){sel(id);});g.addEventListener("keydown",function(ev){if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();sel(id);}});
      mv.appendChild(g);nEls[id]=g;});
    mount.appendChild(mv);
    function sel(id){hint.textContent=id;mv.classList.add("dim");var st=PG_STATES[id];var adj={};st.out.forEach(function(o){adj[o.to]=true;});
      Object.keys(nEls).forEach(function(n){nEls[n].classList.toggle("sel",n===id);nEls[n].classList.toggle("adj",!!adj[n]);});
      eEls.forEach(function(e){var hot=e.from===id;e.p.classList.toggle("hot",hot);e.l.classList.toggle("hot",hot);});
      render(id);}
    function render(id){var st=PG_STATES[id],cv=CV[st.color];var h="";
      h+='<div class="dhead"><span class="state-badge" style="color:var('+cv+');background:color-mix(in srgb,var('+cv+') 13%,transparent)"><span class="sw" style="background:var('+cv+')"></span>'+id+'</span><span class="term-tag">'+(st.terminal?"종결 상태":"진행 상태")+'</span></div>';
      h+='<p style="margin:14px 0 0;color:var(--ink-soft);font-size:14px">'+esc(st.meaning)+'</p>';
      h+='<dl class="kv"><dt>진입</dt><dd>'+chips([st.entry])+'</dd><dt>종결 여부</dt><dd>'+(st.terminal?"예":"아니오")+'</dd></dl>';
      if(st.out.length){h+='<div class="sub-label">후속 상태 전이</div><div class="transitions">';st.out.forEach(function(o){h+='<div class="trans"><span class="arr">'+(o.self?"↻":"──▶")+'</span><span class="to" style="color:var('+CV[PG_STATES[o.to].color]+')">'+o.to+'</span><span class="tl">'+esc(o.label)+'</span></div>';});h+='</div>';}
      else h+='<div class="sub-label">후속 상태 전이</div><p class="branch-note">종결 상태 — 더 이상의 상태 전이 없음.</p>';
      if(id==="QUARANTINED")h+='<div class="mini"><h4>결제 쪽과의 차이</h4><div class="row"><span class="k">PG</span><span>해당 단계에서 처리가 즉각 종결되며, 격리 결과를 결제 서비스로 회신한다.</span></div><div class="row"><span class="k">Payment</span><span>결제 서비스의 QUARANTINED는 종결 상태가 아니며, 관리자가 개입할 때까지 대기한다.</span></div></div>';
      det.innerHTML=h;}
    det.innerHTML='<div class="dhead"><h3 class="big">PG 벤더 처리 상태</h3></div><p style="margin:14px 0 0;color:var(--ink-soft);font-size:14px">명령을 받은 pg-service가 벤더를 호출하며 오가는 5상태. <b>IN_PROGRESS는 self-loop</b>로 attempt를 쌓다 한도(4) 소진 시 QUARANTINED로 자동 격리된다.</p><div class="mini"><h4>핵심 규칙</h4><div class="row"><span class="k">멱등</span><span>중복 승인 명령은 PENDING을 건너뛰고 벤더 재호출 없이 직접 처리 — 이중 승인 차단.</span></div></div>';
  })();
  (function(){
    var bp=document.getElementById("smTabPay"),bg=document.getElementById("smTabPg"),lp=document.getElementById("sm-payment"),lg=document.getElementById("sm-pg");
    if(!bp||!bg||!lp||!lg)return;
    function show(pg){lp.hidden=pg;lg.hidden=!pg;bp.setAttribute("aria-pressed",pg?"false":"true");bg.setAttribute("aria-pressed",pg?"true":"false");}
    bp.addEventListener("click",function(){show(false);});bg.addEventListener("click",function(){show(true);});
  })();

  /* ================= §08 OBSERVABILITY & ALERTING ================= */
  (function(){
    var tb=document.querySelector("#alerts-table tbody");if(!tb)return;
    ALERTS.forEach(function(g){
      g.items.forEach(function(it,k){
        var tr=document.createElement("tr");
        var cells="";
        if(k===0)cells+='<td class="t-group" rowspan="'+g.items.length+'"><span class="gd" style="background:var('+CV[g.color]+')"></span>'+esc(g.label)+'</td>';
        cells+='<td class="t-alert">'+esc(it.a)+'</td><td>'+escBr(it.d)+'</td><td class="t-trg">'+esc(it.m||"")+'</td>';
        tr.innerHTML=cells;tb.appendChild(tr);
      });
    });
  })();

  /* ================= §10 SUMMARY ================= */
  (function(){
    var sg=document.getElementById("solves-grid"),lg=document.getElementById("limits-grid");
    if(sg)SOLVES.forEach(function(s){var c=document.createElement("div");c.className="solve";
      c.innerHTML='<div class="s-t">'+esc(s.t)+'</div><div class="s-d">'+escBr(s.d)+'</div>';sg.appendChild(c);});
    if(lg)LIMITS.forEach(function(l){var c=document.createElement("div");c.className="limit "+l.cls;
      c.innerHTML='<div class="l-h"><span class="l-t">'+esc(l.t)+'</span><span class="l-kind">'+esc(l.kind)+'</span></div><div class="l-d"><b>지금</b>'+escBr(l.what)+'</div><div class="l-d"><b>다음</b>'+escBr(l.why)+'</div>';lg.appendChild(c);});
  })();

  /* ================= UX CHROME (progress · back-to-top) ================= */
  (function(){
    var prog=document.getElementById("progress"),toTop=document.getElementById("toTop");
    function onScroll(){var h=document.documentElement;var sc=h.scrollTop||document.body.scrollTop||0;var max=h.scrollHeight-h.clientHeight;var pct=max>0?(sc/max*100):0;if(prog)prog.style.transform="scaleX("+(pct/100)+")";if(toTop)toTop.classList.toggle("show",sc>600);}
    window.addEventListener("scroll",onScroll,{passive:true});onScroll();
    if(toTop)toTop.addEventListener("click",function(){window.scrollTo({top:0,behavior:reduce?"auto":"smooth"});});
  })();

  /* ================= SCROLL SPY ================= */
  var secs=["arch","journey","scenario","states","pgretry","modules","decisions","races","workflow","alerting","tracing","summary"].map(function(id){return document.getElementById(id);});
  var navmap={};document.querySelectorAll("#navlinks a").forEach(function(a){navmap[a.getAttribute("href").slice(1)]=a;});
  var spy=new IntersectionObserver(function(ents){ents.forEach(function(e){if(e.isIntersecting){
    document.querySelectorAll("#navlinks a").forEach(function(a){a.classList.remove("active");a.removeAttribute("aria-current");});
    var a=navmap[e.target.id];
    if(a){a.classList.add("active");a.setAttribute("aria-current","true");
      var nl=document.getElementById("navlinks");
      if(nl&&nl.scrollWidth>nl.clientWidth+4){nl.scrollTo({left:a.offsetLeft-nl.clientWidth/2+a.offsetWidth/2,behavior:reduce?"auto":"smooth"});}
    }
  }});},{rootMargin:"-45% 0px -50% 0px"});
  secs.forEach(function(s){if(s)spy.observe(s);});

  /* ================= SCENARIO MATRIX ================= */
  (function(){var tb=document.querySelector("#scn-matrix tbody");if(!tb)return;
    var LB={done:"DONE",failed:"FAILED",quar:"QUARANTINED",expired:"EXPIRED"};
    SCN_MATRIX.forEach(function(r){var tr=document.createElement("tr");
      tr.innerHTML='<td class="m-name">'+esc(r[0])+'</td><td><span class="m-st" style="color:var('+CV[r[1]]+');background:color-mix(in srgb,var('+CV[r[1]]+') 13%,transparent)">'+esc(LB[r[1]])+'</span></td><td>'+esc(r[2])+'</td><td>'+esc(r[3])+'</td><td style="font-family:var(--mono);font-size:11px;color:var(--muted)">'+esc(r[4])+'</td>';
      tb.appendChild(tr);});
  })();
