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
    {name:"정상 결제",grp:"정상 · 재시도",outcome:{status:"DONE",color:"done",props:["재고 확정 멱등 흡수","EOS 원자 커밋"]},hops:[
      {edge:"browser>payment",kind:"normal",label:"checkout · confirm",state:"READY → IN_PROGRESS"},
      {edge:"payment>redis",kind:"normal",label:"재고 선차감 (Lua atomic)"},
      {edge:"payment>pg",kind:"normal",label:"commands.confirm 발행"},
      {edge:"pg>vendor",kind:"normal",label:"승인 호출 (strategy.confirm)"},
      {edge:"vendor>pg",kind:"normal",label:"APPROVED (승인 금액·시각)"},
      {edge:"pg>payment",kind:"normal",label:"events.confirmed",state:"IN_PROGRESS → DONE"},
      {edge:"payment>product",kind:"normal",label:"stock-committed · 재고 확정 (결정적 키)"}
    ]},
    {name:"PG 5xx · 재시도로 복구",grp:"정상 · 재시도",outcome:{status:"DONE",color:"done",props:["재시도로 복구 (4회 미만)","3중 중복 방지"]},impact:"\n· 재시도가 없다면 빈번하게 발생할 수 있는 네트워크 장애로 결제가 그대로 실패\n· 일시적 장애가 매출 손실로 이어지는 경로 차단",hops:[
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
    {name:"회신 지연 · 늦은 결과 그대로 수용",grp:"정상 · 재시도",outcome:{status:"DONE",color:"done",props:["늦은 결과 수용","재처리 유발 없음"]},impact:"\n· 회신이 늦다고 실패로 끝내면 PG는 승인했는데 주문만 실패로 남는 어긋남 발생\n· 되돌리는 대신 회신 대기 자리로 옮겨 뒤늦은 결과를 그대로 반영",hops:[
      {edge:"browser>payment",kind:"normal",label:"confirm · 선차감 · 확정 저장",state:"READY → IN_PROGRESS"},
      {edge:"payment>pg",kind:"normal",label:"commands.confirm 발행"},
      {edge:"pg>vendor",kind:"normal",label:"PG 승인 호출 · 회신 지연"},
      {edge:"payment~self",kind:"warn",label:"복구 스케줄러 1차 · 오래 머문 확정 건을 회신 대기로",state:"IN_PROGRESS → AWAITING_RESULT",why:{tag:"되돌리는 이유",text:"이 되돌리기는 재처리를 부르지 않는다 · 확정 명령 재발행은 발행 대기열이 따로 맡는다. 회신 대기는 늦게 도착한 결과를 그대로 반영해도 된다는 표시다."}},
      {edge:"pg>payment",kind:"recover",label:"뒤늦은 events.confirmed APPROVED",state:"AWAITING_RESULT → DONE"},
      {edge:"payment>product",kind:"recover",label:"stock-committed · 재고 확정"}
    ]},
    {name:"발행 직전 서버 다운 · 대기열이 재개",grp:"끊긴 뒤 재개",outcome:{status:"DONE",color:"done",props:["명령 유실 0","재기동 후 자동 재개"]},impact:"\n· 명령을 못 보낸 채 서버가 내려가면 재고는 선차감됐는데 결제는 영영 확정 진행 중\n· 확정 저장과 명령 적재를 한 트랜잭션으로 묶어, 재기동 뒤 워커가 이어받아 끝까지 처리",hops:[
      {edge:"browser>payment",kind:"normal",label:"confirm · 선차감 · 확정 저장",state:"READY → IN_PROGRESS",why:{tag:"한 트랜잭션인 이유",text:"확정 저장과 PG 명령의 대기열 적재가 한 트랜잭션이다 · 202 응답은 이 둘이 함께 커밋됐다는 뜻이라, 응답을 받은 결제는 발행이 남아 있어도 잃어버리지 않는다."}},
      {edge:"payment~self",kind:"fail",label:"명령 발행 전 서버 다운",state:"IN_PROGRESS 유지",why:{tag:"남는 것",text:"PG 명령은 대기열에 적힌 채 남는다 · 결제 상태도 확정 진행 중 그대로다."}},
      {edge:"payment~self",kind:"recover",label:"대기열 워커가 발행 대기 중인 명령 재픽업",why:{tag:"한도를 두지 않은 이유",text:"발행이 실패해도 트랜잭션이 통째로 되돌아가 대기 상태 그대로라 같은 재픽업으로 회복된다 · 재시도 한도는 두지 않았다. 발행을 못 한 채 결제를 끝내면 선차감을 되돌려야 하는 빚이 생긴다."}},
      {edge:"payment>pg",kind:"recover",label:"commands.confirm 발행"},
      {edge:"pg>vendor",kind:"recover",label:"PG 승인 호출"},
      {edge:"pg>payment",kind:"recover",label:"events.confirmed APPROVED",state:"IN_PROGRESS → DONE"},
      {edge:"payment>product",kind:"recover",label:"stock-committed · 재고 확정"}
    ]},
    {name:"PG 승인 중 서버 다운 · 좀비 회수",grp:"끊긴 뒤 재개",outcome:{status:"DONE",color:"done",props:["중복 승인 0","과금 유실 0"]},impact:"\n· 승인 요청이 나간 뒤 죽으면 과금은 살아 있는데 주문만 미완으로 남음\n· 멈춰 선 수신함 행을 회수해 재진입하고, 이미 처리된 승인은 금액 대조 뒤 그대로 종결",hops:[
      {edge:"payment>pg",kind:"normal",label:"commands.confirm 수신 · 수신함 적재"},
      {edge:"pg~self",kind:"fail",label:"처리 중으로 선점한 뒤 승인 호출 도중 서버 다운",state:"수신함 IN_PROGRESS 잔존",why:{tag:"위험한 구간",text:"승인 요청이 이미 벤더에 닿았을 수 있는 자리다 · 그냥 버리면 과금만 남고 주문은 사라진다."}},
      {edge:"pg~self",kind:"recover",label:"좀비 회수 폴링이 임계 시간 넘긴 수신함 행 집음",why:{tag:"회수 대상",text:"처리 중까지 갔다가 결과 전이를 못 하고 갱신이 멈춘 행이다 · 원래 요청의 추적 정보를 복원해 같은 흐름으로 이어 붙인다."}},
      {edge:"pg>vendor",kind:"retry",label:"재진입 · 승인 재호출"},
      {edge:"vendor>pg",kind:"recover",label:"이미 처리됨 응답",why:{tag:"중복 승인 방어",text:"승인 금액을 주문 금액과 먼저 대조하고, 맞으면 그 조회 결과로 승인 종결한다 · 어긋나면 격리로 보낸다. 벤더를 다시 부르더라도 승인이 두 번 잡히지는 않는다."}},
      {edge:"pg>payment",kind:"recover",label:"events.confirmed APPROVED",state:"→ DONE"},
      {edge:"payment>product",kind:"recover",label:"stock-committed · 재고 확정"}
    ]},
    {name:"EOS abort · DLQ 재주입",grp:"끊긴 뒤 재개",outcome:{status:"DONE",color:"done",props:["관리자 재주입으로 복구","멱등 재처리"]},impact:"\n· 메시지가 유실되면 벤더 승인은 완료됐지만 주문은 미완으로 남음\n· 건별 확인·환불 대응이 필요한 정산 불일치 발생\n· DLQ 보존과 원 토픽 재주입으로 전량 복구 보장",hops:[
      {edge:"pg>payment",kind:"normal",label:"events.confirmed 수신"},
      {edge:"payment~self",kind:"fail",label:"결과 확정 커밋 실패 (EOS abort)"},
      {edge:"payment~self",kind:"retry",label:"재전송 · FixedBackOff 1s×5"},
      {edge:"payment>dlq",kind:"fail",label:"events.confirmed.dlq (재시도 소진)",why:{tag:"설계 의도",text:"커밋 실패는 일반 처리 오류와 다른 지점에서 발생하여, 기본 설정으로는 DLQ로 이동하지 않는다. 실패 후처리기를 직접 연결해 DLQ 도달을 보장했다."}},
      {edge:"admin>payment",kind:"recover",label:"reprocess-dlq (관리자 POST)",why:{tag:"수동 개입 이유",text:"자동 재주입 워커를 두지 않고 관리자가 복구 화면에서 직접 트리거한다. 브로커 회복 여부와 재주입 시점을 사람이 판단해 무분별한 재처리를 막는다."}},
      {edge:"dlq>payment",kind:"recover",label:"원 토픽 재발행 · EOS 재처리",why:{tag:"설계 의도",text:"별도 자동 컨슈머 대신 검증된 EOS 파이프라인을 그대로 재사용한다. DONE으로 종결된 지 8일이 지난 건은 멱등 기록이 만료돼 중복 반영 위험이 있어 타임스탬프 게이트로 차단하고 수동 대사로 넘긴다.",dref:6}},
      {edge:"payment>product",kind:"recover",label:"stock-committed · 재고 확정"}
    ]},
    {name:"EOS 재전송 · 재고 확정 보상 재발행",grp:"끊긴 뒤 재개",outcome:{status:"DONE",color:"done",props:["상태 재전이 차단","재고 확정만 보상 재발행"]},impact:"\n· 재고 확정 이벤트가 유실된 채 종결되면 결제는 완료인데 재고는 미확정으로 잔류\n· 재전송을 신호 삼아 누락 이벤트만 다시 발행해 결제·재고 정합 회복",hops:[
      {edge:"pg>payment",kind:"normal",label:"events.confirmed APPROVED 수신"},
      {edge:"payment~self",kind:"normal",label:"DB 커밋: IN_PROGRESS → DONE (선행·별도 TX)",state:"→ DONE",why:{tag:"분리 커밋 이유",text:"DB 상태 커밋과 Kafka 커밋(오프셋 + stock-committed 발행)은 한 트랜잭션으로 묶을 수 없다. DB를 먼저 별도로 커밋하고, 재고 확정 발행과 오프셋만 EOS로 원자 커밋한다 · 그 사이 크래시하면 DB만 DONE으로 남는다.",dref:5}},
      {edge:"payment~self",kind:"fail",label:"Kafka EOS 커밋 유실 (오프셋 미커밋 · stock-committed 미발행)"},
      {edge:"payment~self",kind:"retry",label:"events.confirmed 재전송 (오프셋 미커밋)"},
      {edge:"payment~self",kind:"recover",label:"종결 가드 · 전이 스킵 (이미 DONE)",state:"DONE 유지",why:{tag:"처리 방식",text:"종결 가드는 상태 재전이만 막는다. DB는 DONE인데 재고 확정 이벤트만 유실된 재전송이면, 상태는 그대로 두고 그 이벤트만 다시 발행한다.",dref:5}},
      {edge:"payment>product",kind:"recover",label:"stock-committed 재발행 · 멱등 흡수"}
    ]},
    {name:"재고 부족 · 즉시 실패",outcome:{status:"FAILED",color:"failed",props:["초과 판매 0","409 즉시 반환"]},impact:"\n· 재고 없는 결제를 승인하면 배송 불가 주문이 생겨 보상·고객 응대 비용 발생\n· 확정 전에 거절해 그런 주문 자체를 원천 차단",hops:[
      {edge:"browser>payment",kind:"normal",label:"confirm 진입"},
      {edge:"payment>redis",kind:"fail",label:"Lua 원자 차감 REJECTED (재고 부족)",state:"READY → FAILED",why:{tag:"선차감 이유",text:"재고를 선점한 후 확정을 진행한다. 재고를 못 잡으면 그 자리에서 실패 처리한다 · 초과 판매 가능성을 원천 차단한다."}}
    ]},
    {name:"재고 차감 후 저장 실패 · 자동 복구 배제",outcome:{status:"FAILED",color:"failed",props:["초과 판매 0","미복구 수량 지표화"]},impact:"\n· 저장 실패 후 자동 롤백을 시도하다 크래시하면 차감만 남고 복구 기록은 유실\n· 그 자리의 자동 복구를 포기하고 미복구 수량을 지표로 노출\n· 초과 판매 없이, 결제가 종결된 뒤 회수 주기 작업이 되돌림",hops:[
      {edge:"browser>payment",kind:"normal",label:"confirm 진입"},
      {edge:"payment>redis",kind:"normal",label:"Lua 원자 차감 성공"},
      {edge:"payment~self",kind:"fail",label:"DB 확정 저장 실패",why:{tag:"설계 결정",text:"자동 롤백 도중 크래시하면 차감 기록만 남고 복구 내역은 유실돼 추적 불가한 불일치가 된다. 그래서 차감을 되돌리지 않고 그대로 둔다.",dref:1}},
      {edge:"payment~self",kind:"warn",label:"미복구 카운터 +1 · 차감 유지 (보상 없음)",why:{tag:"지표 노출 이유",text:"보상 없이 남은 차감을 미복구 카운터로 올려 Prometheus에 노출한다. 자동으로 되돌리지 않은 손실을 사람이 볼 수 있게 만드는 신호다."}},
      {edge:"payment~self",kind:"recover",label:"결제가 종결되면 재고 회수 스케줄러가 되돌림",why:{tag:"뒤늦은 회수",text:"그 자리에서 되돌리지는 않지만 선차감 기록은 남아 있다. 결제가 만료 등으로 종결되면 재고 회수 스케줄러가 그 기록을 집어 재고를 되돌린다 · 지표는 되돌려지기 전까지의 잔량을 보여준다.",dref:7}}
    ]},
    {name:"격리 · 관리자 안전 종결",outcome:{status:"FAILED",color:"failed",props:["안전 종결","유령 재고 0","감사 기록"]},impact:"\n· 격리 건을 임의로 성공 처리하면 입금 없는 유령 매출, 맹목 복원하면 유령 재고 발생\n· 종결 전 벤더 조회로 승인 건을 걸러냄\n· 실패 종결 단일 경로와 조건부 복원이 두 손실 모두 차단",hops:[
      {edge:"browser>payment",kind:"normal",label:"confirm 진입 · 재고 선차감"},
      {edge:"payment>redis",kind:"normal",label:"선차감 완료 · 상품별 차감 표식 기록",why:{tag:"핵심 이유",text:"선차감이 성공하면 Redis 재고 캐시에 차감 표식을 남긴다(TTL 8일). 키는 주문이 아니라 상품마다 따로 찍힌다(decrement:done:{productId}:orderId) · '이 주문이 이 상품을 차감했다'는 원본 기록이자 멱등 키다."}},
      {edge:"payment>pg",kind:"normal",label:"commands.confirm 발행 (outbox relay)"},
      {edge:"pg>vendor",kind:"normal",label:"PG 승인 호출"},
      {edge:"pg>payment",kind:"warn",label:"events.confirmed QUARANTINED 수신 (PG 재시도 소진 → 자동 격리)",state:"→ QUARANTINED"},
      {edge:"payment~self",kind:"warn",label:"폴링 PROCESSING에 멈춤 (종결 상태가 아님)",why:{tag:"대기 이유",text:"QUARANTINED는 종결이 아니다 · 자동 처리가 불가능한 상태라 자동으로 끝내지 않고 관리자 확인을 기다린다."}},
      {edge:"admin>payment",kind:"recover",label:"resolve-quarantine (관리자 POST)"},
      {edge:"payment>pg",kind:"recover",label:"벤더 상태 조회 · 승인 확인되면 종결 거부",why:{tag:"판정이 먼저인 이유",text:"격리는 승인이 났는지 모르는 상태다. 과금이 살아 있는 건을 실패로 정리하면 되돌릴 수 없어, 재고를 되돌리기 전에 PG에 먼저 물어 승인 건을 걸러낸다 · 조회가 안 되면 종결을 막지 않고 그 결과를 사유에 적어 남긴다."}},
      {edge:"payment>redis",kind:"recover",label:"차감 표식 있음 → 재고 복원",why:{tag:"설계 의도",text:"복원 Lua가 그 상품의 차감 표식 존재를 먼저 확인하고, 주문에 담긴 상품마다 한 번씩 수행된다. 이 건은 선차감이 됐으니 복원되지만, 캐시 장애로 선차감 전에 격리된 건은 표식이 없어 보상을 건너뛴다 · 차감한 적 없는 건까지 복원해 유령 재고가 생기는 걸 막는다.",dref:3}},
      {edge:"payment~self",kind:"recover",label:"조건부 갱신: status=QUARANTINED → FAILED (order 동조)",state:"QUARANTINED → FAILED",why:{tag:"종결 정책",text:"푸는 방향은 실패 종결 하나뿐이다 · DONE으로 되살리는 경로는 두지 않았다. 승인이 확인된 건은 앞 단계에서 이미 거부되고, 실패·확인 불가만 여기까지 온다."}}
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
    {name:"회신 없음 · 자동 격리",outcome:{status:"QUARANTINED",color:"quar",props:["임의 종결 차단","선차감 유지"]},impact:"\n· 회신이 끝내 오지 않는 결제를 임의로 성공·실패 처리하면 PG 기록과 어긋남\n· 격리로 남겨 사람이 대조 · 종결 시점에 선차감도 함께 정리",hops:[
      {edge:"browser>payment",kind:"normal",label:"confirm · 선차감 · 확정 저장",state:"READY → IN_PROGRESS"},
      {edge:"payment>pg",kind:"normal",label:"commands.confirm 발행"},
      {edge:"payment~self",kind:"warn",label:"복구 스케줄러 1차 · 회신 대기로",state:"IN_PROGRESS → AWAITING_RESULT"},
      {edge:"payment~self",kind:"warn",label:"2차 임계도 넘김 · 자동 격리",state:"AWAITING_RESULT → QUARANTINED",why:{tag:"격리 이유",text:"회신이 끝내 오지 않은 경우다. 승인이 났는지 모르는 채로 끝내지 않고, 사람이 PG 기록과 대조하도록 넘긴다."}},
      {edge:"payment>redis",kind:"warn",label:"선차감은 그대로 남음",why:{tag:"자동 회수 제외",text:"격리는 종결이 아니라서 재고 회수 스케줄러가 집지 않는다 · 뒤늦게 승인이 확인될 수 있는 건의 재고를 미리 되살리지 않는다.",dref:7}},
      {edge:"admin>payment",kind:"recover",label:"관리자 안전 종결 → 조건부 복원"}
    ]},
    {name:"만료 · READY 방치 종결",outcome:{status:"EXPIRED",color:"expired",props:["미확정 정리","폴링 종결"]},impact:"\n· 확정 없이 READY로 남은 결제는 폴링 응답이 종결되지 못한 채 누적\n· 만료 스케줄러가 임계 시간 뒤 EXPIRED로 종결해 정리",hops:[
      {edge:"browser>payment",kind:"normal",label:"checkout · READY 생성",state:"→ READY"},
      {edge:"payment~self",kind:"warn",label:"만료 스케줄러 종결 (임계 시간 초과)",state:"READY → EXPIRED",why:{tag:"만료 정책",text:"확정 없이 방치된 READY 결제를 만료 스케줄러가 임계 시간(기본 30분) 뒤 EXPIRED로 종결한다 · 미확정 결제가 종결되지 못한 채 무한정 남지 않게 한다."}}
    ]},
    {name:"확정 저장 전 서버 다운 · 선차감 자동 회수",outcome:{status:"EXPIRED",color:"expired",props:["초과 판매 0","선차감 자동 회수"]},impact:"\n· 선차감만 남고 결제가 끊기면 팔 수 있는 재고가 묶인 채 방치\n· 진짜 재고는 승인 뒤에만 빠져 초과 판매 방향은 아니지만, 회수가 없으면 팔 기회만 계속 줄어듦\n· 결제가 종결된 뒤 자동 회수로 묶인 재고 해소",hops:[
      {edge:"browser>payment",kind:"normal",label:"confirm 진입",state:"→ READY"},
      {edge:"payment>redis",kind:"normal",label:"선차감 기록 먼저 남기고 재고 차감",why:{tag:"기록이 먼저인 이유",text:"재고를 먼저 깎고 기록을 남기면, 그 사이 서버가 내려갔을 때 깎인 재고가 회수 대상에서 빠져 영영 묶인다. 반대로 기록만 있고 차감이 없으면 회수가 흔적을 못 찾아 그냥 넘어가므로 문제가 없다 · 일부러 안전한 쪽으로 실패하게 둔 순서다."}},
      {edge:"payment~self",kind:"fail",label:"확정 저장 전 서버 다운",state:"READY 유지",why:{tag:"남는 것",text:"확정 저장이 커밋되지 않아 결제는 접수 상태에 머문다 · 재고 선차감과 그 기록만 남는다."}},
      {edge:"payment~self",kind:"warn",label:"만료 스케줄러 종결 (임계 시간 초과)",state:"READY → EXPIRED"},
      {edge:"payment~self",kind:"recover",label:"재고 회수 스케줄러가 미회수 선차감 기록 집음",why:{tag:"종결된 건만 회수",text:"회수 대상은 결제가 이미 끝났는데 되돌려지지 않은 선차감뿐이다. 진행 중인 결제의 선차감을 되돌리면 아직 살아 있는 확정 흐름의 재고를 되살려 초과 판매가 된다.",dref:7}},
      {edge:"payment>redis",kind:"recover",label:"차감 표식 확인 후 재고 복원 · 기록 닫기"}
    ]}
  ];

export const SCN_WHEN = [
    "모든 구성 요소가 정상일 때의 기본 경로다.",
    "PG사가 일시적으로 5xx나 타임아웃을 반환할 때 · 네트워크 순단, 벤더 순간 과부하. 가장 빈번한 장애 유형이다.",
    "PG 회신이 늦어 결제가 확정 진행 중으로 오래 머물 때. 뒤늦게 결과가 오면 그대로 반영된다.",
    "확정은 저장됐는데 PG 명령을 발행하기 전에 payment 인스턴스가 내려갈 때. 명령은 발행 대기열에 적힌 채 남는다.",
    "PG가 승인 호출을 진행하던 중 인스턴스가 내려가, 수신함 행이 처리 중에서 멈출 때.",
    "결과 확정 커밋이 반복 실패해(브로커 장애 등) 결과 메시지가 DLQ에 쌓였을 때. 브로커가 회복되면 관리자가 원래 토픽으로 재주입한다.",
    "결제 상태는 DONE으로 커밋됐지만 재고 확정 이벤트(stock-committed) 발행이 유실된 채 메시지가 재전송될 때.",
    "확정 시점에 남은 재고가 주문 수량보다 적을 때. 가장 흔한 정상적 실패다.",
    "재고 선차감은 성공했는데, 그 결과를 확정 저장하는 단계에서 DB 장애로 실패할 때 (극단적 장애).",
    "캐시 장애·금액 불일치·재시도 소진 등으로 시스템이 스스로 판단할 수 없어 격리(QUARANTINED)된 결제가 남았을 때. 관리자가 종결을 요청하면 벤더 상태를 먼저 조회해 승인 건을 걸러낸 뒤, 재고를 되돌리고 실패로 안전하게 종결한다.",
    "재고 Redis 자체에 장애가 발생하여 차감 가능 여부를 알 수 없을 때.",
    "PG 승인 금액이 주문 금액과 다를 때 · 요청 위변조 또는 벤더 계약 위반 신호.",
    "PG사 장애가 길어져 재시도 한도 4회를 모두 소진했을 때.",
    "PG 회신이 끝내 오지 않아 회신 대기 상태로도 임계 시간을 넘길 때.",
    "결제가 확정 없이 READY 상태로 임계 시간(기본 30분) 넘게 방치될 때.",
    "재고 선차감은 됐는데 그 결과를 확정 저장하기 전에 payment 인스턴스가 내려갈 때. 결제는 접수 상태로 남고 선차감만 떠 있다."
  ];

export const SCN_OBS = [
    ["payment_transition_total{to=DONE}"],
    ["payment_transition_total{to=DONE}"],
    ["payment_transition_total{to=AWAITING_RESULT}","payment_transition_total{to=DONE}"],
    ["payment_outbox_pending_count","payment_outbox_oldest_pending_age_seconds"],
    ["pg_inbox_zombie_recovered_total{status=IN_PROGRESS}"],
    ["payment_eos_commit_failure_dlq_total","payment_dlq_reprocess_total"],
    ["payment_confirm_terminal_resend_total"],
    ["payment_transition_total{to=FAILED}"],
    ["stock_retention_unrecovered_total"],
    ["payment_transition_total{QUARANTINED→FAILED}"],
    ["payment_quarantined_total{reason=CACHE_DOWN}"],
    ["payment_quarantined_total{reason=AMOUNT_MISMATCH}"],
    ["pg_retry_exhausted_quarantine_total","payment_quarantined_total"],
    ["payment_transition_total{to=QUARANTINED,trigger=RECONCILER}"],
    ["payment_transition_total{to=EXPIRED}"],
    ["stock_hold_recovery_outstanding_count","stock_hold_revert_result_total{result=reverted}"]
  ];

export const SCN_MATRIX = [
    ["정상 결제","done","확정","즉시 완료","payment_transition_total"],
    ["PG 5xx 재시도 복구","done","확정","self-loop 재시도 (4회 미만)","PG 재시도"],
    ["회신 지연 · 늦은 결과 수용","done","확정","복구 스케줄러 되돌림 · 늦은 결과 수용","transition to=AWAITING_RESULT"],
    ["발행 직전 서버 다운","done","선차감 유지","대기열 워커가 재픽업해 처리","payment_outbox_pending_count"],
    ["PG 승인 중 서버 다운","done","확정","좀비 회수 재진입 · 중복 승인 방어","pg_inbox_zombie_recovered"],
    ["EOS abort DLQ 재주입","done","확정 (재처리)","DLQ 원 토픽 재주입","eos_commit_failure · dlq_reprocess"],
    ["EOS 재전송 보상 재발행","done","재고 확정 보상","이벤트만 재발행 (상태 유지)","confirm_terminal_resend"],
    ["재고 부족","failed","미차감","즉시 실패 (409)","transition to=FAILED"],
    ["재고 차감 후 저장 실패","failed","미복구 (지표화)","즉시 복구 배제 · 종결 후 회수","stock_retention_unrecovered"],
    ["격리 관리자 종결","failed","키 조건부 보상","관리자 안전 종결 (조건부 갱신)","transition QUARANTINED→FAILED"],
    ["캐시 장애","quar","판단 불가 (보류)","수동 확인 대기","quarantined"],
    ["금액 불일치","quar","보상 위임","격리 (AMOUNT_MISMATCH)","quarantined"],
    ["PG 한도 소진","quar","-","자동 격리","pg_retry_exhausted_quarantine"],
    ["회신 없음 · 자동 격리","quar","선차감 유지","복구 스케줄러 2차 격리","transition trigger=RECONCILER"],
    ["만료 READY 방치 종결","expired","미차감","스케줄러 종결","transition to=EXPIRED"],
    ["확정 저장 전 서버 다운","expired","선차감 자동 회수","만료 종결 후 스케줄러 회수","stock_hold_recovery_outstanding"]
  ];
