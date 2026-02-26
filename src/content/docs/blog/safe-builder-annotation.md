---
title: "@Builder 사용의 여러가지 방법과 안전하게 사용하기"
date: 2023-11-06
lastUpdated: 2024-03-10
tags: [Spring & JPA]
---

> 실행 환경: Java 17, Spring Boot 3.1.4

빌더 패턴을 사용하면 객체를 생성할 때 많은 이점을 얻을 수 있다.
([링크 참조](https://hyoguoo.gitbook.io/docs/java/effective-java/item2))  
하지만 빌더 패턴을 사용하면 많은 코드를 작성해야 하는 단점이 존재하나
[Lombok의 `@Builder` 어노테이션](https://hyoguoo.gitbook.io/docs/java/effective-java/item2#lombok-builder)
을 사용하면 이러한 단점을 보완할 수 있다.(성능 저하라는 단점도 있으나 미미한 편)

## @Builder + @AllArgsConstructor

Builder를 사용하면 모든 필드를 매개변수로 받는 생성자를 필요로 한다.

```
** @Builder 어노테이션 내부 설명
 * If a member is annotated, it must be either a constructor or a method. If a class is annotated,
 * then a package-private constructor is generated with all fields as arguments
 * (as if {@code @AllArgsConstructor(access = AccessLevel.PACKAGE)} is present
 * on the class), and it is as if this constructor has been annotated with {@code @Builder} instead.
 * Note that this constructor is only generated if you haven't written any constructors and also haven't
 * added any explicit {@code @XArgsConstructor} annotations. In those cases, lombok will assume an all-args
 * constructor is present and generate code that uses it; this means you'd get a compiler error if this
 * constructor is not present.
```

생성자가 없는 경우엔 `@Builder` 어노테이션에서 자동 생성해주지만, 다른 생성자가 있는 경우엔 `@AllArgsConstructor`로 생성자를 추가하여 사용할 수 있다.

```java

@Getter
@Entity
@Builder
@Table(name = "order_info")
@NoArgsConstructor // @Entity는 빈 생성자(기본 생성자)가 필요
@AllArgsConstructor // @NoArgsConstructor가 있기 때문에 명시적으로 @AllArgsConstructor를 추가
public class OrderInfo extends BaseTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Builder.Default
    @Column(name = "status", nullable = false)
    private String status = ORDER_CREATE_STATUS;

    // ...필드 및 메서드 생략

    // 주문 정보 검증
    public void validateProductInfo(BigDecimal totalAmount, Integer quantity) {
        // 검증 로직
    }
}
```

이 Entity 클래스를 생성하고 데이터베이스에 저장하기 위해 다음과 같이 사용할 수 있다.  
주문 정보를 생성하고 검증 후 저장하는 간단한 서비스 코드이다.

```java
// dto.java
@Getter
@RequiredArgsConstructor
public class OrderCreateRequest {

    private final Long userId;
    private final BigDecimal amount;
    private final OrderProduct orderProduct;

    public OrderInfo toEntity(User user, Product product) {
        return OrderInfo.builder()
                .user(user)
                .product(product)
                .quantity(this.orderProduct.getQuantity())
                .totalAmount(this.amount)
                .build();
    }
}

// service.java
public class OrderService {

    // ...

    public OrderCreateResponse createOrder(OrderCreateRequest orderCreateRequest) {
        // 1. 주문 생성
        OrderInfo createdOrderInfo = orderCreateRequest.toEntity(
                userService.getById(orderCreateRequest.getUserId()),
                productService.getById(orderProduct.getProductId())
        );

        // 2. 주문 상품 정보 검증
        createdOrderInfo.validateProductInfo(
                orderCreateRequest.getAmount(),
                orderProduct.getQuantity()
        );

        // 3. 주문 정보 저장
        OrderInfo createdOrder = orderInfoRepository.save(createdOrderInfo);

        return new OrderCreateResponse(createdOrder);
    }

    // ...
}
```

서비스 로직을 살펴보면 크게 세 가지 단계로 나눌 수 있다.

1. 주문 생성
2. 주문 상품 정보 검증
3. 주문 정보 저장

위 코드에서는 2번 단계를 성실하게 수행하여 결과적으로 데이터베이스에 검증이 완료 된 주문 정보만 저장할 수 있게 되었다.

하지만 2번 단계를 생략하여 저장하게 되면 올바르지 않은 주문 정보가 데이터베이스에 저장될 수 있다.(다른 메서드에서 생성하거나 기존 코드가 수정되는 등)  
때문에 2번 단계를 서비스 코드에서 수행하는 것이 아닌 Entity 클래스에서 생성할 때 검증하는 것이 더 안전하다고 볼 수 있다.

## 생성 시 검증 로직 추가

`@Builder` 어노테이션을 사용하면서 생성 시 검증 로직을 추가하는 방법으로 두 가지를 생각해볼 수 있다.

1. `build()` 메서드를 재작성
2. 생성자에서 검증 로직 수행

### `build()` 메서드 재작성

`@Builder` 어노테이션을 사용하면 `build()` 메서드를 호출하여 인스턴스를 생성하게 되는데, 이 메서드를 재작성할 수 있다.

```java
// entity.java
@Getter
@Entity
@Builder
@Table(name = "order_info")
@NoArgsConstructor
@AllArgsConstructor
public class OrderInfo extends BaseTime {

    // @Builder.Default가 정상적으로 동작하지 않은 것을 제외하고 위의 코드와 동일

    public static class OrderInfoBuilder {

        private void validateProductInfo(BigDecimal totalAmount, Integer quantity) {
            // 검증 로직
        }

        // build() 메서드 재작성
        public OrderInfo build(BigDecimal totalAmount, Integer quantity) {
            this.validateProductInfo(totalAmount, quantity);

            return new OrderInfo(
                    this.id,
                    this.user,
                    this.product,
                    this.orderId,
                    this.paymentKey,
                    this.orderName,
                    this.method,
                    this.quantity,
                    this.totalAmount,
                    this.status,
                    this.requestedAt,
                    this.approvedAt,
                    this.lastTransactionKey
            );
        }
    }
}

// dto.java
@Getter
@RequiredArgsConstructor
public class OrderCreateRequest {

    private static final String ORDER_CREATE_STATUS = "READY";

    private final Long userId;
    private final String orderId;
    private final BigDecimal amount;
    private final OrderProduct orderProduct;

    public OrderInfo toEntity(User user, Product product) {
        return OrderInfo.builder()
                .user(user)
                .product(product)
                .orderId(this.orderId)
                .quantity(this.orderProduct.getQuantity())
                .totalAmount(this.amount)
                .status(ORDER_CREATE_STATUS) // @Build.Default 동작하지 않아 직접 추가
                .build(amount, this.orderProduct.getQuantity()); // build() 호출 시 필요한 매개변수 추가
    }
}
```

`build()` 메서드를 호출 할 때 필요한 매개변수를 추가하여 검증 로직을 수행할 수 있게 되었지만, 많은 단점이 생겼다.

1. `@Builder.Default`가 정상적으로 동작하지 않아 기본 값을 직접 할당해야 함
2. 해당 클래스의 생성자를 직접 호출하는 경우 검증 로직이 수행되지 않음
3. 코드의 양이 많아지고 굉장히 복잡해짐

2번의 문제 같은 경우엔 `@AllArgsConstructor(access = PROTECTED)`를 사용하여 외부에서 생성자를 호출하지 못하도록 제한할 수 있지만,  
1, 3번의 문제는 여전히 존재하고, 2번의 문제도 여전히 내부에서 생성자를 호출하는 경우에는 검증 로직이 수행되지 않는다.

### 생성자 직접 추가

위의 문제를 해결하기 위해 더 간단하고 안전한 방법은 생성자를 직접 추가하는 것이다.

```java
// entity.java
@Getter
@Entity
@Builder
@Table(name = "order_info")
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 외부에서의 생성자 호출 방지
// @AllArgsConstructor 제거
public class OrderInfo extends BaseTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Builder.Default
    @Column(name = "status", nullable = false)
    private String status = ORDER_CREATE_STATUS;

    // ...필드 및 메서드 생략

    @SuppressWarnings("java:S107") // 파라미터 개수 8개 이상 경고 무시
    protected OrderInfo(Long id, User user, Product product, String orderId, String paymentKey,
            String orderName, String method, Integer quantity, BigDecimal totalAmount,
            String status, LocalDateTime requestedAt, LocalDateTime approvedAt,
            String lastTransactionKey) {
        this.id = id;
        this.user = user;
        this.product = product;
        this.orderId = orderId;
        this.paymentKey = paymentKey;
        this.orderName = orderName;
        this.method = method;
        this.quantity = quantity;
        this.totalAmount = totalAmount;
        this.status = status;
        this.requestedAt = requestedAt;
        this.approvedAt = approvedAt;
        this.lastTransactionKey = lastTransactionKey;

        this.validateProductInfo(totalAmount, quantity); // 모든 값이 할당된 후 검증 로직 수행
    }

    public void validateProductInfo(BigDecimal totalAmount, Integer quantity) {
        // 검증 로직
    }
}

// dto.java
@Getter
@RequiredArgsConstructor
public class OrderCreateRequest {

    private final Long userId;
    private final BigDecimal amount;
    private final OrderProduct orderProduct;

    // 간결했던 가장 처음의 코드로 복귀
    public OrderInfo toEntity(User user, Product product) {
        return OrderInfo.builder()
                .user(user)
                .product(product)
                .quantity(this.orderProduct.getQuantity())
                .totalAmount(this.amount)
                .build();
    }
}
```

이 방법을 사용하면 위애서 언급 된 문제를 해결할 수 있다.

1. `@Builder.Default`가 정상적으로 동작
2. 해당 클래스의 생성자를 직접 호출하는 경우에도 검증 로직이 수행
3. 생성자 추가로 코드의 양은 비슷하지만, `build()` 메서드를 재작성하는 것보다는 코드가 간결해짐

이렇게 함으로써 객체가 어느 시점에 생성되든 검증 로직이 수행되도록 할 수 있게 되었다.  
추가적으로 `@NoArgsConstructor(access = AccessLevel.PROTECTED)`를 사용하여 기본 생성자를 외부에서 호출하지 못하도록 제한하였다.

## 생성자에 @Builder 사용

`@Builder` 어노테이션은 생성자에도 사용할 수 있는데, 이 방식을 사용해 꼭 필요한 매개변수만 받을 수 있도록 할 수 있다.

```java

@Getter
@Entity
@Table(name = "order_info")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderInfo extends BaseTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "status", nullable = false)
    private String status;

    // ...필드 및 메서드 생략

    @Builder
    protected OrderInfo(User user, Product product, Integer quantity, BigDecimal totalAmount) {
        this.user = user;
        this.product = product;
        this.quantity = quantity;
        this.totalAmount = totalAmount;

        // Builder.Default 대신 직접 할당
        this.orderId = generateOrderId();
        this.status = OrderStatus.READY.getStatusName();

        this.validateProductInfo(totalAmount, quantity);
    }

    public void validateProductInfo(BigDecimal totalAmount, Integer quantity) {
        // 검증 로직
    }
}
```

이 방식을 사용하면 불필요한 매개변수까지 포함되는 것을 방지하는 것 뿐만 아니라, 어떤 필드가 생성 시 전달 받고 기본 값으로 할당되는지도 명확하게 알 수 있다.

## 결론

`@Builder` 어노테이션을 사용하는 경우 롬복을 사용하고 있기 때문에 무의식적으로 `@AllArgsConstructor`를 사용할 수 있다.  
`@AllArgsConstructor`를 사용하면 모든 필드를 매개변수로 받는 생성자가 생성 될 뿐만 아니라 생성 시 검증 로직을 수행할 수 없게 된다.  
때문에 생성자에 `@Builder` 어노테이션을 사용하여 꼭 필요한 파라미터만 받을 수 있도록 하고, 생성 시 검증 로직을 수행할 수 있도록 하는 것이 좋다.
