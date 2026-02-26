---
title: "@Override"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> @Override 애너테이션을 일관되게 사용하라.

자바가 기본으로 제공하는 애너테이션 중 가장 중요하고 자주 쓰이는 애너테이션은 `@Override`이다.  
`@Override`는 해당 메서드가 상위 클래스의 메서드를 재정의한 것임을 표시하는 메서드를 대상으로 하는 애너테이션이다.

이 애너테이션을 사용하지 않고 메서드를 재정의하면 컴파일러가 오류를 발생시키지 않는데, 그 예는 아래 코드와 같다.

```java
class Bigram {
    private final char first;
    private final char second;

    public Bigram(char first, char second) {
        this.first = first;
        this.second = second;
    }

    // 재정의한 것이 아닌 새로운 메서드를 정의한 것이 됨
    public boolean equals(Bigram b) { // Object의 equals를 재정의하기 위해선 매개변수 타입을 Object로 해야함
        return b.first == first && b.second == second;
    }

    public int hashCode() {
        return 31 * first + second;
    }
}

class Main {
    public static void main(String[] args) {
        Set<Bigram> s = new HashSet<>();
        for (int i = 0; i < 10; i++) {
            for (char ch = 'a'; ch <= 'z'; ch++) {
                s.add(new Bigram(ch, ch)); // 전부 다른 Bigram 객체로 인식하여 총 26 * 10 = 260개의 객체가 생성됨
            }
        }
        System.out.println(s.size()); // 기대하는 값 26, 실제 값 260
    }
}
```

언뜻 보면 문제 없이 `equals` 메서드를 재정의한 것처럼 보이지만, 실제로는 `Object`의 `equals` 메서드를 재정의(overriding)한 것이 아니라 다중 정의(overloading)한 것이다.  
이를 방지하기 위해선 `Object.equals`를 재정의한다는 의도를 명확히 밝히기 위해 `@Override` 애너테이션을 사용하는 것이 좋다.

```java
class Bigram {
    private final char first;
    private final char second;

    public Bigram(char first, char second) {
        this.first = first;
        this.second = second;
    }

//    Error, method does not override or implement a method from a supertype
//    @Override
//    public boolean equals(Bigram b) {
//        return b.first == first && b.second == second;
//    }

    @Override
    public boolean equals(Object o) { // Object의 equals를 재정의하기 위해선 매개변수 타입을 Object로 해야함
        if (!(o instanceof Bigram)) {
            return false;
        }
        Bigram b = (Bigram) o;
        return b.first == first && b.second == second;
    }

    @Override
    public int hashCode() {
        return 31 * first + second;
    }
}
```

만약 기존의 메서드에 `@Override` 애너테이션을 사용하면 컴파일러가 오류를 발생시키기 때문에 프로그래머가 실수를 빨리 발견할 수 있다.

## 결론

기본적으로 상위 클래스의 메서드를 재정의하려는 모든 메서드에 `@Override`를 사용하자.  
예외로 상위 클래스의 추상 메서드를 재정의한 구상 클래스는 `@Override`를 생략해도 되는데, 이는 추상 메서드를 재정의하지 않으면 컴파일러가 오류를 발생시키기 때문이다.  
하지만 붙인다고 문제가 되는 것이 아니니 재정의 하는 경우엔 항상 `@Override`를 붙이는 것이 좋다.
