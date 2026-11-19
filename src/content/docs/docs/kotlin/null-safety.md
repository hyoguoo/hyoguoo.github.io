---
title: Null Safety
date: 2026-11-20
lastUpdated: 2026-11-20
tags: [ Kotlin ]
description: "Kotlin의 nullable 타입과 안전 호출, 스마트 캐스트를 설명하고 값이 없을 때 기본값·조기 반환·예외를 선택하는 기준을 정리한다."
---

Kotlin에서는 값이 없을 수 있음을 타입에 표시하고, 그 값을 쓰는 곳에서 처리 방법을 정한다.

## Null Safety와 nullable 타입

Null Safety는 `null`일 수 있는 값을 사용할 때 컴파일러가 접근을 검사하는 기능이다. `T`가 어떤 타입을 나타낼 때, `T?`에는 그 타입의 값과 `null`을 담을 수 있다.

- `String`에 담을 수 있는 값은 `""`을 포함한 문자열
- `String?`에 담을 수 있는 값은 문자열과 `null`
- `Any?`는 `Any`로 받을 수 있는 값과 `null`을 허용 ([Any·Unit·Nothing](/docs/kotlin/basic-syntax-and-types/#anyunitnothing))

```kotlin
fun main() {
    val empty: String = ""
    val missing: String? = null
    println(empty.length)  // 0
    println(missing)       // null
}
```

## 안전 호출

안전 호출 연산자 `?.`는 왼쪽 값이 있을 때만 멤버를 읽고, 왼쪽이 `null`이면 접근을 건너뛰고 `null`을 결과로 낸다.

```kotlin
class Contact(val email: String?)

fun emailLength(contact: Contact?): Int? {
    return contact?.email?.length
}

fun main() {
    println(emailLength(Contact("alice@example.com")))  // 17
    println(emailLength(Contact("")))                   // 0
    println(emailLength(Contact(null)))                 // null
    println(emailLength(null))                          // null
}
```

## 기본값과 실패 처리

엘비스 연산자 `?:`는 왼쪽 값을 먼저 평가한다. 왼쪽이 `null`일 때만 오른쪽을 실행하므로 대체 값을 계산하거나, 함수를 끝내거나, 예외를 던질 수 있다.

```kotlin
fun displayEmail(email: String?): String {
    return email ?: "미등록"
}

fun printEmail(email: String?) {
    val address = email ?: return
    println(address)
}

fun requireUserId(id: Long?): Long {
    return id ?: throw IllegalArgumentException("user ID is required")
}

fun main() {
    println(displayEmail(null))  // 미등록
    println(displayEmail("").length)  // 0
    printEmail(null)  // 출력 없이 반환
    println(requireUserId(42L))  // 42
    requireUserId(null)  // IllegalArgumentException
}
```

값이 없을 때 호출자가 기대하는 동작에 맞춰 오른쪽 식을 고른다.

| 오른쪽 식                             | `null`일 때      | 사용 조건                                 |
|:--------------------------------------|:-----------------|:------------------------------------------|
| `"미등록"`                            | 문구를 반환      | 표시할 대체 값이 정해져 있을 때           |
| `return`                              | 함수를 바로 끝냄 | 값을 쓰는 작업을 건너뛰어도 될 때         |
| `throw IllegalArgumentException(...)` | 예외를 던짐      | 필수 입력이 빠져 작업을 계속할 수 없을 때 |

[안전 호출과 엘비스 연산자](https://kotlinlang.org/docs/null-safety.html)

## 타입 확인과 스마트 캐스트

스마트 캐스트는 조건 검사 뒤에 컴파일러가 값을 더 구체적인 타입으로 다루는 기능이다.
`!= null`로 `null`을 걸러 내거나, `is`로 런타임 타입을 확인한 뒤 해당 타입의 멤버를 쓸 수 있다.

```kotlin
class Field(var value: String?)

fun fieldLength(field: Field): Int? {
    val text = field.value
    if (text != null) return text.length
    return null
}

fun textLength(value: Any?): Int? {
    if (value is String) return value.length
    return null
}

fun main() {
    println(fieldLength(Field("abc")))  // 3
    println(fieldLength(Field(null)))   // null
    println(textLength("abc"))         // 3
    println(textLength(42))            // null
}
```

- `text != null`이 참인 분기에서 `text`를 `String`으로 처리
- `value is String` 검사에서 `null`과 다른 타입의 값 제외
- `field.value != null` 검사 뒤 `field.value.length`에 직접 접근하면 컴파일 오류 발생

## 안전한 형 변환과 예외 표현식

`as?`는 지정한 타입으로 형 변환할 수 있으면 그 값을 돌려주고, 변환할 수 없으면 `null`을 반환한다. 아래 코드는 `Any?`로 받은 설정값을 문자열로 읽는다.

```kotlin
fun readLabel(value: Any?): String? {
    return value as? String
}

fun main() {
    println(readLabel("active"))  // active
    println(readLabel(null))      // null
    println(readLabel(42))        // null
}
```

원래 값에 `null` 검사를 추가하면 같은 결과가 나온 이유를 구분할 수 있다.

|    입력    | `value == null` | `value as? String` | 결과가 나온 이유          |
|:----------:|:---------------:|:------------------:|:--------------------------|
| `"active"` |     `false`     |     `"active"`     | 문자열이라 형 변환 성공   |
|   `null`   |     `true`      |       `null`       | 값이 없음                 |
|    `42`    |     `false`     |       `null`       | 값이 있지만 문자열이 아님 |

[타입 검사와 형 변환](https://kotlinlang.org/docs/typecasts.html)

`try`도 결과를 값으로 쓸 수 있는 표현식이다. 예외가 없으면 `try` 블록의 마지막 표현식을, 잡은 예외가 있으면 해당 `catch` 블록의 마지막 표현식을 결과로 사용한다.

```kotlin
fun readLimit(text: String): Int {
    return try {
        text.toInt()
    } catch (_: NumberFormatException) {
        10
    }
}

fun main() {
    println(readLimit("25"))    // 25
    println(readLimit("many"))  // 10
}
```

- `"25"`는 정수 변환에 성공해 `try`에서 `25` 반환
- `"many"`는 `toInt()`에서 `NumberFormatException`이 발생해 `catch`에서 `10` 반환

호출자가 변환 실패를 처리해야 한다면 예외가 호출자까지 전달되도록 둔다.

[예외 처리와 `Nothing`](https://kotlinlang.org/docs/exceptions.html)

## `!!`와 남는 오류

`!!`는 값이 `null`이 아니라고 단언하는 연산자다. 컴파일러는 결과를 `null`을 허용하지 않는 타입으로 다루고, 실행 중 값이 `null`이면 `NullPointerException`이 발생한다.

```kotlin
fun forcedLength(text: String?): Int {
    return text!!.length
}

fun main() {
    println(forcedLength("abc"))  // 3
    println(forcedLength(null))   // NullPointerException
}
```

- nullable 입력은 `?.`로 접근하고, 값이 없을 때의 동작은 `?:`로 지정
- Java에서 `null`이 올 수 있는 반환값은 `T?`로 받아 검사
- 외부에는 초기화가 끝난 객체를 전달
