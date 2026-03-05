---
title: "Spring Cloud Basic"
date: 2025-10-10
lastUpdated: 2026-03-05
tags: [ Spring ]
description: "Spring Cloud의 핵심 모듈인 Gateway·Eureka·Config·Resilience4j의 역할과 MSA 환경의 인증 흐름 및 복원성 설정을 정리한다."
---

Spring Cloud는 분산 시스템, 특히 마이크로서비스 아키텍처(MSA)를 구축할 때 공통적으로 발생하는 문제들을 해결하기 위한 기능들 제공하는 프레임워크다.

|   핵심 기능   |        해결 모듈         |        기능 요약        |
|:---------:|:--------------------:|:-------------------:|
| 서비스 디스커버리 |        Eureka        | 서비스 인스턴스 위치 관리 및 탐색 |
| API 게이트웨이 | Spring Cloud Gateway | 단일 진입점 역할, 라우팅, 필터링 |
| 중앙 집중식 설정 | Spring Cloud Config  |   외부 설정 파일 통합 관리    |
| 탄력성 및 복원력 |     Resilience4j     | 장애 전파 방지 및 결함 내성 확보 |

## Spring Cloud 주요 모듈

|            모듈 이름            |           주요 기능            |
|:---------------------------:|:--------------------------:|
|    Spring Cloud Gateway     |   비동기 논블로킹 기반 라우팅 및 필터링    |
| Spring Cloud Netflix Eureka |        서비스 등록 및 탐색         |
|     Spring Cloud Config     |          환경 설정 관리          |
|   Spring Cloud OpenFeign    |  인터페이스 기반 선언적 REST 클라이언트   |
|        Resilience4j         | 서킷 브레이커, 재시도, 벌크헤드 등 패턴 지원 |
|     Spring Cloud Stream     |       메시지 브로커 연동 추상화       |

## 핵심 모듈 상세 분석

### Spring Cloud Gateway

모든 외부 요청을 수용하는 단일 진입점으로 비동기 논블로킹 방식으로 동작하여 높은 성능을 제공한다.

- 구성 요소
    - Route: 요청을 처리할 목적지 정보. ID, URI, Predicate, Filter로 구성
    - Predicate: 요청의 경로, 헤더, 파라미터 등을 검사하여 라우트 매칭 여부 결정
    - Filter: 요청 전달 전후에 실행되는 로직. 헤더 변조, 인증, 로깅 등 수행
- 인증 및 인가 흐름
    1. 클라이언트 요청: 게이트웨이로 JWT 등 인증 토큰을 포함한 요청 전달
    2. Global Filter 실행: 토큰 유효성 검사 및 사용자 권한 확인
    3. 목적지 라우팅: 인증 성공 시 내부 마이크로서비스로 요청 중계
    4. 보안 강화: 내부 서비스 호출 시 게이트웨이에서 검증된 정보를 헤더에 추가하여 전달(Header Propagation)

### Eureka (Service Discovery)

서비스 인스턴스의 네트워크 위치를 동적으로 관리하는 서버다.

- 동작 메커니즘
    - 서비스 등록: 각 인스턴스는 시작 시 자신의 이름과 주소를 Eureka에 등록
    - 주기적 갱신: 클라이언트는 생존 신호(Heartbeat)를 주기적으로 전송
    - 캐싱: 다른 서비스를 호출하려는 클라이언트는 Eureka로부터 전체 목록을 내려받아 로컬 보관
- 자기보호 모드(Self-Preservation)
    - 일시적인 네트워크 장애로 다수의 하트비트가 유실될 때 인스턴스를 즉시 제거하지 않고 유지하는 기능
        - 다수의 문제인 경우 네트워크 일시적인 문제로 판단
        - 제거했다면, 정상적인 서비스들이 서로를 찾지 못하는 문제 발생 가능
    - 네트워크 복구 시 서비스 가용성을 보장하기 위한 안전장치 역할 수행
- Client-Side Load Balancing
    - Eureka 자체는 로드 밸런서가 아니며, `Client-Side Load Balancing` 방식 사용
    - 클라이언트(Spring Cloud Gateway나 RestTemplate)가 Eureka로부터 특정 서비스의 인스턴스 목록을 받아와 자체적으로 요청을 분산 처리

### Resilience4j (Fault Tolerance)

장애 발생 시 시스템이 완전히 멈추지 않고 최소한의 기능을 유지하도록 돕는다.

- 실패율 임계치: 일정 비율 이상의 요청이 실패하면 회로 차단(Open)
- 대기 시간: 차단 상태에서 일정 시간 경과 후 반개방(Half-Open) 상태 전환
- 폴백(Fallback): 장애 시 사용자에게 제공할 대체 응답 정의

```yaml
resilience4j:
  circuitbreaker:
    instances:
      userService:
        slidingWindowSize: 10          # 분석할 최근 요청 수
        failureRateThreshold: 50       # 50% 실패 시 차단
        waitDurationInOpenState: 10s   # 차단 유지 시간
        permittedNumberOfCallsInHalfOpenState: 3 # 테스트 요청 수
```
