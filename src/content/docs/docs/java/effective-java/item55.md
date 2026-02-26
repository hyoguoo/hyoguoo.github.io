---
title: "Optional"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> 옵셔널 반환은 신중히 하라

자바에서는 메서드 결과 값을 반환할 수 없을 때 아래 세 가지 선택지가 존재한다.

- 예외 던지기
- null 반환
- Optional 반환

이 중 null을 반환하는 것이 가장 유연하고 사용하기 쉬우며, null 반환 메서드보다 오류 가능성이 적다.  
만약 Optional 반환을 사용한다고 했을 땐 절대 null을 반환하지 말아야 한다.(Optional 정책 위반)  
반환값이 없을 수 있으며, 클라이언트에게 이를 명확하게 알려줘야 할 때 Optional을 반환하는 것이 좋다.

```java
class Example {
    public static <E extends Comparable<E>> Optional<E> max(Collection<E> c) {
        if (c.isEmpty()) {
            return Optional.empty();
        }

        E result = null;
        for (E e : c) {
            if (result == null || e.compareTo(result) > 0) {
                result = Objects.requireNonNull(e);
            }
        }

        return Optional.of(result);
    }
}
```

## Optional 반환의 단점

많은 이점을 주는 Optional이지만 컬렉션, 맵, 스트림, 배열, 옵셔널 같은 컨테이너 타입에는 Optional을 반환하는 것이 적합하지 않다.

- 컬렉션 / 배열: 컬렉션과 배열은 이미 빈 컬렉션과 배열을 반환할 수 있기 때문에 Optional을 반환할 필요가 없다.
- 맵: 키가 없다는 사실이 두 가지 방식으로 표현되기 때문에 혼란을 줄 수 있다.
- 그 외: 성능에 민감한 상황에서는 Optional을 반환하는 것이 적합하지 않다.
