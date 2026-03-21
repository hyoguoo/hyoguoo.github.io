---
title: Repository
date: 2026-03-21
lastUpdated: 2026-03-21
tags: [ DDD ]
description: "애그리거트 단위의 영속성을 추상화하여 도메인 모델을 보호하고 데이터 저장소와의 결합도를 낮추는 리포지토리의 역할을 다룬다."
---

도메인 모델의 생명주기 중에서 영속성(Persistence)을 담당하며, 애그리거트를 메모리상의 컬렉션처럼 다룰 수 있게 추상화하는 리포지토리의 개념과 구현 원칙을 다룬다.

## 리포지토리의 역할

리포지토리는 도메인 모델과 데이터 인프라스트럭처 사이의 중재자 역할을 수행한다.

- 애그리거트 단위의 접근: 개별 엔티티가 아닌 애그리거트 루트를 통해서만 데이터에 접근
- 컬렉션 인터페이스 제공: 객체를 저장하고 조회하는 과정을 리스트나 셋과 같은 컬렉션처럼 추상화
- 영속성 메커니즘 캡슐화: 데이터베이스 연결, SQL 실행, 매핑 로직 등을 도메인 계층으로부터 은닉

객체 지향적인 도메인 모델이 관계형 데이터베이스(RDB)나 NoSQL과 같은 특정 저장 기술에 종속되지 않도록 격리하는 것이 핵심이다.

## 인터페이스와 구현의 분리

DDD에서는 의존성 역전 원칙(DIP)을 활용하여 리포지토리 인터페이스는 도메인 계층에 위치시키고, 실제 데이터베이스에 접근하는 구현체는 인프라스트럭처 계층에 위치시킨다.

|           계층            |           구성 요소           |                    역할                    |
|:-----------------------:|:-------------------------:|:----------------------------------------:|
|     도메인 계층 (Domain)     |   Repository Interface    |        도메인이 필요로 하는 데이터 접근 요구사항 정의        |
| 인프라 계층 (Infrastructure) | Repository Implementation | 특정 저장소 기술(JPA, MyBatis, Mongo 등)을 이용한 구현 |

이러한 구조를 통해 도메인 로직은 기술적 세부 사항에 오염되지 않고 순수하게 유지될 수 있다.

```java
// Domain Layer
public interface OrderRepository {

    Order save(Order order);

    Optional<Order> findById(Long id);
}

// Infrastructure Layer (JPA implementation)
@Repository
public class JpaOrderRepository implements OrderRepository {

    private final SpringDataJpaOrderRepository repository;

    @Override
    public Order save(Order order) {
        return repository.save(order);
    }
}
```

## 애그리거트와 영속성 원칙

리포지토리는 반드시 애그리거트 루트당 하나만 존재해야 한다.

- 일관성 보장: 애그리거트 전체를 하나의 단위로 저장하고 조회하여 데이터 정합성 유지
- 루트를 통한 제어: 내부 객체로의 직접적인 접근을 차단하여 비즈니스 규칙 보호
- 트랜잭션 범위: 하나의 리포지토리 작업은 보통 하나의 트랜잭션 범위 내에서 수행

## 테스트 용이성 및 모킹 전략

리포지토리를 인터페이스로 추상화하면 도메인 로직을 테스트할 때 실제 데이터베이스 없이도 검증이 가능하다.

- Mockito 활용: 인터페이스의 행위를 시뮬레이션하여 서비스 로직 검증
- 인메모리 DB: H2 등을 사용하여 실제 영속성 환경과 유사한 통합 테스트 수행
- 계층별 테스트 분리: 도메인 로직 테스트와 데이터 접근 로직 테스트를 명확히 구분

리포지토리는 단순히 데이터를 저장하는 도구가 아니라, 도메인 모델의 무결성을 지키고 기술적 복잡성을 격리하는 중요한 설계 장치다.
