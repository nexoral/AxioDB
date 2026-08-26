package cmd

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/nexoral/axiodb-cli/internal/config"
	"github.com/nexoral/axiodb-cli/pkg/commands"
	"github.com/nexoral/axiodb-cli/pkg/protocol"
	"github.com/spf13/cobra"
)

var dbCmd = &cobra.Command{
	Use:   "db",
	Short: "Database operations",
}

var dbCreateCmd = &cobra.Command{
	Use:   "create <name>",
	Short: "Create a database",
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

		resp, err := commands.CreateDB(client, args[0])
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var dbDeleteCmd = &cobra.Command{
	Use:   "delete <name>",
	Short: "Delete a database",
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

		resp, err := commands.DeleteDB(client, args[0])
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var dbExistsCmd = &cobra.Command{
	Use:   "exists <name>",
	Short: "Check if a database exists",
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

		exists, err := commands.DBExists(client, args[0])
		if err != nil {
			return err
		}
		fmt.Printf("Database '%s' exists: %v\n", args[0], exists)
		return nil
	},
}

var dbInfoCmd = &cobra.Command{
	Use:   "info",
	Short: "Get instance information",
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

		resp, err := commands.GetInstanceInfo(client)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var dbListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all databases",
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

		resp, err := commands.GetInstanceInfo(client)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

func init() {
	dbCmd.AddCommand(dbCreateCmd)
	dbCmd.AddCommand(dbDeleteCmd)
	dbCmd.AddCommand(dbExistsCmd)
	dbCmd.AddCommand(dbInfoCmd)
	dbCmd.AddCommand(dbListCmd)
	rootCmd.AddCommand(dbCmd)
}

func printOutput(format string, data interface{}) error {
	if format == "json" {
		encoder := json.NewEncoder(os.Stdout)
		encoder.SetIndent("", "  ")
		return encoder.Encode(data)
	}

	jsonBytes, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}
	fmt.Println(string(jsonBytes))
	return nil
}

func createDB(client *protocol.Client, name string) (*protocol.Response, error) {
	return commands.CreateDB(client, name)
}

func deleteDB(client *protocol.Client, name string) (*protocol.Response, error) {
	return commands.DeleteDB(client, name)
}

func dbExists(client *protocol.Client, name string) (bool, error) {
	return commands.DBExists(client, name)
}

func getInstanceInfo(client *protocol.Client) (*protocol.Response, error) {
	return commands.GetInstanceInfo(client)
}
