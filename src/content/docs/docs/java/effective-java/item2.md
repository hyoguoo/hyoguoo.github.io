---
title: "Builder"
date: 2023-09-21
lastUpdated: 2024-03-07
---
> 생성자에 매개변수가 많다면 빌더를 고려하라

[Item 1](/docs/java/effective-java/item1/)에서 소개 된 정적 팩터리 메서드와 public 생성자 둘 다 갖고있는 단점은 선택적 매개변수가 많을 때 적절히 대응하기 어렵다는 것이다.  
선택적 매개변수가 많아지면 그만큼 넘겨야 할 매개변수의 수도 늘어나게 되어 사용하기 불편해진다.  
먼저 빌더 패턴을 사용하지 않은 예시들을 살펴보면 다음과 같다.

## 빌더를 사용하지 않은 예시

### 전통적인 점층적 생성자 패턴(telescoping constructor pattern)

여러 생성자를 정의하고, 각각의 생성자에서는 필요한 매개변수만 받는 방식이다.

```java
class NutritionFacts {

    private final int servingSize;
    private final int servings;
    private final int calories;
    private final int fat;
    private final int sodium;
    private final int carbohydrate;

    public NutritionFacts(int servingSize, int servings) {
        this(servingSize, servings, 0);
    }

    public NutritionFacts(int servingSize, int servings, int calories) {
        this(servingSize, servings, calories, 0);
    }

    // ... parameters increase...

    public NutritionFacts(int servingSize, int servings, int calories, int fat, int sodium, int carbohydrate) {
        this.servingSize = servingSize;
        this.servings = servings;
        this.calories = calories;
        this.fat = fat;
        this.sodium = sodium;
        this.carbohydrate = carbohydrate;
    }
}

class Example {
    public static void main(String[] args) {
        NutritionFacts cocaCola = new NutritionFacts(240, 8, 100, 0, 35, 27);
    }
}
```

- 매개변수가 많아지면 해당 파라미터가 어떤 필드 값에 저장되는지, 몇 개의 매개변수가 어떤 순서로 전달되어야 하는지 알기 어려움
- 현재는 IDE가 식별하기 쉽게 어느정도 지원해주긴 하나 결국 컴파일 에러가 발생하지 않는 이상 의도하지 않은 값이 전달되거나 런타임에 오류가 발생할 수 있음

### 자바 빈즈(JavaBeans)

매개변수가 없는 생성자로 객체를 만든 후 setter 메서드들을 호출하여 값을 설정하는 방식이다.

```java
class NutritionFacts {

    private int servingSize = -1;
    private int servings = -1;
    private int calories = 0;
    private int fat = 0;
    private int sodium = 0;
    private int carbohydrate = 0;

    public NutritionFacts() {
    }

    public void setServingSize(int servingSize) {
        this.servingSize = servingSize;
    }

    // all setter methods...

    public void setCarbohydrate(int carbohydrate) {
        this.carbohydrate = carbohydrate;
    }
}

class Example {
    public static void main(String[] args) {
        NutritionFacts cocaCola = new NutritionFacts();
        cocaCola.setServingSize(240);
        cocaCola.setServings(8);
        cocaCola.setCalories(100);
        cocaCola.setSodium(35);
        cocaCola.setCarbohydrate(27);
    }
}
```

- 명시적으로 필드 이름을 호출하여 값을 설정할 수 있어 가독성 향상
- 하지만 객체 하나를 만들려면 메서드를 여러 개 호출해야 하고, 객체가 완전히 생성되기 전까지는 일관성(consistency)이 무너짐
- 모든 필드에 대해 setter 메서드가 열려있기 때문에 결국 클래스의 불변성을 보장할 수 없음

## 빌더 패턴

본문의 주제인 빌더 패턴은 위의 두 방식의 장점만 취하고 단점은 보완한 방식으로, 빌더 패턴이 동작되는 방식은 다음과 같다.

1. 필수 매개변수만으로 생성자(혹은 정적 팩터리 메서드)를 호출하여 빌더 객체를 얻음
2. 빌더 객체가 제공하는 일종의 세터 메서드들로 원하는 선택 매개변수들을 설정
3. 마지막으로 `build()` 메서드를 호출하여 필요한 객체를 얻음

빌더 객체의 메서드들은 모두 `this`를 반환하도록 구현하여 메서드 연쇄(method chaining) 방식을 사용할 수 있다.

```java
class NutritionFacts {

    private final int servingSize;
    private final int servings;
    private final int calories;
    private final int fat;
    private final int sodium;
    private final int carbohydrate;

    private NutritionFacts(Builder builder) {
        servingSize = builder.servingSize;
        servings = builder.servings;
        calories = builder.calories;
        fat = builder.fat;
        sodium = builder.sodium;
        carbohydrate = builder.carbohydrate;
    }

    /****** 빌더 클래스 ******/
    public static class Builder {

        // 필수 매개변수
        private final int servingSize;
        private final int servings;

        // 선택 매개변수 - 기본값으로 초기화
        private int calories = 0;
        private int fat = 0;
        private int sodium = 0;
        private int carbohydrate = 0;

        public Builder(int servingSize, int servings) {
            this.servingSize = servingSize;
            this.servings = servings;
        }

        public Builder calories(int val) {
            calories = val;
            return this;
        }

        public Builder fat(int val) {
            fat = val;
            return this;
        }

        public Builder sodium(int val) {
            sodium = val;
            return this;
        }

        public Builder carbohydrate(int val) {
            carbohydrate = val;
            return this;
        }

        // 빌더 객체를 통해 NutritionFacts 객체를 생성
        public NutritionFacts build() {
            return new NutritionFacts(this);
        }
    }
}

class Example {
    public static void main(String[] args) {
        NutritionFacts cocaCola = new NutritionFacts.Builder(240, 8) // 1. 필수 매개변수만으로 빌더 객체를 얻음
                .calories(100) // 2. 빌더 객체가 제공하는 일종의 세터 메서드들로 원하는 선택 매개변수들을 설정
                .sodium(35)
                .carbohydrate(27)
                .build(); // 3. 마지막으로 build() 메서드를 호출하여 필요한 객체를 얻음
    }
}
```

빌더 패턴은 특히 계층적으로 설계된 클래스와 함께 쓰기에 좋다.  
상위 계층을 추상 빌더가 포함된 클래스로 정의하고, 하위 클래스들은 추상 빌더를 상속받아 구현하도록 하면 된다.

```java
abstract class Pizza {

    final Set<Topping> toppings;

    Pizza(Builder<?> builder) {
        toppings = builder.toppings.clone();
    }

    public enum Topping {HAM, MUSHROOM, ONION, PEPPER, SAUSAGE}

    abstract static class Builder<T extends Builder<T>> {

        EnumSet<Topping> toppings = EnumSet.noneOf(Topping.class);

        public T addTopping(Topping topping) {
            toppings.add(Objects.requireNonNull(topping));
            return self();
        }

        abstract Pizza build();

        // !!하위 클래스는 이 메서드를 `this` 반환하도록 구현 필요
        protected abstract T self();
    }
}

class OguPizza extends Pizza {

    private final Size size;

    private OguPizza(Builder builder) {
        super(builder);
        size = builder.size;
    }

    public enum Size {SMALL, MEDIUM, LARGE}

    public static class Builder extends Pizza.Builder<Builder> {

        private final Size size;

        public Builder(Size size) {
            this.size = Objects.requireNonNull(size);
        }

        @Override
        public OguPizza build() { // 상속 받은 클래스가 아닌 OguPizza를 반환하도록 오버라이딩
            return new OguPizza(this);
        }

        // 하위 클래스에서는 반환 타입이 OguPizza.Builder가 되도록 오버라이딩
        @Override
        protected Builder self() {
            return this;
        }
    }
}

class Example {
    public static void main(String[] args) {
        OguPizza pizza = new OguPizza.Builder(OguPizza.Size.SMALL)
                .addTopping(Pizza.Topping.HAM)
                .addTopping(Pizza.Topping.ONION)
                .build();
    }
}
```

위 코드를 보면 `OguPizza` 클래스는 `Pizza` 클래스의 빌더를 상속받아 구현하므로 `Pizza` 클래스의 빌더가 제공하는 메서드들을 사용할 수 있게 된다.  
하위 클래스에서 구현된 `build()` 메서드는 상위 클래스의 메서드가 정의한 반환 타입(`Pizza`)이 아닌  
해당하는 하위 클래스(`OguPizza`)를 반환하도록 오버라이딩하였다.(= 공변 반환 타이핑(covariant return typing)))  
이렇게 구현하면 클라이언트는 형변환에 신경쓰지 않고도 하위 클래스의 빌더를 사용할 수 있게 된다.

### 빌더 패턴의 단점

빌더 패턴에도 아래와 같은 단점이 존재한다.

- 위에서 확인할 수 있듯이 빌더 패턴을 사용하면 클래스의 인스턴스를 만드는데 많은 양의 코드 증가
- 성능이 중요한 상황에서 빌더 호출 때마다 새로운 객체를 만들기 때문에 성능 저하가 발생할 수 있음

하지만 처리해야할 매개변수가 많고 성능에 큰 영향을 미치지 않는 상황에서는 보통 빌더 패턴을 사용하는 것이 좋다.

## Lombok @Builder

Lombok의 `@Builder` 애너테이션을 사용하면 빌더 패턴을 구현하기 위해 필요한 코드를 자동으로 생성해주기 때문에 단점이 될 수 있는 코드량의 증가를 방지할 수 있다.

```java
// dto
@Getter
public class OrderSaveRequest {

    private BigDecimal totalAmount;

    public OrderInfo toEntity(User user) {
        OrderInfo orderInfo = OrderInfo.builder()
                .user(user)
                .totalAmount(this.totalAmount)
                .build();

        return orderInfo;
    }
}

// entity
@Getter
@Builder
public class OrderInfo {

    private User user;
    @Builder.Default
    private String orderNumber = getUniqueOrderNumber();
    private BigDecimal totalAmount;
    @Builder.Default
    private LocalDateTime orderDate = LocalDateTime.now();

    private static String getUniqueOrderNumber() {
        return UUID.randomUUID().toString();
    }
}
```
