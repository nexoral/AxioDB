# AxioDB Docker Image

[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com/)
[![AxioDB](https://img.shields.io/badge/AxioDB-2.29.82-blue?style=for-the-badge)](https://www.npmjs.com/package/axiodb)

This Docker image provides a REST API server for AxioDB, allowing you to interact with the AxioDB database management system through HTTP requests. The container includes a web-based GUI dashboard for visual database management and comprehensive API endpoints for programmatic access.

## =€ What's Included

- **REST API Server**: Full HTTP API for database operations
- **Web GUI Dashboard**: Browser-based interface at `http://localhost:27018`
- **API Documentation**: Interactive API reference at `http://localhost:27018/api`
- **AxioDB Core**: Complete database management system
- **Auto-start Configuration**: Ready-to-use setup with minimal configuration

## =æ Quick Start

### Running the Container

```bash
# Pull and run the AxioDB Docker container
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  <your-docker-image-name>
```

### Custom Port Mapping

```bash
# Run on a different host port (e.g., 8080)
docker run -d \
  --name axiodb-server \
  -p 8080:27018 \
  <your-docker-image-name>

# Access via http://localhost:8080
```

### With Data Persistence

```bash
# Mount a volume to persist data
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  -v axiodb-data:/app/AxioDB \
  <your-docker-image-name>
```

## < Accessing the Services

Once the container is running:

### Web GUI Dashboard
- **URL**: `http://localhost:27018`
- **Description**: Interactive web interface for managing databases, collections, and documents
- **Features**: 
  - Database creation and management
  - Collection operations with schema validation
  - Document CRUD operations
  - Real-time statistics and monitoring

### API Documentation
- **URL**: `http://localhost:27018/api`
- **Description**: Complete REST API reference with examples
- **Features**:
  - Interactive API explorer
  - Request/response examples
  - Authentication details
  - Endpoint documentation

### REST API Endpoints
- **Base URL**: `http://localhost:27018/api`
- **Content-Type**: `application/json`
- **Available Operations**:
  - Database management (`/api/database/*`)
  - Collection operations (`/api/collection/*`)
  - Document CRUD (`/api/operation/*`)
  - Statistics and monitoring (`/api/stats/*`)

## =» For Node.js Developers

### Recommended: Use AxioDB NPM Package

If you're building a **Node.js application**, we highly recommend using the official **AxioDB NPM package** instead of the Docker REST API for better performance and direct integration:

```bash
npm install axiodb@latest --save
```

**Benefits of the NPM package over Docker API:**
- **Better Performance**: Direct in-process database operations
- **No Network Overhead**: Eliminate HTTP request latency
- **Type Safety**: Full TypeScript support with IntelliSense
- **Advanced Features**: Access to all AxioDB features including encryption, caching, and aggregation
- **Easier Development**: No need to manage Docker containers during development

#### NPM Package Usage Example

```javascript
const { AxioDB, SchemaTypes } = require("axiodb");

// Create a single AxioDB instance
const db = new AxioDB();

const main = async () => {
  // Create database and collection
  const database = await db.createDB("myApp");
  const collection = await database.createCollection("users", true, {
    name: SchemaTypes.string().required(),
    email: SchemaTypes.string().required().email(),
    age: SchemaTypes.number().min(0).max(120)
  });

  // Insert document
  const result = await collection.insert({
    name: "John Doe",
    email: "john@example.com",
    age: 30
  });
  
  console.log(result);
};

main();
```

### When to Use Docker vs NPM Package

| Use Case | Docker API | NPM Package |
|----------|------------|-------------|
| **Node.js Applications** | L Not recommended |  **Recommended** |
| **Microservices Architecture** |  Good choice |   Consider service boundaries |
| **Non-Node.js Applications** |  **Recommended** | L Not available |
| **Development/Prototyping** |  Quick setup |  Better performance |
| **Production Deployment** |   Network overhead |  **Recommended** |

## =' Configuration

### Environment Variables

```bash
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  -e AXIODB_PORT=27018 \
  -e AXIODB_HOST=0.0.0.0 \
  <your-docker-image-name>
```

### Docker Compose

```yaml
version: '3.8'

services:
  axiodb:
    image: <your-docker-image-name>
    container_name: axiodb-server
    ports:
      - "27018:27018"
    volumes:
      - axiodb-data:/app/AxioDB
    restart: unless-stopped

volumes:
  axiodb-data:
```

## =Ý API Examples

### Create Database

```bash
curl -X POST http://localhost:27018/api/database/create \
  -H "Content-Type: application/json" \
  -d '{"name": "myDatabase"}'
```

### Create Collection

```bash
curl -X POST http://localhost:27018/api/collection/create \
  -H "Content-Type: application/json" \
  -d '{
    "database": "myDatabase",
    "name": "users",
    "schema": {
      "name": {"type": "string", "required": true},
      "email": {"type": "string", "required": true}
    }
  }'
```

### Insert Document

```bash
curl -X POST http://localhost:27018/api/operation/insert \
  -H "Content-Type: application/json" \
  -d '{
    "database": "myDatabase",
    "collection": "users",
    "data": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }'
```

### Query Documents

```bash
curl -X POST http://localhost:27018/api/operation/query \
  -H "Content-Type: application/json" \
  -d '{
    "database": "myDatabase",
    "collection": "users",
    "query": {"name": "John Doe"},
    "limit": 10
  }'
```

## =3 Building from Source

If you want to build the Docker image yourself:

```bash
# Clone the repository
git clone https://github.com/AnkanSaha/AxioDB.git
cd AxioDB/Docker

# Build the Docker image
docker build -t axiodb:latest .

# Run the container
docker run -d --name axiodb-server -p 27018:27018 axiodb:latest
```

## = Troubleshooting

### Container Won't Start
```bash
# Check container logs
docker logs axiodb-server

# Check if port is already in use
netstat -tulpn | grep :27018
```

### Port Already in Use
```bash
# Use a different port
docker run -d --name axiodb-server -p 8080:27018 <your-docker-image-name>
```

### Data Persistence Issues
```bash
# Ensure proper volume mounting
docker run -d \
  --name axiodb-server \
  -p 27018:27018 \
  -v "$(pwd)/axiodb-data":/app/AxioDB \
  <your-docker-image-name>
```

## =Ú Additional Resources

- **Official Documentation**: [https://axiodb.site/](https://axiodb.site/)
- **NPM Package**: [https://www.npmjs.com/package/axiodb](https://www.npmjs.com/package/axiodb)
- **GitHub Repository**: [https://github.com/AnkanSaha/AxioDB](https://github.com/AnkanSaha/AxioDB)
- **API Reference**: Access via `http://localhost:27018/api` when container is running

## > Support

For support and questions:
- Open an issue on [GitHub](https://github.com/AnkanSaha/AxioDB/issues)
- Check the [documentation](https://axiodb.site/)
- Visit the API reference at `http://localhost:27018/api`

---

**Note**: This Docker image is designed for development, testing, and small-scale production use. For high-performance Node.js applications, consider using the AxioDB NPM package directly for optimal performance.