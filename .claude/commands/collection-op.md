Create new collection operation: $ARGUMENTS

Location: `source/Services/Collection/collection.operation.ts`

**Step 1: Add Method to Collection Class**
```typescript
/**
 * Description of operation
 * @param {Type} param - Parameter description
 * @returns {Promise<SuccessInterface | ErrorInterface>} Result
 */
async operationName(param: Type): Promise<SuccessInterface | ErrorInterface> {
  try {
    // Validation
    if (!param) {
      return this.ResponseHelper.error('Invalid input', StatusCodes.BAD_REQUEST);
    }

    // Operation logic
    const result = await this.performOperation(param);

    // Cache update if needed
    this.cache.invalidate(cacheKey);

    return this.ResponseHelper.success(result);
  } catch (error) {
    this.logger.error('Operation failed', error);
    return this.ResponseHelper.error('Operation failed', StatusCodes.INTERNAL_SERVER_ERROR);
  }
}
```

**Step 2: Add to HTTP API** (if needed)
- Router: `source/server/router/Routers/Collection.routes.ts`
- Controller: `source/server/controller/Collection/collection.controller.ts`

**Step 3: Add to TCP API** (if needed)
- Handler: `source/tcp/handler/`
- Add command to protocol types

**Step 4: Add Tests**
- File: `Test/modules/crud.test.js` or relevant module
- Test success, errors, edge cases

**Step 5: Documentation**
- Update README.md API Reference
- Update Document/ with examples
- Add JSDoc comments

**Step 6: Build & Verify**
```bash
npm run build && npm test
```
