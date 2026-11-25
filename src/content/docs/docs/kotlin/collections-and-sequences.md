---
title: Collections and Sequences
date: 2026-11-26
lastUpdated: 2026-11-26
tags: [ Kotlin ]
description: "Kotlin 컬렉션의 읽기 전용·가변 구분과 검색·그룹화 연산이 Java와 다른 점을 설명하고, 컬렉션과 Sequence의 실행 순서와 비용을 비교한다."
---

Kotlin 컬렉션은 목록을 바꿀 수 있는지를 타입으로 구분하고, `map`·`filter` 같은 변환 연산은 원본을 그대로 두고 새 컬렉션을 반환한다.

## 컬렉션의 종류와 변경 가능성

Kotlin 표준 라이브러리의 기본 컬렉션은 List, Set, Map이다. 종류마다 읽기 전용 인터페이스와 가변 인터페이스가 따로 있다.

| 종류 | 담는 값                     | 읽기 전용 |     가변      | 만드는 함수               |
|:----:|:----------------------------|:---------:|:-------------:|:--------------------------|
| List | 순서가 있는 요소. 중복 허용 |  `List`   | `MutableList` | `listOf`, `mutableListOf` |
| Set  | 중복 없는 요소              |   `Set`   | `MutableSet`  | `setOf`, `mutableSetOf`   |
| Map  | 키와 값의 쌍. 키 중복 없음  |   `Map`   | `MutableMap`  | `mapOf`, `mutableMapOf`   |

`List` 같은 읽기 전용 인터페이스로는 요소를 읽기만 할 수 있고, `MutableList` 같은 가변 인터페이스로는 요소를 추가·삭제·변경할 수도 있다.

### `val`과 컬렉션 내부 변경

`val`은 변수가 다른 객체를 가리키지 못하게 막을 뿐이고, 변수가 가리키는 리스트 안의 요소까지 막지는 않는다.
다른 리스트를 대입할 수 있는지는 `val`·`var`가, 그 변수로 요소를 바꿀 수 있는지는 변수의 타입이 정한다.

```kotlin
fun main() {
    val names = mutableListOf("Alice", "Bob")
    names.add("Carol")
    println(names)  // [Alice, Bob, Carol]

    // names = mutableListOf()  // 컴파일 오류: 'val' cannot be reassigned.
}
```

|               선언               | 다른 리스트 대입 | 이 변수로 요소 추가·삭제 |
|:--------------------------------:|:----------------:|:------------------------:|
| `val names: MutableList<String>` |       불가       |           가능           |
|    `var names: List<String>`     |       가능       |           불가           |
|    `val names: List<String>`     |       불가       |           불가           |

## 변환과 필터링

```kotlin
data class User(val id: Long, val name: String, val email: String?)

val users = listOf(
    User(1, "Alice", "alice@example.com"),
    User(2, "Bob", null),
    User(3, "Carol", "carol@corp.example"),
    User(4, "Dave", "dave@example.com"),
)
```

`map`·`filter`는 Java Stream의 같은 이름 연산처럼 요소를 바꾸거나 거르고, 결과를 바로 `List`로 반환한다. `mapNotNull`은 바꾼 값 중 `null`을 버린다.

```kotlin
fun main() {
    val withEmail = users.filter { it.email != null }
    val emailsOfFiltered: List<String?> = withEmail.map { it.email }
    val emails: List<String> = users.mapNotNull { it.email }

    println(emailsOfFiltered)  // [alice@example.com, carol@corp.example, dave@example.com]
    println(emails)            // [alice@example.com, carol@corp.example, dave@example.com]
}
```

- `filter`로 이메일 없는 사용자를 걸러도 `email`의 선언 타입은 `String?` 그대로이므로, `withEmail.map { it.email }`의 결과는 `List<String?>`
- `mapNotNull`은 `null`을 버린 값만 담으므로 `users.mapNotNull { it.email }`의 결과는 `List<String>`

## 검색 결과와 null

Java Stream은 찾은 요소를 `Optional`로 감싸 돌려주지만, Kotlin의 검색 함수는 찾은 요소를 그대로 반환하고 없을 때는 `null`이나 예외로 알린다.

|                연산                | Java Stream 대응                        |      요소가 없을 때      |
|:----------------------------------:|:----------------------------------------|:------------------------:|
| `firstOrNull { it.email == null }` | `filter(...).findFirst()`               |          `null`          |
|    `first { it.email == null }`    | `filter(...).findFirst().orElseThrow()` | `NoSuchElementException` |

- `find`는 `firstOrNull`과 같은 함수
- 찾는 요소가 없을 수 있으면 `firstOrNull`로 받은 뒤 `?:`로 기본값이나 예외 지정. [기본값과 실패 처리](/docs/kotlin/null-safety/#기본값과-실패-처리)
- `first`는 요소가 반드시 있어야 하는 곳에 사용
- `any`·`all`·`none`·`count`는 Java의 `anyMatch`·`allMatch`·`noneMatch`·`count`와 결과가 같고, 빈 목록의 `all`이 `true`인 것도 동일

## 키 구성과 그룹화

`associateBy`와 `groupBy`는 목록을 키로 찾을 수 있는 Map으로 바꾼다.
Java의 `Collectors.toMap`·`Collectors.groupingBy`에 대응하지만, 키가 겹칠 때와 Map의 순서가 다르다.

- `associateBy`: 키 하나에 요소 하나. 반환 타입은 `Map<K, T>`
- `groupBy`: 키 하나에 같은 키를 가진 요소의 리스트. 반환 타입은 `Map<K, List<T>>`

다음 예제는 같은 ID의 사용자가 두 번 들어온 입력으로 두 함수를 비교한다. `users + User(...)`는 `users` 뒤에 요소 하나를 붙인 새 리스트를 만든다.

```kotlin
fun main() {
    val withDuplicate = users + User(1, "Alice", "alice@corp.example")

    val byId: Map<Long, User> = withDuplicate.associateBy { it.id }
    println(byId.size)  // 4
    println(byId[1])    // User(id=1, name=Alice, email=alice@corp.example)

    val groupedById: Map<Long, List<User>> = withDuplicate.groupBy { it.id }
    println(groupedById[1]?.size)  // 2
}
```

같은 입력을 Java Collectors에 넣으면 결과가 다음과 같이 달라진다.

|       구분       | Kotlin `associateBy`·`groupBy`     | Java `toMap`·`groupingBy`                          |
|:----------------:|:-----------------------------------|:---------------------------------------------------|
|   키가 겹칠 때   | `associateBy`는 나중 요소로 덮어씀 | `toMap`은 `IllegalStateException: Duplicate key 1` |
|    Map의 순서    | 원래 목록의 순서                   | 보장하지 않음. 실제 구현은 `HashMap`               |
| 키가 `null`일 때 | `null`도 하나의 키로 취급          | `groupingBy`는 `NullPointerException`              |

## Sequence와 지연 실행

`filter`·`map`을 호출하는 곳과 실행 시점은 다음과 같이 다르다.

- Java 컬렉션은 `filter`·`map`이 없어 Stream으로 바꿔 호출하고, 종료 연산을 호출할 때 실행
- Kotlin 컬렉션은 `filter`·`map`을 바로 호출하고, 호출하는 즉시 실행
- Kotlin Sequence는 `asSequence()`로 만들며, Stream처럼 종료 연산을 호출할 때 실행
    - 중간 연산은 `filter`, `map`, `take`처럼 Sequence를 반환
    - 종료 연산은 `toList`, `first`, `count`처럼 Sequence가 아닌 결과를 반환

```kotlin
fun main() {
    val listResult = users
        .filter { println("filter ${it.id}"); it.email != null }
        .map { println("map ${it.id}"); it.name }
        .take(2)
    println(listResult)

    println("---")

    val sequence = users.asSequence()
        .filter { println("filter ${it.id}"); it.email != null }
        .map { println("map ${it.id}"); it.name }
        .take(2)
    println("toList 호출 전")
    println(sequence.toList())
}

/*
filter 1
filter 2
filter 3
filter 4
map 1
map 3
map 4
[Alice, Carol]
---
toList 호출 전
filter 1
map 1
filter 2
filter 3
map 3
[Alice, Carol]
 */
```

- 리스트: `filter`가 4명을 모두 검사해 3명짜리 리스트를 만들고, `map`이 3명을 모두 바꾼 뒤 `take`가 앞의 2개를 선택
- Sequence: `toList`를 호출한 뒤에야 처리 시작. 요소마다 `filter`와 `map`을 거치고, `take(2)`가 2개를 받으면 멈추므로 Dave는 `filter`도 미실행

Sequence와 Stream은 처리 방식이 같지만, 종료 연산을 다시 호출할 때 다르다.

|         구분          |       컬렉션 연산       |       Sequence        |       Java Stream       |
|:---------------------:|:-----------------------:|:---------------------:|:-----------------------:|
|       실행 시점       |    연산을 호출할 때     | 종료 연산을 호출할 때 |  종료 연산을 호출할 때  |
|       처리 순서       |   단계마다 전체 요소    |  요소마다 모든 단계   |   요소마다 모든 단계    |
| 종료 연산을 다시 호출 | 만든 리스트를 다시 읽음 |  처음부터 다시 실행   | `IllegalStateException` |

- 위 예제의 `sequence`에 `count()`를 한 번 더 호출하면 `filter 1`부터 `map 3`까지 같은 로그가 다시 출력되고 `2` 반환
- `iterator().asSequence()`처럼 반복자에서 만든 Sequence는 Stream처럼 한 번만 순회 가능

[Collections overview](https://kotlinlang.org/docs/collections-overview.html), [Collection transformation operations](https://kotlinlang.org/docs/collection-transformations.html), [Sequences](https://kotlinlang.org/docs/sequences.html)
