Create new helper utility: $ARGUMENTS

Location: `source/Helper/{FeatureName}.helper.ts`

**Helper Pattern:**
```typescript
/**
 * Helper class for {feature description}
 */
export class {FeatureName}Helper {
  /**
   * Method description
   * @param {Type} param - Parameter description
   * @returns {ReturnType} Return description
   */
  static methodName(param: Type): ReturnType {
    // Pure function - no side effects
    // Stateless - no instance variables
    return result;
  }
}
```

**Guidelines:**
- Use static methods (helpers are stateless)
- Pure functions (same input = same output)
- No dependencies on AxioDB instance
- Single responsibility (one concern per helper)
- Reusable across multiple services

**Common Helper Types:**
- **Data transformation**: `Converter.helper.ts`
- **Validation**: `Validator.helper.ts`
- **Encryption**: `Crypto.helper.ts`
- **Formatting**: `Formatter.helper.ts`
- **Query matching**: `QueryMatcher.helper.ts`

**DRY Principle:**
If the same logic appears in 2+ files, extract to a helper.

**Example:**
```typescript
// Helper/QueryMatcher.helper.ts
export class QueryMatcher {
  static matchDocument(doc: any, query: any): boolean {
    // Logic here
    return matches;
  }

  static filterDocuments(docs: any[], query: any): any[] {
    return docs.filter(d => this.matchDocument(d, query));
  }
}

// Usage in Reader.operation.ts
import { QueryMatcher } from '../Helper/QueryMatcher.helper';
const filtered = QueryMatcher.filterDocuments(documents, query);
```

**Steps:**
1. Create helper file in `source/Helper/`
2. Implement static methods
3. Add TypeScript interfaces for parameters
4. Add JSDoc comments
5. Import and use in relevant services
6. Add tests (if complex logic)
7. Build: `npm run build`
