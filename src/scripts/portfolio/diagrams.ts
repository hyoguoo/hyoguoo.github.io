// @ts-nocheck
// payment-platform 포트폴리오 · 아키텍처맵·스윔레인·PG플로우·트레이스·단계카드·상태머신·헥사 (이식된 로직).
import { reduce, esc, chips, sv, CV } from './util';
import { ARCH_NODES, ARCH_EDGES, PAYMENT, STATES, NPOS, SEDGES, LAYER_EX, LAYER_META, FLOW_LANES, FLOW_STEPS } from '../../data/paymentPortfolio';

  /* ---------- 히어로 로그 스트림 · 무한 루프용 블록 복제 ---------- */
  (function(){
    var b=document.querySelector(".logstream .ls-block");
    if(b&&b.parentNode)b.parentNode.appendChild(b.cloneNode(true));
  })();

  /* ================= DATA ================= */




  /* ================= §01 ARCH MAP ================= */
  var archWrap=document.getElementById("archWrap"),archDetail=document.getElementById("archDetail"),archHint=document.getElementById("archHint");
  var amap=sv("svg",{viewBox:"0 0 780 370",class:"archmap",role:"group","aria-label":"시스템 아키텍처 맵"});
  var adefs=sv("defs",{});var am=sv("marker",{id:"aarw",markerWidth:"8",markerHeight:"8",refX:"6.5",refY:"3",orient:"auto",markerUnits:"userSpaceOnUse"});am.appendChild(sv("path",{d:"M0,0 L6.5,3 L0,6 Z",class:"arrow-a"}));adefs.appendChild(am);amap.appendChild(adefs);
  var aEdgeEls=[];
  var albl=sv("g",{}); /* 라벨 레이어 · 노드보다 나중에 붙여 가려지지 않게 */
  ARCH_EDGES.forEach(function(e){
    var p=sv("path",{d:e.d,class:"aedge"+(e.dash?" dash":"")+(e.bus?" bus":""),"marker-end":e.dash?"":"url(#aarw)"});p.dataset.f=e.f;p.dataset.t=e.t;amap.appendChild(p);
    var lbl=null;if(e.lab){lbl=sv("text",{x:e.lx,y:e.ly,class:"aedge-label","text-anchor":e.anchor||"middle"});lbl.textContent=e.lab;lbl.dataset.f=e.f;lbl.dataset.t=e.t;albl.appendChild(lbl);}
    aEdgeEls.push({p:p,lbl:lbl,f:e.f,t:e.t});
  });
  var aNodeEls={};
  Object.keys(ARCH_NODES).forEach(function(id){
    var n=ARCH_NODES[id];var g=sv("g",{class:"anode",tabindex:"0",role:"button","aria-label":n.t});g.dataset.id=id;
    g.appendChild(sv("rect",{x:n.x,y:n.y,width:n.w,height:n.h,rx:9,class:"abox",style:"--nc:var("+CV[n.color]+")"}));
    var t=sv("text",{x:n.x+16,y:n.y+(n.s?n.h/2-2:n.h/2+4),class:"a-t"});t.textContent=n.t;g.appendChild(t);
    if(n.s){var s=sv("text",{x:n.x+16,y:n.y+n.h/2+12,class:"a-s"});s.textContent=n.s;g.appendChild(s);}
    g.addEventListener("click",function(){selArch(id);});
    g.addEventListener("keydown",function(ev){if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();selArch(id);}});
    amap.appendChild(g);aNodeEls[id]=g;
  });
  amap.appendChild(albl);
  archWrap.appendChild(amap);
  function selArch(id){
    archHint.textContent=ARCH_NODES[id].t;amap.classList.add("dim");
    var adj={};aEdgeEls.forEach(function(e){if(e.f===id)adj[e.t]=true;if(e.t===id)adj[e.f]=true;});
    Object.keys(aNodeEls).forEach(function(nid){aNodeEls[nid].classList.toggle("sel",nid===id);aNodeEls[nid].classList.toggle("adj",!!adj[nid]);});
    aEdgeEls.forEach(function(e){var hot=e.f===id||e.t===id;e.p.classList.toggle("hot",hot);if(e.lbl)e.lbl.classList.toggle("hot",hot);});
    var n=ARCH_NODES[id];
    archDetail.innerHTML='<div class="dhead"><span class="svc-dot" style="background:var('+CV[n.color]+')"></span><h3 class="big">'+esc(n.t)+'</h3><span class="term-tag">'+esc(n.s)+'</span></div>'+
      '<p style="margin:14px 0 0;color:var(--ink-soft);font-size:14px">'+esc(n.role)+'</p>'+
      '<dl class="kv"><dt>저장소</dt><dd>'+esc(n.store)+'</dd><dt>채널</dt><dd>'+esc(n.chan)+'</dd></dl>';
  }
  archDetail.innerHTML='<div class="dhead"><h3 class="big">시스템 아키텍처</h3></div><p style="margin:14px 0 0;color:var(--ink-soft);font-size:14px">노드를 클릭하면 그 서비스의 역할·저장소·채널이 여기에 표시된다.</p><dl class="kv"><dt>불변식</dt><dd>모듈 간 코드 의존 0 · 통신은 HTTP 또는 Kafka.</dd><dt>토픽</dt><dd><code>commands.confirm</code> · <code>events.confirmed</code> · <code>stock-committed</code> (+2 DLQ)</dd></dl>';

  /* ================= §02 JOURNEY · swimlane (22스텝 한눈에) ================= */
  (function(){
    var mount=document.getElementById("swimWrap");if(!mount)return;
    var W=1000,rowH=30,y=58;
    var laneX={};FLOW_LANES.forEach(function(l){laneX[l.id]=l.x;});
    var bands=[],rows=[],num=0,curBand=null;
    FLOW_STEPS.forEach(function(s){
      if(s.st){if(curBand)curBand.y2=y+2;y+=10;curBand={t:s.st,y1:y};bands.push(curBand);y+=30;}
      if(s.cut){rows.push({cut:1,y:y+4});y+=rowH-4;return;}
      num++;rows.push({n:num,s:s,y:y});y+=rowH;
    });
    if(curBand)curBand.y2=y+2;
    var H=y+12;
    var svg=sv("svg",{viewBox:"0 0 "+W+" "+H,class:"swimlane",role:"img","aria-label":"결제 정상 경로 22스텝 스윔레인"});
    var defs=sv("defs",{});var mk=sv("marker",{id:"swarw",markerWidth:"8",markerHeight:"8",refX:"6.5",refY:"3",orient:"auto",markerUnits:"userSpaceOnUse"});mk.appendChild(sv("path",{d:"M0,0 L6.5,3 L0,6 Z",class:"sw-arh"}));defs.appendChild(mk);svg.appendChild(defs);
    bands.forEach(function(b,i){
      if(i%2===1)svg.appendChild(sv("rect",{x:6,y:b.y1-4,width:W-12,height:b.y2-b.y1,rx:10,class:"sw-band"}));
      var bt=sv("text",{x:14,y:b.y1+10,class:"sw-stage-t"});bt.textContent=b.t;svg.appendChild(bt);
    });
    FLOW_LANES.forEach(function(l){svg.appendChild(sv("line",{x1:l.x,y1:42,x2:l.x,y2:H-8,class:"sw-life"}));});
    FLOW_LANES.forEach(function(l){
      svg.appendChild(sv("rect",{x:l.x-l.w/2,y:8,width:l.w,height:26,rx:8,class:"sw-lane-h"}));
      var lt=sv("text",{x:l.x,y:25,class:"sw-lane-t","text-anchor":"middle"});lt.textContent=l.t;svg.appendChild(lt);
    });
    rows.forEach(function(r){
      if(r.cut){
        svg.appendChild(sv("line",{x1:8,y1:r.y,x2:W-8,y2:r.y,class:"sw-cut"}));
        var ct=sv("text",{x:W-14,y:r.y-6,class:"sw-cut-t","text-anchor":"end"});ct.textContent="202 반환 · 여기부터 사용자 응답과 무관한 비동기";svg.appendChild(ct);
        return;
      }
      var s=r.s,fx=laneX[s.f];
      if(s.t){
        var tx=laneX[s.t],dir=tx>fx?1:-1;
        svg.appendChild(sv("line",{x1:fx,y1:r.y,x2:tx-8*dir,y2:r.y,class:"sw-arrow","marker-end":"url(#swarw)"}));
        var lb=sv("text",{x:(fx+tx)/2,y:r.y-7,class:"sw-lab","text-anchor":"middle"});lb.textContent=s.lab;svg.appendChild(lb);
      }else{
        var lb2=sv("text",{x:fx+15,y:r.y+3,class:"sw-lab self"});lb2.textContent=s.lab;svg.appendChild(lb2);
      }
      svg.appendChild(sv("circle",{cx:fx,cy:r.y,r:8.5,class:"sw-num"}));
      var nt=sv("text",{x:fx,y:r.y+3,class:"sw-num-t","text-anchor":"middle"});nt.textContent=r.n;svg.appendChild(nt);
    });
    mount.appendChild(svg);
  })();

  /* ================= §05 PG PIPELINE flowchart ================= */
  (function(){
    var mount=document.getElementById("pgFlow");if(!mount)return;
    var svg=sv("svg",{viewBox:"0 0 880 710",class:"pgflow",role:"img","aria-label":"PG 명령 처리와 재시도 파이프라인"});
    var defs=sv("defs",{});
    [["pf0","var(--muted)"],["pfok","var(--st-done)"],["pfretry","var(--st-quar)"],["pffail","var(--st-failed)"]].forEach(function(m){
      var mk=sv("marker",{id:m[0],markerWidth:"8",markerHeight:"8",refX:"6.5",refY:"3",orient:"auto",markerUnits:"userSpaceOnUse"});
      mk.appendChild(sv("path",{d:"M0,0 L6.5,3 L0,6 Z",style:"fill:"+m[1]}));defs.appendChild(mk);
    });
    svg.appendChild(defs);
    var BANDS=[
      {x:44,y:16,w:332,h:238,k:"pg",t:"① consumer 스레드 · 큐에 넣고 즉시 반환"},
      {x:44,y:336,w:332,h:154,k:"wk",t:"② 가상 스레드 워커 · 큐에서 꺼내 처리"}
    ];
    BANDS.forEach(function(b){
      svg.appendChild(sv("rect",{x:b.x,y:b.y,width:b.w,height:b.h,rx:12,class:"pf-band pf-band-"+b.k}));
      var bt=sv("text",{x:b.x+14,y:b.y+18,class:"pf-band-t"});bt.textContent=b.t;svg.appendChild(bt);
    });
    var NODES=[
      {id:"recv",x:160,y:40,w:200,t:"명령 수신",s:"Kafka consumer",c:"--svc-pg"},
      {id:"dedupe",x:160,y:120,w:200,t:"멱등 키 기록",s:"SETNX · 없으면 기록·있으면 차단",c:"--svc-pg"},
      {id:"inbox",x:160,y:200,w:200,t:"inbox 저장 · PENDING",s:"주문당 1행 (UNIQUE)",c:"--svc-pg"},
      {id:"queue",x:160,y:280,w:200,t:"인메모리 큐 · 채널",s:"offer 반환 · 워커 take",c:"--accent",q:true},
      {id:"claim",x:160,y:360,w:200,t:"행 선점 · IN_PROGRESS",s:"행 잠금 (SKIP LOCKED)",c:"--svc-pg"},
      {id:"call",x:160,y:440,w:200,t:"PG사 호출",s:"Toss / NicePay",c:"--svc-pg"},
      {id:"record",x:60,y:544,w:200,t:"결과 기록",s:"APPROVED / FAILED · outbox 적재",c:"--st-done"},
      {id:"publish",x:60,y:636,w:200,t:"결과 발행 → payment",s:"events.confirmed",c:"--st-done"},
      {id:"inc",x:556,y:544,w:200,t:"시도 횟수 +1",s:"DB(pg_inbox.attempt)에서 관리",c:"--st-quar"},
      {id:"exhaust",x:540,y:636,w:232,t:"DLQ 이동 + 격리",s:"commands.confirm.dlq · QUARANTINED",c:"--st-failed"},
      {id:"redisdel",x:456,y:200,w:190,t:"멱등 키 삭제",s:"remove → 재배달 재처리",c:"--st-failed"}
    ];
    var EDGES=[
      {d:"M260,86 L260,120",k:"0"},
      {d:"M260,166 L260,200",k:"0"},
      {d:"M260,246 L260,280",k:"0",lab:"consumer offer",lx:272,ly:268,anchor:"start"},
      {d:"M260,326 L260,360",k:"0",lab:"워커 take",lx:272,ly:348,anchor:"start"},
      {d:"M260,406 L260,440",k:"0"},
      {d:"M232,486 Q170,512 162,542",k:"ok",lab:"승인 · 확정 거절",lx:126,ly:516},
      {d:"M330,484 Q510,508 640,542",k:"retry",lab:"일시 오류 (5xx·타임아웃)",lx:470,ly:490},
      {d:"M160,590 L160,636",k:"ok"},
      {d:"M656,590 L656,634",k:"fail",lab:"4회 도달",lx:668,ly:616,anchor:"start"},
      {d:"M758,556 C866,460 866,80 364,58",k:"retry",dash:1,lab:"4회 미만 · 같은 토픽으로 재발행 (간격 늘림)",lx:702,ly:140},
      {d:"M360,224 L456,224",k:"fail",lab:"저장 실패",lx:408,ly:214}
    ];
    EDGES.forEach(function(e){
      var cls="pf-edge"+(e.k!=="0"?" pk-"+e.k:"")+(e.dash?" dash":"");
      svg.appendChild(sv("path",{d:e.d,class:cls,"marker-end":"url(#pf"+(e.k==="0"?"0":e.k)+")"}));
      if(e.lab){var t=sv("text",{x:e.lx,y:e.ly,class:"sw-lab"+(e.k!=="0"?" pl-"+e.k:""),"text-anchor":e.anchor||"middle"});t.textContent=e.lab;svg.appendChild(t);}
    });
    NODES.forEach(function(n){
      if(n.q){
        // 인메모리 큐 · 채널: 항목이 줄 서 대기하는 버퍼로 보이도록 슬롯 칸막이 박스로 렌더
        svg.appendChild(sv("rect",{x:n.x,y:n.y,width:n.w,height:46,rx:4,class:"pf-box pf-queue",style:"--nc:var("+n.c+")"}));
        for(var qi=1;qi<6;qi++){var qx=n.x+n.w*qi/6;svg.appendChild(sv("line",{x1:qx,y1:n.y+1,x2:qx,y2:n.y+13,class:"pf-qslot"}));svg.appendChild(sv("line",{x1:qx,y1:n.y+33,x2:qx,y2:n.y+45,class:"pf-qslot"}));}
      }else{
        svg.appendChild(sv("rect",{x:n.x,y:n.y,width:n.w,height:46,rx:10,class:"pf-box",style:"--nc:var("+n.c+")"}));
      }
      var t=sv("text",{x:n.x+n.w/2,y:n.y+19,"text-anchor":"middle",class:"pf-t"});t.textContent=n.t;svg.appendChild(t);
      var s=sv("text",{x:n.x+n.w/2,y:n.y+34,"text-anchor":"middle",class:"pf-s"});s.textContent=n.s;svg.appendChild(s);
    });
    var dn=sv("text",{x:375,y:122,class:"sw-lab self"});dn.textContent="이미 처리한 메시지면 여기서 종료";svg.appendChild(dn);
    mount.appendChild(svg);
  })();

  /* ================= §11 TRACE FLOW · 하나의 traceId, 3번 이어붙임 ================= */
  (function(){
    var mount=document.getElementById("traceFlow");if(!mount)return;
    var yL=120;
    var svg=sv("svg",{viewBox:"0 0 840 184",class:"traceflow",role:"img","aria-label":"하나의 traceId가 끊길 수 있는 3곳을 넘어 이어지는 과정"});
    var idt=sv("text",{x:32,y:34,class:"tf-id"});idt.textContent="traceId 4f9a…c2";svg.appendChild(idt);
    var ids=sv("text",{x:32,y:52,class:"tf-idsub"});ids.textContent="한 요청 = 하나의 id";svg.appendChild(ids);
    svg.appendChild(sv("line",{x1:42,y1:yL,x2:800,y2:yL,class:"tf-thread"}));
    var NODES=[
      {x:104,t:"payment",s:"확정 · outbox"},
      {x:322,t:"pg",s:"inbox 저장"},
      {x:540,t:"pg",s:"워커 · PG 호출"},
      {x:748,t:"product",s:"재고 확정"}
    ];
    var GAP=[
      {x:213,n:"①",brk:"프로세스 경계",fix:"traceparent 헤더"},
      {x:431,n:"②",brk:"비동기 아웃박스",fix:"저장 → 복원"},
      {x:644,n:"③",brk:"스레드 스위칭",fix:"스냅샷 복원"}
    ];
    var nW=118;
    NODES.forEach(function(n){
      svg.appendChild(sv("rect",{x:n.x-nW/2,y:yL-17,width:nW,height:34,rx:8,class:"tf-node"}));
      var t=sv("text",{x:n.x,y:yL-2,"text-anchor":"middle",class:"tf-node-t"});t.textContent=n.t;svg.appendChild(t);
      var s=sv("text",{x:n.x,y:yL+12,"text-anchor":"middle",class:"tf-node-s"});s.textContent=n.s;svg.appendChild(s);
    });
    GAP.forEach(function(g){
      svg.appendChild(sv("line",{x1:g.x,y1:yL-46,x2:g.x,y2:yL-24,class:"tf-cut"}));
      var bt=sv("text",{x:g.x,y:yL-52,"text-anchor":"middle",class:"tf-cut-t"});bt.textContent=g.brk;svg.appendChild(bt);
      svg.appendChild(sv("circle",{cx:g.x,cy:yL,r:12,class:"tf-stitch"}));
      var sn=sv("text",{x:g.x,y:yL+4,"text-anchor":"middle",class:"tf-stitch-n"});sn.textContent=g.n;svg.appendChild(sn);
      var ft=sv("text",{x:g.x,y:yL+42,"text-anchor":"middle",class:"tf-fix-t"});ft.textContent=g.fix;svg.appendChild(ft);
    });
    mount.appendChild(svg);
  })();

  /* ================= §02 JOURNEY · stage cards ================= */
  var stagesWrap=document.getElementById("stages");
  PAYMENT.forEach(function(s,i){
    var card=document.createElement("details");card.className="pstage";card.id="ps-"+i;
    var h='<summary class="ps-top"><span class="ps-num">'+s.no+'</span><span class="ps-title">'+esc(s.title)+'</span><span class="ps-actor">'+esc(s.actor)+'</span><span class="ps-more" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 4.5 L6 8 L9.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></summary>';
    h+='<p class="ps-sub">'+esc(s.purpose)+'<span class="ps-inv">핵심 · '+esc(s.invariant)+'</span></p>';
    h+='<div class="sub-label">진행</div><ol class="steps">';
    s.steps.forEach(function(st){h+='<li><span>'+esc(st.t)+(st.c&&st.c.length?'<span class="codes">'+chips(st.c)+'</span>':'')+'</span></li>';});
    h+='</ol>';
    if(s.branches&&s.branches.length){h+='<div class="sub-label">분기 · 예외</div><div class="branches">';
      s.branches.forEach(function(b2){h+='<div class="branch '+b2.type+'"><span class="btag">'+esc(b2.tag)+'</span>'+esc(b2.text)+(b2.code?' <code>'+esc(b2.code)+'</code>':'')+'</div>';});
      h+='</div>';}
    card.innerHTML=h;stagesWrap.appendChild(card);
  });

  /* ================= §03 STATE MACHINE ================= */
  var smWrap=document.getElementById("smWrap"),cfDetail=document.getElementById("cfDetail"),smHint=document.getElementById("smHint");
  var smv=sv("svg",{viewBox:"0 0 840 500",class:"statemachine",role:"group","aria-label":"PaymentEventStatus 상태 전이"});
  var sdefs=sv("defs",{});["","recover"].forEach(function(k){var m=sv("marker",{id:"sarw"+(k||"0"),markerWidth:"9",markerHeight:"9",refX:"7",refY:"3",orient:"auto",markerUnits:"userSpaceOnUse"});var p=sv("path",{d:"M0,0 L7,3 L0,6 Z",class:"arrow-s"});if(k)p.setAttribute("style","fill:var(--st-quar)");m.appendChild(p);sdefs.appendChild(m);});smv.appendChild(sdefs);
  var sEdgeEls=[];
  SEDGES.forEach(function(e){var p=sv("path",{d:e.d,class:"edge2"+(e.recover?" recover":""),"marker-end":"url(#sarw"+(e.recover?"recover":"0")+")"});p.dataset.from=e.from;smv.appendChild(p);
    var l=sv("text",{x:e.lx,y:e.ly,class:"elabel"+(e.recover?" recover":""),"text-anchor":e.anchor||"middle"});l.textContent=e.label;l.dataset.from=e.from;smv.appendChild(l);
    sEdgeEls.push({p:p,l:l,from:e.from});});
  var sNodeEls={};
  Object.keys(NPOS).forEach(function(id){var p=NPOS[id],st=STATES[id],w=124,h=46;var g=sv("g",{class:"snode",tabindex:"0",role:"button","aria-label":id+" 상태"});g.dataset.state=id;
    var r=sv("rect",{x:p.x-w/2,y:p.y-h/2,width:w,height:h,rx:10,class:"node-box2",style:"--nc:var("+CV[st.color]+")"+(st.terminal?";stroke-width:2.2;--tstroke:var("+CV[st.color]+")":"")});
    g.appendChild(r);
    var t=sv("text",{x:p.x,y:p.y+(st.terminal?1:5),"text-anchor":"middle",class:"node-label2"});t.textContent=id;g.appendChild(t);
    if(st.terminal){var tt=sv("text",{x:p.x,y:p.y+15,"text-anchor":"middle",class:"node-term2"});tt.textContent="종결";g.appendChild(tt);}
    g.addEventListener("click",function(){selState(id);});g.addEventListener("keydown",function(ev){if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();selState(id);}});
    smv.appendChild(g);sNodeEls[id]=g;});
  smWrap.appendChild(smv);
  function selState(id){smHint.textContent=id;smv.classList.add("dim");var st=STATES[id];var adj={};st.out.forEach(function(o){adj[o.to]=true;});
    Object.keys(sNodeEls).forEach(function(n){sNodeEls[n].classList.toggle("sel",n===id);sNodeEls[n].classList.toggle("adj",!!adj[n]);});
    sEdgeEls.forEach(function(e){var hot=e.from===id;e.p.classList.toggle("hot",hot);e.l.classList.toggle("hot",hot);});
    renderState(id);}
  function renderState(id){var st=STATES[id],cvar=CV[st.color];var h='';
    h+='<div class="dhead"><span class="state-badge" style="color:var('+cvar+');background:color-mix(in srgb,var('+cvar+') 13%,transparent)"><span class="sw" style="background:var('+cvar+')"></span>'+id+'</span><span class="term-tag">'+(st.terminal?"종결 상태":"진행 상태")+'</span></div>';
    h+='<p style="margin:14px 0 0;color:var(--ink-soft);font-size:14px">'+esc(st.meaning)+'</p>';
    h+='<dl class="kv"><dt>진입</dt><dd>'+chips(st.entry.split(" · "))+'</dd><dt>종결 여부</dt><dd>'+(st.terminal?"예 (폴링 종료)":"아니오 (폴링 계속)")+'</dd><dt>폴링 응답</dt><dd><code>'+esc(st.polling)+'</code></dd></dl>';
    if(st.out.length){h+='<div class="sub-label">후속 상태 전이</div><div class="transitions">';st.out.forEach(function(o){h+='<div class="trans"><span class="arr">──▶</span><span class="to" style="color:var('+CV[STATES[o.to].color]+')">'+o.to+'</span><span class="tl">'+esc(o.label)+(o.recover?' · 신규':'')+'</span></div>';});h+='</div>';}
    else h+='<div class="sub-label">후속 상태 전이</div><p class="branch-note">종결 상태 · 더 이상의 상태 전이 없음.</p>';
    if(id==="QUARANTINED")h+='<div class="mini"><h4>재고 보상 · 격리 안전 종결</h4><div class="row"><span class="k">키 조건</span><span>decrement:done 키가 있을 때만 재고 보상 · 유령 재고 방지.</span></div><div class="row"><span class="k">조건부 갱신</span><span>현재 상태가 QUARANTINED일 때만 FAILED로 갱신 · order 동조, 지연 회신과의 복구 경합 차단.</span></div><div class="row"><span class="k">DLQ</span><span>events.confirmed.dlq 적체분은 원 토픽 재주입으로 EOS 재처리.</span></div></div>';
    else if(id==="DONE")h+='<div class="mini"><h4>재고 확정 · 승인</h4><div class="row"><span class="k">확정</span><span>stock-committed 발행 · 결정적 키로 product가 멱등 흡수, 차감 1회.</span></div><div class="row"><span class="k">재발행</span><span>RDB DONE 후 브로커 커밋 유실 시 종결 가드가 재발행 복구.</span></div></div>';
    cfDetail.innerHTML=h;}
  cfDetail.innerHTML='<div class="dhead"><h3 class="big">상태 머신 읽는 법</h3></div><p style="margin:14px 0 0;color:var(--ink-soft);font-size:14px">노드를 클릭하면 의미·진입 메서드·폴링 응답·후속 상태 전이가 표시된다.</p><div class="mini"><h4>핵심 규칙</h4><div class="row"><span class="k">종결</span><span>DONE·FAILED·EXPIRED에 도달하면 폴링 종료.</span></div><div class="row"><span class="k">예외</span><span>QUARANTINED는 종결이 아니라 관리자 개입 대기 · 폴링은 PROCESSING에서 멈춘다.</span></div></div>';

  /* ================= §05 MODULES (통합 뷰) ================= */
  (function(){
    var hexlayers=document.getElementById("hexlayers"),layerCards=document.getElementById("layerCards");
    if(!hexlayers||!layerCards)return;
    /* 헥사고날 다이어그램 · 공통 골격 1회 */
    var svg=sv("svg",{viewBox:"0 0 340 300",role:"img","aria-label":"헥사고날 레이어"});
    var rings=[{k:"infrastructure",x:20,y:18,w:300,h:264,label:"infrastructure · presentation",sub:"adapters"},
               {k:"application",x:66,y:70,w:208,h:160,label:"application",sub:"use case · ports"},
               {k:"domain",x:118,y:118,w:104,h:64,label:"domain",sub:"pure"}];
    var RING_TO_CARDS={infrastructure:["infrastructure","presentation"],application:["application"],domain:["domain"]};
    var hexHint=document.getElementById("hexHint");
    function pickLayer(k,label){
      if(hexHint&&label)hexHint.textContent=label;
      var targets=RING_TO_CARDS[k]||[];var first=null;
      layerCards.querySelectorAll(".lcard").forEach(function(c){
        var on=targets.indexOf(c.dataset.k)>=0;c.classList.toggle("hl",on);
        if(on&&!first)first=c;});
      if(first&&first.scrollIntoView)first.scrollIntoView({block:"nearest",behavior:reduce?"auto":"smooth"});
    }
    rings.forEach(function(r){
      var ring=CV[r.k==="infrastructure"?"infra":r.k==="application"?"payment":"product"];
      var box=sv("rect",{x:r.x,y:r.y,width:r.w,height:r.h,rx:14,class:"hlayer-box",tabindex:"0",role:"button","aria-label":r.label+" 레이어 설명 보기"});
      box.setAttribute("fill","color-mix(in srgb,var("+ring+") 8%,var(--surface))");
      box.setAttribute("stroke","var("+ring+")");box.setAttribute("stroke-width","1.4");box.setAttribute("opacity","0.9");
      box.addEventListener("click",function(ev){ev.stopPropagation();pickLayer(r.k,r.label);});
      box.addEventListener("keydown",function(ev){if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();pickLayer(r.k,r.label);}});
      svg.appendChild(box);
      var t=sv("text",{x:r.x+r.w/2,y:r.y+(r.k==="domain"?r.h/2:16),"text-anchor":"middle",class:"hlayer-t","font-size":"12"});t.textContent=r.label;svg.appendChild(t);
      if(r.k!=="domain"){var s=sv("text",{x:r.x+r.w/2,y:r.y+29,"text-anchor":"middle",class:"hlayer-s","font-size":"10.5"});s.textContent=r.sub;svg.appendChild(s);}
      else{var s2=sv("text",{x:r.x+r.w/2,y:r.y+r.h/2+14,"text-anchor":"middle",class:"hlayer-s","font-size":"10.5"});s2.textContent=r.sub;svg.appendChild(s2);}
    });
    [[170,70,170,110],[170,232,170,182]].forEach(function(a){var p=sv("path",{d:"M"+a[0]+","+a[1]+" L"+a[2]+","+a[3],stroke:"var(--faint)","stroke-width":"1.3","marker-end":"url(#hin)",fill:"none"});svg.appendChild(p);});
    var d=sv("defs",{});var m=sv("marker",{id:"hin",markerWidth:"8",markerHeight:"8",refX:"6",refY:"3",orient:"auto",markerUnits:"userSpaceOnUse"});m.appendChild(sv("path",{d:"M0,0 L6,3 L0,6 Z",fill:"var(--faint)"}));d.appendChild(m);svg.insertBefore(d,svg.firstChild);
    hexlayers.appendChild(svg);
    /* 레이어 카드 · 공통 설명 + 대표 구성(payment 기준 예시) */
    var h="";
    LAYER_META.forEach(function(lm){
      var ring=CV[lm.k==="infrastructure"||lm.k==="presentation"||lm.k==="core"?"infra":lm.k==="application"?"payment":"product"];
      var ex=LAYER_EX[lm.k]||[];
      h+='<div class="lcard" data-k="'+lm.k+'"><div class="lc-head"><span class="lc-ring" style="background:var('+ring+')"></span><span class="lc-name">'+lm.name+'</span><span class="lc-dep">'+esc(lm.dep)+'</span></div><div class="lc-body"><p class="lc-desc">'+esc(lm.desc)+'</p><div class="pkgs">';
      ex.forEach(function(p){h+='<span class="pkg">'+esc(p)+'</span>';});
      h+='</div></div></div>';
    });
    h+='<p style="margin:4px 2px 0;font-size:11.5px;color:var(--faint)">구성 예시는 payment-service 기준 · 나머지 서비스도 같은 골격이다.</p>';
    layerCards.innerHTML=h;
  })();
