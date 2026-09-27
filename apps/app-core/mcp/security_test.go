package mcp

import (
	"context"
	"strings"
	"testing"

	"github.com/Tencent/WeKnora/apps/app-core/types"
)

func TestValidateServiceOutboundURLsRejectsOAuthMetadataSSRF(t *testing.T) {
	serviceURL := "https://example.com/mcp"
	err := ValidateServiceOutboundURLs(&types.MCPService{
		URL: &serviceURL,
		AuthConfig: &types.MCPAuthConfig{
			AuthServerMetadataURL: "http://169.254.169.254/latest/meta-data",
		},
	})
	if err == nil {
		t.Fatal("expected OAuth metadata URL to be rejected")
	}
}

func TestNewMCPClientRejectsStoredUnsafeURL(t *testing.T) {
	serviceURL := "http://127.0.0.1:8080/mcp"
	_, err := NewMCPClient(&ClientConfig{Service: &types.MCPService{
		URL:           &serviceURL,
		TransportType: types.MCPTransportHTTPStreamable,
	}})
	if err == nil {
		t.Fatal("expected stored unsafe MCP URL to be rejected at client construction")
	}
}

func TestBuiltinStdioUsesStoredLaunch(t *testing.T) {
	stored := &types.MCPStdioConfig{Command: "npx", Args: []string{"-y", "@antv/mcp-server-chart"}}
	service := &types.MCPService{
		ID:            "another-builtin",
		IsBuiltin:     true,
		Enabled:       true,
		TransportType: types.MCPTransportStdio,
		StdioConfig:   stored,
		EnvVars:       types.MCPEnvVars{"NPM_CONFIG_REGISTRY": "https://registry.example", "A": "1"},
	}
	command, args, env, err := builtinStdioLaunch(service)
	if err != nil {
		t.Fatal(err)
	}
	if command != "npx" || len(args) != 2 || args[1] != "@antv/mcp-server-chart" {
		t.Fatalf("launch = %s %v", command, args)
	}
	if len(env) != 2 || env[0] != "A=1" || env[1] != "NPM_CONFIG_REGISTRY=https://registry.example" {
		t.Fatalf("env = %#v", env)
	}
	if stored.Command != "npx" {
		t.Fatal("stored command must stay unchanged")
	}
	client, err := NewMCPClient(&ClientConfig{Service: service})
	if err != nil || client == nil {
		t.Fatalf("expected builtin stdio client, err=%v", err)
	}
}

func TestNewMCPClientRejectsUserStdio(t *testing.T) {
	cases := []*types.MCPService{
		{
			ID:            "user-stdio",
			TransportType: types.MCPTransportStdio,
			StdioConfig:   &types.MCPStdioConfig{Command: "bash", Args: []string{"-c", "echo pwned"}},
		},
		{
			ID:            "mcp-server-chart",
			IsBuiltin:     false,
			TransportType: types.MCPTransportStdio,
			StdioConfig:   &types.MCPStdioConfig{Command: "npx", Args: []string{"-y", "@antv/mcp-server-chart"}},
		},
	}
	for _, service := range cases {
		_, err := NewMCPClient(&ClientConfig{Service: service})
		if err == nil || !strings.Contains(err.Error(), "stdio transport is disabled") {
			t.Fatalf("service %s: expected stdio to be rejected, got %v", service.ID, err)
		}
	}
	_, err := NewMCPClient(&ClientConfig{Service: &types.MCPService{
		ID:            "builtin-without-command",
		IsBuiltin:     true,
		TransportType: types.MCPTransportStdio,
	}})
	if err == nil || !strings.Contains(err.Error(), "launch command") {
		t.Fatalf("expected missing launch command to be rejected, got %v", err)
	}
}

func TestGetOrCreateClientRejectsUserStdio(t *testing.T) {
	manager := NewMCPManager(nil)
	defer manager.CloseAll()
	_, err := manager.GetOrCreateClient(context.Background(), &types.MCPService{
		ID:            "user-stdio",
		Name:          "user",
		Enabled:       true,
		TransportType: types.MCPTransportStdio,
		StdioConfig:   &types.MCPStdioConfig{Command: "bash", Args: []string{"-c", "echo pwned"}},
	})
	if err == nil || !strings.Contains(err.Error(), "stdio transport is disabled") {
		t.Fatalf("expected user stdio to be rejected, got %v", err)
	}
}
