---
title: "Data Structure Use Case"
date: 2024-10-08
lastUpdated: 2025-10-06
tags: [Redis]
description: "Redis의 Sorted Set, Set, Hash, Bitmap, Geospatial 자료구조를 실시간 리더보드, 좋아요 처리, DAU 측정 등 실무 사례에 적용하는 방법을 설명한다."
---

레디스는 다양한 자료구조를 제공하여, 특정 요구사항에 맞는 자료구조를 선택하여 사용할 수 있다.

## Sorted Set - 실시간 리더보드

실시간으로 순위가 바뀌는 랭킹 리더보드는 RDBMS로 구현할 경우 정렬과 집계 연산에 많은 비용이 발생하지만, Redis의 Sorted Set은 이러한 요구사항에 가장 적합한 자료 구조다.

- 핵심 원리: 데이터(Member)를 추가할 때 점수(Score)를 함께 부여하면, Sorted Set은 내부적으로 항상 점수를 기준으로 정렬된 상태 유지
- 데이터 추가/갱신: `ZADD` 명령어를 사용해 사용자와 점수를 추가하면, 기존에 있던 사용자는 점수가 갱신되고 순위가 자동으로 조정(O(log N) 시간 복잡도)
- 랭킹 조회: `ZRANGE` (오름차순) 또는 `ZREVRANGE` (내림차순) 명령어를 사용해 지정된 순위 범위의 사용자 목록 조회

### 랭킹 합산

리더보드가 일정 기간마다 초기화 된다고 할때, 다음과 같은 방법으로 랭킹을 합산하려 시도해볼 수 있다.

1. 일별로 랭킹을 저장하는 Sorted Set을 생성
2. 하나의 테이블에서 일별로 저장된 데이터를 모두 가져온 뒤 사용자별로 합산
3. 합산된 값을 정렬하여 랭킹을 산정

하지만 `ZUNIONSTORE` 명령어를 사용하면 여러 Sorted Set의 점수를 합산하여 새로운 랭킹 보드를 손쉽게 만들 수 있다.

```redis
ZUNIONSTORE weekly-score:202408-3 3 daily-score:20240815 daily-score:20240816 daily-score:20240817 WEIGHTS 1 2 1
-- ZUNIONSTORE  <생성할 키 이름> <합산할 키 개수>  <합산할 키1>  <합산할 키2>  ...  [WEIGHTS <가중치1> <가중치2> ...]
```

## Sorted Set - 최근 검색 기록

최근 검색 기록을 RDBMS로 구현하면 아래와 같은 쿼리로 구현해볼 수 있다.

```sql
SELECT *
FROM keyword
WHERE user_id = 123
ORDER BY reg_datge DESC
LIMIT 10;
-- 중복 검색어 제거 및 오래된 검색 기록 삭제 등 여러 작업이 추가적으로 필요할 수 있어 복잡도가 증가
```

하지만 Sorted Set을 사용하면 사용자별 최근 검색 기록을 간단하게 구현할 수 있다.

- 데이터 형태: `serach-keyword:<user_id>`로 저장하여 사용자별로 구분하여 저장
- 중복 제거: Set의 특성 덕분에 동일한 검색어는 여러 번 저장되지 않음
- 자동 정렬: 검색 시점의 타임스탬프(Timestamp)를 점수(Score)로 사용하면, `ZADD` 명령어로 검색어를 추가하는 것만으로 항상 최신순으로 정렬된 상태가 유지
- 개수 제한: `ZREMRANGEBYRANK`와 같은 명령어를 사용하면, 가장 오래된 검색 기록부터 손쉽게 삭제

```redis
-- 1001번 유저가 'redis'를 검색 (현재 시간을 점수로 사용)
ZADD search-history:1001 1728187200 "redis"

-- 검색 기록이 10개를 초과하면, 가장 오래된 항목을 삭제하여 10개를 유지
ZREMRANGEBYRANK search-history:1001 0 -11
```

## Set - 태그

특정 오브젝트에 대한 태그를 지정하는 기능이 추가될 수 있는데, RDBMS로 구현하면 적어도 두 개의 테이블이 추가로 필요하다.

1. 태그 테이블
2. 태그-오브젝트 매핑 테이블

레디스의 Set을 사용하면 아래와 같은 이유로 간단하게 구현 할 수 있다.

```redis
SADD posts:59:tags IT REDIS NOSQL
-- SADD <태그를 저장할 키> <태그1> <태그2> ...
```

또한, 특정 태그를 가진 오브젝트를 조회하는 경우에도 아래와 같이 간단하게 조회할 수 있다.

```redis
SADD tag:IT:posts 59
SMEMBERS tag:IT:posts
-- 특정 태그를 가진 오브젝트 조회
SINTER tag:IT:posts tag:REDIS:posts
-- 여러 태그를 가진 오브젝트 조회(교집합)
```

## 랜덤 데이터 추출

보통 RDBMS에서의 `ORDER BY RAND()`은 다량의 데이터를 처리할 경우 성능 이슈가 발생할 수 있지만, 레디스를 사용하면 아래와 같이 간단하게 랜덤 데이터를 추출할 수 있다.

```redis
RANDOMKEY
-- 랜덤 키 추출, 하지만 레디스 인스턴스에 한 종류의 데이터만 저장되어 있을 경우에만 사용 가능
HRANDFIELD user:hash WITHVALUES 3
-- 원하는 개수만큼 랜덤 필드와 값을 추출(개수를 음수로 지정하면 중복을 허용)
```

## 다양한 카운팅 방법

데이터 개수를 세는 요구 사항은 다양한 방법으로 구현할 수 있는데, 요구 사항에 따라 최적의 구현 방법을 선택할 수 있다.

1. 단순히 데이터 개수만 세는 경우
2. 어떤 아이템이 저장됐는지까지 알아야 하는 경우
3. 약간의 오차를 허용하면서 빠르게 데이터 개수를 세는 경우

### Set - 좋아요 처리

좋아요 처리는 규모에 따라 많은 트래픽이 발생할 수 있으며, 한 사용자가 중복으로 좋아요를 누르는 경우를 방지해야 한다.

- 구현: 게시물별 Set 키에 '좋아요'를 누른 사용자 ID를 `SADD`로 추가(Set 특성상 중복 처리 문제도 같이 해결)
- 개수 확인: `SCARD` 명령어로 O(1)의 속도로 해당 게시물의 총 좋아요 개수를 즉시 확인

```redis
SADD comment-like:12554 user:1001
-- 키를 사용자 ID로 저장하여 중복 좋아요 방지
SCARD comment-like:12554
-- 좋아요 개수 확인
```

### Hash - 읽지 않은 메시지 개수

읽지 않은 메시지는 중복된 데이터를 고려할 필요 없이 단순히 개수만 세면 되기 때문에 해시를 사용하면 아래와 같이 간단하게 구현 할 수 있다.

- 구현: 구현: 사용자 ID를 키로 하는 Hash 구조에, 채팅방 ID를 필드(Field)로 하여 `HINCRBY` 명령어로 카운트를 원자적으로 증가시키거나 감소

```redis
HINCRBY user:234 channel:35 1
-- 채널에 새로운 메시지가 도착할 때마다 1씩 증가
HINCRBY user:234 channel:35 -1
-- 메시지를 읽으면 감소
```

### Bitmap(String) - DAU

많은 사용자를 대상으로 하는 DAU(Daily Active Users)를 Set으로 구현하면 막대한 메모리가 필요하지만, String 자료 구조에 Bit 연산을 수행하면 매우 효율적으로 구현할 수 있다.

- 구현: 사용자 ID를 비트의 위치(offset)로 사용하여, 해당 날짜에 접속하면 `SETBIT` 명령어로 값을 1로 설정
- 사용자 수 집계: `BITCOUNT` 명령어로 1로 설정된 비트의 개수를 세어 접속한 사용자 수를 즉시 확인
- 사용자 리텐션 분석: `BITOP` 명령어로 여러 날짜의 Bitmap에 대해 AND 연산을 수행하면, 특정 기간 동안 매일 접속한 사용자(Retention)와 같은 고급 지표도 쉽게 계산 가능

```redis
SETBIT dau:20240815 1001 1
-- 1001번 사용자가 2024년 8월 15일에 접속했음을 1로 표시
BITCOUNT dau:20240815
-- 2024년 8월 15일에 접속한 사용자 수(1의 개수) 확인
BITOP AND dau:20240815 dau:20240816 dau:20240817
-- 2024년 8월 15일, 16일, 17일에 모두 접속한 사용자 수 확인
```

## Geospatial - 위치 기반 애플리케이션

레디스의 Geospatial 자료 구조를 사용하면 다음과 같이 더욱 효율적으로 처리할 수 있다.

- `GEOADD`: 특정 키에 장소의 이름(member)과 경도, 위도 좌표를 추가
- `GEODIST`: 두 장소 간의 직선거리를 계산
- `GEOSEARCH`: 특정 지점을 기준으로 반경(BYRADIUS) 또는 사각형 영역(BYBOX) 내에 있는 장소 검색 

```redis
GEOADD user 50.1234 30.1234 142
-- ID가 142인 사용자의 위치를 저장 및 업데이트
GEOPOS restaurant ukalendu
-- ukalendu 레스토랑의 위치 조회
GEOSEARCH restaurant FROMLONLAT 50.1234 30.1234 BYRADIUS 10 KM
-- 50.1234, 30.1234 좌표에서 10km 이내에 있는 식당 검색
GEOSEARCH key FROMMEMBER member BYBOX 4 2 KM
-- 특정 멤버 주변의 데이터 검색 및 직사각형 영역 검색
```

###### 참고자료

- [개발자를 위한 레디스](https://kobic.net/book/bookInfo/view.do?isbn=9791161757926)
