package commands

import (
	"fmt"

	"github.com/nexoral/axiodb-cli/pkg/protocol"
)

func CreateIndex(client *protocol.Client, dbName, collectionName string, fieldNames []string) (*protocol.Response, error) {
	resp, err := client.Send("CREATE_INDEX", map[string]interface{}{
		"dbName":         dbName,
		"collectionName": collectionName,
		"fieldNames":     fieldNames,
	})
	if err != nil {
		return nil, fmt.Errorf("create index: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("create index failed: %s", resp.Error)
	}
	return resp, nil
}

func DropIndex(client *protocol.Client, dbName, collectionName, indexName string) (*protocol.Response, error) {
	resp, err := client.Send("DROP_INDEX", map[string]interface{}{
		"dbName":         dbName,
		"collectionName": collectionName,
		"indexName":      indexName,
	})
	if err != nil {
		return nil, fmt.Errorf("drop index: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("drop index failed: %s", resp.Error)
	}
	return resp, nil
}

func ListIndexes(client *protocol.Client, dbName, collectionName string) (*protocol.Response, error) {
	resp, err := client.Send("LIST_INDEXES", map[string]interface{}{
		"dbName":         dbName,
		"collectionName": collectionName,
	})
	if err != nil {
		return nil, fmt.Errorf("list indexes: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("list indexes failed: %s", resp.Error)
	}
	return resp, nil
}
