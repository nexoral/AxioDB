package commands

import (
	"fmt"

	"github.com/nexoral/axiodb-cli/pkg/protocol"
)

type TransactionStep struct {
	Operation       string      `json:"operation"`
	Data            interface{} `json:"data,omitempty"`
	Documents       interface{} `json:"documents,omitempty"`
	Query           interface{} `json:"query,omitempty"`
	UpdateData      interface{} `json:"updateData,omitempty"`
	ID              string      `json:"id,omitempty"`
	IDs             []string    `json:"ids,omitempty"`
	SavepointName   string      `json:"savepointName,omitempty"`
	UpdateOne       bool        `json:"updateOne,omitempty"`
	DeleteOne       bool        `json:"deleteOne,omitempty"`
}

func BeginTransaction(client *protocol.Client, dbName, collectionName string) (*protocol.Response, error) {
	return client.Send("BEGIN_TRANSACTION", map[string]interface{}{"dbName": dbName, "collectionName": collectionName})
}

func CommitTransaction(client *protocol.Client, transactionID string) (*protocol.Response, error) {
	return client.Send("COMMIT_TRANSACTION", map[string]interface{}{"transactionId": transactionID})
}

func RollbackTransaction(client *protocol.Client, transactionID string) (*protocol.Response, error) {
	return client.Send("ROLLBACK_TRANSACTION", map[string]interface{}{"transactionId": transactionID})
}

func Savepoint(client *protocol.Client, transactionID, savepointName string) (*protocol.Response, error) {
	return client.Send("SAVEPOINT", map[string]interface{}{"transactionId": transactionID, "savepointName": savepointName})
}

func RollbackToSavepoint(client *protocol.Client, transactionID, savepointName string) (*protocol.Response, error) {
	return client.Send("ROLLBACK_TO_SAVEPOINT", map[string]interface{}{"transactionId": transactionID, "savepointName": savepointName})
}

func ReleaseSavepoint(client *protocol.Client, transactionID, savepointName string) (*protocol.Response, error) {
	return client.Send("RELEASE_SAVEPOINT", map[string]interface{}{"transactionId": transactionID, "savepointName": savepointName})
}

func RunTransaction(client *protocol.Client, dbName, collectionName string, steps []TransactionStep) (*protocol.Response, error) {
	begin, err := BeginTransaction(client, dbName, collectionName)
	if err != nil || begin.StatusCode >= 400 {
		if err != nil { return nil, fmt.Errorf("begin transaction: %w", err) }
		return nil, fmt.Errorf("begin transaction failed: %s", begin.Error)
	}
	transactionID, ok := begin.Data.(map[string]interface{})["transactionId"].(string)
	if !ok || transactionID == "" {
		return nil, fmt.Errorf("begin transaction returned no transaction ID")
	}
	base := map[string]interface{}{"dbName": dbName, "collectionName": collectionName, "transactionId": transactionID}
	for _, step := range steps {
		params := map[string]interface{}{}
		for key, value := range base { params[key] = value }
		switch step.Operation {
		case "insert": params["data"] = step.Data
		case "insert-many": params["documents"] = step.Documents
		case "query": params["query"] = step.Query
		case "find-by-ids": params["ids"] = step.IDs
		case "update-by-id": params["id"], params["updateData"] = step.ID, step.UpdateData
		case "update-by-query": params["query"], params["updateData"], params["updateOne"] = step.Query, step.UpdateData, step.UpdateOne
		case "delete-by-id": params["id"] = step.ID
		case "delete-by-query": params["query"], params["deleteOne"] = step.Query, step.DeleteOne
		case "savepoint", "rollback-to-savepoint", "release-savepoint": params["savepointName"] = step.SavepointName
		default: return nil, fmt.Errorf("unsupported transaction operation: %s", step.Operation)
		}
		command := map[string]string{"insert":"INSERT_DOCUMENT", "insert-many":"INSERT_MANY_DOCUMENTS", "query":"QUERY_DOCUMENTS", "find-by-ids":"FIND_BY_IDS", "update-by-id":"UPDATE_DOCUMENT_BY_ID", "update-by-query":"UPDATE_DOCUMENTS_BY_QUERY", "delete-by-id":"DELETE_DOCUMENT_BY_ID", "delete-by-query":"DELETE_DOCUMENTS_BY_QUERY", "savepoint":"SAVEPOINT", "rollback-to-savepoint":"ROLLBACK_TO_SAVEPOINT", "release-savepoint":"RELEASE_SAVEPOINT"}[step.Operation]
		response, sendErr := client.Send(command, params)
		if sendErr != nil || response.StatusCode >= 400 {
			_, _ = RollbackTransaction(client, transactionID)
			if sendErr != nil { return nil, fmt.Errorf("transaction %s: %w", step.Operation, sendErr) }
			return nil, fmt.Errorf("transaction %s failed: %s", step.Operation, response.Error)
		}
	}
	commit, err := CommitTransaction(client, transactionID)
	if err != nil { return nil, fmt.Errorf("commit transaction: %w", err) }
	if commit.StatusCode >= 400 { return nil, fmt.Errorf("commit transaction failed: %s", commit.Error) }
	return commit, nil
}
