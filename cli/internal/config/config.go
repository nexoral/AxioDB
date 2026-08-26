package config

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/nexoral/axiodb-cli/pkg/protocol"
	"github.com/spf13/cobra"
)

type Config struct {
	Host          string
	Port          int
	ConnString    string
	Username      string
	Password      string
	TLSEnabled    bool
	TLSCertPath   string
	TLSSkipVerify bool
	Output        string
	Timeout       int
	DB            string
	Collection    string
}

func FromFlags(cmd *cobra.Command) (*Config, error) {
	cfg := &Config{}

	cfg.Host, _ = cmd.Flags().GetString("host")
	cfg.Port, _ = cmd.Flags().GetInt("port")
	cfg.ConnString, _ = cmd.Flags().GetString("connection-string")
	cfg.Username, _ = cmd.Flags().GetString("username")
	cfg.Password, _ = cmd.Flags().GetString("password")
	cfg.TLSEnabled, _ = cmd.Flags().GetBool("tls")
	cfg.TLSCertPath, _ = cmd.Flags().GetString("tls-cert")
	cfg.TLSSkipVerify, _ = cmd.Flags().GetBool("tls-skip-verify")
	cfg.Output, _ = cmd.Flags().GetString("output")
	cfg.Timeout, _ = cmd.Flags().GetInt("timeout")
	cfg.DB, _ = cmd.Flags().GetString("db")
	cfg.Collection, _ = cmd.Flags().GetString("collection")

	if cfg.ConnString != "" {
		host, port, err := parseConnectionString(cfg.ConnString)
		if err != nil {
			return nil, err
		}
		cfg.Host = host
		cfg.Port = port
	}

	return cfg, nil
}

func parseConnectionString(connStr string) (string, int, error) {
	if !strings.HasPrefix(connStr, "axiodb://") {
		return "", 0, fmt.Errorf("invalid connection string format (expected axiodb://host:port): %s", connStr)
	}

	hostPort := strings.TrimPrefix(connStr, "axiodb://")
	parts := strings.SplitN(hostPort, ":", 2)
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "", 0, fmt.Errorf("invalid connection string format (expected axiodb://host:port): %s", connStr)
	}

	port, err := strconv.Atoi(parts[1])
	if err != nil || port <= 0 || port > 65535 {
		return "", 0, fmt.Errorf("invalid port number in connection string: %s", parts[1])
	}

	return parts[0], port, nil
}

func (c *Config) NewClient() *protocol.Client {
	return protocol.NewClient(protocol.ClientConfig{
		Host:          c.Host,
		Port:          c.Port,
		TLSEnabled:    c.TLSEnabled,
		TLSCertPath:   c.TLSCertPath,
		TLSSkipVerify: c.TLSSkipVerify,
		Timeout:       time.Duration(c.Timeout) * time.Second,
	})
}

func (c *Config) ConnectAndAuth() (*protocol.Client, error) {
	client := c.NewClient()

	if err := client.Connect(); err != nil {
		return nil, fmt.Errorf("connect: %w", err)
	}

	if c.Username != "" && c.Password != "" {
		if _, err := protocol.Authenticate(client, c.Username, c.Password); err != nil {
			_ = client.Disconnect()
			return nil, fmt.Errorf("auth: %w", err)
		}
	}

	return client, nil
}

func GetDBContext(cmd *cobra.Command) string {
	db, _ := cmd.Flags().GetString("db")
	return db
}

func GetCollectionContext(cmd *cobra.Command) string {
	coll, _ := cmd.Flags().GetString("collection")
	return coll
}
