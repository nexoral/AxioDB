package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the CLI version",
	Run: func(cmd *cobra.Command, args []string) {
		short, _ := cmd.Flags().GetBool("short")

		version := readVersion()

		if short {
			fmt.Println(version)
		} else {
			fmt.Printf("axiodb-cli version %s\n", version)
		}
	},
}

func init() {
	versionCmd.Flags().Bool("short", false, "Print only the version number")
	rootCmd.AddCommand(versionCmd)
}

func readVersion() string {
	data, err := os.ReadFile("VERSION")
	if err != nil {
		data, err = os.ReadFile("../VERSION")
		if err != nil {
			return "unknown"
		}
	}
	return strings.TrimSpace(string(data))
}
