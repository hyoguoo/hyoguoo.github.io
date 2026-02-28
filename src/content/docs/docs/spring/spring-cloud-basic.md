---
title: "Spring Cloud Basic"
date: 2025-10-10
lastUpdated: 2025-10-11
tags: [Spring]
description: "Spring Cloud의 핵심 모듈인 Gateway·Eureka·Config·Resilience4j의 역할을 설명하고 MSA 환경에서의 서비스 디스커버리와 API 게이트웨이 동작 방식을 정리한다."
---

Spring Cloud는 분산 시스템, 특히 마이크로서비스 아키텍처(MSA)를 구축할 때 공통적으로 발생하는 문제들을 해결하기 위한 기능들 제공하는 프레임워크다.

| 핵심 기능           | 해결 모듈                | 기능 요약                       |
|:----------------|:---------------------|:----------------------------|
| 서비스 디스커버리       | Eureka               | 서비스 인스턴스의 동적 위치를 이름으로 찾고 관리 |
| 라우팅 및 API 게이트웨이 | Spring Cloud Gateway | 모든 요청의 단일 진입점 역할 및 라우팅, 필터링 |
| 중앙 집중식 설정       | Spring Cloud Config  | 여러 서비스의 설정 파일 중앙 관리         |
| 탄력성 및 복원력       | Resilience4J         | 장애가 전체 시스템으로 전파되는 것을 방지     |

## Spring Cloud 모듈 리스트

Spring Cloud는 다양한 하위 프로젝트(모듈)로 구성되어 있으며, 필요한 기능에 맞게 적절한 모듈을 선택하여 사용할 수 있다.

| 모듈 이름                       | 주요 기능                          |
|:----------------------------|:-------------------------------|
| Spring Cloud Gateway        | API 게이트웨이, 라우팅, 필터링(비동기 논블로킹)  |
| Spring Cloud Netflix Eureka | 서비스 탐색(Service Discovery)      |
| Spring Cloud Config         | 중앙화된 외부 설정 관리                  |
| Spring Cloud OpenFeign      | 선언적(Declarative) REST 클라이언트    |
| Resilience4j                | 회복성 패턴 (서킷 브레이커, 재시도 등)        |
| Spring Cloud Sleuth         | 분산 추적 (로깅)                     |
| Spring Cloud Stream         | 메시지 기반 마이크로서비스 구축 프레임워크        |
| Spring Cloud Bus            | 설정 변경 등 상태 변경 이벤트를 여러 인스턴스에 전파 |

## 핵심 모듈

### Spring Cloud Gateway

시스템의 모든 외부 요청이 거쳐가는 단일 진입점(Single Point of Entry) 역할을 하는 API 게이트웨이로, 비동기 논블로킹 방식으로 동작하여 높은 성능을 제공한다.

- Route: ID, 목적지 URI, 조건(Predicate) 및 필터(Filter)로 구성
- Predicate: 들어온 요청을 평가하여 Route와 매칭시키는 조건. 경로(Path), 헤더(Header), 쿠키(Cookie) 등 다양한 조건으로 설정 가능
- Filter: 매칭된 요청이 다운스트림 서비스로 전달되기 전후에 특정 로직을 수행
    - GatewayFilter: 특정 라우트에만 적용
    - GlobalFilter: 모든 라우트에 공통으로 적용

### Eureka

MSA 환경에서 각 서비스의 위치 정보(IP, Port)를 등록하고 조회할 수 있는 서비스 디스커버리(Service Discovery) 서버이다.

- 동작 방식
    1. Register(등록): 각 서비스 인스턴스(Eureka Client)는 시작 시 자신의 메타데이터(이름, IP, 포트 등)를 Eureka Server에 등록
    2. Renew(갱신): 클라이언트는 주기적으로 하트비트(Heartbeat)를 서버에 보내 자신이 살아있음을 알림
    3. Fetch Registry(목록 조회): 클라이언트는 서버로부터 전체 서비스 등록 정보를 주기적으로 가져와 로컬에 캐싱
    4. Cancel(취소): 서비스가 정상적으로 종료될 때, 서버에 등록 해제 요청
- 특징
    - Self-Preservation Mode(자기보호 모드)
        - 목적: 개별 서비스의 장애가 아니라, 일시적인 네트워크 단절로 인해 다수의 클라이언트로부터 하트비트를 받지 못하는 상황을 대비한 방어 메커니즘
        - 동작: Eureka Server가 다수의 클라이언트로부터 하트비트를 받지 못하는 경우 일시적인 문제로 판단하여 기존 레지스트리를 유지
            - 만약 제거하면 네트워크가 복구되었을 때 정상적인 서비스들이 서로를 찾지 못하는 연쇄 장애로 이어질 수 있음
    - Client-Side Load Balancing
        - Eureka 자체는 로드 밸런서가 아니며, `Client-Side Load Balancing` 방식 사용
        - 클라이언트(Spring Cloud Gateway나 RestTemplate)가 Eureka로부터 특정 서비스의 인스턴스 목록을 받아와 자체적으로 요청을 분산 처리
