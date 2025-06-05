import request from 'supertest';
import app from '../server';
import { Priority } from '../types';

// Helper to track created ingestions (for reference, though cleanup is automatic)
const trackIngestion = (ingestionId: string) => {
  // Not needed for cleanup anymore, but keeping for test clarity
};

describe('Data Ingestion API', () => {
  // Setup before all tests
  beforeAll(async () => {
    // Give the server time to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  // Clean up after each test
  afterEach(async () => {
    // Stop the processor if it exists
    if (typeof global !== 'undefined' && (global as any).batchProcessor) {
      try {
        await (global as any).batchProcessor.stopProcessing();
        (global as any).batchProcessor.forceStop();
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    // Wait for any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  // Final cleanup
  afterAll(async () => {
    // Force stop the processor
    if (typeof global !== 'undefined' && (global as any).batchProcessor) {
      try {
        await (global as any).batchProcessor.stopProcessing();
        (global as any).batchProcessor.forceStop();
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    // Wait for final cleanup
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  describe('POST /ingest', () => {
    it('should create an ingestion request successfully', async () => {
      const response = await request(app)
        .post('/ingest')
        .send({
          ids: [1, 2, 3, 4, 5],
          priority: Priority.HIGH
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ingestion_id');
      expect(typeof response.body.ingestion_id).toBe('string');

      trackIngestion(response.body.ingestion_id);
    });

    it('should handle missing priority (default to MEDIUM)', async () => {
      const response = await request(app)
        .post('/ingest')
        .send({
          ids: [1, 2, 3]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ingestion_id');

      trackIngestion(response.body.ingestion_id);
    });

    it('should reject invalid ids', async () => {
      const response = await request(app)
        .post('/ingest')
        .send({
          ids: [],
          priority: Priority.HIGH
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid priority', async () => {
      const response = await request(app)
        .post('/ingest')
        .send({
          ids: [1, 2, 3],
          priority: 'INVALID'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject ids out of range', async () => {
      const response = await request(app)
        .post('/ingest')
        .send({
          ids: [0, 1000000008],
          priority: Priority.HIGH
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /status/:ingestion_id', () => {
    it('should return status for existing ingestion', async () => {
      // First create an ingestion
      const ingestResponse = await request(app)
        .post('/ingest')
        .send({
          ids: [1, 2, 3, 4, 5],
          priority: Priority.MEDIUM
        });

      const ingestion_id = ingestResponse.body.ingestion_id;
      trackIngestion(ingestion_id);

      // Then check its status
      const statusResponse = await request(app)
        .get(`/status/${ingestion_id}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body).toHaveProperty('ingestion_id', ingestion_id);
      expect(statusResponse.body).toHaveProperty('status');
      expect(statusResponse.body).toHaveProperty('batches');
      expect(Array.isArray(statusResponse.body.batches)).toBe(true);
    });

    it('should return 404 for non-existent ingestion', async () => {
      const response = await request(app)
        .get('/status/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Batch Size', () => {
    it('should split IDs into batches of maximum 3', async () => {
      const response = await request(app)
        .post('/ingest')
        .send({
          ids: [1, 2, 3, 4, 5, 6, 7],
          priority: Priority.HIGH
        });

      trackIngestion(response.body.ingestion_id);

      const statusResponse = await request(app)
        .get(`/status/${response.body.ingestion_id}`);

      const batches = statusResponse.body.batches;
      expect(batches).toHaveLength(3); // [1,2,3], [4,5,6], [7]
      expect(batches[0].ids).toHaveLength(3);
      expect(batches[1].ids).toHaveLength(3);
      expect(batches[2].ids).toHaveLength(1);
    });
  });
});