// payment-platform 포트폴리오 데이터 · 콘텐츠/지오메트리. 렌더 로직과 분리(유지보수·편집 격리).
// 정본 페이지: src/pages/payment-platform-portfolio/index.astro

export const SCN_NODES = {
    browser:{x:40,y:54,w:120,h:44,t:"브라우저",s:"CLIENT"},
    payment:{x:250,y:54,w:150,h:48,t:"payment",s:"ORCHESTRATOR"},
    pg:{x:470,y:54,w:130,h:48,t:"pg",s:"VENDOR GUARD"},
    vendor:{x:690,y:54,w:130,h:44,t:"vendor",s:"Toss / NicePay"},
    redis:{x:250,y:168,w:150,h:44,t:"redis-stock",s:"재고 선차감"},
    product:{x:250,y:278,w:150,h:44,t:"product",s:"재고 기준 장부"},
    dlq:{x:470,y:200,w:130,h:44,t:"DLQ",s:"격리 토픽"},
    admin:{x:690,y:200,w:130,h:44,t:"admin",s:"관리자 복구"}
  };

export const SCN_EDGES = {
    "browser>payment":"M160,76 L250,78",
    "payment>pg":"M400,70 L470,70",
    "pg>payment":"M470,90 L400,90",
    "pg>vendor":"M600,70 L690,70",
    "vendor>pg":"M690,90 L600,90",
    "payment>redis":"M320,102 L320,168",
    "payment>product":"M300,102 Q235,190 300,278",
    "pg~self":"M505,54 C492,16 578,16 565,54",
    "payment~self":"M300,54 C286,14 364,14 350,54",
    "payment>dlq":"M400,88 Q470,150 500,200",
    "pg>dlq":"M535,102 L535,200",
    "dlq>payment":"M470,208 Q378,150 360,102",
    "admin>payment":"M690,214 Q470,300 360,100"
  };

export const SCENARIOS = [
    {name:"정상 결제",outcome:{status:"DONE",color:"done",props:["재고 확정 멱등 흡수","EOS 원자 커밋"]},hops:[
      {edge:"browser>payment",kind:"normal",label:"checkout · confirm",state:"READY → IN_PROGRESS"},
      {edge:"payment>redis",kind:"normal",label:"재고 선차감 (Lua atomic)"},
      {edge:"payment>pg",kind:"normal",label:"commands.confirm 발행"},
      {edge:"pg>vendor",kind:"normal",label:"승인 호출 (strategy.confirm)"},
      {edge:"vendor>pg",kind:"normal",label:"APPROVED (승인 금액·시각)"},
      {edge:"pg>payment",kind:"normal",label:"events.confirmed",state:"IN_PROGRESS → DONE"},
      {edge:"payment>product",kind:"normal",label:"stock-committed · 재고 확정 (결정적 키)"}
    ]},
    {name:"PG 5xx · 재시도로 복구",outcome:{status:"DONE",color:"done",props:["재시도로 복구 (4회 미만)","3중 중복 방지"]},impact:"\n· 재시도가 없다면 빈번하게 발생할 수 있는 네트워크 장애로 결제가 그대로 실패\n· 일시적 장애가 매출 손실로 이어지는 경로 차단",hops:[
      {edge:"browser>payment",kind:"normal",label:"confirm"},
      {edge:"payment>pg",kind:"normal",label:"commands.confirm 발행"},
      {edge:"pg>vendor",kind:"normal",label:"승인 호출"},
      {edge:"vendor>pg",kind:"fail",label:"5xx / timeout (PgGatewayRetryableException)"},
      {edge:"pg~self",kind:"retry",label:"self-loop 재발행 · 간격 늘림 · 횟수 +1",why:{tag:"설계 의도",text:"시도 횟수를 DB(pg_inbox.attempt)에 주문 단위로 기록해 한도(4회)까지 관리한다.",dref:4}},
      {edge:"pg>vendor",kind:"retry",label:"재호출 (4회 미만)"},
      {edge:"vendor>pg",kind:"recover",label:"APPROVED"},
      {edge:"pg>payment",kind:"recover",label:"events.confirmed",state:"IN_PROGRESS → DONE"},
      {edge:"payment>product",kind:"recover",label:"stock-committed"}
    ]},
    {name:"EOS abort · DLQ 재주입",outcome:{status:"DONE",color:"done",props:["관리자 재주입으로 복구","멱등 재처리"]},impact:"\n· 메시지가 유실되면 벤더 승인은 완료됐지만 주문은 미완으로 남음\n· 건별 확인·환불 대응이 필요한 정산 불일치 발생\n· DLQ 보존과 원 토픽 재주입으로 전량 복구 보장",hops:[
      {edge:"pg>payment",kind:"normal",label:"events.confirmed 수신"},
      {edge:"payment~self",kind:"fail",label:"결과 확정 커밋 실패 (EOS abort)"},
      {edge:"payment~self",kind:"retry",label:"재전송 · FixedBackOff 1s×5"},
      {edge:"payment>dlq",kind:"fail",label:"events.confirmed.dlq (재시도 소진)",why:{tag:"설계 의도",text:"커밋 실패는 일반 처리 오류와 다른 지점에서 발생하여, 기본 설정으로는 DLQ로 이동하지 않는다. 실패 후처리기를 직접 연결해 DLQ 도달을 보장했다."}},
      {edge:"admin>payment",kind:"recover",label:"reprocess-dlq (관리자 POST)",why:{tag:"수동 개입 이유",text:"자동 재주입 워커를 두지 않고 관리자가 복구 화면에서 직접 트리거한다. 브로커 회복 여부와 재주입 시점을 사람이 판단해 무분별한 재처리를 막는다."}},
      {edge:"dlq>payment",kind:"recover",label:"원 토픽 재발행 · EOS 재처리",why:{tag:"설계 의도",text:"별도 자동 컨슈머 대신 검증된 EOS 파이프라인을 그대로 재사용한다. DONE으로 종결된 지 8일이 지난 건은 멱등 기록이 만료돼 중복 반영 위험이 있어 타임스탬프 게이트로 차단하고 수동 대사로 넘긴다.",dref:3}},
      {edge:"payment>product",kind:"recover",label:"stock-committed · 재고 확정"}
    ]},
    {name:"EOS 재전송 · 재고 확정 보상 재발행",outcome:{status:"DONE",color:"done",props:["상태 재전이 차단","재고 확정만 보상 재발행"]},impact:"\n· 재고 확정 이벤트가 유실된 채 종결되면 결제는 완료인데 재고는 미확정으로 잔류\n· 재전송을 신호 삼아 누락 이벤트만 다시 발행해 결제·재고 정합 회복",hops:[
      {edge:"pg>payment",kind:"normal",label:"events.confirmed APPROVED 수신"},
      {edge:"payment~self",kind:"normal",label:"DB 커밋: IN_PROGRESS → DONE (선행·별도 TX)",state:"→ DONE",why:{tag:"분리 커밋 이유",text:"DB 상태 커밋과 Kafka 커밋(오프셋 + stock-committed 발행)은 한 트랜잭션으로 묶을 수 없다. DB를 먼저 별도로 커밋하고, 재고 확정 발행과 오프셋만 EOS로 원자 커밋한다 · 그 사이 크래시하면 DB만 DONE으로 남는다.",dref:5}},
      {edge:"payment~self",kind:"fail",label:"Kafka EOS 커밋 유실 (오프셋 미커밋 · stock-committed 미발행)"},
      {edge:"payment~self",kind:"retry",label:"events.confirmed 재전송 (오프셋 미커밋)"},
      {edge:"payment~self",kind:"recover",label:"종결 가드 · 전이 스킵 (이미 DONE)",state:"DONE 유지",why:{tag:"처리 방식",text:"종결 가드는 상태 재전이만 막는다. DB는 DONE인데 재고 확정 이벤트만 유실된 재전송이면, 상태는 그대로 두고 그 이벤트만 다시 발행한다.",dref:5}},
      {edge:"payment>product",kind:"recover",label:"stock-committed 재발행 · 멱등 흡수"}
    ]},
    {name:"격리 · 관리자 안전 종결",outcome:{status:"FAILED",color:"failed",props:["안전 종결","유령 재고 0","감사 기록"]},impact:"\n· 격리 건을 임의로 성공 처리하면 입금 없는 유령 매출, 맹목 복원하면 유령 재고 발생\n· 실패 종결 단일 경로와 조건부 복원이 두 손실 모두 차단",hops:[
      {edge:"browser>payment",kind:"normal",label:"confirm 진입 · 재고 선차감"},
      {edge:"payment>redis",kind:"normal",label:"선차감 완료 · 상품별 차감 표식 기록",why:{tag:"핵심 이유",text:"선차감이 성공하면 Redis 재고 캐시에 차감 표식을 남긴다(TTL 8일). 키는 주문이 아니라 상품마다 따로 찍힌다(decrement:done:{productId}:orderId) · '이 주문이 이 상품을 차감했다'는 원본 기록이자 멱등 키다."}},
      {edge:"payment>pg",kind:"normal",label:"commands.confirm 발행 (outbox relay)"},
      {edge:"pg>vendor",kind:"normal",label:"PG 승인 호출"},
      {edge:"pg>payment",kind:"warn",label:"events.confirmed QUARANTINED 수신 (PG 재시도 소진 → 자동 격리)",state:"→ QUARANTINED"},
      {edge:"payment~self",kind:"warn",label:"폴링 PROCESSING에 멈춤 (종결 상태가 아님)",why:{tag:"대기 이유",text:"QUARANTINED는 종결이 아니다 · 자동 처리가 불가능한 상태라 자동으로 끝내지 않고 관리자 확인을 기다린다."}},
      {edge:"admin>payment",kind:"recover",label:"resolve-quarantine (관리자 POST)"},
      {edge:"payment>redis",kind:"recover",label:"차감 표식 있음 → 재고 복원",why:{tag:"설계 의도",text:"복원 Lua가 그 상품의 차감 표식 존재를 먼저 확인하고, 주문에 담긴 상품마다 한 번씩 수행된다. 이 건은 선차감이 됐으니 복원되지만, 캐시 장애로 선차감 전에 격리된 건은 표식이 없어 보상을 건너뛴다 · 차감한 적 없는 건까지 복원해 유령 재고가 생기는 걸 막는다.",dref:2}},
      {edge:"payment~self",kind:"recover",label:"조건부 갱신: status=QUARANTINED → FAILED (order 동조)",state:"QUARANTINED → FAILED",why:{tag:"종결 정책",text:"격리 진입은 벤더 승인 전이라 실제 결제가 발생하지 않았다. DONE으로 복구하면 유령 매출 · 안전 실패 종결만 지원한다.",dref:1}}
    ]},
    {name:"재고 부족 · 즉시 실패",outcome:{status:"FAILED",color:"failed",props:["초과 판매 0","409 즉시 반환"]},impact:"\n· 재고 없는 결제를 승인하면 배송 불가 주문이 생겨 보상·고객 응대 비용 발생\n· 확정 전에 거절해 그런 주문 자체를 원천 차단",hops:[
      {edge:"browser>payment",kind:"normal",label:"confirm 진입"},
      {edge:"payment>redis",kind:"fail",label:"Lua 원자 차감 REJECTED (재고 부족)",state:"READY → FAILED",why:{tag:"선차감 이유",text:"재고를 선점한 후 확정을 진행한다. 재고를 못 잡으면 그 자리에서 실패 처리한다 · 초과 판매 가능성을 원천 차단한다."}}
    ]},
    {name:"재고 차감 후 저장 실패 · 자동 복구 배제",outcome:{status:"FAILED",color:"failed",props:["초과 판매 0","미복구 수량 지표화"]},impact:"\n· 저장 실패 후 자동 롤백을 시도하다 크래시하면 차감만 남고 복구 기록은 유실\n· 자동 복구를 포기하고 미복구 수량을 지표로 노출 · 초과 판매 없이 수동 회수",hops:[
      {edge:"browser>payment",kind:"normal",label:"confirm 진입"},
      {edge:"payment>redis",kind:"normal",label:"Lua 원자 차감 성공"},
      {edge:"payment~self",kind:"fail",label:"DB 확정 저장 실패",why:{tag:"설계 결정",text:"자동 롤백 도중 크래시하면 차감 기록만 남고 복구 내역은 유실돼 추적 불가한 불일치가 된다. 그래서 차감을 되돌리지 않고 그대로 둔다.",dref:0}},
      {edge:"payment~self",kind:"warn",label:"미복구 카운터 +1 · 차감 유지 (보상 없음)",why:{tag:"지표 노출 이유",text:"보상 없이 남은 차감을 미복구 카운터로 올려 Prometheus에 노출한다. 자동으로 되돌리지 않은 손실을 사람이 볼 수 있게 만드는 신호다."}},
      {edge:"admin>payment",kind:"recover",label:"운영자 지표 확인 → 수동 회수",why:{tag:"수동 개입 결정",text:"미복구 카운터가 오르면 운영자가 원인을 확인하고 재고를 직접 회수한다. 자동 복구를 두지 않은 만큼 마지막 정합은 사람이 맞춘다."}}
    ]},
    {name:"재고 캐시 장애 · 격리",outcome:{status:"QUARANTINED",color:"quar",props:["보수적 격리","409 반환"]},impact:"\n· 차감 여부를 모른 채 진행하면 초과 판매 혹은 유령 재고 발생\n· 보수적 격리는 어느 쪽도 발생시키지 않음",hops:[
      {edge:"browser>payment",kind:"normal",label:"confirm 진입"},
      {edge:"payment>redis",kind:"warn",label:"CACHE_DOWN · 재고 판단 불가",state:"READY → QUARANTINED",why:{tag:"격리 이유",text:"캐시 장애로 인해 차감 여부를 확정할 수 없다. 임의 진행 대신 격리해 수동 판단을 기다린다 · 보수적 방향."}}
    ]},
    {name:"금액 불일치 · 격리",outcome:{status:"QUARANTINED",color:"quar",props:["양방향 방어","위변조 차단"]},impact:"\n· 승인 금액이 다른 결제 발생 시 차액만큼 손실 발생\n· 주문 금액과의 재검증으로 손실 차단",hops:[
      {edge:"pg>payment",kind:"normal",label:"events.confirmed APPROVED 수신"},
      {edge:"payment~self",kind:"warn",label:"금액 재검증 불일치",state:"→ QUARANTINED",why:{tag:"격리 이유",text:"PG가 승인 금액을 반드시 채워 보내고, payment가 주문 금액과 다시 대조한다. 어긋나면 즉시 격리 처리한다 · 위변조나 계약 위반의 신호이기 때문이다."}}
    ]},
    {name:"PG 한도 소진 · 자동 격리",outcome:{status:"QUARANTINED",color:"quar",props:["무한 재시도 차단","금전 손실 0"]},impact:"\n· 한도 없이 재시도하면 벤더 호출 비용·중복 승인 위험이 장애 시간에 비례해 누적\n· 한도에서 멈춰 격리하면 실패 결제가 유실 없이 추적 가능한 상태로 남아 관리자 판단 대기",hops:[
      {edge:"browser>payment",kind:"normal",label:"confirm"},
      {edge:"payment>pg",kind:"normal",label:"commands.confirm"},
      {edge:"pg>vendor",kind:"normal",label:"승인 호출"},
      {edge:"vendor>pg",kind:"fail",label:"5xx / timeout"},
      {edge:"pg~self",kind:"retry",label:"self-loop 재시도 · 횟수 +1"},
      {edge:"pg>dlq",kind:"fail",label:"attempt ≥ 4 소진 → commands.confirm.dlq",why:{tag:"DLQ 활용 이유",text:"무한 재시도 대신 한도(4)에서 멈춘다. DLQ로 보내 안전하게 자동 격리 · 보수적인 접근이다(금전 손실 0)."}},
      {edge:"pg>payment",kind:"warn",label:"PgDlqService → events.confirmed QUARANTINED",state:"→ QUARANTINED"}
    ]},
    {name:"만료 · READY 방치 종결",outcome:{status:"EXPIRED",color:"expired",props:["미확정 정리","폴링 종결"]},impact:"\n· 확정 없이 READY로 남은 결제는 폴링 응답이 종결되지 못한 채 누적\n· 만료 스케줄러가 임계 시간 뒤 EXPIRED로 종결해 정리",hops:[
      {edge:"browser>payment",kind:"normal",label:"checkout · READY 생성",state:"→ READY"},
      {edge:"payment~self",kind:"warn",label:"만료 스케줄러 종결 (임계 시간 초과)",state:"READY → EXPIRED",why:{tag:"만료 정책",text:"확정 없이 방치된 READY 결제를 만료 스케줄러가 임계 시간(기본 30분) 뒤 EXPIRED로 종결한다 · 미확정 결제가 종결되지 못한 채 무한정 남지 않게 한다."}}
    ]}
  ];

export const SCN_WHEN = [
    "모든 구성 요소가 정상일 때의 기본 경로다.",
    "PG사가 일시적으로 5xx나 타임아웃을 반환할 때 · 네트워크 순단, 벤더 순간 과부하. 가장 빈번한 장애 유형이다.",
    "결과 확정 커밋이 반복 실패해(브로커 장애 등) 결과 메시지가 DLQ에 쌓였을 때. 브로커가 회복되면 관리자가 원래 토픽으로 재주입한다.",
    "결제 상태는 DONE으로 커밋됐지만 재고 확정 이벤트(stock-committed) 발행이 유실된 채 메시지가 재전송될 때.",
    "캐시 장애·금액 불일치·재시도 소진 등으로 시스템이 스스로 판단할 수 없어 격리(QUARANTINED)된 결제가 남았을 때. 관리자가 상황을 확인한 뒤 재고를 되돌리고 실패로 안전하게 종결한다.",
    "확정 시점에 남은 재고가 주문 수량보다 적을 때. 가장 흔한 정상적 실패다.",
    "재고 선차감은 성공했는데, 그 결과를 확정 저장하는 단계에서 DB 장애로 실패할 때 (극단적 장애).",
    "재고 Redis 자체에 장애가 발생하여 차감 가능 여부를 알 수 없을 때.",
    "PG 승인 금액이 주문 금액과 다를 때 · 요청 위변조 또는 벤더 계약 위반 신호.",
    "PG사 장애가 길어져 재시도 한도 4회를 모두 소진했을 때.",
    "결제가 확정 없이 READY 상태로 임계 시간(기본 30분) 넘게 방치될 때."
  ];

export const SCN_OBS = [
    ["payment_transition_total{to=DONE}"],
    ["payment_transition_total{to=DONE}"],
    ["payment_eos_commit_failure_dlq_total","payment_dlq_reprocess_total"],
    ["payment_confirm_terminal_resend_total"],
    ["payment_transition_total{QUARANTINED→FAILED}"],
    ["payment_transition_total{to=FAILED}"],
    ["stock_retention_unrecovered_total"],
    ["payment_quarantined_total{reason=CACHE_DOWN}"],
    ["payment_quarantined_total{reason=AMOUNT_MISMATCH}"],
    ["pg_retry_exhausted_quarantine_total","payment_quarantined_total"],
    ["payment_transition_total{to=EXPIRED}"]
  ];

export const SCN_MATRIX = [
    ["정상 결제","done","확정","즉시 완료","payment_transition_total"],
    ["PG 5xx 재시도 복구","done","확정","self-loop 재시도 (4회 미만)","PG 재시도"],
    ["EOS abort DLQ 재주입","done","확정 (재처리)","DLQ 원 토픽 재주입","eos_commit_failure · dlq_reprocess"],
    ["EOS 재전송 보상 재발행","done","재고 확정 보상","이벤트만 재발행 (상태 유지)","confirm_terminal_resend"],
    ["격리 관리자 종결","failed","키 조건부 보상","관리자 안전 종결 (조건부 갱신)","transition QUARANTINED→FAILED"],
    ["재고 부족","failed","미차감","즉시 실패 (409)","transition to=FAILED"],
    ["재고 차감 후 저장 실패","failed","미복구 (지표화)","자동 복구 배제","stock_retention_unrecovered"],
    ["캐시 장애","quar","판단 불가 (보류)","수동 확인 대기","quarantined"],
    ["금액 불일치","quar","보상 위임","격리 (AMOUNT_MISMATCH)","quarantined"],
    ["PG 한도 소진","quar","-","자동 격리","pg_retry_exhausted_quarantine"],
    ["만료 READY 방치 종결","expired","미차감","스케줄러 종결","transition to=EXPIRED"]
  ];
