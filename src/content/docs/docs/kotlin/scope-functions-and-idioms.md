---
title: Scope Functions and Idioms
date: 2026-11-26
lastUpdated: 2026-11-26
tags: [ Kotlin ]
description: "Kotlin scope function의 수신 객체와 반환값을 비교하고, require·check 검증과 lateinit·by lazy 초기화가 Java 코드와 어떻게 다른지 설명한다."
---

Scope function은 객체 하나를 블록 안에서 `this`나 `it`으로 받아 코드를 실행하는 표준 라이브러리 함수다.

## 수신 객체와 반환값

- `this`: 현재 코드가 실행되는 객체. 메서드 안에서는 그 메서드를 가진 객체
- `it`: 매개변수가 하나인 람다에서 이름을 정하지 않은 매개변수의 기본 이름

Scope function은 블록 안의 `this`를 대상 객체로 바꾸거나, `this`는 그대로 두고 대상 객체를 `it`으로 넘긴다.

```kotlin
class SignupService {
    val name = "service"

    fun printNames(form: SignupForm) {  // form.name은 "Alice"
        form.apply { println(name) }    // Alice: this가 form
        form.also { println(name) }     // service: this는 SignupService 그대로
        form.also { println(it.name) }  // Alice: form은 it
    }
}
```

다섯 함수는 블록 안에서 객체를 부르는 방법과 반환값으로 구분한다.

|    함수     | 블록 안의 객체 |   반환값    | 주 사용처                    |
|:-----------:|:--------------:|:-----------:|:-----------------------------|
|    `let`    |      `it`      | 블록의 결과 | nullable 값이 있을 때만 변환 |
|    `run`    |     `this`     | 블록의 결과 | 객체의 값으로 결과 계산      |
| `with(obj)` |     `this`     | 블록의 결과 | 객체 하나에 여러 호출을 묶음 |
|   `apply`   |     `this`     |  객체 자신  | 객체 설정                    |
|   `also`    |      `it`      |  객체 자신  | 로그 같은 부수 효과          |

```kotlin
class SignupForm {
    var name: String = ""
    var email: String? = null
}

fun main() {
    val form = SignupForm().apply {
        name = "Alice"
        email = "alice@example.com"
    }
    val nameLength: Int = form.run { name.length }
    val domain: String? = form.email?.let { it.substringAfter("@") }
    val label: String = with(form) { "$name <$email>" }
    val same: SignupForm = form.also { println("also: ${it.name}") }

    println(nameLength)
    println(domain)
    println(label)
    println(same === form)
}

/*
also: Alice
5
example.com
Alice <alice@example.com>
true
 */
```

## 목적별 사용

### nullable 값 처리: `?.let`

`?.let`은 값을 한 번 읽어 다음과 같이 동작한다.

- 값이 `null`이 아니면 블록을 실행하며, 블록 안의 `it`은 `String`이라 `?.` 없이 사용
- 값이 `null`이면 블록을 건너뛰고 `null` 반환
- 뒤에 `?:`를 붙이면 Java의 `Optional.ofNullable(...).map(...).orElse(...)`와 같은 흐름

```kotlin
fun domainOf(email: String?): String = email?.let { it.substringAfter("@") } ?: "unknown"

fun main() {
    println(domainOf("bob@corp.example"))  // corp.example
    println(domainOf(null))                // unknown
}
```

`if`로 `null`을 검사하는 방식은 지역 변수에는 통하지만 `var` 프로퍼티에는 통하지 않으며, 이때 `?.let`을 쓸 수 있다.

- 지역 변수는 `if (email != null)` 안에서 `String`으로 사용 가능(스마트 캐스트)
- `var` 프로퍼티는 읽을 때마다 값을 새로 가져와 검사와 사용 사이에 바뀔 수 있으므로, 같은 검사로는 `String`이 되지 않음
- `?.let`은 한 번 읽은 값을 `it`에 담으므로 프로퍼티에도 그대로 사용 가능

```kotlin
fun printEmailLength(form: SignupForm) {
    form.email?.let { println(it.length) }  // it은 String

    // if (form.email != null) println(form.email.length)
    // 컴파일 오류: smart cast to 'String' is impossible
}
```

### 객체 설정과 부수 효과: `apply`, `also`

`apply`와 `also`는 둘 다 객체 자신을 반환하므로, Java처럼 변수를 먼저 만들고 setter를 줄마다 호출하지 않고 객체 생성, 값 설정, 로그를 식 하나로 이어 쓸 수 있다. 다음 예제는 차이가
보이도록 보통 생략하는 `this.`를 직접 썼다.

```kotlin
class SignupService {
    val name = "signup"
    private val created = mutableListOf<SignupForm>()

    fun create(): SignupForm = SignupForm()
        .apply {
            this.name = "Alice"                            // this는 form
            this.email = "alice@example.com"
        }
        .also {
            this.created.add(it)                           // this는 SignupService, it은 form
            println("[${this.name}] created: ${it.name}")  // [signup] created: Alice
        }
}
```

- `apply`는 `this`가 새로 만든 `SignupForm`이라 `this.name`이 그 객체의 `name`. 객체의 값을 채울 때 사용
- `also`는 `this`가 바깥 클래스 그대로라 `this.name`이 `SignupService.name`이고, 객체는 `it`으로 접근. 객체를 바꾸지 않는 로그·저장 코드를 끼워 넣을 때 사용

## 수신 객체가 겹칠 때

`apply` 블록 안에서 `name`만 쓰면, 바깥 `SignupService`에 같은 이름이 있어도 `apply`를 호출한 `SignupForm`의 `name`이 쓰인다.

```kotlin
class SignupService {
    val name = "service"

    fun create(): SignupForm = SignupForm().apply {
        email = "$name@example.com"                       // @example.com: name은 SignupForm의 name("")
    }

    fun createFixed(): SignupForm = SignupForm().apply {
        email = "${this@SignupService.name}@example.com"  // service@example.com
    }
}
```

- `create()`는 오류나 경고 없이 컴파일되므로 실행 결과로만 발견 가능(Kotlin 2.4.21 기준)
- 바깥 클래스의 값이 필요하면 `this@SignupService.name`처럼 클래스 이름을 붙이거나, `this`를 바꾸지 않는 `also`로 변경

`let` 안에 `let`을 또 쓰면 두 블록이 모두 `it`을 쓰므로, 안쪽 블록에서는 바깥 값을 `it`으로 부를 수 없다.

```kotlin
fun printDomain(form: SignupForm) {
    // 컴파일·실행은 되지만, 바깥 it은 이메일이고 안쪽 it은 @ 뒤 부분이라 읽기 어려움
    form.email?.let {
        it.substringAfter("@").let { println(it) }  // example.com
    }

    // 지역 변수에 담아 이름을 붙인 코드
    val email = form.email ?: return
    val domain = email.substringAfter("@")
    println(domain)                                 // example.com
}
```

- `let`을 겹쳐 쓰지 않고 이메일과 `@` 뒤 부분을 `email`, `domain` 변수에 각각 담으면, 어떤 값인지 이름으로 바로 확인 가능
- `form.email?.let { email -> ... }`처럼 람다 매개변수에 이름을 붙여도 같은 효과

## 입력과 상태 검증: `require`, `check`

`require`와 `check`는 조건이 거짓이면 예외를 던지는 함수다. 검사하는 대상과 던지는 예외가 다르다.

|              함수               | 검사하는 것            |        실패 시 예외        | Java에서 쓰던 코드                                      |
|:-------------------------------:|:-----------------------|:--------------------------:|:--------------------------------------------------------|
|   `require(조건) { 메시지 }`    | 호출자가 넘긴 인자     | `IllegalArgumentException` | `if`로 검사한 뒤 같은 예외를 직접 던짐                  |
| `requireNotNull(값) { 메시지 }` | 인자가 `null`이 아닌지 | `IllegalArgumentException` | `Objects.requireNonNull`. 예외는 `NullPointerException` |
|    `check(조건) { 메시지 }`     | 객체의 현재 상태       |  `IllegalStateException`   | `if`로 검사한 뒤 같은 예외를 직접 던짐                  |

```kotlin
fun register(form: SignupForm): String {
    val email: String = requireNotNull(form.email) { "email is required" }  // email 없음: IllegalArgumentException
    require("@" in email) { "invalid email: $email" }                       // "@" 없음: IllegalArgumentException
    return email
}

class Order {
    var paid = false

    fun ship(): String {
        check(paid) { "order is not paid" }  // 결제 전: IllegalStateException
        return "shipped"
    }
}
```

- `requireNotNull`은 검사한 값을 non-null 타입으로 반환하므로 다음 줄부터 `email`을 `String`으로 사용
- 메시지 블록은 검사가 실패할 때만 실행
- 두 예외는 어떤 업무 규칙을 어겼는지 구분하지 못하므로, 오류 코드로 구분해야 하는 업무 규칙 위반은 서비스가 정한 도메인 예외로 유지

## 초기화 시점 미루기: `lateinit`, `by lazy`

Kotlin은 non-null 프로퍼티에 객체를 만들 때까지 초기값을 요구한다. 의존성 주입이나 테스트 준비 메서드처럼 생성 뒤에 값을 넣거나, 처음 쓸 때 계산하려면 두 표현 중 하나를 쓴다.

|           구분            | `lateinit var`                         | `val ... by lazy`               |
|:-------------------------:|:---------------------------------------|:--------------------------------|
|    값이 정해지는 시점     | 외부 코드가 나중에 대입할 때           | 처음 읽을 때 블록을 실행해 계산 |
|           선언            | `var`만 가능                           | `val`만 가능                    |
| 값이 정해지기 전에 읽으면 | `UninitializedPropertyAccessException` | 예외 없음                       |
|      쓸 수 없는 타입      | `Int` 같은 기본 타입, nullable 타입    | 제한 없음                       |

```kotlin
class Mailer {
    lateinit var sender: String
    val domain: String by lazy {
        println("domain 계산")
        "example.com"
    }
}

fun main() {
    val mailer = Mailer()
    // println(mailer.sender)  // 대입 전: lateinit property sender has not been initialized

    mailer.sender = "noreply@example.com"
    println(mailer.sender)
    println(mailer.domain)
    println(mailer.domain)
}

/*
noreply@example.com
domain 계산
example.com
example.com
 */
```

- `lateinit`은 대입 전에 읽으면 비어 있는 프로퍼티 이름을 예외 메시지로 표시. Java 필드는 `null`인 채로 넘어가 그 값을 쓰는 곳에서 `NullPointerException` 발생
- `lateinit`의 초기화 여부는 `this::sender.isInitialized`로 확인. 프로퍼티를 선언한 클래스, 그 바깥 클래스, 같은 파일의 최상위 프로퍼티에서만 사용 가능
- `by lazy` 블록은 처음 읽을 때 한 번만 실행하고, 이후에는 저장한 값을 반환
- `by lazy`의 기본 설정은 여러 스레드가 동시에 처음 읽어도 블록이 한 번만 실행되도록 동기화
    - 한 스레드에서만 읽는다면 `lazy(LazyThreadSafetyMode.NONE)`으로 동기화 비용 제거 가능

[Scope functions](https://kotlinlang.org/docs/scope-functions.html), [Late-initialized properties](https://kotlinlang.org/docs/properties.html#late-initialized-properties-and-variables), [Lazy properties](https://kotlinlang.org/docs/delegated-properties.html#lazy-properties)
