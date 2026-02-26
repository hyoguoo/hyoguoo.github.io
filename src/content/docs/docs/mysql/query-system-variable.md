---
title: "Query System Variable(쿼리 시스템 변수)"
date: 2023-05-16
lastUpdated: 2025-09-17
---

SQL은 표준 언어이지만, 실제 구문 작성 규칙이나 서버의 동작 방식은 MySQL 서버에 설정된 시스템 변수 값에 따라 달라질 수 있다.

## SQL 모드

`sql_mode` 시스템 변수는 MySQL이 어떤 SQL 구문을 지원하고, 데이터 유효성 검사를 얼마나 엄격하게 수행할지를 결정하는 설정이다.

```sql
SET sql_mode = 'STRICT_TRANS_TABLES, ONLY_FULL_GROUP_BY, NO_ZERO_IN_DATE, ...';
```

기본적으로 설정되어있는 SQL 모드는 대표적으로 다음과 같다.

- `STRICT_TRANS_TABLES`: 트랜잭션을 지원하는 스토리지 엔진(InnoDB 등)에서 데이터 유효성 검사를 엄격하게 수행하여 잘못된 값이 입력되면 에러를 반환하고, 트랜잭션 롤백
- `ONLY_FULL_GROUP_BY`: `GROUP BY`를 사용할 때, `SELECT` 절에는 집계 함수나 `GROUP BY` 절에 명시된 컬럼만 사용할 수 있도록 강제
- `NO_ZERO_IN_DATE`: 날짜 타입 컬럼에 '0000-00-00'과 같은 잘못된 날짜가 입력되는 것을 방지

## 식별자 대소문자 구분

MySQL에서 데이터베이스와 테이블은 디스크 상의 디렉터리와 파일에 각각 매핑되기 때문에, 설치된 운영체제에 따라 데이터베이스와 테이블 이름의 대소문자 구분 여부가 달라진다.

- 윈도우: 대소문자 구분 X
- 유닉스 계열: 대소문자 구분 O

이러한 OS 종속성을 해결하고 이기종 시스템 간의 일관성을 유지하기 위해 `lower_case_table_names` 시스템 변수를 사용한다.

- `0` (Unix/Linux 기본값): 대소문자를 구분하여 저장하고, 비교 시에도 구분
- `1`: 모든 식별자를 소문자로 변환하여 저장하고, 비교 시에도 대소문자를 구분하지 않음
    - OS에 관계없이 일관된 동작을 보장하므로 가장 권장되는 설정
- `2` (Windows 기본값): 대소문자를 구분하여 저장하지만, 비교 시에는 소문자로 변환하여 비교

## 식별자 표기법과 예약어

데이터베이스, 테이블, 컬럼 등 식별자의 이름을 MySQL이 내부적으로 사용하는 예약어(예: `SELECT`, `ORDER`)를 키워드로 생성하기 위해서 백틱(`)이나 쌍따옴표로 감싸서 사용할 수 있다.

```sql
-- `order`는 예약어, `customer-name`은 특수문자를 포함한 식별자
SELECT `order_id`, `customer-name`
FROM `order`;
```

###### 참고자료

- [Real MySQL 8.0 (2권)](https://kobic.net/book/bookInfo/view.do?isbn=9791158392727)