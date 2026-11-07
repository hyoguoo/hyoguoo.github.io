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
  archDetail.innerHTML='<div class="dhead"><h3 class="big">시스템 아키텍처</h3></div><p style="margin:14px 0 0;color:var(--ink-soft);font-size:14px">노드를 클릭하면 그 서비스의 역할·저장소·채널이 이곳에 표시</p><dl class="kv"><dt>불변식</dt><dd>모듈 간 코드 의존 0 · 통신은 HTTP 또는 Kafka.</dd><dt>토픽</dt><dd><code>commands.confirm</code> · <code>events.confirmed</code> · <code>stock-committed</code> (+2 DLQ)</dd></dl>';

  /* ================= §02 JOURNEY · swimlane (22스텝 한눈에) ================= */
  (function(){
    var mount=document.getElementById("swimWrap");if(!mount)return;
    var W=1000,rowH=30,y=58;
    var laneX={};FLOW_LANES.forEach(function(l){laneX[l.id]=l.x;});
    var bands=[],rows=[],num=0,curBand=null;
    FLOW_STEPS.forEach(function(s){
      if(s.st){if(curBand)curBand.y2=y+2;y+=10;curBand={t:s.st,y1:y,stageNo:bands.length+1};bands.push(curBand);y+=30;}
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
      
      // Invisible hit area covering the entire stage
      svg.appendChild(sv("rect",{x:0,y:b.y1-4,width:W,height:b.y2-b.y1,fill:"transparent",class:"sw-stage-hit","data-stage":b.stageNo}));
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
      var sg=sv("g",{class:"sw-step-grp","data-n":r.n});
      if(s.t){
        var tx=laneX[s.t],dir=tx>fx?1:-1;
        sg.appendChild(sv("line",{x1:fx,y1:r.y,x2:tx-8*dir,y2:r.y,class:"sw-arrow","marker-end":"url(#swarw)"}));
        var lb=sv("text",{x:(fx+tx)/2,y:r.y-7,class:"sw-lab","text-anchor":"middle"});lb.textContent=s.lab;sg.appendChild(lb);
      }else{
        var lb2=sv("text",{x:fx+15,y:r.y+3,class:"sw-lab self"});lb2.textContent=s.lab;sg.appendChild(lb2);
      }
      sg.appendChild(sv("circle",{cx:fx,cy:r.y,r:8.5,class:"sw-num"}));
      var nt=sv("text",{x:fx,y:r.y+3,class:"sw-num-t","text-anchor":"middle"});nt.textContent=r.n;sg.appendChild(nt);
      svg.appendChild(sg);
    });
    mount.appendChild(svg);
  })();

  /* ================= §05 PG PIPELINE flowchart =================
     기본은 간단히 보기다. "상세 보기"를 누르면 같은 칸이 자리를 옮기고, outbox 단계·폴링 안전망·트랜잭션 경계가 차례로 나타난다.
     요소마다 간단(b)·상세(c) 좌표를 두고 전환 때 그 사이를 보간한다. b가 null이면 상세에서만 보이고, c가 없으면 두 모드 좌표가 같다. */
  (function(){
    var mount=document.getElementById("pgFlow");if(!mount)return;
    var toggle=document.getElementById("pgFlowToggle"),legendFb=document.getElementById("pgFlowLegendFb");
    var H={b:586,c:1200};
    var LABEL={
      b:"결제 승인 명령 처리 흐름: payment-service가 보낸 명령을 pg-service가 inbox에 기록하고 워커가 PG사를 호출해 결과를 돌려보내는 과정",
      c:"결제 승인 명령 처리 흐름 상세: 트랜잭션 경계, inbox 워커와 outbox 워커, DB 폴링 안전망을 포함한 과정"
    };
    var svg=sv("svg",{viewBox:"0 0 880 "+H.b,class:"pgflow",role:"img","aria-label":LABEL.b});
    var defs=sv("defs",{});
    [["pf0","var(--muted)"],["pfok","var(--st-done)"],["pfretry","var(--st-quar)"],["pffail","var(--st-failed)"],["pffb","var(--faint)"]].forEach(function(m){
      var mk=sv("marker",{id:m[0],markerWidth:"8",markerHeight:"8",refX:"6.5",refY:"3",orient:"auto",markerUnits:"userSpaceOnUse"});
      mk.appendChild(sv("path",{d:"M0,0 L6.5,3 L0,6 Z",style:"fill:"+m[1]}));defs.appendChild(mk);
    });
    svg.appendChild(defs);
    var gBg=sv("g",{}),gEdge=sv("g",{}),gNode=sv("g",{});
    svg.appendChild(gBg);svg.appendChild(gEdge);svg.appendChild(gNode);

    // 서버 구간 · Kafka 띠 · 스레드 구역. 띠를 넘는 화살표가 곧 서버 간 메시지다.
    var RECTS=[
      {k:"zone",z:"pay",t:"payment-service",b:[16,10,848,88],c:[16,10,848,96]},
      {k:"kafka",b:[16,104,848,36],c:[16,114,848,40]},
      {k:"zone",z:"pg",t:"pg-service",b:[16,148,848,274],c:[16,162,848,854]},
      {k:"band",t:"① consumer 스레드",b:null,c:[44,184,332,238]},
      {k:"band",t:"② inbox 워커 · 가상 스레드",b:null,c:[44,498,792,334]},
      {k:"tx",t:"TX_B · 한 트랜잭션",b:null,c:[52,682,776,138]},
      {k:"band",t:"③ outbox 워커 · 가상 스레드",b:null,c:[44,912,792,92]},
      {k:"kafka",b:[16,430,848,64],c:[16,1024,848,76]},
      {k:"zone",z:"pay",t:"payment-service",b:[16,502,848,76],c:[16,1108,848,84]}
    ];
    // 간략 그림에도 있는 칸은 b·c 좌표 사이를 이동하며 문구가 바뀐다(t,s → tc,sc). b:null 칸은 상세에서만 튀어나온다.
    // 상세 전용 칸은 이 배열 순서대로 나타난다.
    var NODES=[
      {b:[160,40,200],c:[40,44,220],t:"결제 승인 요청",s:"outbox 기록 후 비동기 발행",tc:"결제 승인 요청 TX",sc:"IN_PROGRESS 전이 · outbox PENDING",col:"--svc-payment"},
      {b:[160,176,200],c:[160,214,200],t:"명령 수신 · inbox 기록",s:"주문당 1행 (UNIQUE)",tc:"명령 수신",sc:"Kafka consumer",col:"--svc-pg"},
      {b:[160,252,200],c:[160,440,200],t:"인메모리 큐",tc:"inbox 큐",s:"커밋 후 적재 · 워커 take",col:"--svc-pg",q:1},
      {b:[160,328,200],c:[160,602,200],t:"워커 · PG사 호출",s:"Toss / NicePay",tc:"PG사 호출",sc:"트랜잭션 밖 · 커넥션 미점유",col:"--svc-pg"},
      {b:[60,440,200],c:[60,1044,200],t:"events.confirmed",s:"승인 · 거절 · 격리 결과",col:"--st-done"},
      {b:[330,440,220],c:[330,1044,220],t:"commands.confirm.dlq",s:"pg DLQ consumer가 격리 후 회신",col:"--st-failed"},
      {b:[600,440,220],c:[600,1044,220],t:"commands.confirm",s:"재시도 명령",sc:"재시도 명령 · 발행 시각 지연",col:"--st-quar"},
      {b:[60,518,340],c:[60,1128,340],t:"결과 수신 · 결제 상태 확정",s:"중복 검사 후 DONE / FAILED · 재고 확정 또는 복구",col:"--svc-payment"},
      {b:null,c:[300,44,220],t:"커밋 직후 비동기 발행",s:"@Async 가상 스레드 · 발행 후 DONE",col:"--svc-payment"},
      {b:null,c:[580,44,250],t:"outbox 폴링 워커 · 5초",s:"놓친 PENDING 행 발행",col:"--faint",fb:1},
      {b:null,c:[160,290,200],t:"inbox 조회 · 상태 분기",s:"주문당 1행 (UNIQUE)",col:"--svc-pg"},
      {b:null,c:[160,366,200],t:"inbox 저장 · PENDING",s:"같은 TX에서 적재 이벤트 발행",col:"--svc-pg"},
      {b:null,c:[160,526,200],t:"TX_A · 행 선점",s:"IN_PROGRESS 전이 · SKIP LOCKED",col:"--svc-pg"},
      {b:null,c:[560,562,256],t:"inbox 폴링 워커 · 5초",s:"60초 넘게 멈춘 PENDING / IN_PROGRESS",col:"--faint",fb:1},
      {b:null,c:[60,694,200],t:"결과 기록",s:"inbox → APPROVED / FAILED",col:"--st-done"},
      {b:null,c:[330,694,220],t:"시도 소진",s:"inbox는 IN_PROGRESS 유지",col:"--st-failed"},
      {b:null,c:[600,694,220],t:"재시도 예약",s:"inbox 시도 횟수 +1",col:"--st-quar"},
      {b:null,c:[330,762,220],t:"pg_outbox 행 저장",s:"inbox 변경과 함께 커밋",col:"--svc-pg"},
      {b:null,c:[330,850,220],t:"outbox 큐",s:"커밋 후 적재 · 워커 take",col:"--svc-pg",q:1},
      {b:null,c:[330,942,220],t:"Kafka 발행",s:"발행 후 processed_at 기록",col:"--svc-pg"},
      {b:null,c:[60,942,230],t:"outbox 폴링 워커 · 2초",s:"미발행 행 · 지연 재시도 발행",col:"--faint",fb:1}
    ];
    // m: b=간략 그림 전용, c=상세 그림 전용. 칸 위치가 모드마다 달라 화살표는 모드별로 따로 두고, 배열 순서대로 그린다.
    var EDGES=[
      {m:"b",d:"M260,86 L260,174",k:"0",lab:"commands.confirm",lx:272,ly:126,anchor:"start"},
      {m:"b",d:"M260,222 L260,250",k:"0",lab:"커밋 후 적재",lx:272,ly:240,anchor:"start"},
      {m:"b",d:"M260,298 L260,326",k:"0"},
      {m:"b",d:"M220,374 Q170,404 162,438",k:"ok",lab:"승인 · 거절",lx:126,ly:410},
      {m:"b",d:"M290,374 Q430,392 440,438",k:"fail",lab:"4회 소진",lx:448,ly:410,anchor:"start"},
      {m:"b",d:"M360,358 Q690,358 710,438",k:"retry",lab:"일시 오류",lx:600,ly:352},
      {m:"b",d:"M820,463 L872,463 L872,186 L364,186",k:"retry",dash:1,lab:"같은 토픽으로 재수신 · 최대 4회",lx:850,ly:202,anchor:"end"},
      {m:"b",d:"M160,486 L160,516",k:"ok"},
      {m:"c",d:"M260,67 L296,67",k:"0"},
      {m:"c",d:"M580,67 L524,67",k:"fb",dash:1},
      {m:"c",d:"M410,90 C410,180 260,160 260,212",k:"0",lab:"commands.confirm",lx:400,ly:140,anchor:"start"},
      {m:"c",d:"M260,260 L260,288",k:"0"},
      {m:"c",d:"M260,336 L260,364",k:"0",lab:"처음 받은 주문",lx:272,ly:354,anchor:"start"},
      {m:"c",d:"M360,320 L400,320 L400,463 L362,463",k:"0",dash:1,lab:"진행 중이면 큐에만 다시 적재",lx:410,ly:396,anchor:"start"},
      {m:"c",d:"M260,412 L260,438",k:"0",lab:"inbox 커밋 후 적재",lx:272,ly:430,anchor:"start"},
      {m:"c",d:"M260,486 L260,524",k:"0",lab:"적재 즉시 깨어남",lx:272,ly:510,anchor:"start"},
      {m:"c",d:"M260,572 L260,600",k:"0"},
      {m:"c",d:"M560,585 L364,551",k:"fb",dash:1,lab:"큐를 놓친 행 회수",lx:470,ly:558},
      {m:"c",d:"M220,648 Q170,668 162,692",k:"ok",lab:"승인 · 확정 거절",lx:120,ly:674},
      {m:"c",d:"M290,648 Q430,662 440,692",k:"fail",lab:"일시 오류 · 4회 도달",lx:448,ly:668,anchor:"start"},
      {m:"c",d:"M360,634 Q690,634 710,692",k:"retry",lab:"일시 오류 · 4회 미만",lx:600,ly:626},
      {m:"c",d:"M160,740 Q170,772 326,786",k:"0"},
      {m:"c",d:"M440,740 L440,760",k:"0"},
      {m:"c",d:"M710,740 Q700,772 554,786",k:"0"},
      {m:"c",d:"M440,808 L440,848",k:"0",lab:"커밋 후 적재",lx:452,ly:843,anchor:"start"},
      {m:"c",d:"M440,896 L440,940",k:"0",lab:"적재 즉시 깨어남",lx:452,ly:922,anchor:"start"},
      {m:"c",d:"M290,965 L326,965",k:"fb",dash:1},
      {m:"c",d:"M380,988 Q220,1016 166,1042",k:"ok"},
      {m:"c",d:"M440,988 L440,1042",k:"fail"},
      {m:"c",d:"M500,988 Q690,1016 710,1042",k:"retry"},
      {m:"c",d:"M820,1067 L872,1067 L872,237 L364,237",k:"retry",dash:1,lab:"같은 토픽으로 재수신 · 간격을 늘려 최대 4회",lx:850,ly:229,anchor:"end"},
      {m:"c",d:"M160,1090 L160,1126",k:"ok"}
    ];
    var NOTES=[
      {m:"b",x:375,y:212,t:"이미 받은 주문이면 저장한 결과로 회신",cls:"sw-lab self"},
      {m:"c",x:375,y:304,t:"종결된 주문이면 저장한 결과를 다시 회신",cls:"sw-lab self"}
    ];

    function geo(o,m){var g=(m==="c"?(o.c||o.b):(o.b||o.c)).slice();if(g.length===3)g.push(46);return g;}
    function lerp(a,b,p){return a.map(function(v,i){return v+(b[i]-v)*p;});}
    function ease(p){return p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;}
    function tween(dur,fn){
      if(reduce||!dur){fn(1);return;}
      var t0=performance.now();
      function step(ts){var p=Math.max(0,Math.min(1,(ts-t0)/dur));fn(ease(p));if(p<1)requestAnimationFrame(step);}
      requestAnimationFrame(step);
    }
    function fade(el,on,delay,dur){
      if(reduce){el.style.transition="none";el.style.opacity=on?1:0;return;}
      el.style.transition="opacity "+(dur||220)+"ms ease "+(delay||0)+"ms";el.style.opacity=on?1:0;
    }

    RECTS.forEach(function(r){
      r.rect=sv("rect",{rx:r.k==="kafka"?8:r.k==="zone"?14:12,class:r.k==="zone"?"pf-zone pf-zone-"+r.z:r.k==="kafka"?"pf-kafka":r.k==="tx"?"pf-txbox":"pf-band pf-band-pg"});
      r.lab=sv("text",{class:r.k==="zone"?"pf-zone-t pf-zone-t-"+r.z:r.k==="kafka"?"pf-kafka-t":r.k==="tx"?"pf-band-t pf-tx-t":"pf-band-t","text-anchor":r.k==="zone"?"end":"start"});
      r.lab.textContent=r.t||"Kafka";
      gBg.appendChild(r.rect);gBg.appendChild(r.lab);
      if(!r.b){r.rect.style.opacity=0;r.lab.style.opacity=0;}
    });
    function setRect(r,g){
      r.rect.setAttribute("x",g[0]);r.rect.setAttribute("y",g[1]);r.rect.setAttribute("width",g[2]);r.rect.setAttribute("height",g[3]);
      if(r.k==="zone"){r.lab.setAttribute("x",g[0]+g[2]-12);r.lab.setAttribute("y",g[1]+18);}
      else if(r.k==="kafka"){r.lab.setAttribute("x",22);r.lab.setAttribute("y",g[1]+(g[3]>50?14:24));}
      else if(r.k==="tx"){r.lab.setAttribute("x",g[0]+14);r.lab.setAttribute("y",g[1]+g[3]-10);}
      else{r.lab.setAttribute("x",g[0]+14);r.lab.setAttribute("y",g[1]+18);}
    }

    EDGES.forEach(function(e){
      e.marker="url(#pf"+(e.k==="0"?"0":e.k)+")";
      e.path=sv("path",{d:e.d,class:"pf-edge"+(e.k!=="0"?" pk-"+e.k:"")+(e.dash?" dash":""),"marker-end":e.marker});
      gEdge.appendChild(e.path);
      if(e.lab){e.labEl=sv("text",{x:e.lx,y:e.ly,class:"sw-lab"+(e.k!=="0"?" pl-"+e.k:""),"text-anchor":e.anchor||"middle"});e.labEl.textContent=e.lab;gEdge.appendChild(e.labEl);}
      if(e.m==="c"){e.path.style.opacity=0;if(e.labEl)e.labEl.style.opacity=0;}
    });
    NOTES.forEach(function(n){n.el=sv("text",{x:n.x,y:n.y,class:n.cls,"text-anchor":n.anchor||"start"});n.el.textContent=n.t;if(n.m==="c")n.el.style.opacity=0;gEdge.appendChild(n.el);});

    NODES.forEach(function(n){
      n.outer=sv("g",{});n.inner=sv("g",{class:"pf-node-in"+(n.b?"":" pf-off")});
      n.rect=sv("rect",{x:0,y:0,rx:n.q?4:10,class:"pf-box"+(n.q?" pf-queue":"")+(n.fb?" pf-fb":""),style:"--nc:var("+n.col+")"});
      n.inner.appendChild(n.rect);
      if(n.q){
        // 큐: 항목이 줄 서 대기하는 버퍼로 보이도록 슬롯 칸막이를 그린다
        var w=geo(n,"c")[2];
        for(var qi=1;qi<6;qi++){var qx=w*qi/6;n.inner.appendChild(sv("line",{x1:qx,y1:1,x2:qx,y2:13,class:"pf-qslot"}));n.inner.appendChild(sv("line",{x1:qx,y1:33,x2:qx,y2:45,class:"pf-qslot"}));}
      }
      n.tEl=sv("text",{y:19,"text-anchor":"middle",class:"pf-t"});n.tEl.textContent=n.t;
      n.sEl=sv("text",{y:34,"text-anchor":"middle",class:"pf-s"});n.sEl.textContent=n.s;
      n.inner.appendChild(n.tEl);n.inner.appendChild(n.sEl);
      n.outer.appendChild(n.inner);gNode.appendChild(n.outer);
    });
    function setNode(n,g){
      n.outer.setAttribute("transform","translate("+g[0]+","+g[1]+")");
      n.rect.setAttribute("width",g[2]);n.rect.setAttribute("height",g[3]);
      n.tEl.setAttribute("x",g[2]/2);n.sEl.setAttribute("x",g[2]/2);
    }
    function swapText(el,want){
      if(!el||el.textContent===want)return;
      if(reduce){el.textContent=want;return;}
      el.style.transition="opacity 120ms ease";el.style.opacity=0;
      setTimeout(function(){el.textContent=want;el.style.opacity=1;},130);
    }
    function drawIn(e,delay){
      if(e.dash||reduce){fade(e.path,1,delay,260);}
      else{
        // 선을 시작점부터 그려 나간다. 다 그린 뒤에 화살촉을 붙여 끝점에 화살촉만 먼저 보이지 않게 한다.
        var p=e.path,L=p.getTotalLength();
        p.removeAttribute("marker-end");
        p.style.transition="none";p.style.strokeDasharray=L;p.style.strokeDashoffset=L;p.style.opacity=1;
        p.getBoundingClientRect();
        p.style.transition="stroke-dashoffset 420ms ease "+delay+"ms";p.style.strokeDashoffset=0;
        setTimeout(function(){p.style.transition="";p.style.strokeDasharray="";p.style.strokeDashoffset="";p.setAttribute("marker-end",e.marker);},delay+440);
      }
      if(e.labEl)fade(e.labEl,1,delay+200,240);
    }
    function drawOut(e){fade(e.path,0,0,150);if(e.labEl)fade(e.labEl,0,0,150);}

    var mode="b",busy=false;
    RECTS.forEach(function(r){setRect(r,geo(r,"b"));});
    NODES.forEach(function(n){setNode(n,geo(n,"b"));});

    function go(to){
      if(busy||to===mode)return;
      busy=true;var from=mode;mode=to;var open=to==="c",k=reduce?0:1;
      if(toggle){toggle.setAttribute("aria-pressed",open?"true":"false");(toggle.querySelector(".pf-fab-t")||toggle).textContent=open?"간단히 보기":"상세 보기";}
      if(legendFb)legendFb.hidden=!open;
      svg.setAttribute("aria-label",LABEL[to]);
      var cOnly=NODES.filter(function(n){return !n.b;}),cRects=RECTS.filter(function(r){return !r.b;});
      // 1) 지금 모드에만 있던 선과 메모를 걷어 낸다. 접을 때는 상세 전용 칸과 구역도 먼저 들어간다.
      EDGES.filter(function(e){return e.m===from;}).forEach(drawOut);
      NOTES.forEach(function(n){if(n.m===from)fade(n.el,0,0,150);});
      if(!open){
        cOnly.forEach(function(n){n.inner.style.transitionDelay="0ms";n.inner.classList.add("pf-off");});
        cRects.forEach(function(r){fade(r.rect,0,0,180);fade(r.lab,0,0,180);});
      }
      NODES.forEach(function(n){swapText(n.tEl,open&&n.tc?n.tc:n.t);swapText(n.sEl,open&&n.sc?n.sc:n.s);});
      // 2) 칸과 구간이 새 좌표로 미끄러진다. 그림 높이도 함께 바뀐다.
      var tMove=(open?120:220)*k,moveDur=560;
      setTimeout(function(){
        tween(moveDur,function(p){
          RECTS.forEach(function(r){setRect(r,lerp(geo(r,from),geo(r,to),p));});
          NODES.forEach(function(n){setNode(n,lerp(geo(n,from),geo(n,to),p));});
          svg.setAttribute("viewBox","0 0 880 "+(H[from]+(H[to]-H[from])*p));
        });
      },tMove);
      // 3) 펼칠 때는 상세 전용 칸이 하나씩 튀어나온다.
      var tPop=tMove+(open?300:moveDur)*k;
      if(open){
        cRects.forEach(function(r){fade(r.rect,1,tPop,260);fade(r.lab,1,tPop,260);});
        cOnly.forEach(function(n,i){n.inner.style.transitionDelay=(reduce?0:tPop+i*45)+"ms";n.inner.classList.remove("pf-off");});
      }
      // 4) 새 모드의 선과 메모를 차례로 그린다.
      var tDraw=open?tPop+(cOnly.length*45+160)*k:tPop;
      var entering=EDGES.filter(function(e){return e.m===to;});
      entering.forEach(function(e,i){drawIn(e,reduce?0:tDraw+i*28);});
      NOTES.forEach(function(n){if(n.m===to)fade(n.el,1,reduce?0:tDraw+200,260);});
      setTimeout(function(){busy=false;},reduce?0:tDraw+entering.length*28+520);
    }
    if(toggle)toggle.addEventListener("click",function(){toggle.classList.remove("pf-fab-hint");go(mode==="b"?"c":"b");});
    // 그림이 처음 절반쯤 보일 때 버튼에 한 번 물결 효과를 준다. 이미 눌렀거나 동작 줄이기 설정이면 건너뛴다.
    if(toggle&&!reduce&&"IntersectionObserver" in window){
      var io=new IntersectionObserver(function(ents){
        if(ents.some(function(en){return en.isIntersecting;})){io.disconnect();if(mode==="b")toggle.classList.add("pf-fab-hint");}
      },{threshold:0.35});
      io.observe(mount);
    }
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

  /* ================= §02 JOURNEY · Interactivity (Tooltip & Side Panel) ================= */
  var jInteractive = document.getElementById("journeyInteractive");
  var sidePanel = document.getElementById("sidePanel");
  var sideContent = document.getElementById("sidePanelContent");
  var btnClose = document.getElementById("closeSidePanel");
  var tooltip = document.getElementById("stageTooltip");

  // Draggable Side Panel Logic
  if (sidePanel) {
    var isDragging = false;
    var startX, startY, initialX, initialY;
    var header = sidePanel.querySelector(".side-panel-header");
    if (header) {
      header.addEventListener("mousedown", function(e) {
        if (e.target === btnClose) return;
        isDragging = true;
        
        var rect = sidePanel.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        initialX = rect.left;
        initialY = rect.top;
        
        sidePanel.style.transition = "none"; 
        sidePanel.style.right = "auto";
        sidePanel.style.transform = "none";
        sidePanel.style.left = initialX + "px";
        sidePanel.style.top = initialY + "px";
      });
      document.addEventListener("mousemove", function(e) {
        if (!isDragging) return;
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        sidePanel.style.left = (initialX + dx) + "px";
        sidePanel.style.top = (initialY + dy) + "px";
      });
      document.addEventListener("mouseup", function() {
        if (isDragging) {
          isDragging = false;
        }
      });
    }
  }

  if(jInteractive && sideContent && tooltip){
    var _s2s = {};
    var _s2info = {};
    var currentStage = 0;
    var numIter = 0;
    
    // Map Steps -> Stages
    FLOW_STEPS.forEach(function(s){
      if(s.st) currentStage++;
      if(!_s2s[currentStage]) _s2s[currentStage] = [];
      if(!s.cut) { numIter++; _s2s[currentStage].push(numIter); }
    });

    // Pre-generate full HTML content for each stage
    PAYMENT.forEach(function(s) {
      var h='<div class="pstage" style="border:none;">';
      h+='<div class="ps-top"><span class="ps-num">'+s.no+'</span><span class="ps-title">'+esc(s.title)+'</span></div>';
      h+='<p class="ps-sub">'+esc(s.purpose)+'<span class="ps-inv" style="display:block; margin-top:8px;">핵심 · '+esc(s.invariant)+'</span></p>';
      h+='<div class="sub-label">진행</div><ol class="steps">';
      s.steps.forEach(function(st){h+='<li><span>'+esc(st.t)+(st.c&&st.c.length?'<span class="codes">'+chips(st.c)+'</span>':'')+'</span></li>';});
      h+='</ol>';
      if(s.branches&&s.branches.length){h+='<div class="sub-label">분기 · 예외</div><div class="branches">';
        s.branches.forEach(function(b2){h+='<div class="branch '+b2.type+'"><span class="btag">'+esc(b2.tag)+'</span>'+esc(b2.text)+(b2.code?' <code>'+esc(b2.code)+'</code>':'')+'</div>';});
        h+='</div>';}
      h+='</div>';
      
      _s2info[s.no] = { data: s, html: h };
    });

    var stepElsObj = {};
    var activeStageNo = null;
    var swimSvg = jInteractive.querySelector("svg.swimlane");
    if (swimSvg) {
      swimSvg.querySelectorAll(".sw-step-grp").forEach(function(g) {
        var n = parseInt(g.getAttribute("data-n"));
        if (n) stepElsObj[n] = g;
      });

      swimSvg.querySelectorAll(".sw-stage-hit").forEach(function(hit) {
        var myStage = hit.getAttribute("data-stage");
        if (myStage) {
          hit.addEventListener("mouseenter", function(e) {
            if (!swimSvg.classList.contains("has-selection")) {
              swimSvg.classList.add("has-active");
            }
            if (_s2s[myStage]) {
              _s2s[myStage].forEach(function(stepNo) {
                if(stepElsObj[stepNo]) stepElsObj[stepNo].classList.add("hovered");
              });
            }

            var info = _s2info[myStage];
            if(info && info.data) {
              tooltip.innerHTML = '<div class="tt-title"><span class="tt-num">'+info.data.no+'</span> '+esc(info.data.title)+'</div>' +
                                  '<span class="tt-actor">'+esc(info.data.actor)+'</span>' +
                                  '<p class="tt-desc">'+esc(info.data.purpose)+'</p>' +
                                  '<span class="tt-inv">핵심 · '+esc(info.data.invariant)+'</span>';
              
              tooltip.classList.remove("hidden");
            }
          });

          hit.addEventListener("mousemove", function(e) {
            var rect = jInteractive.getBoundingClientRect();
            var left = e.clientX - rect.left + 15;
            var top = e.clientY - rect.top + 15; 
            if(left + 280 > rect.width) left = rect.width - 295;
            tooltip.style.transform = "translate(" + left + "px, " + top + "px)";
          });

          hit.addEventListener("mouseleave", function(e) {
            swimSvg.classList.remove("has-active");
            if (_s2s[myStage]) {
              _s2s[myStage].forEach(function(stepNo) {
                if(stepElsObj[stepNo]) stepElsObj[stepNo].classList.remove("hovered");
              });
            }
            tooltip.classList.add("hidden");
          });

          hit.addEventListener("click", function(e) {
            if (activeStageNo === myStage) {
              jInteractive.classList.remove("panel-open");
              swimSvg.classList.remove("has-selection");
              Object.keys(stepElsObj).forEach(function(k) { stepElsObj[k].classList.remove("selected"); });
              activeStageNo = null;
              if (sidePanel) {
                sidePanel.style.transition = "";
                sidePanel.style.right = "";
                sidePanel.style.transform = "";
                sidePanel.style.left = "";
                sidePanel.style.top = "";
              }
            } else {
              var info = _s2info[myStage];
              if(info && info.html) {
                // Restart animation
                sideContent.classList.remove("fade-in-up");
                void sideContent.offsetWidth; // trigger reflow
                
                sideContent.innerHTML = info.html;
                sideContent.scrollTop = 0;
                sideContent.classList.add("fade-in-up");

                jInteractive.classList.add("panel-open");
                swimSvg.classList.add("has-selection");
                
                Object.keys(stepElsObj).forEach(function(k) { stepElsObj[k].classList.remove("selected"); });
                if (_s2s[myStage]) {
                  _s2s[myStage].forEach(function(stepNo) {
                    if(stepElsObj[stepNo]) stepElsObj[stepNo].classList.add("selected");
                  });
                }
                activeStageNo = myStage;
                tooltip.classList.add("hidden"); 
              }
            }
          });
        }
      });
    } // end if (swimSvg)

    if(btnClose) {
      btnClose.addEventListener("click", function() {
        jInteractive.classList.remove("panel-open");
        activeStageNo = null;
        if (swimSvg) {
          swimSvg.classList.remove("has-selection");
          Object.keys(stepElsObj).forEach(function(k) { stepElsObj[k].classList.remove("selected"); });
        }
        if (sidePanel) {
          sidePanel.style.transition = "";
          sidePanel.style.right = "";
          sidePanel.style.transform = "";
          sidePanel.style.left = "";
          sidePanel.style.top = "";
        }
      });
    }
  }

  /* ================= §03 STATE MACHINE ================= */
  var smWrap=document.getElementById("smWrap"),cfDetail=document.getElementById("cfDetail"),smHint=document.getElementById("smHint");
  var smv=sv("svg",{viewBox:"0 0 840 500",class:"statemachine",role:"group","aria-label":"PaymentEventStatus 상태 전이"});
  var sdefs=sv("defs",{});["","recover"].forEach(function(k){var m=sv("marker",{id:"sarw"+(k||"0"),markerWidth:"9",markerHeight:"9",refX:"7",refY:"3",orient:"auto",markerUnits:"userSpaceOnUse"});var p=sv("path",{d:"M0,0 L7,3 L0,6 Z",class:"arrow-s"});if(k)p.setAttribute("style","fill:var(--st-quar)");m.appendChild(p);sdefs.appendChild(m);});smv.appendChild(sdefs);
  var sEdgeEls=[];
  SEDGES.forEach(function(e){var p=sv("path",{d:e.d,class:"edge2"+(e.recover?" recover":""),"marker-end":"url(#sarw"+(e.recover?"recover":"0")+")"});p.dataset.from=e.from;smv.appendChild(p);
    var l=sv("text",{x:e.lx,y:e.ly,class:"elabel"+(e.recover?" recover":""),"text-anchor":e.anchor||"middle"});l.textContent=e.label;l.dataset.from=e.from;smv.appendChild(l);
    sEdgeEls.push({p:p,l:l,from:e.from});});
  var sNodeEls={};
  Object.keys(NPOS).forEach(function(id){var p=NPOS[id],st=STATES[id],w=p.w||124,h=46;var g=sv("g",{class:"snode",tabindex:"0",role:"button","aria-label":id+" 상태"});g.dataset.state=id;
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
    h+='<dl class="kv"><dt>진입</dt><dd>'+esc(st.entry)+(st.entryRef?' <code class="ent-ref">'+esc(st.entryRef)+'</code>':'')+'</dd><dt>종결 여부</dt><dd>'+(st.terminal?"예 (폴링 종료)":"아니오 (폴링 계속)")+'</dd><dt>폴링 응답</dt><dd><code>'+esc(st.polling)+'</code></dd></dl>';
    if(st.out.length){h+='<div class="sub-label">후속 상태 전이</div><div class="transitions">';st.out.forEach(function(o){h+='<div class="trans"><span class="arr">──▶</span><span class="to" style="color:var('+CV[STATES[o.to].color]+')">'+o.to+'</span><span class="tl">'+esc(o.label)+(o.recover?' · 신규':'')+'</span></div>';});h+='</div>';}
    else h+='<div class="sub-label">후속 상태 전이</div><p class="branch-note">종결 상태 · 더 이상의 상태 전이 없음.</p>';
    if(id==="QUARANTINED")h+='<div class="mini"><h4>재고 보상 · 격리 안전 종결</h4><div class="row"><span class="k">키 조건</span><span>decrement:done 키가 있을 때만 재고 보상 · 유령 재고 방지.</span></div><div class="row"><span class="k">조건부 갱신</span><span>현재 상태가 QUARANTINED일 때만 FAILED로 갱신 · order 동조, 지연 회신과의 복구 경합 차단.</span></div><div class="row"><span class="k">DLQ</span><span>events.confirmed.dlq 적체분은 원 토픽 재주입으로 EOS 재처리.</span></div></div>';
    else if(id==="DONE")h+='<div class="mini"><h4>재고 확정 · 승인</h4><div class="row"><span class="k">확정</span><span>stock-committed 발행 · 결정적 키로 product가 멱등 흡수, 차감 1회.</span></div><div class="row"><span class="k">재발행</span><span>RDB DONE 후 브로커 커밋 유실 시 종결 가드가 재발행 복구.</span></div></div>';
    cfDetail.innerHTML=h;}
  cfDetail.innerHTML='<div class="dhead"><h3 class="big">상태 머신 읽는 법</h3></div><p style="margin:14px 0 0;color:var(--ink-soft);font-size:14px">노드를 클릭하면 상세 설명 표시</p><div class="mini"><h4>핵심 규칙</h4><div class="row"><span class="k">종결</span><span>DONE·FAILED·EXPIRED에 도달하면 폴링 종료.</span></div><div class="row"><span class="k">예외</span><span>QUARANTINED는 종결이 아니라 관리자 개입 대기 · 폴링은 PROCESSING에서 멈춘다.</span></div></div>';

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
    h+='<p style="margin:4px 2px 0;font-size:11.5px;color:var(--faint)">구성 예시는 payment-service 기준 · 나머지 서비스도 같은 골격</p>';
    layerCards.innerHTML=h;
  })();
