---
title: "ENUM"
date: 2023-07-25
lastUpdated: 2025-09-26
---

`ENUM`은 테이블 생성 시 미리 정의한 문자열 목록 중에서 하나의 값만 저장할 수 있는 데이터 타입이다.

- 상태 코드처럼 정해진 몇 개의 값만 가져야 하는 컬럼에 사용되어 데이터의 일관성을 보장
- 내부적으로 `ENUM`은 문자열 값에 정수 인덱스를 매핑하여 저장(정의된 목록의 첫 번째 값 1, 두 번째 값 2, ...)
    - 255개 미만의 값은 1바이트, 255개 이상은 2바이트 사용

```sql
CREATE TABLE tb_enum
(
    id     INT AUTO_INCREMENT PRIMARY KEY,
    status ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILURE')
);

INSERT INTO tb_enum (status)
VALUES ('PROCESSING');

-- 'PROCESSING'은 두 번째 값이므로 인덱스 2에 해당
-- 아래 두 쿼리는 동일한 결과를 반환
SELECT *
FROM tb_enum
WHERE status = 'PROCESSING';
SELECT *
FROM tb_enum
WHERE status = 2;
```

ENUM 타입을 사용하면 다음과 같은 장/단점이 존재한다.

- 장점
    - 데이터 무결성: 정의된 값만 저장할 수 있어 잘못된 데이터 입력 방지
    - 저장 공간 효율: 긴 문자열 대신 1~2바이트의 정수로 저장
    - 가독성: 쿼리에서 의미가 명확한 문자열 사용 가능
- 단점
    - 유연성 부족: 새로운 값을 추가/변경하려면 테이블 구조 변경 필요
    - 스키마 변경 비용: 중간에 값을 삽입/변경 시 테이블 리빌드 필요
        - 마지막에 추가하는 경우: 테이블 구조(메타데이터) 변경만으로 처리 가능
        - 중간에 추가하는 경우: 테이블 전체 복사 및 읽기 잠금 필요
    - 정렬 문제: 기본 정렬이 내부 정수 인덱스 기준으로 이루어져, 의도와 다른 결과 발생 가능(문자열 정렬시 `CAST(fd_enum AS CHAR)` 사용)

## 정규화(Lookup Table)

`ENUM`의 단점 때문에, 실무에서는 정규화를 통한 조회 테이블(Lookup Table) 방식을 사용하는 경우도 있다.

- `status` 컬럼을 `ENUM`으로 정의하는 대신 `status` 테이블을 만들고 외래 키(Foreign Key)로 참조
- 새로운 상태를 추가하거나 변경할 때 테이블 스키마를 수정할 필요가 없고, 단순히 행을 추가/수정하는 방식으로 대응 가능

```sql
-- 상태값을 별도의 테이블로 관리
CREATE TABLE status_lookup
(
    status_id   INT AUTO_INCREMENT PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO status_lookup (status_name)
VALUES ('PENDING'),
       ('PROCESSING'),
       ('SUCCESS'),
       ('FAILURE');

-- 메인 테이블에서는 외래 키로 참조
CREATE TABLE tb_order
(
    id        INT AUTO_INCREMENT PRIMARY KEY,
    status_id INT NOT NULL,
    FOREIGN KEY (status_id) REFERENCES status_lookup (status_id)
);

-- 조회 시 조인 사용
SELECT o.id, s.status_name
FROM tb_order o
         JOIN status_lookup s ON o.status_id = s.status_id;
```

###### 참고자료

- [Real MySQL 8.0 (2권)](https://kobic.net/book/bookInfo/view.do?isbn=9791158392727)