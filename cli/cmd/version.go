package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var cliVersion = "21.7.8"

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the CLI version",
	Run: func(cmd *cobra.Command, args []string) {
		short, _ := cmd.Flags().GetBool("short")
		if short {
			fmt.Println(cliVersion)
		} else {
			fmt.Printf("axiodb-cli version %s\n", cliVersion)
		}
	},
}

func init() {
	versionCmd.Flags().Bool("short", false, "Print only the version number")
	rootCmd.AddCommand(versionCmd)
}
