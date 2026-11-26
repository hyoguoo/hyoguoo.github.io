---
title: Testing and Regression
date: 2026-11-27
lastUpdated: 2026-11-27
tags: [ Kotlin ]
description: "Kotlin 코드를 JUnit 5·Mockito로 테스트할 때 달라지는 문법과 충돌 지점을 정리하고, 기존 Java 테스트로 전환 후 동작을 확인하는 방법과 정적 검사의 적용 범위를 설명한다."
---

Kotlin 코드도 Java와 같은 JUnit 5와 Mockito로 테스트할 수 있다.
다만 Kotlin 클래스는 기본이 `final`이고 `null`이 될 수 없는 타입을 따로 검사하므로, Java에서 쓰던 테스트 코드가 그대로 동작하지 않는 지점이 있다.

## Kotlin으로 쓰는 JUnit 5 테스트

테스트 대상은 저장소에서 사용자를 찾아 이메일을 돌려주고, 사용자가 없으면 예외를 던지는 Kotlin 클래스다.

```kotlin
// UserQueryService.kt
data class User(val id: Long, val email: String)

interface UserRepository {
    fun findById(id: Long): User?
}

class UserNotFoundException(id: Long) : RuntimeException("user $id not found")

class UserQueryService(private val repository: UserRepository) {

    fun findEmail(id: Long): String {
        return repository.findById(id)?.email ?: throw UserNotFoundException(id)
    }
}
```

같은 테스트를 Java와 Kotlin으로 쓰면 다음과 같다. 두 테스트 모두 저장소를 직접 구현해, 1번 사용자만 있는 상태를 만든다.

```java
// UserQueryServiceTest.java
class UserQueryServiceTest {

    private UserQueryService service;

    @BeforeEach
    void setUp() {
        UserRepository repository = id -> id == 1L ? new User(1L, "alice@example.com") : null;
        service = new UserQueryService(repository);
    }

    @Test
    @DisplayName("사용자가 있으면 이메일을 반환한다")
    void findEmail() {
        assertEquals("alice@example.com", service.findEmail(1L));
    }

    @Test
    @DisplayName("사용자가 없으면 예외가 발생한다")
    void findEmailNotFound() {
        assertThrows(UserNotFoundException.class, () -> service.findEmail(2L));
    }
}
```

```kotlin
// UserQueryServiceTest.kt
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows

class UserQueryServiceTest {

    private val repository = object : UserRepository {  // UserRepository를 구현한 객체
        override fun findById(id: Long): User? {
            return if (id == 1L) User(1, "alice@example.com") else null
        }
    }
    private val service = UserQueryService(repository)

    @Test
    fun `사용자가 있으면 이메일을 반환한다`() {
        assertEquals("alice@example.com", service.findEmail(1))
    }

    @Test
    fun `사용자가 없으면 예외가 발생한다`() {
        assertThrows<UserNotFoundException> { service.findEmail(2) }
    }
}
```

두 테스트는 같은 동작을 확인하며, Kotlin 쪽에서 달라진 부분은 세 가지다.

- 테스트 이름: 함수 이름을 백틱으로 감싸면 공백과 한글을 쓸 수 있어, `@DisplayName` 없이 테스트 보고서에 문장이 그대로 표시
- 예외 검증: JUnit 5가 Kotlin용으로 제공하는 `assertThrows<T> { }` 사용. 예외 타입을 `.class` 대신 `<>`로 지정
- 준비 코드: JUnit은 테스트 메서드마다 테스트 클래스 객체를 새로 만들므로, 프로퍼티 초기화가 `@BeforeEach`와 같은 시점에 실행. 테스트마다 새 `service`가 만들어져 `val`로 선언 가능

## Mockito와 Kotlin

Mockito는 Java용 라이브러리라, Kotlin 코드에 쓰면 다음 세 지점에서 문제가 생긴다.

|     충돌 지점      | 원인                                                                                       | 해결                                                                                             |
|:------------------:|:-------------------------------------------------------------------------------------------|:-------------------------------------------------------------------------------------------------|
| Kotlin 클래스 mock | 기본 `final`이라 상속 불가. Mockito 4 이하는 상속으로 mock을 만들어 실패                   | Mockito 5는 바이트코드를 직접 바꾸는 방식이 기본이라 그대로 가능. 4 이하는 `mockito-inline` 추가 |
|    `when` 호출     | `when`이 Kotlin 예약어라 그대로 호출 불가                                                  | 백틱으로 감싼 `` `when` `` 호출, 또는 `given`(BDDMockito)·`whenever`(mockito-kotlin) 사용        |
|    `any()` 인자    | Mockito의 `any()`가 `null`을 반환해, `null` 불가 매개변수에 넘길 때 `NullPointerException` | `null`이 아닌 값을 반환하는 mockito-kotlin의 `any()` 사용                                        |

mockito-kotlin은 Mockito 위에 Kotlin용 함수를 더한 라이브러리로, Mockito 대신이 아니라 함께 쓴다.

```groovy
// build.gradle
dependencies {
    testImplementation 'org.mockito.kotlin:mockito-kotlin:<버전>'  // 사용하는 Mockito 버전과 맞는 버전 선택
}
```

### when 키워드

Mockito의 `when`은 Kotlin에서 `when` 표현식과 이름이 같아 그대로 호출할 수 없다.
다음 세 호출은 모두 `findById(1)`이 `user`를 돌려주도록 같은 설정을 한다.

```kotlin
// UserQueryServiceTest.kt
val user = User(1, "alice@example.com")

`when`(repository.findById(1)).thenReturn(user)    // Mockito: 백틱으로 감싸 호출
given(repository.findById(1)).willReturn(user)      // Mockito의 BDDMockito.given
whenever(repository.findById(1)).thenReturn(user)   // mockito-kotlin
```

### any()와 null 검사

Mockito의 `any()`는 "어떤 인자든 일치"라는 조건을 내부에 기록하고 `null`을 반환한다.
Java 메서드라 반환 타입이 platform type이고, Kotlin은 platform type 값을 non-null 매개변수에 넘기기 전에 `null` 검사를 넣는다.

mockito-kotlin의 `any()`는 같은 조건을 기록한 뒤 `null`이 아닌 값을 반환하므로 검사를 통과한다.

```kotlin
// UserQueryServiceTest.kt
// sender는 EmailSender의 mock. send(email: String)의 매개변수는 null 불가
verify(sender).send(org.mockito.ArgumentMatchers.any())  // Mockito: NullPointerException. any()가 반환한 null이 검사에서 걸림
verify(sender).send(org.mockito.kotlin.any())            // mockito-kotlin: 통과
```

`eq()`, `argThat()` 같은 다른 인자 조건도 Mockito 것은 `null`을 반환해 같은 문제 발생하므로, mockito-kotlin의 같은 이름 함수로 교체하면 된다.

[Test code using JUnit in JVM](https://kotlinlang.org/docs/jvm-test-using-junit.html), [JUnit 5 Kotlin Assertion Support](https://junit.org/junit5/docs/current/user-guide/#writing-tests-assertions-kotlin), [Mockito 5 Release Notes](https://github.com/mockito/mockito/releases/tag/v5.0.0), [mockito-kotlin](https://github.com/mockito/mockito-kotlin), [Upgrading to Gradle 9.0](https://docs.gradle.org/current/userguide/upgrading_major_version_9.html)
