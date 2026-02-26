---
title: "EnumMap"
date: 2024-03-07
lastUpdated: 2024-03-07
---

> ordinal 인덱싱 대신 EnumMap을 사용하라.

배열이나 리스트에서 원소를 꺼낼 때 ordinal 메서드로 인덱스를 얻을 수 있지만, 보통 이런 용도로 ordinal을 쓰는 것은 좋지 않다.

### ordinal

```java
class Plant {
    enum LifeCycle {ANNUAL, PERENNIAL, BIENNIAL}

    final String name;
    final LifeCycle lifeCycle;

    Plant(String name, LifeCycle lifeCycle) {
        this.name = name;
        this.lifeCycle = lifeCycle;
    }

    @Override
    public String toString() {
        return name;
    }
}

class Main {
    public static void main(String[] args) {
        Set<Plant>[] plantsByLifeCycle = (Set<Plant>[]) new Set[Plant.LifeCycle.values().length]; // 비검사 형변환 경고
        List<Plant> garden = List.of(
                new Plant("바질", Plant.LifeCycle.ANNUAL),
                new Plant("캐러웨이", Plant.LifeCycle.BIENNIAL),
                new Plant("딜", Plant.LifeCycle.ANNUAL),
                new Plant("라벤더", Plant.LifeCycle.PERENNIAL),
                new Plant("파슬리", Plant.LifeCycle.BIENNIAL),
                new Plant("로즈마리", Plant.LifeCycle.PERENNIAL)
        );

        for (int i = 0; i < plantsByLifeCycle.length; i++) {
            plantsByLifeCycle[i] = new HashSet<>();
        }

        for (Plant p : garden) {
            plantsByLifeCycle[p.lifeCycle.ordinal()].add(p);
        }

        for (int i = 0; i < plantsByLifeCycle.length; i++) {
            // 배열은 인덱스의 의미를 모르기 때문에 출력할 때 마다 LifeCycle.values()를 호출해야 한다.
            System.out.printf("%s: %s%n", Plant.LifeCycle.values()[i], plantsByLifeCycle[i]); // ArrayIndexOutOfBoundsException 발생 가능
        }
    }
}
```

### EnumMap

위 방식은 동작은 하지만 주석에 적힌 대로 문제가 많다.  
위 방식이 아닌 EnumMap을 사용하면 이런 문제를 해결할 수 있다.

```java
class Main {
    public static void main(String[] args) {
        Map<Plant.LifeCycle, Set<Plant>> plantsByLifeCycle = new EnumMap<>(Plant.LifeCycle.class); // 형변환 없이 안전하게 선언

        List<Plant> garden = List.of(
                new Plant("바질", Plant.LifeCycle.ANNUAL),
                new Plant("캐러웨이", Plant.LifeCycle.BIENNIAL),
                new Plant("딜", Plant.LifeCycle.ANNUAL),
                new Plant("라벤더", Plant.LifeCycle.PERENNIAL),
                new Plant("파슬리", Plant.LifeCycle.BIENNIAL),
                new Plant("로즈마리", Plant.LifeCycle.PERENNIAL)
        );

        for (Plant.LifeCycle lc : Plant.LifeCycle.values()) {
            plantsByLifeCycle.put(lc, new HashSet<>());
        }

        for (Plant p : garden) {
            plantsByLifeCycle.get(p.lifeCycle).add(p);
        }

        for (Plant.LifeCycle lifeCycle : plantsByLifeCycle.keySet()) {
            // 키를 직접 사용해 순회하면 ordinal 메서드를 사용하지 않아도 된다.
            System.out.printf("%s: %s%n", lifeCycle, plantsByLifeCycle.get(lifeCycle)); // 인덱스를 사용하지 않고도 출력 가능
        }
    }
}
```

이와 같이 EnumMap을 사용하면 성능 저하도 없고, 타입 안전성도 확보할 수 있다. (내부에서 배열을 사용하기 때문이며, 내부 구현 방식을 안으로 숨겨서 타입 안전성을 확보한다.)

## 열거 타입 값들 매핑 예시

이번엔 두 열거 타입 값들을 매핑하여 로직을 구현해야하는 경우를 살펴보면 아래와 같이 구현할 수 있다.

```java
enum Phase {
    SOLID, LIQUID, GAS;

    public enum Transition {
        MELT, FREEZE, BOIL, CONDENSE, SUBLIME, DEPOSIT;

        // 행: from, 열: to, 상태가 늘어나는 만큼 이차원 배열이 커진다.
        private static final Transition[][] TRANSITIONS = {
                {null, MELT, SUBLIME},
                {FREEZE, null, BOIL},
                {DEPOSIT, CONDENSE, null}
        };

        // 다른 상태로 전이하는 메서드
        public static Transition from(Phase from, Phase to) {
            // ordinal 메서드를 사용해 인덱스를 얻는다, 이는 위에서 살펴본 것처럼 좋지 않은 방식이다.
            return TRANSITIONS[from.ordinal()][to.ordinal()];
        }
    }
}
```

위와 같이 구현하면 상태가 늘어날 때마다 이차원 배열의 크기가 커지기 때문에 메모리 낭비가 심해지는 것 뿐만 아니라 오류가 발생할 가능성도 높아진다.

```java
enum Phase {
    SOLID, LIQUID, GAS; // + PLASMA

    public enum Transition {
        MELT(SOLID, LIQUID), FREEZE(LIQUID, SOLID),
        BOIL(LIQUID, GAS), CONDENSE(GAS, LIQUID),
        SUBLIME(SOLID, GAS), DEPOSIT(GAS, SOLID);
        // + IONIZE(GAS, PLASMA), DEIONIZE(PLASMA, GAS);

        // 상전이 맵 초기화
        private static final Map<Phase, Map<Phase, Transition>> m = Stream.of(values())
                .collect(groupingBy(t -> t.from,
                        () -> new EnumMap<>(Phase.class),
                        toMap(t -> t.to,
                                t -> t,
                                (x, y) -> y,
                                () -> new EnumMap<>(Phase.class))));

        private final Phase from;
        private final Phase to;

        Transition(Phase from, Phase to) {
            this.from = from;
            this.to = to;
        }

        public static Transition from(Phase from, Phase to) {
            return m.get(from).get(to);
        }
    }
}
```

하지만 EnumMap을 사용하면 초기화 과정이 다소 복잡해지지만, 이차원 배열을 사용하는 것보다 훨씬 안정적이고 유연하게 사용할 수 있다.  
만약 새로운 상태인 PLASMA가 추가되더라도 주석과 같이 상태와 전이 목록에만 추가하고, 나머지 코드는 수정할 필요가 없다.
