import { Batch, Priority } from './types';

export class PriorityQueue {
  private queue: Batch[] = [];

  enqueue(batch: Batch): void {
    this.queue.push(batch);
    this.sort();
  }

  dequeue(): Batch | undefined {
    return this.queue.shift();
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  size(): number {
    return this.queue.length;
  }

  private sort(): void {
    this.queue.sort((a, b) => {
      // First sort by priority (HIGH > MEDIUM > LOW)
      const priorityOrder = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      // If priorities are equal, sort by created_at (earlier first)
      return a.created_at.getTime() - b.created_at.getTime();
    });
  }

  peek(): Batch | undefined {
    return this.queue[0];
  }
}