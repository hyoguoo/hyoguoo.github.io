---
title: "Statistics"
date: 2023-05-03
lastUpdated: 2025-09-16
---

MySQL의 비용 기반 옵티마이저(Cost-Based Optimizer)는 실행 계획을 수립할 때 통계 정보를 핵심적인 판단 기준으로 사용한다.

- 통계 정보가 없다면, 옵티마이저는 각 실행 계획의 비용을 정확히 예측할 수 없어 비효율적인 방식으로 쿼리를 실행
- MySQL 8.0부터는 기존의 테이블 및 인덱스 통계에 더해, 데이터 분포도를 나타내는 히스토그램을 도입하여 정확도를 높임

## 테이블 및 인덱스 통계 정보

가장 기본적인 통계 정보로, 테이블의 전체 레코드 건수나 인덱스 키의 유니크한 값 개수(Cardinality) 등을 포함한다.

- 테이블에 대한 통계 정보를 `innodb_index_stats`, `innodb_table_stats` 테이블에서 관리하여 통계 정보 유지
- 테이블을 생성할 때 `STATS_PERSISTENT` 옵션을 통해 통계 정보를 영구적으로 보관할지 설정 가능

## 히스토그램(Histogram)

히스토그램은 특정 컬럼의 데이터가 어떻게 분포되어 있는지를 나타내는 통계 정보다.

- 기존 통계 정보가 단순히 유니크한 값의 개수만 제공
- 히스토그램은 어떤 값이 얼마나 자주 나타나는지와 같은 데이터의 편중(Skew) 정보를 포함

히스토그램 정보는 `ANALYZE TABLE ... UPDATE HISTOGRAM` 명령을 통해 수동으로 수집 및 관리되는데, 데이터 분포 특성에 따라 두 가지 타입이 지원된다.

- Singleton(싱글톤 히스토그램)
    - 컬럼에 포함된 *각 값별로 빈도 정보 관리(예: '서울' 20%, '부산' 15%, ...)
    - 유니크한 값의 개수가 적고, 특정 값에 데이터가 몰려있는 컬럼에 적합
- Equi-Height(높이 균형 히스토그램)
    - 컬럼의 전체 값 범위를 균등한 개수를 가진 여러 개의 버킷(Bucket)으로 나누어 관리(예: '1950~1955년생' 25%, '1956~1958년생' 25%, ...)
    - 유니크한 값의 개수가 많고, 연속적인 값을 가지는 컬럼에 적합

### 용도와 효과

히스토그램은 옵티마이저가 `EXPLAIN`의 `filtered` 값을 예측하는 데 결정적인 역할을 한다.(`filtered` = 특정 조건절을 통해 걸러질 것으로 예상되는 레코드의 비율)

#### 히스토그램 적용 전

```sql
EXPLAIN
SELECT *
FROM employees
WHERE first_name = 'Zita'
  AND birth_date BETWEEN '1950-01-01' AND '1960-01-01';
```

| id | select_type | table     | type | key          | rows | filtered |
|:---|:------------|:----------|:-----|:-------------|:-----|:---------|
| 1  | SIMPLE      | employees | ref  | ix_firstname | 224  | 11.11    |

- `first_name`이 'Zita'인 224건 중, `birth_date` 조건으로 11.11% 정도만 남을 것이라 예측
- `birth_date`의 데이터 분포를 모르고 일반적인 통계에만 의존한 결과

#### 히스토그램 적용 후

```sql
ANALYZE TABLE employees UPDATE HISTOGRAM ON first_name, birth_date;

EXPLAIN
SELECT *
FROM employees
WHERE first_name = 'Zita'
  AND birth_date BETWEEN '1950-01-01' AND '1960-01-01';
```

| id | select_type | table     | type | key          | rows | filtered |
|:---|:------------|:----------|:-----|:-------------|:-----|:---------|
| 1  | SIMPLE      | employees | ref  | ix_firstname | 224  | 60.82    |

- 히스토그램 생성 후, 옵티마이저는 `birth_date`의 실제 데이터 분포를 참조하여 예측치를 60.82%로 보정
- 처리 건수가 적은 테이블을 드라이빙(Driving) 테이블로 선택하게 만들어 성능에 큰 이점 제공하여 JOIN 순서 결정에도 영향


## 코스트 모델(Cost Model)

코스트 모델은 옵티마이저가 실행 계획의 총비용을 계산할 때 사용하는 단위 작업별 비용 값들의 집합이다.

- 디스크로부터 데이터 페이지 읽기
- 메모리(InnoDB 버퍼 풀)로부터 데이터 페이지 읽기
- 인덱스 키 비교
- 레코드 평가
- 메모리 임시 테이블 작업
- 디스크 임시 테이블 작업

위 작업에서 얼마나 필요한지 예측하고 전체 작업 비용을 계산한 결과를 바탕으로 최적의 실행 계획을 선택한다.(이전에는 비용을 서버 소스 코드에 상수로 존재했음)

###### 참고자료

- [Real MySQL 8.0 (1권)](https://kobic.net/book/bookInfo/view.do?isbn=9791158392703)