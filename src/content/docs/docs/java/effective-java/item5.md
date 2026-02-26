---
title: "Dependency Injection"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> 자원을 직접 명시하지 말고 의존 객체 주입을 사용하라

클래스를 작성하다보면 대부분의 클래스가 하나 이상의 자원에 의존하게 된다.

```java
// 1. 정적 유틸리티 클래스
class SpellChecker {
    private final Lexicon dictionary = new KoreanDictionary();

    private SpellChecker() {
    }

    // ...
}
```

```java
// 2. 싱글턴
class SpellChecker {
    public static final SpellChecker INSTANCE = new SpellChecker();
    private final Lexicon dictionary = new KoreanDictionary();

    private SpellChecker() {
    }

    // ...
}
```

이러한 클래스를 1번이나 2번처럼 구현하게 되면 `KoreanDictionary` 클래스에 의존하게 되어 유연하게 대처할 수 없게 된다.

## 의존 객체 주입

이런 경우에는 의존 객체 주입을 하는 것이 좋다.  
인스턴스를 생성할 때 생성자에 의존 객체를 넘겨주는 방법과 생성자에 지원 팩터리를 넘겨주는 방법이 있다.

```java
// 3. 생성자를 통한 의존 객체 주입
class SpellChecker {
    private final Lexicon dictionary;

    public SpellChecker(Lexicon dictionary) {
        this.dictionary = Objects.requireNonNull(dictionary);
    }

    // ...
}
```

```java
class SpellChecker {
    private final Lexicon dictionary;

    public SpellChecker(Supplier<? extends Lexicon> dictionary) {
        this.dictionary = Objects.requireNonNull(dictionary.get());
    }
}
```

결론적으로 클래스에서 하나 이상의 자원에 의존하게 되면, 1,2번 방식을 사용하는 것 보다는 3,4 번처럼 의존 객체 주입을 하는 것이 좋다.  
이 방법은 결과적으로 클래스의 유연성/재사용성/테스트 용이성을 높여주게 된다.