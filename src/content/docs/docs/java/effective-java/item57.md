---
title: "Local Variable Scope"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> 지역변수 범위를 최소화하라

지역변수 범위 최소화는 [클래스와 멤버의 접근 관훤을 최소화하라](/docs/java/effective-java/item15/)는 원칙과 같은 원리로, 유효 범위를 최소로 줄이면서 가독성과 유지보수성을 높이기 위함이다.

## 지역변수 범위를 최소화하는 방법

- 가장 처음 쓰일 때 선언
- 가능한한 선언과 동시에 초기화
- 반복문 사용 시 내부 변수를 외부에서 사용해야하는 것이 아니라면 while문보다 for문을 사용
- 메서드를 작게 유지하고 한 가지 기능에 집중(기능별로 쪼개기)

이중 while문보다 for문을 사용하는 것이 나은 이유는 아래 예시 코드로 알 수 있는데, 결국 변수 유효 범위를 최소화되기 때문에 의도치 않은 변수 사용을 방지할 수 있다.

```java
class Example {

    public static void main(String[] args) {

        // for-each 문
        for (Element e : c) {
            doSomething(e);
        }

        // 반복자가 필요한 경우 for문 사용 
        for (Iterator<Element> i = c.iterator(); i.hasNext(); ) {
            Element e = i.next();
            doSomething(e, i);
        }

        // while문 사용 시..
        Iterator<Element> i = c.iterator();
        while (i.hasNext()) {
            doSomething(i.next());
        }

        Iterator<Element> i2 = c.iterator();
        while (i.hasNext()) { // 이미 순회한 i를 다시 순회 시도
            doSomething(i2.next()); // 실행되지 않음
        }
    }
}
```
