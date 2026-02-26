---
title: "Spring & OOP"
date: 2022-10-10
lastUpdated: 2025-08-22
---

스프링은 객체지향 설계를 가능하게 만드는 인프라를 제공한다.

- IoC(Inversion of Control) / DI(Dependency Injection)
- AOP(Aspect Oriented Programming)
- PSA(Portable Service Abstraction)
- 이벤트(Event)

위와 같은 기술로 작성하는 코드는 비즈니스 규칙에 집중하고, 기술 · 부가기능은 프레임워크에 위임하는 구조를 만든다.

## IoC/DI - 추상화와 의존성 주입

구현 대신 인터페이스에 의존하도록 설계하고, 스프링 컨테이너가 의존성을 주입한다. 이를 통해 구현 교체가 용이해지고, 코드의 결합도를 낮출 수 있다.

- 객체는 인터페이스에 의존하고 구현 주입은 컨테이너가 담당
- 프로파일/설정만 바꿔 구현을 교체할 수 있어 테스트 · 배포 환경 분리 용이

```java
public interface PaymentGateway {

    void authorize(String orderId, long amount);
}

@Service
class TossPaymentsGateway implements PaymentGateway {

    public void authorize(String orderId, long amount) { /* ... */ }
}

@Primary
@Service
class KakaoPayGateway implements PaymentGateway {

    public void authorize(String orderId, long amount) { /* ... */ }
}

@Service
class PaymentService {

    private final PaymentGateway gateway;

    public PaymentService(@Qualifier("tossPaymentsGateway") PaymentGateway gateway) {
        this.gateway = gateway;
    }
}
```

## AOP - 관심사 분리

로깅, 보안 같은 횡단 관심사를 비즈니스 로직에서 분리하여 관리할 수 있다. 스프링 트랜잭션의 `@Transactional` 어노테이션도 AOP 기반으로 동작한다.

- 로깅 · 보안 · 트랜잭션 같은 횡단 관심사를 애스펙트로 분리
- 프록시 기반으로 메서드 경계에서 정책을 일괄 적용하되, 남용 시 흐름 추적이 어려워지므로 범위를 명확히 관리

```java

@Aspect
@Component
class LoggingAspect {

    @Around("execution(* com.example..*Service.*(..))")
    public Object around(org.aspectj.lang.ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        try {
            return pjp.proceed();
        } finally {
            long elapsed = System.nanoTime() - start;
        }
    }
}
```

## PSA(Portable Service Abstraction) - 일관된 서비스 추상화

스프링이 제공하는 일관된 서비스 추상화로, 애플리케이션 코드는 공통 인터페이스(또는 애노테이션)에 의존하고 실제 구현(라이브러리/벤더)은 빈 구성으로 교체할 수 있게 한다.

- 공통 인터페이스/애노테이션에 의존하고 실제 구현은 빈 구성으로 교체
- 캐시 · 트랜잭션·메시징 등 인프라를 환경에 맞게 바꿔도 비즈니스 코드는 그대로 유지됨

```java

@Service
class ProductService {

    @Cacheable(cacheNames = "productById", key = "#productId")
    public Product getProduct(long productId) {
        // DB 조회 등 비용 큰 연산
        return findFromDb(productId);
    }
}
```

```java
// 개발 환경 - Caffeine
@Configuration
@EnableCaching
class CacheConfigDev {

    @Bean
    CacheManager cacheManager() {
        return new org.springframework.cache.caffeine.CaffeineCacheManager("productById");
    }
}

// 운영 환경 - Redis

@Configuration
@EnableCaching
class CacheConfigProd {

    @Bean
    CacheManager cacheManager(RedisConnectionFactory cf) {
        return RedisCacheManager.builder(cf).build();
    }
}
```

## 이벤트 - 모듈 간 결합도 감소

이벤트는 한 모듈의 메시지를 발행하고, 다른 모듈이 후처리를 구독하게 해 관심사를 분리하고 결합도를 낮출 수 있다.

- 이벤트 발행하고 관심 모듈이 구독하도록 설계해 런타임 결합도를 낮춤
- `AFTER_COMMIT`과 비동기 리스너로 후처리를 격리하고, Outbox · 멱등 처리로 유실과 중복을 방지 가능

```java
public record OrderPlaced(String orderId, long amount) {

}

@Service
@RequiredArgsConstructor
class OrderService {

    private final ApplicationEventPublisher events;

    @Transactional
    public void placeOrder(String orderId, long amount) {
        // 주문 저장 등 핵심 로직
        // ...
        // 후처리는 이벤트로 알림
        events.publishEvent(new OrderPlaced(orderId, amount));
    }
}

@Component
class IssueCouponOnOrderPlaced {

    // 커밋 이후 실행: DB 일관성 확보 후 외부 연동/부가작업 수행
    // @Aync 을 붙이면 비동기 실행
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(OrderPlaced event) {
        // 쿠폰 발급, 알림 발송 등
    }
}
```
