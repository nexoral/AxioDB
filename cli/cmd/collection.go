package cmd

import (
	"fmt"

	"github.com/nexoral/axiodb-cli/internal/config"
	"github.com/nexoral/axiodb-cli/pkg/commands"
	"github.com/nexoral/axiodb-cli/pkg/protocol"
	"github.com/spf13/cobra"
)

var collectionCmd = &cobra.Command{
	Use:   "collection",
	Short: "Collection operations",
}

var collectionCreateCmd = &cobra.Command{
	Use:   "create <name>",
	Short: "Create a collection",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" {
			return fmt.Errorf("--db flag is required")
		}
		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		resp, err := commands.CreateCollection(client, cfg.DB, args[0])
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var collectionDeleteCmd = &cobra.Command{
	Use:   "delete <name>",
	Short: "Delete a collection",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" {
			return fmt.Errorf("--db flag is required")
		}
		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		resp, err := commands.DeleteCollection(client, cfg.DB, args[0])
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var collectionExistsCmd = &cobra.Command{
	Use:   "exists <name>",
	Short: "Check if a collection exists",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" {
			return fmt.Errorf("--db flag is required")
		}
		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		exists, err := commands.CollectionExists(client, cfg.DB, args[0])
		if err != nil {
			return err
		}
		fmt.Printf("Collection '%s' exists: %v\n", args[0], exists)
		return nil
	},
}

var collectionInfoCmd = &cobra.Command{
	Use:   "info",
	Short: "Get collection information",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" {
			return fmt.Errorf("--db flag is required")
		}
		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		resp, err := commands.GetCollectionInfo(client, cfg.DB)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var collectionListCmd = &cobra.Command{
	Use:   "list",
	Short: "List all collections in a database",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" {
			return fmt.Errorf("--db flag is required")
		}
		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		resp, err := commands.GetCollectionInfo(client, cfg.DB)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

func init() {
	collectionCmd.AddCommand(collectionCreateCmd)
	collectionCmd.AddCommand(collectionDeleteCmd)
	collectionCmd.AddCommand(collectionExistsCmd)
	collectionCmd.AddCommand(collectionInfoCmd)
	collectionCmd.AddCommand(collectionListCmd)
	rootCmd.AddCommand(collectionCmd)
}

func createCollection(client *protocol.Client, dbName, collName string) (*protocol.Response, error) {
	return commands.CreateCollection(client, dbName, collName)
}

func deleteCollection(client *protocol.Client, dbName, collName string) (*protocol.Response, error) {
	return commands.DeleteCollection(client, dbName, collName)
}

func collectionExists(client *protocol.Client, dbName, collName string) (bool, error) {
	return commands.CollectionExists(client, dbName, collName)
}

func getCollectionInfo(client *protocol.Client, dbName string) (*protocol.Response, error) {
	return commands.GetCollectionInfo(client, dbName)
}
