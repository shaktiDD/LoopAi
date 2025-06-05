import { v4 as uuidv4 } from 'uuid';
import { IngestionRecord, Batch, BatchStatus, IngestionStatus, Priority } from './types';
import { PriorityQueue } from './queue';

export class InMemoryStore {
  private ingestions: Map<string, IngestionRecord> = new Map();
  private batches: Map<string, Batch> = new Map();
  private queue: PriorityQueue = new PriorityQueue();

  createIngestion(ids: number[], priority: Priority): string {
    const ingestion_id = uuidv4();
    const batches: Batch[] = [];
    
    // Split IDs into batches of 3
    for (let i = 0; i < ids.length; i += 3) {
      const batchIds = ids.slice(i, i + 3);
      const batch: Batch = {
        batch_id: uuidv4(),
        ids: batchIds,
        status: BatchStatus.YET_TO_START,
        created_at: new Date(),
        priority
      };
      
      batches.push(batch);
      this.batches.set(batch.batch_id, batch);
      this.queue.enqueue(batch);
    }
    
    const ingestion: IngestionRecord = {
      ingestion_id,
      status: IngestionStatus.YET_TO_START,
      batches,
      created_at: new Date(),
      priority
    };
    
    this.ingestions.set(ingestion_id, ingestion);
    return ingestion_id;
  }

  getIngestion(ingestion_id: string): IngestionRecord | undefined {
    const ingestion = this.ingestions.get(ingestion_id);
    if (!ingestion) {
      return undefined;
    }

    // Update overall status based on batch statuses
    const batchStatuses = ingestion.batches.map(b => this.batches.get(b.batch_id)?.status || BatchStatus.YET_TO_START);
    
    let overallStatus: IngestionStatus;
    if (batchStatuses.every(status => status === BatchStatus.COMPLETED)) {
      overallStatus = IngestionStatus.COMPLETED;
    } else if (batchStatuses.some(status => status === BatchStatus.TRIGGERED || status === BatchStatus.COMPLETED)) {
      overallStatus = IngestionStatus.TRIGGERED;
    } else {
      overallStatus = IngestionStatus.YET_TO_START;
    }

    // Update batches with current status
    const updatedBatches = ingestion.batches.map(batch => ({
      ...batch,
      status: this.batches.get(batch.batch_id)?.status || BatchStatus.YET_TO_START
    }));

    return {
      ...ingestion,
      status: overallStatus,
      batches: updatedBatches
    };
  }

  updateBatchStatus(batch_id: string, status: BatchStatus): void {
    const batch = this.batches.get(batch_id);
    if (batch) {
      batch.status = status;
    }
  }

  dequeueBatch(): Batch | undefined {
    return this.queue.dequeue();
  }

  getQueueSize(): number {
    return this.queue.size();
  }
}