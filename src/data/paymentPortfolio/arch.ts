// payment-platform 포트폴리오 데이터 · 콘텐츠/지오메트리. 렌더 로직과 분리(유지보수·편집 격리).
// 정본 페이지: src/pages/payment-platform-portfolio/index.astro

export const ARCH_NODES = {
    browser:{x:90,y:60,w:120,h:40,t:"브라우저",s:"CLIENT",color:"infra",role:"결제 요청 시작 (checkout / confirm) + 상태 폴링",store:"-",chan:"HTTP → gateway"},
    gateway:{x:90,y:170,w:120,h:40,t:"gateway",s:"ROUTER",color:"infra",role:"Spring Cloud Gateway · 라우팅 진입점",store:"-",chan:"→ payment · product · user"},
    eureka:{x:620,y:302,w:120,h:40,t:"eureka",s:"DISCOVERY",color:"infra",role:"서비스 디스커버리 · 전 서비스 등록/조회",store:"-",chan:"모든 서비스 discovery"},
    payment:{x:300,y:170,w:150,h:52,t:"payment-service",s:"ORCHESTRATOR",color:"payment",role:"결제 오케스트레이션 · 재고 선차감, outbox 발행, EOS로 결과 확정·재고 반영",store:"MySQL · redis-stock(6380) · redis-dedupe",chan:"Kafka ↔ PG · Kafka → product · HTTP → product/user"},
    pg:{x:560,y:170,w:130,h:52,t:"pg-service",s:"VENDOR GUARD",color:"pg",role:"PG 벤더 호출 격리 · inbox/outbox, self-loop 재시도, 주문번호 UNIQUE 멱등",store:"MySQL (pg_inbox / pg_outbox)",chan:"Kafka ↔ payment · HTTP → vendor"},
    vendor:{x:560,y:60,w:130,h:40,t:"Toss / NicePay",s:"EXTERNAL PG",color:"infra",role:"실제 결제 승인/취소/조회 (Strategy 전환)",store:"-",chan:"← pg (HTTP)"},
    product:{x:300,y:300,w:150,h:44,t:"product-service",s:"STOCK LEDGER",color:"product",role:"상품·재고의 기준 장부 · stock-committed를 받아 실제 차감을 확정",store:"MySQL (재고 원장)",chan:"Kafka ← payment (stock-committed) · HTTP ← payment"},
    user:{x:90,y:300,w:120,h:44,t:"user-service",s:"BUYER",color:"user",role:"구매자 정보 조회 제공",store:"MySQL",chan:"HTTP ← payment · gateway"},
    kafka:{x:430,y:250,w:110,h:38,t:"Kafka",s:"5 TOPICS",color:"infra",role:"비동기 메시지 버스 · 운영 3 + DLQ 2 토픽. payment↔PG confirm 통신, payment→product 재고 확정",store:"-",chan:"commands.confirm · events.confirmed · stock-committed (+2 DLQ)"}
  };

export const ARCH_EDGES = [
    {f:"browser",t:"gateway",d:"M150,80 L150,170",lab:"HTTP",lx:158,ly:128,anchor:"start"},
    {f:"gateway",t:"payment",d:"M150,190 L300,190",lab:"Routing",lx:255,ly:182},
    {f:"gateway",t:"user",d:"M120,190 Q120,260 130,300",lab:"",lx:0,ly:0,dash:1},
    {f:"payment",t:"pg",d:"M450,183 L560,183",lab:"commands.confirm",lx:505,ly:176,bus:1},
    {f:"pg",t:"payment",d:"M560,205 L450,205",lab:"events.confirmed",lx:505,ly:218,bus:1},
    {f:"payment",t:"product",d:"M360,222 L340,300",lab:"stock-committed",lx:342,ly:265,bus:1,anchor:"end"},
    {f:"payment",t:"user",d:"M300,205 Q200,240 160,300",lab:"HTTP",lx:190,ly:255,anchor:"end"},
    {f:"payment",t:"kafka",d:"M420,222 L440,250",lab:"",lx:0,ly:0,dash:1},
    {f:"pg",t:"kafka",d:"M580,222 Q560,245 542,258",lab:"",lx:0,ly:0,dash:1},
    {f:"kafka",t:"product",d:"M460,288 Q445,295 430,300",lab:"",lx:0,ly:0,dash:1},
    {f:"pg",t:"vendor",d:"M620,150 L620,100",lab:"HTTP",lx:628,ly:126,anchor:"start"},
    {f:"payment",t:"eureka",d:"M440,222 Q540,290 620,314",lab:"discovery",lx:557,ly:303,dash:1,anchor:"start"},
    {f:"pg",t:"eureka",d:"M640,222 L668,302",lab:"",lx:0,ly:0,dash:1}
  ];
