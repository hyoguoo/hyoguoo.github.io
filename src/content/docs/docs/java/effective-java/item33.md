---
title: "Type Safe Heterogeneous Container"
date: 2024-03-07
lastUpdated: 2024-06-05
---

> 타입 안전 이종 컨테이너를 고려하라

제네릭은 `Set`, `Map` 같은 컬렉션과 `ThreadLocal`, `AtomicReference` 같은 단일 원소 컨테이너에도 자주 사용된다.  
보통은 하나(`Set`) 혹은 두 개(`Map`)의 타입 매개변수가 사용되지만, 때로는 세 개 이상의 임의 개수가 필요한 경우가 있다.

## 타입 안전 이종 컨테이너(type safe heterogeneous container)

타입 안전 이종 컨테이너 패턴을 이용하여 임의 타입의 원소를 저장하고 검색할 수 있는 컨테이너를 만들 수 있다.  
컨테이너 대신 키를 매개변수화한 뒤, 컨테이너에 값을 넣거나 뺄 때 매개변수화한 키를 함께 제공하는 방식으로  
이렇게 하면 제네릭 타입 시스템이 값의 타입이 키와 같음을 보장하게 된다.

각 타입의 Class 객체를 매개변수화한 키 역할로 사용할 수 있는데, 이 방식이 동작하는 이유는 class의 클래스가 제네릭이기 때문이다.  
예시로 아래의 `Favorites`라는 클래스를 보자.

```java
class Favorites {

    private final Map<Class<?>, Object> favorites = new HashMap<>();

    // 클래스의 리터럴 타입은 Class가 아닌 Class<T>로 표현할 수 있다.(= 타입 토큰)
    public <T> void putFavorite(Class<T> type, T instance) {
        // Class 객체와 인스턴스를 매핑하여 저장, 키와 값 사이의 타입 관계가 소멸되지만 논리적으로는 보장된다.
        favorites.put(Objects.requireNonNull(type), instance);
    }

    public <T> T getFavorite(Class<T> type) {
        // favorites.get(type)로 Class 객체를 통해 인스턴스를 가져온 뒤, 타입 캐스팅하여 반환
        // * cast 메서드: 형변환 연산자의 동적 버전으로, 타입의 인스턴스인지 확인한 뒤 인스턴스를 T 타입으로 반환(실패 시 ClassCastException 발생)
        return type.cast(favorites.get(type));
    }
}

class Main {

    public static void main(String[] args) {
        Favorites f = new Favorites();
        f.putFavorite(String.class, "Java"); // String 클래스 타입 -> Class<String>
        f.putFavorite(Integer.class, 0xeee); // Integer 클래스 타입 -> Class<Integer>
        f.putFavorite(Class.class, Favorites.class); // Class 클래스 타입 -> Class<Class>
        String favoriteString = f.getFavorite(String.class);
        int favoriteInteger = f.getFavorite(Integer.class);
        Class<?> favoriteClass = f.getFavorite(Class.class);
        System.out.printf("%s %x %s", favoriteString, favoriteInteger, favoriteClass.getName());
    }
}
```

Favorite에서 `Map<Class<?>, Object>`를 사용하고 있으며, 그 특징은 다음과 같다.

- Key(`Class<?>`): 클래스 리터럴로, 특정 클래스로 제한하지 않고, 모든 클래스를 허용한다.
- Value(`Object`): 클래스의 인스턴스이며, Object로 제한하지 않고, 모든 클래스를 허용한다.
- Value가 단순 `Object`이기 때문에 키와 값 사이에 타입 관계를 보증하지 않지만, 논리적으로는 키와 값의 타입 관계가 보장된다.

`?`(비한정적 와일드카드 타입)가 존재하여 이라 아무것도 넣을 수 없는 것처럼 보이지만,  
와일드카드 타입이 중첩(nested)되어 있기 때문에 맵이 아니라 키가 와일드카드 타입이므로 `Class<?>`는 모든 클래스를 허용하는 타입이 된다.

## 타입 안전 이종 컨테이너의 제약 사항

타입 안전 이종 컨테이너 패턴은 임의 타입의 원소를 저장하고 검색할 수 있지만, 제약 사항이 존재한다.

### 1. 악의적인 클라이언트

악의적으로 Class 객체를 제네릭이 아닌 타입으로 넘기면 문제가 발생할 수 있다.(컴파일 시 비검사 경고 발생)

```java
class Main {

    public static void main(String[] args) {
        Favorites f = new Favorites();
        f.putFavorite((Class) Integer.class, "Java"); // 강제로 Class<Integer>를 Class로 형변환하여 넘김
        int favoriteInteger = f.getFavorite(Integer.class); // ClassCastException 발생
    }
}
```

### 2. [실체화 불가 타입](item28) 사용 불가

`String` / `String[]` 에는 적용 가능하나 `List<String>` 같은 실체화 불가 타입은 Class 객체를 얻을 수 없어 문법 오류가 난다.  
`List.class`가 허용된다면, `List<Integer>`와 `List<String>`이 같은 Class 객체를 공유하게 되어 구분할 수 없게 되기 때문이다.  
([슈퍼 타입 토큰](https://gafter.blogspot.com/2007/05/limitation-of-super-type-tokens.html)이라는 방법으로 우회 가능 하나 한계가 존재한다.)

## 한정적 타입 토큰(bounded type token)

위에서 구현한 `Favorites` 클래스는 비한정적 와일드카드 타입을 사용하고 있기 때문에 모든 클래스를 허용한다.  
특정 클래스만 허용하고 싶다면 한정적 타입 토큰을 사용하면 된다.(어노테이션 API에서 한정적 타입 토큰을 사용하고 있다.)

```java
public interface AnnotatedElement {
    <T extends Annotation> T getAnnotation(Class<T> annotationClass);
}
```

`<T extends Annotation>`로 선언하여 어노테이션 타입만 허용하여 사용하고 있다.  
이 메서드를 그대로 사용하면 `? extends Annotation`으로 형변환하게 되어 비검사 형변환을 하게 되므로 컴파일 경고가 발생한다.  
다른 메서드를 추가적으로 사용하면서 한정적 타입 토큰을 안전하게 사용하는 방법은 다음과 같다.

```java
class Example {

    static Annotation getAnnotation(AnnotatedElement element, String annotationTypeName) {
        Class<?> annotationType = null; // 비 한정적 타입 토큰
        try {
            annotationType = Class.forName(annotationTypeName); // 호출된 인스턴스 자신의 Class 객체를 명시한 클래스로 형변환
        } catch (Exception ex) {
            throw new IllegalArgumentException(ex); // 예외 발생 시 실패
        }

        return element.getAnnotation(annotationType.asSubclass(Annotation.class));
    }
}
```
