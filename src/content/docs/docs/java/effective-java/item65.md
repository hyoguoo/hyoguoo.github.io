---
title: "Reflection & Interface"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 리플렉션보다는 인터페이스를 사용하라

리플렉션 기능을 사용하면 프로그램에서 임의의 클래스에 접근하여 그 클래스의 메서드, 필드, 생성자에 접근할 수 있다.  
연결된 실제 메서드, 필드, 생성자를 조작하여 해당 클래스의 인스턴스를 생성, 필드 접근, 메서드 호출 할 수 있게 해준다.  
결국 리플렉션을 사용하여 컴파일 당시에 존재하지 않던 클래스도 이용할 수 있게 되는데, 많은 단점이 따라온다.

- 컴파일 타임 타입 검사가 주는 이점이 사라진다.
- 코드 양이 많아지고 가독성이 떨어진다.
- 성능 저하가 발생한다.

때문에 코드 분석 도구나 의존관계 주입 프레임워크처럼 애플리케이션의 동작을 변경하는 데 꼭 필요한 경우가 아니라면 리플렉션은 사용하지 않는 것이 좋다.  
(이마저도 리플렉션 사용을 줄이고자 하고 있다.)

## 제한된 형태의 리플렉션 사용

리플렉션을 아주 제한된 형태로 사용하면, 최대한 단점을 피하면서 이점을 취할 수 있게 된다.  
리플렉션은 인스턴스 생성에만 사용하고, 생성된 객체는 인터페이스나 상위 클래스로 참조해 사용하는 방법이다.

컴파일 타임이라도 적절한 인터페이스나 상위 클래스를 이용할 수 있는 경우가 있는데, 리플렉션은 인스턴스 생성에만 사용하고, 만든 인스턴스를 인터페이스나 상위 클래스로 참조해 사용하면 된다.

```java
class Example {
    public static void main(String[] args) {
        // 클래스 이름을 Class 객체로 변환
        Class<? extends Set<String>> cl = null;
        try {
            // 비검사 형변환
            cl = (Class<? extends Set<String>>) Class.forName("java.util.TreeSet");
        } catch (ClassNotFoundException e) {
            fatalError("클래스를 찾을 수 없습니다.");
        }

        // 생성자를 얻음
        Constructor<? extends Set<String>> cons = null;
        try {
            cons = cl.getDeclaredConstructor();
        } catch (NoSuchMethodException e) {
            fatalError("매개변수 없는 생성자를 찾을 수 없습니다.");
        }

        // 집합의 인스턴스 생성
        Set<String> s = null;
        try {
            s = cons.newInstance();
        } catch (ReflectiveOperationException e) {
            fatalError("리플렉션 예외 발생");
        }

        // 생성한 집합 사용
        String[] a = {"a", "b", "c"};
        s.addAll(Arrays.asList(a).subList(0, a.length));
        System.out.println(s);
    }

    private static void fatalError(String msg) {
        System.err.println(msg);
        System.exit(1);
    }
}
```

이 방법을 사용하면 리플렉션의 단점을 최대한 피하면서 이점을 취할 수 있으며, 대부분 경우 리플렉션 기능은 이 정도로만 사용하는 것이 좋다.
