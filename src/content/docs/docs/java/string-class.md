---
title: "String class"
date: 2024-03-07
lastUpdated: 2025-11-08
---

문자열을 다루기 위해 사용되는 핵심 클래스로, 다음과 같은 주요 특징을 가진다.

- 문자열은 `char` 배열로 구성되어 있으며, `String` 클래스는 `char` 배열을 내부적으로 가지고 있음
- 문자열 리터럴은 `String Constant Pool` 영역에서 효율적으로 관리
- 문자열을 변경하는 메서드는, 원본 객체를 변경하는 것이 아니라 변경된 내용의 새로운 `String` 인스턴스를 생성하여 반환

내부적으로 `private final char[] value`를 사용하여 문자를 저장으나, 자바 9부터는 `private final byte[] value`와 `coder` 필드를 사용하여 메모리 효율성을 높였다.

```java
public final class String implements java.io.Serializable, Comparable<String>, CharSequence {

    @Stable
    private final byte[] value;
    private final byte coder;
    // ...
}
```

## 주요 메서드

|                   메서드                    |                  설명                   |
|:----------------------------------------:|:-------------------------------------:|
|           `charAt(int index)`            |        문자열에서 index 위치의 문자를 반환         |
|              `int length()`              |              문자열의 길이를 반환              |
|   `String substring(int from, int to)`   |        문자열에서 해당 범위에 있는 문자열 반환         |
|       `String substring(int from)`       |       문자열에서 해당 위치부터 끝까지 문자열 반환        |
|       `String concat(String str)`        |          문자열을 더해서 새로운 문자열 반환          |
| `String replace(String old, String new)` | 문자열에서 old 문자열을 new 문자열로 바꾼 새로운 문자열 반환 |
|          `String toLowerCase()`          |        문자열을 소문자로 바꾼 새로운 문자열 반환        |
|          `String toUpperCase()`          |        문자열을 대문자로 바꾼 새로운 문자열 반환        |
|             `String trim()`              |      문자열의 앞뒤 공백을 제거한 새로운 문자열 반환       |
|      `String[] split(String regex)`      |     문자열을 regex를 기준으로 나눈 문자열 배열 반환     |
|       `boolean equals(Object obj)`       |              문자열이 같은지 비교              |
|       `int compareTo(String str)`        |             문자열을 사전순으로 비교             |
|        `int indexOf(String str)`         |       문자열에서 str이 처음 나타나는 위치를 반환       |
|   `boolean startsWith(String prefix)`    |         문자열이 prefix로 시작하는지 확인         |
|    `boolean endsWith(String suffix)`     |         문자열이 suffix로 끝나는지 확인          |
|      `boolean contains(String str)`      |          문자열이 str을 포함하는지 확인           |
|           `boolean isEmpty()`            |             문자열이 비어있는지 확인             |
|          `char[] toCharArray()`          |            문자열을 문자 배열로 변환             |

## 문자열 비교

문자열을 비교하는 방법은 `==` 연산자를 이용한 주소값 비교와 `equals()` 메서드를 이용한 내용 비교 두 가지가 있다.

```java
class Example {

    public static void main(String[] args) {
        String str1 = "ogu"; // 리터럴로 생성
        String str2 = "ogu"; // 리터럴로 생성
        String str3 = new String("ogu"); // 인스턴스 생성
        String str4 = new String("ogu"); // 인스턴스 생성

        // == (동일성 비교): 같은 인스턴스(주소)인지 비교
        System.out.println(str1 == str2); // true (str1과 str2는 Pool의 동일 인스턴스 참조)
        System.out.println(str3 == str4); // false (str3과 str4는 Heap의 서로 다른 인스턴스)

        // equals() (동등성 비교): 내용이 같은지 비교
        System.out.println(str1.equals(str2)); // true
        System.out.println(str1.equals(str3)); // true (내용 "ogu"는 동일)
    }
}
```

### String 클래스의 equals

`String` 클래스는 `Object` 클래스의 `equals()` 메서드를 재정의(override)하여, 두 문자열의 내용을 비교하도록 구현되어 있다.

```java
// 실제 String 클래스의 equals() 메서드
public boolean equals(Object anObject) {
    if (this == anObject) {
        return true;
    }
    if (anObject instanceof String) {
        String aString = (String) anObject;
        if (coder() == aString.coder()) {
            return isLatin1() ? StringLatin1.equals(value, aString.value)
                    : StringUTF16.equals(value, aString.value);
        }
    }
    return false;
}
```

### Constant Pool

JVM은 'String Constant Pool'(문자열 상수 풀)이라는 메모리 영역을 가진다.

- 문자열 리터럴 생성 (`String s1 = "ogu";`):
    1. String Pool에 "ogu"라는 문자열이 있는지 탐색
    2. 존재하면, 기존에 있던 인스턴스의 참조를 반환
    3. 존재하지 않으면, 풀(Pool)에 "ogu" 인스턴스를 새로 생성하고 그 참조를 반환
- `new` 연산자 생성 (`String s3 = new String("ogu");`):
    1. `new` 연산자는 String Pool과는 별개로, 힙(Heap) 영역에 "ogu" 내용을 가진 새로운 `String` 인스턴스를 항상 생성
    2. 이때 "ogu" 리터럴 자체는 String Pool에도 존재하게 됨

`new`로 생성된 객체의 참조를 `intern()` 메서드를 통해 String Pool의 참조로 변경할 수도 있다.

## StringBuffer & StringBuilder

`String` 클래스는 문자열 연산이 빈번하게 발생하면 성능 저하의 원인이 될 수 있어, 문자열을 효율적으로 다루기 위한 `StringBuffer`와`StringBuilder` 클래스를 제공한다.

### 컴파일러 최적화

자바 컴파일러는 문자열 덧셈 연산을 `StringBuilder`를 사용한 코드로 자동 변환하여, 성능 저하의 문제를 완화한다.

```java
String s = "A" + "B"; // String s = "AB";로 변환
String s1 = str1 + str2; // String s1 = new StringBuilder().append(str1).append(str2).toString();로 변환
```

하지만, 반복문 내에서 문자열 덧셈을 사용할 경우 매 반복마다 `StringBuilder`가 새로 생성되어 비효율적이므로, 이때는 개발자가 직접 `StringBuilder`를 생성하여 사용해야 한다.

### StringBuffer

- 내부적으로 문자열 편집을 위한 `buffer`를 가지고 있음
- 생성자를 통해 초기 용량을 지정할 수 있으며 버퍼의 크기가 부족할 경우 자동으로 증가
- 메서드 대부분이 `synchronized`로 선언되어 있어, 멀티스레드 환경에서 안전하게 사용 가능

#### StringBuffer 문자열 비교

`StringBuffer`는 `equals()` 메서드를 재정의하지 않았기 때문에, `Object`의 `equals()`가 호출되어 주소값을 비교(==)한다.

```java
public class StringBufferTest {

    public static void main(String[] args) {
        StringBuffer sb1 = new StringBuffer("ogu");
        StringBuffer sb2 = new StringBuffer("ogu");
        System.out.println(sb1 == sb2); // false
        System.out.println(sb1.equals(sb2)); // false
        System.out.println(sb1.toString().equals(sb2.toString())); // true
    }
}
```

### StringBuilder

- `thread safe`한 StringBuffer와 달리 `thread unsafe`
- 위 기능을 제외하고는 StringBuffer와 동일

## String, StringBuffer, StringBuilder 비교

|           특징           |    String     |   StringBuffer   | StringBuilder |
|:----------------------:|:-------------:|:----------------:|:-------------:|
|    가변성(Mutability)     | 불변(Immutable) |   가변(Mutable)    |  가변(Mutable)  |
|       저장 위치(리터럴)       |  String Pool  |       Heap       |     Heap      |
| 스레드 안전성(Thread Safety) | 안전(Immutable) | 안전(Synchronized) |    안전하지 않음    |
|        주요 사용 환경        | 문자열 연산이 적을 때  |     멀티스레드 환경     |   단일 스레드 환경   |
|      성능(문자열 변경 시)      |  낮음(새 객체 생성)  |        높음        |     매우 높음     |

###### 참고자료

- [Java의 정석](https://kobic.net/book/bookInfo/view.do?isbn=9788994492032)
