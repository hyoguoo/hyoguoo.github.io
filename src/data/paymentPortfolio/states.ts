// payment-platform 포트폴리오 데이터 · 콘텐츠/지오메트리. 렌더 로직과 분리(유지보수·편집 격리).
// 정본 페이지: src/pages/payment-platform-portfolio/index.astro

export const STATES = {
    READY:{color:"ready",terminal:false,meaning:"결제 초기 생성 (checkout 완료)",entry:"결제 생성 (checkout)",entryRef:"createNewPaymentEvent",polling:"PROCESSING",out:[{to:"IN_PROGRESS",label:"confirm 커밋 (TX)"},{to:"EXPIRED",label:"만료 (스케줄러)"},{to:"FAILED",label:"재고 부족"},{to:"QUARANTINED",label:"캐시 장애 (Redis)"}]},
    IN_PROGRESS:{color:"inprog",terminal:false,meaning:"confirm TX 커밋, paymentKey 기록",entry:"확정 실행",entryRef:"executePayment",polling:"PROCESSING",out:[{to:"DONE",label:"APPROVED (수신)"},{to:"FAILED",label:"FAILED 수신"},{to:"QUARANTINED",label:"불일치 / 격리 (AMOUNT_MISMATCH · QUARANTINED)"},{to:"AWAITING_RESULT",label:"회신 지연 (복구 스케줄러)"}]},
    AWAITING_RESULT:{color:"recover",terminal:false,meaning:"확정에 진입한 뒤 회신이 늦어 복구 스케줄러가 되돌린 자리. 뒤늦게 도착한 승인·실패·격리 결과를 그대로 적용한다. READY 와 달리 완료로 갈 수 있다.",entry:"복구 스케줄러 되돌림",entryRef:"resetPaymentToAwaitingResult",polling:"PROCESSING",out:[{to:"DONE",label:"늦은 APPROVED (수신)"},{to:"FAILED",label:"늦은 FAILED 수신"},{to:"QUARANTINED",label:"회신 없음 (2차 임계)"}]},
    DONE:{color:"done",terminal:true,meaning:"PG 결제 완료 · 승인 시각까지 기록된 상태",entry:"완료 처리",entryRef:"markPaymentAsDone",polling:"DONE",out:[]},
    FAILED:{color:"failed",terminal:true,meaning:"재고 부족 / PG 종결 실패 / 격리 안전 종결",entry:"실패 종결 (격리→실패 포함)",entryRef:"markPaymentAsFail · failFromQuarantine",polling:"FAILED",out:[]},
    QUARANTINED:{color:"quar",terminal:false,meaning:"자동 처리가 불가능해 격리된 상태 (수동 확인 필요). 종결이 아니어서 폴링 응답이 PROCESSING에 머문다.",entry:"격리 처리",entryRef:"markPaymentAsQuarantined",polling:"PROCESSING ⚠",out:[{to:"FAILED",label:"관리자 안전 종결"}]},
    EXPIRED:{color:"expired",terminal:true,meaning:"만료 스케줄러가 READY 결제를 종결",entry:"만료 스케줄러 종결",polling:"PROCESSING",out:[]}
  };

export const NPOS = {READY:{x:105,y:230},IN_PROGRESS:{x:405,y:230},AWAITING_RESULT:{x:570,y:345,w:150},DONE:{x:735,y:106},FAILED:{x:735,y:296},QUARANTINED:{x:405,y:426},EXPIRED:{x:105,y:426}};

export const SEDGES = [
    {from:"READY",to:"IN_PROGRESS",d:"M167,230 L338,230",lx:252,ly:219,label:"confirm 커밋"},
    {from:"READY",to:"EXPIRED",d:"M105,256 L105,401",lx:97,ly:335,label:"만료",anchor:"end"},
    {from:"READY",to:"FAILED",d:"M148,250 Q430,368 668,304",lx:322,ly:342,label:"재고 부족"},
    {from:"READY",to:"QUARANTINED",d:"M140,253 Q250,426 338,426",lx:214,ly:388,label:"캐시 장애",anchor:"end"},
    {from:"IN_PROGRESS",to:"DONE",d:"M452,214 Q612,116 668,112",lx:566,ly:146,label:"APPROVED"},
    {from:"IN_PROGRESS",to:"FAILED",d:"M456,247 Q600,296 668,296",lx:566,ly:288,label:"FAILED"},
    {from:"IN_PROGRESS",to:"QUARANTINED",d:"M405,256 L405,401",lx:414,ly:362,label:"불일치 / 격리",anchor:"start"},
    {from:"QUARANTINED",to:"FAILED",d:"M468,420 Q648,394 704,320",lx:604,ly:392,label:"관리자 안전 종결"},
    {from:"IN_PROGRESS",to:"AWAITING_RESULT",d:"M452,251 Q495,300 512,322",lx:487,ly:302,label:"회신 지연",anchor:"end",recover:true},
    {from:"AWAITING_RESULT",to:"DONE",d:"M622,326 Q690,240 712,132",lx:678,ly:232,label:"늦은 APPROVED"},
    {from:"AWAITING_RESULT",to:"FAILED",d:"M645,338 L690,312",lx:650,ly:302,label:"늦은 FAILED",anchor:"end"},
    {from:"AWAITING_RESULT",to:"QUARANTINED",d:"M498,360 Q470,395 462,410",lx:466,ly:392,label:"회신 없음",anchor:"end",recover:true}
  ];

export const PG_STATES = {
    PENDING:{color:"ready",terminal:false,meaning:"inbox INSERT 후 채널 적재 대기",entry:"등록·발행",entryRef:"insertPendingAndPublish",out:[{to:"IN_PROGRESS",label:"조건부 선점 (SKIP LOCKED)"}]},
    IN_PROGRESS:{color:"inprog",terminal:false,meaning:"워커가 선점해 PG사를 호출·재시도하는 중",entry:"선점 처리",entryRef:"markInProgress",out:[{to:"APPROVED",label:"승인 응답 (벤더 2xx)"},{to:"FAILED",label:"확정 거절 (4xx)"},{to:"QUARANTINED",label:"판단 불가 (재시도 소진)"},{to:"IN_PROGRESS",label:"self-loop 재시도 (횟수 +1)",self:true}]},
    APPROVED:{color:"done",terminal:true,meaning:"벤더 승인 확정",entry:"승인 확정",entryRef:"markApproved",out:[]},
    FAILED:{color:"failed",terminal:true,meaning:"확정 거절(4xx NonRetryable)",entry:"실패 확정",entryRef:"markFailed",out:[]},
    QUARANTINED:{color:"quar",terminal:true,meaning:"판단 불가 격리. pg_inbox는 여기서 멈춘다 · payment 측 QUARANTINED와 달리 종결",entry:"격리 확정",entryRef:"markQuarantined",out:[]}
  };

export const PG_NPOS = {PENDING:{x:120,y:220},IN_PROGRESS:{x:410,y:220},APPROVED:{x:720,y:110},FAILED:{x:720,y:250},QUARANTINED:{x:410,y:392}};

export const PG_SEDGES = [
    {from:"PENDING",to:"IN_PROGRESS",d:"M182,220 L348,220",lx:265,ly:209,label:"조건부 선점"},
    {from:"IN_PROGRESS",to:"APPROVED",d:"M462,204 Q612,120 658,116",lx:566,ly:150,label:"승인 응답"},
    {from:"IN_PROGRESS",to:"FAILED",d:"M466,232 Q600,250 658,250",lx:566,ly:242,label:"확정 거절"},
    {from:"IN_PROGRESS",to:"QUARANTINED",d:"M410,246 L410,367",lx:420,ly:305,label:"판단 불가",anchor:"start"},
    {from:"IN_PROGRESS",to:"IN_PROGRESS",d:"M384,197 C370,150 450,150 436,197",lx:410,ly:150,label:"self-loop 재시도",self:true}
  ];
