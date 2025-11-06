# Security Policy

## Supported Versions

We actively support the following versions of AxioDB with security updates. Please ensure you are using a supported version to receive critical security patches and updates.

| Version | Supported          |
| ------- | ------------------ |
| 3.x.x   | ✅ Yes             |
| 2.x.x   | ⚠️ Security fixes only |
| < 2.0   | ❌ No              |

**Recommendation:** Always use the latest version of AxioDB for the best security, performance, and features.

```bash
npm install axiodb@latest
```

## Security Features

AxioDB includes several security features to protect your data:

- **AES-256 Encryption**: Optional encryption for sensitive collections
- **Schema Validation**: Prevent injection of malicious data structures
- **File Isolation**: Each document stored in separate files with proper permissions
- **Secure Defaults**: Security-first configuration out of the box
- **No External Dependencies**: Reduces attack surface (pure JavaScript)

## Reporting a Vulnerability

We take security seriously and appreciate the security community's efforts to responsibly disclose vulnerabilities. If you discover a security issue in AxioDB, please report it through one of the following channels:

### Preferred Method: GitHub Security Advisories

1. Navigate to the [AxioDB GitHub repository](https://github.com/nexoral/AxioDB)
2. Go to the "Security" tab
3. Click "Report a vulnerability"
4. Fill out the form with details

### Alternative Method: Email

Send an email to **ankansahaofficial@gmail.com** with:

- **Subject**: `[SECURITY] AxioDB Vulnerability Report`
- **Description**: Clear description of the vulnerability
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Impact**: Potential security impact and affected versions
- **Suggested Fix**: (Optional) Your suggestions for fixing the issue

### What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., XSS, CSRF, SQL Injection equivalent, etc.)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Response Timeline

- **Initial Response**: Within 48 hours of receiving your report
- **Status Update**: Within 7 days with assessment and planned fix timeline
- **Fix Development**: Depending on severity and complexity
- **Disclosure**: Coordinated disclosure after fix is released

## Security Update Process

1. **Triage**: We assess the severity and impact of the reported vulnerability
2. **Fix Development**: We develop and test a fix in a private repository
3. **Release**: Security fixes are released as patch versions (e.g., 3.31.105)
4. **Disclosure**: After release, we publish a security advisory with details
5. **Credit**: We credit researchers who responsibly disclose vulnerabilities (unless they prefer to remain anonymous)

## Severity Levels

We use the following severity levels for security issues:

| Severity | Description | Response Time |
|----------|-------------|---------------|
| **Critical** | Remote code execution, data loss | < 24 hours |
| **High** | Privilege escalation, data breach | < 72 hours |
| **Medium** | Information disclosure, DoS | < 7 days |
| **Low** | Minor information leak, edge cases | < 14 days |

## Security Best Practices

When using AxioDB in production:

### 1. Use Encryption for Sensitive Data

```javascript
const sensitiveCollection = await db.createCollection(
  'users',
  true,
  schema,
  true,  // Enable encryption
  process.env.ENCRYPTION_KEY  // Use environment variable
);
```

### 2. Never Hardcode Encryption Keys

❌ **Bad:**
```javascript
const collection = await db.createCollection('data', true, schema, true, 'myKey123');
```

✅ **Good:**
```javascript
const collection = await db.createCollection(
  'data',
  true,
  schema,
  true,
  process.env.AXIODB_ENCRYPTION_KEY
);
```

### 3. Validate Input Data

Always use schema validation to prevent malicious data:

```javascript
const schema = {
  email: SchemaTypes.string().required().email(),
  age: SchemaTypes.number().min(0).max(150),
  name: SchemaTypes.string().required().max(100),
};
```

### 4. Implement Access Controls

Restrict file system access to the AxioDB data directory:

```bash
# Linux/macOS
chmod 700 ./AxioDB
```

### 5. Keep AxioDB Updated

Regularly update to the latest version:

```bash
npm update axiodb
```

### 6. Monitor for Security Advisories

- Watch the [GitHub repository](https://github.com/nexoral/AxioDB)
- Subscribe to npm security advisories
- Check the [SECURITY.md](./SECURITY.md) file regularly

## Known Security Considerations

### Embedded Database Scope

AxioDB is designed for **embedded, single-instance use cases**:

- ✅ Desktop applications (Electron, Tauri)
- ✅ CLI tools
- ✅ Local-first applications
- ⚠️ Not recommended for public-facing web servers without additional security layers
- ⚠️ Not designed for multi-tenant cloud deployments

### File System Security

AxioDB stores data in the file system:

- Ensure proper file permissions on the data directory
- Do not expose the data directory via web servers
- Use encryption for sensitive data
- Implement regular backups

### GUI Security (localhost:27018)

The built-in GUI is intended for **development and local use only**:

- ⚠️ Do not expose to public networks
- ⚠️ No authentication by default
- ✅ Binds to localhost only
- ✅ Safe for Electron apps (local environment)

## Disclosure Policy

- We follow **coordinated disclosure** principles
- Security fixes are released before public disclosure
- We provide credit to researchers who report vulnerabilities responsibly
- Public disclosure is made after fixes are available and users have time to update

## Contact

For security-related questions or concerns:

- **Email**: ankansahaofficial@gmail.com
- **GitHub**: [Report a vulnerability](https://github.com/nexoral/AxioDB/security/advisories/new)

## Hall of Fame

We recognize and thank the following security researchers who have helped improve AxioDB's security:

<!-- Researchers who report vulnerabilities will be listed here (with permission) -->

*No vulnerabilities reported yet.*

---

**Thank you for helping keep AxioDB and its users safe!** 🛡️
