package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/chzyer/readline"
	"github.com/nexoral/axiodb-cli/internal/config"
	"github.com/nexoral/axiodb-cli/pkg/commands"
	"github.com/nexoral/axiodb-cli/pkg/protocol"
	"github.com/spf13/cobra"
)

var replCommands = []string{
	"use", "show dbs", "show collections", "ping", "help", "exit", "quit", "clear",
	"db.createCollection(", "db..insert(", "db..insertMany(",
	"db..find(", "db..findOne(", "db..updateOne(", "db..updateMany(",
	"db..deleteOne(", "db..deleteMany(", "db..aggregate(",
	"db..countDocuments()", "db..createIndex(", "db..dropIndex(",
	"db..getIndexes()", "db..get(", "db..update(", "db..delete(",
}

var connectCmd = &cobra.Command{
	Use:   "connect",
	Short: "Open interactive REPL session",
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

		rl, err := readline.NewEx(&readline.Config{
			Prompt:          "axiodb> ",
			HistoryFile:     "/tmp/axiodb_history",
			InterruptPrompt: "^C",
			EOFPrompt:       "exit",
			AutoComplete:    readline.NewPrefixCompleter(completerItems...),
		})
		if err != nil {
			return fmt.Errorf("init readline: %w", err)
		}
		defer rl.Close()

		var currentDB, currentColl string

		fmt.Println("AxioDB Shell. Type 'help' for commands, 'exit' to quit.")

		for {
			rl.SetPrompt(buildPrompt(currentDB, currentColl))
			line, err := rl.Readline()
			if err != nil {
				break
			}

			input := strings.TrimSpace(line)
			if input == "" {
				continue
			}

			if err := handleREPLInput(client, input, &currentDB, &currentColl); err != nil {
				fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			}
		}

		return nil
	},
}

func init() {
	rootCmd.AddCommand(connectCmd)
}

func buildPrompt(db, coll string) string {
	if db == "" {
		return "axiodb> "
	}
	if coll == "" {
		return fmt.Sprintf("axiodb:%s> ", db)
	}
	return fmt.Sprintf("axiodb:%s:%s> ", db, coll)
}

var completerItems = []readline.PrefixCompleterInterface{
	readline.PcItem("use"),
	readline.PcItem("show",
		readline.PcItem("dbs"),
		readline.PcItem("collections"),
	),
	readline.PcItem("ping"),
	readline.PcItem("help"),
	readline.PcItem("exit"),
	readline.PcItem("quit"),
	readline.PcItem("clear"),
	readline.PcItem("db.",
		readline.PcItem("createCollection("),
	),
}

func handleREPLInput(client *protocol.Client, input string, db, coll *string) error {
	switch {
	case input == "exit" || input == "quit":
		fmt.Println("Bye!")
		os.Exit(0)

	case input == "help":
		printREPLHelp()

	case input == "clear":
		fmt.Print("\033[H\033[2J")

	case strings.HasPrefix(input, "use "):
		target := strings.TrimSpace(strings.TrimPrefix(input, "use"))
		parts := strings.SplitN(target, ".", 2)
		*db = parts[0]
		if len(parts) > 1 {
			*coll = parts[1]
		} else {
			*coll = ""
		}
		fmt.Printf("switched to %s\n", buildPrompt(*db, *coll))

	case input == "show dbs":
		resp, err := commands.GetInstanceInfo(client)
		if err != nil {
			return err
		}
		printDatabases(resp)

	case input == "show collections":
		if *db == "" {
			return fmt.Errorf("no database selected. Use 'use <db>' first")
		}
		resp, err := commands.GetCollectionInfo(client, *db)
		if err != nil {
			return err
		}
		printCollections(resp)

	case input == "ping":
		if err := client.Ping(); err != nil {
			return err
		}
		fmt.Println("PONG")

	case strings.HasPrefix(input, "db."):
		return handleDBCommand(client, input, *db, *coll)

	default:
		return fmt.Errorf("unknown command: %s (type 'help' for available commands)", input)
	}

	return nil
}

func handleDBCommand(client *protocol.Client, input, db, coll string) error {
	if db == "" {
		return fmt.Errorf("no database selected. Use 'use <db>' first")
	}

	switch {
	case strings.HasPrefix(input, "db.createCollection("):
		name := extractParenArg(input, "db.createCollection")
		if name == "" {
			return fmt.Errorf("syntax: db.createCollection(<name>)")
		}
		resp, err := commands.CreateCollection(client, db, name)
		if err != nil {
			return err
		}
		printJSON(resp)

	case strings.HasPrefix(input, "db.") && strings.Contains(input, ".insert("):
		if coll == "" {
			return fmt.Errorf("no collection selected. Use 'use <db>.<collection>' first")
		}
		parts := strings.SplitN(input, ".insert(", 2)
		if len(parts) < 2 {
			return fmt.Errorf("syntax: db.<coll>.insert(<json>)")
		}
		jsonStr := strings.TrimSuffix(parts[1], ")")
		var data interface{}
		if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
			return fmt.Errorf("invalid JSON: %w", err)
		}
		resp, err := commands.InsertDocument(client, db, coll, data)
		if err != nil {
			return err
		}
		printJSON(resp)

	case strings.HasPrefix(input, "db.") && strings.Contains(input, ".insertMany("):
		if coll == "" {
			return fmt.Errorf("no collection selected. Use 'use <db>.<collection>' first")
		}
		parts := strings.SplitN(input, ".insertMany(", 2)
		if len(parts) < 2 {
			return fmt.Errorf("syntax: db.<coll>.insertMany(<json-array>)")
		}
		jsonStr := strings.TrimSuffix(parts[1], ")")
		var docs interface{}
		if err := json.Unmarshal([]byte(jsonStr), &docs); err != nil {
			return fmt.Errorf("invalid JSON: %w", err)
		}
		resp, err := commands.InsertManyDocuments(client, db, coll, docs)
		if err != nil {
			return err
		}
		printJSON(resp)

	case strings.HasPrefix(input, "db.") && strings.Contains(input, ".find("):
		if coll == "" {
			return fmt.Errorf("no collection selected. Use 'use <db>.<collection>' first")
		}
		parts := strings.SplitN(input, ".find(", 2)
		if len(parts) < 2 {
			return fmt.Errorf("syntax: db.<coll>.find(<query>)")
		}
		jsonStr := strings.TrimSuffix(parts[1], ")")
		opts := commands.QueryOptions{}
		if jsonStr != "" {
			var query interface{}
			if err := json.Unmarshal([]byte(jsonStr), &query); err != nil {
				return fmt.Errorf("invalid query JSON: %w", err)
			}
			opts.Query = query
		}
		resp, err := commands.QueryDocuments(client, db, coll, opts)
		if err != nil {
			return err
		}
		printJSON(resp)

	case strings.HasPrefix(input, "db.") && strings.Contains(input, ".findOne("):
		if coll == "" {
			return fmt.Errorf("no collection selected. Use 'use <db>.<collection>' first")
		}
		parts := strings.SplitN(input, ".findOne(", 2)
		if len(parts) < 2 {
			return fmt.Errorf("syntax: db.<coll>.findOne(<query>)")
		}
		jsonStr := strings.TrimSuffix(parts[1], ")")
		opts := commands.QueryOptions{FindOne: true}
		if jsonStr != "" {
			var query interface{}
			if err := json.Unmarshal([]byte(jsonStr), &query); err != nil {
				return fmt.Errorf("invalid query JSON: %w", err)
			}
			opts.Query = query
		}
		resp, err := commands.QueryDocuments(client, db, coll, opts)
		if err != nil {
			return err
		}
		printJSON(resp)

	case strings.HasPrefix(input, "db.") && strings.Contains(input, ".updateOne("):
		if coll == "" {
			return fmt.Errorf("no collection selected")
		}
		query, update, err := extractTwoJSONArgs(input, ".updateOne(")
		if err != nil {
			return err
		}
		resp, err := commands.UpdateDocumentsByQuery(client, db, coll, query, update, true)
		if err != nil {
			return err
		}
		printJSON(resp)

	case strings.HasPrefix(input, "db.") && strings.Contains(input, ".updateMany("):
		if coll == "" {
			return fmt.Errorf("no collection selected")
		}
		query, update, err := extractTwoJSONArgs(input, ".updateMany(")
		if err != nil {
			return err
		}
		resp, err := commands.UpdateDocumentsByQuery(client, db, coll, query, update, false)
		if err != nil {
			return err
		}
		printJSON(resp)

	case strings.HasPrefix(input, "db.") && strings.Contains(input, ".deleteOne("):
		if coll == "" {
			return fmt.Errorf("no collection selected")
		}
		parts := strings.SplitN(input, ".deleteOne(", 2)
		if len(parts) < 2 {
			return fmt.Errorf("syntax: db.<coll>.deleteOne(<query>)")
		}
		jsonStr := strings.TrimSuffix(parts[1], ")")
		var query interface{}
		if jsonStr != "" {
			if err := json.Unmarshal([]byte(jsonStr), &query); err != nil {
				return fmt.Errorf("invalid query JSON: %w", err)
			}
		}
		resp, err := commands.DeleteDocumentsByQuery(client, db, coll, query, true)
		if err != nil {
			return err
		}
		printJSON(resp)

	case strings.HasPrefix(input, "db.") && strings.Contains(input, ".deleteMany("):
		if coll == "" {
			return fmt.Errorf("no collection selected")
		}
		parts := strings.SplitN(input, ".deleteMany(", 2)
		if len(parts) < 2 {
			return fmt.Errorf("syntax: db.<coll>.deleteMany(<query>)")
		}
		jsonStr := strings.TrimSuffix(parts[1], ")")
		var query interface{}
		if jsonStr != "" {
			if err := json.Unmarshal([]byte(jsonStr), &query); err != nil {
				return fmt.Errorf("invalid query JSON: %w", err)
			}
		}
		resp, err := commands.DeleteDocumentsByQuery(client, db, coll, query, false)
		if err != nil {
			return err
		}
		printJSON(resp)

	case strings.HasPrefix(input, "db.") && strings.Contains(input, ".aggregate("):
		if coll == "" {
			return fmt.Errorf("no collection selected")
		}
		parts := strings.SplitN(input, ".aggregate(", 2)
		if len(parts) < 2 {
			return fmt.Errorf("syntax: db.<coll>.aggregate(<pipeline>)")
		}
		jsonStr := strings.TrimSuffix(parts[1], ")")
		var pipeline interface{}
		if err := json.Unmarshal([]byte(jsonStr), &pipeline); err != nil {
			return fmt.Errorf("invalid pipeline JSON: %w", err)
		}
		resp, err := commands.Aggregate(client, db, coll, pipeline)
		if err != nil {
			return err
		}
		printJSON(resp)

	case strings.HasPrefix(input, "db.") && strings.Contains(input, ".countDocuments()"):
		if coll == "" {
			return fmt.Errorf("no collection selected")
		}
		resp, err := commands.TotalDocuments(client, db, coll)
		if err != nil {
			return err
		}
		printJSON(resp)

	case strings.HasPrefix(input, "db.") && strings.Contains(input, ".createIndex("):
		if coll == "" {
			return fmt.Errorf("no collection selected")
		}
		parts := strings.SplitN(input, ".createIndex(", 2)
		if len(parts) < 2 {
			return fmt.Errorf("syntax: db.<coll>.createIndex(<fields>)")
		}
		jsonStr := strings.TrimSuffix(parts[1], ")")
		var fields []string
		if err := json.Unmarshal([]byte(jsonStr), &fields); err != nil {
			return fmt.Errorf("invalid fields JSON: %w", err)
		}
		resp, err := commands.CreateIndex(client, db, coll, fields)
		if err != nil {
			return err
		}
		printJSON(resp)

	case strings.HasPrefix(input, "db.") && strings.Contains(input, ".dropIndex("):
		if coll == "" {
			return fmt.Errorf("no collection selected")
		}
		parts := strings.SplitN(input, ".dropIndex(", 2)
		if len(parts) < 2 {
			return fmt.Errorf("syntax: db.<coll>.dropIndex(<name>)")
		}
		name := strings.TrimSuffix(parts[1], ")")
		name = strings.Trim(name, "\"'")
		resp, err := commands.DropIndex(client, db, coll, name)
		if err != nil {
			return err
		}
		printJSON(resp)

	case strings.HasPrefix(input, "db.") && strings.Contains(input, ".getIndexes()"):
		if coll == "" {
			return fmt.Errorf("no collection selected")
		}
		resp, err := commands.ListIndexes(client, db, coll)
		if err != nil {
			return err
		}
		printJSON(resp)

	case strings.HasPrefix(input, "db.") && strings.Contains(input, ".get("):
		if coll == "" {
			return fmt.Errorf("no collection selected")
		}
		parts := strings.SplitN(input, ".get(", 2)
		if len(parts) < 2 {
			return fmt.Errorf("syntax: db.<coll>.get(<id>)")
		}
		id := strings.TrimSuffix(parts[1], ")")
		id = strings.Trim(id, "\"'")
		resp, err := commands.QueryByID(client, db, coll, id)
		if err != nil {
			return err
		}
		printJSON(resp)

	case strings.HasPrefix(input, "db.") && strings.Contains(input, ".update("):
		if coll == "" {
			return fmt.Errorf("no collection selected")
		}
		parts := strings.SplitN(input, ".update(", 2)
		if len(parts) < 2 {
			return fmt.Errorf("syntax: db.<coll>.update(<id>, <json>)")
		}
		args := strings.TrimSuffix(parts[1], ")")
		commaIdx := strings.Index(args, ",")
		if commaIdx < 0 {
			return fmt.Errorf("syntax: db.<coll>.update(<id>, <json>)")
		}
		id := strings.TrimSpace(args[:commaIdx])
		id = strings.Trim(id, "\"'")
		jsonStr := strings.TrimSpace(args[commaIdx+1:])
		var updateData interface{}
		if err := json.Unmarshal([]byte(jsonStr), &updateData); err != nil {
			return fmt.Errorf("invalid update JSON: %w", err)
		}
		resp, err := commands.UpdateDocumentByID(client, db, coll, id, updateData)
		if err != nil {
			return err
		}
		printJSON(resp)

	case strings.HasPrefix(input, "db.") && strings.Contains(input, ".delete("):
		if coll == "" {
			return fmt.Errorf("no collection selected")
		}
		parts := strings.SplitN(input, ".delete(", 2)
		if len(parts) < 2 {
			return fmt.Errorf("syntax: db.<coll>.delete(<id>)")
		}
		id := strings.TrimSuffix(parts[1], ")")
		id = strings.Trim(id, "\"'")
		resp, err := commands.DeleteDocumentByID(client, db, coll, id)
		if err != nil {
			return err
		}
		printJSON(resp)

	default:
		return fmt.Errorf("unknown db command: %s", input)
	}

	return nil
}

func extractParenArg(input, prefix string) string {
	fullPrefix := prefix + "("
	idx := strings.Index(input, fullPrefix)
	if idx < 0 {
		return ""
	}
	rest := input[idx+len(fullPrefix):]
	endIdx := strings.Index(rest, ")")
	if endIdx < 0 {
		return ""
	}
	return strings.TrimSpace(rest[:endIdx])
}

func extractTwoJSONArgs(input, methodSep string) (interface{}, interface{}, error) {
	parts := strings.SplitN(input, methodSep, 2)
	if len(parts) < 2 {
		return nil, nil, fmt.Errorf("syntax: db.<coll>%s<query>, <update>)", methodSep)
	}
	inner := strings.TrimSuffix(parts[1], ")")

	depth := 0
	commaIdx := -1
	for i, ch := range inner {
		switch ch {
		case '{', '[':
			depth++
		case '}', ']':
			depth--
		case ',':
			if depth == 0 {
				commaIdx = i
			}
		}
	}
	if commaIdx < 0 {
		return nil, nil, fmt.Errorf("expected two JSON arguments separated by comma")
	}

	var query, update interface{}
	if err := json.Unmarshal([]byte(strings.TrimSpace(inner[:commaIdx])), &query); err != nil {
		return nil, nil, fmt.Errorf("invalid query JSON: %w", err)
	}
	if err := json.Unmarshal([]byte(strings.TrimSpace(inner[commaIdx+1:])), &update); err != nil {
		return nil, nil, fmt.Errorf("invalid update JSON: %w", err)
	}
	return query, update, nil
}

func printJSON(data interface{}) {
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	encoder.Encode(data)
}

func printDatabases(resp *protocol.Response) {
	data, ok := resp.Data.(map[string]interface{})
	if !ok {
		printJSON(resp)
		return
	}

	databases, _ := data["ListOfDatabases"].([]interface{})
	total, _ := data["TotalDatabases"].(string)

	if len(databases) == 0 {
		fmt.Println("No databases found")
		return
	}

	fmt.Printf("Databases (%s):\n", total)
	for _, db := range databases {
		fmt.Printf("  - %s\n", db)
	}
}

func printCollections(resp *protocol.Response) {
	data, ok := resp.Data.(map[string]interface{})
	if !ok {
		printJSON(resp)
		return
	}

	collections, _ := data["ListOfCollections"].([]interface{})
	total, _ := data["TotalCollections"].(string)

	if len(collections) == 0 {
		fmt.Println("No collections found")
		return
	}

	fmt.Printf("Collections (%s):\n", total)
	for _, coll := range collections {
		fmt.Printf("  - %s\n", coll)
	}
}

func printREPLHelp() {
	fmt.Println(`Available commands:
  use <db>                        Switch database
  use <db>.<collection>           Switch database and collection
  show dbs                        List all databases
  show collections                List collections in current db
  ping                            Test connection
  clear                           Clear screen
  db.createCollection(<name>)     Create collection
  db.<coll>.insert(<json>)        Insert document
  db.<coll>.insertMany(<json>)    Insert multiple documents
  db.<coll>.find(<query>)         Query documents
  db.<coll>.findOne(<query>)      Query single document
  db.<coll>.updateOne(<q>, <u>)   Update one document
  db.<coll>.updateMany(<q>, <u>)  Update many documents
  db.<coll>.deleteOne(<query>)    Delete one document
  db.<coll>.deleteMany(<query>)   Delete many documents
  db.<coll>.aggregate(<pipeline>) Run aggregation
  db.<coll>.countDocuments()      Count documents
  db.<coll>.createIndex(<fields>) Create index
  db.<coll>.dropIndex(<name>)     Drop index
  db.<coll>.getIndexes()          List indexes
  db.<coll>.get(<id>)             Get document by ID
  db.<coll>.update(<id>, <json>)  Update document by ID
  db.<coll>.delete(<id>)          Delete document by ID
  help                            Show this help
  exit / quit                     Exit shell`)
}
