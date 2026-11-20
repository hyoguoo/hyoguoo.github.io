import { execFileSync } from 'node:child_process';
import { newestFirst } from './content';

const CONTENT_ROOT = 'src/content/docs';

let commitTimes: Map<string, number> | undefined;

/** Maps each content file to the time (ms) of the latest commit that touched it. */
function loadCommitTimes(): Map<string, number> {
  const times = new Map<string, number>();
  try {
    const log = execFileSync('git', ['log', '--format=@%at', '--name-only', '--', CONTENT_ROOT], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    let commitTime = 0;
    for (const line of log.split('\n')) {
      if (line.startsWith('@')) commitTime = Number(line.slice(1)) * 1000;
      // git log lists newest commits first, so the first time seen is the latest commit.
      else if (line && !times.has(line)) times.set(line, commitTime);
    }
  } catch {
    // Without git history every file ties, and ordering falls back to dates only.
  }
  return times;
}

/** Files never committed count as the newest. */
export function gitUpdatedTime(filePath: string | undefined): number {
  commitTimes ??= loadCommitTimes();
  if (!filePath) return 0;
  return commitTimes.get(filePath.replace(/^\.\//, '')) ?? Number.POSITIVE_INFINITY;
}

type SortableEntry = { filePath?: string; data: { lastUpdated?: unknown; date?: unknown } };

/** Newest date first; entries with the same date are ordered by their latest git commit, newest first. */
export function newestFirstThenCommitted(a: SortableEntry, b: SortableEntry): number {
  const byDate = newestFirst(a, b);
  if (byDate !== 0) return byDate;
  const committedA = gitUpdatedTime(a.filePath);
  const committedB = gitUpdatedTime(b.filePath);
  if (committedA === committedB) return 0;
  return committedB > committedA ? 1 : -1;
}
