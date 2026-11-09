package cmd

import (
	"fmt"
	"strings"

	"github.com/nexoral/axiodb-cli/internal/config"
	"github.com/nexoral/axiodb-cli/pkg/commands"
	"github.com/nexoral/axiodb-cli/pkg/httpclient"
	"github.com/nexoral/axiodb-cli/pkg/protocol"
	"github.com/spf13/cobra"
)

var userCmd = &cobra.Command{Use: "user", Short: "Manage users (via TCP or HTTP)"}
var roleCmd = &cobra.Command{Use: "role", Short: "Manage roles (via TCP or HTTP)"}

func runAuthAction(
	cmd *cobra.Command,
	tcpFn func(*protocol.Client) (*protocol.Response, error),
	httpFn func(*httpclient.HTTPClient) (interface{}, error),
) error {
	cfg, err := config.FromFlags(cmd)
	if err != nil {
		return err
	}

	useHTTP, _ := cmd.Flags().GetBool("http")
	if !useHTTP {
		tcpClient, tcpErr := cfg.ConnectAndAuth()
		if tcpErr == nil {
			defer tcpClient.Disconnect()
			resp, err := tcpFn(tcpClient)
			if err != nil {
				return err
			}
			return printOutput(cfg.Output, resp.Data)
		}
	}

	// Fallback to HTTP
	if cfg.Username == "" || cfg.Password == "" {
		return fmt.Errorf("--username and --password are required for administration")
	}
	httpClient := cfg.NewHTTPClient()
	if err := httpClient.Login(cfg.Username, cfg.Password); err != nil {
		return err
	}
	result, err := httpFn(httpClient)
	if err != nil {
		return err
	}
	return printOutput(cfg.Output, result)
}

var userListCmd = &cobra.Command{
	Use:   "list",
	Short: "List users",
	RunE: func(cmd *cobra.Command, args []string) error {
		return runAuthAction(cmd,
			func(c *protocol.Client) (*protocol.Response, error) { return commands.ListUsers(c) },
			func(c *httpclient.HTTPClient) (interface{}, error) { return c.ListUsers() },
		)
	},
}

var userCreateCmd = &cobra.Command{
	Use:   "create <username> <password> <role>",
	Short: "Create a user",
	Args:  cobra.ExactArgs(3),
	RunE: func(cmd *cobra.Command, args []string) error {
		return runAuthAction(cmd,
			func(c *protocol.Client) (*protocol.Response, error) {
				return commands.CreateUser(c, args[0], args[1], args[2])
			},
			func(c *httpclient.HTTPClient) (interface{}, error) {
				return c.CreateUser(args[0], args[1], args[2])
			},
		)
	},
}

var userRoleCmd = &cobra.Command{
	Use:   "set-role <username> <role>",
	Short: "Change a user's role",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		return runAuthAction(cmd,
			func(c *protocol.Client) (*protocol.Response, error) {
				return commands.UpdateUserRole(c, args[0], args[1])
			},
			func(c *httpclient.HTTPClient) (interface{}, error) {
				return c.UpdateUserRole(args[0], args[1])
			},
		)
	},
}

var userResetCmd = &cobra.Command{
	Use:   "reset-password <username> <password>",
	Short: "Reset a user's password",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		return runAuthAction(cmd,
			func(c *protocol.Client) (*protocol.Response, error) {
				return commands.ResetUserPassword(c, args[0], args[1])
			},
			func(c *httpclient.HTTPClient) (interface{}, error) {
				return c.ResetUserPassword(args[0], args[1])
			},
		)
	},
}

var userDeleteCmd = &cobra.Command{
	Use:   "delete <username>",
	Short: "Delete a user",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		return runAuthAction(cmd,
			func(c *protocol.Client) (*protocol.Response, error) {
				return commands.DeleteUser(c, args[0])
			},
			func(c *httpclient.HTTPClient) (interface{}, error) {
				return c.DeleteUser(args[0])
			},
		)
	},
}

var userChangePasswordCmd = &cobra.Command{
	Use:   "change-password <currentPassword> <newPassword>",
	Short: "Change own password (self-service)",
	Long:  "Change your own password via TCP or HTTP API.",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, _ := config.FromFlags(cmd)
		username := ""
		if cfg != nil {
			username = cfg.Username
		}
		return runAuthAction(cmd,
			func(c *protocol.Client) (*protocol.Response, error) {
				return commands.ChangeOwnPassword(c, username, args[0], args[1])
			},
			func(c *httpclient.HTTPClient) (interface{}, error) {
				return c.ChangeOwnPassword(args[0], args[1])
			},
		)
	},
}

var roleListCmd = &cobra.Command{
	Use:   "list",
	Short: "List roles",
	RunE: func(cmd *cobra.Command, args []string) error {
		return runAuthAction(cmd,
			func(c *protocol.Client) (*protocol.Response, error) { return commands.ListRoles(c) },
			func(c *httpclient.HTTPClient) (interface{}, error) { return c.ListRoles() },
		)
	},
}

var roleCreateCmd = &cobra.Command{
	Use:   "create <name> <permission,...>",
	Short: "Create a role",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		permissions := strings.Split(args[1], ",")
		return runAuthAction(cmd,
			func(c *protocol.Client) (*protocol.Response, error) {
				return commands.CreateRole(c, args[0], permissions)
			},
			func(c *httpclient.HTTPClient) (interface{}, error) {
				return c.CreateRole(args[0], permissions)
			},
		)
	},
}

var roleDeleteCmd = &cobra.Command{
	Use:   "delete <name>",
	Short: "Delete a role",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		return runAuthAction(cmd,
			func(c *protocol.Client) (*protocol.Response, error) {
				return commands.DeleteRole(c, args[0])
			},
			func(c *httpclient.HTTPClient) (interface{}, error) {
				return c.DeleteRole(args[0])
			},
		)
	},
}

var rolePermissionsCmd = &cobra.Command{
	Use:   "permissions",
	Short: "List available permissions",
	RunE: func(cmd *cobra.Command, args []string) error {
		return runAuthAction(cmd,
			func(c *protocol.Client) (*protocol.Response, error) { return commands.ListPermissions(c) },
			func(c *httpclient.HTTPClient) (interface{}, error) { return c.ListPermissions() },
		)
	},
}

func init() {
	userCmd.PersistentFlags().Bool("http", false, "Use HTTP API (port 27018) instead of TCP")
	roleCmd.PersistentFlags().Bool("http", false, "Use HTTP API (port 27018) instead of TCP")

	userCmd.AddCommand(userListCmd, userCreateCmd, userRoleCmd, userResetCmd, userDeleteCmd, userChangePasswordCmd)
	roleCmd.AddCommand(roleListCmd, roleCreateCmd, roleDeleteCmd, rolePermissionsCmd)
	rootCmd.AddCommand(userCmd, roleCmd)
}
