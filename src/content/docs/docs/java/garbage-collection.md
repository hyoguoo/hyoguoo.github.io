---
title: "Garbage Collection"
date: 2024-06-17
lastUpdated: 2025-10-29
tags: [Java]
description: ""
---

Java 프로그래밍 언어는 메모리 관리를 자동화하기 위해 가비지 컬렉션(Garbage Collection, GC)이라는 메커니즘을 사용한다.

## 기본 개념

GC는 더 이상 유효하지 않은 메모리(가비지)를 식별하고 정리하는 과정으로, 가비지를 식별하는 핵심 기준은 '도달 가능성(Reachability)'이다.

- GC Roots
    - GC는 특정 기준점들로부터 객체 참조 추적
    - GC Roots 주요 대상
        1. 실행 중인 스레드의 JVM 스택 (지역 변수, 매개 변수)
        2. 메소드 영역(Method Area)의 정적(static) 변수
        3. JNI(Java Native Interface)를 통해 참조되는 네이티브 객체
- 객체 식별
    - GC Roots로부터 시작하여, 참조 사슬로 연결된 모든 객체는 '살아있는(reachable)' 객체로 간주
    - Roots로부터 도달할 수 없는(unreachable) 모든 객체는 가비지로 식별

```java
public static void main(String[] args) {
    Book book = new Book(); // 'book' 변수(GC Root)가 new Book() 객체를 참조
    book = null; // 'book' 변수가 참조를 잃음. 다른 곳에서도 참조하지 않는다면 이 객체는 'unreachable' 상태가 됨
}
```

## 기본 전제

JVM의 Heap 영역은 다음 두 가지 전제를 기반으로 설계되었다.

- 대부분의 객체는 금방 접근 불가능한 상태(Unreachable)가 됨
- 오래된 객체에서 새로운 객체로의 참조는 드물게 발생

즉, 객체는 대부분 일회성이며, 메모리에 오랫동안 남아있는 경우는 드물다는 것을 기반으로 설계되었다.

## 힙(Heap) 영역 구분

위 전제를 기반으로 했기 때문에 JVM의 Heap 영역은 객체의 생존 기간에 따라 Young Generation과 Old Generation으로 나누어진다.

- Young Generation
    - 새로 생성된 객체가 할당되는 영역
    - 대부분의 객체는 금방 사라지기 때문에, 많은 객체가 Young 영역에 생성되었다가 사라짐
    - Young 영역에 대한 가비지 컬렉션을 Minor GC라고 부름
    - 더 효율적인 GC를 위해 Young 영역을 세 부분으로 나눔
        - Eden: 새로 생성된 객체가 할당되는 영역
        - Survivor: Eden 영역에서 살아남은 객체가 복사되는 영역, 두 개의 Survivor 영역이 존재
            - 두 영역 중 하나는 항상 비어있으며, 한 번에 하나의 Survivor 영역만 사용
- Old Generation
    - Young 영역에서 살아남은 객체가 복사되는 영역
    - 크기가 큰 객체는 바로 Old 영역에 할당됨
    - Young 영역보다 크게 할당되며, 가비지는 적게 발생
    - Old 영역에 대한 가비지 컬렉션을 Major GC라고 부름

### Card Table

Old 영역에 있는 객체가 Young 영역의 객체를 참조하는 경우가 발생할 수 있는데, 이를 위해 Old 영역에는 카드 테이블이 존재한다.

- 카드 테이블은 Old 영역에 있는 객체가 Young 영역의 객체를 참조할 때마다 그 정보를 표시
- Young 영역에서 가비지 컬렉션이 진행될 때 카드 테이블만 조회하여 GC의 대상인지 식별할 수 있도록 함

카드테이블이 없으면, Minor GC가 실행될 때 Old 영역의 객체가 Young 영역의 객체를 참조하는지 확인하기 위해 모든 객체를 스캔해야 하므로 성능 저하의 원인이 된다.

## GC 동작 방식

### Stop-the-world

GC를 실행하기 위해, 가비지 컬렉터 스레드를 제외한 모든 애플리케이션 스레드의 실행을 일시적으로 멈추는 현상을 의미한다.

- Minor GC와 Major GC 모두 STW를 유발
- GC가 실행될 때는 GC를 실행하는 스레드를 제외한 모든 스레드들의 작업 중단(GC가 완료되면 작업 재개)

때문에 Stop-the-world의 시간을 줄이는 것이 GC 성능 개선의 핵심이 된다.

### Minor GC(Young Generation)

Minor GC는 작은 영역에서 최적화된 가비지 컬렉션을 수행하므로, 실행 시간이 짧기 때문에 애플리케이션에 큰 영향을 주지 않는다.

1. 새로 생성된 객체가 Eden 영역에 할당
2. Eden 영역이 꽉 차면 Minor GC가 실행
    1) Eden 영역에서 사용되지 않는 객체의 메모리 해제
    2) Eden 영역에서 살아남은 객체는 Survivor 영역으로 이동
3. 2번 과정이 반복되다가 하나의 Survivor 영역이 가득 차면 살아남은 객체를 다른 Survivor 영역으로 이동
4. 계속해서 살아남은 객체는 Old 영역으로 이동

- Survivor 영역이 2개인 이유
    - Survivor 영역의 메모리를 정리하면 메모리들은 연속적으로 배치되지 않게 되면서 단편화 발생
    - 새 영역으로 이동하게 되면 메모리가 연속적으로 배치됨

결과적으로 메모리 단편화가 줄어들어 가비지 컬렉션 성능을 향상시킬 수 있게 된다.

### Major GC

Major GC(또는 Full GC)는 Old Generation 영역의 메모리가 부족해질 때 발생한다.

- 일반적으로 Old Generation은 Young Generation보다 크고, 객체 참조 관계도 더 복잡
- 따라서 Major GC는 Minor GC보다 훨씬 더 오랜 시간이 소요되며, STW 시간도 길어져 애플리케이션 성능에 큰 영향을 미침


###### 참고자료

- [NAVER D2 - Java Garbage Collection](https://d2.naver.com/helloworld/1329)
- [망나니개발자 티스토리](https://mangkyu.tistory.com/118)
