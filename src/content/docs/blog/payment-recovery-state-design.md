---
title: "결제 복구 상태 모델 설계 — 장애 내성을 갖춘 상태 전이"
date: 2026-04-10
lastUpdated: 2026-04-10
tags: [ Payment Platform Project ]
description: "비동기 결제 전환 후 상태 모델의 구조적 한계를 분석하고, RETRYING·RetryPolicy·RecoveryDecision·격리 전 최종 확인·QUARANTINED 도입으로 장애 내성을 갖춘 상태 전이 체계를 설계한 과정을 다룬다."
---

> 실행 환경: Java 21, Spring Boot 3.4.4, MySQL 8.0

## 배경

최근 [비동기 결제 처리 플로우](/blog/async-payment-flow/) 아키텍처를 도입하면서, 기존 상태 모델이 새 아키텍처를 충분히 표현하지 못하는 문제가 드러났다.

## 비동기 결제 플로우 요약

본론에 앞서, 이 글의 전제가 되는 비동기 결제 구조를 간략히 정리한다.

1. 클라이언트의 결제 승인 요청(confirm)과 실제 PG(Payment Gateway, 결제 대행사) 승인 API 호출을 기술적으로 분리
2. 서버는 PG 응답을 기다리지 않고 즉시 202 Accepted를 반환
3. 실제 승인은 백그라운드에서 처리하며, 클라이언트는 승인 상태를 조회하여 최종 결과를 확인

이 구조에서 핵심이 되는 세 가지 개념이 있다.

- `PaymentEvent`: 결제 1건의 생명주기를 추적하는 도메인 엔티티
    - READY → IN_PROGRESS → DONE/FAILED 등 상태 전이를 관리
- `PaymentOutbox`: 비동기 처리 대상을 DB에 기록하는 작업 큐 역할의 테이블
    - PENDING(대기) → IN_FLIGHT(처리 중) → DONE/FAILED(종결) 상태 전이를 관리
    - 서버 장애 시에도 처리 대상이 유실되지 않도록 보장
- Worker: Outbox 레코드를 읽어 실제 PG 승인을 수행하는 백그라운드 처리기
    - ImmediateWorker(트랜잭션(TX) 커밋 직후 즉시 처리)와 OutboxWorker(주기적 폴링으로 누락 건 재처리) 두 트랙으로 구성

---

## 기존 설계의 한계

위 비동기 구조에서 기존 상태 모델에 네 가지 구조적 한계가 있었다.

### 불명확한 UNKNOWN 상태와 분산된 스케줄러

기존 상태 머신의 `IN_PROGRESS`와 `UNKNOWN` 두 상태 모두 재시도 대상이었고, 실패가 반복되면 `FAILED`로 전이되었다.

```mermaid
stateDiagram-v2
    [*] --> READY: checkout 완료
    READY --> IN_PROGRESS: PG 승인 요청 수신
    READY --> EXPIRED: 만료 (30분)
    IN_PROGRESS --> DONE: PG 승인 성공
    IN_PROGRESS --> FAILED: 실패 (non-retryable 또는 재시도 소진)
    IN_PROGRESS --> UNKNOWN: 재시도 가능 에러 발생
    UNKNOWN --> DONE: 재시도 성공
    UNKNOWN --> FAILED: 재시도 소진
    UNKNOWN --> UNKNOWN: 재시도 계속
    DONE --> [*]
    FAILED --> [*]
    EXPIRED --> [*]
```

또한, 복구 대상이 두 상태에 걸쳐 분산되어 있어, 어떤 스케줄러가 어떤 건을 언제 처리하는지 추적하기 어려웠다.

|          메서드           |          대상           |       역할       |
|:----------------------:|:---------------------:|:--------------:|
| recoverUnknownPayments |     UNKNOWN 상태 결제     | 재시도 가능 에러 건 복구 |
|  recoverStuckPayments  | IN_PROGRESS 상태가 지속된 건 | 응답 없이 멈춘 건 복구  |

### 하드코딩된 재시도 정책 및 부하 집중 위험

재시도 한도가 `PaymentEvent`와 `PaymentOutbox` 양쪽에 `RETRYABLE_LIMIT = 5`로 중복 하드코딩되어 있었다.

- 고정된 폴링 간격마다 모든 건에 요청하면서 일시적 장애 시 PG에 부하 집중될 수 있음
- `PaymentOutbox`에 `nextRetryAt` 개념이 없어 고정 간격(FIXED) 이외의 Backoff 전략을 지원할 수 없음
- 한도를 변경하려면 두 클래스를 동시에 수정해야 하는 구조

### 그 외

- 도메인 결과값(`PaymentConfirmResult`)이 이미 실패 유형을 분류하고 있음에도, 예외 타입으로 변환하여 catch 블록에서 분기하는 이중 구조가 존재
- 복구 사이클이 PG 상태를 조회하지 않고 무조건 승인 요청을 재발행 — 멱등성 키로 금전 중복은 막혔지만, 이전 호출이 성공했는지 알 수 없는 구조

---

## 재설계

### 상태 모델 재정의 — RETRYING, QUARANTINED 도입과 UNKNOWN 제거

기존 `UNKNOWN` 상태를 `RETRYING`으로 변경하여 "재시도 대기 중"이라는 의미를 명확히 부여하고, 분산되어 있던 스케줄러를 단일 복구 진입점으로 통합했다.

```mermaid
stateDiagram-v2
    classDef ready fill: #D6EAF8, color: #1B4F72, stroke: #2E86C1
    classDef inprogress fill: #FEF9E7, color: #7D6608, stroke: #F1C40F
    classDef retrying fill: #FEF5E7, color: #7E5109, stroke: #F39C12
    classDef done fill: #D5F5E3, color: #0E6251, stroke: #28B463
    classDef failed fill: #FADBD8, color: #7B241C, stroke: #E74C3C
    classDef quarantined fill: #F3E5F5, color: #4A148C, stroke: #7B1FA2
    [*] --> READY: checkout 완료
    READY --> IN_PROGRESS: PG 승인 요청 수신
    READY --> EXPIRED: 만료 (30분)
    IN_PROGRESS --> DONE: PG 승인 성공
    IN_PROGRESS --> FAILED: non-retryable 오류
    IN_PROGRESS --> RETRYING: retryable 오류 (첫 실패)
    IN_PROGRESS --> QUARANTINED: 판단 불가 + 한도 소진
    RETRYING --> DONE: 재시도 성공
    RETRYING --> FAILED: non-retryable 오류 또는 재시도 소진
    RETRYING --> RETRYING: 재시도 또 실패 (한도 내)
    RETRYING --> QUARANTINED: 판단 불가 + 한도 소진
    DONE --> [*]
    FAILED --> [*]
    EXPIRED --> [*]
    QUARANTINED --> [*]
    class READY ready
    class IN_PROGRESS inprogress
    class RETRYING retrying
    class DONE done
    class FAILED,EXPIRED failed
    class QUARANTINED quarantined
```

- `UNKNOWN → RETRYING`: "알 수 없는 상태"가 아니라 "재시도 대기 중"이라는 의미를 명확히 부여
- `RETRYING → RETRYING`: 한도 내에서 반복 실패 시 self-loop
- `RETRYING → DONE / FAILED`: 재시도 성공 또는 소진 시 종결
- `IN_PROGRESS / RETRYING → QUARANTINED`: 한도 소진 후에도 PG 상태를 판단할 수 없으면 격리 — 관리자 개입 전까지 자동 복구 사이클에서 영구 이탈

이를 위해 기존 상태 전이 가드도 업데이트했다.

|      메서드       |    기존 허용 source    |        변경 후 허용 source        |
|:--------------:|:------------------:|:----------------------------:|
|    `done()`    | IN_PROGRESS, DONE  | IN_PROGRESS, RETRYING, DONE  |
|    `fail()`    | READY, IN_PROGRESS | READY, IN_PROGRESS, RETRYING |
| `toRetrying()` |        (신규)        | READY, IN_PROGRESS, RETRYING |
| `quarantine()` |        (신규)        | READY, IN_PROGRESS, RETRYING |

### RetryPolicy 도메인 객체 추가 및 nextRetryAt 필드 추가로 재시도 시점 제어

중복 하드코딩된 재시도 한도를 `RetryPolicy` 도메인 객체로 분리했다.(설정은 `application.yml`로 외부화)

```java
public record RetryPolicy(
        int maxAttempts,
        BackoffType backoffType,
        long baseDelayMs,
        long maxDelayMs
) {

    public boolean isExhausted(int retryCount) {
        return retryCount >= maxAttempts;
    }

    public Duration nextDelay(int retryCount) {
        return switch (backoffType) {
            case FIXED -> Duration.ofMillis(baseDelayMs);
            case EXPONENTIAL -> Duration.ofMillis(
                    Math.min(baseDelayMs * (1L << retryCount), maxDelayMs)
            );
        };
    }
}
```

- `maxAttempts`: 최대 재시도 횟수
- `BackoffType`: FIXED(고정 간격) 또는 EXPONENTIAL(지수 증가)
- `baseDelayMs` / `maxDelayMs`: Backoff 계산의 기본값과 상한

추가적으로 `PaymentOutbox`에 `nextRetryAt` 필드를 도입하여, 재시도 시점을 동적으로 제어할 수 있도록 했다.

### RecoveryDecision 값 객체

복구 결정 로직을 순수 도메인 값 객체에 집중시켜, PG 상태와 로컬 상태를 입력받아 6가지 결정 중 하나를 반환한다.

|     Decision     |           의미            |           후속 처리           |
|:----------------:|:-----------------------:|:-------------------------:|
| COMPLETE_SUCCESS |         PG DONE         |        로컬 DONE 전이         |
| COMPLETE_FAILURE |  PG 종결 실패 (취소/중단/만료 등)  |  보상 TX (재고 복원 + FAILED)   |
| ATTEMPT_CONFIRM  |        PG에 기록 없음        |     PG 승인 요청 후 결과 재평가     |
|   RETRY_LATER    | PG 조회 오류 또는 진행 중 (한도 내) | RETRYING + nextRetryAt 설정 |
|    QUARANTINE    |      한도 소진 + 판단 불가      |  QUARANTINED (자동 복구 이탈)   |
|  REJECT_REENTRY  |      로컬이 이미 종결 상태       |       Outbox만 멱등 종결       |

이 값 객체는 Spring 의존 없이 순수하게 테스트할 수 있으며, 모든 복구 분기가 한 곳에 집중된다.

### 원자적 선점 — claimToInFlight

복구 사이클 진입 시 같은 건을 여러 Worker가 동시에 처리하는 것을 막기 위해, MySQL의 UPDATE 쿼리를 활용한 원자적 선점 메커니즘을 도입했다.

```sql
UPDATE payment_outbox
SET status       = 'IN_FLIGHT',
    in_flight_at = :now
WHERE order_id = :orderId
  AND status = 'PENDING'
  AND (next_retry_at IS NULL OR next_retry_at <= :now)
```

- WHERE 절에 `status = 'PENDING'` 조건이 포함되어 있으므로, 두 Worker가 동시에 같은 건을 선점하려 해도 하나만 UPDATE에 성공
- 실패한 Worker는 영향 행 수가 0이므로 즉시 포기하고, 성공한 Worker만 이후 복구 로직 진행

### 재고 복구 가드

보상 트랜잭션은 재고를 복원하는 되돌릴 수 없는 작업이므로, 실행 전에 데이터가 정상 상태인지 이중 조건 가드로 확인한다.

- 정상 흐름에서는 claimToInFlight의 원자 선점이 중복 진입을 원천 차단
- 비정상 데이터(타임아웃 복구 후 상태 불일치 등)가 보상 TX까지 도달했을 때 재고를 함부로 건드리지 않기 위한 안전망

```mermaid
flowchart TD
    classDef check fill: #FEF9E7, color: #7D6608, stroke: #F1C40F
    classDef skip fill: #F5F5F5, color: #616161, stroke: #9E9E9E
    classDef exec fill: #FADBD8, color: #7B241C, stroke: #E74C3C
    A["보상 TX 진입"] --> C{"1. Outbox가 IN_FLIGHT인가?\n(현재 사이클에서 선점한 건)"}:::check
    C -- " NO " --> D["재고 복원 skip\nOutbox/Event 종결만 수행"]:::skip
    C -- " YES " --> E{"2. PaymentEvent가 비종결인가?\n(아직 FAILED/DONE 아닌 건)"}:::check
    E -- " NO " --> D
    E -- " YES " --> F["재고 복원 수행\n+ Outbox → FAILED\n+ PaymentEvent → FAILED"]:::exec
```

TX 시작 시점에 Outbox와 PaymentEvent를 DB에서 다시 조회하여, 두 조건 모두 충족할 때만 `increaseStockForOrders`를 호출한다.

- Outbox가 IN_FLIGHT가 아님: 다른 Worker가 이미 처리를 완료했거나, 타임아웃 복구로 상태가 변경된 경우 — 재고 복원 skip
- PaymentEvent가 이미 종결 상태: 보상 TX가 이미 커밋된 경우 — 재고 복원 skip

### 격리 전 최종 확인

재시도 중 마지막 요청이 성공했을 수도 있으므로, 격리 직전에 `getStatusByOrderId`를 한 번 더 호출하여 PG 상태를 최종 확인한다.

```mermaid
flowchart TD
    classDef success fill: #D5F5E3, color: #0E6251, stroke: #28B463
    classDef failure fill: #FADBD8, color: #7B241C, stroke: #E74C3C
    classDef quarantine fill: #F3E5F5, color: #4A148C, stroke: #7B1FA2
    classDef action fill: #EBF5FB, color: #21618C, stroke: #3498DB
    A["한도 소진 시점"] --> B["getStatus 1회 최종 재확인"]:::action
    B -->|" DONE "| C["COMPLETE_SUCCESS(성공 승격)"]:::success
    B -->|" PG 종결 실패\n(CANCELED/ABORTED 등) "| D["COMPLETE_FAILURE(재고 복원 + FAILED)"]:::failure
    B -->|" PG 기록 없음/타임아웃/매핑 불가\n(판단 불가) "| F["QUARANTINE(격리, 재고 복원 금지)"]:::quarantine
```

### 그 외

- 실패 분류 기준을 예외 타입에서 도메인 결과값으로 전환
- 기존 복구 사이클의 무조건 PG 승인 요청 구조를 `getStatusByOrderId` 선행 조회로 전환

---

## 복구 스케줄러 구성

시나리오에 앞서, 복구 처리를 담당하는 세 스케줄러의 역할을 정리한다.

|         스케줄러          |   트리거    |                          역할                          |
|:---------------------:|:--------:|:----------------------------------------------------:|
| OutboxImmediateWorker | 채널 수신 즉시 |           PG 승인 요청 직후 Outbox에 발행된 건을 즉시 처리           |
|     OutboxWorker      | 5초 주기 폴링 | IN_FLIGHT 타임아웃 복구 / PENDING 건 배치 조회 후 `process()` 위임 |
|   PaymentScheduler    |  5분 주기   |          30분 이상 READY 상태인 만료 건을 EXPIRED로 전이          |

OutboxWorker는 매 틱마다 두 단계를 순서대로 수행한다.

1. IN_FLIGHT 상태가 일정 시간(기본 5분) 이상 지속된 건을 PENDING으로 복구: Worker가 처리 중 비정상 종료하거나 응답이 느려진 경우를 대비한 안전장치
2. PENDING 건을 배치 조회하고, 각 건에 대해 `claimToInFlight`로 PENDING → IN_FLIGHT 원자적 선점 후 복구 처리 시작

### 타임아웃 복구와 배치 조회를 별도 단계로 분리한 이유

한 쿼리로 합치면 "정상 처리 중인 IN_FLIGHT"와 "죽은 IN_FLIGHT"를 구분할 수 없기 때문이다.

- 먼저 시간 기준으로 죽은 건만 PENDING으로 확정
- 이후 `claimToInFlight`가 PENDING → IN_FLIGHT 단일 전이만 경쟁하도록 하여 선점 보장을 단순하게 유지

---

## 엣지 케이스 검증

위 설계가 실제 장애 상황을 어떻게 방어하는지, 구체적인 시나리오로 확인한다.

### 1. PG 승인 완료인데 로컬이 모르는 경우

서버가 PG 승인 응답을 받은 직후, DB에 반영하기 전에 죽는 상황이다.

```mermaid
sequenceDiagram
    participant S as 서버
    participant DB as Database
    participant PG as PG사
    S ->> PG: PG 승인 요청
    PG -->> S: 200 OK (승인 완료)
    Note over S: 서버 장애 발생 (DB 커밋 전)
    Note over DB: PaymentEvent = IN_PROGRESS, Outbox = IN_FLIGHT
    Note over S: 5분 후 IN_FLIGHT 타임아웃 복구 → PENDING
    S ->> PG: getStatus 조회
    PG -->> S: DONE (승인 완료)
    S ->> DB: [TX] PaymentEvent → DONE, Outbox → DONE
```

getStatus 선행 조회로 승인 재요청 없이 PG 상태를 바로 로컬에 동기화하게 된다.

### 2. Worker 타임아웃으로 동시 처리 발생

W1이 처리 중 느려져서 타임아웃이 발생하고, W2가 같은 건을 다시 선점하는 상황이다.

```mermaid
sequenceDiagram
    participant W1 as Worker 1 (느림)
    participant DB as Database
    participant W2 as Worker 2
    participant PG as PG사
    W1 ->> DB: claimToInFlight (선점)
    Note over W1: 처리 지연...
    Note over DB: IN_FLIGHT 타임아웃 복구
    DB ->> DB: Outbox → PENDING 복원
    W2 ->> DB: claimToInFlight (재선점)
    W2 ->> PG: getStatus 조회
    PG -->> W2: CANCELED (PG 종결 실패)
    W2 ->> DB: [보상 TX] 재고 복원 + PaymentEvent → FAILED + Outbox → FAILED
    Note over W1: 뒤늦게 보상 TX 시도
    W1 ->> DB: [보상 TX] 가드 검사
    Note over DB: Outbox = FAILED (IN_FLIGHT 아님) → 가드 차단
    W1 ->> DB: 재고 복원 skip
```

W2가 먼저 보상 TX를 커밋한 뒤, W1이 뒤늦게 같은 건에 보상 TX를 시도했지만, 재고 복구 가드가 "Outbox가 IN_FLIGHT가 아님"을 감지하여 재고 이중 복원 차단한다.

### 3 - 한도 소진 직전 PG 승인 완료

4번째 재시도까지 타임아웃이 반복되다가, 5번째(마지막) 시도 직전에 PG가 승인을 완료한 경우다.

```mermaid
sequenceDiagram
    participant W as Worker
    participant DB as Database
    participant PG as PG사
    Note over DB: PaymentEvent = RETRYING (4회 실패)
    Note over DB: Outbox = PENDING (nextRetryAt 도달)
    W ->> DB: claimToInFlight
    W ->> PG: getStatus 조회
    PG -->> W: 타임아웃 (5번째 실패)
    Note over W: 한도 소진 → 격리 전 최종 확인
    W ->> PG: getStatus 1회 최종 재확인
    PG -->> W: DONE (승인 완료)
    W ->> DB: [TX] PaymentEvent → DONE, Outbox → DONE
```

이 확인이 없었다면 5회 소진 시점에 QUARANTINED 또는 FAILED로 처리되어, 이미 승인된 결제의 재고가 복원될 수 있었지만, 마지막 getStatus 조회가 성공으로 승격시켜준다.

---

## 최종 상태 다이어그램

모든 개선을 반영한 `PaymentEventStatus`의 최종 상태 전이는 다음과 같다.

```mermaid
stateDiagram-v2
    classDef ready fill: #D6EAF8, color: #1B4F72, stroke: #2E86C1
    classDef inprogress fill: #FEF9E7, color: #7D6608, stroke: #F1C40F
    classDef retrying fill: #FEF5E7, color: #7E5109, stroke: #F39C12
    classDef done fill: #D5F5E3, color: #0E6251, stroke: #28B463
    classDef failed fill: #FADBD8, color: #7B241C, stroke: #E74C3C
    classDef quarantined fill: #F3E5F5, color: #4A148C, stroke: #7B1FA2
    [*] --> READY: checkout 완료
    READY --> IN_PROGRESS: PG 승인 요청 수신
    READY --> EXPIRED: 만료 (30분)
    READY --> RETRYING: 복구 사이클 재진입
    IN_PROGRESS --> DONE: PG 승인 성공
    IN_PROGRESS --> FAILED: non-retryable 오류
    IN_PROGRESS --> RETRYING: retryable 오류
    IN_PROGRESS --> QUARANTINED: 한도 소진 + 판단 불가
    RETRYING --> DONE: 재시도 성공
    RETRYING --> FAILED: non-retryable 또는 한도 소진 + 확정 실패
    RETRYING --> RETRYING: 한도 내 재시도
    RETRYING --> QUARANTINED: 한도 소진 + 판단 불가
    DONE --> [*]
    FAILED --> [*]
    EXPIRED --> [*]
    CANCELED --> [*]
    PARTIAL_CANCELED --> [*]
    QUARANTINED --> [*]: 관리자 개입 전까지 자동 복구에서 이탈
    class READY ready
    class IN_PROGRESS inprogress
    class RETRYING retrying
    class DONE done
    class FAILED,EXPIRED,CANCELED,PARTIAL_CANCELED failed
    class QUARANTINED quarantined
```

## 복구 사이클 전체 플로우

`OutboxProcessingService.process()`의 최종 구조를 플로우차트로 정리하면 다음과 같다.

```mermaid
flowchart TD
    classDef success fill: #D5F5E3, color: #0E6251, stroke: #28B463
    classDef retryable fill: #FEF5E7, color: #7E5109, stroke: #F39C12
    classDef failure fill: #FADBD8, color: #7B241C, stroke: #E74C3C
    classDef quarantine fill: #F3E5F5, color: #4A148C, stroke: #7B1FA2
    classDef action fill: #EBF5FB, color: #21618C, stroke: #3498DB
    classDef check fill: #FEF9E7, color: #7D6608, stroke: #F1C40F
    classDef skip fill: #F5F5F5, color: #616161, stroke: #9E9E9E
    A["복구 틱"] --> CL["claimToInFlight\n원자 선점"]:::action
    CL -->|" 선점 실패 "| SKIP["다른 Worker 처리 중 → 포기"]:::skip
    CL -->|" 선점 성공 "| LC{"로컬 종결 검사\nisTerminal()"}:::check
    LC -->|" 이미 종결\n(DONE/FAILED/CANCELED 등) "| REENTRY["REJECT_REENTRY\nOutbox만 멱등 종결"]:::skip
    LC -->|" 비종결\n(READY/IN_PROGRESS/RETRYING) "| GS["PG 상태 선행 조회\ngetStatusByOrderId"]:::action
    GS -->|" DONE "| SUCCESS["COMPLETE_SUCCESS"]:::success
    GS -->|" CANCELED/ABORTED 등\nPG 종결 실패 "| FAILURE["COMPLETE_FAILURE"]:::failure
    GS -->|" PG 기록 없음 "| CONFIRM["ATTEMPT_CONFIRM"]:::action
    GS -->|" 타임아웃/5xx/매핑 불가\n+ 한도 미소진 "| RETRY["RETRY_LATER"]:::retryable
    SUCCESS --> TX_DONE["PaymentEvent → DONE\nOutbox → DONE"]:::success
    FAILURE --> GUARD{"재고 복구 가드\nOutbox IN_FLIGHT?\nEvent 비종결?"}:::check
    CONFIRM --> CF["PG 승인 요청"]:::action
    RETRY --> TX_RETRY["PaymentEvent → RETRYING\nnextRetryAt 설정\nOutbox → PENDING"]:::retryable
    CF -->|" 승인 성공 "| TX_DONE
    CF -->|" retryable + 한도 미소진 "| TX_RETRY
    CF -->|" non-retryable "| GUARD
    CF -->|" retryable + 한도 소진 "| FINAL
    TX_RETRY -->|" 한도 소진 "| FINAL
    FINAL["격리 전 최종 확인\ngetStatus 1회 재호출"]:::action
    FINAL -->|" DONE 확인 "| TX_DONE
    FINAL -->|" PG 종결 실패 "| GUARD
    FINAL -->|" 판단 불가 "| QU["QUARANTINE\nPaymentEvent → QUARANTINED\nOutbox → FAILED\n재고 복원 금지"]:::quarantine
    GUARD -->|" 조건 충족 "| TX_COMP["보상 TX 실행\n재고 복원\nPaymentEvent → FAILED\nOutbox → FAILED"]:::failure
    GUARD -->|" 조건 미충족 "| TX_SKIP["Outbox → FAILED만\n재고 복원 skip"]:::skip
```

---

## 마무리

상태 모델을 재정의하고 복구 결정 로직을 도메인 값 객체에 집중시킨 결과, 복구 사이클이 대응하는 전체 케이스를 다음과 같이 정리할 수 있다.

### 복구 사이클 내 케이스

복구 사이클은 PG 상태 조회 결과를 기준으로 종결 / 재시도 / 격리 중 하나를 결정하여 처리한다.

|             상황             |        Event         |         Outbox          |    재고     |
|:--------------------------:|:--------------------:|:-----------------------:|:---------:|
|     PG에서 승인이 정상 완료된 경우     |        → DONE        |         → DONE          |   점유 유지   |
|   PG에서 결제가 취소/중단/만료된 경우    |       → FAILED       |        → FAILED         |    복원     |
|    PG에 결제 기록 자체가 없는 경우     |     승인 결과에 따라 결정     |      승인 결과에 따라 결정       |   점유 유지   |
| PG 조회가 일시적으로 실패한 경우 (한도 내) |      → RETRYING      | → PENDING (nextRetryAt) |   점유 유지   |
|  PG에서 아직 처리 중인 경우 (한도 내)   |      → RETRYING      | → PENDING (nextRetryAt) |   점유 유지   |
|   위 재시도 케이스에서 한도를 소진한 경우   | 격리 전 최종 확인 결과에 따라 결정 |  격리 전 최종 확인 결과에 따라 결정   | 결과에 따라 결정 |
|   이미 로컬에서 종결 처리가 완료된 경우    |        변경 없음         |         → DONE          |   변경 없음   |

### 스케줄러 및 선점

복구 사이클 뿐만 아니라, 동시성과 장애 상황에 대응하는 스케줄러와 선점 구조도 다음과 같이 정리할 수 있다.

|                  상황                   | Event |  Outbox   |      재고      |
|:-------------------------------------:|:-----:|:---------:|:------------:|
| Worker가 느려져서 다른 Worker가 먼저 처리를 완료한 경우 | 변경 없음 |   변경 없음   | 가드가 이중 복원 차단 |
|      Worker가 비정상 종료하여 처리가 중단된 경우      | 변경 없음 | → PENDING |    점유 유지     |
|         다른 Worker가 이미 선점한 경우          | 변경 없음 |   변경 없음   |    변경 없음     |
