// payment-platform 포트폴리오 데이터 — 콘텐츠/지오메트리. 렌더 로직과 분리(유지보수·편집 격리).
// 정본 페이지: src/pages/payment-platform-portfolio/index.astro

export const ALERTS = [
    {label:"코디네이터 · EOS",color:"inprog",items:[
      {a:"KafkaCoordinatorTxnAbortRising",d:"· 재고 확정 이벤트 발행과 오프셋 커밋을 묶는 Kafka EOS(Exactly-Once) 트랜잭션이 반복 중단되는 징후\n· 확정 처리가 재시도로 밀리기 시작한 첫 신호\n· 방치 시 실패분이 DLQ까지 유입",m:"커밋 중단이 짧은 간격으로 반복 관측될 때 · 1분 지속"},
      {a:"KafkaCoordinatorLagHigh",d:"· PG 회신 결과(events.confirmed)가 소비되지 못하고 적체\n· 브로커에 도착해도 결제 상태 미반영 — 사용자에겐 계속 '진행 중'으로 노출\n· 파티션 병목·소비 스레드 고갈이 주원인",m:"미소비 적체(consumer lag) 1,000건 초과 · 1분 지속"},
      {a:"KafkaBrokerUnavailable",d:"· Kafka 브로커 자체가 응답하지 않는 최상위 장애\n· 확정 명령·결과 회신이 모두 막혀 비동기 결제 경로 전체 정지\n· 완전 정지 시 지표가 0이 아니라 소멸(absent)하는 사각까지 감지",m:"브로커 수 1 미만 또는 지표 소멸(absent) · 2분 지속"}
    ]},
    {label:"종결 가드",color:"quar",items:[
      {a:"GuardSkipDangerousStatusHigh",d:"· 이미 실패·격리로 종결된 결제에 PG 응답이 뒤늦게 도착해 폐기되는 비율 급증\n· 해당 비율을 서버 이상 신호로 판단",m:"종결 후 폐기된 응답 ÷ 전체 종결 처리 10% 초과 (5분 평균) · 1분 지속"}
    ]},
    {label:"DLQ",color:"failed",items:[
      {a:"DlqAppCounterRising",d:"· 자동 재시도를 모두 소진해 관리자 복구가 필요한 결제 발생\n· 두 경로에서 발생 — payment의 EOS 커밋 실패 DLQ 발행, pg의 재시도 소진 격리\n· 각 서비스가 처리 시점에 직접 기록하는 메트릭으로 감지",m:"DLQ 도달·격리 신규 발생 1건 이상 (5분 윈도우) · 1분 지속"},
      {a:"DlqTopicOffsetRising",d:"· 처리 불가 결제를 서비스 메트릭이 아닌 DLQ 토픽에서 감지\n· 새 메시지 적재(오프셋 증가)를 kafka-exporter가 관측 — 서버 크래시로 서비스 메트릭이 유실돼도 포착",m:".dlq 토픽 신규 메시지 1건 이상 (5분 윈도우) · 1분 지속"},
      {a:"DlqCommandsConsumerLag",d:"· DLQ로 빠진 확정 명령을 받아 격리 처리하는 소비자가 적체\n· 이 큐는 적체 0이 정상 — 남은 1건도 방치된 미해결 결제",m:"DLQ 컨슈머 미소비 적체 1건 이상 · 1분 지속"}
    ]},
    {label:"가용성",color:"done",items:[
      {a:"ServiceDown",d:"· 4개 서비스 중 하나가 지표 수집에 무응답\n· 프로세스 비정상 종료(OOM·크래시)로 해당 구간 결제 흐름 전체 정지",m:"지표 수집(scrape) 실패 (up == 0) · 1분 지속"},
      {a:"DependencyDown",d:"· 서비스가 10초마다 점검하는 핵심 의존성(MySQL·Redis) 연결 단절",m:"헬스 판정 DOWN 또는 지표 소멸(absent) · 즉시"},
      {a:"DependencyHealthStale",d:"· MySQL·Redis를 10초마다 점검하는 폴러 스레드 자체가 멈춘 상태\n· 폴러가 멈추면 실제 장애에도 DependencyDown 검증 불가\n· 마지막 점검 완료 시각의 갱신 여부를 따로 체크하여 점검 중단 자체를 알람화",m:"마지막 점검 후 60초 초과 또는 지표 소멸(absent) · 즉시"}
    ]}
  ];
