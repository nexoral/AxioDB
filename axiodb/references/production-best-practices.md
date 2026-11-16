# AxioDB Production Best Practices

## 1. High-Performance Architecture Guidelines

### In-Process Embedded vs Remote TCP
- **In-Process (Embedded Mode)**: Choose embedded mode for Node.js backends deployed on the same server/container. It eliminates network serialization, IPC overhead, and socket latency.
- **Remote TCP Mode (`AxioDBCloud`)**: Use when connecting multiple microservices or workers to a shared database instance or Docker container. Always share a single `AxioDBCloud` client instance across the application to benefit from the built-in connection pool (`maxPoolSize: 10`).

---

## 2. In-Memory Cache & TTL Optimization

AxioDB features an integrated `InMemoryCache` with randomized TTL to prevent cache stampedes:

```typescript
const db = new AxioDB({
  Cache: true,
  minTTL: 5,           // Minimum entry lifetime (minutes)
  maxTTL: 15,          // Maximum entry lifetime (minutes)
  cacheClearUp: 86400, // Housekeeping cleanup interval (seconds)
});
```

### Best Practices:
1. **Never Disable Cache in Production**: `Cache: true` drastically reduces disk I/O by serving repeated reads directly from RAM.
2. **Tune TTL to Access Patterns**:
   - For read-heavy, low-churn collections: increase `minTTL: 15` and `maxTTL: 30`.
   - For high-churn transactional data: decrease `minTTL: 2` and `maxTTL: 5`.

---

## 3. Secondary Indexing Strategy

- **Index High-Frequency Query Fields**: Create indexes for fields filtered in `WHERE` / `find()` clauses (e.g., `userId`, `email`, `status`).
- **Use Index Hints**: Add `.hint("field")` to queries when matching indexed fields to bypass full-collection scans.
- **Dual-Write Cost**: Remember every insert/update/delete writes to disk and memory. Avoid indexing rarely queried fields.

---

## 4. Security & Hardening Checklist

1. **Rotate Default Credentials**: The seeded `admin/admin` account MUST be rotated before TCP logins are allowed. In Docker/headless environments, supply `AXIODB_ADMIN_PASSWORD` on initial creation.
2. **Never Run Unauthenticated TCP on Public Networks**: `AXIODB_TCP_AUTH_ENABLED` is `true` by default. Only set to `false` inside isolated Docker bridge networks or private VPCs.
3. **Use TLS in Untrusted Environments**: Set `AXIODB_TLS=true` and mount valid certificate and private key files.
4. **Input Sanitization**: Always validate document inputs before inserting. Never pass arbitrary user input directly into file paths. AxioDB internally uses `PathSanitizer` (`/[^a-zA-Z0-9-_]/g`), but application boundaries must validate inputs.

---

## 5. Critical Anti-Patterns to Avoid

```typescript
// ❌ ANTI-PATTERN: Calling new AxioDB() multiple times in the same application
// AxioDB is a singleton. This throws an Error:
const db1 = new AxioDB();
const db2 = new AxioDB(); // THROWS!

// ✅ PRODUCTION PATTERN: Export a single instance module
// db.ts
export const db = new AxioDB({ CustomPath: process.env.DB_PATH });

// ❌ ANTI-PATTERN: Creating a new AxioDBCloud client per HTTP request
app.get("/user/:id", async (req, res) => {
  const client = new AxioDBCloud("axiodb://localhost:27019"); // Sockets exhaust!
  await client.connect();
  // ...
});

// ✅ PRODUCTION PATTERN: Reuse a pooled singleton client
export const cloudClient = new AxioDBCloud("axiodb://localhost:27019", {
  maxPoolSize: 10,
});
await cloudClient.connect();

// ❌ ANTI-PATTERN: Full collection scans on large datasets without indexes
const user = await users.query({ email: "target@example.com" }).exec();

// ✅ PRODUCTION PATTERN: Index high-cardinality fields
await users.newIndex("email");
const user = await users.query({ email: "target@example.com" }).hint("email").exec();
```
