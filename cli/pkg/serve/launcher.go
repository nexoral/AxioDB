package serve

import "fmt"

func ServerScript(config ModeConfig) string {
	return fmt.Sprintf(`const { AxioDB } = require("axiodb");

new AxioDB({
  GUI: %t,
  HTTP: %t,
  TCP: %t,
  TCPAuth: %t,
  RootName: "AxioDB",
  CustomPath: __dirname,
});
`, config.GUI, config.HTTP, config.TCP, config.TCPAuth)
}
