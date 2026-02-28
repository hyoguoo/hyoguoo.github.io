---
title: "Validation"
date: 2023-06-15
lastUpdated: 2025-08-27
tags: [Spring]
description: "Bean Validation의 제약 어노테이션 동작 원리와 @Valid·@Validated의 차이, 그룹 검증을 활용한 상황별 유효성 검사 전략을 설명한다."
---

> Bean Validation은 특정한 구현체가 아니라 Bean Validation 2.0(JSR-380) 기술 표준

검증 로직을 모든 프로젝트에 적용할 수 있게 공통화 및 표준화 한 것으로, 이를 잘 활용하면, 애노테이션 하나(`@Valid` / `@Validated`)로 검증 로직을 매우 편리하게 적용할 수 있다.

```java
public class Example {

    @NotNull
    @Min(0)
    Integer example;
}
```

```java
public class Example {

    @PostMapping("/example")
    public String example(@Valid @ModelAttribute Example example, BindingResult bindingResult) {
        // ...

        return "example";
    }
}
```

## @Valid 동작 원리

JSR-303(자바) 표준 스펙으로, 빈 검증기(`Bean Validator`)를 이용해 제약 조건을 검증하며, 요청 데이터 소스에 따라 검증 흐름이 달라진다.

### ModelAttribute 바인딩(@ModelAttribute)

1. 프론트 컨트롤러가 컨트롤러로 전달
2. ArgumentResolver가 요청 파라미터를 바인딩하여 객체 생성
3. 파라미터에 @Valid가 있으면 Bean Validator로 검증 수행
4. 검증 실패 시 `BindingResult가` 있으면 오류를 담고 계속 진행(없으면 `MethodArgumentNotValidException` 예외 발생)

### 요청 본문 바인딩(@RequestBody)와 메시지 컨버터

1. HttpMessageConverter가 요청 본문(JSON 등)을 읽어 객체로 역직렬화
2. 파라미터에 @Valid가 있으면 역직렬화된 객체에 대해 검증 수행
3. 검증 실패 시 `MethodArgumentNotValidException` 예외 발생

### 검증 대상과 바인딩 소스 요약

|       구분        | 바인딩 소스         | 검증 시점           | 예외 처리                                                           |
|:---------------:|:---------------|:----------------|:----------------------------------------------------------------|
| @ModelAttribute | 쿼리 파라미터, 폼 데이터 | 데이터 바인딩 직후      | BindingResult 존재 시 오류 저장(없으면 `MethodArgumentNotValidException`) |
|  @RequestBody   | JSON, XML 등 본문 | 메시지 컨버터 역직렬화 직후 | `MethodArgumentNotValidException`                               |

## @Validated

Spring 프레임워크에서 제공하는 애노테이션으로, 컨트롤러가 아닌 곳에서도 검증을 수행할 수 있다.

```java

@Service
@Validated
public class ExampleService {

    public void example(@Valid Example example) {
        // ...
    }
}
```

사용하기 위해선 두 가지 선언이 필요하다.

- 컨트롤러가 아닌 곳에서 검증을 수행하려면 `@Validated` 클래스 레벨에 선언
- 검증을 수행하고자 하는 메서드에 파라미터에 `@Valid` 선언

### 그룹 검증

제약에 그룹을 부여해 상황별 규칙을 분리할 수 있다. 컨트롤러 · 서비스에서 @Validated(Create.class)처럼 그룹을 명시해 적용한다.

```java
public interface Create {

}

public interface Update {

}

public class Article {

    @NotNull(groups = Update.class)
    private Long id;

    @NotBlank(groups = {Create.class, Update.class})
    private String title;
}

@RestController
@RequestMapping("/articles")
public class ArticleController {

    @PostMapping
    public ResponseEntity<?> create(@Validated(Create.class) @RequestBody Article article) {
        // ...
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Validated(Update.class) @RequestBody Article article) {
        // ...
    }
}
```

### 동작 원리(클래스 레벨에 선언한 경우)

Validated는 AOP 기반으로 메서드 요청을 인터셉터하여 처리하게 된다.

1. 해당 클래스에 유효성 검증을 위한 인터셉터(MethodValidationInterceptor) 등록
2. 해당 클래스의 메서드들이 호출될 때 요청을 가로채서 유효성 검증 수행
3. 검증에 실패하면 `ConstraintViolationException` 예외 발생

## 오류 처리 패턴

컨트롤러 단에서는 BindingResult로 처리하거나, 전역 예외 처리에서 일관된 응답 포맷을 구성한다.

```java

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleInvalid(MethodArgumentNotValidException e) {
        List<Map<String, String>> errors = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> Map.of("field", fe.getField(), "message", fe.getDefaultMessage()))
                .toList();
        return ResponseEntity.badRequest().body(Map.of("errors", errors));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<?> handleViolation(ConstraintViolationException e) {
        List<Map<String, String>> errors = e.getConstraintViolations().stream()
                .map(v -> Map.of("property", v.getPropertyPath().toString(), "message", v.getMessage()))
                .toList();
        return ResponseEntity.badRequest().body(Map.of("errors", errors));
    }
}
```

## @Valid vs @Validated

|                 @Valid                  |              @Validated              |
|:---------------------------------------:|:------------------------------------:|
|              JSR-303 표준 스펙              |          Spring 프레임워크에서 제공           |
|        ArgumentResolver에서 검증을 수행        |           AOP 기반으로 검증을 수행            |
|               컨트롤러에서만 동작                |          컨트롤러가 아닌 모든 곳에서 동작          |
| `MethodArgumentNotValidException` 예외 발생 | `ConstraintViolationException` 예외 발생 |

###### 참고자료

- [망나니개발자 티스토리](https://mangkyu.tistory.com/174)