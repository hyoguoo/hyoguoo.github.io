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
  ],
};
