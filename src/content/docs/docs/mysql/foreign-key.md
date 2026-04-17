---
title: "Foreign Key"
date: 2023-04-19
lastUpdated: 2026-04-17
tags: [ MySQL ]
description: "MySQL 외래 키의 참조 무결성 보장 방식, InnoDB 잠금 연계 동작, 참조 동작 옵션과 실무에서 FK를 생략하는 이유를 정리한다."
---

외래 키는 두 테이블 간의 관계를 정의하여 데이터의 참조 무결성을 보장하는 제약 조건으로, 참조하는 컬럼에 자동으로 인덱스가 생성된다.

## 외래키와 잠금

InnoDB에서 외래 키는 잠금(Lock)과 밀접한 관련이 있으며 두 가지 중요한 특징이 있다.

- 테이블의 변경(쓰기 잠금)이 발생하는 경우에만 잠금 대기 발생
- 외래키와 연관되지 않은 컬럼의 변경은 최대한 잠금 대기를 발생시키지 않음

```sql
-- 샘플 테이블 및 데이터
CREATE TABLE tb_parent
(
    id INT          NOT NULL,
    fd VARCHAR(100) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE tb_child
(
    id  INT NOT NULL,
    pid INT          DEFAULT NULL, # parent id
    fd  VARCHAR(100) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY ix_parentid (pid),
    CONSTRAINT child_ibfk_1 FOREIGN KEY (pid) REFERENCES tb_parent (id) ON DELETE CASCADE
);

INSERT INTO tb_parent
VALUES (1, 'parent-1'),
       (2, 'parent-2');
INSERT INTO tb_child
VALUES (100, 1, 'child-1');
```

### 자식 테이블의 변경 대기

자식 테이블의 외래 키 컬럼 값을 변경할 때, 변경하려는 값이 부모 테이블에 실제로 존재하는지 확인해야 한다.

- 부모 테이블 확인 과정에서 부모 테이블의 해당 레코드에 공유 잠금(S-Lock) 필요
- 다른 트랜잭션이 부모 레코드를 변경 중(X-Lock 보유)이라면 대기 발생

|                       커넥션 1                       |                   커넥션 2                   |
|:-------------------------------------------------:|:-----------------------------------------:|
|                     `BEGIN;`                      |                                           |
| `UPDATE tb_parent SET fd='changed-2' WHERE id=2;` |                                           |
|                                                   |                 `BEGIN;`                  |
|                                                   | `UPDATE tb_child SET pid=2 WHERE id=100;` |
|                    `ROLLBACK;`                    |                 커넥션 1 대기                  |
|                                                   |                 `COMMIT;`                 |

1. 1번 커넥션에서 부모 테이블 id 2인 레코드에 대해 쓰기 잠금 획득
2. 2번 커넥션에서 자식 테이블의 외래키 컬럼(pid)을 pid 2로 변경하는 쿼리 실행
3. 부모 테이블의 변경 작업이 완료될 때까지 2번 커넥션은 대기

### 부모 테이블의 변경 대기

부모 테이블의 키를 변경하거나 레코드를 삭제할 때, 해당 키를 참조하는 자식 테이블의 레코드가 있는지 확인해야 한다.

- 부모 테이블 변경 시 자식 테이블의 연관 레코드에 잠금을 설정
- 다른 트랜잭션이 자식 레코드를 변경 중이라면 대기 발생

|                                         커넥션 1                                         |                커넥션 2                |
|:-------------------------------------------------------------------------------------:|:-----------------------------------:|
|                                       `BEGIN;`                                        |                                     |
| `UPDATE tb_child SET fd='changed-100' WHERE id=100;`<br/>부모 id 1을 참조하는 자식 테이블 레코드에 접근 |                                     |
|                                                                                       |              `BEGIN;`               |
|                                                                                       | `DELETE FROM tb_parent WHERE id=1;` |
|                                      `ROLLBACK;`                                      |              커넥션 1 대기               |
|                                                                                       |              `COMMIT;`              |

1. 1번 커넥션에서 부모키 1을 참조하는 자식 테이블 레코드에 대해 쓰기 잠금 획득
2. 2번 커넥션에서 부모 테이블의 id 1에 대해 삭제하는 쿼리 실행
3. 자식 테이블의 변경 작업이 완료될 때까지 2번 커넥션은 대기

## 참조 동작 (Referential Action)

부모 테이블의 행이 변경되거나 삭제될 때 자식 테이블의 외래 키에 대한 처리 방식을 `ON DELETE`/`ON UPDATE` 절로 지정한다.

```sql
-- 샘플 데이터
-- departments: (1, 개발팀), (2, 디자인팀)
-- employees:   (1, Alice, 1), (2, Bob, 1), (3, Carol, 2)
-- 시나리오: DELETE FROM departments WHERE id = 1 실행 시 employees의 동작
```

|    옵션     |         자식 동작         |                  비고                   |
|:---------:|:---------------------:|:-------------------------------------:|
|  CASCADE  |   Alice, Bob 연쇄 삭제    |            의도치 않은 대량 삭제 위험            |
| SET NULL  | Alice, Bob의 FK → NULL |        FK 컬럼에 NOT NULL 시 사용 불가        |
| RESTRICT  |     삭제 즉시 거부 (에러)     |          자식 행이 존재하면 부모 삭제 차단          |
| NO ACTION |     RESTRICT와 동일      | InnoDB는 지연 검사 미지원으로 RESTRICT와 동일하게 동작 |

InnoDB는 표준 SQL의 지연 참조 검사(Deferred Constraint)를 지원하지 않기 때문에, `NO ACTION`도 실질적으로 `RESTRICT`처럼 즉시 검사된다.

## 실무에서 외래키를 생략하는 이유

많은 실무 환경에서 외래 키 제약을 의도적으로 생략한다.

- 성능 비용: 자식 테이블의 INSERT/UPDATE마다 부모 테이블 조회와 공유 잠금(S-Lock) 획득이 발생하여, 대량 INSERT 시 락 경합의 원인
- 분산 환경의 한계: 마이크로서비스 아키텍처에서 서비스별로 DB가 분리되면 크로스 DB FK 설정 자체가 불가능
- 스키마 변경의 경직성: FK가 걸린 컬럼 타입·길이를 바꾸려면 참조 테이블까지 동시에 변경해야 함

###### 참고자료

- [Real MySQL 8.0 (1권)](https://kobic.net/book/bookInfo/view.do?isbn=9791158392703)
