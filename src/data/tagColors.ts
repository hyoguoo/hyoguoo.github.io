export const TAG_HUES: Record<string, number> = {
  'Java': 25,
  'Spring': 125,
  'Spring & JPA': 125,
  'MySQL': 225,
  'AI': 265,
  'AI-Assisted Development': 265,
  'Network': 235,
  'Docker': 205,
  'Kafka': 310,
  'Redis': 0,
  'OOP': 45,
  'Secure': 355,
  'Test': 105,
  'Operating System': 285,
  'Computer Architecture': 65,
  'Large-Scale System': 245,
  'Performance Engineering': 165,
  'Setting': 185,
  'Payment Platform Project': 340,
  'Gradle': 85,
  'DDD': 145,
};

export const CATEGORY_ORDER: string[] = [
  'Payment Platform Project',
  'AI-Assisted Development',
  'Java',
  'Spring & JPA',
  'MySQL',
];

/**
 * Returns a consistent hue (0-360) for a given string.
 * Priority: TAG_HUES mapping > String Hash Fallback
 */
export function getHue(text: string): number {
  const trimmed = text.trim();
  if (TAG_HUES[trimmed] !== undefined) return TAG_HUES[trimmed];
  
  // Fallback: Generate hue from string hash for consistent colors
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = trimmed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}
