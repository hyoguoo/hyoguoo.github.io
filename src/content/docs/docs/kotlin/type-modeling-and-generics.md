---
title: Type Modeling and Generics
date: 2026-11-26
lastUpdated: 2026-11-26
tags: [ Kotlin ]
description: "Kotlin data class가 만드는 멤버와 copy의 얕은 복사, enum과 sealed의 차이를 설명하고, 제네릭의 out·in 표기를 Java 와일드카드와 비교한다."
---

Kotlin은 값을 담아 전달하는 클래스를 `data class`로, 상태나 조회 결과처럼 종류가 몇 가지로 정해진 타입을 `enum`이나 `sealed`로 선언한다.
`List<String>`을 `List<Any>`에 대입할 수 있는지는 제네릭 선언에 붙인 `out`·`in`이 정한다.

## data class

클래스 앞에 `data`를 붙이면 컴파일러가 주 생성자의 프로퍼티로 `equals`·`hashCode`·`toString`·`copy`·`componentN`을 만든다.

```kotlin
data class UserResponse(val id: Long, val email: String)

fun main() {
    val a = UserResponse(1, "alice@example.com")
    val b = UserResponse(1, "alice@example.com")

    println(a == b)                                // true: equals로 값 비교
    println(a === b)                               // false: 서로 다른 객체
    println(a)                                     // UserResponse(id=1, email=alice@example.com)
    println(a.copy(email = "alice@corp.example"))  // UserResponse(id=1, email=alice@corp.example)

    val (id, email) = a                            // 구조 분해: component1(), component2()
    println("$id $email")                          // 1 alice@example.com
}
```

- 클래스가 `final`로 컴파일되므로 `open data class`로 선언하면 컴파일 오류
- 구조 분해는 변수 이름이 아니라 주 생성자의 선언 순서로 값을 꺼냄
    - `(val email: String, val name: String)`을 `(val name: String, val email: String)`으로 바꾸면, `email`에 이름이 들어감
    - 두 프로퍼티가 모두 `String`이라 컴파일 오류 없음

### 동등성에 들어가는 프로퍼티

data class가 만드는 `equals`·`hashCode`·`toString`·`copy`는 클래스 이름 뒤 괄호(주 생성자)에 선언한 프로퍼티만 사용한다.

```kotlin
data class UserResponse(val id: Long, val email: String) {
    var viewedAt: Long = 0
}

fun main() {
    val a = UserResponse(1, "alice@example.com").apply { viewedAt = 100 }
    val b = UserResponse(1, "alice@example.com").apply { viewedAt = 200 }

    println(a == b)  // true: viewedAt은 비교하지 않음
    println(a)       // UserResponse(id=1, email=alice@example.com)
}
```

이 비교 방식이 맞는 타입과 맞지 않는 타입은 다음과 같다.

- 조회 DTO는 담긴 값이 같으면 같은 응답으로 봐도 되므로 data class의 `equals`와 맞음
- JPA Entity는 ID가 같으면 같은 객체로 봐야 하므로, 주 생성자의 프로퍼티를 모두 비교하는 data class의 `equals`와 맞지 않음

## copy와 얕은 복사

`copy`는 인자로 넘긴 프로퍼티만 바꾸고 나머지는 원본 값을 그대로 쓴 새 객체를 만든다. 이때 목록 같은 객체는 복제하지 않고 참조만 넘기므로, 원본과 복사본이 같은 `MutableList`를 가리킨다.

```kotlin
data class UserResponse(val id: Long, val roles: MutableList<String>)

fun main() {
    val original = UserResponse(1, mutableListOf("USER"))
    val copied = original.copy(id = 2)

    copied.roles.add("ADMIN")

    println(original.roles)                    // [USER, ADMIN]
    println(original.roles === copied.roles)   // true: 같은 목록
}
```

복사본의 목록을 바꿔도 원본에 영향이 없게 하려면 목록을 읽기 전용으로 선언하는 것이 좋다.

## enum과 sealed

사용자 상태나 조회 결과처럼 종류가 몇 가지로 정해진 타입은 `enum`이나 `sealed`로 선언한다.

|         구분         | enum                                   | sealed                               |
|:--------------------:|:---------------------------------------|:-------------------------------------|
|    미리 정하는 것    | 값(상수) 목록                          | 하위 타입 목록                       |
| 종류마다 다른 데이터 | 불가. 모든 상수가 같은 프로퍼티를 가짐 | 가능. 하위 타입마다 다른 프로퍼티    |
|     `when` 분기      | 상수로 분기                            | `is`로 타입을 검사하고 스마트 캐스트 |

다음 예제에서 사용자 상태 `UserStatus`는 enum으로, 조회 결과 `UserLookup`은 sealed interface로 선언한다.

```kotlin
enum class UserStatus { ACTIVE, SUSPENDED }

sealed interface UserLookup {
    data class Found(val user: UserResponse) : UserLookup
    data object NotFound : UserLookup
}

fun label(status: UserStatus): String = when (status) {
    UserStatus.ACTIVE -> "사용 중"
    UserStatus.SUSPENDED -> "정지"
}

fun message(result: UserLookup): String = when (result) {
    is UserLookup.Found -> "found: ${result.user.email}"  // result를 Found로 스마트 캐스트
    UserLookup.NotFound -> "not found"
}
```

## 제네릭 선언 읽기

제네릭을 선언하고 쓰는 방법은 Java와 같다. 다른 점은 `Found`가 `UserLookup`의 하위 타입일 때 `List<Found>`를 `List<UserLookup>`에 대입할 수 있는지 정하는 방법이다.

- Java: 타입을 쓰는 곳마다 와일드카드로 정함 (`List<? extends UserLookup>`)
- Kotlin: 주로 타입을 선언할 때 `out`·`in`으로 정함 (`interface List<out E>`)

이 대입을 허용할지는 타입이 값을 꺼내기만 하는지, 넣기도 하는지에 따라 정해진다. 대입해도 안전한 타입이라도 선언에 `out`·`in`이 없으면 컴파일러는 대입을 막는다.

### 꺼내고 넣는 타입: MutableList

`MutableList`는 값을 꺼낼 수도, 넣을 수도 있다.

- `MutableList<Found>`를 `MutableList<UserLookup>`에 대입 불가
- 대입을 허용하면 `UserLookup` 목록에 하듯 `NotFound`를 추가할 수 있어, `Found`만 있어야 할 목록에 `NotFound`가 섞임

```kotlin
val found = UserLookup.Found(UserResponse(1, "alice@example.com"))

val foundList: MutableList<UserLookup.Found> = mutableListOf(found)
// val lookupList: MutableList<UserLookup> = foundList  // 컴파일 오류
// lookupList.add(UserLookup.NotFound)                   // 대입이 되면 Found 목록에 NotFound가 들어감
```

### 꺼내기만 하는 타입: out

`out`을 붙인 `T`는 반환 타입에만 쓸 수 있다. 다음 `Source`는 값을 꺼내기만 하는 예시 인터페이스다.

```kotlin
interface Source<out T> {
    fun get(): T          // 가능: T를 돌려줌
    // fun put(value: T)  // 컴파일 오류: T를 받음
}
```

- 선언 안에 `T`를 받는 함수나 `T` 타입의 `var`가 있으면 컴파일 오류
- `List<Found>`를 `List<UserLookup>`에 대입해도 `NotFound`가 들어갈 길이 없으므로 대입 허용
- 표준 라이브러리의 `List`도 `List<out E>`로 선언됨

```kotlin
val found = UserLookup.Found(UserResponse(1, "alice@example.com"))

val foundList: List<UserLookup.Found> = listOf(found)
val lookupList: List<UserLookup> = foundList  // 가능
```

### 넣기만 하는 타입: in

`in`을 붙인 `T`는 매개변수 타입에만 쓸 수 있다. 다음 `Handler`는 조회 결과를 받아 처리하기만 하는 예시 인터페이스다.

```kotlin
interface Handler<in T> {
    fun handle(value: T)  // 가능: T를 받음
    // fun last(): T      // 컴파일 오류: T를 돌려줌
}
```

- 선언 안에 `T`를 돌려주는 함수가 있으면 컴파일 오류
- `LookupPrinter`는 `Found`와 `NotFound`를 모두 처리할 수 있음
- 이 객체를 `Handler<Found>` 변수에 담으면, 그 변수로는 `Found`만 넘길 수 있음
- 처리할 수 있는 범위보다 좁게 넘기므로 안전해 대입 허용

```kotlin
class LookupPrinter : Handler<UserLookup> {
    override fun handle(value: UserLookup) = println(message(value))  // 앞 절의 message()
}

val found = UserLookup.Found(UserResponse(1, "alice@example.com"))
val printer = LookupPrinter()
printer.handle(found)                                  // found: alice@example.com
printer.handle(UserLookup.NotFound)                    // not found

val foundHandler: Handler<UserLookup.Found> = printer  // 가능
foundHandler.handle(found)                             // found: alice@example.com
// foundHandler.handle(UserLookup.NotFound)            // 컴파일 오류: 이 변수로는 Found만 넘김
```

### 표기 정리

| Kotlin  | Kotlin에서 `T`를 쓰는 위치 | 대입 방향                                    | 같은 대입의 Java 표기         |
|:-------:|:---------------------------|:---------------------------------------------|:------------------------------|
| `out T` | 반환 타입에만              | `List<Found>` → `List<UserLookup>`           | `List<? extends UserLookup>`  |
| `in T`  | 매개변수 타입에만          | `Handler<UserLookup>` → `Handler<Found>`     | `Handler<? super Found>`      |
|  없음   | 반환·매개변수 모두         | 대입 불가 (`MutableList`)                    | 와일드카드 없는 `List<Found>` |
|   `*`   | 타입 인자를 모름           | 모든 `List<X>` → `List<*>`. 꺼낸 값은 `Any?` | `List<?>`                     |

[Data classes](https://kotlinlang.org/docs/data-classes.html), [Sealed classes and interfaces](https://kotlinlang.org/docs/sealed-classes.html), [Generics: in, out, where](https://kotlinlang.org/docs/generics.html)
