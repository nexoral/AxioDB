package commands

import (
	"fmt"

	"github.com/nexoral/axiodb-cli/pkg/protocol"
)

func Health(client *protocol.Client) (*protocol.Response, error) {
	resp, err := client.Send("HEALTH", nil)
	if err != nil {
		return nil, fmt.Errorf("get health: %w", err)
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("get health failed: %s", resp.Error)
	}
	return resp, nil
}
