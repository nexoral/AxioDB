package serve

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"time"
)

const (
	MinimumNodeMajor = 20
	ReadinessTimeout = 30 * time.Second
)

var ErrInterrupted = errors.New("server startup interrupted")

func EnsureNode(ctx context.Context, out io.Writer) (string, string, error) {
	nodePath, nodeErr := exec.LookPath("node")
	npmPath, npmErr := exec.LookPath("npm")
	if nodeErr == nil && npmErr == nil {
		if err := verifyNodeVersion(ctx, nodePath); err == nil {
			return nodePath, npmPath, nil
		}
	}

	fmt.Fprintf(out, "Node.js >= %d and npm are required; attempting installation for %s/%s...\n", MinimumNodeMajor, runtime.GOOS, runtime.GOARCH)
	if err := installNode(ctx, out); err != nil {
		return "", "", err
	}

	nodePath, nodeErr = exec.LookPath("node")
	if nodeErr != nil {
		return "", "", fmt.Errorf("Node.js installation completed but node is still unavailable: %w", nodeErr)
	}
	npmPath, npmErr = exec.LookPath("npm")
	if npmErr != nil {
		return "", "", fmt.Errorf("Node.js installation completed but npm is still unavailable: %w", npmErr)
	}
	if err := verifyNodeVersion(ctx, nodePath); err != nil {
		return "", "", err
	}
	return nodePath, npmPath, nil
}

func verifyNodeVersion(ctx context.Context, nodePath string) error {
	output, err := exec.CommandContext(ctx, nodePath, "--version").Output()
	if err != nil {
		return fmt.Errorf("check Node.js version: %w", err)
	}
	version := strings.TrimSpace(string(output))
	version = strings.TrimPrefix(version, "v")
	parts := strings.SplitN(version, ".", 2)
	if len(parts) == 0 {
		return fmt.Errorf("unable to parse Node.js version %q", version)
	}
	major, err := strconv.Atoi(parts[0])
	if err != nil || major < MinimumNodeMajor {
		return fmt.Errorf("Node.js >= %d is required, found %q", MinimumNodeMajor, version)
	}
	return nil
}

func installNode(ctx context.Context, out io.Writer) error {
	switch runtime.GOOS {
	case "linux":
		return installNodeLinux(ctx, out)
	case "darwin":
		if _, err := exec.LookPath("brew"); err != nil {
			return fmt.Errorf("Homebrew is required to install Node.js automatically on macOS (%s); install Node.js %d LTS from https://nodejs.org/download/ or install Homebrew first", runtime.GOARCH, MinimumNodeMajor)
		}
		if err := runCommand(ctx, out, "brew", "install", "node@20"); err != nil {
			return err
		}
		return runCommand(ctx, out, "brew", "link", "--force", "--overwrite", "node@20")
	case "windows":
		if _, err := exec.LookPath("winget"); err != nil {
			return fmt.Errorf("winget is required to install Node.js automatically on Windows (%s); install Node.js %d LTS from https://nodejs.org/download/", runtime.GOARCH, MinimumNodeMajor)
		}
		return runCommand(ctx, out, "winget", "install", "OpenJS.NodeJS.LTS", "--accept-source-agreements", "--accept-package-agreements")
	default:
		return fmt.Errorf("automatic Node.js installation is unsupported on %s/%s; install Node.js %d LTS from https://nodejs.org/download/", runtime.GOOS, runtime.GOARCH, MinimumNodeMajor)
	}
}

func installNodeLinux(ctx context.Context, out io.Writer) error {
	if _, err := exec.LookPath("apt-get"); err != nil {
		return fmt.Errorf("automatic Node.js installation currently supports Debian/Ubuntu apt only on Linux (%s); install Node.js %d LTS from https://nodejs.org/download/", runtime.GOARCH, MinimumNodeMajor)
	}
	if _, err := exec.LookPath("curl"); err != nil {
		return errors.New("curl is required to install Node.js on Debian/Ubuntu")
	}

	script, err := createTemporaryFile("axiodb-node-*.sh")
	if err != nil {
		return fmt.Errorf("create Node.js installation script: %w", err)
	}
	defer removeTemporaryFile(script)

	if err := runCommand(ctx, out, "curl", "-fsSL", "-o", script, "https://deb.nodesource.com/setup_20.x"); err != nil {
		return fmt.Errorf("download Node.js installation setup: %w", err)
	}
	if err := runCommand(ctx, out, "sudo", "-E", "bash", script); err != nil {
		return fmt.Errorf("configure Node.js repository: %w", err)
	}
	return runCommand(ctx, out, "sudo", "apt-get", "install", "-y", "nodejs")
}

func runCommand(ctx context.Context, out io.Writer, name string, args ...string) error {
	command := exec.CommandContext(ctx, name, args...)
	command.Stdout = out
	command.Stderr = out
	if err := command.Run(); err != nil {
		return fmt.Errorf("%s %s: %w", name, strings.Join(args, " "), err)
	}
	return nil
}

func createTemporaryFile(pattern string) (string, error) {
	file, err := os.CreateTemp("", pattern)
	if err == nil {
		path := file.Name()
		if closeErr := file.Close(); closeErr != nil {
			return "", fmt.Errorf("close temporary file: %w", closeErr)
		}
		return path, nil
	}
	return "", fmt.Errorf("create temporary file: %w", err)
}

func removeTemporaryFile(path string) {
	_ = os.Remove(path)
}

func WaitForReady(ctx context.Context, config ModeConfig, childDone <-chan error, signals <-chan os.Signal) error {
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		httpReady := !config.HasHTTP() || checkHTTP()
		tcpReady := !config.HasTCP() || checkTCP()
		if httpReady && tcpReady {
			return nil
		}

		select {
		case err := <-childDone:
			if err == nil {
				return errors.New("server process exited before becoming ready")
			}
			return fmt.Errorf("server process exited before becoming ready: %w", err)
		case <-signals:
			return ErrInterrupted
		case <-ctx.Done():
			return fmt.Errorf("waiting for server readiness: %w", ctx.Err())
		case <-ticker.C:
		}
	}
}

func checkHTTP() bool {
	client := http.Client{Timeout: 500 * time.Millisecond}
	response, err := client.Get(fmt.Sprintf("http://127.0.0.1:%d/api/health", HTTPPort))
	if err != nil {
		return false
	}
	defer response.Body.Close()
	return response.StatusCode < http.StatusInternalServerError
}

func checkTCP() bool {
	connection, err := net.DialTimeout("tcp", fmt.Sprintf("127.0.0.1:%d", TCPPort), 500*time.Millisecond)
	if err != nil {
		return false
	}
	_ = connection.Close()
	return true
}
