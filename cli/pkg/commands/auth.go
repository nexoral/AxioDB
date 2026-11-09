package commands

import (
	"fmt"

	"github.com/nexoral/axiodb-cli/pkg/protocol"
)

func ListUsers(client *protocol.Client) (*protocol.Response, error) {
	resp, err := client.Send("LIST_USERS", map[string]interface{}{})
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("list users failed: %s", resp.Error)
	}
	return resp, nil
}

func CreateUser(client *protocol.Client, username, password, role string) (*protocol.Response, error) {
	resp, err := client.Send("CREATE_USER", map[string]interface{}{
		"username": username,
		"password": password,
		"role":     role,
	})
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("create user failed: %s", resp.Error)
	}
	return resp, nil
}

func UpdateUserRole(client *protocol.Client, username, role string) (*protocol.Response, error) {
	resp, err := client.Send("UPDATE_USER_ROLE", map[string]interface{}{
		"username": username,
		"role":     role,
	})
	if err != nil {
		return nil, fmt.Errorf("update user role: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("update user role failed: %s", resp.Error)
	}
	return resp, nil
}

func ResetUserPassword(client *protocol.Client, username, newPassword string) (*protocol.Response, error) {
	resp, err := client.Send("RESET_USER_PASSWORD", map[string]interface{}{
		"username":    username,
		"newPassword": newPassword,
	})
	if err != nil {
		return nil, fmt.Errorf("reset user password: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("reset user password failed: %s", resp.Error)
	}
	return resp, nil
}

func DeleteUser(client *protocol.Client, username string) (*protocol.Response, error) {
	resp, err := client.Send("DELETE_USER", map[string]interface{}{
		"username": username,
	})
	if err != nil {
		return nil, fmt.Errorf("delete user: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("delete user failed: %s", resp.Error)
	}
	return resp, nil
}

func ChangeOwnPassword(client *protocol.Client, username, currentPassword, newPassword string) (*protocol.Response, error) {
	params := map[string]interface{}{
		"currentPassword": currentPassword,
		"newPassword":     newPassword,
	}
	if username != "" {
		params["username"] = username
	}
	resp, err := client.Send("CHANGE_PASSWORD", params)
	if err != nil {
		return nil, fmt.Errorf("change password: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("change password failed: %s", resp.Error)
	}
	return resp, nil
}

func ListRoles(client *protocol.Client) (*protocol.Response, error) {
	resp, err := client.Send("LIST_ROLES", map[string]interface{}{})
	if err != nil {
		return nil, fmt.Errorf("list roles: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("list roles failed: %s", resp.Error)
	}
	return resp, nil
}

func CreateRole(client *protocol.Client, roleName string, permissions []string) (*protocol.Response, error) {
	resp, err := client.Send("CREATE_ROLE", map[string]interface{}{
		"roleName":    roleName,
		"permissions": permissions,
	})
	if err != nil {
		return nil, fmt.Errorf("create role: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("create role failed: %s", resp.Error)
	}
	return resp, nil
}

func DeleteRole(client *protocol.Client, roleName string) (*protocol.Response, error) {
	resp, err := client.Send("DELETE_ROLE", map[string]interface{}{
		"roleName": roleName,
	})
	if err != nil {
		return nil, fmt.Errorf("delete role: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("delete role failed: %s", resp.Error)
	}
	return resp, nil
}

func ListPermissions(client *protocol.Client) (*protocol.Response, error) {
	resp, err := client.Send("LIST_PERMISSIONS", map[string]interface{}{})
	if err != nil {
		return nil, fmt.Errorf("list permissions: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("list permissions failed: %s", resp.Error)
	}
	return resp, nil
}

func GetSystemInfo(client *protocol.Client) (*protocol.Response, error) {
	resp, err := client.Send("GET_SYSTEM_INFO", map[string]interface{}{})
	if err != nil {
		return nil, fmt.Errorf("get system info: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("get system info failed: %s", resp.Error)
	}
	return resp, nil
}

func GetDashboardStats(client *protocol.Client) (*protocol.Response, error) {
	resp, err := client.Send("GET_DASHBOARD_STATS", map[string]interface{}{})
	if err != nil {
		return nil, fmt.Errorf("get dashboard stats: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("get dashboard stats failed: %s", resp.Error)
	}
	return resp, nil
}
