---
title: "Mocking Framework - Mockito"
date: 2025-10-23
lastUpdated: 2025-10-23
tags: [Spring]
description: "Mockito의 Mock·Spy·MockBean 차이와 when/given 스터빙 방법, verify 검증 및 ArgumentCaptor를 활용한 단위 테스트 전략을 정리한다."
---

Mockito는 Java 단위 테스트(Unit Test) 작성을 돕는 모킹(Mocking) 프레임워크로, 실제 의존 객체 대신 가짜 객체(Mock Object)를 생성하고 제어하는 기능을 제공한다.

- 테스트 환경 격리: 외부 요인(DB, 네트워크, 다른 클래스의 내부 로직 등)에 영향을 받지 않고 테스트 대상의 로직에만 집중할 수 있도록 지원
- 행동 제어 및 검증: 원하는 모든 상황을 시뮬레이션(Stubbing)하고, 메서드가 예상대로 호출되었는지(Verification) 검증하는 강력한 기능을 제공
- 가독성 높은 테스트: BDD(Behavior-Driven Development) 스타일을 지원하는 등, 테스트 코드의 의도를 명확하게 표현할 수 있도록 지원

## 1. Mock 객체 생성

의존성을 대체할 가짜 객체를 만드는 방법은 크게 두 가지다.

### `Mockito.mock()` 메서드 사용

가장 기본적인 방법으로, `mock()` 정적 메서드를 사용해 Mock 객체를 직접 생성한다.

```java
import static org.mockito.Mockito.mock;

class MemberServiceTest {

    MemberRepository mockMemberRepository = mock(MemberRepository.class);
}
```

### `@Mock` 어노테이션 사용

JUnit 5 확장 기능을 사용하여 애노테이션 기반으로 Mock 객체를 생성하고 주입한다.

- `@ExtendWith(MockitoExtension.class)`: 테스트 클래스에 Mockito 확장 기능 활성화
- `@Mock`: 해당 필드를 Mock 객체로 초기화
- `@InjectMocks`: 테스트 대상 객체를 생성하고, `@Mock` 또는 `@Spy`로 생성된 의존 객체를 자동으로 주입

```java

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    @Mock
    private MemberRepository memberRepository; // MemberRepository의 Mock 객체가 주입

    @InjectMocks
    private MemberService memberService; // 테스트 대상 객체, @Mock 객체인 memberRepository가 주입

}
```

### `@Spy` - 실제 객체 일부 Mocking

실제 객체를 사용하면서 특정 메서드의 행동만 변경하고 싶을 때 사용한다.

```java

@Spy
private List<String> spiedList = new ArrayList<>();

@Test
void spyTest() {
    // 실제 add 메서드가 호출됨
    spiedList.add("one");

    // size() 메서드만 Stubbing
    doReturn(100).when(spiedList).size();

    assertEquals(100, spiedList.size()); // Stubbing된 값 반환
    assertEquals("one", spiedList.get(0)); // 실제 get 메서드 동작
}
```

### `@MockBean` - 스프링 컨텍스트 통합 테스트용

`@Mock`이 순수 단위 테스트용이라면, `@MockBean`은 스프링 컨텍스트와 통합된 테스트에서 사용된다.

- 동작 방식: 스프링의 `ApplicationContext`에 등록된 실제 빈(Bean)을 Mockito Mock 객체로 교체
- 주요 사용처
    - `@WebMvcTest`: 컨트롤러 테스트 시, 하위 계층인 `Service`를 Mock 객체로 대체할 때 사용
    - `@SpringBootTest`: 통합 테스트 중, 외부 API 호출 (`ApiClient`) 등 특정 빈만 가짜로 대체할 때 사용

`@MockBean`이나 `@SpyBean`을 사용하면, 기존과 다른 설정의 컨텍스트가 필요하다고 간주되어 컨텍스트 캐시가 재사용되지 않는다.

```java

@WebMvcTest(MemberController.class)
class MemberControllerTest {

    @Autowired
    private MockMvc mockMvc; // 컨트롤러 테스트용 MockMvc

    @MockBean // Context에 등록된 MemberService 빈을 Mock 객체로 대체
    private MemberService memberService;

    // ...
}
```

## 2. Stubbing - 행동 정의

Mock 객체가 특정 메서드 호출에 어떻게 응답할지 미리 정의하는 과정이다.

### `when()` 계열

반환값이 있는 메서드의 행동을 정의할 때 사용한다.

- `thenReturn(value)`: 고정된 값을 반환
- `thenThrow(exception)`: 예외 발생
- `thenAnswer(answer)`: 동적인 로직을 통해 계산된 값을 반환

```java

@Test
void exmaple() {

    // findById(1L) 호출 시 member 객체 반환
    when(memberRepository.findById(1L))
            .thenReturn(Optional.of(member));

    // findById(2L) 호출 시 예외 발생
    when(memberRepository.findById(2L))
            .thenThrow(new RuntimeException("Member not found"));

    // 연속 호출에 대해 다른 행동 정의
    when(mock.someMethod())
            .thenReturn("first call")
            .thenReturn("second call");

    // 동적인 응답 생성
    when(mock.calculate(anyInt()))
            .thenAnswer(invocation -> {
                int arg = invocation.getArgument(0);
                return arg * 2;
            });
}
```

### `do*()` 계열

반환값이 `void`인 메서드나, 실제 메서드 호출을 피하면서 Stubbing 해야 하는 Spy 객체에 사용된다.

- `doNothing()`: 아무 동작도 하지 않음
- `doThrow(exception)`: 예외 발생
- `doAnswer(answer)`: 동적인 로직을 실행
- `doReturn(value)`: `when()` 대신 사용하는 Stubbing(Spy 객체에 권장)

```java

@Test
void exmaple() {
    // delete(member)가 호출되면 아무 동작도 하지 않도록 정의
    doNothing()
            .when(memberRepository)
            .delete(member);

    // delete(member)가 호출되면 예외 발생
    doThrow(new IllegalArgumentException())
            .when(memberRepository)
            .delete(member);
}

```

### BDD 스타일 Stubbing (`given`/`willReturn`)

BDD(행위 주도 개발) 스타일을 선호하는 경우, `BDDMockito`를 사용할 수 있다.

- `given(mock.method())`: `when(mock.method())` 동일
- `willReturn(value)`: `thenReturn(value)` 동일

```java

@Test
void bddStubbingExample() {
    // given (준비)
    given(memberRepository.findById(1L))
            .willReturn(Optional.of(member));
}
```

## 3. Verification - 행위 검증

테스트 대상 로직이 실행된 후, Mock 객체의 메서드가 예상대로 호출되었는지 검증한다.

- `times(n)`: 정확히 `n`번 호출되었는지 검증
- `verify(mock)`: 해당 메서드가 1번 호출되었는지 검증(= `times(1)`)
- `never()`: 한 번도 호출되지 않았는지 검증(= `times(0)`)
- `atLeast(n)` / `atMost(n)`: 최소 `n`번 / 최대 `n`번 호출되었는지 검증
- `inOrder(mock...)`: 여러 Mock 객체에 걸쳐 호출 순서가 정확한지 검증
- `timeout(millis)`: 비동기 코드 테스트 시, 지정된 시간 내에 메서드가 호출되는지 검증

```java

@Test
void exmaple() {
    // deleteById(1L)가 정확히 1번 호출되었는지 검증
    verify(memberRepository, times(1))
            .deleteById(1L);

    // deleteById(2L)는 호출되지 않았는지 검증
    verify(memberRepository, never())
            .deleteById(2L);

    // 비동기 작업 후 100ms 안에 notify 메서드가 호출되었는지 검증
    verify(notificationService, timeout(100))
            .notify(any(User.class));

    // 순서 검증
    InOrder inOrder = inOrder(memberRepository, emailService);
    inOrder.verify(memberRepository)
            .save(any(Member.class)); // save가 먼저
    inOrder.verify(emailService)
            .sendWelcomeEmail(any(Member.class)); // email 발송이 나중에
}
```

### BDD 스타일 검증 (`then`/`should`)

BDDMockito는 검증을 위한 `then/should` 문법도 제공한다.

```java
import static org.mockito.BDDMockito.then;

@Test
void bddVerificationExample() {
    // ... 로직 실행 ...

    // then (검증)
    then(memberRepository)
            .should(times(1)) // 1번 호출되었는지
            .deleteById(1L);
}
```

## 4. Argument Matchers & Captors

### Argument Matchers

Stubbing이나 검증 시, 인자의 실제 값 대신 유연한 조건을 사용하고 싶을 때 활용한다.

- `any()`: 모든 타입의 객체를 허용(`anyString()`, `anyInt()` 등 타입별 Matcher 제공)
- `eq(value)`: 특정 값과 동일해야 함을 명시
- `argThat(matcher)`: 커스텀 Matcher를 사용하여 복잡한 조건 지정 가능

중요한 점은 메서드의 여러 인자 중 하나라도 Argument Matcher를 사용했다면, 모든 인자를 Matcher로 작성해야 한다.

```java

@Test
void exmaple() {
    // eq()를 사용하여 일반 값을 Matcher로 변환
    when(memberRepository.save(eq("user"), anyInt()))
            .thenReturn(member);
}
```

### ArgumentCaptor(인자 캡처)

Mock 객체의 메서드가 호출될 때 전달된 실제 인자 값을 포착(Capture)하여, 나중에 검증할 수 있도록 돕는다.

```java
// MockitoExtension을 사용하면 @Captor 애노테이션으로 자동 생성 가능
@Captor
private ArgumentCaptor<Member> memberCaptor;

@Test
void captorExample() {
    // 테스트 대상 로직 실행 (예: memberService.join("newName", 20))
    memberService.join("newName", 20);

    // 1. save 메서드가 호출될 때 인자를 캡처하도록 설정
    verify(memberRepository).save(memberCaptor.capture());

    // 2. 캡처된 인자(Member 객체)를 가져옴
    Member capturedMember = memberCaptor.getValue();

    // 3. 캡처된 객체의 내부 값을 검증
    assertEquals("newName", capturedMember.getName());
    assertEquals(20, capturedMember.getAge());
}
```

메서드 호출 여부뿐만 아니라, "정확히 어떤 값이 전달되었는지" 그 내용을 검증해야 할 때 사용한다. (예: `save` 메서드로 전달된 객체의 필드 값 검증)
