# AI Coding Tools Setup for AxioDB

Comprehensive configuration for all major AI coding assistants.

## Configured Tools

1. ✅ **Claude Code** - Anthropic's official CLI
2. ✅ **Gemini CLI** - Google's AI command line interface
3. ✅ **Antigravity** - Google's AI IDE (VS Code fork)
4. ✅ **Cursor** - AI-native IDE

## Configuration Files

### Claude Code
```
CLAUDE.md                     # Main configuration
.claude/
├── rules/                    # 5 detailed rule files
├── commands/                 # 12 custom slash commands
├── settings.json            # Permission configuration
└── SETTINGS.md              # Settings documentation
```

**Usage**:
- Loads CLAUDE.md automatically every session
- Use `/review`, `/test`, `/feature`, etc. commands
- 50% token efficiency vs verbose configs

### Gemini CLI
```
GEMINI.md                     # Main configuration
.gemini/
└── settings.json            # Model, tools, safety settings
```

**Setup**:
```bash
# Install
npm install -g @google/gemini-cli

# Configure API key
export GOOGLE_API_KEY="YOUR_API_KEY"

# Use
gemini "implement new feature"
```

**Features**:
- Gemini 3 Pro model with 1M context window
- Built-in tools: Google Search, file ops, shell commands
- MCP server support for extensions

### Antigravity (Google IDE)
```
.antigravity/
└── rules.md                  # Agent instructions
```

**Features**:
- Planning Mode vs Fast Mode
- Multi-agent orchestration
- Supports Claude, Gemini, GPT models
- Free in Public Preview (2026)

**Usage**:
- Planning Mode: Creates task artifacts before execution
- Fast Mode: Immediate execution for quick tasks
- Multi-agent: Parallel execution for complex features

### Cursor
```
.cursorrules                 # Main rules file
.cursor/
└── rules/
    └── axiodb-core.md      # Detailed project rules
```

**Features**:
- Agent Mode for autonomous coding
- SOC 2 certified (enterprise ready)
- Multi-agent support
- Mission Control interface

## Common Configuration Across All Tools

### Core Rules (NON-NEGOTIABLE)
All tools are configured with these mandatory rules:

1. **ALWAYS Build**
   ```bash
   npm run build  # After every code change
   ```

2. **ALWAYS Test**
   - Update `Test/modules/` for any feature
   - Run `npm test` before completion

3. **NEVER Incomplete**
   - Build passes ✓
   - Tests pass ✓
   - Docs updated ✓
   - Lint passes ✓

4. **Respect Existing**
   - Read files before modifying
   - Follow established patterns
   - Maintain backward compatibility

5. **SOLID + DRY**
   - Single responsibility
   - No code duplication
   - Extract common logic to helpers
   - No hacky solutions

6. **TypeScript Strict**
   - No `any` types
   - Proper interfaces
   - Null checks
   - Error handling

### AxioDB-Specific Patterns

#### Singleton Pattern
```typescript
private static _instance: AxioDB;
constructor() {
  if (AxioDB._instance) throw new Error("Only one instance allowed");
  AxioDB._instance = this;
}
```
**Implication**: Tests must run in separate processes

#### Dual-Write (Indexes)
```typescript
// Write to memory (speed) + disk (durability)
await this.indexCache.set(key, data, TTL);
await this.fileManager.writeFile(path, JSON.stringify(data));
```

#### Random Cache TTL
```typescript
// 5-15 minutes (prevent cache stampede)
const TTL = Math.floor(Math.random() * (15 - 5 + 1) + 5) * 60 * 1000;
```

### Testing Requirements

**Location**: `Test/modules/`
- `crud.test.js` - CRUD operations
- `transaction.test.js` - Transactions, WAL
- `read.test.js` - Read optimizations

**Coverage**:
- Happy path (success scenarios)
- Edge cases (empty, null, large data)
- Error cases (validation, file errors)
- Concurrent operations
- Backward compatibility

### Documentation Requirements

**Update when features change**:
1. `README.md` - Public API, examples
2. `Document/` - React docs site
3. `Dockerfile` - Deployment changes
4. JSDoc comments for public methods

## Tool Selection Guide

### Choose Claude Code if:
- You want deep reasoning and planning
- Need custom slash commands
- Want token-efficient configurations
- Prefer CLI-based workflow

### Choose Gemini CLI if:
- You want 1M token context window
- Need Google Search integration
- Want MCP server extensibility
- Prefer terminal-based coding

### Choose Antigravity if:
- You need multi-agent orchestration
- Want Planning Mode with artifacts
- Need parallel task execution
- Want free tier (Preview status)

### Choose Cursor if:
- You need enterprise features (SOC 2)
- Want VS Code familiarity
- Need GUI-based development
- Require team collaboration features

## Best Practices for All Tools

### 1. Start with Minimal Configuration
Add rules only when AI repeatedly makes same mistakes.

### 2. Be Specific
```markdown
✅ "Use Promise.all for parallel operations"
❌ "Write good code"
```

### 3. Show Examples
```markdown
✅ Include code snippets showing good vs bad
❌ Only describe in text
```

### 4. Keep Context Focused
Every word in config consumes tokens. Be concise.

### 5. Version Control Configs
Commit all AI config files to git for team consistency.

## Multi-Tool Workflow

You can use multiple tools together:

1. **Claude Code**: Initial feature planning and architecture
2. **Cursor**: Implementation in IDE
3. **Gemini CLI**: Research and documentation
4. **Antigravity**: Multi-agent orchestration for complex features

All tools will follow the same AxioDB patterns and rules.

## Verification

All configurations enforce:
- ✅ TypeScript strict mode
- ✅ Tests in Test/modules/
- ✅ Build verification
- ✅ Documentation updates
- ✅ SOLID principles
- ✅ Security best practices
- ✅ Performance optimization

## Getting Help

Each tool has detailed documentation:
- **Claude Code**: See .claude/rules/
- **Gemini CLI**: https://developers.google.com/gemini-code-assist/docs
- **Antigravity**: Tool preview documentation
- **Cursor**: https://cursor.com/docs

## Sources

- [Gemini CLI Documentation](https://developers.google.com/gemini-code-assist/docs/gemini-cli)
- [Cursor Rules Documentation](https://docs.cursor.com/context/rules-for-ai)
- [Antigravity vs Cursor Comparison](https://www.codecademy.com/article/agentic-ide-comparison-cursor-vs-windsurf-vs-antigravity)
- [AI Config Files Guide](https://www.deployhq.com/blog/ai-coding-config-files-guide)

## Summary

Your AxioDB project is now configured for:
- ✅ 4 major AI coding tools (Claude Code, Gemini CLI, Antigravity, Cursor)
- ✅ Consistent rules across all tools
- ✅ AxioDB-specific patterns enforced
- ✅ Production-grade standards
- ✅ Complete documentation

**All AI assistants will now**:
1. Build after every change
2. Update tests for features
3. Never leave tasks incomplete
4. Follow SOLID + DRY
5. Use TypeScript strict mode
6. Update documentation
7. Respect AxioDB patterns
