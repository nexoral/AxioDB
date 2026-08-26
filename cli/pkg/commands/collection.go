package commands

import (
	"fmt"

	"github.com/nexoral/axiodb-cli/pkg/protocol"
)

func CreateCollection(client *protocol.Client, dbName, collectionName string) (*protocol.Response, error) {
	resp, err := client.Send("CREATE_COLLECTION", map[string]interface{}{
		"dbName":         dbName,
		"collectionName": collectionName,
	})
	if err != nil {
		return nil, fmt.Errorf("create collection: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("create collection failed: %s", resp.Error)
	}
	return resp, nil
}

func DeleteCollection(client *protocol.Client, dbName, collectionName string) (*protocol.Response, error) {
	resp, err := client.Send("DELETE_COLLECTION", map[string]interface{}{
		"dbName":         dbName,
		"collectionName": collectionName,
	})
	if err != nil {
		return nil, fmt.Errorf("delete collection: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("delete collection failed: %s", resp.Error)
	}
	return resp, nil
}

func CollectionExists(client *protocol.Client, dbName, collectionName string) (bool, error) {
	resp, err := client.Send("COLLECTION_EXISTS", map[string]interface{}{
		"dbName":         dbName,
		"collectionName": collectionName,
	})
	if err != nil {
		return false, fmt.Errorf("check collection exists: %w", err)
	}
	if resp.StatusCode >= 400 {
		return false, fmt.Errorf("check collection exists failed: %s", resp.Error)
	}
	data, ok := resp.Data.(map[string]interface{})
	if !ok {
		return false, nil
	}
	exists, _ := data["exists"].(bool)
	return exists, nil
}

func GetCollectionInfo(client *protocol.Client, dbName string) (*protocol.Response, error) {
	resp, err := client.Send("GET_COLLECTION_INFO", map[string]interface{}{
		"dbName":         dbName,
		"collectionName": "_",
	})
	if err != nil {
		return nil, fmt.Errorf("get collection info: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("get collection info failed: %s", resp.Error)
	}
	return resp, nil
}
