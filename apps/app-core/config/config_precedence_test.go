package config

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/spf13/viper"
	"github.com/stretchr/testify/require"
	"gopkg.in/yaml.v3"
)

func TestLoadConfigPrefersKJSCAndExpandsDefaults(t *testing.T) {
	dir := t.TempDir()
	t.Chdir(dir)
	t.Setenv("APP_PORT", "")
	viper.Reset()
	resolvedConfigDir = ""
	t.Cleanup(func() {
		viper.Reset()
		resolvedConfigDir = ""
	})

	require.NoError(t, os.WriteFile(
		filepath.Join(dir, "config.yaml"),
		[]byte("server:\n  port: 1111\n  host: \"0.0.0.0\"\nknowledge_base:\n  chunk_size: 512\n  chunk_overlap: 50\n"),
		0o600,
	))
	require.NoError(t, os.WriteFile(
		filepath.Join(dir, "config_kjsc.yaml"),
		[]byte("server:\n  port: ${APP_PORT:-2222}\n  host: \"0.0.0.0\"\nknowledge_base:\n  chunk_size: 512\n  chunk_overlap: 50\n"),
		0o600,
	))

	cfg, err := LoadConfig()
	require.NoError(t, err)
	require.NotNil(t, cfg.Server)
	require.Equal(t, 2222, cfg.Server.Port)
	require.Equal(t, filepath.Join(dir, "config_kjsc.yaml"), viper.ConfigFileUsed())
}

func TestKJSCBuiltinAgentsIncludeSkillInstallerPrompt(t *testing.T) {
	configDir := filepath.Join("..", "..", "..", "config")
	data, err := os.ReadFile(filepath.Join(configDir, "builtin_agents_kjsc.yaml"))
	require.NoError(t, err)

	var builtinAgents struct {
		BuiltinAgents []struct {
			ID     string `yaml:"id"`
			Config struct {
				SystemPromptID string `yaml:"system_prompt_id"`
			} `yaml:"config"`
		} `yaml:"builtin_agents"`
	}
	require.NoError(t, yaml.Unmarshal(data, &builtinAgents))

	installerPromptID := ""
	for _, agent := range builtinAgents.BuiltinAgents {
		if agent.ID == "builtin-skill-installer" {
			installerPromptID = agent.Config.SystemPromptID
			break
		}
	}
	require.Equal(t, "skill_installer", installerPromptID)

	templates, err := loadPromptTemplates(configDir)
	require.NoError(t, err)
	require.NotNil(t, FindTemplateByID(templates, installerPromptID))
}
