import { Batch, BatchStatus, ProcessedData } from './types';
import { InMemoryStore } from './store';

export class BatchProcessor {
  private store: InMemoryStore;
  private isProcessing: boolean = false;
  private shouldStop: boolean = false;
  private lastProcessTime: number = 0;
  private readonly RATE_LIMIT_MS = 5000; // 5 seconds
  private processingPromise: Promise<void> | null = null;
  private activeTimeouts: Set<NodeJS.Timeout> = new Set();
  private currentBatchPromise: Promise<void> | null = null;

  constructor(store: InMemoryStore) {
    this.store = store;
  }

  async processBatch(batch: Batch): Promise<void> {
    // Create a promise that we can track and cancel
    this.currentBatchPromise = this.doProcessBatch(batch);
    try {
      await this.currentBatchPromise;
    } finally {
      this.currentBatchPromise = null;
    }
  }

  private async doProcessBatch(batch: Batch): Promise<void> {
    if (this.shouldStop) {
      return;
    }

    // Update batch status to triggered
    this.store.updateBatchStatus(batch.batch_id, BatchStatus.TRIGGERED);

    // Simulate external API calls for each ID
    const processedData: ProcessedData[] = [];

    for (const id of batch.ids) {
      if (this.shouldStop) {
        return;
      }

      // Simulate API delay with cancellation
      await this.cancellableDelay(100);

      if (this.shouldStop) {
        return;
      }

      processedData.push({
        id,
        data: 'processed'
      });
    }

    if (this.shouldStop) {
      return;
    }
    // Update batch status to completed
    this.store.updateBatchStatus(batch.batch_id, BatchStatus.COMPLETED);

    // Only log if not shutting down, still processing, and not in test mode
    if (!this.shouldStop && this.isProcessing && process.env.NODE_ENV !== 'test') {
      console.log(`Batch ${batch.batch_id} completed processing IDs: ${batch.ids.join(', ')}`);
    }
  }

  async startProcessing(): Promise<void> {
    if (this.isProcessing && !this.shouldStop) {
      return;
    }

    this.isProcessing = true;
    this.shouldStop = false;
    this.processingPromise = this.processQueue();
  }

  async stopProcessing(): Promise<void> {
    this.shouldStop = true;

    // Clear all active timeouts
    this.activeTimeouts.forEach(timeout => clearTimeout(timeout));
    this.activeTimeouts.clear();

    // Wait for current batch to complete or cancel
    if (this.currentBatchPromise) {
      try {
        await Promise.race([
          this.currentBatchPromise,
          new Promise(resolve => setTimeout(resolve, 100)) // Max 100ms wait
        ]);
      } catch (error) {
        // Ignore errors during shutdown
      }
    }

    // Wait for processing loop to complete
    if (this.processingPromise) {
      try {
        await Promise.race([
          this.processingPromise,
          new Promise(resolve => setTimeout(resolve, 200)) // Max 200ms wait
        ]);
      } catch (error) {
        // Ignore errors during shutdown
      }
      this.processingPromise = null;
    }

    this.isProcessing = false;
  }

  private async processQueue(): Promise<void> {
    try {
      while (!this.shouldStop) {
        const batch = this.store.dequeueBatch();

        if (!batch) {
          // No batches to process, wait and check again
          await this.cancellableDelay(1000);
          continue;
        }

        // Enforce rate limit
        const now = Date.now();
        const timeSinceLastProcess = now - this.lastProcessTime;
        if (timeSinceLastProcess < this.RATE_LIMIT_MS && this.lastProcessTime > 0) {
          const waitTime = this.RATE_LIMIT_MS - timeSinceLastProcess;
          if (!this.shouldStop && process.env.NODE_ENV !== 'test') {
            console.log(`Rate limit: waiting ${waitTime}ms before processing next batch`);
          }
          if (!this.shouldStop) {
            await this.cancellableDelay(waitTime);
          }
        }

        if (this.shouldStop) {
          break;
        }

        this.lastProcessTime = Date.now();

        try {
          await this.processBatch(batch);
        } catch (error) {
          if (!this.shouldStop && process.env.NODE_ENV !== 'test') {
            console.error(`Error processing batch ${batch.batch_id}:`, error);
          }
        }
      }
    } catch (error) {
      // Ignore errors during shutdown
      if (!this.shouldStop && process.env.NODE_ENV !== 'test') {
        console.error('Error in process queue:', error);
      }
    } finally {
      this.isProcessing = false;
      this.clearAllTimeouts();
    }
  }

  private cancellableDelay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      if (this.shouldStop) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        this.activeTimeouts.delete(timeout);
        resolve();
      }, ms);

      this.activeTimeouts.add(timeout);
    });
  }

  private clearAllTimeouts(): void {
    this.activeTimeouts.forEach(timeout => clearTimeout(timeout));
    this.activeTimeouts.clear();
  }

  // Force stop everything immediately
  forceStop(): void {
    this.shouldStop = true;
    this.isProcessing = false;
    this.clearAllTimeouts();
    this.processingPromise = null;
    this.currentBatchPromise = null;
  }

  // Getter to check if processor is currently processing
  get isCurrentlyProcessing(): boolean {
    return this.isProcessing && !this.shouldStop;
  }
}