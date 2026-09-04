---
title: "this Binding"
date: 2026-09-04
lastUpdated: 2026-09-04
tags: [ Node.js ]
description: "JavaScript의 호출 시점에 결정되는 동적 this 바인딩 메커니즘과 화살표 함수의 렉시컬 스코프 특성을 정리한다."
---

## 동적 바인딩과 컨텍스트 유실

자바스크립트의 `this`는 타 언어 (Java 등)와 달리 선언된 위치가 아니라 '어떻게 호출되었는가'에 따라 결정된다.

- 실행 컨텍스트 분리: Node.js의 Express 라우터나 비동기 콜백에 클래스 메서드를 값으로 전달하면, 기존 객체와의 연결이 끊어지는 현상이 발생
- 런타임 참조 에러: 객체와 분리된 메서드가 나중에 단독으로 실행되면서 `this`가 초기화되어, 아래 코드처럼 참조 에러 (TypeError)를 유발

```javascript
// ❌ this 유실이 발생하는 상황
class UserController {
  constructor() {
    this.serviceName = "UserDB";
  }

  // 일반 함수로 선언된 메서드
  getUser(req, res) {
    console.log("접근 서비스:", this.serviceName); // TypeError: Cannot read property 'serviceName'
  }
}

const controller = new UserController();
const express = require('express');
const app = express();

// 라우터 콜백으로 메서드를 전달
app.get('/users', controller.getUser);
```

이는 자바스크립트 엔진이 넘겨받은 콜백을 실행할 때 `this`를 `undefined`로 덮어씌우기 때문에 일어나는 현상이다.

## 호출 방식에 따른 this 결정 규칙

자바스크립트의 일반 함수는 실행되는 순간의 호출 형태 (Call Site)를 보고 `this`를 동적으로 바인딩한다.

|  호출 형태  |      코드 예시      |           `this` 바인딩 대상            |
|:-----------:|:-------------------:|:---------------------------------------:|
|  단독 호출  |      `func()`       | 전역 객체 (엄격 모드에서는 `undefined`) |
| 메서드 호출 |    `obj.func()`     |     점(`.`) 바로 앞의 객체 (`obj`)      |
| 명시적 호출 | `func.call(target)` | 개발자가 강제로 지정한 객체 (`target`)  |

```javascript
const user = {
  name: "Alice",
  sayHi: function () {
    console.log(this.name);
  }
};

// 1. 메서드 호출: 점(.) 바로 앞의 user 객체가 this로 바인딩
user.sayHi(); // "Alice" 출력

// 2. 단독 호출: 함수 주소만 떼어내어 호출하면 this가 유실
const detachedFunc = user.sayHi;
detachedFunc(); // undefined 출력 (엄격 모드에서는 TypeError)

// 3. 명시적 호출: call()을 사용하여 this로 쓸 객체를 강제로 주입
const otherUser = {name: "Bob"};
detachedFunc.call(otherUser); // "Bob" 출력
```

## 콜백 전달 시 유실되는 원리

그렇다면 왜 위 코드에서 `this`가 유실된 이유는 메서드를 `obj.func()` 형태로 즉시 실행하지 않고 콜백으로 넘기면, 호출 순간의 컨텍스트 정보가 사라지기 때문이다.

- 참조의 분리: `app.get('/users', controller.getUser)` 코드는 점 실제로는 `controller` 를 버리고 `getUser`라는 함수의 메모리 주소값만 떼어내서 전달
- 단독 호출: 나중에 이벤트 루프가 클라이언트의 요청을 받고 이 핸들러를 실행할 때는 `controller` 없이 완전히 단독 호출 (`func()`) 형태로 실행하므로 규칙에 따라 `this`가 초기화

## 해결책 - 화살표 함수와 렉시컬 this

이러한 동적 바인딩의 혼란을 막기 위해 ES6에 도입된 화살표 함수 (Arrow Function)는 자신만의 `this`를 아예 만들지 않는다.

- 렉시컬 this: 화살표 함수 내부에서 `this`를 부르면 스코프 체인을 타고 올라가 자신이 선언될 당시 바깥쪽 환경 (클래스 인스턴스)의 `this`를 그대로 가져다 사용
- 영구 고정: 한 번 바깥 스코프의 `this`를 캡처하면 이후에 어떻게 호출되든 절대 변하지 않아 콜백으로 넘길 때 가장 안전

```javascript
// ✅ 화살표 함수를 활용한 안전한 컨텍스트 바인딩
class UserController {
  constructor() {
    this.serviceName = "UserDB";
  }

  // 화살표 함수로 선언된 메서드
  // 선언될 당시의 바깥 스코프(클래스 인스턴스)의 this를 정적으로 캡처함
  getUser = (req, res) => {
    // 나중에 단독 호출되어도 this는 무조건 controller 인스턴스를 가리킴
    console.log("접근 서비스:", this.serviceName); // "UserDB" 정상 출력
  };
}

const controller = new UserController();

// 함수만 떼어서 넘겨도 this가 클래스 인스턴스에 영구히 묶여있어 안전함
app.get('/users', controller.getUser);
```
