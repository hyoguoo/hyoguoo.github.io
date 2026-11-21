---
title: Inheritance and Objects
date: 2026-11-22
lastUpdated: 2026-11-22
tags: [ Kotlin ]
description: "Kotlin의 open·override 상속 규칙과 추상 클래스·인터페이스를 설명하고, object·companion object의 초기화 시점과 Java에서의 호출 방식을 비교한다."
---

Kotlin은 상속과 재정의를 허용할 지점을 선언에 표시하고, 인스턴스가 하나뿐인 객체는 `object`로 선언한다.

## 상속과 재정의

Kotlin의 클래스와 멤버는 기본적으로 `final`이다. 상속을 허용할 클래스와 재정의를 허용할 멤버에는 `open`을 붙이고, 재정의하는 쪽에는 `override`를 반드시 붙인다.

```kotlin
open class Notification(val to: String) {
    open fun title(): String = "알림"
    fun summary(): String = "${title()} -> $to"
}

class PaymentNotification(to: String, val amount: Long) : Notification(to) {
    override fun title(): String = "결제 알림 ${amount}원"
}

fun main() {
    val notification: Notification = PaymentNotification("alice@example.com", 5000L)
    println(notification.summary())  // 결제 알림 5000원 -> alice@example.com
}
```

- 하위 클래스 헤더의 `: Notification(to)`에서 상위 클래스의 주 생성자 호출
- `summary()`는 `open`이 아니므로 하위 클래스에서 재정의하면 컴파일 오류
- `override`한 멤버는 다시 `open` 상태이며, 더 아래 클래스의 재정의를 막으려면 `final override`로 선언

|    구분     | Java                  | Kotlin               |
|:-----------:|:----------------------|:---------------------|
| 클래스 상속 | `final`이 없으면 허용 | `open`이 있어야 허용 |
| 멤버 재정의 | `final`이 없으면 허용 | `open`이 있어야 허용 |
| 재정의 표시 | `@Override` 생략 가능 | `override` 필수      |

[Inheritance](https://kotlinlang.org/docs/inheritance.html)

## 추상 클래스와 인터페이스

`abstract`로 선언한 클래스와 멤버는 구현 없이 선언만 둘 수 있으며, 따로 `open`을 붙이지 않아도 하위 클래스에서 구현한다.
인터페이스도 구현할 멤버를 선언하고 기본 구현을 가질 수 있지만, 생성자와 값을 저장하는 프로퍼티는 가질 수 없다.

아래 예제에서는 인터페이스가 정한 멤버 가운데 일부를 추상 클래스가 구현하고, 남은 추상 멤버를 하위 클래스가 구현한다.

```kotlin
interface EmailSender {
    val sender: String
    fun send(to: String): String
    fun describe(): String = "sender=$sender"
}

abstract class TemplateEmailSender(override val sender: String) : EmailSender {
    abstract fun format(to: String): String
    override fun send(to: String): String = "[$sender] ${format(to)}"
}

class SmtpEmailSender(sender: String) : TemplateEmailSender(sender) {
    override fun format(to: String): String = "SMTP -> $to"
}

fun main() {
    val emailSender: EmailSender = SmtpEmailSender("no-reply@example.com")
    println(emailSender.send("alice@example.com"))  // [no-reply@example.com] SMTP -> alice@example.com
    println(emailSender.describe())                 // sender=no-reply@example.com
}
```

- 인터페이스의 `sender`는 값을 저장하지 않는 추상 프로퍼티이며, 추상 클래스가 주 생성자의 `override val`로 값을 받아 저장
- 추상 클래스는 `send()`에서 공통 부분 `[$sender]`를 붙이고 그 뒤에 올 내용은 추상 함수 `format()`으로 남기며, `SmtpEmailSender`는 `open` 없이 `format()`을 재정의
- 본문이 있는 `describe()`는 어느 클래스에서도 구현하지 않아 기본 구현을 사용
- 클래스 헤더의 `:` 뒤에 상위 클래스는 생성자 호출 `TemplateEmailSender(sender)`로, 인터페이스는 이름 `EmailSender`만 적음

|                 구분                 | 추상 클래스  | 인터페이스                          |
|:------------------------------------:|:-------------|:------------------------------------|
|                생성자                | 가질 수 있음 | 없음                                |
|        값을 저장하는 프로퍼티        | 가질 수 있음 | 없음. 추상 프로퍼티나 getter만 가능 |
| 한 클래스가 상속·구현할 수 있는 개수 | 하나         | 여러 개                             |

[Interfaces](https://kotlinlang.org/docs/interfaces.html)

## 객체 선언

`object`로 선언하면 클래스 선언과 인스턴스 생성이 함께 이뤄지고, 프로그램 안에 인스턴스가 하나만 존재한다. 생성자를 호출하지 않고 이름으로 멤버에 접근하며, 처음 접근할 때 초기화된다.

```kotlin
object EmailPolicy {
    val maxLength = 254

    init {
        println("EmailPolicy 초기화")
    }

    fun isValid(email: String): Boolean = email.contains("@") && email.length <= maxLength
}

fun main() {
    println("main 시작")
    println(EmailPolicy.isValid("alice@example.com"))
    println(EmailPolicy.isValid("alice"))
}

/*
main 시작
EmailPolicy 초기화
true
false
 */
```

`EmailPolicy` 초기화는 `main`이 시작된 뒤, 처음 `isValid`를 호출할 때 한 번만 일어난다.

## Companion Object

companion object는 클래스 안에 선언한 객체 선언이다. 인스턴스를 만들지 않고 클래스 이름으로 멤버를 호출할 수 있어, Java의 `static` 메서드가 하던 factory 역할에 쓴다.

```kotlin
class Account private constructor(val id: Long, val email: String) {
    companion object {
        fun create(id: Long, rawEmail: String): Account {
            val email = rawEmail.trim().lowercase()
            if (!email.contains("@")) {
                throw IllegalArgumentException("invalid email: $rawEmail")
            }
            return Account(id, email)
        }
    }
}

fun main() {
    val account = Account.create(1L, " Alice@Example.com ")
    println(account.email)  // alice@example.com
}
```

- 주 생성자를 `private`으로 선언해 클래스 밖에서는 `Account(...)`로 직접 생성할 수 없음
- companion object는 클래스 안에 있으므로 `private` 생성자를 호출할 수 있음
- 정규화와 검증을 통과한 값으로만 객체를 생성
