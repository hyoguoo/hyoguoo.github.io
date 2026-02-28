---
title: "Array"
date: 2022-11-20
lastUpdated: 2024-08-30
tags: [Java]
description: "배열의 고정 크기 특성과 인덱스 기반 접근 방식, 2차원 배열 및 배열 복사 방법을 정리한다."
---

> 어떤 메모리 블록에 연속적으로 나열된 같은 유형의 변수 모음

연결 리스트와 비슷하게 선형적으로 저장하지만 원하는 인덱스를 알고 있을 경우 시간 복잡도의 차이가 있다.  
배열은 동적인 자료구조가 아니며 유한하고 고정된 수의 원소로 이루어지기 때문에 일부만 사용하더라도 배열에 있는 모든 원소에 대해 메모리가 할당된다.

- 시간 복잡도

|    |  배열  | 연결 리스트 |
|:--:|:----:|:------:|
| 탐색 | O(1) |  O(n)  |
| 삽입 | O(n) |  O(1)  |

## 배열 선언과 생성

배열은 선언, 생성, 초기화 세 단계로 이루어진다.

```java
class Example {

    public void example() {
        int[] arr1; // 배열 선언
        arr1 = new int[5]; // 배열 생성
        int[] arr2 = new int[5]; // 선언과 생성 동시
        int[] arr3 = {1, 2, 3, 4, 5}; // 선언과 생성, 초기화 동시
    }
}
```

- 배열 선언: 생성된 배열을 다루기 위한 참조변수 공간이 생성
- 배열 생성: 배열의 크기를 지정되면서 배열의 각 원소에 대한 메모리 공간이 생성
- 초기화: 배열의 각 원소에 값을 할당

생성만 한 뒤 값을 할당하지 않은 배열은 각 원소의 기본값으로 초기화된다.

|          type          |       default value       |
|:----------------------:|:-------------------------:|
|        boolean         |           false           |
|          char          | ‘\u0000’ (null character) |
| byte, short, int, long |             0             |
|     float, double      |            0.0            |
|         object         |           null            |

## 배열 참조와 복사

단순한 대입만으로 배열 원소를 복사할 수 없으며 두 배열의 유형이 같은 경우 한 레퍼런스를 다른 레퍼런스에 대입할 수 있다.

```java
class Example {

    public void example() {
        int[] arrayA = new int[10];
        int[] arrayB = new int[10];
        arrayA = arrayB; // arrayA와 arrayB가 같은 배열 참조
    }
}
```

만약 한 배열의 내용을 다른 배열로 복사하고 싶은 경우 `System.arraycopy` 메소드를 사용하거나 반복문을 통해 복사할 수 있다.

```java
class Example {

    public void example() {
        int[] arrayA = new int[10];
        int[] arrayB = new int[10];
        System.arraycopy(arrayA, 0, arrayB, 0, arrayA.length);
    }
}
```

## 다차원 배열

배열의 배열 형태로, 2차원 이상의 배열을 다차원 배열이라고 한다.

```java
class Example {

    public void example() {
        int[][] arr1 = new int[3][4]; // 선언 및 생성
        int[][] arr2 = {{1, 2, 3}, {4, 5, 6}}; // 초기화
        int[][] arr3 = new int[3][]; // 가변 배열 선언 및 생성
        arr3[0] = new int[3];
        arr3[1] = new int[2];
        arr3[2] = new int[4];
    }
}
```

###### 참고자료

- [Java의 정석](https://kobic.net/book/bookInfo/view.do?isbn=9788994492032)
