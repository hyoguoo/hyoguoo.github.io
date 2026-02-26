---
title: "Limit File Top-level Class"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 톱레벨 클래스는 한 파일에 하나만 담으라

소스 파일 하나에 톱레벨 클래스를 여러 개 선언하는 것은 가능은 하지만 아무런 장점이 없기 때문에 피해야 한다.  
한 파일 안에 여러 개를 선언하면 한 클래스를 여러 가지로 정의할 수 있게 되는데, 이렇게 되면 어느 소스 파일을 먼저 컴파일하느냐에 따라 동작이 달라지게 된다.

```java
// Foo.java
class Foo {
    static final String NAME = "Foo - foo";
}

class Bar {
    static final String NAME = "Foo - bar";
}

// Bar.java
class Bar {
    static final String NAME = "Bar - bar";
}

class Foo {
    static final String NAME = "Bar - foo";
}

// Main.java
public class Main {
    public static void main(String[] args) {
        System.out.println(Foo.NAME);
        System.out.println(Bar.NAME);
    }
}
```

IDE 환경에서는 애초에 중복된 클래스명을 사용할 수 없기 때문에 위와 같이 코드를 작성하면 컴파일 에러가 발생한다.  
하지만 `javac` 명령어를 통해 직접 컴파일하면 실행한 명령어에 들어간 인수에 따라 다른 결과가 출력된다.

```bash
> rm *.class
> javac Main.java
> java Main
Foo - foo
Foo - bar
> rm *.class
> javac Main.java Foo.java
> java Main
Foo - foo
Foo - bar
> rm *.class
> javac Main.java Bar.java
> java Main
Bar - foo
Bar - bar
> rm *.class
> javac Main.java Foo.java Bar.java
Bar.java:1: error: duplicate class: Bar
class Bar {
^
Bar.java:5: error: duplicate class: Foo
class Foo {
^
2 errors
```

## 해결 방법

해결 방법은 아주 간단하게, 소스 파일을 분리하면 해결되고, 꼭 같은 파일에 여러 톱레벨 클래스를 선언해야 한다면 정적 멤버 클래스를 사용하면 된다.

```java
class Main {

    public static void main(String[] args) {
        System.out.println(Foo.NAME);
        System.out.println(Bar.NAME);
    }

    private static class Foo {
        static final String NAME = "foo";
    }

    private static class Bar {
        static final String NAME = "bar";
    }
}
```
