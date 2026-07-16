// @ts-nocheck
// payment-platform 포트폴리오 — 시나리오 극장 (경로 지도·타임라인·재생) (이식된 로직).
import { reduce, esc, escBr, sv, CV } from './util';
import { SCN_NODES, SCN_EDGES, SCENARIOS, SCN_WHEN, SCN_OBS } from '../../data/paymentPortfolio';

  /* ================= §02 SCENARIO THEATER ================= */
  function edgeNodes(id){var m=id.split(/[>~]/);return id.indexOf("~")>=0?[m[0]]:[m[0],m[1]];}
  var KIND_PRIO={fail:5,retry:4,recover:3,warn:2,normal:1};
  function prioKind(pri){for(var k in KIND_PRIO){if(KIND_PRIO[k]===pri)return k;}return "normal";}
  (function(){
    var scnMapWrap=document.getElementById("scnMap");
    if(!scnMapWrap)return;
    var smap=sv("svg",{viewBox:"0 0 860 340",class:"scnmap",role:"img","aria-label":"시나리오 경로 지도"});
    var scnEdgeEls={};
    Object.keys(SCN_EDGES).forEach(function(id){var p=sv("path",{d:SCN_EDGES[id],class:"sedge3"});p.dataset.id=id;smap.appendChild(p);scnEdgeEls[id]=p;});
    var scnNodeEls={};
    function hopForNode(id){var sc=SCENARIOS[curScn];if(!sc)return -1;
      for(var k=0;k<sc.hops.length;k++){if(edgeNodes(sc.hops[k].edge).indexOf(id)>=0)return k;}
      return -1;}
    Object.keys(SCN_NODES).forEach(function(id){var n=SCN_NODES[id];var g=sv("g",{class:"snode3",tabindex:"0",role:"button","aria-label":n.t+" — 이 지점을 지나는 첫 홉으로 이동"});g.dataset.id=id;
      g.appendChild(sv("rect",{x:n.x,y:n.y,width:n.w,height:n.h,rx:9,class:"box3"}));
      var t=sv("text",{x:n.x+n.w/2,y:n.y+n.h/2-2,"text-anchor":"middle",class:"t3"});t.textContent=n.t;g.appendChild(t);
      var s=sv("text",{x:n.x+n.w/2,y:n.y+n.h/2+11,"text-anchor":"middle",class:"s3"});s.textContent=n.s;g.appendChild(s);
      function goHop(){var k=hopForNode(id);if(k>=0){stopPlay();setHop(k,true);}}
      g.addEventListener("click",goHop);
      g.addEventListener("keydown",function(ev){if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();goHop();}});
      smap.appendChild(g);scnNodeEls[id]=g;});
    var scnBadges=sv("g",{class:"scn-badges"});smap.appendChild(scnBadges);
    var scnToken=sv("circle",{r:"5",class:"scn-token",cx:"-20",cy:"-20",opacity:"0"});smap.appendChild(scnToken);
    scnMapWrap.appendChild(smap);

    var scnPicker=document.getElementById("scnPicker"),scnTimeline=document.getElementById("scnTimeline"),scnOutcome=document.getElementById("scnOutcome"),scnTitle=document.getElementById("scnTitle"),scnHopcount=document.getElementById("scnHopcount"),scnPlayBtn=document.getElementById("scnPlay");
    var curScn=0,curHop=-1,playing=false,playTimer=null,rafId=null,speed=1;
    var scnSpeedBtn=document.getElementById("scnSpeed");
    if(scnSpeedBtn)scnSpeedBtn.addEventListener("click",function(){speed=speed===1?2:1;scnSpeedBtn.textContent=speed+"\u00d7";});

    var GRP_LB={done:"성공으로 끝남",failed:"실패로 종결",quar:"격리로 멈춤",expired:"만료로 종결"};
    var curGrpKind=null,grpBody=null;
    SCENARIOS.forEach(function(sc,i){
      if(sc.outcome.color!==curGrpKind){curGrpKind=sc.outcome.color;
        var g=document.createElement("div");g.className="scn-grp";
        var gt=document.createElement("div");gt.className="scn-grp-t";gt.textContent=GRP_LB[curGrpKind]||"";g.appendChild(gt);
        grpBody=document.createElement("div");grpBody.className="scn-grp-b";g.appendChild(grpBody);scnPicker.appendChild(g);}
      var b=document.createElement("button");b.className="scn-btn";b.type="button";b.setAttribute("aria-pressed",i===0?"true":"false");b.dataset.i=i;
      b.innerHTML='<span class="kd" style="background:var('+CV[sc.outcome.color]+')"></span>'+esc(sc.name);
      b.addEventListener("click",function(){selectScn(i);});grpBody.appendChild(b);});

    function stopPlay(){playing=false;if(playTimer){clearTimeout(playTimer);playTimer=null;}if(rafId){cancelAnimationFrame(rafId);rafId=null;}scnToken.setAttribute("opacity","0");if(scnPlayBtn)scnPlayBtn.innerHTML="▶ 재생";}

    function selectScn(i){stopPlay();curScn=i;curHop=-1;
      scnPicker.querySelectorAll(".scn-btn").forEach(function(b){b.setAttribute("aria-pressed",(+b.dataset.i)===i?"true":"false");});
      var sc=SCENARIOS[i];scnTitle.textContent=sc.name;
      var whenEl=document.getElementById("scnWhen");
      if(whenEl)whenEl.innerHTML='<b>발생 조건</b>'+esc(SCN_WHEN[i]||"");
      var used={};sc.hops.forEach(function(h){var pri=KIND_PRIO[h.kind]||1;if(!used[h.edge]||pri>used[h.edge])used[h.edge]=pri;});
      var nodeOn={};
      smap.classList.add("trace");
      Object.keys(scnEdgeEls).forEach(function(id){scnEdgeEls[id].setAttribute("class","sedge3");});
      Object.keys(used).forEach(function(id){scnEdgeEls[id].setAttribute("class","sedge3 on k-"+prioKind(used[id]));edgeNodes(id).forEach(function(nn){nodeOn[nn]=true;});});
      Object.keys(scnNodeEls).forEach(function(id){scnNodeEls[id].setAttribute("class","snode3"+(nodeOn[id]?" on":""));});
      while(scnBadges.firstChild)scnBadges.removeChild(scnBadges.firstChild);
      var eCount={};sc.hops.forEach(function(h){eCount[h.edge]=(eCount[h.edge]||0)+1;});
      var eSeen={};
      sc.hops.forEach(function(h,k){var ep=scnEdgeEls[h.edge];if(!ep||!ep.getTotalLength)return;
        var tot=eCount[h.edge];var idx=(eSeen[h.edge]=(eSeen[h.edge]||0)+1)-1;
        var frac=tot===1?0.5:(0.36+0.30*(tot>1?idx/(tot-1):0));
        var pt=ep.getPointAtLength(ep.getTotalLength()*frac);
        var g=sv("g",{class:"hopbadge"});
        g.appendChild(sv("circle",{cx:pt.x,cy:pt.y,r:"8.5",class:"hb-c k-"+h.kind}));
        var tx=sv("text",{x:pt.x,y:pt.y+3,"text-anchor":"middle",class:"hb-t"});tx.textContent=(k+1);
        g.appendChild(tx);scnBadges.appendChild(g);});
      scnHopcount.textContent=sc.hops.length+" 홉";
      var th="";sc.hops.forEach(function(h,k){var nn=edgeNodes(h.edge);var pathTxt=nn.length>1?nn[0]+" → "+nn[1]:nn[0]+" ↻";
        th+='<li class="scn-hop k-'+h.kind+'" data-k="'+k+'" tabindex="0"><span class="hn">'+(k+1)+'</span><span><span class="path">'+esc(pathTxt)+'</span><span class="lab">'+esc(h.label)+'</span>'+(h.state?'<span class="stx">'+esc(h.state)+'</span>':'')+(h.why?'<span class="why"><b>'+esc(h.why.tag)+'</b> '+esc(h.why.text)+(h.why.src?' <span class="src">['+esc(h.why.src)+']</span>':'')+(h.why.dref!=null?' <a class="why-link" href="#dec-'+h.why.dref+'">근거 →</a>':'')+'</span>':'')+'</span></li>';});
      scnTimeline.innerHTML=th;
      scnTimeline.querySelectorAll(".scn-hop").forEach(function(li){
        function act(ev){if(ev.target&&ev.target.closest&&ev.target.closest("a"))return;stopPlay();setHop(+li.dataset.k,true);}
        li.addEventListener("click",act);
        li.addEventListener("keydown",function(ev){if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();act(ev);}});
      });
      scnOutcome.innerHTML='<span class="obadge" style="color:var('+CV[sc.outcome.color]+');background:color-mix(in srgb,var('+CV[sc.outcome.color]+') 14%,transparent)"><span style="width:9px;height:9px;border-radius:50%;background:var('+CV[sc.outcome.color]+')"></span>'+esc(sc.outcome.status)+'</span><span class="props">'+sc.outcome.props.map(function(p){return '<span class="prop">'+esc(p)+'</span>';}).join('')+'</span>'+((SCN_OBS[i]&&SCN_OBS[i].length)?'<span class="obs-group"><span class="obs-label">관측</span>'+SCN_OBS[i].map(function(mm){return '<span class="obs-m">'+esc(mm)+'</span>';}).join('')+'</span>':'')+(sc.impact?'<span class="scn-impact"><b>손실 방어</b>'+escBr(sc.impact)+'</span>':'');
    }

    function setHop(k,manual){var sc=SCENARIOS[curScn];if(k<0||k>=sc.hops.length)return;curHop=k;var h=sc.hops[k];
      scnTimeline.querySelectorAll(".scn-hop").forEach(function(li){li.classList.toggle("cur",(+li.dataset.k)===k);});
      if(manual){var curLi=scnTimeline.querySelector('.scn-hop[data-k="'+k+'"]');if(curLi&&curLi.scrollIntoView)curLi.scrollIntoView({block:"nearest",behavior:reduce?"auto":"smooth"});}
      Object.keys(scnEdgeEls).forEach(function(id){scnEdgeEls[id].classList.remove("cur");});
      var ep=scnEdgeEls[h.edge];if(ep)ep.classList.add("cur");
      var nn=edgeNodes(h.edge);var target=nn.length>1?nn[1]:nn[0];
      Object.keys(scnNodeEls).forEach(function(id){scnNodeEls[id].classList.remove("pulse");});
      if(scnNodeEls[target])scnNodeEls[target].classList.add("pulse");
      var bch=scnBadges.childNodes;for(var bi=0;bi<bch.length;bi++){if(bch[bi].classList)bch[bi].classList.toggle("cur",bi===k);}
      if(!reduce&&ep&&ep.getTotalLength){animateToken(ep);}else{scnToken.setAttribute("opacity","0");}
    }

    function animateToken(ep){if(rafId)cancelAnimationFrame(rafId);var len=ep.getTotalLength();var start=null,dur=640/speed;scnToken.setAttribute("opacity","1");
      function step(ts){if(start===null)start=ts;var t=Math.min(1,(ts-start)/dur);var pt=ep.getPointAtLength(len*t);scnToken.setAttribute("cx",pt.x);scnToken.setAttribute("cy",pt.y);if(t<1){rafId=requestAnimationFrame(step);}else{rafId=null;if(playing)advance();}}
      rafId=requestAnimationFrame(step);}

    function advance(){var sc=SCENARIOS[curScn];if(curHop+1<sc.hops.length){playTimer=setTimeout(function(){setHop(curHop+1,false);},170/speed);}else{stopPlay();}}

    function stepReduced(){playTimer=setTimeout(function(){var sc=SCENARIOS[curScn];if(curHop+1<sc.hops.length){setHop(curHop+1,false);stepReduced();}else{stopPlay();}},560/speed);}

    function play(){if(playing){stopPlay();return;}var sc=SCENARIOS[curScn];playing=true;if(scnPlayBtn)scnPlayBtn.innerHTML="⏸ 정지";
      var start=(curHop<0||curHop>=sc.hops.length-1)?0:curHop+1;
      if(reduce){setHop(start,false);stepReduced();}else{setHop(start,false);}
    }

    if(scnPlayBtn)scnPlayBtn.addEventListener("click",play);
    var pv=document.getElementById("scnPrev"),nx=document.getElementById("scnNext");
    if(pv)pv.addEventListener("click",function(){stopPlay();setHop(curHop<=0?0:curHop-1,true);});
    if(nx)nx.addEventListener("click",function(){stopPlay();var sc=SCENARIOS[curScn];setHop(Math.min(sc.hops.length-1,curHop+1),true);});
    selectScn(0);
  })();
