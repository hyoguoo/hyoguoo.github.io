---
title: "equals"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---

> equals는 일반 규약을 지켜 재정의하라

equals는 재정의하기 쉬워 보이지만, 잘못 재정의하면 프로그램이 오동작할 수 있다.  
때문에 필요한 경우가 아니면 재정의하지 않는 것이 좋고, 다음의 상황이면 재정의할 필요가 없다.

- 각 인스턴스가 본질적으로 고유하다.
- 인스턴스의 '논리적 동치성(logical equality)'을 검사할 일이 없다.
- 상위 클래스에서 재정의한 equals가 하위 클래스의 equals에서도 알맞게 동작한다.
- 클래스가 private이거나 package-private이고, equals 메서드를 호출할 일이 없다.

위 상황이 아니라 논리적 동치성을 검사해야 한다면, 다음의 규약을 따라 재정의해야 한다.

## equals 재정의 규약

- 반사성(reflexivity): null이 아닌 모든 참조 값 x에 대해, x.equals(x)는 true다.
- 대칭성(symmetry): null이 아닌 모든 참조 값 x, y에 대해, x.equals(y)가 true면 y.equals(x)도 true다.
- 추이성(transitivity): null이 아닌 모든 참조 값 x, y, z에 대해, x.equals(y)가 true이고 y.equals(z)도 true면 x.equals(z)도 true다.
- 일관성(consistency): null이 아닌 모든 참조 값 x, y에 대해, x.equals(y)를 반복해서 호출하면 항상 true를 반환하거나 항상 false를 반환한다.
- null-아님: null이 아닌 모든 참조 값 x에 대해, x.equals(null)은 false다.

얼핏보면 당연한 규약들이지만, 실수로 어길 수 있는 규약들이다.  
위의 규약들을 어긴 예시들은 아래와 같다.

### 반사성

악의적인 의도가 없다면 어길 일이 없다.

### 대칭성

```java
class CaseInsensitiveString {

    private final String s;

    public CaseInsensitiveString(String s) {
        this.s = Objects.requireNonNull(s);
    }

    @Override
    public boolean equals(Object o) {
        if (o instanceof CaseInsensitiveString) {
            return s.equalsIgnoreCase(((CaseInsensitiveString) o).s);
        }
        if (o instanceof String) { // 무리하게 다른 타입을 허용하면서 발생한 문제
            return s.equalsIgnoreCase((String) o);
        }
        return false;
    }
}

class Main {

    public static void main(String[] args) {
        CaseInsensitiveString cis = new CaseInsensitiveString("Polish");
        String s = "polish";

        // 대칭성 위배
        System.out.println(cis.equals(s)); // true
        System.out.println(s.equals(cis)); // false, 다른 타입이기 때문에 false
    }
}
```

### 추이성

```java
class Point {

    private final int x;
    private final int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Point)) {
            return false;
        }
        Point p = (Point) o;
        return p.x == x && p.y == y;
    }
}

class ColorPoint extends Point {

    private final Color color;

    public ColorPoint(int x, int y, Color color) {
        super(x, y);
        this.color = color;
    }

    @Override
    public boolean equals(Object o) {
        // 구현 내용
    }
}
```

위의 ColorPoint 클래스 내의 equals 구현 내용에 따라 규약 위배 여부가 결정된다.  
우선 아래와 같이 구현하게 되면 대칭성이 위배된다.

```java
class ColorPoint extends Point {
    // ...
    @Override
    public boolean equals(Object o) {
        if (!(o instanceof ColorPoint)) {
            return false;
        }
        return super.equals(o) && ((ColorPoint) o).color == color;
    }
}

class Main {

    public static void main(String[] args) {
        Point p = new Point(1, 2);
        ColorPoint cp1 = new ColorPoint(1, 2, Color.RED);

        // 대칭성 위배
        System.out.println(p.equals(cp1)); // true
        System.out.println(cp1.equals(p)); // false
    }
}
```

이를 수정하여 Point 클래스에 대한 비교를 추가하면 대칭성은 지켜지지만, 추이성이 위배된다.

```java
class ColorPoint extends Point {
    // ...
    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Point)) {
            return false;
        }
        if (!(o instanceof ColorPoint)) {
            return o.equals(this);
        }
        return super.equals(o) && ((ColorPoint) o).color == color;
    }
}

class Main {

    public static void main(String[] args) {
        Point p = new Point(1, 2);
        ColorPoint cp1 = new ColorPoint(1, 2, Color.RED);
        ColorPoint cp2 = new ColorPoint(1, 2, Color.BLUE);

        // 추이성 위배
        System.out.println(p.equals(cp1)); // true
        System.out.println(cp1.equals(cp2)); // false
        System.out.println(p.equals(cp2)); // true
    }
}
```

만약 instanceof 대신 getClass를 사용하면 추이성은 지켜지지만, 대칭성이 위배된다.  
또한 Point의 하위클래스인 ColorPoint가 더이상 Point로써 사용될 수 없게 된다.(리스코프 치환 원칙 위배)

```java
class ColorPoint extends Point {
    // ...
    @Override
    public boolean equals(Object o) {
        if (o == null || o.getClass() != getClass()) {
            return false;
        }
        ColorPoint cp = (ColorPoint) o;
        return super.equals(o) && cp.color == color;
    }
}

class Main {

    public static void main(String[] args) {
        Point p = new Point(1, 2);
        ColorPoint cp1 = new ColorPoint(1, 2, Color.RED);

        // 대칭성 위배
        System.out.println(p.equals(cp1)); // true
        System.out.println(cp1.equals(p)); // false
    }
}
```

이와 클래스를 확장하는 경우에는 equals 규약을 지키는 것은 불가능하다고 볼 수 있지만, 우회하는 방법이 있다.

```java
class ColorPoint {
    private final Point point;
    private final Color color;

    public ColorPoint(int x, int y, Color color) {
        point = new Point(x, y);
        this.color = Objects.requireNonNull(color);
    }

    public Point asPoint() {
        return point;
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof ColorPoint)) {
            return false;
        }
        ColorPoint cp = (ColorPoint) o;
        return cp.point.equals(point) && cp.color == color;
    }
}
```

위 방법으로 equals 규약을 지킬 수 있지만, ColorPoint를 Point와는 더이상 상속 관계는 아니게 된다.

### 일관성

equals의 판안데 신뢰할 수 없는 자원이 끼어들지 않도록 해야 한다.

### null-아님

instanceof 연산자로 입력 매개변수가 올바른 타입인지 확인하면 명시적으로 null 검사를 할 필요가 없다.  
입력이 null이면 타입 확인 단계에서 false를 반환하므로 null 검사를 명시적으로 하지 않아도 된다.

```java
class Test {

    // ...

    // 명시적 null 검사
    @Override
    public boolean equals(Object o) {
        if (o == null) {
            return false;
        }
        // ...
    }

    // 묵시적 null 검사
    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Test)) {
            return false;
        }
        // ...
    }
}
```

### equals 메서드 구현시 주의사항

1. == 연산자를 사용해 입력이 자기 자신의 참조인지 확인
    - 자기 자신이면 true를 반환
    - 단순한 성능 최적화용으로 비교 작업이 복잡한 상황일 때 좋음
2. instanceof 연산자로 입력이 올바른 타입인지 확인
    - 가끔 해당 클래스가 구현한 특정 인터페이스를 비교할 수도 있음
    - 이런 인터페이스를 구현한 클래스라면 equals에서 (클래스가 아닌) 해당 인터페이스를 사용해야함
3. 입력을 올바른 타입으로 형변환
    - 2번에서 instanceof 연산자로 입력이 올바른 타입인지 검사 했기 때문에 이 단계에선 오류가 발생하지 않음
4. 입력 객체와 자기 자신의 대응되는 '핵심' 필드들이 모두 일치하는지 하나씩 검사
    - 모두 일치해야 true를 반환하도록 구현
5. 기본 타입은 ==로 비교하고 참조타입은 equals로 비교
6. float, double 필드는 정적 메서드 Float.compare(float, float)와 Double.compare(double, double)로 비교
    - Float.equals(float)나 Double.equals(double)는 오토 박싱을 수반해 성능상 좋지 않음
7. 배열 필드는 원소 각각을 지침대로 비교
    - 모두가 핵심 필드라면 Arrays.equals()를 사용
8. NullPointException 발생을 예방하기 위해 Object.equals(object, object)로 비교
9. 필드의 비교 순서를 작은 비용이 드는 필드부터 큰 비용이 드는 필드 순으로 비교
10. eqauls를 재정의할 땐 hashCode도 반드시 재정의
