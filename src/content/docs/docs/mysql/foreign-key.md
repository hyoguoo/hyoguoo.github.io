---
title: "Foreign Key"
date: 2023-04-19
lastUpdated: 2025-09-12
tags: [MySQL]
description: "MySQL 외래 키의 참조 무결성 보장 방식과 InnoDB 잠금 연계 동작, 연쇄 처리 옵션을 설명한다."
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

###### 참고자료

- [Real MySQL 8.0 (1권)](https://kobic.net/book/bookInfo/view.do?isbn=9791158392703)
