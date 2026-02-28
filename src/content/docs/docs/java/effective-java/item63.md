---
title: "String Concat"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: "문자열 연결 연산자 +가 n^2 시간 복잡도를 유발하는 원인과 StringBuilder를 활용한 성능 개선 방법을 정리한다."
---

> 문자열 연결은 느리니 주의해서 사용하라

`+`을 사용하여 편리하게 문자열 연결 연산을 할 수 있는데, 이 연산 자체가 큰 성능 저하를 가져올 수 있다.  
문자열은 불변 객체이기 때문에 두 문자열을 연결할 경우 두 문자열을 복사한 후 새로운 문자열을 생성하기 때문에 `n`개의 문자열을 연결할 경우 `n^2`의 시간이 걸린다.

## StringBuilder 사용

위와 같은 문제를 해결하기 위해 `StringBuilder`를 사용할 수 있다.

```java
class Example {
    public String statementWithString() {
        String result = "";
        for (int i = 0; i < numItems(); i++) {
            result += lineForItem(i);
        }
        return result;
    }
    
    public String statementWithStringBuilder() {
        StringBuilder sb = new StringBuilder(numItems() * LINE_WIDTH); // 적절한 크기로 초기화하면 더 빠르다
        for (int i = 0; i < numItems(); i++) {
            sb.append(lineForItem(i));
        }
        return sb.toString();
    }
}
```

## 사용하더라도 크게 문제가 없는 경우

위 설명과 같아 문자열 연결 연산을 사용하면 성능 저하가 발생하지만 아래와 같은 경우는 사용하더라도 큰 문제가 없다.

- 한 줄짜리 출력값
- 작고크기가 고정된 객체의 문자열 표현