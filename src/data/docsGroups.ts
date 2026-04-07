export interface DocsGroupItem {
  key: string;
  label: string;
}

export interface DocsGroup {
  label: string;
  items: DocsGroupItem[];
}

export const DOCS_GROUPS: DocsGroup[] = [
  { label: 'Computer Science', items: [
    { key: 'computer-architecture', label: 'Computer Architecture' },
    { key: 'operating-system', label: 'Operating System' },
    { key: 'network', label: 'Network' },
    { key: 'secure', label: 'Secure' },
  ]},
  { label: 'Database', items: [
    { key: 'mysql', label: 'MySQL' },
    { key: 'redis', label: 'Redis' },
  ]},
  { label: 'Language', items: [
    { key: 'java', label: 'Java' },
  ]},
  { label: 'Framework', items: [
    { key: 'spring', label: 'Spring' },
  ]},
  { label: 'Messaging & Streaming', items: [
    { key: 'kafka', label: 'Kafka' },
  ]},
  { label: 'Software Engineering', items: [
    { key: 'test', label: 'Test' },
    { key: 'ai-assisted-development', label: 'AI-Assisted Development' },
  ]},
  { label: 'Build & Infra', items: [
    { key: 'gradle', label: 'Gradle' },
    { key: 'docker', label: 'Docker' },
  ]},
  { label: 'System Architecture', items: [
    { key: 'large-scale-system', label: 'Large-Scale System' },
    { key: 'performance-engineering', label: 'Performance Engineering' },
  ]},
  { label: 'Software Design', items: [
    { key: 'oop', label: 'OOP' },
    { key: 'ddd', label: 'DDD' },
  ]},
  { label: 'ETC', items: [
    { key: 'setting', label: 'Setting' },
  ]},
];
