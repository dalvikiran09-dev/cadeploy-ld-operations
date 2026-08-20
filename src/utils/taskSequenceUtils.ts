import { Task } from '../types';

export const TASK_CODE_PREFIX = 'LD-TSK-';
export const STARTING_TASK_SEQUENCE = 101;

/**
 * Formats a numeric sequence number into the standard LD-TSK-### format.
 * Example: 101 -> "LD-TSK-101"
 */
export function formatTaskCode(sequence: number): string {
  return `${TASK_CODE_PREFIX}${sequence}`;
}

/**
 * Extracts sequence number from a task code string.
 * Example: "LD-TSK-105" -> 105
 */
export function parseTaskSequenceNumber(code?: string | null): number | null {
  if (!code) return null;
  const match = code.match(/LD-TSK-(\d+)/i);
  if (match && match[1]) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Deterministic comparison helper for task creation ordering.
 * 1. Primary sort: created_at ASC (or createdAt)
 * 2. Deterministic tie-breaker: id ASC
 */
export function compareTasksByCreation(a: Task, b: Task): number {
  const rawA = a.createdAt || (a as any).created_at || '';
  const rawB = b.createdAt || (b as any).created_at || '';

  const timeA = new Date(rawA).getTime();
  const timeB = new Date(rawB).getTime();

  // If both are valid timestamps and different
  if (!isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
    return timeA - timeB;
  }

  // If timestamp strings differ
  if (rawA !== rawB) {
    return rawA.localeCompare(rawB);
  }

  // Deterministic tie-breaker: id ASC
  return (a.id || '').localeCompare(b.id || '');
}

export interface ResequenceResult {
  resequencedTasks: Task[];
  hasChanges: boolean;
  changedTasks: Task[];
  totalActiveCount: number;
  firstSequence: number;
  lastSequence: number;
  duplicatesCount: number;
  gapsCount: number;
}

/**
 * Resequences a collection of active tasks strictly by:
 * 1. created_at ASC
 * 2. id ASC (tie-breaker)
 *
 * Assigns continuous LD-TSK-101, LD-TSK-102, ...
 * Preserves all other task fields (including immutable ID, hours, assignment, comments).
 */
export function resequenceTasks(tasks: Task[]): ResequenceResult {
  // Only process active non-deleted tasks
  const activeTasks = tasks.filter(t => !t.deleted);

  // Sort strictly by created_at ASC then id ASC
  const sorted = [...activeTasks].sort(compareTasksByCreation);

  const changedTasks: Task[] = [];
  const seenCodes = new Set<string>();
  let duplicatesCount = 0;

  const resequencedTasks: Task[] = sorted.map((task, index) => {
    const expectedSequence = STARTING_TASK_SEQUENCE + index;
    const expectedCode = formatTaskCode(expectedSequence);

    if (seenCodes.has(expectedCode)) {
      duplicatesCount++;
    }
    seenCodes.add(expectedCode);

    if (task.code !== expectedCode) {
      const updatedTask: Task = {
        ...task,
        code: expectedCode
      };
      changedTasks.push(updatedTask);
      return updatedTask;
    }

    return task;
  });

  const totalActiveCount = resequencedTasks.length;
  const firstSequence = totalActiveCount > 0 ? STARTING_TASK_SEQUENCE : 0;
  const lastSequence = totalActiveCount > 0 ? STARTING_TASK_SEQUENCE + totalActiveCount - 1 : 0;
  const expectedSpan = totalActiveCount > 0 ? lastSequence - firstSequence + 1 : 0;
  const gapsCount = totalActiveCount > 0 ? Math.max(0, expectedSpan - totalActiveCount) : 0;

  return {
    resequencedTasks,
    hasChanges: changedTasks.length > 0,
    changedTasks,
    totalActiveCount,
    firstSequence,
    lastSequence,
    duplicatesCount,
    gapsCount
  };
}
