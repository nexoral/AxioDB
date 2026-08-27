package httpclient

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/cookiejar"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type HTTPClient struct {
	baseURL    string
	httpClient *http.Client
}

func New(host string, port int, timeout time.Duration) *HTTPClient {
	jar, _ := cookiejar.New(nil)
	return &HTTPClient{
		baseURL: fmt.Sprintf("http://%s:%d", host, port),
		httpClient: &http.Client{
			Timeout: timeout,
			Jar:     jar,
		},
	}
}

func (c *HTTPClient) Login(username, password string) error {
	body, _ := json.Marshal(map[string]string{
		"username": username,
		"password": password,
	})

	resp, err := c.httpClient.Post(c.baseURL+"/api/auth/login", "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("login request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		return nil
	}

	var errResp struct {
		Message string `json:"message"`
	}
	json.NewDecoder(resp.Body).Decode(&errResp)
	msg := errResp.Message
	if msg == "" {
		msg = resp.Status
	}
	return fmt.Errorf("login failed: %s", msg)
}

func (c *HTTPClient) Logout() error {
	resp, err := c.httpClient.Post(c.baseURL+"/api/auth/logout", "application/json", nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

func (c *HTTPClient) Export(dbName string) (string, int64, error) {
	url := fmt.Sprintf("%s/api/db/export-database/?dbName=%s", c.baseURL, dbName)
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return "", 0, fmt.Errorf("export request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResp struct {
			Message string `json:"message"`
		}
		json.NewDecoder(resp.Body).Decode(&errResp)
		msg := errResp.Message
		if msg == "" {
			msg = resp.Status
		}
		return "", 0, fmt.Errorf("export failed: %s", msg)
	}

	filename := dbName + ".tar.gz"
	if cd := resp.Header.Get("Content-Disposition"); cd != "" {
		if idx := strings.Index(cd, "filename="); idx >= 0 {
			name := cd[idx+9:]
			name = strings.Trim(name, "\"")
			if name != "" {
				filename = filepath.Base(name)
			}
		}
	}

	out, err := os.Create(filename)
	if err != nil {
		return "", 0, fmt.Errorf("create file: %w", err)
	}
	defer out.Close()

	written, err := io.Copy(out, resp.Body)
	if err != nil {
		os.Remove(filename)
		return "", 0, fmt.Errorf("write file: %w", err)
	}

	return filename, written, nil
}

func (c *HTTPClient) Import(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("open file: %w", err)
	}
	defer file.Close()

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		return "", fmt.Errorf("create form file: %w", err)
	}
	if _, err := io.Copy(part, file); err != nil {
		return "", fmt.Errorf("write form data: %w", err)
	}
	writer.Close()

	resp, err := c.httpClient.Post(
		c.baseURL+"/api/db/import-database/",
		writer.FormDataContentType(),
		&body,
	)
	if err != nil {
		return "", fmt.Errorf("import request failed: %w", err)
	}
	defer resp.Body.Close()

	var result struct {
		Message  string `json:"message"`
		Database string `json:"database"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("parse response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		msg := result.Message
		if msg == "" {
			msg = fmt.Sprintf("HTTP %d", resp.StatusCode)
		}
		return "", fmt.Errorf("import failed: %s", msg)
	}

	return result.Database, nil
}
