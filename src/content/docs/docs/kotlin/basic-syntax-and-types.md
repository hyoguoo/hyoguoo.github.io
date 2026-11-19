---
title: Basic Syntax and Types
date: 2026-11-20
lastUpdated: 2026-11-20
tags: [ Kotlin ]
description: "Kotlin의 val·var와 타입 추론, 숫자 변환, 문자열 템플릿, if·when 표현식과 범위·반복문을 Java 문법과 비교한다."
---

Kotlin은 `val`·`var`로 변수의 재할당 여부를 구분하고, `if`·`when`의 결과를 값으로 사용할 수 있다.

## 변수 선언과 타입 추론

변수는 `val 이름: 타입 = 값` 또는 `var 이름: 타입 = 값`으로 선언하며, 초기값으로 타입을 알 수 있으면 생략할 수 있다.

```kotlin
val userId: Long = 42L
val name = "Mina"       // String으로 추론
var attempts = 0         // Int로 추론

attempts += 1
println(attempts)        // 1
```

- 타입 추론은 컴파일러가 변수의 타입을 결정하는 과정
- `var`는 값을 다시 대입할 수 있다는 뜻이며 타입까지 바꿀 수 있다는 뜻이 아님

|        선언        | 초기화 후 재할당 | Java의 대응 선언           |
|:------------------:|:----------------:|:---------------------------|
| `val userId = 42L` |      불가능      | `final long userId = 42L;` |
| `var userId = 42L` |       가능       | `long userId = 42L;`       |

```kotlin
val userId = 42L
userId = 43L             // 컴파일 오류: val 재할당
```

## 기본 타입과 숫자 변환

Java는 `int` 값을 `long` 변수에 대입할 때 자동으로 변환하지만, Kotlin은 `Int` 변수를 `Long` 변수에 대입할 때 명시적 변환이 필요하다.

```kotlin
val count: Int = 3
val total: Long = count  // 컴파일 오류: Int를 Long에 직접 대입
```

`toLong()`으로 변환한 결과를 대입하면 된다.

```kotlin
val count = 3
val total: Long = count.toLong()
println(total)            // 3
```

- 숫자 변환에는 `toInt()`, `toLong()`, `toDouble()` 등을 사용
- `val userId: Long = 42`는 가능: 변수와 달리 리터럴 `42`는 선언에 적은 타입으로 처리
- 명시적 변환도 값 손실 가능: `3.8.toInt()`는 소수 부분을 버리고 `3` 반환

[숫자 타입과 변환](https://kotlinlang.org/docs/numbers.html)

## 문자열 템플릿

Java의 `"id=" + userId`처럼 문자열을 연결하는 대신, Kotlin에서는 문자열 안에 변수나 계산 결과를 바로 넣을 수 있다.

```kotlin
val userId = 42L
println("id=$userId, next=${userId + 1}")
// id=42, next=43
```

- `$userId`: 변수의 값 삽입
- `${userId + 1}`: 중괄호 안의 표현식을 계산한 결과 삽입

[문자열 템플릿](https://kotlinlang.org/docs/strings.html#string-templates)

## if와 when 표현식

Kotlin의 `if`와 `when`은 조건에 따라 선택한 값을 변수에 대입할 수 있다. 이처럼 결과를 값으로 사용하는 코드를 표현식이라고 한다.

|  구분  | 값을 선택하는 기준                     |
|:------:|:---------------------------------------|
|  `if`  | 조건의 참·거짓                         |
| `when` | 여러 값이나 조건 중 처음 일치하는 분기 |

### if

Java의 `active ? "active" : "inactive"`를 Kotlin에서는 `if`로 작성한다. 분기를 블록으로 작성하면 마지막 표현식이 그 분기의 결과가 된다.

```kotlin
val active = true
val status = if (active) {
    "active"
} else {
    "inactive"
}
println(status)  // active
```

- 두 분기의 결과가 모두 문자열이므로 `status`는 `String`으로 추론
- 값을 대입하는 `if`에는 `else`가 필수. 동작만 실행하는 `if`에는 생략 가능

### when

`when`은 여러 값을 비교해 분기를 선택한다. 조건 뒤의 `->`에 해당 조건에서 사용할 값을 적는다.

```kotlin
val statusCode = 404
val message = when (statusCode) {
    200, 201 -> "success"
    404 -> "not found"
    else -> "other"
}
println(message)  // not found
```

- 값을 대입하는 `when`은 모든 입력에 대해 결과가 필요
- `Boolean`처럼 `true`와 `false`를 모두 나열할 수 있으면 `else` 생략 가능

[조건과 분기](https://kotlinlang.org/docs/control-flow.html)

## 범위와 반복문

정수 범위는 시작과 끝 사이의 정수를 나타내며, `for`에서 순서대로 꺼내 사용할 수 있다. 끝값을 포함하는지와 진행 방향은 다음과 같이 구분한다.

|     표현      | 순서대로 꺼내는 값 | 경계·방향                                  |
|:-------------:|:------------------:|:-------------------------------------------|
|    `1..3`     |     `1, 2, 3`      | 양 끝 포함                                 |
|    `1..<3`    |       `1, 2`       | 끝값 제외                                  |
| `3 downTo 1`  |     `3, 2, 1`      | 감소 방향                                  |
| `1..5 step 2` |     `1, 3, 5`      | 간격 2                                     |
|    `3..1`     |        없음        | 증가 방향에서 시작값이 끝값보다 커 빈 범위 |

[범위와 간격](https://kotlinlang.org/docs/ranges.html), [반복문의 제어 이동](https://kotlinlang.org/docs/returns.html)

## Any·Unit·Nothing

함수를 선언할 때는 어떤 값을 받을지 매개변수 타입에, 호출자가 어떤 결과를 받을지 반환 타입에 적는다. 여러 타입의 값을 받아 출력하는 함수에서 두 타입을 살펴보자.

### Any

`Any`는 `null`을 허용하지 않는 타입의 공통 상위 타입으로, Java의 `Object`처럼 매개변수의 타입을 하나로 제한할 필요가 없을 때 쓸 수 있다.

```kotlin
fun log(value: Any) {
    println(value)
}

fun main() {
    log("start")  // start
    log(123)      // 123
}
```

- `Any`로 받은 값에서 문자열 길이인 `length`를 읽으려면 먼저 그 값이 `String`인지 확인
- `null`도 받아야 한다면 매개변수 타입을 `Any?`로 선언

[Kotlin의 `Any`](https://kotlinlang.org/spec/built-in-types-and-their-semantics.html#kotlin.any)

### Unit

`Unit`은 같은 이름의 값 하나만 갖는 타입으로, 출력처럼 호출자에게 돌려줄 데이터가 없는 함수는 정상적으로 끝날 때 `Unit`을 반환한다.

```kotlin
fun printMessage(message: String): Unit {
    println(message) // ready
    return Unit
}

fun main() {
    val result: Unit = printMessage("ready")
    println(result) // kotlin.Unit
}
```

- 블록 본문에서 `Unit`을 반환하는 함수는 `: Unit`과 본문 끝의 `return Unit` 생략 가능
- `fun answer() = 42`처럼 표현식을 본문으로 쓰면 반환 타입을 표현식에서 추론
- 함수 타입을 직접 쓸 때는 `(String) -> Unit`처럼 화살표 뒤에 반환 타입을 적음

|       구분       | Kotlin `Unit`                               | Java `void`                                                                     |
|:----------------:|:--------------------------------------------|:--------------------------------------------------------------------------------|
|    호출 결과     | `Unit` 값을 변수에 대입 가능                | 대입할 값이 없음                                                                |
| 제네릭 타입 인자 | `Callable<Unit>`은 정상 반환 시 `Unit` 반환 | 별도 참조 타입인 `Void`를 사용하며, `Callable<Void>`는 정상 반환 시 `null` 반환 |

[Kotlin의`Unit` 반환](https://kotlinlang.org/docs/functions.html#unit-returning-functions),
[Kotlin의 함수 타입](https://kotlinlang.org/docs/lambdas.html#function-types),
[Java의 메서드 반환](https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html#jls-8.4.5),
[Java의`Void`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Void.html)

### Nothing

호출할 때마다 예외를 던지는 함수처럼 정상적으로 반환할 수 없는 함수에 이 타입을 쓴다.
`Unit`을 반환하는 함수도 실행 중 예외가 날 수 있지만, 정상적으로 끝나는 경우에는 호출자가 `Unit` 값을 받는다.

앞에서 본 `if` 표현식에서 실패한 입력을 거부하는 분기에 `Nothing`을 쓸 수 있다. 다음 함수는 ID가 양수일 때만 값을 반환한다.

```kotlin
fun fail(message: String): Nothing {
    throw IllegalArgumentException(message)
}

fun requireId(id: Long): Long {
    return if (id > 0) id else fail("id must be positive")
}

fun main() {
    println(requireId(42L))  // 42
    println(requireId(0L))   // IllegalArgumentException: id must be positive
}
```

- `Nothing`은 모든 타입의 하위 타입이므로 컴파일러는 `Long`이 필요한 분기에서도 `fail` 호출을 허용
- ID가 `0`이면 인자를 계산하는 도중 예외가 발생하므로 두 번째 `println`은 실행되지 않음

[Kotlin의 `Nothing`과 예외](https://kotlinlang.org/docs/exceptions.html#the-nothing-type)
