---
title: "readObject Method"
date: 2024-08-22
lastUpdated: 2024-08-22
---

> readObject 메서드는 방어적으로 작성하라

논리적/물리적 표현이 부합하여 기본 직렬화 형태를 사용해도 괜찮을 것 처럼 보이지만, 불변식을 보장해야 하는 경우 문제가 발생할 수 있다.

```java
public final class Period implements Serializable {

    private final Date start;
    private final Date end;

    public Period(Date start, Date end) {
        this.start = new Date(start.getTime());
        this.end = new Date(end.getTime());
        if (this.start.compareTo(this.end) > 0) {
            throw new IllegalArgumentException(start + " after " + end);
        }
    }

    public Date start() {
        return new Date(start.getTime());
    }

    public Date end() {
        return new Date(end.getTime());
    }

    // ...
}
```

이유는 `readObject`가 실질적으로 또 다른 public 생성ㅈ바 역할을 하기 때문에, 생성자에서 하는 유효성 검사를 `readObject`에서도 수행해야 한다.  
보통은 정상적으로 생성된 인스턴스로 바이트 스트림을 생성해서 문제가 없지만, 임의로 생성된 바이트 스트림을 역직렬화할 수 있기 때문에 유효성 검사를 수행해야 한다.

```java

private void readObject(ObjectInputStream s) throws IOException, ClassNotFoundException {
    s.defaultReadObject();

    // 유효성 검사
    if (start.compareTo(end) > 0) {
        throw new InvalidObjectException(start + " after " + end);
    }
}
```

생성자와 `readObject` 메서드에서 유효성 검사를 수행하면, 불변식을 완전히 보장할 수 있는 것처럼 보이지만, 다른 사이드 이펙트가 발생할 수 있다.  
아래 예시는 정상 `Period` 인스턴스에서 시작된 바이트 스트림 끝에 `private Date` 필드로의 참조를 추가하여 가변 `Period` 인스턴스를 생성할 수 있다.

```java
public class MutablePeriod {

    public final Period period;

    public final Date start;
    public final Date end;

    public MutablePeriod() {
        try {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            ObjectOutputStream out = new ObjectOutputStream(bos);

            // 유효한 Period 인스턴스를 직렬화
            out.writeObject(new Period(new Date(), new Date()));

            // 악의적인 이전 객체 참조
            // 이미 직렬화된 객체인 Period 내부의 Date 필드로의 참조를 추가 
            byte[] ref = {0x71, 0, 0x7e, 0, 5};
            bos.write(ref); // 시작 필드
            ref[4] = 4;
            bos.write(ref); // 종료 필드

            // Period 인스턴스 역직렬화
            ObjectInputStream in = new ObjectInputStream(
                    new ByteArrayInputStream(bos.toByteArray()));
            period = (Period) in.readObject();
            start = (Date) in.readObject(); // Period 내부의 Date 객체 참조
            end = (Date) in.readObject(); // Period 내부의 Date 객체 참조
            // 결과적으로 start와 end는 period의 내부 Date 객체를 참조하게 됨
        } catch (Exception e) {
            throw new AssertionError(e);
        }
    }
}

public class Main {

    public static void main(String[] args) {
        MutablePeriod mp = new MutablePeriod();
        Period p = mp.period;
        Date pEnd = mp.end; // pEnd는 p의 내부 Date 객체를 참조

        pEnd.setYear(78); // pEnd 변경 -> p도 함께 변경됨

        System.out.println(p);
    }
}
```

`Period` 인스턴스는 불변성을 유지한 채 생성됐지만, 공격자가 의도적으로 내부의 값을 수정할 수 있게 됐고, 이는 `Period` 인스턴스의 불변성을 깨뜨리게 된다.  
이는 객체 참조를 갖는 필드 모두를 방어적으로 복사하여 방지할 수 있다.

```java
private void readObject(ObjectInputStream s) throws IOException, ClassNotFoundException {
    s.defaultReadObject();

    // 방어적 복사, 재할당을 사용하기 때문에 필드에 final 키워드를 사용할 수 없음
    start = new Date(start.getTime());
    end = new Date(end.getTime());

    // 유효성 검사
    if (start.compareTo(end) > 0) {
        throw new InvalidObjectException(start + " after " + end);
    }
}
```
