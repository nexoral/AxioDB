package httpclient

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type HTTPClient struct {
	baseURL    string
	httpClient *http.Client
}

func (c *HTTPClient) doJSON(method, path string, payload interface{}) (map[string]interface{}, error) {
	var body io.Reader
	if payload != nil {
		encoded, err := json.Marshal(payload)
		if err != nil {
			return nil, fmt.Errorf("encode request: %w", err)
		}
		body = bytes.NewReader(encoded)
	}
	req, err := http.NewRequest(method, c.baseURL+path, body)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()
	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("parse response: %w", err)
	}
	if resp.StatusCode >= 400 {
		message, _ := result["message"].(string)
		if message == "" {
			message = resp.Status
		}
		return nil, fmt.Errorf("request failed: %s", message)
	}
	return result, nil
}

func (c *HTTPClient) ListUsers() (map[string]interface{}, error) {
	return c.doJSON(http.MethodGet, "/api/auth/users/", nil)
}

func (c *HTTPClient) CreateUser(username, password, role string) (map[string]interface{}, error) {
	return c.doJSON(http.MethodPost, "/api/auth/users/", map[string]string{"username": username, "password": password, "role": role})
}

func (c *HTTPClient) UpdateUserRole(username, role string) (map[string]interface{}, error) {
	return c.doJSON(http.MethodPatch, "/api/auth/users/"+url.PathEscape(username)+"/role", map[string]string{"role": role})
}

func (c *HTTPClient) ResetUserPassword(username, password string) (map[string]interface{}, error) {
	return c.doJSON(http.MethodPatch, "/api/auth/users/"+url.PathEscape(username)+"/reset-password", map[string]string{"newPassword": password})
}

func (c *HTTPClient) DeleteUser(username string) (map[string]interface{}, error) {
	return c.doJSON(http.MethodDelete, "/api/auth/users/"+url.PathEscape(username), nil)
}

func (c *HTTPClient) ListRoles() (map[string]interface{}, error) {
	return c.doJSON(http.MethodGet, "/api/auth/roles/", nil)
}

func (c *HTTPClient) CreateRole(roleName string, permissions []string) (map[string]interface{}, error) {
	return c.doJSON(http.MethodPost, "/api/auth/roles/", map[string]interface{}{"roleName": roleName, "permissions": permissions})
}

func (c *HTTPClient) DeleteRole(roleName string) (map[string]interface{}, error) {
	return c.doJSON(http.MethodDelete, "/api/auth/roles/"+url.PathEscape(roleName), nil)
}

func (c *HTTPClient) ListPermissions() (map[string]interface{}, error) {
	return c.doJSON(http.MethodGet, "/api/auth/roles/permissions", nil)
}

func (c *HTTPClient) ChangeOwnPassword(currentPassword, newPassword string) (map[string]interface{}, error) {
	return c.doJSON(http.MethodPatch, "/api/auth/change-password", map[string]string{"currentPassword": currentPassword, "newPassword": newPassword})
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
