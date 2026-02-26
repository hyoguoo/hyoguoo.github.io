---
title: "Defensive Copy"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 적시에 방어적 복사본을 만들라

자바는 보통 메모리 충동 오류에서 안전하지만, 불변식을 깨뜨리려는 공격에는 위협이 될 수 있다.  
실제로 불변식을 깨뜨리는 시스테 보안 공격이 있기 때문에 해당 케이스에 대비를 하는 것이 좋다.

```java
public final class Period {
    private final Date start;
    private final Date end;

    public Period(Date start, Date end) {
        if (start.compareTo(end) > 0) {
            throw new IllegalArgumentException(start + " after " + end);
        }
        this.start = start;
        this.end = end;
    }

    public Date start() {
        return start;
    }

    public Date end() {
        return end;
    }
}

public class Attack {
    public static void main(String[] args) {
        Date start = new Date();
        Date end = new Date();
        Period p = new Period(start, end);
        end.setYear(78); // p의 내부 수정
    }
}
```

위 예시 코드도 final이 설정되어 있고, setter가 없기 때문에 불변식을 깨뜨릴 수 없을 것 같지만, 가변 필드인 Date를 사용하고 있기 때문에 불변식을 깨뜨릴 수 있다.  
이러한 공격을 방어하기 위해선, 두 부분을 수정하여 불변식을 보장할 수 있다.

```java
public final class Period {
    // ...

    public Period(Date start, Date end) {
        this.start = new Date(start.getTime());
        this.end = new Date(end.getTime());

        if (this.start.compareTo(this.end) > 0) {
            throw new IllegalArgumentException(this.start + " after " + this.end);
        }
    }

    public Date start() {
        return new Date(start.getTime());
    }
    
    public Date end() {
        return new Date(end.getTime());
    }
}

public class Attack {
    public static void main(String[] args) {
        Date start = new Date();
        Date end = new Date();
        Period p = new Period(start, end); // 내부에서 다른 인스턴스를 p에 넣음
        Date pEnd = p.end(); // p의 end 객체의 복사본을 가져옴
        pEnd.setYear(78); // 복사본을 수정했기 때문에 p의 내부는 변하지 않음
    }
}
```

총 아래 두 가지 부분을 수정한 것을 알 수 있다.

- 생성자에서 받은 가변 매개변수를 방어적으로 복사
- 접근자 메서드가 가변 필드의 방어적 복사본을 반환

이렇게 되면 접근자 메서드를 통해서도 복사본이 반환되기 때문에 Period 인스턴스에 직접적인 접근은 불가능하고 변경을 할 수 없게 된다.  
하지만 결국 새로운 인스턴스를 생성하고 복사본을 반환하기 때문에 성능이 저하될 수 있기 때문에, 수정하지 않는 것을 확신하면 방어적 복사를 생략할 수 있다.
