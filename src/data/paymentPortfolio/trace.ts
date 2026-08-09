// payment-platform 포트폴리오 데이터 · 콘텐츠/지오메트리. 렌더 로직과 분리(유지보수·편집 격리).
// 정본 페이지: src/pages/payment-platform-portfolio/index.astro

export const FLOW_LANES = [
    {id:"browser",t:"브라우저",x:62,w:92},
    {id:"payment",t:"payment",x:206,w:96},
    {id:"user",t:"user",x:336,w:64},
    {id:"product",t:"product",x:458,w:88},
    {id:"redis",t:"redis-stock",x:586,w:112},
    {id:"kafka",t:"Kafka",x:706,w:72},
    {id:"pg",t:"pg",x:818,w:52},
    {id:"vendor",t:"vendor",x:930,w:82}
  ];

export const FLOW_STEPS = [
    {st:"① 주문 생성 · checkout",f:"browser",t:"payment",lab:"POST /checkout + 멱등키"},
    {f:"payment",t:"user",lab:"구매자 검증 · HTTP"},
    {f:"payment",t:"product",lab:"상품·가격 확정 · HTTP"},
    {f:"payment",lab:"PaymentEvent READY 저장 → 201"},
    {f:"browser",lab:"PG 결제창 → paymentKey 획득"},
    {st:"② 확정 진입 · confirm",f:"browser",t:"payment",lab:"POST /confirm"},
    {f:"payment",lab:"위변조·상태 가드"},
    {f:"payment",t:"redis",lab:"재고 선차감 · Lua 원자"},
    {f:"payment",lab:"확정 TX · IN_PROGRESS + outbox PENDING"},
    {f:"payment",t:"browser",lab:"202 Accepted"},
    {cut:1},
    {st:"③ 명령 발행 · outbox relay",f:"payment",t:"kafka",lab:"commands.confirm 발행 · 조건부 선점"},
    {st:"④ 벤더 호출 · PG",f:"kafka",t:"pg",lab:"명령 수신 · inbox 등록 (주문번호 UNIQUE)"},
    {f:"pg",lab:"inbox 선점 · SKIP LOCKED"},
    {f:"pg",t:"vendor",lab:"승인 호출"},
    {f:"vendor",t:"pg",lab:"승인 응답 · 승인 금액·시각"},
    {f:"pg",t:"kafka",lab:"events.confirmed 발행"},
    {st:"⑤ 결과 확정 · EOS",f:"kafka",t:"payment",lab:"결과 수신"},
    {f:"payment",lab:"멱등 마킹 · IN_PROGRESS→DONE"},
    {f:"payment",t:"kafka",lab:"stock-committed 발행 · EOS 원자 커밋"},
    {f:"kafka",t:"product",lab:"재고 확정 · 멱등 흡수"},
    {st:"⑥ 결과 조회 · polling",f:"browser",t:"payment",lab:"GET /status 폴링"},
    {f:"payment",t:"browser",lab:"DONE → 완료 페이지"}
  ];
