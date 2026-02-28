---
title: "Standard Exceptions"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: "IllegalArgumentException, IllegalStateException 등 자주 재사용되는 Java 표준 예외의 종류와 적절한 선택 기준을 정리한다."
---

> 표준 예외를 사용하라

코드를 재사용하는 것은 좋은 일이다. 마찬가지로 예외도 재사용하는 것이 좋으며, 자바 라이브러리는 대부분 API에서 쓰기에 충분한 수의 예외를 제공한다.  
표준 예외를 사용하면 아래와 같은 장점을 얻을 수 있다.

- 다른 사람이 익히고 사용하기 쉬움
- 예외 클래스가 적을수록 메모리 사용량도 줄고, 클래스를 적재하는 시간도 적게 걸림

표준 예외 중 가장 많이 재사용되는 예외는 다음과 같다.

- `IllegalArgumentException`: 인수로 부적절한 값을 넘길 때 발생(반복 횟수에 음수를 넘기는 경우 등)
    - 부적절한 값을 넘기는 상황 중 아래 두 가지 경우는 아래의 예외를 사용한다.
    - `NullPointerException`: null을 허용하지 않는 메서드에 null을 넘길 때 발생
    - `IndexOutOfBoundsException`: 인덱스 범위를 넘어설 때 발생
- `IllegalStateException`: 객체가 메서드를 수행하기에 적절하지 않은 상태일 때 발생(초기화 되지 않은 객체를 사용하는 경우 등)
- `ConcurrentModificationException`: 단일 스레드에서 사용하려고 설계된 객체를 여러 스레드에서 사용하려고 할 때 발생
- `UnsupportedOperationException`: 요청한 동작을 대상 객체가 지원하지 않을 때 발생(원소를 넣을 수만 있는 List에 원소를 삭제하려고 할 때 등)

이 외에도 다른 표준 예외들이 존재하니, 만약 현재 상황에 부합하는 표준 예외가 있다면 그것을 사용하자.  
기존 예외에서 더 많은 정보를 제공하고 싶다면, 예외를 확장해서 새로운 예외를 만드는 방법도 있다.

## 적절한 예외 선택 가이드

로직을 작성하다보면 재사용할 예외 선택이 어려울 수 있다. 상황은 아래라고 가정하자.

- 카드 덱을 표현하는 객체 존재
- 인수로 건넨 수만큼 카드를 뽑아 반환하는 메서드 존재
- 만약 덱에 남은 카드가 인수로 건넨 수보다 적다면 예외를 던짐

이 상황에선 인수의 값이 큰 경우엔 `IllegalArgumentException`을, 남은 카드 수가 적다고 보면 `IllegalStateException`을 던지는 것, 두 가지 방법이 있다.  
이런 상황에선 일반적인 규칙은 다음과 같다.

- `IllegalStateException`: 인수 값이 무엇이었든 실패하는 상태인 경우
- `IllegalArgumentException`: 그렇지 않은 경우
