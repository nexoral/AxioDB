# Code Standards

## Core Principles

1. **Respect existing code** - read before modifying, follow the patterns already there
2. **SOLID** - single responsibility, open/closed, Liskov, interface segregation, dependency inversion
3. **DRY** - logic appearing in 2+ files moves to `source/Helper/{Feature}.helper.ts`
4. **No hacks** - production-grade only, no temporary fixes

**SOLID in practice here**: `FileManager` does file I/O and `Converter` does conversion - never one
class doing both. Extend behaviour through an interface (e.g. a `QueryOperator` with an `evaluate`
method) rather than editing a switch. Depend on the abstraction (`IFileManager`) and inject it,
rather than constructing a concrete `new FileManager()` inside the consumer - that is also what
makes a class testable.

## TypeScript

- **No `any`.** Define an interface. When the type is genuinely unknown use `unknown` plus a type
  guard (`typeof x === 'object' && x !== null`) before touching it.
- **Type both sides**: parameters and return types, including options objects.
- **Strict null checks**: return `T | null` and force the caller to handle it (`?? null`); never
  return `T` from a lookup that can miss.
- **Magic strings** → `enum` or an `as const` object.

## Naming

- **Files**: `{Feature}.operation.ts`, `{Feature}.service.ts`, `{Feature}.helper.ts`
- **Classes**: PascalCase nouns - `FileManager`, `QueryMatcher`
- **Methods**: camelCase verbs - `createDatabase()`, `isValidDocument()`
- **Variables**: camelCase descriptive - `documentId`, `collectionPath`
- **Constants**: `UPPER_SNAKE_CASE`, or camelCase `const`

## Error Handling

Wrap every async operation in try-catch. Log the detailed error with context, return a
user-friendly one through `ResponseHelper` with the right `StatusCodes` - never leak internals or
stack traces to callers, and never swallow an error silently.

Messages must be specific: `'Validation failed: "name" field required'`, not `'Invalid document'`.

## Performance

- Check `InMemoryCache` before reading disk; populate it after a miss.
- `Promise.all` for independent operations - never `await` in a loop.
- Load once, then filter/sort/limit in memory - don't re-read per stage.
- `Map` for lookups (O(1)); never `Array.find` inside a loop (O(n)).

## Security

- **Validate input**: reject anything that isn't an object, and reject arrays, before use.
- **Sanitize paths**: `docId.replace(/[^a-zA-Z0-9-_]/g, '_')` then `path.join` - never interpolate
  a caller-supplied id straight into a path, that is a `../../../` traversal.
- **Never log secrets** - passwords, tokens, keys. Return `error('Auth failed', UNAUTHORIZED)`
  without detail.

## Testing

Inject dependencies through the constructor so they can be replaced in tests.

**Cover**: happy path, empty input, null/undefined, large data, invalid data, concurrent
operations, error paths.

## Review Checklist

- [ ] SOLID · DRY · modular · clear naming
- [ ] Type-safe (no `any`), proper error handling
- [ ] Performance considered · security validated
- [ ] Tests written/updated · docs updated
- [ ] Build passes · lint passes
