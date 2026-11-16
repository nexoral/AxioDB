# AxioDB Production Best Practices

<singleton_rule>
## 1. Singleton Instance Management

`AxioDB` enforces a strict process-level singleton. Calling `new AxioDB()` twice in the same process throws an error.

```typescript
// ✅ PRODUCTION PATTERN: Export a single instance module (e.g., db.ts)
export const db = new AxioDB({
  RootName: "AppDB",
  CustomPath: process.env.DB_PATH ?? "./data",
  Cache: true,
});

// In request handlers or services, import the shared singleton:
import { db } from "./db";
```
</singleton_rule>

<cache_jitter_policy>
## 2. In-Memory Cache & TTL Jitter

AxioDB's `InMemoryCache` prevents cache stampedes using randomized jitter:

```typescript
const db = new AxioDB({
  Cache: true,
  minTTL: 5,           // Minimum entry lifetime in minutes (default: 5)
  maxTTL: 15,          // Maximum entry lifetime in minutes (default: 15)
  cacheClearUp: 86400, // Housekeeping eviction interval in seconds
});
```

* **Read-Heavy Workloads**: Tune jitter higher (`minTTL: 15`, `maxTTL: 30`) for static catalogs.
* **Write-Heavy Workloads**: Lower jitter (`minTTL: 2`, `maxTTL: 5`) to reduce stale memory residency.
</cache_jitter_policy>

<indexing_strategy>
## 3. Secondary Indexing Strategy

* **Index High-Frequency Filters**: Index fields frequently evaluated in query filters (`userId`, `email`, `status`).
* **Automatic Index Selection & Hints**: AxioDB automatically selects matching indexes. Use `.hint("fieldName")` only when a specific query plan has been verified or to override default selection.
* **Dual-Write Cost**: Every insert/update/delete updates memory and disk simultaneously. Avoid indexing rarely filtered fields.
</indexing_strategy>

<security_hardening>
## 4. Security Hardening Checklist

1. **Rotate Default Credentials**: Seeded `admin/admin` credentials reject TCP logins until rotated via HTTP API or seeded with `AXIODB_ADMIN_PASSWORD`.
2. **Never Expose Unauthenticated TCP**: Keep `AXIODB_TCP_AUTH_ENABLED=true` (Docker) or `TCPAuth: true` (embedded) unless operating inside an isolated Docker bridge network or private VPC.
3. **Connection Pooling**: Always reuse a single `AxioDBCloud` instance across microservices (`maxPoolSize: 10`). Never create socket clients per HTTP request.
</security_hardening>

<anti_patterns>
## 5. Anti-Patterns to Avoid

```typescript
// ❌ ANTI-PATTERN: Creating new AxioDBCloud per HTTP request
app.get("/user/:id", async (req, res) => {
  const client = new AxioDBCloud("axiodb://localhost:27019"); // Socket exhaustion!
  await client.connect();
});

// ✅ PRODUCTION PATTERN: Reuse pooled singleton client
export const cloudClient = new AxioDBCloud("axiodb://localhost:27019", { maxPoolSize: 10 });
await cloudClient.connect();

// ❌ ANTI-PATTERN: Full table scan on high-cardinality fields
const user = await users.query({ email: "alex@example.com" }).exec();

// ✅ PRODUCTION PATTERN: Index field and supply hint
await users.newIndex("email");
const user = await users.query({ email: "alex@example.com" }).hint("email").exec();
```
</anti_patterns>
