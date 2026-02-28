---
title: "Failure Information"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: "예외의 toString 메서드에 실패 관련 매개변수와 필드 값을 담아 디버깅에 유용한 상세 메시지를 작성하는 방법을 정리한다."
---

> 예외의 상세 메시지에 실패 관련 정보를 담으라

예외를 잡지 못해 프로그램이 실패하면 자바 시스템은 스택 추적(stack trace)을 출력하는데, 스택 추적에 출력되는 메시지는 예외 객체의 `toString` 메서드를 호출해 얻는 문자열이다.  
때문에 `toString` 메서드에 가능한 많은 정보를 담아 반환하는 것이 디버깅에 도움이 된다.

## 실패 메시지에 담을 정보

실패 순간을 정확히 포착하기 위해선 예외와 관여된 모든 매개변수와 필드의 값을 실패 메시지에 담아야 한다.

예를들어 `IndexOutOfBoundsException`에, 범위의 최솟값과 최댓값, 그리고 인덱스의 실제 값을 담으면 좋지만, 자바에서는(17 버전 기준) 문자열이나 정수 인덱스 값을 받는 생성자만 존재한다.  
만약 더 자세한 정보를 제공하기 위해서 아래와 같이 범위의 최솟값과 최댓값을 받는 생성자가 있어도 좋았을 것이다.

```java
class IndexOutOfBoundsException extends RuntimeException {

    /**
     * IndexOutOfBoundsException을 생성한다.
     * 
     * @param lowerBound 인덱스의 최솟값
     * @param upperBound 인덱스의 최댓값 + 1
     * @param index 인덱스의 실제 값
     */
    public IndexOutOfBoundsException(int lowerBound, int upperBound, int index) {
        // 실패를 포착하는 상세 메시지를 생성한다.
        super(String.format(
                "최솟값: %d, 최댓값: %d, 인덱스: %d",
                lowerBound, upperBound, index));

        // 프로그램에서 이용할 수 있도록 실패 정보를 저장해둔다.
        this.lowerBound = lowerBound;
        this.upperBound = upperBound;
        this.index = index;
    }
}
```
