---
title: "Claude Code - SuperClaude Framework"
date: 2025-10-27
lastUpdated: 2025-10-27
tags: [AI-Assisted Development]
description: ""
---

[SuperClaude](https://github.com/SuperClaude-Org/SuperClaude_Framework)는 meta-programming configuration framework이다.

- Claude Code를 구조화된 개발 플랫폼으로 변환시키는 역할
- 프레임워크의 핵심 작동 방식은 행동 지침 주입(behavioral instruction injection)과 컴포넌트 오케스트레이션(component orchestration) 두 가지 메커니즘에 기반

이를 통해 체계적인 워크플로우 자동화, 강력한 도구, 지능형 에이전트를 제공한다.

## 명령어 체계

SuperClaude의 명령어는 Claude Code 동작을 수정하는 컨텍스트 트리거로, 컨텍스트 파일(`~/.claude/superclaude/Commands/....md`)을 읽어 전문화된 행동 지침을 주입한다.

1. 사용자 입력: `/sc:implemnt "새로운 기능 추가"`와 같은 명령어 입력
2. 컨텍스트 로딩: Claude Code가 해당 명령어에 매핑된 컨텍스트 파일을 로드
3. 행동 지침 주입: Claude가 도메인 전문 지식 / 도구 선택 / 검증 패턴 적용

### 전체 명령어 참조

|      명령어       |  카테고리   |           목적           |           최적 사용처            |
|:--------------:|:-------:|:----------------------:|:---------------------------:|
|   implement    |   개발    |         기능 개발          |       풀스택 기능, API 개발        |
|     design     |   개발    |        시스템 아키텍처        |     API 스펙, 데이터베이스 스키마      |
|    workflow    |   개발    |         구현 계획          |      프로젝트 로드맵, 스프린트 계획      |
|     build      |   개발    |        프로젝트 컴파일        |       CI/CD, 프로덕션 빌드        |
|  brainstorm	   |   분석	   | 대화형 요구사항 발견 및 프로젝트 계획	 | 새 프로젝트 계획, 기능 탐색, 불명확한 요구사항 |
|    analyze     |   분석    |         코드 평가          |        품질 감사, 보안 검토         |
|  troubleshoot  |   분석    |         문제 진단          |        버그 조사, 성능 문제         |
|    research    |   분석    |    지능형 검색을 통한 웹 연구     |     기술 연구, 최신 정보, 시장 분석     |
| business-panel |   분석    |         전략적 분석         |       비즈니스 결정, 경쟁 평가        |
|   spec-panel   |   분석    |         사양 검토          |      요구사항 검증, 아키텍처 분석       |
|    explain     |   분석    |         코드 설명          |          학습, 코드 검토          |
|    improve     |   품질    |         코드 향상          |        성능 최적화, 리팩토링         |
|    cleanup     |   품질    |         기술 부채          |        데드 코드 제거, 정리         |
|      test      |   품질    |         품질 보증          |      테스트 자동화, 커버리지 분석       |
|    document    |   품질    |          문서화           |       API 문서, 사용자 가이드       |
|    estimate    | 프로젝트 관리 |        프로젝트 추정         |       타임라인 계획, 리소스 할당       |
|      task      | 프로젝트 관리 |         작업 관리          |      복잡한 워크플로우, 작업 추적       |
|     spawn      | 프로젝트 관리 |       메타 오케스트레이션       |       대규모 프로젝트, 병렬 실행       |
|    reflect     |   세션    |         작업 검증          |       진행 상황 평가, 완료 검증       |
|  select-tool   |   세션    |         도구 최적화         |        성능 최적화, 도구 선택        |
|      load      |   세션    |        컨텍스트 로딩         |      세션 초기화, 프로젝트 온보딩       |
|      save      |   세션    |         세션 지속성         |       체크포인팅, 컨텍스트 보존        |
|      help      |  유틸리티   |       모든 명령어 나열        |        사용 가능한 명령어 발견        |
|     index      |  유틸리티   |         명령어 발견         |        기능 탐색, 명령어 찾기        |
|      git       |  유틸리티   |         버전 제어          |        커밋 관리, 브랜치 전략        |

추가적으로 명령어에 플래그를 삽입할 수 있으며, 대부분은 자동으로 활성화된다.

## 페르소나 에이전트

SuperClaude는 개발 수명주기의 다양한 요구사항에 대응하기 위해 도메인별 전문 지식을 갖춘 여러 전문 AI 에이전트(Persona Agents)를 제공한다.

- 주어진 작업의 맥락을 프레임워크가 분석하여 가장 적합한 에이전트들을 자동으로 선택
- `@agent-` 접두사를 사용하여 특정 에이전트를 명시적으로 수동 호출 가능
- 여러 에이전트를 조합하고 조율하는 방식으로 작동

에이전트 선택 규칙은 다음과 같다.

1. 수동 재정의: @agent-[name]
2. 키워드: 직접적인 도메인 용어가 주요 에이전트 트리거
3. 파일 유형: 확장자가 언어/프레임워크 전문가 활성화
4. 복잡성: 다단계 작업이 조정 에이전트를 참여
5. 컨텍스트: 관련 개념이 보완 에이전트를 트리거

### 에이전트 목록 및 트리거

|       활성화 에이전트       | 트리거 유형 |                      키워드/패턴                       |                  전문 분야                  |
|:--------------------:|:------:|:-------------------------------------------------:|:---------------------------------------:|
|  security-engineer   |   보안   | "auth", "security", "vulnerability", "encryption" |  위협 모델링 및 취약점 예방에 중점을 둔 애플리케이션 보안 아키텍처  |
| performance-engineer |   성능   |  "slow", "optimization", "bottleneck", "latency"  |     확장성과 리소스 효율성에 중점을 둔 시스템 성능 최적화      |
|  frontend-architect  | 프론트엔드  |  "UI", "React", "Vue", "component", "responsive"  |  접근성과 사용자 경험에 중점을 둔 현대적인 웹 애플리케이션 아키텍처  |
|  backend-architect   |  백엔드   |  "API", "server", "database", "REST", "GraphQL"   | API 신뢰성과 데이터 무결성을 강조하는 견고한 서버 측 시스템 설계  |
|   quality-engineer   |  테스팅   |      "test", "QA", "validation", "coverage"       |  자동화 및 커버리지에 중점을 둔 포괄적인 테스팅 전략 및 품질 보증  |
|   devops-architect   | DevOps |     "deploy", "CI/CD", "Docker", "Kubernetes"     | 안정적인 소프트웨어 전달을 위한 인프라 자동화 및 배포 파이프라인 설계 |
|   system-architect   |  아키텍처  |  "architecture", "microservices", "scalability"   |   확장성과 서비스 아키텍처에 중점을 둔 대규모 분산 시스템 설계    |
|    python-expert     | Python |       ".py", "Django", "FastAPI", "asyncio"       |  현대적인 프레임워크와 성능을 강조하는 프로덕션급 Python 개발   |
|  root-cause-analyst  |   문제   |    "bug", "issue", "debugging", "troubleshoot"    |    증거 기반 분석 및 가설 테스트를 사용한 체계적인 문제 조사    |
|  refactoring-expert  | 코드 품질  |    "refactor", "clean code", "technical debt"     |    체계적인 리팩토링 및 기술 부채 관리를 통한 코드 품질 개선    |
|   technical-writer   |  문서화   |       "documentation", "readme", "API docs"       |   대상 분석 및 명확성에 중점을 둔 기술 문서화 및 커뮤니케이션    |
|    learning-guide    |   학습   |   "explain", "tutorial", "beginner", "teaching"   |  기술 개발 및 멘토십에 중점을 둔 교육 콘텐츠 설계 및 점진적 학습  |
| requirements-analyst |  요구사항  |      "requirements", "PRD", "specification"       |    체계적인 이해관계자 분석을 통한 요구사항 발견 및 사양 개발    |
| deep-research-agent  |   연구   |  "research", "investigate", "latest", "current"   |      적응형 전략과 다중 홉 추론을 사용한 포괄적인 연구       |

### 명령어별 에이전트 매핑

|       명령어        |                주요 에이전트                |                 지원 에이전트                  |
|:----------------:|:-------------------------------------:|:----------------------------------------:|
|  /sc:implement   | domain architects (frontend, backend) |   security-engineer, quality-engineer    |
|   /sc:analyze    |  quality-engineer, security-engineer  | performance-engineer, root-cause-analyst |
| /sc:troubleshoot |          root-cause-analyst           | domain specialists performance-engineer  |
|   /sc:improve    |          refactoring-expert           |  quality-engineer, performance-engineer  |
|   /sc:document   |           technical-writer            |    domain specialists learning-guide     |
|    /sc:design    |           system-architect            | domain architects, requirements-analyst  |
|     /sc:test     |           quality-engineer            | security-engineer, performance-engineer  |
|   /sc:explain    |            learning-guide             |   technical-writer, domain specialists   |
|   /sc:research   |          deep-research-agent          |  	technical specialists, learning-guide  |

## 행동 모드

SuperClaude는 작업의 복잡성, 사용자의 요청 키워드, 또는 수동 플래그에 따라 Claude Code의 작동 방식을 변경하는 여러 행동 모드를 제공한다.

|        모드        |               목적               | 자동 트리거                                  |            수동 플래그             |
|:----------------:|:------------------------------:|:----------------------------------------|:-----------------------------:|
|  Brainstorming   | 대화형 발견을 통해 모호한 아이디어를 요구사항으로 변환 | "brainstorm", "maybe", 모호한 요청           |    `--brainstorm`, `--bs`     |
|  Introspection   |   학습 및 투명한 의사결정을 위한 추론 과정 노출   | 오류 복구, "추론 분석" 요청                       |        `--introspect`         |
|  Deep Research   |     체계적 조사 및 증거 기반 추론 마인드셋     | `/sc:research`, "investigate", "latest" |         `--research`          |
| Task Management  | 다단계 작업을 위한 계층적 작업 조직 및 세션 지속성  | >3단계, >2개 디렉토리, "polish"                | `--task-manage`, `--delegate` |
|  Orchestration   | 지능형 도구 라우팅 및 병렬 조정을 통한 실행 최적화  | 다중 도구 작업, 높은 리소스 사용                     |        `--orchestrate`        |
| Token-Efficiency |  심볼 시스템을 통해 토큰 사용량 30-50% 절감   | 높은 컨텍스트 사용, 대규모 작업                      |  `--uc`, `--ultracompressed`  |
|        표준        |   간단한 작업을 위한 균형 잡힌 기본 커뮤니케이션   | 다른 모드 트리거가 없는 간단/명확한 작업                 |          (없음 - 기본값)           |

## MCP 서버

MCP 서버는 Claude Code의 기능을 확장하는 전문 도구를 제공한다.

|         서버          |             목적              |                  자동 활성화 트리거                   |
|:-------------------:|:---------------------------:|:---------------------------------------------:|
|      context7       |    공식 라이브러리 문서 및 패턴 액세스     |      라이브러리 `import` 문, 프레임워크 키워드, 문서 요청       |
| sequential-thinking |    구조화된 다단계 추론 및 체계적 분석     |        복잡한 디버깅, `--think` 플래그, 아키텍처 분석        |
|        magic        |       현대적인 UI 컴포넌트 생성       |           UI 요청, `/ui` 명령어, 컴포넌트 개발           |
|     playwright      |    실제 브라우저 자동화 및 E2E 테스팅    |          브라우저 테스팅, E2E 시나리오, 시각적 검증           |
| morphllm-fast-apply |   효율적인 패턴 기반의 다중 파일 코드 변환   |         다중 파일 편집, 리팩토링, 프레임워크 마이그레이션          |
|       serena        | 프로젝트 메모리(세션)를 갖춘 의미론적 코드 이해 |            심볼 작업, 대규모 코드베이스, 세션 관리            |
|       tavily        |   연구를 위한 웹 검색 및 실시간 정보 검색   |    `/sc:research`, "최신", "current", 사실 확인     |
|   chrome-devtools   |   성능 분석, 디버깅, 실시간 브라우저 검사   | "performance", "debug", "LCP", 레이아웃 문제, 콘솔 오류 |

## SuperClaude 세션 관리

SuperClaude는 Serena MCP 서버를 통해 영구 세션 관리를 제공한다.

- Serena MCP 서버를 통해 영구 세션 관리를 제공
- Claude Code 대화가 종료되거나 재시작되어도 컨텍스트를 유지하여, 컨텍스트 보존과 프로젝트 연속성을 보장

|     명령어     |                 목적                 |                MCP 통합 및 주요 동작 (Serena)                 |
|:-----------:|:----------------------------------:|:------------------------------------------------------:|
|  /sc:load   | 영구 메모리에서 이전 프로젝트 컨텍스트를 로드하여 세션 초기화 |  (읽기) 저장된 메모리 파일을 읽어 이전의 결정, 패턴, 진행 상황 등 프로젝트 컨텍스트 복원  |
|  /sc:save   |  현재 세션의 상태, 결정, 진행 상황을 영구 메모리에 저장  |         (쓰기) 현재 컨텍스트를 분석하여 향후 세션을 위한 메모리 파일 생성         |
| /sc:reflect | 저장된 메모리(목표)와 현재 상태를 비교하여 진행 상황 평가  | (비교/분석) 저장된 메모리와 현재 컨텍스트를 비교하여 목표 대비 진행률, 격차, 다음 단계 식별 |

## 백엔드 API 버그 수정 예시

### Phase 1: 프로젝트 분석

```bash
# 프로젝트 루트에서 전체 구조 및 기술 스택 분석
/sc:analyze
# 의존성 및 설정 파일 분석
/sc:analyze build.gradle --focus dependencies
# 핵심 컨트롤러 및 서비스 아키텍처 분석
/sc:analyze src/main/java/com/example/api/controller --focus architecture
```

### Phase 2: 버그 상황 진단하기 (성능 문제)

`analyze`는 코드의 전반적인 상태를 파악하는 데 좋지만, 명확한 문제가 있을 때는 `troubleshoot`이 더 효과적이다.

```bash
# 성능 저하 문제 직접 진단
# (한글 설명도 가능하지만, 영어로 설명 시 더 정확한 기술 용어 매칭 가능)
/sc:troubleshoot "GET /api/products endpoint is taking > 3000ms, analyze potential causes like N+1 queries or missing indexes." --think
# `root-cause-analyst`와 `performance-engineer` 에이전트가 자동으로 활성화
```

SuperClaude가 관련 서비스(`ProductService`)와 리포지토리(`ProductRepository`)를 분석하고, 다음과 원인 분석 및 해결책을 제시해준다.

### Phase 3: `troubleshoot` 결과를 바탕으로 수정하기

`troubleshoot`에서 이미 구체적인 원인과 해결책 제시했다면, 구현 명령을 실행하여 수정할 수 있다.

```bash
# 제안된 해결책 1번(JOIN FETCH) 적용
/sc:implement "Apply JOIN FETCH to ProductRepository.findAll() to fix the N+1 query problem." --validate --safe-mode
# `backend-architect` 에이전트가 자동으로 활성화
```

### Phase 4: 수정 결과 검증하기

핵심 버그를 해결했으니, 실제 성능이 개선되었는지 테스트로 검증한다.

```bash
# 성능 문제 해결 검증 테스트
/sc:test "product_api_performance_validation" --coverage --validate
# `quality-engineer` 에이전트가 자동으로 활성화
```

### Phase 5: 코드 리뷰 및 문서화

코드 리뷰를 진행하거나, 문서화를 진행하여 결과를 확인한다.

```bash
# 팀 공유용 간단 요약 생성
/sc:document "product_api_performance_fix_summary" --type summary
```

### Phase 6: 최종 커밋

모든 작업이 완료되었으면 `git` 명령어를 사용하여 안전하게 커밋 및 푸시를 실행한다.

```bash
# 현재 변경사항 분석 및 커밋 전략 수립
/sc:git analyze-changes --think

# 분석 기반으로 커밋 및 푸시 실행
/sc:git commit-and-push --safe-mode --validate
```
