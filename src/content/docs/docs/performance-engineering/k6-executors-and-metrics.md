---
title: "k6 Executors and Metrics"
date: 2026-05-06
lastUpdated: 2026-05-06
tags: [ Performance Engineering ]
description: "k6의 7가지 익스큐터로 부하 모델을 구현하고, 빌트인과 커스텀 메트릭으로 처리량과 사용자 경험을 분리 측정하는 방법을 분석한다."
---

k6 스크립트가 의도한 부하를 정확히 발사하고 결과를 의미 있게 해석하기 위해서는 익스큐터 선택과 메트릭 분류 체계에 대한 이해가 필수적이다.

## Executor 7종 — 부하 모델의 구현

익스큐터(executor)는 VU와 iteration을 어떤 패턴으로 실행할지 결정하며, k6가 제공하는 7가지 옵션은 부하 결정 방식에 따라 두 부류로 나뉜다.

|         부류         |                              executor                              |              부하 결정 방식              |
|:------------------:|:------------------------------------------------------------------:|:----------------------------------:|
|      VU-based      | shared-iterations / per-vu-iterations / constant-vus / ramping-vus |    VU 수가 천장. TPS는 서버 응답 시간에 종속     |
| Arrival-rate based |            constant-arrival-rate / ramping-arrival-rate            | 외부에서 초당 도착률 강제 주입. VU는 capacity 자원 |

위 분류는 Closed System / Open System 모델의 차이와 직결되며, 측정 의도에 따라 선택이 달라진다.

### shared-iterations

전체 iteration을 모든 VU가 나눠 소화하는 가장 단순한 모델이다.

```json
{
  executor: 'shared-iterations',
  vus: 10,
  iterations: 1000
}
```

- 사용 사례: 정해진 횟수의 작업을 분산 처리하는 배치형 검증
- 한계: VU별 작업량 편차가 발생하므로 사용자 행동 시뮬레이션에는 부적합

### per-vu-iterations

각 VU가 독립적으로 N번의 iteration을 수행하는 방식이다.

```json
{
  executor: 'per-vu-iterations',
  vus: 10,
  iterations: 100
}
```

- 사용 사례: 사용자별 동일 작업량 보장이 필요한 시나리오 (회원당 결제 횟수 등)
- 특성: VU 간 시작·종료 시점이 어긋날 수 있음

### constant-vus

지정된 시간 동안 N개의 VU가 자율적으로 무한 반복하는 모델이다.

```json
{
  executor: 'constant-vus',
  vus: 50,
  duration: '5m'
}
```

- 부하 공식: TPS ≈ vus / (avg iteration duration)
- 서버 응답 지연 시 TPS가 자연 하락하므로 사용자 체감 측정에 적합
- 도착률 강제가 없으므로 dropped_iterations 메트릭이 발행되지 않음

### ramping-vus

VU 수를 stages 정의에 따라 점진적으로 가감하는 방식이다.

```json
{
  executor: 'ramping-vus',
  stages: [
    {
      duration: '30s',
      target: 50
    },
    {
      duration: '1m',
      target: 100
    },
    {
      duration: '30s',
      target: 0
    }
  ]
}
```

- 사용 사례: 동시 접속자 수의 증가·감소 곡선 재현
- 특성: 부하 모양은 VU 풀 크기 기준이며 도착률은 응답 시간에 종속

### constant-arrival-rate

서버 응답 속도와 무관하게 초당 N건의 iteration을 강제 발사한다.

```json
{
  executor: 'constant-arrival-rate',
  rate: 100,
  timeUnit: '1s',
  duration: '5m',
  preAllocatedVUs: 50,
  maxVUs: 200
}
```

- VU는 부하 발사를 실현하기 위한 capacity 자원으로만 동작
- 가용 VU가 부족하면 dropped_iterations 카운트가 누적
- SLO 검증처럼 정확한 TPS가 필요한 경우의 표준 선택지

### ramping-arrival-rate

도착률을 stages에 따라 가감하여 시간대별 트래픽 곡선을 강제 주입한다.

```json
{
  executor: 'ramping-arrival-rate',
  stages: [
    {
      duration: '20s',
      target: 20
    },
    {
      duration: '30s',
      target: 100
    },
    {
      duration: '90s',
      target: 100
    }
  ],
  preAllocatedVUs: 200,
  maxVUs: 1000
}
```

- 사용 사례: 한계점 탐색(Stress) 및 스파이크 테스트
- 측정 의도: 처리량 천장을 초과하는 순간 dropped_iterations와 latency가 동시에 가시화

### externally-controlled

런타임 중 k6 REST API로 VU 수와 duration을 변경할 수 있는 익스큐터다.

- 사용 사례: 운영 트래픽 변화에 맞춰 동적으로 부하를 조정하는 자동화 시나리오
- 특성: 단일 테스트 실행 단위로는 사용 빈도가 낮으며 외부 오케스트레이션과 결합되어야 함

### 측정 목적별 선택 기준

|      측정 목적       |              권장 executor              |
|:----------------:|:-------------------------------------:|
| 처리 능력 측정 (현재 한계) |             constant-vus              |
| 한계점 탐색 (포화 시 거동) |         ramping-arrival-rate          |
|     스파이크 테스트     |   ramping-arrival-rate (급격한 stages)   |
|    정해진 횟수만 실행    | shared-iterations / per-vu-iterations |
| SLO 검증 (정확한 TPS) |         constant-arrival-rate         |

## Built-in Metrics — 측정값의 4가지 type

k6는 모든 측정값을 4가지 통계적 타입으로 분류하며, 임계치 표현식과 직결된다.

|  Type   |                       용도                        |                    주요 예시                    |
|:-------:|:-----------------------------------------------:|:-------------------------------------------:|
| Counter |                     누적 카운트                      | http_reqs / iterations / dropped_iterations |
|  Trend  | 시간 분포 (med / p90 / p95 / p99 / max / min / avg) |              http_req_duration              |
|  Rate   |                  true/false 비율                  |               http_req_failed               |
|  Gauge  |                       순간값                       |                vus / vus_max                |

### HTTP 단계별 분해 메트릭

`http_req_duration`은 단일 Trend로 보이지만, 내부적으로는 여러 단계의 합이며 각 단계가 별도 메트릭으로 발행된다.

- http_req_blocked: 연결 풀에서 슬롯을 기다린 시간
- http_req_connecting: TCP 연결 수립 시간
- http_req_tls_handshaking: TLS 핸드셰이크 시간
- http_req_sending: 요청 바이트 전송 시간
- http_req_waiting: 서버 처리 대기 시간 (TTFB)
- http_req_receiving: 응답 바이트 수신 시간

각 단계가 별도 Trend로 발행되므로, 지연의 원인을 클라이언트 / 네트워크 / 서버 처리 중 어느 구간으로 귀속할지 분리 분석이 가능하다.

### Iteration & VU 메트릭

부하 발사 자체의 건강도를 보여주는 클라이언트 측 지표다.

- iterations (Counter): 실제 시작된 iteration 수
- iteration_duration (Trend): iteration 함수 실행 시간 (네트워크 + JS 실행 포함)
- dropped_iterations (Counter): arrival-rate executor에서 VU 부족으로 발사 실패한 횟수
- vus / vus_max (Gauge): 현재 활성 VU 및 풀 상한

## http_req_failed vs dropped_iterations

두 메트릭은 이름은 비슷하지만 발생 위치와 의미가 완전히 다르며, 부하 테스트 결과 해석에서 가장 자주 혼동되는 지점이다.

|        메트릭         |           의미           |               발생 조건                |
|:------------------:|:----------------------:|:----------------------------------:|
|  http_req_failed   | HTTP 응답이 에러이거나 네트워크 실패 | 5xx / connection refused / timeout |
| dropped_iterations |  iteration 발사 자체를 포기   |  arrival-rate executor에서 가용 VU 부재  |

`http_req_failed`는 서버에 요청이 도달했고 그 결과가 실패였음을 의미하지만, `dropped_iterations`는 클라이언트 측에서 발사 자체가 일어나지 않아 서버에 도달조차 하지 않는다.

- 에러율 0%인 측정에서도 dropped이 다수 발생할 수 있음
- 진짜 사용자 거절(connection refused 등)을 측정하려면 maxVUs를 충분히 크게 잡아 dropped 발생을 회피해야 함
- VU pool 한계가 capacity 초과분을 흡수하는 구조이므로, dropped은 클라이언트 측 부하 발사기의 자원 부족으로 해석

## Custom Metrics — 도메인 특화 측정

기본 HTTP 단계 외의 시간이나 비즈니스 지표는 직접 메트릭을 정의해 측정한다.

```javascript
import {Trend, Counter, Rate} from 'k6/metrics';

const confirmLatency = new Trend('confirm_ms', true);
const confirmRequests = new Counter('confirm_requests');
const successRate = new Rate('payment_success');

export default function () {
  const start = Date.now();
  const res = http.post('/payments/confirm', payload);
  confirmLatency.add(Date.now() - start);
  confirmRequests.add(1);
  successRate.add(res.status === 200);
}
```

`Trend` 생성자의 두 번째 인자 `true`는 값을 시간 단위(밀리초)로 해석하여 요약 출력의 가독성을 높이는 역할을 한다.

### 활용 사례

빌트인 메트릭만으로는 측정할 수 없는 영역을 커스텀 메트릭으로 보완한다.

- 다단계 호출의 E2E 시간: 결제 요청 후 폴링으로 확정까지 걸린 종단 간 소요 시간
- 비즈니스 메트릭: 성공한 결제 건수, 재시도 발생 횟수 등 도메인 단위 카운트
- 시나리오별 분리 측정: `http_req_duration`은 모든 호출이 섞이므로 시나리오별 비교 시 별도 Trend 필요

### 태그를 활용한 부분 집합 임계치

커스텀 메트릭과 빌트인 메트릭 모두 태그를 부여해 임계치를 부분 집합에 적용할 수 있다.

```javascript
http.post(url, payload, {
  tags: {class: 'write', scenario: 'throughput'},
});

export const options = {
  thresholds: {
    'http_req_duration{class:write}': ['p(95)<600'],
    'confirm_ms{scenario:throughput}': ['p(95)<200'],
  },
};
```

엔드포인트 부류별로 SLO를 차등 적용하거나 시나리오별 결과를 분리 판정하는 데 활용한다.

## Output — 결과를 외부 시스템으로

기본 출력은 종료 시점의 stdout 요약이며, 시계열 분석이 필요한 경우 외부 시스템으로 송출한다.

```bash
k6 run --out json=results.json script.js
k6 run --out experimental-prometheus-rw script.js
k6 run --out influxdb=http://localhost:8086/k6 script.js
k6 run --out cloud script.js
```

- JSON: 단순 후처리 또는 CI 아카이빙
- Prometheus Remote Write: Grafana 시계열 분석 (현장 표준)
- InfluxDB: 레거시 환경 호환
- Cloud: Grafana Cloud k6의 통합 대시보드

### handleSummary 후크

테스트 종료 시점의 결과를 JS로 가공하여 임의 형식으로 저장할 수 있다.

```javascript
import {textSummary} from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export function handleSummary(data) {
  return {
    'results.json': JSON.stringify(data, null, 2),
    'stdout': textSummary(data, {indent: ' ', enableColors: true}),
  };
}
```

- 케이스별 결과를 JSON 파일로 분리 저장하여 회귀 비교 자동화
- 사내 리포팅 형식(JUnit XML, HTML 등)으로 변환하여 CI 게시
- stdout 요약 포맷의 커스터마이징

## 자주 혼동하는 지점

부하 테스트 설계와 결과 해석 시 반복적으로 발생하는 오해를 정리한다.

|           혼동            |              정확한 이해               |
|:-----------------------:|:---------------------------------:|
|      VU 끝나야 다음 요청       | 그 VU의 다음 iteration. 다른 VU의 요청과 무관 |
|    dropped = 서버가 거절     |    클라이언트 측 발사 실패. 서버에 도달하지 않음     |
|    dropped = 데이터 유실     |   시도되지 않은 가상 요청. 영속 데이터 손실과 무관    |
| arrival-rate에서 VU = TPS | VU는 capacity 자원. TPS는 stages가 결정  |
|    constant-vus의 TPS    |     서버 응답 시간의 함수. 외부에서 강제 못 함     |
|      시나리오 간 VU 공유       |       각 시나리오는 독립된 VU 풀을 가짐        |
