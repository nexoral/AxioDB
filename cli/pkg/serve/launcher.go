package serve

import "fmt"

// ServerScript generates the temporary server.js that boots AxioDB with the given
// mode. The admin password is read from the environment so it never lands on disk.
func ServerScript(config ModeConfig) string {
	return fmt.Sprintf(`const { AxioDB } = require("axiodb");

new AxioDB({
  HTTP: %t,
  TCP: %t,
  TCPAuth: %t,
  MCP: %t,
  AdminPassword: process.env.AXIODB_ADMIN_PASSWORD || undefined,
  RootName: "AxioDB",
  CustomPath: __dirname,
});
`, config.HTTP, config.TCP, config.TCPAuth, config.MCP)
}
