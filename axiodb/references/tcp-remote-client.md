# AxioDB TCP Remote Client (`AxioDBCloud`)

<tcp_architecture>
## 1. TCP Wire Protocol & Architecture

`AxioDBCloud` connects to remote or containerized AxioDB instances over high-performance binary TCP (Port 27019).
* **Connection Pooling**: Manages socket pool automatically (`maxPoolSize: 10` by default).
* **Automatic Reconnect**: Recovers connections upon network drops with exponential backoff.
* **RBAC Authentication**: Authenticates against AxioDB credentials configured via HTTP or Docker env.
* **Transparent Query Proxying**: Proxies `DatabaseProxy`, `CollectionProxy`, `ReaderProxy`, and mutations identical to in-process APIs.
</tcp_architecture>

<connection_setup>
## 2. Establishing Connection

```typescript
import { AxioDBCloud } from "axiodb";

// Authenticated connection with custom pool options
const client = new AxioDBCloud("axiodb://admin:StrongPassword@localhost:27019", {
  maxPoolSize: 10,    // Maximum concurrent pooled sockets (default: 10)
  timeout: 10000,     // Command timeout in milliseconds (default: 10000)
});

// Establish socket pool
await client.connect();

// Verify remote instance connectivity
const info = await client.getInstanceInfo();
```

### Unauthenticated TCP Connection (Dev / Internal Mesh)
When the server runs with `AXIODB_TCP_AUTH=false`:
```typescript
const client = new AxioDBCloud("axiodb://localhost:27019");
await client.connect();
```
</connection_setup>

<client_crud_proxy>
## 3. Remote CRUD Operations

```typescript
// Access remote database and collection
const db = await client.createDB("production");
const users = await db.createCollection("users");

// 1. Remote Insert
await users.insert({
  name: "Jordan Lee",
  role: "analyst",
  region: "EU",
});

// 2. Remote Query with Operators & Pagination
const analysts = await users
  .query({ role: "analyst", region: "EU" })
  .Sort({ name: 1 })
  .Limit(50)
  .exec();

// 3. Remote Mutations
await users
  .update({ name: "Jordan Lee" })
  .UpdateOne({ verified: true });

await users
  .delete({ region: "EU", verified: false })
  .deleteMany();

// 4. Graceful Disconnect
await client.disconnect();
```
</client_crud_proxy>

<tcp_gotchas>
## 4. Connection Gotchas

* **Unrotated Admin Password**: Default `admin/admin` credentials fail TCP connection. Rotate password via HTTP API (`http://localhost:27018`) or start Docker with `AXIODB_ADMIN_PASSWORD`.
* **Port Availability**: Verify port 27019 is open using `lsof -ti :27019` or `nc -zv localhost 27019`.
</tcp_gotchas>
