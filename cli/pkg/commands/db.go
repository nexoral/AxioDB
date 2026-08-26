package commands

import (
	"fmt"

	"github.com/nexoral/axiodb-cli/pkg/protocol"
)

func CreateDB(client *protocol.Client, dbName string) (*protocol.Response, error) {
	resp, err := client.Send("CREATE_DB", map[string]interface{}{
		"dbName": dbName,
	})
	if err != nil {
		return nil, fmt.Errorf("create database: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("create database failed: %s", resp.Error)
	}
	return resp, nil
}

func DeleteDB(client *protocol.Client, dbName string) (*protocol.Response, error) {
	resp, err := client.Send("DELETE_DB", map[string]interface{}{
		"dbName": dbName,
	})
	if err != nil {
		return nil, fmt.Errorf("delete database: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("delete database failed: %s", resp.Error)
	}
	return resp, nil
}

func DBExists(client *protocol.Client, dbName string) (bool, error) {
	resp, err := client.Send("DB_EXISTS", map[string]interface{}{
		"dbName": dbName,
	})
	if err != nil {
		return false, fmt.Errorf("check database exists: %w", err)
	}
	if resp.StatusCode >= 400 {
		return false, fmt.Errorf("check database exists failed: %s", resp.Error)
	}
	data, ok := resp.Data.(map[string]interface{})
	if !ok {
		return false, nil
	}
	exists, _ := data["exists"].(bool)
	return exists, nil
}

func GetInstanceInfo(client *protocol.Client) (*protocol.Response, error) {
	resp, err := client.Send("GET_INSTANCE_INFO", nil)
	if err != nil {
		return nil, fmt.Errorf("get instance info: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("get instance info failed: %s", resp.Error)
	}
	return resp, nil
}
