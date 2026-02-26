---
title: "Exception Handling"
date: 2024-03-07
lastUpdated: 2025-08-23
tags: [Spring]
description: ""
---

## 스프링의 기본적인 예외 처리 방법

스프링에서 컨트롤러에서 예외가 발생하면 호출 스택을 타고 `DispatcherServlet`까지 전파되면서, `DispatcherServlet`은 아래 순서로 예외를 처리한다.

1. DispatcherServlet 감지
2. HandlerExceptionResolver 체인 처리
3. 로컬 @ExceptionHandler
4. 전역 @ControllerAdvice
5. 기본 Resolver로 처리
6. 미해결 시 서블릿 컨테이너의 오류 경로(`/error`)로 위임되어 `BasicErrorController`가 처리

## HandlerExceptionResolver 체인

스프링에서는 `DispatcherServlet`가 관리하는 `HandlerExceptionResolver`라는 인터페이스를 제공하며, 예외 처리시 아래 우선 순위에 따라 연결된 Resolver들을 호출한다.

1. `ExceptionHandlerExceptionResolver`: @ExceptionHandler 메서드를 탐색해 호출
2. `ResponseStatusExceptionResolver`: @ResponseStatus 애노테이션 또는 ResponseStatusException 처리
3. `DefaultHandlerExceptionResolver`: 표준 Spring MVC 예외를 적절한 상태 코드로 변환

## ExceptionHandlerExceptionResolver

`@ExceptionHandler` 메서드를 선언해 유연하게 에러를 처리할 수 있는 방법으로, 가장 많이 사용되는 예외 처리 방법이다.

```java

@RestController
@RequestMapping("/orders")
public class OrderController {

    @GetMapping("/{id}")
    public Order find(@PathVariable Long id) {
        if (id < 0)
            throw new IllegalArgumentException("invalid id");
        throw new OrderNotFoundException(id);
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<Map<String, Object>> notFound(OrderNotFoundException e, HttpServletRequest req) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", "ORDER_NOT_FOUND");
        body.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> badRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}
```

- @ExceptionHandler 메서드는 컨트롤러 내부에 위치하며, 지정한 예외 타입을 처리
- 메서드 매개변수로 예외 객체, HttpServletRequest, HttpServletResponse, Model 등을 받을 수 있음
- 반환 타입은 ResponseEntity, ModelAndView, 단순 객체 등 다양하게 지정 가능
- 상속 관계에 있는 예외는 가장 구체적인 타입의 핸들러가 우선 호출

### @ControllerAdvice(@RestControllerAdvice)

@ControllerAdvice로 전역 규칙을 구성하면 관리 비용을 줄일 수 있다.(@RestControllerAdvice는 @ResponseBody를 포함해 응답을 본문으로 직렬화)

```java
// @RestController 애노테이션이 적용된 컨트롤러에만 적용
@ControllerAdvice(annotations = RestController.class)
public class ExampleAdvice1 {

}

// 특정 패키지와 하위에 있는 컨트롤러에만 적용
@ControllerAdvice("org.example.controllers")
public class ExampleAdvice2 {

}

// 특정 클래스에만 적용
@ControllerAdvice(assignableTypes = {ControllerInterface.class, AbstractController.class})
public class ExampleAdvice3 {

}
```

- ExceptionHandlerExceptionResolver가 애플리케이션 컨텍스트의 @ControllerAdvice 빈을 스캔
- 스코프(basePackages, basePackageClasses, annotations)가 일치하는 컨트롤러 요청에 적용
- 동일 예외에 대해 로컬 @ExceptionHandler(컨트롤러 내부)가 존재하면 로컬 핸들러가 우선
- 여러 Advice가 동시에 매칭되면 @Order/Ordered 우선순위에 따라 선택

###### 참고자료

- [스프링 MVC 2편 - 백엔드 웹 개발 활용 기술](https://www.inflearn.com/course/스프링-mvc-2)
- [망나니개발자 티스토리](https://mangkyu.tistory.com/204)
