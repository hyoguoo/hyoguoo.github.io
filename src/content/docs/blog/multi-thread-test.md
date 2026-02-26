---
title: "멀티 스레드 테스트에서 발생하는 @Transactional가 주는 문제"
date: 2024-01-07
lastUpdated: 2024-10-14
tags: [Spring & JPA]
---

> 실행 환경: Java 17, Spring Boot 3.1.5, JUnit 5.9.3

상품 재고 기능 개발 중, 동시성 테스트를 하기 위해 멀티 스레드를 이용하여 테스트를 진행했다.  
테스트를 수행하기 전에 저장 될 데이터를 미리 저장해두고, 당시 평소와 같이 테스트 수행 후 롤백되도록 `@Transactional`을 추가하는 방식으로 테스트를 진행했다.

```java

@SpringBootTest
class OrderConcurrentTest {

    // 의존성 주입 ...

    private User user;
    private Product product;
    private List<OrderInfo> savedOrderList;

    @Transactional // 독립적인 테스트를 위해 테스트 메서드 실행 후 롤백되도록 @Transactional 어노테이션 추가
    @CsvSource({
            "300, 300, 300, 0, 0",
            "300, 299, 299, 0, 1",
            "300, 301, 300, 1, 0",
            "300, 350, 300, 50, 0",
    })
    @ParameterizedTest
    @DisplayName("동시에 승인 요청을 보내면 재고만큼 승인되고 나머지는 실패한다.")
    void approveOrderWithMultipleRequests(
            int stock,
            int orderCount,
            int expectedSuccess,
            int expectedFail,
            int expectedStock
    ) {
        // 테스트 수행 전 데이터 저장
        product = productRepository.save(
                generateProductWithPriceAndStock(BigDecimal.valueOf(1000), stock)
        );
        user = userRepository.save(generateUser());
        savedOrderList = getSavedOrderList(orderCount); // orderCount만큼 주문 데이터 저장 및 리스트에 저장

        AtomicInteger successCount = new AtomicInteger();
        AtomicInteger failCount = new AtomicInteger();

        // 테스트 수행
        executeConcurrentActions(orderIndex -> {
            try {
                // ...
                // 리스트에 저장된 orderIndex번째 주문 승인 요청
                OrderConfirmRequest orderConfirmRequest = generateOrderConfirmRequest(
                        savedOrderList.get(orderIndex)
                );
                orderController.confirmOrder(orderConfirmRequest); // 실제 테스트 대상 메서드
                successCount.incrementAndGet();
            } catch (Exception e) {
                failCount.incrementAndGet();
            }
        }, orderCount, 32);

        // 테스트 결과 검증
        Product updatedProduct = productRepository.findById(product.getId()).orElseThrow();

        assertThat(updatedProduct.getStock()).isEqualTo(expectedStock);
        assertThat(successCount.get()).isEqualTo(expectedSuccess);
        assertThat(failCount.get()).isEqualTo(expectedFail);
    }

    // ...

    private void executeConcurrentActions(
            Consumer<Integer> action,
            int repeatCount,
            int threadSize
    ) {
        AtomicInteger atomicInteger = new AtomicInteger();
        CountDownLatch countDownLatch = new CountDownLatch(repeatCount);
        ExecutorService executorService = Executors.newFixedThreadPool(threadSize);

        for (int i = 1; i <= repeatCount; i++) {
            executorService.execute(() -> {
                int index = atomicInteger.incrementAndGet() - 1;
                action.accept(index);
                countDownLatch.countDown();
            });
        }

        try {
            countDownLatch.await();
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}
```

코드는 위와 같으며, 불필요한 부분은 최대한 생략했으나 간략하게 정리하면 다음과 같다.

1. 테스트 수행 전 데이터 저장
    - 주문할 상품 / 주문자 데이터 저장
    - savedOrderList에 저장된 주문 수만큼 주문 데이터 저장
2. 멀티스레드 테스트 수행
    - savedOrderList에 저장된 order에 대해 승인 요청을 보냄
    - 메서드 내부에 수행 전 저장 한 데이터를 조회하는 로직이 존재(비관적 락을 통해 조회)
    - 승인 요청 결과에 따라 성공 / 실패 카운트 증가
3. 테스트 결과 검증

기존 멀티 스레드를 적용하기 전의 테스트 코드는 정상적으로 수행되었으나, 멀티 스레드를 적용하면서 테스트가 실패하였다.  
테스트 수행 중 저장된 데이터를 조회하는 로직이 존재하는데, 저장된 데이터를 조회하는 시점에 데이터가 존재하지 않아 수행 중인 테스트가 실패한 것이다.

## 발생 원인

테스트 수행 중 저장된 데이터를 조회하는 시점에 데이터가 존재하지 않아 테스트가 실패한 것인데, `@Transactional` 어노테이션에 원인이 있다.  
알다시피 `@Transactional` 어노테이션을 적용하면 메서드에 하나의 트랜잭션에 묶이게 되는데, 결국 메서드가 끝나기 전까지는 트랜잭션이 커밋되지 않는 말과 같다.  
결과적으로 `@Transactional` 어노테이션을 적용한 위의 테스트는 아래와 같이 수행된다.

1. 트랜잭션 시작(트랜잭션 A)
2. 테스트 수행 전 데이터 저장(트랜잭션 A)
    - 커밋은 되지 않은 상태로, 트랜잭션 A에서만 조회 가능한 상태
    - 실제 데이터베이스에는 저장되지 않은 상태
3. 멀티 스레드 테스트 수행
    - 새로운 스레드를 생성하면서 실행하기 때문에 별도의 트랜잭션에서 수행 됨(트랜잭션 B, C, ...)
    - 트랜잭션 A가 아닌 다른 트랜잭션에서는 2번에서 저장한 데이터를 조회할 수 없음
    - 데이터 조회 에러 발생
    - 그 이후 로직이 수행되지 않고 메서드 종료
4. 테스트 실패
5. 트랜잭션 종료(트랜잭션 A)

```java

@SpringBootTest
class OrderConcurrentTest {

    // ...

    @Transactional
    void approveOrderWithMultipleRequests(
            // ...
    ) {

        // ...

        System.out.println(entityManager.getDelegate()); // 테스트 수행 전 데이터 저장 시점의 트랜젝션

        // ...

        // 테스트 수행
        executeConcurrentActions(orderIndex -> {
            try {
                // ...

                System.out.println(entityManager.getDelegate()); // 테스트 수행 중 데이터 조회 시점의 트랜젝션

                // ...  
            } catch (Exception e) {
                // ...
            }
        }, orderCount, 32);

        // ...
    }

    // ...
}
```

`System.out.println(entityManager.getDelegate());`를 통해 세션 정보와 트랜잭션 정보를 출력해보면,  
테스트 수행 전 데이터 저장 시점의 트랜젝션은 커밋 되지 않은 `open` 상태이고, 테스트 수행 중 데이터 조회 시점엔 모두 다른 트랜잭션에서 수행됐음을 알 수 있다.

```
SessionImpl(161593456<open>) # 테스트 수행 전 데이터 저장 시점의 트랜젝션 -> open 상태
SessionImpl(734517556<closed>)
SessionImpl(1193267507<closed>)
SessionImpl(600492612<closed>)
SessionImpl(916520713<closed>)
SessionImpl(508597066<closed>)
SessionImpl(195662923<closed>)
SessionImpl(48837314<closed>)
SessionImpl(776960045<closed>)
SessionImpl(924763232<closed>)
SessionImpl(1204832111<closed>)
SessionImpl(399468152<closed>)
SessionImpl(1035630793<closed>)
SessionImpl(1949013162<closed>)
SessionImpl(175375417<closed>)
SessionImpl(258355164<closed>)
SessionImpl(1957971112<closed>)
SessionImpl(380388185<closed>)
...
```

## 해결 방법

우선 고려해볼 수 있지만 실제로 사용할 수 없거나 적합하지 않은 방법들은 다음과 같다.

- `Propagation.MANDATORY` 사용
    - `Propagation.MANDATORY`: 이미 존재하는 부모 트랜잭션이 있으면 부모 트랜잭션을 합류시키고, 존재하지 않으면 예외를 발생시키는 전파 방식
    - 멀티 스레드 방식인 새로운 스레드를 생성하면서 테스트를 수행하고 있기 때문에 해당 스레드엔 부모 트랜잭션이 존재하지 않기 때문에 예외 발생

- `Isolation.READ_UNCOMMITTED` 사용
    - `Isolation.READ_UNCOMMITTED`: 트랜잭션에 처리 중인 혹은 아직 커밋되지 않은 데이터를 다른 트랜잭션이 읽는 것을 허용하는 격리 수준
    - 테스트를 수행하는 스레드가 데이터 저장 시점의 트랜잭션을 읽을 수 있도록 하면 데이터 조회 에러는 해결할 수는 있지만, 실제로 사용하기에 적합하지 않다.

실제로 해결할 수 있는 방법으론 아래 두 가지 방법을 생각해 보았다.

- `sql.init.mode` 옵션을 사용하여 테스트 수행 전 데이터베이스에 직접 저장
- `@Transactional` 어노테이션을 제거하여 테스트 수행 전 저장된 데이터를 커밋하여 데이터베이스에 반영

이번 포스팅에서는 `@Transactional` 어노테이션 제거 방법을 사용했으며, `@BeforeEach`, `@AfterEach`을 통해 테스트 독립성을 확보했다.

```java

@SpringBootTest
class OrderConcurrentTest {

    // ...

    @BeforeEach
    void setUp() {
        orderRepository.deleteAll();
        productRepository.deleteAll();
        userRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        orderRepository.deleteAll();
        productRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ...

}
```

## 결론

`@Transactional` 어노테이션은 하나의 트랜잭션으로 묶어주어 편리하게 사용할 수 있게 도와주지만 멀티 스레드 환경에서는 예기치 못한 문제가 발생할 수 있다.  
스프링 프레임 워크에서는 많은 편리한 기능을 제공하지만 그만큼 내부 동작 방식을 잘 알고 사용해야 한다는 것을 다시 한 번 느낄 수 있었다.  
현재까지는 `@Transactional`을 제거하여 테스트 전/후 데이터를 컨트롤하는 방법이 적합하다고 생각하지만, 더 나은 해결책에 대한 고민이 필요한 것 같다.

###### 참고

- [스프링 @Transactional](https://hyoguoo.gitbook.io/docs/spring/transactional)