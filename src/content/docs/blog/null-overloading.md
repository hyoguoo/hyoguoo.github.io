---
title: "`null`은 오버 로딩된 메서드 중 어떤 메서드를 호출할까?"
date: 2023-09-22
lastUpdated: 2024-03-10
tags: [Java]
description: "null을 인자로 넘길 때 Java 오버로딩 해석 규칙에 따라 어떤 메서드가 호출되는지 분석한다."
---

> 실행 환경: Java 17

우선 해당 주제를 본격적으로 다루기 전에 아래의 코드를 보자.
아래 코드는 `null`을 참조하는 변수를 사용했을 때와, 리터럴 `null`을 사용했을 때 `String.valueOf()` 메서드의 동작을 보여준다.

```java
class NullTest {

    public static void main(String[] args) {
        String s = null;
        String nullValue = String.valueOf(s);
        System.out.println(nullValue); // null, 정상 출력 ---- 1

        nullValue = String.valueOf(null); // NullPointerException ---- 2
        System.out.println(nullValue);
    }
}
```

1번 코드는 정상적으로 `null`을 출력하지만, 2번 코드는 `NullPointerException`이 발생하는 것을 확인할 수 있다.
디버깅 모드를 통해 호출 된 메서드를 추적했을 때, 두 라인은 서로 다른 메서드를 호출하고 있음을 알 수 있었다.

### 1. String.valueOf(s)

```java
// java.lang.String
public final class String {

    public static String valueOf(Object obj) {
        return (obj == null) ? "null" : obj.toString();
    }
}
```

`String.valueOf(s)`는 `String.valueOf(Object obj)`를 호출하는데, 이 메서드는 `null` 체크를 하는 것을 확인할 수 있다.
때문에 넘겨 받은 `obj` 값이 `null`이기 때문에 자연스럽게 `"null"`을 반환하게 된다.

### 2. String.valueOf(null)

하지만 직접 `null`을 넘겨 받은 경우에는 `String.valueOf(char data[])`를 호출하게 된다.

```java
// java.lang.String
public final class String {

    public String(char value[]) {
        this(value, 0, value.length, null); // 3. value.length에서 NullPointerException 발생
        // Exception in thread "main" java.lang.NullPointerException: Cannot read the array length because "value" is null
    }

    // 1. 메서드 호출 받음
    public static String valueOf(char data[]) {
        return new String(data); // 2. 위의 String(char value[])를 호출
    }
}
```

주석의 순번대로 코드가 실행되는데, 결국 3번에서 `null`인 값에서 length를 읽으려고 하기 때문에 `NullPointerException`이 발생하게 된다.
그렇다면 왜 `null`이 `char data[]` 타입이 아닌데 해당 메서드가 호출되는 것일까?

## 호출 메서드는 어떻게 결정되는가?

위 상황과 비슷하게 `char data[]` 타입과 `Object o` 타입을 파라미터로 갖는 메서드를 호출했을 때 어떤 메서드가 호출되는지 확인해보자.

```java
class MethodCallTest {

    public static void main(String[] args) {
        testMethod(null); // char[] Param Method Called
    }

    public static void testMethod(char data[]) {
        System.out.println("char[] Param Method Called");
    }

    public static void testMethod(Object o) {
        System.out.println("Object Param Method Called");
    }
}
```

처음의 예제 코드와 같이 `char[] Param Method Called`가 출력된다.
그럼 `null`은 `char[]`과 특수한 관계가 있는 것일까? 그것도 아니다.

```java
class MethodCallTest {

    public static void main(String[] args) {
        testMethod(null); // Object Param Method Called
    }

//    public static void testMethod(char data[]) {
//        System.out.println("char[] Param Method Called");
//    }

    public static void testMethod(Object o) {
        System.out.println("Object Param Method Called");
    }
}
```

`char data[]` 타입의 메서드를 주석 처리하고 실행해보면 `Object Param Method Called`가 출력된다.
즉, `null`은 `char[]`과 특수한 관계가 있는 것이 아니라, `Object` 보다는 `char[]` 타입이 더 높은 우선순위를 가진다고 추측해 볼 수 있다.
다른 타입들도 더 살펴보자.

```java
class MethodCallTest {

    public static void main(String[] args) {
        testMethod(null); // no suitable method found for testMethod(<nulltype>)
    }

    public static void testMethod(int i) {
        System.out.println("int Param Method Called");
    }

    public static void testMethod(long i) {
        System.out.println("Integer Param Method Called");
    }

    // ...
    // char, byte, short, int, long, float, double, boolean
}
```

당연하게도 원시 타입은 `null`을 가질 수 없기 때문에 일치하는 메서드가 없다는 에러가 발생한다.
그럼 null이 호출할 수 있는 메서드는 참조(주소) 타입 인자의 메서드만 호출할 수 있는 것으로 추측할 수 있다.

```java
class Test {

    int x;
    int y;
}

class MethodCallTest {

    public static void main(String[] args) {
        testMethod(null); // reference to testMethod is ambiguous
    }

    public static void testMethod(Object o) {
        System.out.println("Object Param Method Called");
    }

    public static void testMethod(char data[]) {
        System.out.println("char[] Param Method Called");
    }

    public static void testMethod(Test t) {
        System.out.println("Test Param Method Called");
    }

    public static void testMethod(String s) {
        System.out.println("String Param Method Called");
    }

    public static void testMethod(int... i) {
        System.out.println("int... Param Method Called");
    }

    public static void testMethod(Integer i) {
        System.out.println("Integer Param Method Called");
    }
}
```

위의 메서드들은 단일로 존재했을 때 전부 호출 될 수 있는 메서드들인데, 동시에 존재하는 경우 호출할 수 있는 메서드가 많아 모호하다는 에러 메시지가 발생한다.

```
reference to testMethod is ambiguous
  both method testMethod(int...) in MethodCallTest and method testMethod(java.lang.Integer) in MethodCallTest match
```

그 중 `int ...i` 타입과 `Integer i` 두 개의 메서드에 대해 언급하면서 에러 메시지가 발생했는데, 두 타입이 더 `null`과 관련이 있는 것일까?
아니다, 그 이유는 다시 아래의 코드와 에러 메시지를 보면 알 수 있다.

```java
class Test {

    int x;
    int y;
}

class MethodCallTest {

    public static void main(String[] args) {
        testMethod(null); // reference to testMethod is ambiguous
    }

    public static void testMethod(Object o) {
        System.out.println("Object Param Method Called");
    }

    public static void testMethod(int... i) {
        System.out.println("int... Param Method Called");
    }

    public static void testMethod(Integer i) {
        System.out.println("Integer Param Method Called");
    }

    public static void testMethod(char data[]) {
        System.out.println("char[] Param Method Called");
    }

    public static void testMethod(Test t) {
        System.out.println("Test Param Method Called");
    }

    public static void testMethod(String s) {
        System.out.println("String Param Method Called");
    }
}
```

```
reference to testMethod is ambiguous
  both method testMethod(Test) in MethodCallTest and method testMethod(java.lang.String) in MethodCallTest match
```

에러 메시지를 다시 살펴 보면 `Test` 타입과 `String` 타입이 언급되는 것을 볼 수 있다.
결국 특정 타입이 아닌, 완전히 일치하는 타입이 없어 `null`을 호출 할 수 있는 메서드를 탐색하게되고,
마지막 두 타입에 대해 모호하다는 에러 메시지가 발생한 것으로 추측해 볼 수 있다.

## 결론

1. `null`은 원시 타입을 제외한 모든 타입의 인자로 호출 당할 수 있다.
2. `null`은 `Object` 타입으로도 호출 당할 수 있다.
3. `Object`가 아닌 참조 타입 메서드가 존재하면 더 높은 우선순위를 가진다.
4. 만약 `Object` 타입을 제외한 참조 타입 메서드가 두 개 이상 존재하면 `refrence to method is ambiguous` 에러가 발생하게 된다.
5. 에러 메시지는 `null`을 호출 할 수 있는 메서드를 탐색하다가 마지막 두 가지 타입에 대해 모호하다는 에러 메시지가 발생한 것으로 추측해 볼 수 있다.

다소 애매한 결과라고 볼 수 있지만, 사실 `null` 타입을 그대로 넣는 일은 거의 없기 때문에 이러한 상황은 잘 발생하지 않을 것이라고 생각한다.
다시 한 번 `null`을 사용할 때는 주의 해야 한다는 것을 체감할 수 있었고, `null` 자체를 파라미터로 넘기는 것을 지양하는 것이 좋을 것 같다.
