---
title: "Exception Ignore"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: "예외를 무시해야 할 때 catch 블록에 주석과 ignored 변수명을 사용하여 의도를 명확히 해야 하는 이유를 정리한다."
---

> 예외를 무시하지 말라

메서드 선언에 예외를 명시하면 해당 메서드를 사용할 때 적절한 조치를 취할 수 있도록 도와준다.  
이를 무시하는 방법은 매우 간단한데, `try-catch` 블록을 비워두는 것이다.

```java
class Example {

    public static void main(String[] args) {
        try {
            // do something
        } catch (Exception e) {
            // 아무것도 하지 않음
        }
    }
}
```

당연하게도 무시하는 것은 좋지 않은데, 만약 예외를 무시하고 넘어가야 한다면 아래와 같이 처리해주는 것이 좋다.

- `catch` 블록 안에 예외를 무시하는 주석을 남김
- 예외 변수 이름을 `ignored`로 바꿈

```java
class Example {

    public static void main(String[] args) {
        try {
            // do something
        } catch (Exception ignored) {
            // ~~의 이유로 예외를 무시함
        }
    }
}
```

예외 무시는 검사/비검사 예외 모두에 해당되는데, 일반적으론 예외를 무시하는 것이 좋지 않으므로 검사 예외를 무시하는 것은 특별한 이유가 있을 때만 허용하는 것이 좋다.
