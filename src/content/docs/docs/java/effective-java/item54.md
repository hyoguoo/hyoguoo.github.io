---
title: "Empty Collection"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> null이 아닌, 빈 컬렉션이나 배열을 반환하라

코드를 작성하다보면 컬렉션이 빈 경우 null을 반환하는 경우를 종종 볼 수 있다.

```java
class Example {

    private final List<String> list = new ArrayList<>();

    public List<String> getList() {
        return list.isEmpty()
                ? null
                : new ArrayList<>(list);
    }

    public static void main(String[] args) {
        Example example = new Example();
        List<String> list = example.getList();
        if (list != null) {
            System.out.println(list.size());
        }
    }
}
```

빈 경우에 null을 반환하게 되면 클라이언트 코드에서는 불필요하게 null 체크를 해야하고, 이는 코드 가독성을 떨어뜨리고 오류를 유발할 수 있다.  
해결책은 아주 간단하게 빈 컬렉션을 반환하면 된다.

```java
class Example {

    private final List<String> list = new ArrayList<>();

    public List<String> getList() {
        return list.isEmpty()
                ? Collections.emptyList()
                : new ArrayList<>(list);
    }

    private static final String[] EMPTY_ARRAY = new String[0]; // 길이가 0인 배열은 모두 불변이기 때문에 재사용 가능

    // 배열을 반환해야 하는 경우
    public String[] getArray() {
        return list.toArray(EMPTY_ARRAY);
    }
}
```

빈 배열을 반환해야하는 경우에도 null을 반환하지 말고 `toArray` 메서드에 빈 배열을 인수로 전달하면 된다.  
(예시 코드에서는 `EMPTY_ARRAY`를 미리 선언하여 사용해 성능 저하를 방지했다.)
