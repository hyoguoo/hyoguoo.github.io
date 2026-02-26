---
title: "Variable"
date: 2022-10-08
lastUpdated: 2025-10-29
tags: [Java]
description: ""
---

변수는 프로그램 실행 중에 값을 저장하고 참조하기 위해 사용되는, 이름이 붙은 메모리 영역이다.

## 변수 명명 규칙

1. 대소문자 구분
2. 길이 제한 없음
3. 예약어 사용 불가능
4. 숫자로 시작 불가
5. `_` `$`를 제외한 특수문자 불가능

## 변수의 타입

### 원시 타입(primitive type)

- `null` 값을 가질 수 없음
- 메소드 내에 선언된 기본형 변수는 JVM 스택(Stack) 영역에 실제 값이 직접 저장

| 타입  | 설명                     | 크기               | 예시                   |
|-----|------------------------|------------------|----------------------|
| 논리형 | boolean                | 1 byte           | true, false          |
| 문자형 | char                   | 2 bytes          | 'A', 'b', '$'        |
| 정수형 | byte, short, int, long | 1, 2, 4, 8 bytes | 42, -1000, 987654321 |
| 실수형 | float, double          | 4, 8 bytes       | 3.14, -0.001         |

- 논리형이 1bit가 아닌 1byte인 이유
    - JVM 메모리를 다루는 최소 단위(CPU가 주소 지정 가능한 최소 단위)가 1byte이기 때문
    - [참고 - CPU can't address anything smaller than a byte.](https://stackoverflow.com/questions/4626815)

### 참조 타입(reference type)

기본형 8종류를 제외한 모든 타입에 해당하며, 값이 저장된 메모리의 주소(reference)를 저장하는 타입이다.

- 실제 객체 인스턴스는 JVM 힙(Heap) 영역에 생성
- 변수는 힙 영역에 있는 객체의 주소값을 스택(Stack) 영역에 저장
- `null` 값을 가질 수 있으며, 이는 변수가 어떠한 객체도 참조하고 있지 않음을 의미
- [Wrapper 클래스](./wrapper-class)는 기본형 타입을 객체로 다루어야 할 때(예: 컬렉션) 사용하는 참조형 타입

## 변수와 상수

변수와 상수는 값을 저장하는 점에서 동일하지만, 아래 차이점이 존재한다.

- 변수(variable): 하나의 값을 저장하기 위한 공간
- 상수(constant): 값을 한 번만 저장할 수 있는 공간(final 키워드 사용)
- 리터럴(literal): 코드에 작성된 값 그 자체를 의미

```java
class Example {

    void example() {
        int age = 14; // 변수
        final int OGU_NUMBER = 59; // OGU_NUMBER: 상수, 59: 리터럴
    }
}
```

## 리터럴 타입

변수와 마찬가지로 값 자체를 의미하는 리터럴에도 타입이 존재하며, 컴파일러는 리터럴을 보고 타입을 추론한다.

### 정수타입 리터럴

|    Type     | Expression |
|:-----------:|:----------:|
|   binary    | 0b{number} |
|    octal    | 0{number}  |
| hexadecimal | 0x{number} |
|    `int`    |  {number}  |
|   `long`    | {number}L  |

### 실수타입 리터럴

|   Type   |  Expression  |
|:--------:|:------------:|
| `float`  | {number}f(F) |
| `double` | {number}d(D) |

### 문자타입 리터럴

|   Type   |      Expression      |
|:--------:|:--------------------:|
|  `char`  | '{single character}' |
| `string` |      "{string}"      |

### 논리타입 리터럴

|   Type    | Expression |
|:---------:|:----------:|
| `boolean` | true/false |

### 리터럴 타입 할당 예시

```java
class Example {

    void example() {
        float pi = 3.14;          // 변수와 리터럴 타입 불 일치 -> error
        double rate = 59.59;       // double 리터럴 타입 생략 가능 -> OK
        int i = 'A';            // 문자 'A'의 아스키코드인 65가 할당 -> OK
        long d = 59;             // 저장 범위가 넓은 타입에 좁은 타입 저장 가능 -> OK
        int ii = 0x123456789;   // int 타입의 범위를 넘는 값 저장 -> error
        String str = "";           // 빈 문자열 할당 -> OK
        char ch = '';            // 빈 문자 할당, 하나의 문자 반드시 필요 -> error
        char chch = ' ';         // 공백 문자 할당 가능 -> OK
        String num1 = 7 + 7 + "";  // 7 + 7 + "" -> 14 + "" -> "14"
        String num2 = "" + 7 + 7;  // "" + 7 + 7 -> "7" + 7 -> "77"
        // `문자열 + any type -> 문자열 + 문자열 -> 문자열`
    }
}
```

###### 참고자료

- [Java의 정석](https://kobic.net/book/bookInfo/view.do?isbn=9788994492032)
- [java T point](https://www.javatpoint.com/string-pool-in-java)
