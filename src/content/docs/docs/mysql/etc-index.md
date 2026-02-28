---
title: "ETC Index"
date: 2023-04-19
lastUpdated: 2025-09-12
tags: [MySQL]
description: "전문 검색·공간·다중값·함수 기반 인덱스 등 B-Tree 이외의 MySQL 특수 인덱스 종류와 활용 목적을 정리한다."
---

- 전문 검색 인덱스(Full-Text Index): 일반적인 B-Tree 인덱스로는 검색이 어려운 장문 텍스트(기사 본문 등) 내의 단어나 구문을 효율적으로 검색하기 위한 인덱스
- 공간 인덱스(Spatial Index): 위치 정보나 지도 데이터와 같은 2차원 공간 데이터를 처리하기 위한 인덱스(R-Tree 기반)
- 다중값 인덱스(Multi-Valued Index): 하나의 데이터 레코드에 여러 개의 값이 포함될 수 있는 `JSON` 배열과 같은 데이터 타입을 위해 설계된 인덱스
- 함수 기반 인덱스(Function-Based Index): 컬럼의 값을 그대로 인덱싱하는 것이 아니라, 특정 함수나 표현식을 적용한 결과를 인덱싱하는 방식
