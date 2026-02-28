---
title: "Annotation"
date: 2024-03-07
lastUpdated: 2024-03-07
tags: [Java]
description: "명명 패턴의 단점을 극복하는 애너테이션의 개념과 마커 애너테이션, 매개변수 애너테이션, @Repeatable 활용법을 정리한다."
---

> 명명 패턴보다 애너테이션을 사용하라.

예전엔 명명 패턴을 사용해 프로그램 요소에 정보를 표시했다. 하지만 명명 패턴은 프로그램 요소를 매우 불편하게 만든다.  
예를들어 이전의 Junit은 테스트 메서드를 `test`로 시작하는 이름으로 지어야 테스트를 실행했기 때문에, 오타나 의도하지 않은 메서드가 테스트 대상이 되는 경우가 많았다.  
애너테이션 방법으로 명명 패턴을 완전히 대체할 수 있기 때문에 명명 패턴을 사용하지 말고 애너테이션을 사용하는 것이 좋다.

## Annotation

애너테이션은 클래스, 메서드, 필드 등의 프로그램 요소에 부가 정보를 덧붙이는 방법이다.  
이 방법을 사용하면 위의 명명 패턴의 단점을 모두 해결하면서 간결하고 명확하게 프로그램 요소의 의미를 전달할 수 있다.

### 마커 애너테이션

```java

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Test {
}
```

`@Test` 애너테이션을 살펴보면 `@interface`라는 키워드로 선언되어 있고, `@Retention`과 `@Target`이라는 애너테이션을 가지고 있다.  
이와 같이 애너테이션 선언에 다는 애너테이션을 메타 애너테이션(meta-annotation)이라고 한다.

- `@Retention`: 해당 애너테이션을 언제까지 유지할 것인지를 지정, 여기서는 `RetentionPolicy.RUNTIME`으로 지정되어 있어 `@Test`가 런타임에도 유지되어야 한다는 것을 의미함
- `@Target`:  해당 애너테이션을 어디에 사용할 수 있는지를 지정, 여기서는 `ElementType.METHOD`로 지정되어 있어 `@Test`가 메서드 선언에만 사용할 수 있음

이렇게 생성된 `@Test` 애너테이션은 다음과 같이 사용하는데, 이처럼 매개변수 없이 사용할 수 있는 애너테이션을 마커(marker) 애너테이션이라고 한다.

```java
class Sample {
    @Test
    public static void m1() {
        // Test m1
    }
}
```

애너테이션은 말 그대로 부가 정보를 덧붙이는 것이기 때문에, 해당 요소에 직접적인 영향을 주지 않고, 이 애너테이션을 처리할 프로그램에게 추가 정보를 제공하는 것이 전부이다.  
이러한 마커 애너테이션을 처리하는 코드 예시는 다음과 같다.

```java
public class RunTests {
    public static void main(String[] args) throws Exception {
        int tests = 0;
        int passed = 0;
        Class<?> testClass = Class.forName(args[0]);
        for (Method m : testClass.getDeclaredMethods()) { // 클래스의 모든 메서드를 순회
            if (m.isAnnotationPresent(Test.class)) { // @Test 애너테이션이 존재하는지 확인
                tests++;
                try {
                    m.invoke(null);
                    passed++;
                } catch (InvocationTargetException wrappedExc) {
                    Throwable exc = wrappedExc.getCause();
                    System.out.println(m + " failed: " + exc);
                } catch (Exception exc) {
                    System.out.println("Invalid @Test: " + m);
                }
            }
        }
        System.out.printf("Passed: %d, Failed: %d%n", passed, tests - passed);
    }
}
```

### 매개변수를 받는 애너테이션

애너테이션에도 매개변수를 받아 정의할 수 있는데, 이를 사용한 예시는 다음과 같다.

```java

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface ExceptionTest {
    Class<? extends Throwable> value();
}
```

`@ExceptionTest` 애너테이션은 `@Test` 애너테이션과 비슷하지만, `value`라는 매개변수를 받아서 테스트 메서드가 특정한 예외를 던져야만 성공하는 테스트임을 명시한다.

```java
class Sample {
    @ExceptionTest({IndexOutOfBoundsException.class, NullPointerException.class})
    public static void doublyBad() {
        List<String> list = new ArrayList<>();
        list.addAll(5, null);
    }
}
```

해당 애너테이션을 처리하는 코드는 다음과 같다.

```java
public class RunTests {
    public static void main(String[] args) throws Exception {
        int tests = 0;
        int passed = 0;
        Class<?> testClass = Class.forName(args[0]);
        for (Method m : testClass.getDeclaredMethods()) { // 클래스의 모든 메서드를 순회
            if (m.isAnnotationPresent(ExceptionTest.class)) { // @ExceptionTest 애너테이션이 존재하는지 확인
                tests++;
                try {
                    m.invoke(null);
                    System.out.printf("Test %s failed: no exception%n", m);
                } catch (Throwable wrappedExc) {
                    Throwable exc = wrappedExc.getCause();
                    int oldPassed = passed;
                    Class<? extends Throwable>[] excTypes = m.getAnnotation(ExceptionTest.class).value(); // @ExceptionTest의 value를 가져옴
                    for (Class<? extends Throwable> excType : excTypes) { // @ExceptionTest의 value를 순회
                        if (excType.isInstance(exc)) {
                            passed++;
                            break;
                        }
                    }
                    if (passed == oldPassed) {
                        System.out.printf("Test %s failed: %s %n", m, exc);
                    }
                }
            }
        }
        System.out.printf("Passed: %d, Failed: %d%n", passed, tests - passed);
    }
}
```

### @Repeatable

Java 8부터는 애너테이션을 반복해서 적용하여 여러 개의 값을 받는 방법을 제공한다.  
기존 애너테이션 정의에 `@Repeatable`을 추가하고, 애너테이션을 담을 컨테이너 애너테이션을 정의하면 된다.

```java
// @Repeatable을 추가하여 애너테이션을 반복해서 적용할 수 있도록 함
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Repeatable(ExceptionTestContainer.class)
public @interface ExceptionTest {
    Class<? extends Throwable> value();
}

// 애너테이션을 담을 컨테이너 애너테이션 정의
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface ExceptionTestContainer {
    ExceptionTest[] value();
}
```

이렇게 정의된 애너테이션을 사용하기 위해선 단순히 여러 개의 `@ExceptionTest` 애너테이션을 적용하면 된다.

```java
class Sample {
    @ExceptionTest(IndexOutOfBoundsException.class)
    @ExceptionTest(NullPointerException.class)
    public static void doublyBad() {
        List<String> list = new ArrayList<>();
        list.addAll(5, null);
    }
}
```

추가적으로 애너테이션을 처리하는 코드도 하나만 달았을 때와 여러 개를 달았을 때를 구분하여 처리해야 한다.

```java
public class RunTests {
    public static void main(String[] args) throws Exception {
        int tests = 0;
        int passed = 0;
        Class<?> testClass = Class.forName(args[0]);
        for (Method m : testClass.getDeclaredMethods()) { // 클래스의 모든 메서드를 순회
            if (m.isAnnotationPresent(ExceptionTest.class)
                || m.isAnnotationPresent(ExceptionTestContainer.class)) { // @ExceptionTest 또는 @ExceptionTestContainer 애너테이션이 존재하는지 확인
                tests++;
                try {
                    m.invoke(null);
                    System.out.printf("Test %s failed: no exception%n", m);
                } catch (Throwable wrappedExc) {
                    Throwable exc = wrappedExc.getCause();
                    int oldPassed = passed;
                    ExceptionTest[] excTests = m.getAnnotationsByType(ExceptionTest.class); // @ExceptionTest 애너테이션을 가져옴
                    for (ExceptionTest excTest : excTests) { // @ExceptionTest 애너테이션을 순회
                        if (excTest.value().isInstance(exc)) {
                            passed++;
                            break;
                        }
                    }
                    if (passed == oldPassed) {
                        System.out.printf("Test %s failed: %s %n", m, exc);
                    }
                }

            }
        }
        System.out.printf("Passed: %d, Failed: %d%n", passed, tests - passed);
    }
}
```
