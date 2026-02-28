---
title: "Message Converter"
date: 2024-03-07
lastUpdated: 2025-08-26
tags: [Spring]
description: "HttpMessageConverter 인터페이스의 역할과 주요 구현체, 요청 본문 역직렬화와 응답 직렬화 처리 흐름을 분석한다."
---

뷰 템플릿이나 정적 컨텐츠를 응답하는 것이 아니라, JSON, XML 또는 사용자 지정 형식과 같은 다양한 형식의 데이터를 교환하는 작업이 필요할 때 메시지 컨버터를 사용할 수 있다.

- HTTP 요청: `@RequestBody`, `HttpEntity`, `RequestEntity`
- HTTP 응답: `@ResponseBody`, `HttpEntity`, `ResponseEntity`

Spring MVC에선 위의 경우 메시지 컨버터를 사용하여 HTTP 요청 본문을 자바 객체로 변환하거나, 자바 객체를 HTTP 응답 본문으로 직렬화한다.

## ViewResolver와 MessageConverter 비교

|    구분    | ViewResolver                       | MessageConverter                                             |
|:--------:|:-----------------------------------|:-------------------------------------------------------------|
|    목적    | 논리적 뷰 이름을 실제 뷰로 해석                 | HTTP 본문을 객체로 변환하거나 객체를 본문으로 직렬화                              |
|  동작 시점   | 컨트롤러 반환값이 뷰 이름일 때                  | @RequestBody, @ResponseBody, HttpEntity, ResponseEntity 사용 시 |
| 입력/출력 대상 | JSP, Thymeleaf, FreeMarker 등 템플릿 뷰 | JSON, XML, 문자열, 바이트 등 데이터 형식                                 |
| 주된 사용 예시 | HTML 페이지 렌더링                       | REST API 요청/응답 처리                                            |

## HTTP 메시지 컨버터 인터페이스

메시지 컨버터는 다음 인터페이스를 기반으로 동작하며, 읽기와 쓰기 기능을 정의한다.

```java
package org.springframework.http.converter;

public interface HttpMessageConverter<T> {

    boolean canRead(Class<?> clazz, @Nullable MediaType mediaType);

    boolean canWrite(Class<?> clazz, @Nullable MediaType mediaType);

    List<MediaType> getSupportedMediaTypes();

    T read(Class<? extends T> clazz, HttpInputMessage inputMessage)
            throws IOException, HttpMessageNotReadableException;

    void write(T t, @Nullable MediaType contentType, HttpOutputMessage outputMessage)
            throws IOException, HttpMessageNotWritableException;
}
```

- `canRead()` / `canWrite()`: 메시지 컨버터가 해당 클래스, 미디어 타입을 지원하는지 확인
- `read()` / `write()`: 메시지 컨버터를 통해서 메시지를 읽고 쓰는 기능

### 주요 구현체

인터페이스를 구현한 다양한 메시지 컨버터가 존재하며, 대표적인 구현체는 다음과 같다.

| 구현체                                    | 설명                                           |
|:---------------------------------------|:---------------------------------------------|
| ByteArrayHttpMessageConverter          | 바이트 배열 지원, 파일 다운로드나 이미지 응답에 활용               |
| StringHttpMessageConverter             | 문자열 데이터 지원                                   |
| MappingJackson2HttpMessageConverter    | JSON 직렬화와 역직렬화                               |
| MappingJackson2XmlHttpMessageConverter | XML 처리 지원                                    |
| FormHttpMessageConverter               | application/x-www-form-urlencoded 요청 및 응답 처리 |

## 스프링 부트 기본 메시지 컨버터

스프링 부트에서는 다양한 메시지 컨버터를 제공하는데, 클래스 타입과 미디어 타입을 체크하여 사용여부를 체크하게 되며, 우선 순위는 다음과 같다.

1. `ByteArrayHttpMessageConverter`: `byte[]` 데이터 처리
2. `StringHttpMessageConverter`: `String` 문자로 데이터 처리
3. `MappingJackson2HttpMessageConverter`: `application/json` 처리

## HTTP 요청 데이터 읽기 및 응답 데이터 생성 과정

1. 메시지 컨버터가 메시지를 읽을 수 있는지 확인하기 위해 `canRead()` 호출
    - 대상 클래스 타입을 지원하는지, HTTP 요청의 Content-Type 미디어 타입을 지원하는지 확인
2. `canRead()` 조건을 만족하는 경우 `read()` 호출하여 객체를 생성하고 반환
3. 컨트롤러 로직 실행
4. 메시지 컨버터가 메시지를 쓸 수 있는지 확인하기 위해 `canWrite()` 호출
    - 대상 클래스 타입을 지원하는지, HTTP 응답의 Content-Type 미디어 타입을 지원하는지 확인
5. `canWrite()` 조건을 만족하는 경우 `write()` 호출하여 HTTP 응답 메시지 바디에 데이터 생성

###### 참고자료

- [스프링 MVC 1편 - 백엔드 웹 개발 핵심 기술](https://www.inflearn.com/course/스프링-mvc-1)
