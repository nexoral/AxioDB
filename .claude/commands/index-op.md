Create or modify index operation: $ARGUMENTS

Location: `source/Services/Index/`

**Index System Components:**
- `Index.service.ts` - Create/drop indexes
- `IndexCache.service.ts` - In-memory cache with TTL
- `InsertIndex.service.ts` - Add documents to indexes
- `ReadIndex.service.ts` - Query indexed fields
- `DeleteIndex.service.ts` - Remove documents from indexes

**Pattern: Dual-Write (Memory + Disk)**
```typescript
// 1. Write to memory cache (speed)
await this.indexCache.set(indexKey, data, TTL);

// 2. Write to disk (durability)
await this.fileManager.writeFile(indexPath, JSON.stringify(data));

// 3. On cold start, reload from disk
const diskData = await this.fileManager.readFile(indexPath);
this.indexCache.set(indexKey, JSON.parse(diskData));
```

**Index File Structure:**
```
{CollectionPath}/
└── indexes/
    ├── {indexName}.json        # Index data on disk
    └── {indexName}.meta.json   # Metadata
```

**Random TTL (Prevent Cache Stampede):**
```typescript
const TTL = Math.floor(Math.random() * (15 - 5 + 1) + 5) * 60 * 1000; // 5-15 min
```

**Steps:**
1. Implement operation in appropriate file
2. Ensure dual-write pattern (memory + disk)
3. Use random TTL for cache
4. Add automatic document-to-index sync
5. Test cold start recovery
6. Add tests to Test/modules/
7. Document in README and Document/

**Build & Verify:**
```bash
npm run build && npm test
```
