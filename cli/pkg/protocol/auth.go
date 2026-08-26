package protocol

import "fmt"

type AuthResult struct {
	Username          string `json:"username"`
	Role              string `json:"role"`
	MustChangePassword bool   `json:"mustChangePassword"`
}

func Authenticate(client *Client, username, password string) (*AuthResult, error) {
	resp, err := client.Send("AUTHENTICATE", map[string]interface{}{
		"username": username,
		"password": password,
	})
	if err != nil {
		return nil, fmt.Errorf("authenticate: %w", err)
	}

	switch resp.StatusCode {
	case 200:
		data, ok := resp.Data.(map[string]interface{})
		if !ok {
			return nil, fmt.Errorf("unexpected auth response format")
		}
		result := &AuthResult{}
		if v, ok := data["username"].(string); ok {
			result.Username = v
		}
		if v, ok := data["role"].(string); ok {
			result.Role = v
		}
		if v, ok := data["mustChangePassword"].(bool); ok {
			result.MustChangePassword = v
		}
		return result, nil
	case 401:
		return nil, fmt.Errorf("authentication failed: invalid credentials")
	case 403:
		return nil, fmt.Errorf("authentication failed: password change required")
	case 429:
		return nil, fmt.Errorf("authentication failed: too many attempts, try again later")
	default:
		return nil, fmt.Errorf("authentication failed (status %d): %s", resp.StatusCode, resp.Error)
	}
}
