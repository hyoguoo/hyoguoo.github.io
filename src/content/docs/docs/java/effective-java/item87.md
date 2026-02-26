---
title: "Custom Serialization Form"
date: 2024-08-21
lastUpdated: 2024-08-21
tags: [Java]
description: ""
---

> 커스텀 직렬화 형태를 고려해보라

직렬화를 꼭 사용해야하고, 기본 직렬화 형태를 사용할 수 있는 경우는 다음과 같다.  
(기본 직렬화 형태가 적합하더라도 불변식 보장과 보안을 위해 `readObject` 메서드를 제공하는 것이 좋다.)

- 직접 설계했을 때, 기본 직렬화 형태와 거의 같은 결과가 나올 경우
- 객체의 물리적 표현과 논리적 내용이 같은 경우

반대로 기본 직렬화 형태가 적합하지 않은 클래스의 예는 다음과 같다.

```java
public final class StringList implements Serializable {

    private int size = 0;
    private Entry head = null;

    private static class Entry implements Serializable {

        String data;
        Entry next;
        Entry previous;
    }

    // ...
}
```

위 클래스는 다음과 같은 특징을 가지고 있다.

- 논리적: 일련의 문자열을 표현
- 물리적: 문자열들을 연결 리스트로 연결하여, 각 노드의 양방형 연결 정보가 기록 됨

이처럼 물리적/논리적 표현에 차이가 존재할 때 기본 직렬화 형태를 사용하면 네 가지 면에서 문제가 발생한다.

1. 공개 API가 현재 내부 표현 방식에 묶임: 내부 구현 방식으로 연결 리스트를 사용하지 않더라도 해당 코드를 제거할 수 없음
2. 불필요한 공간 차지: 값 데이터 뿐만 아니라, 내부 구현인 연결 정보까지 직렬화되어 저장되어 불필요한 공간 차지
3. 불필요한 시간 소모: 객체의 모든 필드를 순회하면서 그 객체가 참조하는 있는 다른 객체들도 직렬화 하는데, 객체 그래프의 위상에 대한 정보가 없어 직렬화에 많은 시간이 소요됨
4. 스택 오버플로우: 기본 직렬화 과정은 객체 그래프를 재귀 순회하는데, 그 과정에서 스택 오버플로우가 발생할 수 있음

때문에 기본 직렬화 방식은 피하는 것이 좋은데, 위 예시 클래스의 합리적인 직렬화 형태는 다음과 같이 구현해 볼 수 있다.

```java
public final class StringList implements Serializable {

    // transient 키워드를 사용하여 직렬화 대상에서 제외
    // transient 키워드를 사용하면 해당 필드들은 역직렬화될 때 해당 타입의 기본값으로 초기화됨
    private transient int size = 0;
    private transient Entry head = null;

    // Serializable 인터페이스를 없애 Entry 클래스를 직렬화 대상에서 제외
    private static class Entry {

        String data;
        Entry next;
        Entry previous;
    }

    // 지정한 문자열을 리스트에 추가
    public final void add(String s) {
        // ...
    }

    private void writeObject(ObjectOutputStream s) throws IOException {
        s.defaultWriteObject();
        s.writeInt(size);

        // 모든 원소를 올바른 순서로 기록
        for (Entry e = head; e != null; e = e.next) {
            s.writeObject(e.data);
        }
    }

    private void readObject(ObjectInputStream s) throws IOException, ClassNotFoundException {
        s.defaultReadObject();
        int numElements = s.readInt();

        // 모든 원소를 읽어 리스트에 추가
        for (int i = 0; i < numElements; i++) {
            add((String) s.readObject());
        }
    }

    // ...
}
```

변경 된 주요 특징은 다음과 같다.

1. `size`, `head` 필드 `transient` 적용: 직렬화 대상에서 제외
2. `Entry` 클래스 `Serializable` 인터페이스 제거: 직렬화 대상에서 제외
3. `writeObject`, `readObject` 메서드 구현: 직렬화 형태를 커스텀하여 직렬화/역직렬화 수행
4. `defaultWriteObject`, `defaultReadObject` 메서드 호출: 향후 릴리스에서 `transient` 필드가 추가/제거 시 호환 가능

## 다른 자료구조 사용 시

사실 `StringList`의 기본 직렬화 형태도 문제가 많았지만, 더 많은 문제가 발생할 수 있는데, 해시테이블의 경우 다음과 같은 문제가 발생할 수 있다.

1. 해시테이블은 물리적으로 키-값 엔트리를 담은 해시 버킷을 차례로 나열한 형태로 저장
2. 어떤 엔트리를 어떤 버킷에 담을 지는 키에서 구한 해시코드로 결졍되는데, 계산할 때마다 달라지는 경우가 있음
3. 직렬화 후 역직렬화하면 다른 해시코드가 나오게 되어, 훼손된 객체가 생성될 수 있음

## 그 외 주의사항

- `transient` 키워드를 사용하면 해당 필드들은 역직렬화될 때 해당 타입의 기본값으로 초기화됨
- 클래스 내에서 동기화 메커니즘 사용하는 메서드 사용 시, `writeObject`, `readObject` 메서드에서도 동기화 메커니즘을 사용해야 함
- 직렬화 가능 클래스 모두에 직렬 버전 UID를 명시적으로 부여
    - 직렬 버전 UID가 일으키는 잠재적인 호환성 문제 해결 가능
    - 런타임에서 생성하는 시간 단축 가능
    - 기존 버전 클래스 호환성 유지 시 UID 유지 / 호환성 끊을 시 UID 변경
