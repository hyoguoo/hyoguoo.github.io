# ELK Stack 학습 및 실무 활용 문서화 명세서 (Roadmap)

이 문서는 백엔드(Spring Boot) 개발자가 실무에서 마주치는 두 가지 대표 시나리오(애플리케이션 로그 중앙화·운영 분석, 도메인 검색 엔진 활용)를 중심으로 **ELK Stack의 핵심 동작 원리와 필수 활용법**을 정리한 가이드라인이다. 대규모 클러스터 운영, 노드 단위 튜닝, 복잡한 확장 토폴로지는 배제하고, 백엔드 개발자가 직접 마주치는 **인덱싱/검색 내부 동작, 로그 수집 파이프라인, Kibana 시각화, 기본 운영(ILM·Health)** 까지 5개의 Layer로 구성하였다.

*(참고: 현재 모든 문서는 미작성 상태이며, Layer 1부터 순차 작성한다.)*

## 1. 디렉토리 구조 및 위계

모든 콘텐츠는 `src/content/docs/docs/elk/` 경로에 위치하며, 총 13개의 핵심 문서로 구성된다.

```text
src/content/docs/docs/elk/
├── index.mdx                              # 섹션 랜딩 페이지 (작성 완료)
├── introduction.md                        # L1: ELK Stack 개요와 컴포넌트 역할
├── cluster-and-node-architecture.md       # L1: Cluster/Node/Shard 분산 모델
├── index-and-document-model.md            # L1: Index/Document/Mapping 데이터 모델
├── mapping-and-data-types.md              # L2: Mapping 전략과 핵심 데이터 타입
├── analyzer-and-inverted-index.md         # L2: Analyzer 파이프라인과 역색인 구조
├── query-dsl.md                           # L2: Query DSL 기본과 Filter/Query Context
├── relevance-and-scoring.md               # L3: BM25, Boost, 정렬·페이징
├── aggregations.md                        # L3: Bucket/Metric 집계와 통계 활용
├── logstash-pipeline.md                   # L4: Input/Filter/Output, Grok 파싱
├── filebeat-and-log-shipping.md           # L4: Filebeat 수집과 전송 경로 트레이드오프
├── spring-boot-log-integration.md         # L4: Spring Boot 로그 중앙화 통합 예시
├── kibana-discover-and-dashboard.md       # L5: Discover/Visualize/Dashboard 활용
└── operations-ilm-and-monitoring.md       # L5: ILM(Hot-Warm-Cold)과 Cluster Health
```

---

## 2. 문서별 상세 명세

### Layer 1: Foundations (스택 개요와 아키텍처)

**01. Introduction**
- 내용: Elastic Stack 전체 구성(Elasticsearch, Logstash, Kibana, Beats)과 각 컴포넌트의 책임 분담. 두 가지 대표 사용 시나리오(로그 중앙화·운영 분석 vs 도메인 검색 엔진)와 백엔드 입장에서의 선택 기준.
- 핵심: 어떤 문제를 풀기 위해 ELK를 도입하는지 명확히 인지하고, 시나리오에 따라 어떤 컴포넌트가 필요/불필요한지 판단할 기준 확보.

**02. Cluster and Node Architecture**
- 내용: Cluster·Node 개념과 Node 역할(Master, Data, Coordinating, Ingest). Shard·Replica를 통한 분산 저장과 고가용성 확보 원리. Master 선출과 split-brain 회피 기본 개념.
- 핵심: ES가 데이터를 어떻게 분산·복제하는지 머릿속에 그림이 그려져야 인덱스 설계와 장애 진단이 가능함을 이해.

**03. Index and Document Model**
- 내용: Index/Document/Field 단위 데이터 모델, `_id`·`_source`·`_version` 등 메타필드 역할, 문서의 색인·갱신·삭제 라이프사이클(Refresh, Flush, Merge).
- 핵심: RDB와 다른 ES의 저장 단위와 갱신 모델을 이해하여 "왜 즉시 검색되지 않는가", "왜 update가 비용이 큰가"와 같은 실무 질문에 답할 수 있게 함.

### Layer 2: Indexing & Search Internals (인덱싱과 검색의 내부 동작)

**04. Mapping and Data Types**
- 내용: Dynamic Mapping과 Explicit Mapping의 차이, `text` vs `keyword`의 결정적 구분, `date`·`numeric`·`object`·`nested` 타입의 사용처와 함정.
- 핵심: 잘못된 매핑 한 줄이 검색 품질과 성능 전체를 좌우하므로 인덱스를 만들기 전에 반드시 Explicit Mapping을 설계하는 습관을 정립.

**05. Analyzer and Inverted Index**
- 내용: Analyzer 3단계 파이프라인(Character Filter → Tokenizer → Token Filter)과 표준 Analyzer 동작. 역색인(Inverted Index)의 구조와 검색 시 Term Lookup 흐름. 한국어 형태소 분석기(nori) 적용 예시.
- 핵심: 검색 결과가 왜 그렇게 나오는지 설명할 수 있으려면 색인 시점의 토큰화 과정을 추적할 수 있어야 함을 강조.

**06. Query DSL**
- 내용: 자주 쓰는 쿼리(`match`, `term`, `bool`, `range`, `multi_match`)의 동작 차이. Filter Context와 Query Context의 차이(스코어 계산·캐싱) 및 선택 기준.
- 핵심: 단순 키워드 매칭에서부터 복합 조건까지, 의도에 맞는 쿼리 타입을 고르고 Filter를 적극 활용하여 성능을 확보하는 패턴 정립.

### Layer 3: Advanced Search Capabilities (실무 검색 기능)

**07. Relevance and Scoring**
- 내용: BM25 스코어링 원리 요약, `boost`·`function_score`로 도메인 가중치 반영, 정렬(`sort`)·페이징(`from/size`·`search_after`)의 비용 차이.
- 핵심: 도메인 요구사항(예: 최신 글 우선·인기도 가중치)을 기본 스코어 위에 합성하는 표준 패턴과 Deep Pagination 회피 방법 습득.

**08. Aggregations**
- 내용: Bucket Aggregation(`terms`, `date_histogram`, `range`)과 Metric Aggregation(`avg`, `sum`, `cardinality`)의 조합. Sub-aggregation을 통한 다단계 집계 예시.
- 핵심: 백엔드에서 별도 집계 API를 만들지 않고도 ES 한 번의 호출로 통계·대시보드 데이터를 얻을 수 있는 시나리오를 식별하고 설계.

### Layer 4: Ingestion Pipeline (Logstash & Beats)

**09. Logstash Pipeline**
- 내용: Pipeline 3단계(Input → Filter → Output) 구조. `grok`·`mutate`·`date` 필터로 비정형 로그를 구조화하는 예시. 멀티라인 스택트레이스 처리.
- 핵심: 애플리케이션이 남긴 한 줄 텍스트 로그를 ES에 의미 있는 필드로 적재하기 위한 파싱 설계 패턴 확보.

**10. Filebeat and Log Shipping**
- 내용: Filebeat의 Harvester·Registry 동작, 파일 회전 추적 메커니즘. Filebeat → Elasticsearch 직송과 Filebeat → Logstash → Elasticsearch 경유의 트레이드오프(파싱 위치·부하·신뢰성).
- 핵심: 운영 환경의 로그량과 변환 복잡도에 따라 어디에 파싱 부담을 둘지 판단하고, 데이터 유실 없는 수집 경로를 구성.

**11. Spring Boot Log Integration**
- 내용: `logback-spring.xml`을 통한 JSON 로깅(`logstash-logback-encoder`) 설정 예시, MDC를 활용한 컨텍스트 전파(traceId·userId), Filebeat 또는 직접 전송 어플리케이션 설정.
- 핵심: 가장 흔한 백엔드 시나리오인 "Spring Boot 애플리케이션 로그 → ELK 중앙화"를 처음부터 끝까지 동작하는 형태로 구성하는 표준 레시피 제공.

### Layer 5: Kibana & Operations (시각화와 기본 운영)

**12. Kibana Discover and Dashboard**
- 내용: Index Pattern(Data View) 등록, Discover에서 KQL을 활용한 로그 탐색, Visualize·Dashboard 구성 흐름, Saved Search·Lens 기본 사용법.
- 핵심: 장애 발생 시 5분 안에 원인 로그를 찾고, 핵심 운영 지표를 한 화면에 두는 기본 시각화 역량 확보.

**13. Operations: ILM and Monitoring**
- 내용: Index Lifecycle Management의 4단계(Hot-Warm-Cold-Delete)와 Rollover 정책 설정 예시. Cluster Health 상태(Green/Yellow/Red)의 의미와 발생 원인. 디스크 사용량·Shard 수 등 기본 운영 지표.
- 핵심: 로그가 무한히 쌓여 디스크가 폭주하는 사고를 막고, 클러스터의 건강 상태를 빠르게 진단할 수 있는 최소 운영 지식 확보.

---

## 3. 작성 원칙 (Style Guide)

1. 볼드(`**`) 금지: 강조는 문맥과 구조로 수행하며 본문 내 볼드 처리를 절대 하지 않음.
2. 명사형 종결: 리스트 항목이나 설명은 '~함', '~임' 등으로 간결하게 종결. (경어체 금지)
3. 영문 제목: 파일명과 주요 기술 객체명은 영문을 원칙으로 함. ES Query DSL·Logstash 설정 키 등은 공식 표기 그대로 유지.
4. 실무 중심: 이론적 깊이보다는 "이 설정을 어디에 어떻게 써야 하는가"와 "어떤 문제가 해결되는가"를 중심으로 간결하게 서술.
5. 예시 기반: 추상 설명은 배제하고, ES Query DSL JSON·Logstash 파이프라인 설정·Filebeat YAML·Spring Boot `logback-spring.xml` 등 실제 동작 가능한 코드 스니펫을 포함하여 설명.
