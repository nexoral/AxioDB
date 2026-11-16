# AxioDB Native Vector Search

<vector_overview>
AxioDB features embedded exact k-NN similarity search with zero external C++ or native dependencies.
* Worker Thread accelerated mathematical evaluation (SIMD-ready).
* Operates over any `number[]` array stored directly on JSON documents.
* Supported metrics: `cosine` (default), `dot` (inner product), and `euclidean` (L2 distance).
* Search returns matching documents enriched with a calculated `_score` field.
* Available uniformly across all surfaces: Embedded, TCP, HTTP, and MCP.
</vector_overview>

<embedded_syntax>
## 1. Embedded Core Usage

```typescript
// 1. Insert documents with floating-point embedding arrays
await products.insert({
  title: "Noise Cancelling Headphones",
  category: "audio",
  price: 299,
  embedding: [0.12, 0.85, 0.34, -0.45],
});

// 2. Direct exact k-NN search across collection
const queryVector = [0.15, 0.82, 0.30, -0.40];
const results = await products.vectorSearch("embedding", queryVector, {
  topK: 5,               // Maximum number of closest matches to return
  minScore: 0.70,        // Similarity threshold filter
  metric: "cosine",      // "cosine" (default) | "dot" | "euclidean"
});

// 3. Pre-filtered Vector Search (filter subset before vector ranking)
const filteredResults = await products
  .query({ category: "audio", price: { $lte: 350 } })
  .vectorSearch("embedding", queryVector, {
    topK: 5,
    minScore: 0.75,
    metric: "cosine",
  })
  .exec();
```
</embedded_syntax>

<distance_metrics>
## 2. Distance Metrics Reference

| Metric | Range | Best For | Description |
| :--- | :--- | :--- | :--- |
| **`cosine`** (default) | `[-1.0, 1.0]` | Text embeddings (OpenAI, Voyage, Cohere) | Measures directional angle between normalized vectors. Higher is closer. |
| **`dot`** | `(-∞, +∞)` | Pre-normalized unit vectors | Dot product / inner product. Fast computation without magnitude division. |
| **`euclidean`** | `[0.0, +∞)` | Coordinate / spatial / image embeddings | L2 geometric distance. Score converted so higher values represent closer proximity. |
</distance_metrics>

<multi_surface_access>
## 3. Remote TCP, HTTP API & MCP Tool

### TCP Remote Client (`AxioDBCloud`)
```typescript
import { AxioDBCloud } from "axiodb";

const client = new AxioDBCloud("axiodb://admin:password@localhost:27019");
await client.connect();

const db = await client.createDB("catalog");
const collection = await db.createCollection("items");

const matches = await collection.vectorSearch("embedding", queryVector, {
  topK: 10,
  minScore: 0.80,
  metric: "cosine",
});
```

### HTTP REST API
```bash
curl -X POST http://localhost:27018/api/document/vector-search/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "dbName": "catalog",
    "collectionName": "items",
    "fieldName": "embedding",
    "queryVector": [0.15, 0.82, 0.30, -0.40],
    "topK": 5,
    "minScore": 0.75,
    "metric": "cosine"
  }'
```

### AI Agent MCP Tool
Tool name: `axiodb_vector_search`
* Parameters: `dbName`, `collectionName`, `fieldName`, `queryVector`, `topK` (optional, default 10), `minScore` (optional), `metric` (optional, default "cosine").
</multi_surface_access>
