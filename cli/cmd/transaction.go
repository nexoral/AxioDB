package cmd

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/nexoral/axiodb-cli/internal/config"
	"github.com/nexoral/axiodb-cli/pkg/commands"
	"github.com/spf13/cobra"
)

var transactionCmd = &cobra.Command{
	Use:   "transaction",
	Short: "Run ACID transaction operations",
	Long:  "ACID transactions over TCP (port 27019). Requires TCP server enabled (AXIODB_TCP=true). Use 'transaction run' for file-based batch, or begin/commit/rollback/savepoint for manual control.",
}

var transactionRunCmd = &cobra.Command{
	Use:   "run <operations-json-file>",
	Short: "Run a transaction from a JSON operation list",
	Long:  "Run a full transaction from a JSON file. Requires TCP (AXIODB_TCP=true) and --db/--collection. Auto-commits on success, auto-rollbacks on failure.",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" || cfg.Collection == "" {
			return fmt.Errorf("--db and --collection flags are required")
		}
		content, err := os.ReadFile(args[0])
		if err != nil {
			return fmt.Errorf("read transaction file: %w", err)
		}
		var steps []commands.TransactionStep
		if err := json.Unmarshal(content, &steps); err != nil {
			return fmt.Errorf("invalid transaction JSON: %w", err)
		}
		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()
		response, err := commands.RunTransaction(client, cfg.DB, cfg.Collection, steps)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, response)
	},
}

var transactionBeginCmd = &cobra.Command{
	Use:   "begin",
	Short: "Begin a transaction (returns transactionId)",
	Long:  "Begin a transaction on --db/--collection. Requires TCP. Returns transactionId for subsequent commit/rollback/savepoint calls.",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" || cfg.Collection == "" {
			return fmt.Errorf("--db and --collection flags are required")
		}
		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()
		resp, err := commands.BeginTransaction(client, cfg.DB, cfg.Collection)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var transactionCommitCmd = &cobra.Command{
	Use:   "commit <transactionId>",
	Short: "Commit a transaction",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()
		resp, err := commands.CommitTransaction(client, args[0])
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var transactionRollbackCmd = &cobra.Command{
	Use:   "rollback <transactionId>",
	Short: "Rollback a transaction",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()
		resp, err := commands.RollbackTransaction(client, args[0])
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var transactionSavepointCmd = &cobra.Command{
	Use:   "savepoint <transactionId> <name>",
	Short: "Create a savepoint",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()
		resp, err := commands.Savepoint(client, args[0], args[1])
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var transactionRollbackToCmd = &cobra.Command{
	Use:   "rollback-to <transactionId> <name>",
	Short: "Rollback to a savepoint",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()
		resp, err := commands.RollbackToSavepoint(client, args[0], args[1])
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var transactionReleaseCmd = &cobra.Command{
	Use:   "release <transactionId> <name>",
	Short: "Release a savepoint",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()
		resp, err := commands.ReleaseSavepoint(client, args[0], args[1])
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

func init() {
	transactionCmd.AddCommand(transactionRunCmd, transactionBeginCmd, transactionCommitCmd, transactionRollbackCmd, transactionSavepointCmd, transactionRollbackToCmd, transactionReleaseCmd)
	rootCmd.AddCommand(transactionCmd)
}
