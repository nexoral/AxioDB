Create new TCP command for AxioDBCloud: $ARGUMENTS

**Step 1: Add Handler**
Location: `source/tcp/handler/`

Create handler file or add to existing:
```typescript
async function handle{CommandName}(data: any, context: ConnectionContext): Promise<any> {
  try {
    // Validate input
    if (!data || !data.param) {
      return { success: false, error: 'Invalid parameters' };
    }

    // Execute operation
    const result = await context.db.operation(data.param);

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**Step 2: Register Command**
Location: `source/tcp/config/server.ts` or command registry

Add command to handler map:
```typescript
commandHandlers.set('COMMAND_NAME', handle{CommandName});
```

**Step 3: Add Client Proxy**
Location: `source/client/{Feature}Proxy.ts`

Add method to proxy class:
```typescript
async operationName(param: Type): Promise<Result> {
  const response = await this.client.sendCommand('COMMAND_NAME', { param });
  return response.data;
}
```

**Step 4: Update Protocol Types**
Location: `source/tcp/types/` or `source/client/types/`

Add command type definition.

**Step 5: Test**
- Create test for TCP command
- Test connection, request, response
- Test error cases
- Verify in Docker container

**Step 6: Document**
- Update README.md AxioDBCloud section
- Update Document/ with TCP command example
- Update Dockerfile if ports/config changed
