---
title: "Garbage Collection"
date: 2024-06-17
lastUpdated: 2026-03-04
tags: [ Java ]
description: "JVM 가비지 컬렉션의 세대별 이동 단계와 java.lang.ref 패키지를 활용한 객체 참조 제어 기법을 정리한다."
---

Java 프로그래밍 언어는 메모리 관리를 자동화하기 위해 가비지 컬렉션(Garbage Collection, GC)이라는 메커니즘을 사용한다.

## 기본 개념

GC는 더 이상 유효하지 않은 메모리(가비지)를 식별하고 정리하는 과정으로, 가비지를 식별하는 핵심 기준은 도달 가능성(Reachability)이다.

- GC Roots: 참조 사슬의 시작점이 되는 객체
    - 실행 중인 스레드의 JVM 스택 (지역 변수, 매개 변수)
    - 메소드 영역(Method Area)의 정적(static) 변수
    - JNI(Java Native Interface)를 통해 참조되는 네이티브 객체
    - 활성화된 스레드 자체 및 시스템 클래스 로더
- 객체 식별: GC Roots로부터 시작하여 참조 사슬로 연결된 모든 객체는 살아있는(reachable) 객체로 간주
    - Roots로부터 도달할 수 없는(unreachable) 모든 객체는 가비지로 식별

## 기본 전제

JVM의 Heap 영역은 약한 세대 가설(Weak Generational Hypothesis)에 기반하여 설계되었다.

- 대부분의 객체는 금방 접근 불가능한 상태(Unreachable)가 됨
- 오래된 객체에서 새로운 객체로의 참조는 매우 드물게 발생함

즉, 객체는 대부분 일회성이며 메모리에 오랫동안 남아있는 경우는 드물다는 것을 기반으로 설계되었다.

## 힙(Heap) 영역 구분

전제를 기반으로 JVM의 Heap 영역은 객체의 생존 기간에 따라 Young Generation과 Old Generation으로 나뉜다.

- Young Generation: 새로 생성된 객체가 할당되는 영역
    - 대부분의 객체는 금방 사라지므로 많은 객체가 생성되었다가 소멸함
    - Young 영역에 대한 가비지 컬렉션은 Minor GC라 칭함
    - 효율적인 GC를 위해 Eden, Survivor 0, Survivor 1 세 부분으로 구분
- Old Generation: Young Generation에서 살아남은 객체가 복사되는 영역
    - 크기가 큰 객체는 바로 Old 영역에 할당되기도 함
    - Young 영역보다 크게 할당되며 가비지 발생 빈도가 낮음
    - Old 영역에 대한 가비지 컬렉션은 Major GC라 칭함

### Card Table

Old 영역의 객체가 Young 영역의 객체를 참조하는 경우를 효율적으로 관리하기 위해 도입된 자료구조이다.

- 구조: Old 영역을 512바이트 단위의 카드(Card)로 나누고, 각 카드마다 1바이트의 정보를 할당
- 동작: Old 영역 객체가 Young 영역 객체를 참조할 때마다 해당 카드를 더러운 상태(Dirty)로 표시
- 성능 최적화: Minor GC 시 Old 영역 전체를 스캔하지 않고, 카드 테이블에서 Dirty로 표시된 카드만 조회하여 참조 여부를 확인하므로 STW 시간을 획기적으로 단축

## GC 동작 방식

### Stop-the-world

GC 실행을 위해 가비지 컬렉터 스레드를 제외한 모든 애플리케이션 스레드 실행을 일시적으로 멈추는 현상이다.

- 전체 스레드 중단: GC 완료 시까지 작업 중단 및 이후 재개
- 성능 영향: STW 시간 단축이 GC 튜닝 및 알고리즘 진화의 핵심 동기

### Minor GC(Young Generation)

작은 영역에서 최적화된 가비지 컬렉션을 수행하므로 실행 시간이 짧고 애플리케이션 영향도가 낮다.

1. Eden 영역 할당: 새로 생성된 객체 배치
2. Minor GC 실행: Eden 영역 포화 시 발생
    - 사용되지 않는 객체 메모리 해제
    - 살아남은 객체는 Survivor 영역 이동
3. Survivor 이동: Survivor 영역 포화 시 살아남은 객체를 다른 Survivor 영역으로 이동
4. Old 영역 이동: 계속해서 생존한 객체는 Old 영역으로 승격(Promotion)

#### Survivor 영역이 2개인 이유

- Survivor 영역의 메모리를 정리하면 메모리들은 연속적으로 배치되지 않게 되면서 단편화 발생
- 새 영역으로 이동하게 되면 메모리가 연속적으로 배치됨

결과적으로 메모리 단편화가 줄어들어 가비지 컬렉션 성능을 향상시킬 수 있게 된다.

### Major GC(Old Generation)

Old 영역의 가용 공간이 부족해질 때 발생한다.

- 참조 복잡도: Young 영역보다 크고 참조 관계가 복잡하여 분석에 긴 시간 소요
- 성능 영향: Minor GC보다 훨씬 긴 STW 유발로 애플리케이션 응답성에 큰 영향 미침

## 프레임워크 내부의 참조 제어 (java.lang.ref)

일반적인 객체 생성은 항상 강한 참조를 형성하지만, JVM 메모리 엔진과 통신하는 `java.lang.ref` 패키지 클래스를 사용하면 GC 수거 시점에 개입할 수 있다.

### 참조 강도 및 GC 수거 정책

|    참조 유형    |          GC 수거 시점          |         주요 활용 사례 (Framework/Library)         |
|:-----------:|:--------------------------:|:--------------------------------------------:|
|   Strong    |    참조가 살아있는 한 절대 수거 안 함    |       일반적인 비즈니스 객체, Spring 빈(Bean) 관리        |
|    Soft     | 힙 여유 공간과 마지막 사용 시간 계산 후 수거 |    캐시 라이브러리(Guava, Caffeine), 이미지 메모리 관리     |
|    Weak     |  다음 GC 주기가 돌아오면 즉시 수거 결정   |   WeakHashMap (Spring/Hibernate 메타데이터 캐싱)    |
|   Phantom   |   파이널라이즈 이후 메모리 회수 직전 알림   | Cleaner API (NIO Direct Buffer 등 네이티브 자원 해제) |
| Unreachable |    루트로부터 연결이 끊긴 즉시 가비지화    |               수명이 다한 모든 임시 객체                |

여러 가지 참조 유형과 수거 정책으로 인해, 다음과 같은 이점을 얻을 수 있게 된다.

- 메모리 효율화: `SoftReference`는 메모리 부족 시점에만 선별적으로 수거되어 힙 가용성을 극대화함
- 자동 리소스 정리: `WeakHashMap`은 Key에 대한 외부 참조가 사라지면 엔트리를 자동 삭제하여 메모리 누수를 방지함
- 안전한 사후 처리: `PhantomReference`는 `finalize()`의 성능 저하와 객체 부활 위험을 보완하여 명확한 자원 정리 시점을 제공함

###### 참고자료

- [NAVER D2 - Java Garbage Collection](https://d2.naver.com/helloworld/1329)
- [망나니개발자 티스토리](https://mangkyu.tistory.com/118)
- [Oracle Docs - Reference Objects](https://docs.oracle.com/javase/8/docs/api/java/lang/ref/package-summary.html)
