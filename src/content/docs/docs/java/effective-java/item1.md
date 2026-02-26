---
title: "Static Factory Method"
date: 2023-09-21
lastUpdated: 2024-03-07
tags: [Java]
description: ""
---
> 생성자 대신 정적 팩터리 메서드를 고려하라

보통 Java를 사용할 때 클래스의 인스턴스를 생성할 때는 public 생성자를 사용한다.  
하지만 이 방법 말고도 아래와 같이 정적 팩터리 메서드(static factory method)를 사용하여 객체를 생성할 수 있다.

```java
public class Example {

    private Example() {
    }

    public static Example of() {
        return new Example();
    }
}

public class Main {

    public static void main(String[] args) {
        Example example = Example.of();
    }
}
```

## 정적 팩터리 메서드의 장점

위 예시 코드와 같이 정적 팩터리 메서드를 통하여 객체를 생성을 하면 당연히 단점들도 존재하지만 장점들도 존재한다.

### 1. 생성자에 이름(의미) 부여

public 생성자는 클래스의 이름과 매개변수만으로 객체를 생성하지만 정적 팩터리 메서드는 메서드 자체의 이름을 지정할 수 있어 가독성이 좋아진다.

```java
class UUIDExample {
    public static void main(String[] args) {
        // 정적 팩터리 메서드를 사용하여 객체 생성
        UUID randomUUID1 = UUID.randomUUID();
        UUID nameUUID1 = UUID.nameUUIDFromBytes("example".getBytes());

        // public 생성자를 사용하여 객체 생성(실제 존재하는 코드x)
        UUID randomUUID2 = new UUID();
        UUID nameUUID2 = new UUID("example".getBytes());
    }
}

```

단순히 public 생성자를 사용하여 생성했다면 정확히 어떤 객체를 생성하는지 알기 어려웠을 것이다.  
때문에 만약 하나의 클래스가 여러 개의 생성자를 가져야 한다면 pulbic 생성자보다는 정적 팩터리 메서드를 사용하여 이름을 지정하는 것이 좋다.

### 2. 호출될 때마다 인스턴스 생성 필요 없음

public 생성자를 사용하여 객체를 생성할 때마다 새로운 인스턴스를 생성하지만 정적 팩터리 메서드를 사용하면 미리 생성해둔 인스턴스를 재사용할 수 있다.

```java
class SingletonExample {

    // 정적 팩터리 메서드를 사용하여 인스턴스를 관리
    private static SingletonExample instance;

    // private 생성자로 외부에서 인스턴스 생성 방지
    private SingletonExample() {
    }

    // 정적 팩터리 메서드
    public static SingletonExample getInstance() {
        if (instance == null) {
            instance = new SingletonExample();
        }
        return instance;
    }

    public void doSomething() {
        System.out.println("Singleton instance is here!");
    }
}

class Main {
    public static void main(String[] args) {
        // 정적 팩터리 메서드를 사용하여 인스턴스 조회
        SingletonExample singleton = SingletonExample.getInstance();

        // 인스턴스를 여러 번 가져와도 동일한 인스턴스 반환
        SingletonExample anotherSingleton = SingletonExample.getInstance();

        // 두 객체는 완전 동일한 객체이므로 true
        System.out.println(singleton == anotherSingleton); // true

        // 객체 메서드 호출
        singleton.doSomething();
    }
}
```

위와 같이 생성하면 인스턴스를 하나로 제한할 수 있으며, 또한 인스턴스를 미리 생성해두고 재사용할 수 있어 메모리 낭비를 방지할 수 있다.  
이와 같이 인스턴스를 하나로 제한하는 것은 `플라이웨이트 패턴`의 근간이 되는 기법이다.

### 3. 반환 타입의 하위 타입 객체 반환 가능

public 생성자를 사용하여 객체를 생성할 때는 해당 클래스의 인스턴스만 반환할 수 있지만 정적 팩터리 메서드를 사용하면 해당 클래스의 하위 타입 객체를 반환할 수 있다.

```java
interface Shape {
    // ...

    // 정적 팩터리 메서드를 이용하여 Circle 객체 생성
    static Shape createCircle(double radius) {
        return new Circle(radius);
    }

    // 정적 팩터리 메서드를 이용하여 Rectangle 객체 생성
    static Shape createRectangle(double width, double height) {
        return new Rectangle(width, height);
    }
}

class Circle implements Shape {
    private double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    // ...
}

class Rectangle implements Shape {
    private double width;
    private double height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    // ...
}

class Main {
    public static void main(String[] args) {
        Shape circle = Shape.createCircle(10);
        Shape rectangle = Shape.createRectangle(10, 20);
    }
}
```

위와 같이 정적 팩터리 메서드를 사용하면 `Shape` 인터페이스를 구현한 `Circle`과 `Rectangle` 클래스의 인스턴스를 반환할 수 있다.  
실제로 Collection 프레임워크는 정적 팩터리 메서드를 사용하여 객체를 생성하고 반환하는데, 사용자는 해당 인터페이스의 구현체를 알 필요 없이 정적 팩터리 메서드를 통해 객체를 생성하고 사용할 수 있게 된다.

### 4. 입력 매개변수에 따라 매번 다른 클래스의 객체 반환 가능

public 생성자를 사용하여 객체를 생성할 때는 해당 클래스의 인스턴스만 반환할 수 있지만 정적 팩터리 메서드를 사용하면 입력 매개변수에 따라 다른 클래스의 객체를 반환할 수 있다.  
실제로 `EnumSet` 클래스의 정적 팩터리 메서드는 입력 매개변수에 따라 `RegularEnumSet`(원소 64개 이하)과 `JumboEnumSet`(원소 64개 초과)의 인스턴스를 반환한다.  
아래는 매개변수 문자열을 입력받아 해당 문자열에 해당하는 `Shape` 인터페이스의 구현체를 반환하는 예시이다.

```java
interface Shape {
    static Shape createShape(String shapeType) {
        if (shapeType == null) {
            return null;
        }
        if (shapeType.equalsIgnoreCase("CIRCLE")) {
            return new Circle();
        } else if (shapeType.equalsIgnoreCase("RECTANGLE")) {
            return new Rectangle();
        }
        return null;
    }

    void draw();
}

class Circle implements Shape {
    @Override
    public void draw() {
        System.out.println("Circle");
    }
}

class Rectangle implements Shape {
    @Override
    public void draw() {
        System.out.println("Rectangle");
    }
}

public class test {
    public static void main(String[] args) {
        Shape circle = Shape.createShape("circle");
        circle.draw();
        Shape rectangle = Shape.createShape("rectangle");
        rectangle.draw();
    }
}
```

3번과 마찬가지로 클라이언트는 해당 인터페이스의 구현체를 알 필요 없이 정적 팩터리 메서드를 사용하여 객체를 생성하고 사용할 수 있는 장점을 가지게 된다.

### 5. 정적 팩터리 메서드를 작성하는 시점에는 반환할 객체의 클래스가 존재하지 않아도 됨

public 생성자를 사용하여 객체를 생성할 때는 해당 클래스가 반드시 존재해야 하지만 정적 팩터리 메서드를 사용하면 해당 클래스가 존재하지 않아도 된다.  
이런 특징은 서비스 제공자 프레임워크(Service Provider Framework)를 만드는 근간이 된다.  
대표적인 서비스 제공자 프레임워크로는 JDBC가 있는데, 그 중 `DriverManager` 클래스의 실제 구현 코드를 일부 가져와 보면 아래와 같다.

```java
// Connection.java
public interface Connection extends Wrapper, AutoCloseable {
    // ...
}

// Driver.java
public interface Driver {
    // ...
}

// DriverManager.java
public class DriverManager {

    // List of registered JDBC drivers
    private static final CopyOnWriteArrayList<DriverInfo> registeredDrivers = new CopyOnWriteArrayList<>();
    // ...

    /* Prevent the DriverManager class from being instantiated. */
    private DriverManager() {
    }

    public static void registerDriver(java.sql.Driver driver,
                                      DriverAction da)
            throws SQLException {

        /* Register the driver if it has not already been added to our list */
        if (driver != null) {
            registeredDrivers.addIfAbsent(new DriverInfo(driver, da));
        } else {
            // This is for compatibility with the original DriverManager
            throw new NullPointerException();
        }

        println("registerDriver: " + driver);

    }

    @CallerSensitive
    public static Connection getConnection(String url)
            throws SQLException {

        java.util.Properties info = new java.util.Properties();
        return (getConnection(url, info, Reflection.getCallerClass()));
    }

    //  Worker method called by the public getConnection() methods.
    private static Connection getConnection(
            String url, java.util.Properties info, Class<?> caller) throws SQLException {

        // ...

        for (DriverInfo aDriver : registeredDrivers) {
            // If the caller does not have permission to load the driver then
            // skip it.
            if (isDriverAllowed(aDriver.driver, callerCL)) {
                try {
                    println("    trying " + aDriver.driver.getClass().getName());
                    Connection con = aDriver.driver.connect(url, info);
                    if (con != null) {
                        // Success!
                        println("getConnection returning " + aDriver.driver.getClass().getName());
                        return (con);
                    }
                } catch (SQLException ex) {
                    if (reason == null) {
                        reason = ex;
                    }
                }

            } else {
                println("    skipping: " + aDriver.driver.getClass().getName());
            }

        }

        // if we got here nobody could connect.
        if (reason != null) {
            println("getConnection failed: " + reason);
            throw reason;
        }

        println("getConnection: no suitable driver found for " + url);
        throw new SQLException("No suitable driver found for " + url, "08001");
    }
}
```

위 코드에서 확인할 수 있는 것을 정리하면 아래와 같다.

- private 생성자로 외부에서 인스턴스 생성 방지
- ArrayList로 객체들을 관리
- registerDriver() 메서드 파라미터의 Driver 인터페이스(= 서비스 제공자 인터페이스)를 통해 객체를 생성(= 제공자 등록 API)
- getConnection() 메서드를 통해 Connection 인터페이스(= 서비스 인터페이스)를 통해 객체를 반환(= 서비스 접근 API)

이를 간략화 하면 아래와 같이 정리 할 수 있다.

```java
// Service 인터페이스: 구현체의 동작을 정의
interface Service {
    void execute();
}

// 서비스 제공자 클래스 1
class ServiceProvider1 implements Service {
    @Override
    public void execute() {
        // 구현 내용
        System.out.println("ServiceProvider1 실행");
    }
}

// 서비스 제공자 클래스 2
class ServiceProvider2 implements Service {
    @Override
    public void execute() {
        // 구현 내용
        System.out.println("ServiceProvider2 실행");
    }
}

class ServiceRegistry {
    private static Map<String, Service> services = new HashMap<>();

    // 서비스 제공자 등록 API: 제공자가 구현체를 등록할 때 사용
    public static void registerService(String name, Service service) {
        services.put(name, service);
    }

    // 서비스 접근 API: 클라이언트가 서비스의 인스턴스를 얻을 때 사용
    public static Service getService(String name) {
        return services.get(name);
    }
}
```

## 정적 팩터리 메서드의 단점

### 1. private 생성자만 존재하면 하위 클래스를 만들 수 없어 상속이 불가능

```java
public class Parent {
    private Parent() {
    }

    public static Parent createInstance() {
        return new Parent();
    }
}

public class Child extends Parent { // 컴파일 오류, 상속 불가능
}
```

이는 단점이지만, 상속보다는 컴포지션을 사용하도록 유도하고 불변 타입으로 만들 수 있어 불변성을 보장할 수 있는 장점이 있다.

### 2. 정적 팩터리 메서드의 이름을 알아야 함

생성자는 클래스의 이름과 동일하지만 정적 팩터리 메서드는 이름을 지정할 수 있기 때문에 해당 메서드의 이름을 알아야 한다.  
이러한 단점 있어 널리 알려진 네이밍 규악을 통해 문제를 완화하고 있다.

|         메서드 이름          |                           설명                            |                              예시                               |
|:-----------------------:|:-------------------------------------------------------:|:-------------------------------------------------------------:|
|          from           |         매개변수를 하나 받아서 해당 타입의 인스턴스를 반환하는 형변환 메서드          |                `Date d = Date.from(instant);`                 |
|           of            |         여러 매개변수를 받아서 적합한 타입의 인스턴스를 반환하는 집계 메서드          |    `Set<Rank> faceCards = EnumSet.of(JACK, QUEEN, KING);`     |
|         valueOf         |                   from과 of의 더 자세한 버전                    |  `BigInteger prime = BigInteger.valueOf(Integer.MAX_VALUE);`  |
| instance \| getInstance |        매개변수로 명시한 인스턴스를 반환하지만, 같은 인스턴스임을 보장하지 않음         |    `StackWalker luke = StackWalker.getInstance(options);`     |
|  create \| newInstance  |                    매번 새로운 인스턴스 생성 보장                    | `Object newArray = Array.newInstance(classObject, arrayLen);` |
|         getType         | getInstance와 같으나, 생성할 클래스가 아닌 다른 클래스에 팩터리 메서드를 정의할 때 사용 |          `FileStore fs = Files.getFileStore(path);`           |
|         newType         | newInstance와 같으나, 생성할 클래스가 아닌 다른 클래스에 팩터리 메서드를 정의할 때 사용 |     `BufferedReader br = Files.newBufferedReader(path);`      |
|          type           |                getType과 newType의 간결한 버전                 |  `List<Complaint> litany = Collections.list(legacyLitany);`   |