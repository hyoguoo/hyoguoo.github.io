---
title: "Annotation"
date: 2026-05-16
lastUpdated: 2026-05-16
tags: [ Java ]
description: "Java 어노테이션의 동작 원리와 @Retention 정책별 생명주기, 런타임 리플렉션 및 컴파일 타임 어노테이션 프로세서 처리 방식, Lombok의 AST 조작 메커니즘과 @Data 사용 시 주의점을 분석한다."
---

어노테이션(Annotation)은 자바 5에서 도입된 메타데이터 표기 수단으로, 코드 자체의 동작은 바꾸지 않고 컴파일러·런타임 도구·프레임워크가 해석해 부가 동작을 수행할 수 있도록 정보를 제공하는 역할을 한다.

- `@Override`, `@Deprecated`처럼 컴파일러에 신호를 주는 경우
- `@Transactional`, `@Autowired`처럼 런타임 프레임워크가 동작을 결정하는 경우
- `@Getter`, `@Builder`처럼 컴파일 도중 코드를 생성하는 경우

어떤 경우든 어노테이션 그 자체는 표시에 불과하며, 의미는 반드시 누군가가 읽어 해석해야 발생한다.

## 어노테이션의 본질

가장 단순한 마커 어노테이션은 다음과 같이 정의된다.

```java
public @interface Test {

}
```

위 정의만으로는 `@Test`를 메서드에 붙여도 아무 일도 일어나지 않는다. 의미를 부여하려면 두 가지 중 하나가 필요하다.

1. 컴파일러나 어노테이션 프로세서가 인식해서 처리
2. 런타임에 리플렉션으로 읽어 동적으로 처리

이 두 처리 방식이 모두 가능하도록 자바는 어노테이션의 생존 범위를 `@Retention`으로, 부착 가능한 위치를 `@Target`으로 제어하게 한다.

## 메타 어노테이션

어노테이션을 정의할 때 사용하는 어노테이션이다.

|     어노테이션     |                 역할                 |
|:-------------:|:----------------------------------:|
| `@Retention`  |  어디까지 유지될지 (SOURCE/CLASS/RUNTIME)  |
|   `@Target`   | 어디에 붙일 수 있는지 (TYPE/METHOD/FIELD 등) |
| `@Documented` |           Javadoc 포함 여부            |
| `@Inherited`  |        하위 클래스가 어노테이션을 상속받는지        |
| `@Repeatable` |       같은 어노테이션 여러 번 부착 가능 여부       |

## @Retention 세 가지 정책

자바 코드는 소스(`.java`) → 바이트코드(`.class`) → JVM 메모리 → 런타임 실행 순서로 처리되고, `@Retention`은 어노테이션 정보가 이 흐름의 어느 지점까지 살아남는지를 결정한다.

|     정책     |        유지 범위         |       용도        |                       예시                        |
|:----------:|:--------------------:|:---------------:|:-----------------------------------------------:|
|   SOURCE   |      컴파일 시점에 제거      |     컴파일러 힌트     |        `@Override`, `@SuppressWarnings`         |
| CLASS(기본값) | `.class`까지 유지, 런타임 X | 컴파일 후 바이트코드 후처리 |                  Lombok 등이 활용                   |
|  RUNTIME   |       런타임에도 유지       | 리플렉션으로 읽어 동적 처리 | `@Transactional`, `@Autowired`, JPA `@Entity` 등 |

|        단계         | SOURCE | CLASS | RUNTIME |
|:-----------------:|:------:|:-----:|:-------:|
|  `.java` 컴파일 시점   |   O    |   O   |    O    |
|  `.class` 바이트코드   |   X    |   O   |    O    |
| JVM 메모리 (리플렉션 가능) |   X    |   X   |    O    |

### SOURCE

컴파일러가 검증·경고에만 사용하고 `.class` 파일에는 기록하지 않는다.

- 바이트코드를 `javap -v`로 열어 봐도 흔적이 없음
- 런타임에 `getAnnotation()`을 호출해도 `null` 반환
- `@Override`는 메서드가 부모를 실제로 오버라이드하는지 컴파일러가 확인하는 용도이며, 검증이 끝나면 정보가 사라짐

### CLASS

`.class` 파일에는 기록되지만 클래스 로더가 JVM 메모리에 올릴 때 떨어진다.

- jar에는 들어 있으나 런타임 리플렉션으로 접근 불가
- ASM·ByteBuddy 같은 바이트코드 조작 라이브러리가 이 정보를 활용
- 명시하지 않으면 기본값이 CLASS이므로, 런타임에서 다루려면 RUNTIME을 명시적으로 지정해야 함

### RUNTIME

실행 중 메모리에도 남아 있어 리플렉션 API로 읽을 수 있다.

- 스프링 컨테이너가 기동 시 빈 클래스를 리플렉션으로 검사해 `@Transactional`이 보이면 프록시로 감싸 트랜잭션 시작·커밋 로직을 끼워넣는 동작이 가능한 이유
- JPA가 `@Entity`·`@Column`을 읽어 엔티티-테이블 매핑을 구성하는 것도 RUNTIME 정보가 메모리에 살아 있기 때문

## 어노테이션 처리 방식

어노테이션을 실제 동작으로 연결하는 방법은 크게 두 가지로 갈린다.

### 1. 런타임 리플렉션

`RetentionPolicy.RUNTIME`으로 유지된 어노테이션을 실행 중에 리플렉션 API로 읽어 처리한다.

```java
class TransactionInterceptor {

    void invoke(Object target, Method method, Object[] args) throws Throwable {
        if (method.isAnnotationPresent(Transactional.class)) {
            Transactional anno = method.getAnnotation(Transactional.class);
            Propagation propagation = anno.propagation();
            // 트랜잭션 시작 → 메서드 호출 → 커밋/롤백
        }
        method.invoke(target, args);
    }
}
```

스프링은 컨테이너 기동 시 모든 빈 클래스의 메서드를 리플렉션으로 훑어 어노테이션을 검사하고, 매칭되면 프록시로 감싸 부가 동작을 끼워 넣는다.

|   장점   |      단점      |
|:------:|:------------:|
| 동적·유연  |    런타임 비용    |
| 설정 불필요 | 컴파일 타임 검증 불가 |

### 2. 컴파일 타임 어노테이션 프로세서 (APT)

`javac`의 어노테이션 프로세싱 단계에 후킹해서 컴파일 도중 추가 코드를 생성하거나 AST(추상 구문 트리)를 수정한다.

|    도구     |                     역할                      |
|:---------:|:-------------------------------------------:|
|  Lombok   | AST 직접 조작 — getter/setter/equals 등을 클래스에 삽입 |
| MapStruct |       DTO ↔ Entity 변환 구현체를 별도 클래스로 생성       |
| QueryDSL  |           `@Entity`를 읽어 Q 클래스 생성            |
|  Dagger   |               DI 코드 컴파일 타임 생성               |

|      장점       |      단점      |
|:-------------:|:------------:|
|   런타임 비용 0    | IDE/빌드 설정 필요 |
| 컴파일 시점 오류 검출  |  디버깅이 까다로움   |
| 생성된 코드를 확인 가능 | 프로세서 자체가 복잡  |

빌드 도구에서는 `annotationProcessor` 의존성으로 등록한다.

```kotlin
dependencies {
    compileOnly("org.projectlombok:lombok:1.18.30")
    annotationProcessor("org.projectlombok:lombok:1.18.30")
}
```

## AST와 Lombok의 동작

AST(Abstract Syntax Tree, 추상 구문 트리)는 컴파일러가 소스 코드를 파싱해 만드는 트리 구조의 중간 표현이다.

- 컴파일은 소스 → 토큰화 → 파싱 → AST → 타입 체크 → 바이트코드 순서로 진행
- AST는 코드의 구문 구조(연산자 우선순위, 클래스 멤버 구성 등)를 트리 형태로 표현한 것

예시: `int x = a + b * 2;`

```
       =
      / \
     x   +
        / \
       a   *
          / \
         b   2
```

### Lombok의 차별점

대부분의 어노테이션 프로세서은 새 `.java` 파일을 생성하는 방식이라 기존 코드를 건드리지 않지만, Lombok은 비공식 API로 컴파일러가 만든 기존 클래스의 AST에 메서드 노드를 직접 삽입한다.

```
@Getter 붙은 User 클래스
   │
   ▼ (javac가 파싱해 AST 생성)
Class: User
└── Field: name

   ▼ (Lombok이 어노테이션 프로세싱 단계에 끼어들어 AST 수정), com.sun.tools.javac.tree.JCTree 비공식 API로 getName() 노드 삽입
Class: User
├── Field: name
└── Method: getName()  ← Lombok이 삽입한 새 노드

   ▼ (컴파일러가 수정된 AST를 바이트코드로 변환)
User.class — getName()이 포함됨
```

컴파일러는 자신이 만든 AST가 외부에서 수정되었는지 의식하지 않고 그대로 바이트코드로 변환한다.

- 결과적으로 `.class`에는 마치 소스에 직접 작성한 것처럼 메서드 생성
- 이 방식 때문에 IDE가 직접 보지 못하는 메서드가 빌드 결과에는 존재하는 비대칭 발생
    - IntelliJ Lombok 플러그인 같은 보조 도구가 AST 조작을 인식해 IDE에도 메서드를 인식

## Lombok @Data를 지양하는 이유

`@Data`는 다음 어노테이션을 한꺼번에 적용하는 묶음 어노테이션이다.

```
@Getter + @Setter + @RequiredArgsConstructor + @ToString + @EqualsAndHashCode
```

편리해 보이지만 묶음의 각 요소가 모두 부작용을 동반하고, 한 어노테이션으로 묶여 있어 일부만 제외하는 것도 불가능하다.

### @Setter

모든 필드에 setter가 자동 생성되어 객체가 언제든 변경 가능한 상태가 된다.

- setter가 모두 노출되면 "어디서든 상태를 바꿀 수 있다"는 신호가 되어 응집도가 무너지고 변경 추적이 어려워짐
- 도메인 객체나 JPA 엔티티에서는 상태 변경을 의미를 가진 메서드(`changeName`, `markAsPaid`)로 표현하는 것이 자연스러움
- 외부 입력을 그대로 받아내는 DTO에서는 setter가 정당화될 수 있으나, 이 경우라도 `@Setter`를 명시적으로 붙이는 게 의도를 드러냄

### @EqualsAndHashCode

기본적으로 모든 필드를 사용해 `equals`·`hashCode`를 생성하는데, JPA 엔티티에 적용하면 다음과 같은 문제가 발생한다.

|       문제       |                                 설명                                  |
|:--------------:|:-------------------------------------------------------------------:|
| 양방향 연관관계 무한 루프 |           A↔B 참조 시 `equals`가 상호 호출되며 `StackOverflowError`           |
|  지연 로딩 강제 초기화  |                  비교 시점에 LAZY 필드를 건드려 의도치 않은 쿼리 발생                   |
|   컬렉션 키 불일치    | 필드 값이 변경되면서 `hashCode`가 바뀌어, 영속화 전에 `Set`·`Map`에 넣어둔 객체를 더 이상 찾지 못함 |

엔티티의 `equals`·`hashCode`는 비즈니스 식별자(주문 번호, 사번 등) 기준으로 직접 작성하는 것이 안전하다.

### @ToString

전 필드 toString도 양방향 연관관계에서 무한 루프를 일으키며, 비밀번호·토큰·주민번호 같은 민감 필드까지 그대로 로그에 찍힐 위험이 있다.

- 양방향 관계가 있는 경우 `@ToString.Exclude`로 반대편 필드를 제외
- 민감 필드는 처음부터 `@ToString(of = {"id", "name"})`로 노출 대상을 화이트리스트화
