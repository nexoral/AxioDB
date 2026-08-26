package cmd

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/nexoral/axiodb-cli/internal/config"
	"github.com/nexoral/axiodb-cli/pkg/commands"
	"github.com/spf13/cobra"
)

var documentCmd = &cobra.Command{
	Use:   "document",
	Short: "Document operations",
}

var documentInsertCmd = &cobra.Command{
	Use:   "insert <json>",
	Short: "Insert a document",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" || cfg.Collection == "" {
			return fmt.Errorf("--db and --collection flags are required")
		}

		var data interface{}
		if err := json.Unmarshal([]byte(args[0]), &data); err != nil {
			return fmt.Errorf("invalid JSON: %w", err)
		}

		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		resp, err := commands.InsertDocument(client, cfg.DB, cfg.Collection, data)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var documentInsertManyCmd = &cobra.Command{
	Use:   "insert-many <file>",
	Short: "Insert multiple documents from a JSON file",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" || cfg.Collection == "" {
			return fmt.Errorf("--db and --collection flags are required")
		}

		data, err := os.ReadFile(args[0])
		if err != nil {
			return fmt.Errorf("read file: %w", err)
		}

		var documents interface{}
		if err := json.Unmarshal(data, &documents); err != nil {
			return fmt.Errorf("invalid JSON: %w", err)
		}

		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		resp, err := commands.InsertManyDocuments(client, cfg.DB, cfg.Collection, documents)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var documentQueryCmd = &cobra.Command{
	Use:   "query [query-json]",
	Short: "Query documents",
	Args:  cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" || cfg.Collection == "" {
			return fmt.Errorf("--db and --collection flags are required")
		}

		limit, _ := cmd.Flags().GetInt("limit")
		skip, _ := cmd.Flags().GetInt("skip")
		sortStr, _ := cmd.Flags().GetString("sort")
		findOne, _ := cmd.Flags().GetBool("find-one")

		opts := commands.QueryOptions{
			Limit:   limit,
			Skip:    skip,
			FindOne: findOne,
		}

		if len(args) > 0 {
			var query interface{}
			if err := json.Unmarshal([]byte(args[0]), &query); err != nil {
				return fmt.Errorf("invalid query JSON: %w", err)
			}
			opts.Query = query
		}

		if sortStr != "" {
			var sort interface{}
			if err := json.Unmarshal([]byte(sortStr), &sort); err != nil {
				return fmt.Errorf("invalid sort JSON: %w", err)
			}
			opts.Sort = sort
		}

		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		resp, err := commands.QueryDocuments(client, cfg.DB, cfg.Collection, opts)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var documentGetCmd = &cobra.Command{
	Use:   "get <id>",
	Short: "Get a document by ID",
	Args:  cobra.ExactArgs(1),
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

		resp, err := commands.QueryByID(client, cfg.DB, cfg.Collection, args[0])
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var documentUpdateCmd = &cobra.Command{
	Use:   "update <id> <json>",
	Short: "Update a document by ID",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" || cfg.Collection == "" {
			return fmt.Errorf("--db and --collection flags are required")
		}

		var updateData interface{}
		if err := json.Unmarshal([]byte(args[1]), &updateData); err != nil {
			return fmt.Errorf("invalid JSON: %w", err)
		}

		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		resp, err := commands.UpdateDocumentByID(client, cfg.DB, cfg.Collection, args[0], updateData)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var documentUpdateByQueryCmd = &cobra.Command{
	Use:   "update-by-query <query-json> <update-json>",
	Short: "Update documents by query",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" || cfg.Collection == "" {
			return fmt.Errorf("--db and --collection flags are required")
		}

		many, _ := cmd.Flags().GetBool("many")

		var query, updateData interface{}
		if err := json.Unmarshal([]byte(args[0]), &query); err != nil {
			return fmt.Errorf("invalid query JSON: %w", err)
		}
		if err := json.Unmarshal([]byte(args[1]), &updateData); err != nil {
			return fmt.Errorf("invalid update JSON: %w", err)
		}

		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		resp, err := commands.UpdateDocumentsByQuery(client, cfg.DB, cfg.Collection, query, updateData, !many)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var documentDeleteCmd = &cobra.Command{
	Use:   "delete <id>",
	Short: "Delete a document by ID",
	Args:  cobra.ExactArgs(1),
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

		resp, err := commands.DeleteDocumentByID(client, cfg.DB, cfg.Collection, args[0])
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var documentDeleteByQueryCmd = &cobra.Command{
	Use:   "delete-by-query <query-json>",
	Short: "Delete documents by query",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" || cfg.Collection == "" {
			return fmt.Errorf("--db and --collection flags are required")
		}

		many, _ := cmd.Flags().GetBool("many")

		var query interface{}
		if err := json.Unmarshal([]byte(args[0]), &query); err != nil {
			return fmt.Errorf("invalid query JSON: %w", err)
		}

		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		resp, err := commands.DeleteDocumentsByQuery(client, cfg.DB, cfg.Collection, query, !many)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var documentAggregateCmd = &cobra.Command{
	Use:   "aggregate <pipeline-json>",
	Short: "Run aggregation pipeline",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.FromFlags(cmd)
		if err != nil {
			return err
		}
		if cfg.DB == "" || cfg.Collection == "" {
			return fmt.Errorf("--db and --collection flags are required")
		}

		var pipeline interface{}
		if err := json.Unmarshal([]byte(args[0]), &pipeline); err != nil {
			return fmt.Errorf("invalid pipeline JSON: %w", err)
		}

		client, err := cfg.ConnectAndAuth()
		if err != nil {
			return err
		}
		defer client.Disconnect()

		resp, err := commands.Aggregate(client, cfg.DB, cfg.Collection, pipeline)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

var documentCountCmd = &cobra.Command{
	Use:   "count",
	Short: "Count total documents",
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

		resp, err := commands.TotalDocuments(client, cfg.DB, cfg.Collection)
		if err != nil {
			return err
		}
		return printOutput(cfg.Output, resp)
	},
}

func init() {
	documentQueryCmd.Flags().Int("limit", 0, "Limit results")
	documentQueryCmd.Flags().Int("skip", 0, "Skip results")
	documentQueryCmd.Flags().String("sort", "", "Sort JSON (e.g., '{\"name\":1}')")
	documentQueryCmd.Flags().Bool("find-one", false, "Find single document")

	documentUpdateByQueryCmd.Flags().Bool("many", false, "Update multiple documents")
	documentDeleteByQueryCmd.Flags().Bool("many", false, "Delete multiple documents")

	documentCmd.AddCommand(documentInsertCmd)
	documentCmd.AddCommand(documentInsertManyCmd)
	documentCmd.AddCommand(documentQueryCmd)
	documentCmd.AddCommand(documentGetCmd)
	documentCmd.AddCommand(documentUpdateCmd)
	documentCmd.AddCommand(documentUpdateByQueryCmd)
	documentCmd.AddCommand(documentDeleteCmd)
	documentCmd.AddCommand(documentDeleteByQueryCmd)
	documentCmd.AddCommand(documentAggregateCmd)
	documentCmd.AddCommand(documentCountCmd)
	rootCmd.AddCommand(documentCmd)
}
