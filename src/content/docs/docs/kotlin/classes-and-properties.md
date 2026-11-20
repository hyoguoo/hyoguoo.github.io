---
title: Classes and Properties
date: 2026-11-20
lastUpdated: 2026-11-20
tags: [ Kotlin ]
description: "Kotlin 클래스의 프로퍼티와 생성자·초기화 순서, 접근자와 가시성을 설명하고 Java·Lombok의 필드·getter·생성자 표현과 비교한다."
---

Kotlin 클래스는 생성자와 프로퍼티를 클래스 헤더에 함께 선언할 수 있다.

## 클래스와 프로퍼티

프로퍼티는 클래스가 가진 값을 이름으로 읽고 쓰는 선언이다. Java에서 `private` 필드와 getter·setter를 따로 작성하던 것을 하나로 선언하며, 컴파일하면 `private` 필드와 접근자 메서드가
만들어진다.

- `val`: 읽기 전용 프로퍼티. getter만 생성
- `var`: 변경 가능한 프로퍼티. getter와 setter 생성
- 객체를 만들 때는 `new` 없이 클래스 이름을 함수처럼 호출

```kotlin
class Account(val id: Long, var email: String)

fun main() {
    val account = Account(1L, "alice@example.com")
    println(account.id)  // 1

    account.email = "alice@corp.example"
    println(account.email)  // alice@corp.example
}
```

`account.id`는 필드를 직접 읽는 코드처럼 보이지만, 실제로는 getter를 호출하며, `account.email = ...`도 setter 호출하게 된다.

그래서 getter·setter에 동작을 추가해도 프로퍼티를 읽고 쓰는 코드는 바꾸지 않아도 된다.

|            선언            | 검사를 추가할 곳        | 값을 대입하는 코드                 |
|:--------------------------:|:------------------------|:-----------------------------------|
| Kotlin `var email: String` | `email`의 setter        | 그대로 유지                        |
| Java `public String email` | 새로 만든 setter 메서드 | 대입하는 곳마다 setter 호출로 수정 |

### 생성자 인자와 프로퍼티

주 생성자의 매개변수에 `val`·`var`를 붙이면 매개변수와 프로퍼티를 한 번에 선언한다.
붙이지 않은 매개변수는 Java 생성자의 매개변수처럼 객체에 저장되지 않지만, 클래스 본문의 프로퍼티 초기화식과 `init` 블록에서 읽을 수 있다.

```kotlin
class Signup(email: String) {
    val domain = email.substringAfter("@")
}
```

- `domain`의 초기화식에서 생성자 매개변수 `email`을 읽음. Java에서는 필드 초기화식이 생성자 매개변수를 읽을 수 없어 생성자 본문에서 대입
- `email`은 저장되지 않으므로 객체 밖이나 멤버 함수에서 읽을 수 없음

주 생성자 매개변수의 선언에 따라 객체가 값을 보관하는지와 외부에서 바꿀 수 있는지가 달라진다.

|  주 생성자의 선언   |    프로퍼티 여부     | 객체 밖에서 읽기 | 객체 밖에서 변경 |
|:-------------------:|:--------------------:|:----------------:|:----------------:|
|   `email: String`   |         아님         |       불가       |       불가       |
| `val email: String` |  읽기 전용 프로퍼티  |       가능       |       불가       |
| `var email: String` | 변경 가능한 프로퍼티 |       가능       |       가능       |

## 생성자와 초기화

주 생성자는 클래스 이름 뒤에 선언하는 생성자이며, 본문을 가질 수 없다. 객체를 만들 때 실행할 코드는 `init` 블록에 쓴다.
보조 생성자는 클래스 본문에 `constructor`로 선언하는 추가 생성자이며, 주 생성자가 있으면 `this(...)`로 주 생성자를 먼저 호출해야 한다.

1. 주 생성자에 인자를 전달 (생략한 인자에는 기본값 사용)
2. 클래스 본문의 프로퍼티 초기화식과 `init` 블록을 위에서 아래로, 적힌 순서대로 실행
3. 보조 생성자로 만들었다면 주 생성자 호출이 끝난 뒤 보조 생성자의 본문 실행

```kotlin
class Member(rawEmail: String, val role: String = "USER") {
    val email = rawEmail.trim().lowercase()

    init {
        println("1. init: email=$email")
        if (!email.contains("@")) {
            throw IllegalArgumentException("invalid email: $email")
        }
    }

    val label = "$role:$email"

    init {
        println("2. init: label=$label")
    }

    constructor(rawEmail: String, admin: Boolean) : this(rawEmail, if (admin) "ADMIN" else "USER") {
        println("3. 보조 생성자 본문")
    }
}

fun main() {
    println(Member("  Alice@Example.com ").label)
    println("---")
    println(Member("bob@example.com", admin = true).label)
    println("---")
    Member("invalid")
}

/*
1. init: email=alice@example.com
2. init: label=USER:alice@example.com
USER:alice@example.com
---
1. init: email=bob@example.com
2. init: label=ADMIN:bob@example.com
3. 보조 생성자 본문
ADMIN:bob@example.com
---
1. init: email=invalid
Exception in thread "main" java.lang.IllegalArgumentException: invalid email: invalid
 */
```

- 첫 번째 호출은 `role`을 생략해 기본값 `"USER"` 사용
- `init` 블록은 여러 개 둘 수 있으며, 프로퍼티 초기화식과 함께 적힌 순서대로 실행
- 첫 번째 `init` 블록은 `email` 선언보다 아래에 있어 정규화된 `email` 값을 출력하고 검사
- 보조 생성자의 본문은 주 생성자의 초기화가 모두 끝난 뒤 실행
- 마지막 호출은 첫 번째 `init` 블록에서 예외가 발생해 `label` 초기화와 두 번째 `init` 블록을 실행하지 않음

[Classes](https://kotlinlang.org/docs/classes.html)

## 가시성

가시성 수정자(visibility modifier)는 Java의 접근 제어자에 해당하며, 선언에 접근할 수 있는 범위를 정한다. 아무것도 붙이지 않으면 `public`이다.

|     수정자      |      클래스 안의 선언       | 클래스 밖의 선언 |
|:---------------:|:---------------------------:|:----------------:|
| `public` (기본) |          어디서나           |     어디서나     |
|   `internal`    |          같은 모듈          |    같은 모듈     |
|   `protected`   | 선언한 클래스와 하위 클래스 |  사용할 수 없음  |
|    `private`    |      선언한 클래스 안       |    같은 파일     |

모듈은 함께 컴파일되는 Kotlin 파일의 묶음으로, Gradle에서는 source set 하나가 모듈이다.
다만 test source set은 main source set의 `internal` 선언에 접근할 수 있다.

Java와는 다음 두 가지가 다르다.

- Kotlin에는 package-private가 없고, 수정자를 생략하면 `public`
- Kotlin의 `protected`는 같은 패키지라도 하위 클래스가 아니면 접근 불가

### 프로퍼티의 가시성

프로퍼티에서는 `val`·`var`와 가시성 수정자가 서로 다른 것을 정한다.

- `val`·`var`: setter를 만드는지. `val`은 getter만, `var`는 getter와 setter
- 가시성 수정자: getter·setter에 접근할 수 있는 범위. `val`·`var` 앞에 붙이며 생략하면 `public`
- 필드: 수정자와 관계없이 항상 `private`

같은 `email` 프로퍼티를 Java로 옮기면 다음과 같다.

| Kotlin 선언                         | Java 기준                                                     |
|:------------------------------------|:--------------------------------------------------------------|
| `val email: String`                 | `private final` 필드 + `public` getter                        |
| `var email: String`                 | `private` 필드 + `public` getter·setter                       |
| `protected val email: String`       | `private final` 필드 + `protected` getter                     |
| `private val email: String`         | `private final` 필드만                                        |
| `var email: String` + `private set` | `private` 필드 + `public` getter. 대입은 클래스 안에서만 가능 |

getter는 항상 프로퍼티와 같은 가시성을 가진다. setter만 마지막 줄의 `private set`처럼 프로퍼티보다 좁힐 수 있다.

[Visibility Modifiers](https://kotlinlang.org/docs/visibility-modifiers.html)

## 접근자 직접 정의

프로퍼티 선언 아래에 `get()`·`set()`을 쓰면 접근자의 가시성이나 본문을 바꿀 수 있다.

### 읽기는 공개하고 변경은 제한

```kotlin
// 기본 setter를 공개하지 않고 `changeEmail` 같은 변경 메서드만 공개하는 형태
class Account(val id: Long, email: String) {
    var email: String = email
        private set

    fun changeEmail(newEmail: String) {
        if (!newEmail.contains("@")) {
            throw IllegalArgumentException("invalid email: $newEmail")
        }
        email = newEmail
    }
}

fun main() {
    val account = Account(1L, "alice@example.com")
    account.changeEmail("alice@corp.example")
    println(account.email)  // alice@corp.example
}
```

- `class Account(val id: Long, email: String)`: 헤더에는 `private set`을 쓸 수 없어 `email`은 `val`·`var` 없이 매개변수로만 받음
- `var email: String = email`: 본문에서 프로퍼티를 선언하고, 오른쪽의 생성자 매개변수로 초기화
- `private set`: getter는 프로퍼티의 가시성인 `public`을 따르고, 대입만 클래스 안으로 제한
- `changeEmail`: 클래스 밖에서 값을 바꾸는 유일한 방법이라, 검사를 건너뛴 대입이 불가

### 계산하는 getter

getter 본문이 다른 프로퍼티로 값을 계산하면, 그 프로퍼티에는 값을 담을 필드가 만들어지지 않고 읽을 때마다 getter가 실행된다. 아래는 초기화식으로 선언한 프로퍼티와 비교한 예제다.

```kotlin
// `domain`은 필드 없이 getter 메서드만 있는 형태
class Account(var email: String) {
    val storedDomain = email.substringAfter("@")

    val domain: String
        get() = email.substringAfter("@")
}

fun main() {
    val account = Account("alice@example.com")
    account.email = "alice@corp.example"

    println(account.storedDomain)  // example.com
    println(account.domain)        // corp.example
}
```

| 선언                             | 필드 | 계산 시점       | `email`을 바꾼 뒤 읽은 값 |
|:---------------------------------|:----:|:----------------|:--------------------------|
| `val storedDomain = ...`         | 있음 | 생성할 때 한 번 | 생성 시점의 값            |
| `val domain: String get() = ...` | 없음 | 읽을 때마다     | 현재 `email` 기준 값      |

### 검사하는 setter와 field

`field`는 접근자 안에서만 backing field(프로퍼티의 값을 담는 필드)를 뜻하는 특수 식별자다.

```kotlin
class Contact(email: String) {
    var email: String = email
        set(value) {
            if (!value.contains("@")) {
                throw IllegalArgumentException("invalid email: $value")
            }
            field = value
        }
}

fun main() {
    val contact = Contact("alice@example.com")
    contact.email = "alice@corp.example"
    println(contact.email)  // alice@corp.example
    contact.email = "alice"  // IllegalArgumentException
}
```

- `contact.email = ...`은 기본 setter일 때와 같은 코드지만, 이제 검사를 거쳐 저장
- setter 안에서 `field` 대신 `email = value`로 쓰면 setter가 자기 자신을 다시 호출해 `StackOverflowError` 발생
- 생성 시 전달한 초기값은 setter를 거치지 않고 바로 저장되므로, 생성 시점 검사는 `init` 블록에 따로 둠

[Properties](https://kotlinlang.org/docs/properties.html)

## Java·Lombok 표현과의 대응

Lombok이 애노테이션으로 만들던 생성자와 접근자는 Kotlin에서 대부분 선언 문법으로 표현한다.

```java
@Getter
@AllArgsConstructor
public class Account {

    private final long id;
    @Setter
    private String email;
}
```

```kotlin
class Account(val id: Long, var email: String)
```

- `@AllArgsConstructor`의 생성자는 주 생성자로, `@Getter`·`@Setter`는 `val`·`var`로 대응
- Lombok 클래스는 상속할 수 있지만, Kotlin 클래스는 `open`을 붙이지 않으면 상속할 수 없음

자주 쓰는 Lombok 애노테이션별로 대응하는 Kotlin 표현은 다음과 같다.

| Lombok                                               | Kotlin 표현                                        |
|:-----------------------------------------------------|:---------------------------------------------------|
| `@Getter`                                            | `val`·`var` 프로퍼티                               |
| `@Setter`                                            | `var` 프로퍼티. 바깥 대입만 막으려면 `private set` |
| `@AllArgsConstructor`                                | 주 생성자에 모든 프로퍼티 선언                     |
| `@RequiredArgsConstructor`                           | 주 생성자에 `private val`로 의존 객체 선언         |
| `@NoArgsConstructor`                                 | 주 생성자의 모든 매개변수에 기본값 지정            |
| `@Builder`                                           | 기본 인자와 이름 붙인 인자                         |
| `@Data`, `@Value`, `@EqualsAndHashCode`, `@ToString` | data class                                         |

주 생성자의 모든 매개변수에 기본값을 지정하면, 인자 없이 객체를 만들 수 있고 필요한 값만 이름으로 지정할 수 있다.

```kotlin
class Account(val id: Long = 0L, var email: String = "")

fun main() {
    val empty = Account()
    val alice = Account(email = "alice@example.com")

    println(empty.email.isEmpty())  // true
    println(alice.id)               // 0
}
```

- `Account()`: 모든 인자에 기본값을 사용. JVM에는 인자 없는 생성자가 추가로 만들어져 Java에서도 `new Account()`로 호출 가능
- `Account(email = ...)`: 빌더 없이 바꿀 값만 이름 붙인 인자로 지정
- JPA Entity처럼 프레임워크가 기본 생성자를 요구하는 경우의 설정은 JPA Entities에서 다룸

### 생성자 주입 형태

다른 객체를 받아 쓰는 클래스는 주 생성자에 `private val` 프로퍼티로 의존 객체를 선언한다.
Java에서 `private final` 필드와 그 필드를 채우는 생성자(Lombok의`@RequiredArgsConstructor`)를 작성하던 형태다.

```kotlin
interface AccountRepository {
    fun findEmail(id: Long): String?
}

class AccountQueryService(private val repository: AccountRepository) {
    fun email(id: Long): String = repository.findEmail(id) ?: "미등록"
}
```

- `private val`이므로 생성 후 다른 객체로 바꿀 수 없고 클래스 밖에서 읽을 수 없음
- `private` 프로퍼티라 getter를 만들지 않고, 클래스 안에서는 필드를 바로 읽음
- 생성자가 하나뿐이라 의존 객체 없이 `AccountQueryService`를 만들 수 없음
