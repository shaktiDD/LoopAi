import express from 'express';
import cors from 'cors';
import { InMemoryStore } from './store';
import { BatchProcessor } from './processor';
import { createRoutes } from './routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize store and processor
const store = new InMemoryStore();
const processor = new BatchProcessor(store);

// Make processor globally accessible for tests
(global as any).batchProcessor = processor;

// Start background processing only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  processor.startProcessing();
}

// Routes
app.use('/', createRoutes(store));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    queueSize: store.getQueueSize()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Data Ingestion API server running on port ${PORT}`);
});

export default app;