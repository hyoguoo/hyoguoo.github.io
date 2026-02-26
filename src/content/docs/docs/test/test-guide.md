---
title: "Test Guide"
date: 2024-08-27
lastUpdated: 2024-10-02
tags: [Test]
description: ""
---

테스트를 작성하는 정해진 규칙은 없으나, 테스트 코드의 품질과 가독성 및 생산성을 높이기 위해 몇 가지 규칙을 지키는 것이 좋다.

## 테스트 명세

테스트 코드가 검증하는 내용을 명확하게 전달하여, 다른 개발자가 테스트 코드를 읽었을 때 테스트 대상이 무엇인지 쉽게 이해할 수 있도록 작성해야 한다.

### DisplayName

`@DisplayName`을 사용하여 해당 테스트의 이름을 지정할 수 있는데, 이름은 최대한 상세하게 작성하여 테스트의 명세를 잘 전달할 수 있도록 해야 한다.

- 테스트 행위에 대한 결과까지 작성: 테스트의 목적을 분명하게 전달
    - before: 상품을 추가한다.
    - after: 상품을 추가하면 장바구니에 상품이 추가된다.
- 도메인 용어를 사용하여 도메인 정책 관점으로 작성: 테스트가 실제 비즈니스의 어떤 요구사항을 검증하는지 명확하게 전달
    - before: 특정 시간에 상품을 주문하면 할인이 적용된다.
    - after: 할인 기간에 상품을 주문하면 할인이 적용된다.

## 테스트 구조와 일관성

테스트 코드는 항상 일정한 구조를 따르도록 설정하여, 다른 개발자가 쉽게 이해할 수 있도록 해야한다.

1. 설정: 테스트 실행에 필요한 초기 설정
2. 행위: 테스트 대상을 실행
3. 검증: 행위를 통해 예상한 결과가 나왔는지 검증

### BDD(Behavior-Driven Development)

BDD는 TDD에서 파생된 개발 방법으로, 함수 단위의 테스트보다는 시나리오에 기반한 테스트케이스 자체에 집중하는 방법이다.  
크게 세 가지 구성요소로 나뉘는데, 이 패턴은 테스트 일관성을 유지하는 데 큰 도움을 준다.

- Given: 시나리오 진행에 필요한 초기 상태를 설정(= 어떤 환경에서)
- When: 시나리오 진행에 필요한 행위를 수행(= 어떤행동을 진행했을 때)
- Then: 시나리오 진행 후 예상되는 결과를 검증(= 어떤 결과가 나온다)

GWT 패턴에서 나온 명세는 그대로 `DisplayName`에 작성하면 적절한 테스트 이름이 된다.

```java

@Test
@DisplayName("상품을 추가하면 장바구니에 상품이 추가된다.")
void addProductToCart() {
    // Given
    Product product = new Product("상품", 1000);
    Cart cart = new Cart();

    // When
    cart.addProduct(product);

    // Then
    assertThat(cart.getProducts()).contains(product);
}
```

### 명확한 검증

가능한 한 명확하고 구체적인 단언문을 사용하여, 테스트 실패 시 그 원인을 쉽게 파악할 수 있어야 한다.

- 단일 단언 원칙: 하나의 테스트는 가능한 한 하나의 단언문만 포함하여. 이는 테스트의 목적을 더 명확하게 하고 어떤 조건이 실패했는지 쉽게 파악할 수 있도록 함
- 메시지: 단언문에 실패 메시지를 추가하여, 테스트 실패 이유를 명확하게 전달

## 테스트 커버리지와 테스트 품질

테스트 커버리지는 코드의 품질을 보장하지 않으므로, 커버리지를 지나치게 집착하기보다는 의미 있는 테스트를 작성하는 데 집중해야 한다.

- 핵심 비즈니스 로직 우선 테스트: 가장 중요한 비즈니스 로직을 우선적으로 테스트
- 예외 처리 로직 테스트: 예외 상황을 처리하는 로직도 충분히 테스트하고, 예상치 못한 상황에서의 코드 동작 검증
- 검증된 프레임워크의 영역: 프레젠테이션 계층이나 인프라스트럭처 계층의 리포지토리와 같이 이미 검증된 프레임워크나 라이브러리에서 제공하는 기능에 대한 테스트는 불필요할 수 있음
- 커버리지: 커버리지를 높이기 위해 무의미한 테스트를 작성하는 것은 오히려 테스트 코드의 유지보수성과 생산성을 떨어뜨릴 수 있음

테스트를 작성하는 것은 코드의 품질을 높이고 생산성을 높이는 것이 목적이므로, 그 목적에 맞게 테스트를 작성하는 것이 중요하다.

## 테스트 독립성 유지

테스트는 다른 테스트와 독립적으로 실행될 수 있어야 하며, 어떤 테스트가 실패 및 성공하더라도 서로 영향을 주지 않도록 테스트 간의 의존성을 최소화해야 한다.

- 상태 공유 방지: 테스트 간에 공유된 상태(static 변수, 공유 인스턴스 등)를 피하고, 각 테스트는 필요한 상태를 독립적으로 설정하고 테스트 후 상태 정리 필요
- 테스트 순서 의존성 제거: 테스트가 특정 순서로 실행되는 것을 피하고, 어느 순서로 실행되더라도 동일한 결과를 보장할 수 있도록 테스트 코드 작성

#### Bad Practice: 테스트 간에 상태를 공유하고 있어 테스트 간의 의존성이 존재

```java
public class CartTest {

    private static Cart cart = new Cart();
    private static Product product = new Product("상품1", 1000);

    @Test
    @Order(1)
    void addItemToCart() {
        cart.addProduct(product);

        // 제품이 카트에 제대로 추가되었는지 확인
        assertEquals(1, cart.getProductCount());
        assertTrue(cart.getProducts().contains(product));
    }

    @Test
    @Order(2)
    void changeProductNameInCart() {
        // 카트에서 제품을 꺼낸 후 이름을 변경
        Product productInCart = cart.getProducts().stream()
                .filter(p -> p.equals(product))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Product not found in cart"));

        productInCart.setName("변경된 상품1");

        // 제품 이름이 변경되었는지 확인
        assertEquals("변경된 상품1", productInCart.getName());
    }

    @Test
    @Order(3)
    void removeItemFromCart() {
        // 이름이 변경된 상태에서 제품을 삭제하려고 시도
        cart.removeProduct(product);

        // 제품이 카트에서 제대로 삭제되었는지 확인
        assertEquals(0, cart.getProductCount());
        assertFalse(cart.getProducts().contains(product));
    }
}
```

#### Good Practice: 테스트 간에 상태를 공유하지 않고, 각 테스트는 독립적으로 실행되도록 작성

```java
public class CartTest {

    private Cart cart;
    private Product product;

    @BeforeEach
    void setUp() {
        // Given: 카트와 제품이 준비됨
        cart = new Cart();
        product = new Product("상품1", 1000);
    }

    @Test
    void addItemToCart() {
        // When: 카트에 제품을 추가
        cart.addProduct(product);

        // Then: 카트에 제품이 잘 추가되었는지 확인
        assertEquals(1, cart.getProductCount());
        assertTrue(cart.getProducts().contains(product));
    }

    @Test
    void removeItemFromCart() {
        // Given: 카트에 제품이 추가된 상태
        cart.addProduct(product);

        // When: 카트에서 제품을 제거
        cart.removeProduct(product);

        // Then: 카트에서 제품이 잘 제거되었는지 확인
        assertEquals(0, cart.getProductCount());
        assertFalse(cart.getProducts().contains(product));
    }

    @Test
    void changeProductNameAfterAddToCart() {
        // Given: 카트에 제품이 추가된 상태
        cart.addProduct(product);

        // When: 카트에 있는 제품의 이름을 변경
        Product productInCart = cart.getProducts().get(0);
        productInCart.setName("변경된 상품1");

        // Then: 제품 이름이 변경되었는지 확인
        assertEquals("변경된 상품1", productInCart.getName());
        assertTrue(cart.getProducts().contains(productInCart));
    }
}
```

## 테스트의 실행 속도 최적화

테스트는 가능한 빠르게 실행되도록 최적화해야하며, 느린 테스트는 개발 과정에서 방해 요소가 될 수 있으며, 전체적인 개발 속도를 저하시킬 수 있다.

- 단위 테스트 우선: 단위 테스트 위주로 테스트를 작성하고, 불필요한 외부 시스템과의 연동이나 복잡한 설정은 피하도록 함(통합 테스트에서 수행)
- 불필요한 I/O 작업 피하기: 테스트에서 파일 시스템, 데이터베이스, 네트워크 등 I/O 작업은 피하거나 최소화함

#### Bad Practice: 테스트 실행 시간이 오래 걸리는 I/O 작업을 수행

```java

@SpringBootTest
public class WeatherServiceIntegrationTest {

    @Autowired
    private WeatherService weatherService;

    @Autowired
    private UserRepository userRepository;

    @Test
    void fetchAndSaveWeatherData() {
        // 실제 데이터베이스에 사용자 저장
        User user = new User("John", "Doe");
        userRepository.save(user);

        // 실제 외부 API 호출
        WeatherData weatherData = weatherService.fetchWeather("Seoul");

        // 데이터베이스에 날씨 데이터 저장
        user.setWeatherData(weatherData);
        userRepository.save(user);

        // 검증
        User retrievedUser = userRepository.findById(user.getId()).orElseThrow();
        assertEquals("Seoul", retrievedUser.getWeatherData().getLocation());
    }
}
```

#### Good Practice: 테스트 더블을 사용하여 단위 테스트 수행

```java
public class WeatherServiceTest {

    private WeatherService weatherService;
    private FakeUserRepository fakeUserRepository;  // Fake 객체로 교체
    private WeatherApiClient mockWeatherApiClient;

    @BeforeEach
    void setUp() {
        // Fake 객체 생성
        fakeUserRepository = new FakeUserRepository();
        // Mock 객체 생성
        mockWeatherApiClient = mock(WeatherApiClient.class);

        // WeatherService에 Fake와 Mock 객체 주입
        weatherService = new WeatherService(fakeUserRepository, mockWeatherApiClient);
    }

    @Test
    void fetchAndSaveWeatherData() {
        // 테스트 데이터 설정
        User user = new User("John", "Doe");
        WeatherData mockWeatherData = new WeatherData("Seoul", 25);

        // Mock 객체의 동작 정의
        when(mockWeatherApiClient.getWeather("Seoul")).thenReturn(mockWeatherData);

        // WeatherService 메서드 호출
        weatherService.fetchAndSaveWeatherData(user, "Seoul");

        // 결과 검증
        verify(mockWeatherApiClient).getWeather("Seoul"); // .getWeather 메서드가 호출되었는지 확인
        User savedUser = fakeUserRepository.findById(user.getId());

        assertNotNull(savedUser);
        assertEquals("Seoul", savedUser.getWeatherData().getLocation());
        assertEquals(25, savedUser.getWeatherData().getTemperature());
    }

    // Fake UserRepository 클래스
    private static class FakeUserRepository implements UserRepository {

        private Map<Long, User> database = new HashMap<>();
        private long idSequence = 0L;

        @Override
        public User save(User user) {
            if (user.getId() == null) {
                user.setId(++idSequence);
            }
            database.put(user.getId(), user);
            return user;
        }

        @Override
        public User findById(Long id) {
            return database.get(id);
        }

        @Override
        public List<User> findAll() {
            return new ArrayList<>(database.values());
        }
    }
}
```
