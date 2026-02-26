export type SectionConfig = { label: string; slugs: string[] }[];

export const docsSections: Record<string, SectionConfig> = {
  java: [
    {
      label: 'JVM',
      slugs: ['jvm', 'jvm-execution-and-optimization', 'garbage-collection'],
    },
    {
      label: 'Basic Syntax',
      slugs: ['variable', 'operator', 'print', 'array', 'modifier', 'enums', 'exception-handling'],
    },
    {
      label: 'Object-Oriented Programming',
      slugs: ['class', 'inheritance', 'polymorphism', 'interface'],
    },
    {
      label: 'java.lang package',
      slugs: ['object-class', 'string-class', 'wrapper-class'],
    },
    {
      label: 'Data Processing',
      slugs: ['collections', 'map', 'iterator-stream', 'optional'],
    },
    {
      label: 'Multi-Thread',
      slugs: ['volatile', 'cas', 'thread', 'monitor', 'synchronization', 'virtual-thread'],
    },
    {
      label: 'Advanced',
      slugs: ['varargs', 'generic', 'lambda', 'reflection', 'serialization'],
    },
    {
      label: 'Effective Java',
      slugs: ['effective-java'],
    },
  ],
  mysql: [
    {
      label: 'Architecture',
      slugs: ['architecture', 'query-processing'],
    },
    {
      label: 'Transaction & Lock',
      slugs: ['transaction', 'mysql-lock', 'innodb-lock', 'isolation-level', 'select-lock'],
    },
    {
      label: 'Index',
      slugs: ['index-overview', 'btree-index', 'clustering-index', 'unique-index', 'foreign-key', 'etc-index', 'index-condition-pushdown'],
    },
    {
      label: 'Optimizer & Execution Plan',
      slugs: ['optimizer', 'data-processing', 'statistics', 'check-execution-plan', 'analyze-execution-plan'],
    },
    {
      label: 'Query',
      slugs: [
        'query-system-variable', 'literal-notation', 'operator', 'built-in-function',
        'select', 'sub-query', 'insert', 'update-delete', 'performance-test',
      ],
    },
    {
      label: 'Data Type',
      slugs: ['char-varchar', 'number', 'date-time', 'enum'],
    },
    {
      label: 'Operations',
      slugs: ['replication'],
    },
  ],
  'ai-assisted-development': [
    {
      label: 'AI & Prompt Engineering',
      slugs: [
        'ai-assistant-how-it-works',
        'prompt-engineering-for-devs',
      ],
    },
    {
      label: 'Claude Code',
      slugs: [
        'claude-code-core-features-guide',
        'claude-context-management',
        'claude-code-command-operation-logic',
        'claude-code-super-claude-framework',
      ],
    },
  ],
  'computer-architecture': [
    {
      label: 'Fundamentals',
      slugs: ['basic', 'interal-lagnuage-system', 'memory'],
    },
    {
      label: 'CPU & Execution',
      slugs: ['cpu-work', 'interrupt', 'instruction-level-parallelism'],
    },
  ],
  docker: [
    {
      label: 'Core Concepts',
      slugs: ['introduction', 'architecture', 'image-and-container'],
    },
    {
      label: 'Build',
      slugs: ['dockerfile', 'docker-compose'],
    },
    {
      label: 'Runtime',
      slugs: ['networking', 'storage-and-volume', 'security'],
    },
  ],
  kafka: [
    {
      label: 'Core Concepts',
      slugs: ['introduction', 'core-components', 'zookeeper-and-kraft'],
    },
    {
      label: 'Architecture',
      slugs: [
        'topic-and-partition-internals',
        'producer-internals',
        'consumer-internals',
        'replication-internals',
        'message-delivery-semantics',
      ],
    },
  ],
  'large-scale-system': [
    {
      label: 'Architecture Patterns',
      slugs: [
        'monolithic-vs-microservices-architecture',
        'synchronous-vs-asynchronous-communication',
        'saga-pattern',
        'transactional-outbox-pattern',
        'circuit-breaker-pattern',
      ],
    },
    {
      label: 'System Design Interview',
      slugs: ['system-design-interview'],
    },
  ],
  network: [
    {
      label: 'TCP/IP Layers',
      slugs: [
        'tcp-ip-4-layer',
        'network-access-layer',
        'network-layer',
        'transport-layer',
      ],
    },
    {
      label: 'Application Layer - TCP/IP Layer 4',
      slugs: [
        'dns',
        'uri',
        'http',
        'http-message',
        'entity',
        'method',
        'connection',
        'https',
        'cache',
        'http2',
        'cookie',
        'encoding',
      ],
    },
    {
      label: 'Advanced',
      slugs: ['proxy', 'cors'],
    },
  ],
  oop: [
    {
      label: 'Concepts',
      slugs: ['introduce', 'abstract', 'type'],
    },
    {
      label: 'Design',
      slugs: ['role-responsibility-cooperation', 'function-structure', 'solid'],
    },
  ],
  'operating-system': [
    {
      label: 'Process & CPU',
      slugs: ['kernel', 'process', 'thread', 'cpu-scheduling'],
    },
    {
      label: 'Synchronization',
      slugs: ['synchronization', 'deadlock'],
    },
    {
      label: 'Memory & Storage',
      slugs: ['continuous-memory-allocation', 'virtual-memory', 'file-system'],
    },
  ],
  redis: [
    {
      label: 'Basic',
      slugs: ['basic', 'data-structure', 'key-management'],
    },
    {
      label: 'Use Cases',
      slugs: ['data-structure-use-case', 'cache', 'message-broker'],
    },
    {
      label: 'Operations',
      slugs: ['data-backup', 'sentinel', 'cluster'],
    },
  ],
  secure: [
    {
      label: 'Fundamentals',
      slugs: ['digital-cryptography-basic', 'secure-coding'],
    },
    {
      label: 'Authentication',
      slugs: ['jwt', 'oauth'],
    },
  ],
  setting: [
    {
      label: 'Mac Tools',
      slugs: ['brew', 'karabiner-elements'],
    },
    {
      label: 'Git & GitHub',
      slugs: ['github-multiple-accounts', 'github-verified-commit'],
    },
    {
      label: 'Dev Tools',
      slugs: ['intellij', 'jvm-version-control'],
    },
  ],
  spring: [
    {
      label: 'Basic',
      slugs: ['introduce', 'oop'],
    },
    {
      label: 'Spring IoC Container & DI',
      slugs: ['spring-container', 'beans', 'component-scan', 'dependency-injection'],
    },
    {
      label: 'Spring Core',
      slugs: ['singleton', 'aop', 'event-listener'],
    },
    {
      label: 'Spring Web',
      slugs: [
        'servlet',
        'spring-web-mvc',
        'dispatcher-servlet',
        'handler-mapping-adapter',
        'view-resolver',
        'message-converter',
        'validator',
        'filter-interceptor',
        'exception-handling',
      ],
    },
    {
      label: 'DB Connection',
      slugs: ['jdbc', 'transactional', 'jpa-basic', 'persistence-context'],
    },
    {
      label: 'Spring Boot',
      slugs: [
        'spring-boot-core-execution',
        'spring-boot-properties',
        'spring-boot-auto-configuration',
      ],
    },
    {
      label: 'Testing',
      slugs: ['spring-boot-test-context', 'mocking-framework-mockito', 'testcontainers'],
    },
    {
      label: 'Spring WebFlux & Reactive',
      slugs: [
        'reactive-programming',
        'spring-webflux',
        'mono-and-flux',
        'scheduler-thread-model',
        'netty-eventloop',
        'webflux-api-gateway',
      ],
    },
    {
      label: 'Additional',
      slugs: ['spel', 'spring-cloud-basic'],
    },
  ],
  test: [
    {
      label: 'Test',
      slugs: ['testing-basic', 'test-guide', 'test-double', 'test-fixture'],
    },
  ],
};
