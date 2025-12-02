#!/bin/bash

echo "Setting up AxioDB development environment..."

# Check if .git directory exists
if [ ! -d ".git" ]; then
    echo "Warning: .git directory not found. Skipping Git hooks setup."
    echo "This is normal for npm installations of the package."
    exit 0
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Run version controller script
./Scripts/versionController.sh

# Capture the exit code
EXIT_CODE=$?

# If the script failed (non-zero exit code), prevent the commit
if [ $EXIT_CODE -ne 0 ]; then
    echo "Commit aborted: Version check failed"
    exit 1
fi

# If we get here, the version check passed
exit 0
EOF

# Make pre-commit hook executable
chmod +x .git/hooks/pre-commit

echo "✓ Pre-commit hook installed successfully!"
echo "  Version controller will run automatically before each commit."
