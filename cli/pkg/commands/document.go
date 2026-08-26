package commands

import (
	"fmt"

	"github.com/nexoral/axiodb-cli/pkg/protocol"
)

func InsertDocument(client *protocol.Client, dbName, collectionName string, data interface{}) (*protocol.Response, error) {
	resp, err := client.Send("INSERT_DOCUMENT", map[string]interface{}{
		"dbName":         dbName,
		"collectionName": collectionName,
		"data":           data,
	})
	if err != nil {
		return nil, fmt.Errorf("insert document: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("insert document failed: %s", resp.Error)
	}
	return resp, nil
}

func InsertManyDocuments(client *protocol.Client, dbName, collectionName string, documents interface{}) (*protocol.Response, error) {
	resp, err := client.Send("INSERT_MANY_DOCUMENTS", map[string]interface{}{
		"dbName":         dbName,
		"collectionName": collectionName,
		"documents":      documents,
	})
	if err != nil {
		return nil, fmt.Errorf("insert many documents: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("insert many documents failed: %s", resp.Error)
	}
	return resp, nil
}

type QueryOptions struct {
	Query    interface{}
	Limit    int
	Skip     int
	Sort     interface{}
	FindOne  bool
}

func QueryDocuments(client *protocol.Client, dbName, collectionName string, opts QueryOptions) (*protocol.Response, error) {
	params := map[string]interface{}{
		"dbName":         dbName,
		"collectionName": collectionName,
	}
	if opts.Query != nil {
		params["query"] = opts.Query
	}
	if opts.Limit > 0 {
		params["limit"] = opts.Limit
	}
	if opts.Skip > 0 {
		params["skip"] = opts.Skip
	}
	if opts.Sort != nil {
		params["sort"] = opts.Sort
	}
	if opts.FindOne {
		params["findOne"] = true
	}

	resp, err := client.Send("QUERY_DOCUMENTS", params)
	if err != nil {
		return nil, fmt.Errorf("query documents: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("query documents failed: %s", resp.Error)
	}
	return resp, nil
}

func QueryByID(client *protocol.Client, dbName, collectionName, id string) (*protocol.Response, error) {
	resp, err := client.Send("QUERY_BY_ID", map[string]interface{}{
		"dbName":         dbName,
		"collectionName": collectionName,
		"id":             id,
	})
	if err != nil {
		return nil, fmt.Errorf("query by id: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("query by id failed: %s", resp.Error)
	}
	return resp, nil
}

func UpdateDocumentByID(client *protocol.Client, dbName, collectionName, id string, updateData interface{}) (*protocol.Response, error) {
	resp, err := client.Send("UPDATE_DOCUMENT_BY_ID", map[string]interface{}{
		"dbName":         dbName,
		"collectionName": collectionName,
		"id":             id,
		"updateData":     updateData,
	})
	if err != nil {
		return nil, fmt.Errorf("update document: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("update document failed: %s", resp.Error)
	}
	return resp, nil
}

func UpdateDocumentsByQuery(client *protocol.Client, dbName, collectionName string, query, updateData interface{}, updateOne bool) (*protocol.Response, error) {
	resp, err := client.Send("UPDATE_DOCUMENTS_BY_QUERY", map[string]interface{}{
		"dbName":         dbName,
		"collectionName": collectionName,
		"query":          query,
		"updateData":     updateData,
		"updateOne":      updateOne,
	})
	if err != nil {
		return nil, fmt.Errorf("update documents by query: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("update documents by query failed: %s", resp.Error)
	}
	return resp, nil
}

func DeleteDocumentByID(client *protocol.Client, dbName, collectionName, id string) (*protocol.Response, error) {
	resp, err := client.Send("DELETE_DOCUMENT_BY_ID", map[string]interface{}{
		"dbName":         dbName,
		"collectionName": collectionName,
		"id":             id,
	})
	if err != nil {
		return nil, fmt.Errorf("delete document: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("delete document failed: %s", resp.Error)
	}
	return resp, nil
}

func DeleteDocumentsByQuery(client *protocol.Client, dbName, collectionName string, query interface{}, deleteOne bool) (*protocol.Response, error) {
	resp, err := client.Send("DELETE_DOCUMENTS_BY_QUERY", map[string]interface{}{
		"dbName":         dbName,
		"collectionName": collectionName,
		"query":          query,
		"deleteOne":      deleteOne,
	})
	if err != nil {
		return nil, fmt.Errorf("delete documents by query: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("delete documents by query failed: %s", resp.Error)
	}
	return resp, nil
}

func Aggregate(client *protocol.Client, dbName, collectionName string, pipeline interface{}) (*protocol.Response, error) {
	resp, err := client.Send("AGGREGATE", map[string]interface{}{
		"dbName":         dbName,
		"collectionName": collectionName,
		"pipeline":       pipeline,
	})
	if err != nil {
		return nil, fmt.Errorf("aggregate: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("aggregate failed: %s", resp.Error)
	}
	return resp, nil
}

func TotalDocuments(client *protocol.Client, dbName, collectionName string) (*protocol.Response, error) {
	resp, err := client.Send("TOTAL_DOCUMENTS", map[string]interface{}{
		"dbName":         dbName,
		"collectionName": collectionName,
	})
	if err != nil {
		return nil, fmt.Errorf("total documents: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("total documents failed: %s", resp.Error)
	}
	return resp, nil
}
