---
title: "Print"
date: 2022-11-20
lastUpdated: 2025-10-30
tags: [Java]
description: ""
---

자바에서 콘솔(표준 출력)에 데이터를 출력하는 기본적인 방법으로 `System.out.print()`, `System.out.println()`, `System.out.printf()`가 있다.

- `System.out`을 통한 입출력은 내부적으로 동기화(synchronized) 처리가 되어 있음
- 멀티스레드 환경에서 출력 순서가 꼬이는 것을 방지하여 스레드에 안전(thread-safe)하게 동작하도록 보장
- [System.out.println()의 동작 원리와 성능 이슈](/blog/java-print-performance/)

## printf(형식화된 출력)

`printf`는 지시자(specifier)를 통해 변수의 값을 여러 가지 형식으로 변환하여 출력하는 기능을 가지고 있다.

```java
class Example {

    public static void main(String[] args) {
        // println()
        System.out.println("Hello, World!"); // Hello, World! 출력 후 줄바꿈
        System.out.println(100); // 100 출력 후 줄바꿈

        // printf()
        boolean flag = true;
        int dec = 255;
        double pi = 3.14159;

        // 다양한 타입의 값을 출력
        System.out.printf("Boolean: %b\n", flag); // Boolean: true
        System.out.printf("Decimal: %d\n", dec); // Decimal: 255
        System.out.printf("Octal: %o\n", dec); // Octal: 377
        System.out.printf("Hexadecimal: %x\n", dec); // Hexadecimal: ff
        System.out.printf("Floating-point: %f\n", pi); // Floating-point: 3.141590
        System.out.printf("Character: %c\n", 'A'); // Character: A
        System.out.printf("String: %s\n", "Hello"); // String: Hello

        // 공간 지시자
        int number = 10;
        System.out.printf("[%d]\n", number); // [10]
        System.out.printf("[%5d]\n", number); // [   10]
        System.out.printf("[%-5d]\n", number); // [10   ]
        System.out.printf("[%05d]\n", number); // [00010]

        // 진수 지시자
        number = 1048575;
        System.out.printf("%x\n", number); // fffff
        System.out.printf("%#x\n", number); // 0xfffff
        System.out.printf("%#X\n", number); // 0XFFFFF

        // 소수점 지시자
        double piValue = 3.141592653589793;
        System.out.printf("%.1f\n", piValue); // 3.1
        System.out.printf("%.2f\n", piValue); // 3.14
        System.out.printf("%.3f\n", piValue); // 3.142
        System.out.printf("%.4f\n", piValue); // 3.1416
        System.out.printf("%.5f\n", piValue); // 3.14159
        System.out.printf("%.6f\n", piValue); // 3.141593
    }
}
```

- 타입 지시자

| specifier |   description   |
|:---------:|:---------------:|
|    %b     |     boolean     |
|    %d     | decimal integer |
|    %o     |  octal integer  |
|  %x, %X   |  hexa-decimal   |
|    %f     | floating-point  |
|  %e, %E   |    exponent     |
|    %c     |    character    |
|    %s     |     string      |

- 공간 지시자

| specifier | result  |
|:---------:|:-------:|
|    %d     |  [10]   |
|    %5d    | [   10] |
|   %-5d    | [10   ] |
|   %05d    | [00010] |

- 진수 지시자

| specifier | result  |
|:---------:|:-------:|
|    %x     |  fffff  |
|    %#x    | 0xfffff |
|    %#X    | 0XFFFFF |

- 소수점 지시자

`%{전체자리}.{소수점아래자리}f`

| 자릿수 | 1 | 2 | 3 | 4 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0 |
|:---:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 결과  |   |   | 1 | . | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0 | 0 |

###### 참고자료

- [Java의 정석](https://kobic.net/book/bookInfo/view.do?isbn=9788994492032)
