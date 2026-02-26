---
title: "reactive-programming"
date: 2025-10-01
lastUpdated: 2025-10-01
---

반응형 프로그래밍(Reactive Programming)은 데이터 흐름(Data Stream)과 변경 사항 전파(Propagation of Change)에 중점을 둔 프로그래밍 패러다임이다.

## 핵심 개념

- 데이터 스트림(Data Stream)
    - 클릭 이벤트, HTTP 요청, 데이터베이스 결과 등 발생하는 모든 것을 스트림으로 표현
    - 개발자는 이 스트림을 구독(subscribe)하고, 데이터가 발생할 때마다 특정 동작을 수행하도록 정의 가능
- 비동기 & 논블로킹(Asynchronous & Non-Blocking)
    - 작업을 요청한 스레드가 결과에 묶이지 않고(Non-Blocking) 다른 작업을 계속 수행
    - 결과는 나중에 별도의 매커니즘을 통해(Asynchronous) 전달
- 배압(Backpressure)
    - 데이터를 발행하는 쪽(Publisher)이 구독하는 쪽(Subscriber)의 처리 속도를 고려하지 않고 너무 많은 데이터를 보내면 소비자가 감당하지 못하는 상황 발생
    - 배압은 구독자가 자신이 처리할 수 있는 데이터의 양을 발행자에게 요청하여 데이터 흐름을 조절하는 중요한 매커니즘

## Reactive Streams 명세

반응형 프로그래밍을 구현하는 라이브러리들이 서로 호환될 수 있도록 JVM 환경에서는 Reactive Streams라는 표준 사양을 정의하였다.

1. Publisher(발행자): 데이터 스트림을 생성하고 발행하는 주체
2. Subscriber(구독자): Publisher가 발행한 데이터를 수신하여 처리하는 주체
3. Subscription(구독 정보): Publisher와 Subscriber 사이의 연결을 나타내며, 구독자가 데이터를 얼마나 요청할지(배압) 제어하는 역할
4. Processor(프로세서): Publisher와 Subscriber의 역할을 동시에 수행하여 데이터 스트림을 중간에서 가공하거나 변환하는 역할

Spring WebFlux, RxJava, Project Reactor와 같은 라이브러리들은 모두 이 Reactive Streams 사양을 준수하여 만들어졌기 때문에 함께 연동하여 사용할 수 있다.
