# Data Ingestion API

A high-performance data ingestion system built with Node.js, Express, and TypeScript. Features priority-based queue management, intelligent batching, rate limiting, and comprehensive testing.

## 🚀 Features

- **Priority Queue Management**: Process ingestion requests with HIGH, MEDIUM, and LOW priority levels
- **Intelligent Batching**: Automatically splits large datasets into manageable batches (max 3 items per batch)
- **Rate Limiting**: Built-in rate limiting to prevent system overload (5-second intervals between batch processing)
- **Real-time Status Tracking**: Monitor ingestion progress with detailed batch-level status
- **In-Memory Storage**: Fast, efficient data storage for development and testing
- **Comprehensive Testing**: Full test suite with 10 test cases covering all functionality
- **TypeScript**: Fully typed for better development experience and error prevention

## 📋 API Endpoints

### POST /ingest

Create a new data ingestion request.

**Request Body:**

```json
{
  "ids": [1, 2, 3, 4, 5],
  "priority": "HIGH"
}
```

**Parameters:**

- `ids` (required): Array of integers between 1 and 10^9+7
- `priority` (optional): "HIGH", "MEDIUM", or "LOW" (defaults to "MEDIUM")

**Response:**

```json
{
  "ingestion_id": "uuid-string"
}
```

### GET /status/:ingestion_id

Get the status of an ingestion request.

**Response:**

```json
{
  "ingestion_id": "uuid-string",
  "status": "triggered",
  "batches": [
    {
      "batch_id": "batch-uuid",
      "ids": [1, 2, 3],
      "status": "completed"
    },
    {
      "batch_id": "batch-uuid",
      "ids": [4, 5],
      "status": "triggered"
    }
  ]
}
```

## 🛠️ Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd data-ingestion-api
```

2. **Install dependencies:**

```bash
npm install
```

3. **Build the project:**

```bash
npm run build
```

## 🏃‍♂️ Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:3000` with hot reloading.

### Production Mode

```bash
npm start
```

### Testing

```bash
npm test
```

Runs the complete test suite with 10 test cases covering all API functionality.

## 🏗️ Project Structure

```
src/
├── server.ts          # Express server setup and configuration
├── routes.ts          # API route definitions
├── store.ts           # In-memory data storage
├── processor.ts       # Batch processing logic with rate limiting
├── queue.ts           # Priority queue implementation
├── types.ts           # TypeScript type definitions
└── test/
    ├── api.test.ts     # Comprehensive API tests
    └── setup.ts        # Test configuration
```

## 🔧 Configuration

### Environment Variables

- `NODE_ENV`: Set to `test` for testing environment
- `PORT`: Server port (defaults to 3000)

### Rate Limiting

- Processing interval: 5 seconds between batches
- Batch size: Maximum 3 items per batch
- Automatic queue management based on priority

## 🧪 Testing

The project includes comprehensive testing with the following test cases:

1. **Ingestion API Tests:**

   - ✅ Create ingestion request successfully
   - ✅ Handle missing priority (default to MEDIUM)
   - ✅ Reject invalid IDs (empty array)
   - ✅ Reject invalid priority values
   - ✅ Reject IDs out of range (0 or > 10^9+7)

2. **Status API Tests:**

   - ✅ Return status for existing ingestion
   - ✅ Return 404 for non-existent ingestion

3. **Batch Processing Tests:**
   - ✅ Split IDs into batches of maximum 3 items
   - ✅ Proper priority queue ordering
   - ✅ Rate limiting functionality

### Running Specific Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## 📊 System Architecture

### Priority Queue System

- **HIGH Priority**: Processed first
- **MEDIUM Priority**: Default priority level
- **LOW Priority**: Processed last

### Batch Processing

1. Incoming requests are split into batches of maximum 3 items
2. Batches are queued based on priority
3. Rate limiter processes one batch every 5 seconds
4. Status is updated in real-time as batches complete

### Data Flow

```
Request → Validation → Batching → Priority Queue → Rate-Limited Processing → Status Updates
```

## 🚦 Status States

### Ingestion Status

- `yet_to_start`: Ingestion created but not yet started
- `triggered`: Processing has begun
- `completed`: All batches processed

### Batch Status

- `yet_to_start`: Batch queued but not processed
- `triggered`: Batch is currently being processed
- `completed`: Batch processing finished

## 🛡️ Error Handling

The API includes comprehensive error handling for:

- Invalid input validation
- Rate limiting constraints
- Non-existent resource requests
- Internal server errors

All errors return appropriate HTTP status codes and descriptive error messages.

## 🔍 Monitoring

### Logging

- Request/response logging
- Processing status updates
- Error tracking
- Rate limiting notifications

### Health Check

The API provides basic health monitoring through the status endpoint.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🔧 Development Notes

### TypeScript Configuration

- Strict mode enabled
- ES2020 target
- Full type checking

### Testing Strategy

- Unit tests for individual components
- Integration tests for API endpoints
- Mocking for external dependencies
- Cleanup procedures for test isolation

### Performance Considerations

- In-memory storage for fast access
- Efficient priority queue implementation
- Rate limiting to prevent system overload
- Batch processing for optimal throughput

---

## 📞 Support

For questions or issues, please open an issue in the repository or contact the development team.
