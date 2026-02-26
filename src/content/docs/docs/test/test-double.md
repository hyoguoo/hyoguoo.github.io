---
title: "Test Double(테스트 더블)"
date: 2024-08-27
lastUpdated: 2026-01-25
---

테스트 더블은 테스트를 위해 실제 객체를 대체하는 객체를 말한다.

## 목적

- 의존성 격리: 테스트하고자하는 객체를 외부 의존성으로 격리하여, 테스트 대상에만 집중할 수 있도록 함
- 테스트 속도 향상: 외부 시스템과의 통신 혹은 복잡한 로직을 대체하여 테스트 속도를 향상
- 경계 조건 테스트: 정상적인 환경 뿐만 아니라, 예외 상황에 대한 테스트도 가능
- 비용 절감: 비용이 발생하는 외부 서비스나 리소스를 대체하여 테스트 비용을 절감
- 안정적인 테스트 환경 제공: 외부 서비스의 가용성이나 변동에 관계 없이 안정적인 테스트 환경 구축

## 종류

테스트 더블은 다음과 같이 종류가 나뉘며, 용도와 목적에 따라 적절한 테스트 더블을 사용해야 한다.

| Test Double | 설명                                     | 용도                           | 예시                                                  |
|:------------|:---------------------------------------|:-----------------------------|:----------------------------------------------------|
| Dummy       | 아무 동작을 하지 않는 객체                        | 특정 인스턴스를 요구하는 메서드를 호출해야하는 경우 | 로깅이나 메트릭 수집을 위한 객체                                  |
| Fake        | 단순화 된 구현체로 동일한 기능은 수행하나, 프로덕션에선 부족한 객체 | 비슷한 방식으로 동작하는 환경이 필요한 경우     | DB 대신 메모리에 저장하는 객체                                  |
| Stub        | 특정 상황에 대한 미리 정의된 결과를 반환하는 객체           | 항상 같은 결과(=상태)를 반환해야 하는 경우    | 외부 API 호출에서 항상 성공 응답을 반환하는 객체                       |
| Spy         | Stub과 유사하나, 호출된 메서드에 대한 정보를 기록하는 객체    | 호출된 횟수나 인자값을 확인해야 하는 경우      | 이메일 발송 서비스에서 발송 메서드가 호출된 횟수와 실제 발송된 이메일 주소를 확인하는 객체 |
| Mock        | 특정 메서드 호출에 대한 기대를 명세하고, 검증하는 객체        | 특정 인자값이나 횟수(=행동)를 검증해야 하는 경우 | 결제 서비스에서 결제 처리 메서드가 특정 조건에서 호출되었는지 검증하는 객체          |

### 예시 코드

#### Dummy

```java
public class DummyLogger {

    public void log(String message) {
        // 아무 동작도 하지 않음
    }
}

@Test
public void dummyTest() {
    DummyLogger dummyLogger = new DummyLogger();
    MyService service = new MyService(dummyLogger);
    service.performAction(); // DummyLogger를 사용하여 로그 메서드를 호출하지만, 실제로 아무 일도 일어나지 않음
}
```

#### Fake

```java
public class FakeDatabase implements Database {

    private Map<String, String> data = new HashMap<>();

    @Override
    public void save(String key, String value) {
        data.put(key, value);
    }

    @Override
    public String find(String key) {
        return data.get(key);
    }
}

@Test
public void fakeTest() {
    Database fakeDb = new FakeDatabase();
    fakeDb.save("username", "test_user");

    assertEquals("test_user", fakeDb.find("username"));
}
```

#### Stub

```java
public class PaymentGatewayStub extends PaymentGateway {

    @Override
    public PaymentResponse processPayment(double amount) {
        // 항상 성공적인 결제를 반환하는 Stub
        return new PaymentResponse(true, "Payment processed successfully");
    }
}

@Test
public void processOrderWithStub() {
    PaymentGatewayStub paymentGatewayStub = new PaymentGatewayStub();
    OrderService orderService = new OrderService(paymentGatewayStub);

    Order order = new Order(100.00);
    boolean result = orderService.processOrder(order);

    // 상태를 검증: 결제가 성공했는지 확인
    assertTrue(result);
    assertTrue(order.isPaymentSuccessful());
}
```

#### Spy

```java
public class EmailServiceSpy extends EmailService {

    private int sendEmailCallCount = 0;
    private String lastRecipient = null;

    @Override
    public void sendEmail(String recipient, String message) {
        sendEmailCallCount++;
        lastRecipient = recipient;
        super.sendEmail(recipient, message);
    }

    public int getSendEmailCallCount() {
        return sendEmailCallCount;
    }

    public String getLastRecipient() {
        return lastRecipient;
    }
}

@Test
public void spyTest() {
    EmailServiceSpy emailServiceSpy = new EmailServiceSpy();
    MyService service = new MyService(emailServiceSpy);

    service.notifyUser("user@example.com");

    assertEquals(1, emailServiceSpy.getSendEmailCallCount());
    assertEquals("user@example.com", emailServiceSpy.getLastRecipient());
}
```

#### Mock

```java

@Test
public void processOrderWithMock() {
    PaymentGateway mockPaymentGateway = mock(PaymentGateway.class);
    OrderService orderService = new OrderService(mockPaymentGateway);

    Order order = new Order(100.00);

    // Mock 동작 설정: 결제가 성공했다고 가정
    when(mockPaymentGateway.processPayment(order.getAmount()))
            .thenReturn(new PaymentResponse(true, "Payment processed successfully"));

    boolean result = orderService.processOrder(order);

    // 행위를 검증: 결제 메서드가 올바르게 호출되었는지 확인
    verify(mockPaymentGateway).processPayment(order.getAmount());
    assertTrue(result);
    assertTrue(order.isPaymentSuccessful());
}
```
