---
title: "Singleton"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> private 생성자나 열거 타입으로 싱글턴임을 보증하라

싱글턴이란 인스턴스를 오직 하나만 생성할 수 있는 클래스로, 사용한 예로는 함수와 같은 무상태 객체나 설계상 유일해야 하는 시스템 컴포넌트가 있다.

## 싱글턴을 만드는 방법

싱글턴을 만드는 방법은 보통 두 가지 방식이 있다.

### 1. public static final 필드 방식

위 코드에서 볼 수 있듯이 `static final` 필드에 인스턴스를 만들어 public으로 선언하고, 생성자를 private으로 선언하여 외부에서 인스턴스를 생성하지 못하도록 한다.
이 방식은 해당 클래스가 싱글턴임이 API에 명백히 드러나는 장점이 있다.

```java
class Ogu {
    public static final Ogu INSTANCE = new Ogu();

    private Ogu() {
    }

    public void something() {
        System.out.println("something");
    }
}
```

### 2. 정적 팩터리 메서드 방식

아래 코드에서 볼 수 있듯이 `static` 팩터리 메서드를 public으로 선언하고, 생성자를 private으로 선언하여 외부에서 인스턴스를 생성하지 못하도록 한다.

```java
class Ogu {
    private static final Ogu INSTANCE = new Ogu();

    private Ogu() {
    }

    public static Ogu getInstance() {
        return INSTANCE;
    }

    public void something() {
        System.out.println("something");
    }
}
```

이 방식은 1번의 방법과 다르게 아래와 같은 장점이 있다. 만약 아래 장점들이 필요하지 않다면 1번의 방법을 사용하는 것이 좋다.

- API를 바꾸지 않고도 싱글턴이 아니게 변경 가능

```java
class Ogu {

    private static boolean useSingleton = true; // 싱글턴 사용 여부 플래그 값

    private Ogu() {
    }

    public static Ogu getInstance() {
        if (useSingleton) {
            return SingletonHolder.INSTANCE;
        } else {
            return new Ogu();
        }
    }

    public void something() {
        System.out.println("something");
    }

    // 싱글톤 인스턴스를 보유할 내부 클래스
    private static class SingletonHolder {
        private static final Ogu INSTANCE = new Ogu();
    }
}

class Main {
    public static void main(String[] args) {
        Ogu singletonInstance = Ogu.getInstance();
        singletonInstance.something();

        // 싱글턴 사용 여부 플래그 값을 false로 변경
        Ogu.useSingleton = false;
        Ogu nonSingletonInstance = Ogu.getInstance(); // 새로운 인스턴스 생성
        nonSingletonInstance.something();
    }
}
```

- 정적 팩터리를 제네릭 싱글턴 팩터리로 만들 수 있음

```java
class SingletonFactory<T> {
    private final Supplier<T> supplier;
    private T instance;

    private SingletonFactory(Supplier<T> supplier) {
        this.supplier = supplier;
    }

    public static <T> SingletonFactory<T> create(Supplier<T> supplier) {
        return new SingletonFactory<>(supplier);
    }

    public T getInstance() {
        if (instance == null) {
            instance = supplier.get();
        }
        return instance;
    }
}

class Main {
    public static void main(String[] args) {
        // Supplier를 사용하여 String 인스턴스를 생성하는 SingletonFactory를 생성
        SingletonFactory<String> stringFactory = SingletonFactory.create(() -> "Hello, Singleton!");

        // 싱글턴 인스턴스를 얻고 사용
        String singletonString = stringFactory.getInstance();
        System.out.println(singletonString); // Hello, Singleton!

        // Supplier를 사용하여 Integer 인스턴스를 생성하는 SingletonFactory를 생성
        SingletonFactory<Integer> integerFactory = SingletonFactory.create(() -> 42);

        // 싱글턴 인스턴스를 얻고 사용
        Integer singletonInteger = integerFactory.getInstance();
        System.out.println(singletonInteger); // 42
    }
}
```

- 정적 팩터리의 메서드 참조를 공급자(supplier)로 사용할 수 있음

```java
class Ogu {
    private static final Ogu INSTANCE = new Ogu();

    private Ogu() {
    }

    public void something() {
        System.out.println("something");
    }

    public static Ogu getInstance() {
        return INSTANCE;
    }
}

class Main {
    public static void main(String[] args) {
        // 정적 팩토리에서 메소드 참조를 사용하여 공급자로 사용
        Supplier<Ogu> oguSupplier = Ogu::getInstance;

        // 공급자를 사용하여 인스턴스를 가져오고 사용
        Ogu instance1 = oguSupplier.get();
        instance1.something();

        Ogu instance2 = oguSupplier.get();
        instance2.something();
    }
}
```

### 3. 원소가 하나인 열거 타입 방식

열거 타입은 싱글턴을 만드는 가장 좋은 방법으로, 직렬화 문제도 자동으로 처리되고 리플렉션 공격에도 안전하게 보장된다.

```java
enum Ogu {
    INSTANCE;

    public void something() {
        System.out.println("something");
    }
}
```

단, 만들려는 싱글턴이 Enum 외의 클래스를 상속해야 한다면 이 방법은 사용할 수 없다.  
때문에 상속을 해야하는 상황이 아니라면 이 방법을 사용하는 것이 가장 좋다.

## 싱글턴 클래스를 만들 때 주의할 점

위에서도 언급했듯이 1, 2번 패턴으로 만들게 되면 기본적으로 싱글턴 인스턴스를 보장할 수 있지만, 아래 두 가지 상황에서는 싱글턴이 깨질 수 있다.  
때문에 완벽하게 싱글턴을 보장하려면 직렬화(Serialization)와 리플렉션(Reflection)을 고려해야 한다.

### 리플렉션을 통한 예외

리플렉션을 이용하면 private 생성자를 호출할 수 있기 때문에 이러한 공격을 방어하기 위해서는 생성자에서 두 번째 객체가 생성되려고 할 때 예외를 발생 시키는 방어 코드를 넣어야 한다.

```java
class ReflectionExample {
    public static void main(String[] args) {
        try {
            // Ogu 클래스의 비공개 생성자 가져오기
            Constructor<Ogu> constructor = Ogu.class.getDeclaredConstructor();

            // 비공개 생성자에 접근할 수 있도록 허용
            constructor.setAccessible(true);

            // 리플렉션을 사용하여 Ogu의 인스턴스 생성
            Ogu oguInstance = constructor.newInstance();

            // 생성한 인스턴스로 Ogu의 메서드 호출
            oguInstance.something(); // something

            // 다른 인스턴스인지 확인
            System.out.println("Original INSTANCE: " + Ogu.INSTANCE); // Ogu@279f2327
            System.out.println("Reflectively created instance: " + oguInstance); // Ogu@2ff4acd0
            System.out.println("Are both instances same? " + (Ogu.INSTANCE == oguInstance)); // false
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

class Ogu {
    public static final Ogu INSTANCE = new Ogu();

    private Ogu() {
//        if (INSTANCE != null) {
//            throw new RuntimeException("Already initialized");
//        }
    }

    public void something() {
        System.out.println("something");
    }
}
```

생성자의 방어 코드 주석을 해제하면 아래의 예외가 발생하면서 두 번째 객체가 생성되지 않는다.

```
java.lang.reflect.InvocationTargetException
	at java.base/jdk.internal.reflect.NativeConstructorAccessorImpl.newInstance0(Native Method)
	at java.base/jdk.internal.reflect.NativeConstructorAccessorImpl.newInstance(NativeConstructorAccessorImpl.java:77)
	at java.base/jdk.internal.reflect.DelegatingConstructorAccessorImpl.newInstance(DelegatingConstructorAccessorImpl.java:45)
	at java.base/java.lang.reflect.Constructor.newInstanceWithCaller(Constructor.java:499)
	at java.base/java.lang.reflect.Constructor.newInstance(Constructor.java:480)
	at ReflectionExample.main(test.java:14)
Caused by: java.lang.RuntimeException: Already initialized
	at Ogu.<init>(test.java:34)
	... 6 more
```

### 직렬화를 통한 예외

1, 2번 방식으로 만든 싱글턴 클래스는 직렬화한 다음 역직렬화하면 해당 개체의 새 인스턴스가 생성되는 문제가 있다.  
떄문에 싱글턴 클래스를 직렬화하고 역직렬화할 때마다 새로운 인스턴스가 생성되는 문제를 해결하기 위해서는 `readResolve` 메서드를 제공해야 한다.  
`readResolve` 메소드는 Java의 역직렬화 프로세스 중에 사용되는 특수 메소드로, 구현해야 하는 인터페이스 메서드가 아닌 역직렬화 동작을 클래스에서 선택적으로 정의할 수 있는 메서드이다.

```java
class Singleton implements Serializable {

    public static final Singleton INSTANCE = new Singleton();

    private Singleton() {
    }

    public static Singleton getInstance() {
        return INSTANCE;
    }

    // 기존 인스턴스를 반환하도록 정의하여, 역직렬화 중에 생긴 새로운 인스턴스는 GC에 의해 제거됨
    private Object readResolve() {
        return INSTANCE;
    }
}


class Main {
    public static void main(String[] args) {
        try {
            // 싱글턴 객체 직렬화
            ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream("singleton.ser"));
            out.writeObject(Singleton.getInstance());
            out.close();

            // 싱글턴 객체 역직렬화
            ObjectInputStream in = new ObjectInputStream(new FileInputStream("singleton.ser"));
            Singleton deserializedSingleton = (Singleton) in.readObject();
            in.close();

            // 싱글턴 객체의 동일성 확인
            System.out.println(Singleton.getInstance()); // Singleton@27fa135a
            System.out.println(deserializedSingleton); // Singleton@27fa135a
            System.out.println(Singleton.getInstance() == deserializedSingleton); // true
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

마찬가지로 `readResolve` 메서드 주석을 해제하면 새로운 인스턴스가 반환되어 아래와 같은 결과가 출력된다.

```
Singleton@27fa135a
Singleton@6d5380c2
false
```