---
title: "Reflection"
date: 2023-06-15
lastUpdated: 2025-11-30
---

리플렉션은 자바 프로그램이 런타임에 자신의 구조(클래스, 인터페이스, 필드, 메서드 등)를 검사하고, 객체의 내부 속성을 조작할 수 있는 강력한 기능이다.

- 자바의 `java.lang.reflect` 패키지를 통해 제공
- 구체적인 클래스 타입을 알지 못하더라도 클래스 정보(메타데이터)에 접근하여 동적인 작업 수행 가능

스프링 프레임워크(Spring), 하이버네이트(Hibernate), Jackson 라이브러리 등이 내부적으로 이 기술을 적극 활용하여 DI(의존성 주입)나 객체 매핑을 수행한다.

## 핵심 동작 원리

JVM은 클래스 로더를 통해 클래스 파일을 읽어와 힙 메모리에 `java.lang.Class` 객체를 생성한다. 리플렉션은 이 `Class` 객체를 통해 클래스의 모든 정보에 접근한다.

```mermaid
flowchart LR
    Source[소스 코드 .java] -->|컴파일| Bytecode[바이트코드 .class]
    Bytecode -->|클래스 로딩| JVM_Heap[JVM Heap<br>Class 객체 생성]
    User[사용자 코드] -->|Reflection API 요청| JVM_Heap
    JVM_Heap -->|메타데이터 반환| User
```

## 주요 기능 및 사용법

리플렉션을 사용하기 위해서는 가장 먼저 조작하고자 하는 클래스의 `Class` 객체를 획득해야 한다.

1. `클래스.class`: 컴파일 타임에 타입을 알고 있을 때 사용
2. `obj.getClass()`: 런타임에 객체로부터 클래스 정보를 얻을 때 사용
3. `Class.forName("패키지.클래스명")`: 동적으로 클래스를 로딩할 때 사용

## 예제 코드

아래 코드는 리플렉션을 사용하여 private 필드를 수정하고 메서드를 호출하는 과정을 보여준다.

```java
class ReflectionTarget {

    private String name = "Original Name";

    private void printName() {
        System.out.println("Current name: " + name);
    }
}

class Main {

    public static void main(String[] args) throws Exception {
        ReflectionTarget target = new ReflectionTarget();

        // 1. Class 객체 획득
        Class<?> clazz = target.getClass();
        System.out.println("Class Name: " + clazz.getName());

        // 2. Private 필드 접근 및 수정
        // getField는 public만 접근 가능하므로 getDeclaredField 사용
        Field field = clazz.getDeclaredField("name");

        // 중요: private 접근 권한 해제
        field.setAccessible(true);

        System.out.println("Before: " + field.get(target));
        field.set(target, "Changed Name"); // 값 수정
        System.out.println("After: " + field.get(target));

        // 3. Private 메서드 호출
        Method method = clazz.getDeclaredMethod("printName");
        method.setAccessible(true);
        method.invoke(target); // 메서드 실행
    }
}
```

## 장점

클래스와 인터페이스의 정보를 가져와서 사용할 수 있기 때문에 애플리케이션을 개발할 때 유연하게 할 수 있게 된다.

1. 동적 객체 생성: 런타임 중 동적으로 객체를 생성하여 사용자의 입력이나 외부 파일에 따라 클래스를 동적으로 로딩하여 객체 생성 가능
2. 클래스 정보 검사: 클래스의 구조를 검사하고, 필드와 메서드 정보를 가져와 동적 처리 가능
3. 기존 동작 변경: 클래스의 private 필드나 메서드에 접근하여 값을 변경하거나 메서드 호출 가능

### 활용 사례(스프링 프레임워크)

실무 개발자가 직접 리플렉션을 사용하는 경우는 드물지만, 우리가 사용하는 대부분의 프레임워크와 라이브러리는 리플렉션을 기반으로 동작하여 개발 편의성을 높여준다.

- 의존성 주입(DI)
    - 스프링의 `@Autowired`가 붙은 필드를 스캔하고, `private`임에도 불구하고 외부에서 생성한 객체를 주입해주는 원리
- ORM(Object-Relational Mapping)
    - 하이버네이트나 JPA가 데이터베이스 조회 결과를 자바 객체의 필드에 매핑할 때, 기본 생성자로 객체를 생성한 뒤 리플렉션으로 값 설정
- JSON 직렬화/역직렬화
    - Jackson이나 Gson 라이브러리가 JSON 데이터를 자바 객체로 변환할 때 필드명을 기준으로 매핑

## 단점 및 주의사항

강력한 기능을 제공하지만 그에 따른 비용과 위험이 존재하므로 일반적인 비즈니스 로직에는 사용을 지양해야 한다.

- 성능 오버헤드
    - JVM의 JIT 컴파일러가 수행하는 최적화(인라인 등)를 적용 불가능
    - 단순 메서드 호출보다 훨씬 느리므로, 반복 루프 내에서의 사용은 성능 저하 요인
- 컴파일 타임 검증 불가
    - 클래스명이나 메서드명을 문자열로 전달하기 때문에, 오타가 있어도 컴파일 에러가 발생하지 않음
    - 런타임에 `ClassNotFoundException`이나 `NoSuchMethodException` 등의 예외가 발생 가능
- 캡슐화 저해
    - `private` 접근 제어자를 무시하고 내부 구현에 직접 접근 가능
    - 객체지향 설계 원칙을 위반하며, 내부 구현 변경 시 리플렉션을 사용하는 외부 코드까지 깨질 위험이 커짐

###### 참고자료

- [스프링 핵심 원리 - 고급편](https://www.inflearn.com/course/스프링-핵심-원리-고급편)
