package commands

import (
	"encoding/base64"
	"fmt"
	"io"
	"math"
	"os"
	"time"

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

func ExportDB(client *protocol.Client, dbName string, outPath string) (string, int64, error) {
	if outPath == "" {
		outPath = fmt.Sprintf("%s.tar.gz", dbName)
	}

	chunkSize := 2 * 1024 * 1024
	resp, err := client.Send("EXPORT_DATABASE", map[string]interface{}{
		"dbName":     dbName,
		"chunkIndex": 0,
		"chunkSize":  chunkSize,
	})
	if err != nil {
		return "", 0, fmt.Errorf("export database: %w", err)
	}
	if resp.StatusCode >= 400 {
		return "", 0, fmt.Errorf("export database failed: %s", resp.Error)
	}

	dataMap, ok := resp.Data.(map[string]interface{})
	if !ok {
		return "", 0, fmt.Errorf("invalid export response data")
	}

	totalChunksVal, _ := dataMap["totalChunks"].(float64)
	totalChunks := int(totalChunksVal)
	if totalChunks <= 0 {
		totalChunks = 1
	}

	b64Data, _ := dataMap["data"].(string)
	firstBytes, err := base64.StdEncoding.DecodeString(b64Data)
	if err != nil {
		return "", 0, fmt.Errorf("decode export chunk 0: %w", err)
	}

	outFile, err := os.Create(outPath)
	if err != nil {
		return "", 0, fmt.Errorf("create export file: %w", err)
	}
	defer outFile.Close()

	if _, err := outFile.Write(firstBytes); err != nil {
		return "", 0, fmt.Errorf("write export chunk 0: %w", err)
	}
	totalBytes := int64(len(firstBytes))

	for i := 1; i < totalChunks; i++ {
		chunkResp, err := client.Send("EXPORT_DATABASE", map[string]interface{}{
			"dbName":     dbName,
			"chunkIndex": i,
			"chunkSize":  chunkSize,
		})
		if err != nil {
			return "", 0, fmt.Errorf("export chunk %d: %w", i, err)
		}
		if chunkResp.StatusCode >= 400 {
			return "", 0, fmt.Errorf("export chunk %d failed: %s", i, chunkResp.Error)
		}

		cMap, ok := chunkResp.Data.(map[string]interface{})
		if !ok {
			return "", 0, fmt.Errorf("invalid export chunk %d response", i)
		}
		cB64, _ := cMap["data"].(string)
		cBytes, err := base64.StdEncoding.DecodeString(cB64)
		if err != nil {
			return "", 0, fmt.Errorf("decode export chunk %d: %w", i, err)
		}
		if _, err := outFile.Write(cBytes); err != nil {
			return "", 0, fmt.Errorf("write export chunk %d: %w", i, err)
		}
		totalBytes += int64(len(cBytes))
	}

	return outPath, totalBytes, nil
}

func ImportDB(client *protocol.Client, filePath string) (string, error) {
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		return "", fmt.Errorf("stat import file: %w", err)
	}

	chunkSize := 2 * 1024 * 1024
	totalChunks := int(math.Ceil(float64(fileInfo.Size()) / float64(chunkSize)))
	if totalChunks <= 0 {
		totalChunks = 1
	}

	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("open import file: %w", err)
	}
	defer file.Close()

	transferID := fmt.Sprintf("cli-import-%d", time.Now().UnixNano())
	buf := make([]byte, chunkSize)

	var lastResp *protocol.Response
	for i := 0; i < totalChunks; i++ {
		n, err := file.Read(buf)
		if err != nil && err != io.EOF {
			return "", fmt.Errorf("read import file chunk %d: %w", i, err)
		}

		b64Chunk := base64.StdEncoding.EncodeToString(buf[:n])
		resp, err := client.Send("IMPORT_DATABASE", map[string]interface{}{
			"chunkIndex":  i,
			"totalChunks": totalChunks,
			"data":        b64Chunk,
			"transferId":  transferID,
		})
		if err != nil {
			return "", fmt.Errorf("import chunk %d: %w", i, err)
		}
		if resp.StatusCode >= 400 {
			return "", fmt.Errorf("import chunk %d failed: %s", i, resp.Error)
		}
		lastResp = resp
	}

	dbName := ""
	if lastResp != nil && lastResp.Data != nil {
		if dMap, ok := lastResp.Data.(map[string]interface{}); ok {
			if name, ok := dMap["database"].(string); ok {
				dbName = name
			}
		}
	}

	return dbName, nil
}
