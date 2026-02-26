---
title: "Subtyping(하위 타입)"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 태그 달린 클래스보다는 클래스 계층구조를 활용하라

태그 달린 클래스란, 하나의 클래스가 여러가지 기능을 수행하는 것을 말한다.

```java
class Figure {
    // 태그 필드 - 현재 모양 정의
    final Shape shape;

    // 사각형(RECTANGLE)일 때만 사용하는 필드
    double length;
    double width;
    // 모양이 원(CIRCLE)일 때만 사용하는 필드
    double radius;

    // CIRCLE 태그를 위한 생성자
    Figure(double radius) {
        shape = Shape.CIRCLE;
        this.radius = radius;
    }

    // RECTANGLE 태그를 위한 생성자
    Figure(double length, double width) {
        shape = Shape.RECTANGLE;
        this.length = length;
        this.width = width;
    }

    double area() {
        switch (shape) {
            case RECTANGLE:
                return length * width;
            case CIRCLE:
                return Math.PI * (radius * radius);
            default:
                throw new AssertionError(shape);
        }
    }

    enum Shape {RECTANGLE, CIRCLE}
}
```

위 코드를 보면 하나의 클래스가 태그 필드에 따라 여러가지 기능을 수행하고 있으며, 불필요한 코드가 많아 메모리 낭비와 가독성이 떨어진다.

## Subtyping(하위 타입)

위처럼 태그 필드를 사용하는 것이 아니라 계층 구조를 활용하는 서브타이핑을 사용하면 더 나은 코드를 작성할 수 있다.

```java
abstract class Figure {
    abstract double area();
}

class Circle extends Figure {
    final double radius;

    Circle(double radius) {
        this.radius = radius;
    }

    @Override
    double area() {
        return Math.PI * (radius * radius);
    }
}

class Rectangle extends Figure {
    final double length;
    final double width;

    Rectangle(double length, double width) {
        this.length = length;
        this.width = width;
    }

    @Override
    double area() {
        return length * width;
    }
}
```

기존 코드와 비교해보면 언급된 단점이 모두 해결되었음을 알 수 있다.  
또한 확장성 면에서, 새로운 모양이 추가되더라도 기존 코드를 건드릴 필요가 없다.
