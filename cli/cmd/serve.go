package cmd

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/nexoral/axiodb-cli/pkg/serve"
	"github.com/spf13/cobra"
)

const npmInstallTimeout = 10 * time.Minute

var serveCmd = &cobra.Command{
	Use:       "serve <http|tcp|tcp-auth|full>",
	Short:     "Start a temporary local AxioDB server",
	Args:      cobra.ExactArgs(1),
	ValidArgs: []string{"http", "tcp", "tcp-auth", "full"},
	RunE: func(cmd *cobra.Command, args []string) error {
		return runServe(cmd, args[0])
	},
}

func init() {
	rootCmd.AddCommand(serveCmd)
}

func runServe(cmd *cobra.Command, modeName string) (runErr error) {
	config, err := serve.ParseMode(modeName)
	if err != nil {
		return err
	}

	output := cmd.OutOrStdout()
	errorOutput := cmd.ErrOrStderr()
	ctx := cmd.Context()

	fmt.Fprintf(output, "Preparing AxioDB %s server...\n", config.Mode)
	nodePath, npmPath, err := serve.EnsureNode(ctx, output)
	if err != nil {
		return err
	}

	tempDir, err := os.MkdirTemp("", "axiodb-serve-")
	if err != nil {
		return fmt.Errorf("create temporary server directory: %w", err)
	}
	defer func() {
		if cleanupErr := os.RemoveAll(tempDir); cleanupErr != nil {
			if runErr == nil {
				runErr = fmt.Errorf("remove temporary server directory %q: %w", tempDir, cleanupErr)
			} else {
				fmt.Fprintf(errorOutput, "Warning: failed to remove temporary server directory %q: %v\n", tempDir, cleanupErr)
			}
		}
	}()

	scriptPath := filepath.Join(tempDir, "server.js")
	if err := os.WriteFile(scriptPath, []byte(serve.ServerScript(config)), 0600); err != nil {
		return fmt.Errorf("write temporary server.js: %w", err)
	}

	fmt.Fprintf(output, "Temporary data directory: %s\n", filepath.Join(tempDir, "AxioDB"))
	fmt.Fprintln(output, "Installing the AxioDB npm package...")
	if err := installAxioDB(ctx, npmPath, tempDir, output, errorOutput); err != nil {
		return err
	}

	child := exec.Command(nodePath, scriptPath)
	child.Dir = tempDir
	child.Stdout = output
	child.Stderr = errorOutput

	signals := make(chan os.Signal, 1)
	signal.Notify(signals, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(signals)

	fmt.Fprintln(output, "Starting server...")
	if err := child.Start(); err != nil {
		return fmt.Errorf("start Node.js server: %w", err)
	}

	childDone := make(chan error, 1)
	go func() {
		childDone <- child.Wait()
	}()

	startupContext, cancelStartup := context.WithTimeout(ctx, serve.ReadinessTimeout)
	defer cancelStartup()
	if err := serve.WaitForReady(startupContext, config, childDone, signals); err != nil {
		stopErr := stopChild(child, childDone)
		if stopErr != nil && !isExpectedProcessExit(stopErr) {
			return errors.Join(err, fmt.Errorf("stop failed server: %w", stopErr))
		}
		if errors.Is(err, serve.ErrInterrupted) {
			fmt.Fprintln(output, "\nReceived interrupt. Stopping server...")
			fmt.Fprintln(output, "Server stopped. Removing temporary data...")
			return nil
		}
		return err
	}

	printReady(output, config)
	fmt.Fprintln(output, "Press Ctrl+C to stop the server and delete its temporary data.")

	select {
	case received := <-signals:
		fmt.Fprintf(output, "\nReceived %s. Stopping server...\n", received)
		if err := stopChild(child, childDone); err != nil && !isExpectedProcessExit(err) {
			return fmt.Errorf("stop server: %w", err)
		}
		fmt.Fprintln(output, "Server stopped. Removing temporary data...")
		return nil
	case err := <-childDone:
		if err != nil && !isExpectedProcessExit(err) {
			return fmt.Errorf("server stopped unexpectedly: %w", err)
		}
		fmt.Fprintln(output, "Server stopped. Removing temporary data...")
		return nil
	}
}

func installAxioDB(ctx context.Context, npmPath, tempDir string, output, errorOutput io.Writer) error {
	installContext, cancel := context.WithTimeout(ctx, npmInstallTimeout)
	defer cancel()

	command := exec.CommandContext(
		installContext,
		npmPath,
		"install",
		"--prefix",
		tempDir,
		"--no-save",
		"--no-audit",
		"--no-fund",
		"axiodb",
	)
	command.Stdout = output
	command.Stderr = errorOutput
	if err := command.Run(); err != nil {
		return fmt.Errorf("install axiodb in temporary server directory: %w", err)
	}
	return nil
}

func printReady(output io.Writer, config serve.ModeConfig) {
	fmt.Fprintln(output, "Server started.")
	if config.HasHTTP() {
		fmt.Fprintf(output, "  HTTP API: http://localhost:%d/api\n", serve.HTTPPort)
	}
	if config.HasTCP() {
		fmt.Fprintf(output, "  TCP:      axiodb://localhost:%d\n", serve.TCPPort)
		if config.TCPAuth {
			fmt.Fprintln(output, "  TCP auth: enabled")
		}
	}
	if config.RequiresTCPAuthWarning() {
		fmt.Fprintln(output, "  Warning: tcp-auth seeds admin/admin, but TCP rejects it until the password is changed through HTTP/GUI.")
	}
}

func stopChild(child *exec.Cmd, childDone <-chan error) error {
	if child.Process == nil {
		return nil
	}
	if child.ProcessState != nil {
		return nil
	}

	if err := child.Process.Signal(os.Interrupt); err != nil {
		if killErr := child.Process.Kill(); killErr != nil {
			return errors.Join(err, killErr)
		}
	}

	select {
	case err := <-childDone:
		return err
	case <-time.After(5 * time.Second):
		if err := child.Process.Kill(); err != nil {
			return fmt.Errorf("force-stop Node.js server: %w", err)
		}
		return <-childDone
	}
}

func isExpectedProcessExit(err error) bool {
	if err == nil {
		return true
	}
	var exitError *exec.ExitError
	if !errors.As(err, &exitError) {
		return false
	}
	if status := exitError.ProcessState.ExitCode(); status == 0 {
		return true
	}
	message := strings.ToLower(err.Error())
	return strings.Contains(message, "signal: interrupt") ||
		strings.Contains(message, "signal: terminated") ||
		strings.Contains(message, "signal: killed")
}
