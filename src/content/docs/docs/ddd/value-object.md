---
title: Value Object (VO)
date: 2026-03-19
lastUpdated: 2026-03-19
tags: [ DDD ]
description: "도메인 모델의 핵심인 밸류 오브젝트(VO)의 개념과 특징, 엔티티와의 차이점을 상세히 다룬다."
---

밸류 오브젝트(Value Object)는 도메인의 특정한 개념을 표현하는 객체로, 식별자가 아닌 속성 값 자체로 정체성을 가진다.

## Entity vs Value Object

도메인 객체는 식별자의 필요 여부에 따라 엔티티와 밸류 오브젝트로 나뉜다.

|   구분   |       엔티티 (Entity)        |        밸류 오브젝트 (VO)         |
|:------:|:-------------------------:|:---------------------------:|
|  식별성   |      고유 식별자(ID)로 구분       |        내부 속성 값들로 구분         |
|  정체성   | 식별자가 유지되는 한 상태가 변해도 동일 객체 |    속성 값 중 하나라도 변하면 다른 객체    |
| 동등성 비교 |   식별자 비교 (ID Equality)    | 모든 속성 값 비교 (Value Equality) |
|  불변성   |    일반적으로 가변 (Mutable)     |     반드시 불변 (Immutable)      |

- 엔티티: 추적이 필요한 연속적인 생명주기를 가짐
- 밸류 오브젝트: 특정 시점의 개념적 완성도를 표현하며 추적할 필요가 없음

## VO의 핵심 특성과 이점

### 불변성과 부수 효과 방지

VO는 생성 후 상태가 변하지 않으므로 부수 효과(Side Effect)로부터 안전하다.

- 스레드 안전성: 상태 변경이 없으므로 멀티스레드 환경에서 별도의 동기화 없이 공유 가능
- 단순한 상태 관리: 객체가 유효한 상태로 생성되었다면 생명주기 내 유효성 보장
- 명확한 의도 표현: Setter를 배제하고 생성자나 정적 팩토리 메서드로만 생성하여 의도를 명확히 함

객체의 값을 변경해야 한다면 기존 객체를 수정하는 대신 새로운 값을 가진 객체를 생성하여 교체하는 방식을 사용한다.

### 자가 검증을 통한 도메인 규칙 강제

VO는 생성 시점에 도메인 규칙을 검증하여 잘못된 상태의 객체 생성을 원천 차단한다.

- 유효성 보장: VO를 사용하는 엔티티나 서비스는 해당 객체가 항상 올바른 상태임을 신뢰할 수 있음
- 로직 중복 제거: 동일한 개념(예: 이메일, 금액)에 대한 검증 로직을 VO 한 곳에서 관리

이는 서비스 레이어에 흩어져 있는 검증 로직을 도메인 모델 내부로 응집시키는 효과를 준다.

### 풍부한 행위의 응집 (Side-effect-free Functions)

VO는 단순히 데이터를 담는 구조체가 아니라, 자신과 관련된 연산 로직을 포함하는 풍부한 모델이어야 한다.
이때 연산 결과는 항상 새로운 VO를 반환하는 부수 효과 없는 함수(Side-effect-free Function) 형태를 띤다.

- 복잡성 하향: 복잡한 계산 로직을 작은 VO 단위로 쪼개어 가독성과 테스트 용이성 확보
- 도메인 언어 투영: `amount + amount` 대신 `money.add(otherMoney)`와 같이 비즈니스 언어를 코드에 직접 투영

## 구현 예시

### 자가 검증 및 불변 구현 (Java)

Java Record를 활용하면 불변성과 동등성 비교를 간결하게 구현할 수 있다.

```java
public record Percentage(int value) {

    public Percentage {
        if (value < 0 || value > 100) {
            throw new IllegalArgumentException("백분율은 0과 100 사이여야 합니다.");
        }
    }

    public Percentage add(Percentage other) {
        return new Percentage(this.value + other.value);
    }
}
```

- Compact Constructor: Record의 생성자에서 검증 로직을 수행
- 메서드 확장: 단순 필드 접근 외에 비즈니스 의미가 담긴 행위 추가

### JPA 임베디드 타입 활용

도메인 모델의 VO를 DB 테이블의 컬럼으로 매핑할 때는 `@Embeddable`을 사용한다.

- 응집도 향상: 주소(Address), 기간(Period) 등 관련 있는 컬럼들을 하나의 객체로 묶어 관리
- 재사용성: 여러 엔티티에서 동일한 VO 구조를 재사용 가능

```java

@Embeddable
public class Period {

    private LocalDateTime startDate;
    private LocalDateTime endDate;

    protected Period() {
    } // JPA를 위한 기본 생성자

    public Period(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("시작일은 종료일보다 빨라야 합니다.");
        }
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public boolean isOverlapped(Period other) {
        return this.startDate.isBefore(other.endDate) && other.startDate.isBefore(this.endDate);
    }
}
```
