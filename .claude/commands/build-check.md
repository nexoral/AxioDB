Build and verify the project for: $ARGUMENTS

Execute in order:
1. **TypeScript compilation**: `npm run build`
2. **Lint check**: `npm run lint`
3. **Type check**: `npx tsc --noEmit`

If any step fails:
- Show exact error messages with file paths and line numbers
- Suggest specific fixes
- Do NOT continue to next step until current step passes

If all pass:
- Report success
- Show compiled output location (lib/)
- Suggest running tests: `npm test`

This is MANDATORY before declaring any task complete.
