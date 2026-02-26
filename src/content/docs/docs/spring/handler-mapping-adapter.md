---
title: "HandlerMapping & HandlerAdapter(핸들러 매핑 & 핸들러 어댑터)"
date: 2024-03-07
lastUpdated: 2025-08-25
---

HandlerMapping 및 HandlerAdapter는 들어오는 HTTP 요청을 처리하고 적절한 Controller 메서드에 매핑하는 MVC 프레임워크의 중요한 역할을 한다.  
HTTP 요청을 처리하기 위한 유연하고 확장 가능한 메커니즘을 제공한다.

## 요청 처리 흐름

1. DispatcherServlet이 요청을 수신
2. 등록된 HandlerMapping 빈을 우선 순위 순서로 순회하여 getHandler 호출
3. 일치하는 핸들러가 있으면 HandlerExecutionChain을 반환(해당 체인은 핸들러와 적용될 인터셉터 목록을 포함하고 있음)
4. DispatcherServlet은 등록된 HandlerAdapter 목록에서 supports(handler)가 true인 어댑터를 선택
5. 선택된 HandlerAdapter가 컨트롤러 메서드 호출
6. 반환값을 모델이나 응답 본문으로 변환하고, 필요 시 ViewResolver로 뷰를 찾아 렌더링
7. 인터셉터의 postHandle, afterCompletion 콜백이 순서에 맞게 실행

## HandlerMapping

들어오는 요청의 URL을 분석하여 적절한 컨트롤러(처리할 수 있는 핸들러) 메서드를 찾아 매핑하는 역할을 한다.

### 구현체와 우선 순위

HandlerMapping은 여러 구현체가 있지만, 스프링 MVC에서는 아래의 구현체 외에도 여러 구현체를 제공하며, 주로 `RequestMappingHandlerMapping`을 사용한다.

|             구현체              |                                          설명                                           | 우선 순위 |
|:----------------------------:|:-------------------------------------------------------------------------------------:|------:|
| RequestMappingHandlerMapping | @Controller, @RequestMapping, @GetMapping 등 요청 URL을 처리할 컨트롤러 Annotation 중 일치하는 핸들러 매핑 |     0 |
|  BeanNameUrlHandlerMapping   |                           스프링 빈의 이름 중 요청 URL과 일치하는 핸들러를 매핑                            |     1 |

## HandlerAdapter

요청을 컨트롤러 메서드에 적용하는 역할로 HandlerMapping이 찾아낸 핸들러를 실제로 호출 가능하도록 준비하고 실행한다.

- 지원 여부 판단: supports(handler) 메서드로 특정 핸들러를 처리할 수 있는지 자체적으로 판단
- 인자 해석 / 데이터 바인딩·검증: 메서드 파라미터를 해석하고, 요청 파라미터, 경로 변수, 요청 본문 등에서 값을 추출해 바인딩
- 반환값 처리: 메서드의 반환 타입에 따라 모델과 뷰, 응답 본문 등을 적절히 처리

### 구현체와 우선 순위

HandlerAdapter는 대표적으로 아래의 구현체가 있으며, 스프링 MVC에서는 아래의 구현체 외에도 여러 구현체를 제공하며, 주로 `RequestMappingHandlerAdapter`을 사용한다.

|              구현체               |                   설명                    | 우선 순위 |
|:------------------------------:|:---------------------------------------:|------:|
|  RequestMappingHandlerAdapter  |  애노테이션 기반의 컨트롤러인 @RequestMapping 에서 사용  |     0 |
|   HttpRequestHandlerAdapter    | HttpRequestHandler 인터페이스를 구현한 컨트롤러에서 사용 |     1 |
| SimpleControllerHandlerAdapter |     Controller 인터페이스를 구현한 컨트롤러에서 사용     |     2 |

###### 참고자료

- [스프링 MVC 1편 - 백엔드 웹 개발 핵심 기술](https://www.inflearn.com/course/스프링-mvc-1)