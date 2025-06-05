export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum BatchStatus {
  YET_TO_START = 'yet_to_start',
  TRIGGERED = 'triggered',
  COMPLETED = 'completed'
}

export enum IngestionStatus {
  YET_TO_START = 'yet_to_start',
  TRIGGERED = 'triggered',
  COMPLETED = 'completed'
}

export interface IngestRequest {
  ids: number[];
  priority: Priority;
}

export interface Batch {
  batch_id: string;
  ids: number[];
  status: BatchStatus;
  created_at: Date;
  priority: Priority;
}

export interface IngestionRecord {
  ingestion_id: string;
  status: IngestionStatus;
  batches: Batch[];
  created_at: Date;
  priority: Priority;
}

export interface ProcessedData {
  id: number;
  data: string;
}