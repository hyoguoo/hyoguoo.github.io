---
title: "Test Fixture(테스트 픽스처)"
date: 2024-08-27
lastUpdated: 2024-08-27
---

테스트 환경을 위해서 원하는 상태 값으로 고정되어 있는 객체를 말한다. 테스트 환경을 설정하는데 사용되며, 테스트 코드의 가독성과 유지보수성을 높이기 위해 사용된다.

## Setup & Teardown

테스트가 시작되기 전과 완료된 후 테스트 환경을 설정하거나 해제하는 작업을 말하며, 테스트 시작이나 종료 혹은 특정 시점에 설정 작업을 수행할 수 있다.

```java
public class OrderProcessingServiceTest {

    private OrderProcessingService orderProcessingService;
    private InventoryService inventoryService;
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        // 공통적으로 필요한 서비스 초기화
        inventoryService = new InventoryService();
        paymentService = new PaymentService();

        // OrderProcessingService 초기화
        orderProcessingService = new OrderProcessingService(inventoryService, paymentService);
    }

    @AfterEach
    void tearDown() {
        // 테스트 종료 후 리소스 해제
        inventoryService.clear();
    }

    @Test
    @DisplayName("재고가 충분하고 결제가 성공하면 주문이 성공한다.")
    void testOrderSuccess() {
        // Given: 필요한 아이템을 재고에 추가
        Item item1 = new Item("item1", 100.0);
        inventoryService.addItem(item1, 10);

        // When: 아이템을 주문할 때
        Order order = new Order(item1, 2);
        boolean result = orderProcessingService.processOrder(order);

        // Then: 주문이 성공해야 한다
        assertTrue(result);
        assertEquals(8, inventoryService.getStock(item1));
    }

    @Test
    @DisplayName("재고가 부족한 경우 주문이 실패해야 한다.")
    void testOrderFailureDueToInsufficientStock() {
        // Given: 재고를 낮게 설정
        Item item2 = new Item("item2", 50.0);
        inventoryService.addItem(item2, 1);

        // When: 재고보다 많은 수량을 주문할 때
        Order order = new Order(item2, 2);
        boolean result = orderProcessingService.processOrder(order);

        // Then: 주문이 실패해야 한다
        assertFalse(result);
        assertEquals(1, inventoryService.getStock(item2));  // 재고는 그대로 남아야 한다
    }
}
```

특정 객체를 공유하거나 반복해서 객체를 생성하는 코드가 반복되는 경우 사용할 수 있는데, 이를 통해 테스트 코드의 중복을 줄이고 가독성을 높일 수 있다.

### 테스트 독립성

설정하는 순간 모든 테스트에 공통으로 영향을 줄 수 있으므로, 아래의 조건을 만족하는 경우에만 추가하는 것을 고려하는 것이 좋다.

- 각 테스트 입장에서 봤을 때 테스트 내용을 이해하는데 문제가 없음
- 수정해도 모든 테스트에 영향을 주지 않음

만약 위 코드의 `@BeforeEach`에서 기본 아이템을 추가하는 로직을 넣었다면, 주문 실패 로직에 영향을 끼쳐 테스트가 실패할 수 있다.

```java

@BeforeEach
void setUp() {
    // 공통적으로 필요한 서비스 초기화
    inventoryService = new InventoryService();
    paymentService = new PaymentService();

    // !!모든 테스트에 영향을 주는 로직
    inventoryService.addItem(new Item("item1", 100.0), 10);
    inventoryService.addItem(new Item("item2", 50.0), 1);

    // OrderProcessingService 초기화
    orderProcessingService = new OrderProcessingService(inventoryService, paymentService);
}
```

## Test Data 생성 로직 분리

테스트 코드에서 사용하는 데이터를 생성하는데 사용되며, 하나의 도메인 인스턴스가 여러 테스트에서 사용되는 경우 테스트 코드의 중복을 줄이고 가독성을 높이기 위해 사용된다.

```java
public class OrderProcessingServiceTest {

    // ...

    // Item 객체를 생성하는 메서드
    private Item createDefaultItem(String name, double price) {
        return Item.builder()
                .name(name)
                .price(price)
                .build();
    }

    @Test
    @DisplayName("재고가 충분하고 결제가 성공하면 주문이 성공한다.")
    void testOrderSuccess() {
        // Given: 필요한 아이템을 재고에 추가
        Item item1 = createDefaultItem("item1", 100.0);
        inventoryService.addItem(item1, 10);

        // When: 아이템을 주문할 때
        Order order = new Order(item1, 2);
        boolean result = orderProcessingService.processOrder(order);

        // Then: 주문이 성공해야 한다
        assertTrue(result);
        assertEquals(8, inventoryService.getStock(item1));
    }

    // ...
}
```

### Test Data Factory

테스트 데이터를 생성하는 클래스를 따로 만들어서 사용할 수 있는데, 그에 대한 장단점은 다음과 같다.

- 장점
    - 테스트 데이터 생성 로직을 중복해서 작성하지 않아도 됨
    - 테스트 데이터 생성 로직을 한 곳에서 관리 가능
- 단점
    - 필요한 인자 갯수가 많고 한 클래스에서 다양한 종류의 데이터를 생성하는 경우 복잡해질 수 있음

```java
public class TestDataFactory {

    public static Item createDefaultItem(String name, double price) {
        return Item.builder()
                .name(name)
                .price(price)
                .build();
    }

    // 유사한 메서드가 늘어나면 관리가 어려워질 수 있음
    public static Item createItemWithQuantity(String name, double price, int quantity) {
        return Item.builder()
                .name(name)
                .price(price)
                .quantity(quantity)
                .build();
    }
}
```

## Parameterized Test

하나의 입력 값만으론 충분한 테스트가 불충분하다고 판단되는 경우, 여러 입력 값에 대해 반복적으로 테스트를 수행하는 방법이다.

```java
import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

public class OrderServiceTest {

    // ...

    // 1. CsvSource를 사용한 Parameterized Test

    @ParameterizedTest(name = "{index} => 상품: {0}, 가격: {1}, 수량: {2} => 총 가격: {3}")
    @CsvSource({
            "item1, 100.0, 2, 200.0",
            "item2, 50.0, 3, 150.0",
            "item3, 200.0, 1, 200.0"
    })
    @DisplayName("각 상품의 총 가격이 올바르게 계산된다.")
    void testCalculateTotalPrice(
            String itemName,
            double price,
            int quantity,
            double expectedTotal
    ) {
        // Given: 아이템 생성
        Item item = new Item(itemName, price);
        Order order = new Order(item, quantity);

        // When: 주문을 처리하고 총 가격을 계산
        double totalPrice = orderService.calculateTotalPrice(order);

        // Then: 총 가격이 예상과 일치해야 한다
        assertEquals(expectedTotal, totalPrice);
    }

    // ========================================================================

    // 2. MethodSource를 사용한 Parameterized Test

    // 테스트 데이터를 제공하는 메서드
    static Stream<Arguments> provideOrders() {
        return Stream.of(
                Arguments.of(new Item("item1", 100.0), 2, 200.0),
                Arguments.of(new Item("item2", 50.0), 3, 150.0),
                Arguments.of(new Item("item3", 200.0), 1, 200.0)
        );
    }

    @ParameterizedTest(name = "{index} => 상품: {0}, 수량: {1} => 총 가격: {2}")
    @MethodSource("provideOrders")
    @DisplayName("각 상품의 총 가격이 올바르게 계산된다.")
    void testCalculateTotalPrice(Item item, int quantity, double expectedTotal) {
        // Given: Order 생성
        Order order = new Order(item, quantity);

        // When: 주문을 처리하고 총 가격을 계산
        double totalPrice = orderService.calculateTotalPrice(order);

        // Then: 총 가격이 예상과 일치해야 한다
        assertEquals(expectedTotal, totalPrice);
    }
}
```

대표적으로 `@CsvSource`와 `@MethodSource`를 사용하는 두 가지 방식이 있으며, 장단점과 적합한 상황에 따라 선택하여 사용하면 된다.

| 항목    | `@CsvSource`                          | `@MethodSource`                                       |
|-------|---------------------------------------|-------------------------------------------------------|
| 장점    | - 간단하고 직관적 <br/> - 빠른 설정 가능           | - 복잡한 데이터 처리 가능 <br/> - 재사용성 높음 <br/> - 유연한 데이터 생성 가능 |
| 단점    | - 복잡한 데이터 처리 어려움 <br/> - 가독성 저하 가능    | - 추가 코드 작성 필요 <br/> - 가시성 저하 가능                       |
| 적용 대상 | - 단순한 데이터 셋 <br/> - 기본 타입 (문자열, 숫자 등) | - 복잡한 객체나 데이터 구조 <br/> - 객체, 컬렉션, 외부 데이터 등            |
