# Claude Code Settings

## Permissions Configuration

### Allowed Commands

**Build & Test:**
- `npm run build`, `npm test`, `npm run lint`
- `npm install`, `npm ci`
- `npx tsc`, `npx eslint`
- `node Test/*` - Run specific tests
- `node -e` - Execute Node.js code

**Git Operations:**
- `git status`, `git diff`, `git log` - Read operations
- `git add`, `git commit` - Stage and commit
- `git push`, `git pull`, `git fetch` - Sync with remote
- `git branch`, `git checkout`, `git merge` - Branch operations
- `git stash` - Temporary storage
- `gh pr`, `gh repo` - GitHub CLI (PRs, repo info)

**Docker Commands:**
- `docker build`, `docker run` - Build and run containers
- `docker logs`, `docker exec` - Debugging
- `docker ps`, `docker images` - List resources
- `docker stop` - Stop containers (safe)

**File Operations:**
- `ls`, `cat`, `wc`, `grep` - Read operations
- `find`, `tree`, `du` - Search and stats
- `mkdir` - Create directories (safe)
- `echo`, `pwd`, `which` - Info commands

### Denied Commands (Security)

**Destructive File Operations:**
- `rm -rf`, `rm -fr`, `rm -r`, `rm -f` - Prevent accidental deletion
- `chmod 777` - Prevent security issues
- `chown` - Prevent ownership changes

**Destructive Git Operations:**
- `git push --force`, `git push -f` - Prevent force pushes
- `git reset --hard` - Prevent hard resets
- `git clean -fd` - Prevent untracked file deletion
- `git branch -D` - Prevent force branch deletion

**Destructive Docker Operations:**
- `docker rm -f`, `docker rmi -f` - Prevent force removal
- `docker system prune -af` - Prevent pruning all resources

**Package Management:**
- `npm uninstall`, `npm remove` - Prevent dependency removal
- `npm publish` - Prevent accidental publishing

**Security Risks:**
- `sudo` - Prevent privilege escalation
- `curl *| bash`, `wget *| sh` - Prevent script injection
- `eval` - Prevent code injection
- Disk operations (`> /dev/sda`, `dd if=`) - Prevent disk damage

## Approval Requirements

### Require User Approval For:
- Editing config files: `package.json`, `tsconfig.json`, `.gitignore`, `Dockerfile`
- Publishing: `git push`, `npm publish`, `docker push`

### Auto-Approved (No Confirmation):
- Reading files: `Read`, `Glob`, `Grep`
- Building: `npm run build`
- Testing: `npm test`
- Linting: `npm run lint`
- Git info: `git status`, `git diff`, `git log`

## Development Rules

**Enabled:**
- `require_tests_for_features: true` - Tests mandatory for new features
- `require_docs_for_features: true` - Docs mandatory for new features

**Disabled (Manual Control):**
- `auto_build_after_edit: false` - Don't auto-build (you control when)
- `auto_test_after_build: false` - Don't auto-test (you control when)

## AxioDB-Specific Rules

**Enforced Patterns:**
- `singleton_check: true` - Verify singleton pattern compliance
- `test_isolation_required: true` - Tests must run in separate processes
- `dual_write_pattern_enforced: true` - Indexes must write to memory + disk
- `cache_ttl_random: true` - Cache TTL must be randomized (5-15min)

## Why These Settings?

### Safety First
Prevents accidental destructive operations:
- No `rm -rf` to delete entire directories
- No `git push --force` to overwrite remote history
- No `docker system prune -af` to remove all resources

### Development Workflow
Allows normal development tasks:
- Build, test, lint freely
- Commit and push safely
- Run Docker containers for testing
- Execute Node.js scripts

### Quality Control
Requires approval for critical changes:
- Package.json modifications need review
- Publishing requires confirmation
- Config changes need approval

### AxioDB Compliance
Enforces project-specific patterns:
- Singleton pattern verification
- Test isolation (separate processes)
- Dual-write pattern for indexes
- Random cache TTL

## Modifying Settings

To add new allowed commands:
```json
{
  "permissions": {
    "allow": [
      "Bash(your-command:*)"
    ]
  }
}
```

To deny additional commands:
```json
{
  "permissions": {
    "deny": [
      "Bash(dangerous-command:*)"
    ]
  }
}
```

## Emergency Override

If you need to run a blocked command:
1. Temporarily edit `.claude/settings.json`
2. Add command to `allow` list
3. Run the command
4. Remove from `allow` list (restore safety)

**Better approach**: Ask Claude to use alternative safe commands.

## Summary

This configuration provides:
- ✅ Full development workflow access
- ✅ Protection against destructive operations
- ✅ Approval gates for critical changes
- ✅ AxioDB pattern enforcement
- ✅ Safe by default, flexible when needed
