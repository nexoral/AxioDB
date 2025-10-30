# Contributing to AxioDB

First off, thank you for considering contributing to AxioDB! 🎉 It's people like you that make AxioDB such a great tool for the Node.js community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by the [AxioDB Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [ankansahadevelopment@gmail.com](mailto:ankansahadevelopment@gmail.com).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/nexoral/AxioDB/issues) to avoid duplicates. When you create a bug report, include as many details as possible:

**Great Bug Reports** include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)
- **Environment details**:
  - AxioDB version
  - Node.js version
  - Operating system
  - Relevant dependencies

**Example Bug Report:**

```markdown
## Bug: Collection encryption fails with custom keys

**Environment:**
- AxioDB: 3.31.104
- Node.js: 20.10.0
- OS: Ubuntu 22.04

**Steps to Reproduce:**
1. Create AxioDB instance
2. Create encrypted collection with custom key
3. Insert document
4. Error occurs

**Expected:** Document should be encrypted and saved
**Actual:** Error: "Encryption failed: Invalid key length"

**Code:**
\`\`\`javascript
const collection = await db.createCollection('test', true, schema, true, 'short');
\`\`\`
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Clear and descriptive title**
- **Detailed description** of the proposed feature
- **Use cases** - why this would be useful
- **Possible implementation** (optional)
- **Examples** from other projects (optional)

### Pull Requests

We actively welcome your pull requests! Here's the process:

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Add tests** if you've added code that should be tested
4. **Ensure the test suite passes**
5. **Update documentation** if needed
6. **Issue the pull request**

**Pull Request Guidelines:**

- ✅ One feature/fix per pull request
- ✅ Follow the existing code style
- ✅ Include tests for new features
- ✅ Update documentation
- ✅ Keep commits atomic and well-described
- ❌ Don't include unrelated changes
- ❌ Don't submit large, unfocused PRs

## Development Setup

### Prerequisites

- Node.js >= 20.0.0
- npm >= 6.0.0
- Git

### Setup Steps

1. **Fork and clone the repository:**

```bash
git clone https://github.com/YOUR-USERNAME/AxioDB.git
cd AxioDB
```

2. **Install dependencies:**

```bash
npm install
```

3. **Build the project:**

```bash
npm run build
```

4. **Run tests:**

```bash
npm test
```

5. **Create a branch for your work:**

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

## Project Structure

```
AxioDB/
├── src/               # Source files (TypeScript)
│   ├── config/        # Configuration files
│   ├── core/          # Core database functionality
│   ├── utils/         # Utility functions
│   └── types/         # TypeScript type definitions
├── lib/               # Compiled JavaScript (generated)
├── Test/              # Test files
├── Document/          # Documentation website
├── Docker/            # Docker configuration
├── GUI/               # Built-in web GUI
└── package.json       # Project metadata
```

## Coding Standards

### TypeScript Style

- Use TypeScript for all new code
- Follow existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer `async/await` over callbacks

**Example:**

```typescript
/**
 * Inserts a document into the collection
 * @param data - The document data to insert
 * @returns Promise resolving to operation result
 */
async insert(data: object): Promise<SuccessInterface | ErrorInterface> {
  // Implementation
}
```

### Code Quality

- **Linting**: Run `npm run lint` before committing
- **Type Safety**: No `any` types unless absolutely necessary
- **Error Handling**: Always handle errors appropriately
- **Performance**: Consider performance implications
- **Security**: Follow security best practices

### Formatting

We use ESLint for code formatting. Before committing:

```bash
npm run lint
```

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```bash
feat(core): add support for bulk delete operations

Added DeleteMany method to allow efficient deletion of multiple
documents matching a query. Includes caching invalidation.

Closes #123
```

```bash
fix(encryption): resolve key length validation issue

Fixed encryption key validation to properly check AES-256 requirements.
Minimum key length is now enforced at 32 bytes.

Fixes #456
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
node ./Test/run.js
```

### Writing Tests

- Write tests for new features
- Update tests when modifying existing features
- Ensure tests are deterministic
- Use descriptive test names

**Example Test:**

```javascript
// Test for insert operation
const testInsert = async () => {
  const collection = await db.createCollection('test', false);
  const result = await collection.insert({ name: 'Test User' });

  if (result.success) {
    console.log('✓ Insert test passed');
  } else {
    console.error('✗ Insert test failed');
  }
};
```

## Documentation

### Code Documentation

- Add JSDoc comments to all public APIs
- Include parameter descriptions and return types
- Provide usage examples for complex features

### README and Docs

- Update README.md for user-facing changes
- Update documentation website in `Document/` folder
- Keep examples up-to-date
- Check for broken links

## Review Process

1. **Automated Checks**: CI/CD runs tests and linting
2. **Code Review**: Maintainers review the code
3. **Feedback**: Address review comments
4. **Approval**: Once approved, PR is merged
5. **Release**: Changes included in next release

## Getting Help

- 💬 **Discussions**: [GitHub Discussions](https://github.com/nexoral/AxioDB/discussions)
- 🐛 **Issues**: [GitHub Issues](https://github.com/nexoral/AxioDB/issues)
- 📧 **Email**: ankansahadevelopment@gmail.com
- 📖 **Documentation**: [https://axiodb.site/](https://axiodb.site/)

## Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes
- Documentation (for significant contributions)

## License

By contributing to AxioDB, you agree that your contributions will be licensed under its [MIT License](LICENSE).

---

**Thank you for contributing to AxioDB!** 🚀

Your efforts help make database management easier for Node.js developers worldwide.
