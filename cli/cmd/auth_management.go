package cmd

import (
	"fmt"
	"strings"

	"github.com/nexoral/axiodb-cli/internal/config"
	"github.com/nexoral/axiodb-cli/pkg/httpclient"
	"github.com/spf13/cobra"
)

var userCmd = &cobra.Command{Use: "user", Short: "Manage HTTP API users"}
var roleCmd = &cobra.Command{Use: "role", Short: "Manage HTTP API roles"}

func httpClientFor(cmd *cobra.Command) (*config.Config, *httpclient.HTTPClient, error) {
	cfg, err := config.FromFlags(cmd)
	if err != nil { return nil, nil, err }
	if cfg.Username == "" || cfg.Password == "" { return nil, nil, fmt.Errorf("--username and --password are required for HTTP administration") }
	client := cfg.NewHTTPClient()
	if err := client.Login(cfg.Username, cfg.Password); err != nil { return nil, nil, err }
	return cfg, client, nil
}

var userListCmd = &cobra.Command{Use: "list", Short: "List users", RunE: func(cmd *cobra.Command, args []string) error {
	cfg, client, err := httpClientFor(cmd); if err != nil { return err }; result, err := client.ListUsers(); if err != nil { return err }; return printOutput(cfg.Output, result)
}}

var userCreateCmd = &cobra.Command{Use: "create <username> <password> <role>", Short: "Create a user", Args: cobra.ExactArgs(3), RunE: func(cmd *cobra.Command, args []string) error {
	cfg, client, err := httpClientFor(cmd); if err != nil { return err }; result, err := client.CreateUser(args[0], args[1], args[2]); if err != nil { return err }; return printOutput(cfg.Output, result)
}}

var userRoleCmd = &cobra.Command{Use: "set-role <username> <role>", Short: "Change a user's role", Args: cobra.ExactArgs(2), RunE: func(cmd *cobra.Command, args []string) error {
	cfg, client, err := httpClientFor(cmd); if err != nil { return err }; result, err := client.UpdateUserRole(args[0], args[1]); if err != nil { return err }; return printOutput(cfg.Output, result)
}}

var userResetCmd = &cobra.Command{Use: "reset-password <username> <password>", Short: "Reset a user's password", Args: cobra.ExactArgs(2), RunE: func(cmd *cobra.Command, args []string) error {
	cfg, client, err := httpClientFor(cmd); if err != nil { return err }; result, err := client.ResetUserPassword(args[0], args[1]); if err != nil { return err }; return printOutput(cfg.Output, result)
}}

var userDeleteCmd = &cobra.Command{Use: "delete <username>", Short: "Delete a user", Args: cobra.ExactArgs(1), RunE: func(cmd *cobra.Command, args []string) error {
	cfg, client, err := httpClientFor(cmd); if err != nil { return err }; result, err := client.DeleteUser(args[0]); if err != nil { return err }; return printOutput(cfg.Output, result)
}}

var userChangePasswordCmd = &cobra.Command{Use: "change-password <currentPassword> <newPassword>", Short: "Change own password (self-service)", Long: "Change your own password. Requires HTTP API (port 27018) to be enabled on the server (GUI/HTTP). Uses PATCH /api/auth/change-password.", Args: cobra.ExactArgs(2), RunE: func(cmd *cobra.Command, args []string) error {
	cfg, client, err := httpClientFor(cmd); if err != nil { return err }; result, err := client.ChangeOwnPassword(args[0], args[1]); if err != nil { return err }; return printOutput(cfg.Output, result)
}}

var roleListCmd = &cobra.Command{Use: "list", Short: "List roles", RunE: func(cmd *cobra.Command, args []string) error {
	cfg, client, err := httpClientFor(cmd); if err != nil { return err }; result, err := client.ListRoles(); if err != nil { return err }; return printOutput(cfg.Output, result)
}}

var roleCreateCmd = &cobra.Command{Use: "create <name> <permission,...>", Short: "Create a role", Args: cobra.ExactArgs(2), RunE: func(cmd *cobra.Command, args []string) error {
	cfg, client, err := httpClientFor(cmd); if err != nil { return err }; permissions := strings.Split(args[1], ","); result, err := client.CreateRole(args[0], permissions); if err != nil { return err }; return printOutput(cfg.Output, result)
}}

var roleDeleteCmd = &cobra.Command{Use: "delete <name>", Short: "Delete a role", Args: cobra.ExactArgs(1), RunE: func(cmd *cobra.Command, args []string) error {
	cfg, client, err := httpClientFor(cmd); if err != nil { return err }; result, err := client.DeleteRole(args[0]); if err != nil { return err }; return printOutput(cfg.Output, result)
}}

var rolePermissionsCmd = &cobra.Command{Use: "permissions", Short: "List available permissions", RunE: func(cmd *cobra.Command, args []string) error {
	cfg, client, err := httpClientFor(cmd); if err != nil { return err }; result, err := client.ListPermissions(); if err != nil { return err }; return printOutput(cfg.Output, result)
}}

func init() {
	userCmd.AddCommand(userListCmd, userCreateCmd, userRoleCmd, userResetCmd, userDeleteCmd, userChangePasswordCmd)
	roleCmd.AddCommand(roleListCmd, roleCreateCmd, roleDeleteCmd, rolePermissionsCmd)
	rootCmd.AddCommand(userCmd, roleCmd)
}
