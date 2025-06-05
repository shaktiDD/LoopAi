import express, { Request, Response } from 'express';
import { InMemoryStore } from './store';
import { IngestRequest, Priority } from './types';

export function createRoutes(store: InMemoryStore): express.Router {
  const router = express.Router();

  // Ingestion API
  router.post('/ingest', (req: Request, res: Response) => {
    try {
      const { ids, priority = Priority.MEDIUM }: IngestRequest = req.body;

      // Validate input
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ 
          error: 'ids must be a non-empty array of integers' 
        });
        return;
      }

      if (!ids.every(id => Number.isInteger(id) && id >= 1 && id <= 1000000007)) {
        res.status(400).json({ 
          error: 'All ids must be integers between 1 and 10^9+7' 
        });
        return;
      }

      if (!Object.values(Priority).includes(priority)) {
        res.status(400).json({ 
          error: 'priority must be HIGH, MEDIUM, or LOW' 
        });
        return;
      }

      const ingestion_id = store.createIngestion(ids, priority);
      
      res.json({ ingestion_id });
    } catch (error) {
      console.error('Error in /ingest:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Status API
  router.get('/status/:ingestion_id', (req: Request, res: Response) => {
    try {
      const { ingestion_id } = req.params;
      
      const ingestion = store.getIngestion(ingestion_id);
      
      if (!ingestion) {
        res.status(404).json({ 
          error: 'Ingestion not found' 
        });
        return;
      }

      res.json({
        ingestion_id: ingestion.ingestion_id,
        status: ingestion.status,
        batches: ingestion.batches.map(batch => ({
          batch_id: batch.batch_id,
          ids: batch.ids,
          status: batch.status
        }))
      });
    } catch (error) {
      console.error('Error in /status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}