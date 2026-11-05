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
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const (
	ReadinessTimeout = 30 * time.Second
)

var ErrInterrupted = errors.New("server startup interrupted")

// EnsureBun looks for bun in PATH or the standard user installation location (~/.bun/bin/bun).
// If bun is not found, it attempts to install bun.
func EnsureBun(ctx context.Context, out io.Writer) (string, error) {
	if bunPath, err := findBun(); err == nil {
		return bunPath, nil
	}

	fmt.Fprintf(out, "Bun runtime is required; attempting installation for %s/%s...\n", runtime.GOOS, runtime.GOARCH)
	if err := installBun(ctx, out); err != nil {
		return "", err
	}

	bunPath, err := findBun()
	if err != nil {
		return "", fmt.Errorf("Bun installation completed but bun executable was not found: %w", err)
	}
	return bunPath, nil
}

func findBun() (string, error) {
	if bunPath, err := exec.LookPath("bun"); err == nil {
		return bunPath, nil
	}

	// Check standard user directory ~/.bun/bin/bun or %USERPROFILE%\.bun\bin\bun.exe
	homeDir, err := os.UserHomeDir()
	if err == nil && homeDir != "" {
		binaryName := "bun"
		if runtime.GOOS == "windows" {
			binaryName = "bun.exe"
		}
		userBun := filepath.Join(homeDir, ".bun", "bin", binaryName)
		if fileInfo, statErr := os.Stat(userBun); statErr == nil && !fileInfo.IsDir() {
			return userBun, nil
		}
	}

	return "", errors.New("bun not found in PATH or standard install directory")
}

func installBun(ctx context.Context, out io.Writer) error {
	switch runtime.GOOS {
	case "windows":
		if _, err := exec.LookPath("powershell"); err != nil {
			return fmt.Errorf("powershell is required to install Bun on Windows; install Bun manually from https://bun.sh")
		}
		return runCommand(ctx, out, "powershell", "-c", "irm bun.sh/install.ps1 | iex")
	case "linux", "darwin":
		if _, err := exec.LookPath("curl"); err != nil {
			return fmt.Errorf("curl is required to install Bun on %s; install curl or install Bun from https://bun.sh", runtime.GOOS)
		}
		script, err := createTemporaryFile("axiodb-bun-*.sh")
		if err != nil {
			return fmt.Errorf("create Bun installation script: %w", err)
		}
		defer removeTemporaryFile(script)

		if err := runCommand(ctx, out, "curl", "-fsSL", "-o", script, "https://bun.sh/install"); err != nil {
			return fmt.Errorf("download Bun installer: %w", err)
		}
		return runCommand(ctx, out, "bash", script)
	default:
		return fmt.Errorf("automatic Bun installation is unsupported on %s/%s; install Bun from https://bun.sh", runtime.GOOS, runtime.GOARCH)
	}
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
		mcpReady := !config.HasMCP() || checkMCP()
		if httpReady && tcpReady && mcpReady {
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

func checkMCP() bool {
	client := http.Client{Timeout: 500 * time.Millisecond}
	response, err := client.Get(fmt.Sprintf("http://127.0.0.1:%d/", MCPPort))
	if err != nil {
		return false
	}
	defer response.Body.Close()
	return response.StatusCode < http.StatusInternalServerError
}
