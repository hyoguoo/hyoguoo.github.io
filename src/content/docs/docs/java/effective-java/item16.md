---
title: "Accessor Method"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> public 클래스에서는 public 필드가 아닌 접근자 메서드를 사용하라

- 접근자 메서드를 사용하지 않은 클래스

```java

class Point {
    public double x;
    public double y;
}
```

접근자 메서드를 사용하지 않은 클래스는 클라이언트가 필드에 직접 접근할 수 있어 캡슐화의 이점을 제공하지 못한다.  
`java.awt.package`의 `Point`와 `Dimension` 클래스가 이렇게 작성되었는데, 여전히 성능 문제를 일으키는 안 좋은 예이다.

만약 불변으로 선언되었으면 그나마 낫지만, API를 변경하지 않고는 내부 표현을 바꿀 수 없는 단점이 여전히 존재한다.  

- 접근자 메서드를 사용한 클래스

```java
class Point {
    private double x;
    private double y;

    public Point(double x, double y) {
        this.x = x;
        this.y = y;
    }

    public double getX() {
        return x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public double getY() {
        return y;
    }

    public void setY(double y) {
        this.y = y;
    }
}
```

접근자 메서드를 사용한 클래스는 내부 표현 방식을 언제든 바꿀 수 있는 유연성을 제공한다.

## public 클래스가 아닌 package-private 클래스 혹은 private 중첩 클래스

이 문서에서 다룬 특징들은 public 클래스에만 해당한다.  
package-private 클래스나 private 중첩 클래스라면 데이터 필드를 노출한다 해도 문제가 없으며, 그 클래스가 표현하려는 추상 개념만 올바르게 표현해주면 된다.

클라이언트 코드 면에서 접근자 방식보다 깔끔하게 사용할 수 있으며,  
클라이언트 코드가 해당 클래스(public 필드로 열어놓은)의 내부 표현에 묶이기는 하지만, 이 클라이언트 클래스도 패키지 안에서만 동작하기 때문에 패키지 바깥 코드에는 영향을 주지 않는다.