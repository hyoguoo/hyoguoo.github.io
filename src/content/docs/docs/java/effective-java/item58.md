---
title: "For-each Loop"
date: 2024-03-07
lastUpdated: 2024-06-04
---

> 전통적인 for 문 보다는 for-each 문을 사용하라

전통적인 for 문으로 순회하게 되면 불필요하게 인덱스 변수와 반복자가 사용되어 가독성이 떨어지고, 잘못 사용할 경우 버그를 발생시킬 수 있다.  
반복 대상이 배열이나 `Iterable` 인터페이스를 구현한 객체라면 for-each 문을 사용하면 더 간결하고 안전하게 순회할 수 있다.  
게다가 대부분 상황에선 성능 차이가 적다.(LinkedList는 for-each 문이 훨씬 빠름)

## for문 사용시 버그

for 문을 사용할 경우 아래와 같은 버그가 발생할 수 있다.

```java
class Example {

    enum Suit {CLUB, DIAMOND, HEART, SPADE}

    enum Rank {ACE, DEUCE, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT, NINE, TEN, JACK, QUEEN, KING}

    static Collection<Suit> suits = Arrays.asList(Suit.values());
    static Collection<Rank> ranks = Arrays.asList(Rank.values());

    public static void main(String[] args) {
        List<Card> deck = new ArrayList<>();
        for (Iterator<Suit> i = suits.iterator(); i.hasNext(); ) {
            for (Iterator<Rank> j = ranks.iterator(); j.hasNext(); ) {
                deck.add(new Card(i.next(), j.next())); // suit(i) 순회가 rank 안에서 이루어지므로 버그 발생
            }
        }
    }

    static class Card {
        private final Suit suit;
        private final Rank rank;

        Card(Suit suit, Rank rank) {
            this.suit = suit;
            this.rank = rank;
        }
    }
}
```

위와 같이 코드를 작성할 수 있는데, 그나마 `NoSuchElementException`이 발생하여 버그를 쉽게 발견할 수 있지만, 개수가 더 많았을 경우엔 논리적 오류가 발생할 수 있다.  
수정된 코드와 for-each 문을 사용한 코드는 아래와 같은데, for-each 문이 훨씬 간결하고 버그 발생 가능성이 적다는 것을 알 수 있다.

```java
class Example {


    public static void main(String[] args) {
        List<Card> deck = new ArrayList<>();

        // 수정
        for (Iterator<Suit> i = suits.iterator(); i.hasNext(); ) {
            Suit suit = i.next();
            for (Iterator<Rank> j = ranks.iterator(); j.hasNext(); ) {
                deck.add(new Card(suit, j.next()));
            }
        }

        // for-each 문 사용
        for (Suit suit : suits) {
            for (Rank rank : ranks) {
                deck.add(new Card(suit, rank));
            }
        }
    }

}
```

## for-each 문 사용 불가능 상황

for-each 문을 사용할 수 없는 상황이 세 가지 있다.

- 파괴적인 필터링(destructive filtering): 컬렉션을 순회하면서 선택된 원소를 제거해야 할 때
- 변형(transforming): 리스트나 배열을 순회하면서 그 원소의 값 일부 혹은 전체를 교체해야 할 때
- 병렬 반복(parallel iteration): 여러 컬렉션을 병렬로 순회해야 할 때는 각강의 반복자와 인덱스 변수를 사용해야 하므로 for-each 문 사용 불가능
