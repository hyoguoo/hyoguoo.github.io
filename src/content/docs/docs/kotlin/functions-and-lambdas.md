---
title: Functions and Lambdas
date: 2026-11-20
lastUpdated: 2026-11-20
tags: [ Kotlin ]
description: "Kotlin의 함수 선언과 인자 전달을 설명하고, 함수 타입·람다·함수 참조의 호출 방식과 확장 함수 선택 규칙을 비교한다."
---

Kotlin에서는 함수가 반환한 값을 변수에 담을 수 있고, 함수 자체도 다른 함수에 인자로 넘길 수 있다. 문자열을 받는 예제로 값을 넘기는 호출과 변환 방법을 넘기는 호출을 살펴본다.

## 함수 선언과 반환

```kotlin
fun normalizeBlock(text: String): String {
    return text.trim().lowercase()
}

fun normalizeExpression(text: String) = text.trim().lowercase()

fun main() {
    val input = "  KoTLin  "
    println(normalizeBlock(input))        // kotlin
    println(normalizeExpression(input))  // kotlin
}
```

- 매개변수는 `text`, 호출할 때 넘긴 인자는 `input`의 값
- 블록 본문은 `{ }` 안에서 `return`으로 결과를 돌려주고, 선언에 반환 타입 `String` 명시
- 표현식 본문은 `=` 뒤 표현식의 값을 반환하고, 위 예제에서는 그 값의 타입에서 `String` 추론

블록 본문에서도 반환 타입이 `Unit`이면 타입 표기를 생략할 수 있다. [Unit](/docs/kotlin/basic-syntax-and-types/#unit)

## 기본 인자와 이름 붙인 인자

매개변수에 기본값을 선언하면 호출할 때 그 인자를 생략할 수 있다. 이름 붙인 인자는 `매개변수명 = 값`으로 쓰며, 중간의 기본 인자를 건너뛰거나 같은 타입의 인자를 구분할 때 쓴다.

```kotlin
fun decorate(text: String, prefix: String = "item: ", suffix: String = "."): String {
    return prefix + text.trim() + suffix
}

fun main() {
    val input = "  Kotlin  "
    println(decorate(input))  // item: Kotlin.
    println(decorate(input, suffix = "!"))  // item: Kotlin!
    println(decorate(suffix = "!", text = input, prefix = "tag: "))  // tag: Kotlin!
}
```

- `decorate(input)`에서는 생략한 `prefix`와 `suffix`에 기본값 사용
- `decorate(input, suffix = "!")`에서는 `prefix`만 생략하고 `suffix`에 `"!"` 지정
- 모든 인자에 이름을 붙인 마지막 호출은 매개변수 선언과 다른 순서로 전달

## 함수 타입과 고차 함수

함수 타입은 함수가 받는 값의 타입과 반환 타입을 나타낸다.

- `(String) -> String`에서 괄호 안은 매개변수 타입이고, 화살표 뒤는 반환 타입
- 함수를 인자로 받거나 반환하는 함수를 고차 함수라고 정의

```kotlin
fun applyTransform(text: String, transform: (String) -> String): String {
    return transform(text)
}

fun normalize(text: String): String = text.trim().lowercase()

fun main() {
    val input = "  KoTLin  "
    val transform: (String) -> String = ::normalize
    val normalized: String = normalize(input)

    println(applyTransform(input, transform))  // kotlin
    println(normalized)                        // kotlin
}
```

두 경로의 출력은 같지만, 문자열을 변환하는 시점과 변수에 담기는 값이 다르다.

| 코드                                              |     변수의 타입      | 변환 시점                                     |
|:--------------------------------------------------|:--------------------:|:----------------------------------------------|
| `val transform: (String) -> String = ::normalize` | `(String) -> String` | `applyTransform` 안에서 받은 함수를 호출할 때 |
| `val normalized: String = normalize(input)`       |       `String`       | `normalized`에 값을 대입하기 전               |

## 람다와 함수 참조

함수를 인자로 넘길 때는 호출하는 자리에 람다를 쓰거나, 이미 만든 함수를 참조할 수 있다.

```kotlin
fun main() {
    val normalize = { text: String ->
        val trimmed = text.trim()
        trimmed.lowercase()
    }

    println(normalize("  KoTLin  "))  // kotlin
}
```

### `it`과 후행 람다

람다의 매개변수가 정확히 하나이고, 그 매개변수를 명시적으로 선언하지 않은 경우 Kotlin은 해당 매개변수에 it이라는 이름을 자동으로 부여한다.

```kotlin
fun applyTransform(text: String, transform: (String) -> String): String {
    return transform(text)
}

fun main() {
    val input = "  KoTLin  "
    println(applyTransform(input, { text -> text.trim().lowercase() }))  // kotlin
    println(applyTransform(input, { it.trim().lowercase() }))  // kotlin
    println(applyTransform(input) { it.trim().lowercase() })  // kotlin
}
```

### 함수 참조

이미 선언한 함수를 넘길 때는 이름 앞에 `::`를 붙인다.

```kotlin
fun normalize(text: String): String = text.trim().lowercase()

fun applyTransform(text: String, transform: (String) -> String): String {
    return transform(text)
}

fun main() {
    val input = "  KoTLin  "
    println(normalize(input))  // kotlin
    println(applyTransform(input, ::normalize))  // kotlin
}
```

- `normalize(input)`은 `main`에서 변환 함수를 바로 호출
- `::normalize`를 인자로 넘기면 `applyTransform` 안의 `transform(text)`에서 호출

[함수 타입과 람다](https://kotlinlang.org/docs/lambdas.html)

## 확장 함수와 수신 타입

확장 함수는 지정한 타입의 값에 점을 붙여 호출할 수 있는 함수다.

- 선언에서 함수 이름 앞에 그 타입을 쓰며, 이 타입을 수신 타입이라고 함
- `this`로 호출할 때 점 앞에 놓인 값에 접근

```kotlin
fun String.normalizedLabel(): String {
    return this.trim().lowercase()
}

fun main() {
    val input = "  KoTLin  "
    println(input.normalizedLabel())  // kotlin
}
```

### 확장 함수 선택

확장 함수는 클래스에 실제 멤버를 추가하는 것이 아니라, 기존 타입의 값을 대상으로 호출할 수 있도록 정의한 함수다.
확장 함수의 선택에는 두 가지 규칙이 있다.

- 정적 타입 기준: 실제 객체의 타입이 아니라, 변수가 선언된 타입을 기준으로 확장 함수를 선택
- 멤버 함수 우선: 클래스 내부에 선언된 함수와 확장 함수가 같은 방식으로 호출될 수 있다면 멤버 함수를 선택

```kotlin
open class Label
class SpecialLabel : Label()

fun Label.kind(): String = "Label extension"
fun SpecialLabel.kind(): String = "SpecialLabel extension"

fun describe(label: Label): String = label.kind()

class Message {
    fun title(): String = "member"
}

fun Message.title(): String = "extension"

fun main() {
    val special = SpecialLabel()
    val label: Label = special

    println(special.kind())     // SpecialLabel extension
    println(label.kind())       // Label extension
    println(describe(special))  // Label extension
    println(Message().title())  // member
}
```
