---
title: "Garbage Collection"
date: 2024-06-17
lastUpdated: 2026-08-09
tags: [ Java ]
description: "JVM 가비지 컬렉션의 세대별 이동 단계와 Full GC 예방 전략, java.lang.ref 패키지를 활용한 객체 참조 제어 기법을 정리한다."
---

Java 프로그래밍 언어는 메모리 관리를 자동화하기 위해 가비지 컬렉션 (Garbage Collection, GC)이라는 메커니즘을 사용한다.

## 기본 개념

GC는 더 이상 유효하지 않은 메모리 (가비지)를 식별하고 정리하는 과정으로, 가비지를 식별하는 핵심 기준은 도달 가능성 (Reachability)이다.

- GC Roots: 참조 사슬의 시작점이 되는 객체
    - 실행 중인 스레드의 JVM 스택 (지역 변수, 매개 변수)
    - 메소드 영역 (Method Area)의 정적 (static) 변수
    - JNI (Java Native Interface)를 통해 참조되는 네이티브 객체
    - 활성화된 스레드 자체 및 시스템 클래스 로더
- 객체 식별: GC Roots로부터 시작하여 참조 사슬로 연결된 모든 객체는 살아있는 (reachable) 객체로 간주
    - Roots로부터 도달할 수 없는 (unreachable) 모든 객체는 가비지로 식별

### 핵심 메커니즘: Mark-Sweep-Compact

대부분의 GC 알고리즘은 식별된 가비지를 청소하고 메모리를 최적화하기 위해 3단계의 기본 메커니즘을 따른다.

- Mark (식별): GC Roots로부터 연결된 참조 사슬을 순회하며 도달 가능한 (Reachable) 객체들에 마킹함 (살아남을 객체를 식별)
- Sweep (회수): 메모리 전체를 스캔하며 마킹되지 않은 (Unreachable) 가비지 객체들의 메모리를 해제함
- Compact (압축): Sweep 이후 여기저기 흩어진 빈 메모리 공간을 모으기 위해 살아남은 객체들을 힙의 한쪽 끄트머리로 연속되게 모아 메모리 단편화 해결

## 기본 전제

JVM의 Heap 영역은 약한 세대 가설 (Weak Generational Hypothesis)에 기반하여 설계되었다.

- 대부분의 객체는 금방 접근 불가능한 상태 (Unreachable)가 됨
- 오래된 객체에서 새로운 객체로의 참조는 매우 드물게 발생함

즉, 객체는 대부분 일회성이며 메모리에 오랫동안 남아있는 경우는 드물다는 것을 기반으로 설계되었다.

## 힙 (Heap) 영역 구분

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

- 구조: Old 영역을 512바이트 단위의 카드 (Card)로 나누고, 각 카드마다 1바이트의 정보를 할당
- 동작: Old 영역 객체가 Young 영역 객체를 참조할 때마다 해당 카드를 더러운 상태 (Dirty)로 표시
- 성능 최적화: Minor GC 시 Old 영역 전체를 스캔하지 않고, 카드 테이블에서 Dirty로 표시된 카드만 조회하여 참조 여부를 확인하므로 STW 시간을 단축

## GC 동작 방식

### Stop-the-world

GC 실행을 위해 가비지 컬렉터 스레드를 제외한 모든 애플리케이션 스레드 실행을 일시적으로 멈추는 현상이다.

- 전체 스레드 중단: GC 완료 시까지 작업 중단 및 이후 재개
- 성능 영향: STW 시간 단축이 GC 튜닝 및 알고리즘 진화의 핵심 동기

### Minor GC와 객체 생명주기 (Life Cycle)

작은 영역에서 최적화된 가비지 컬렉션을 수행하므로 실행 시간이 짧고 애플리케이션 영향도가 낮다.

1. Eden 할당: 처음 `new`로 생성된 객체는 무조건 Eden 영역에 배치
2. Minor GC 발생 (Mark & Sweep): Eden 영역이 가득 차면 Minor GC가 트리거되어 가비지가 정리
3. Survivor 영역 이동: 살아남은 객체는 비어있는 Survivor (To Space) 영역으로 복사
    - 이때 객체의 생존 횟수를 의미하는 `age` 값이 1 증가
    - 이 과정에서 별도 압축 작업 없이 메모리 단편화 자연스럽게해결
4. 역할 교대: 꽉 찼던 이전 Survivor (From)와 Eden은 완전히 비워짐 (Sweep)
    - 다음 번 GC 때는 두 Survivor의 역할 (From/To)이 뒤바뀜
5. Old 승격 (Promotion): 이 생존 과정을 반복하며 `age`가 임계치 (Tenuring Threshold)를 넘긴 장수명 객체는 최종적으로 Old Generation으로 이동

일반적인 객체는 생성부터 소멸 (또는 승격)까지 위와 같은 생명주기를 거친다.

### Major GC (Old Generation)

Old 영역의 가용 공간이 부족해질 때 발생한다.

- 참조 복잡도: Young 영역보다 크고 참조 관계가 복잡하여 분석에 긴 시간 소요
- 성능 영향: Minor GC보다 훨씬 긴 STW 유발로 애플리케이션 응답성에 큰 영향 미침

## Full GC 예방

Full GC는 Young, Old, Metaspace를 한 번에 회수하는 가장 비용이 큰 GC로, 수 초에 달하는 STW로 인해 서비스 가용성에 직접적인 영향을 준다.

- Major GC와의 구분: Major GC는 Old 영역만 대상이지만, Full GC는 Heap 전체와 Metaspace까지 포함
- 핵심 트리거: Old 영역 가용 공간 부족, Promotion Failure, Metaspace 한계 도달, `System.gc()` 명시 호출

Full GC는 결국 Old 영역에 가비지가 누적되는 속도를 늦추는 것이 핵심이며, 코드 레벨 누수 차단부터 JVM 옵션 튜닝까지 다층적인 접근이 필요하다.

### 메모리 누수 차단

도달 가능 상태로 잘못 유지된 객체는 GC 대상에서 제외되어 Old 영역에 누적된다.

- 정적 컬렉션 누적: `static` 필드의 `Map`/`List`에 엔트리만 추가하고 제거하지 않을 때 발생
- ThreadLocal 정리 누락: 스레드 풀 환경에서 `remove()` 미호출 시 스레드 재사용으로 인해 영구 참조 유지
- 캐시 무한 증가: 만료 정책 없는 캐시 → 사이즈·시간 기반 축출 정책 적용 또는 `SoftReference` 활용
- 리스너·콜백 해제 누락: 등록만 하고 해제하지 않으면 이벤트 소스가 대상 객체의 강한 참조 유지

### 조기 승격 (Premature Promotion) 방지

Young 영역이 너무 작거나 Survivor 공간이 부족하면 단명 객체조차 Old로 넘어가 가비지 누적을 가속화한다.

- Young 영역 크기 확보: `-XX:NewRatio`(Old:Young 비율) 또는 `-Xmn`으로 Young 절대 크기 명시
- Survivor 비율 조정: `-XX:SurvivorRatio`로 Eden:Survivor 비율을 조정해 Survivor 부족으로 인한 즉시 승격 방지
- 객체 age 분포 점검: `-XX:+PrintTenuringDistribution`으로 Tenuring Threshold 적정성 검증

### 큰 객체 직접 할당 최소화

`PretenureSizeThreshold`를 넘는 큰 객체는 Eden을 거치지 않고 Old 영역에 직접 할당되어 Old 가비지 발생률을 높인다.

- 컬렉션 초기 용량 지정: `new ArrayList<>(expectedSize)`처럼 예상 크기 명시로 내부 배열 재할당으로 인한 큰 객체 양산 회피
- 버퍼·배열 재사용: 대용량 `byte[]`이나 `ByteBuffer`는 객체 풀 또는 `ThreadLocal`로 재활용

### GC 알고리즘 선택

워크로드 특성에 맞는 컬렉터를 선택하면 Full GC 발생 자체를 줄이거나 STW 시간을 대폭 단축할 수 있다.

|   컬렉터    |              특성               |        적합 시나리오        |
|:-----------:|:-------------------------------:|:---------------------------:|
|    G1 GC    | Region 단위 점진 회수, Mixed GC |  대용량 힙(4GB 이상) 서버   |
|     ZGC     |  동시 회수, STW 1ms 미만 보장   |    초저지연 요구 서비스     |
| Shenandoah  |       동시 압축, 짧은 STW       | 지연 민감 + ZGC 미지원 환경 |
| Parallel GC |      처리량 우선 STW 발생       | 응답성보다 처리량 위주 배치 |

### Heap과 Metaspace 크기 설정

크기 설정 자체가 Full GC 빈도와 회수 효율을 좌우한다.

- `-Xms`와 `-Xmx` 동일 설정: 런타임 힙 확장 비용 제거 및 OS 메모리 예측 가능성 확보
- Heap 적정 설정: 너무 작으면 빈번한 Full GC, 너무 크면 단일 회수 시 STW 시간 증가
- Metaspace 상한 명시: `-XX:MaxMetaspaceSize` 미설정 시 OS 메모리까지 확장되어 동적 클래스 로딩 누수 시 Full GC 폭주

### `System.gc()` 호출 통제

명시적 GC 호출은 즉시 Full GC를 트리거하며 외부 라이브러리 (NIO Direct Buffer 회수, RMI DGC 등)에서 호출되기도 한다.

- `-XX:+DisableExplicitGC`: `System.gc()` 호출을 무시하도록 설정
- `-XX:+ExplicitGCInvokesConcurrent`: G1/CMS 사용 시 Full GC 대신 Concurrent GC로 전환

### 모니터링과 조기 진단

Full GC 발생 후 대응이 아닌 사전 감지가 핵심이다.

- `jstat -gcutil`: Old 영역 점유율 (`O`) 추세를 관찰하여 누수 의심 패턴 조기 발견
- GC 로그 분석: `-Xlog:gc*:file=gc.log` (Java 9+) 또는 `-Xloggc:` (Java 8)로 Full GC 빈도와 회수 효율 추적
- 회수 효율 평가: Full GC 후에도 Old 점유율이 거의 줄지 않으면 메모리 누수 강하게 의심

## 프레임워크 내부의 참조 제어 (java.lang.ref)

일반적인 객체 생성은 항상 강한 참조를 형성하지만, JVM 메모리 엔진과 통신하는 `java.lang.ref` 패키지 클래스를 사용하면 GC 수거 시점에 개입할 수 있다.

### 참조 강도 및 GC 수거 정책

|  참조 유형  |                 GC 수거 시점                 |          주요 활용 사례 (Framework/Library)           |
|:-----------:|:--------------------------------------------:|:-----------------------------------------------------:|
|   Strong    |      참조가 살아있는 한 절대 수거 안 함      |     일반적인 비즈니스 객체, Spring 빈(Bean) 관리      |
|    Soft     | 힙 여유 공간과 마지막 사용 시간 계산 후 수거 | 캐시 라이브러리(Guava, Caffeine), 이미지 메모리 관리  |
|    Weak     |    다음 GC 주기가 돌아오면 즉시 수거 결정    |    WeakHashMap (Spring/Hibernate 메타데이터 캐싱)     |
|   Phantom   |   파이널라이즈 이후 메모리 회수 직전 알림    | Cleaner API (NIO Direct Buffer 등 네이티브 자원 해제) |
| Unreachable |     루트로부터 연결이 끊긴 즉시 가비지화     |              수명이 다한 모든 임시 객체               |

여러 가지 참조 유형과 수거 정책으로 인해, 다음과 같은 이점을 얻을 수 있게 된다.

- 메모리 효율화: `SoftReference`는 메모리 부족 시점에만 선별적으로 수거되어 힙 가용성을 극대화함
- 자동 리소스 정리: `WeakHashMap`은 Key에 대한 외부 참조가 사라지면 엔트리를 자동 삭제하여 메모리 누수를 방지함
- 안전한 사후 처리: `PhantomReference`는 `finalize()`의 성능 저하와 객체 부활 위험을 보완하여 명확한 자원 정리 시점을 제공함

###### 참고자료

- [NAVER D2 - Java Garbage Collection](https://d2.naver.com/helloworld/1329)
- [망나니개발자 티스토리](https://mangkyu.tistory.com/118)
- [Oracle Docs - Reference Objects](https://docs.oracle.com/javase/8/docs/api/java/lang/ref/package-summary.html)
