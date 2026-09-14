package config

import "testing"

func TestApplyServerEnvOverridesHonorsAPPPort(t *testing.T) {
	t.Setenv("APP_PORT", "9980")
	cfg := &Config{Server: &ServerConfig{Port: 8080, Host: "0.0.0.0"}}
	applyServerEnvOverrides(cfg)
	if cfg.Server.Port != 9980 {
		t.Fatalf("server.port = %d, want 9980", cfg.Server.Port)
	}
}

func TestApplyServerEnvOverridesIgnoresInvalidAPPPort(t *testing.T) {
	t.Setenv("APP_PORT", "not-a-port")
	cfg := &Config{Server: &ServerConfig{Port: 8080}}
	applyServerEnvOverrides(cfg)
	if cfg.Server.Port != 8080 {
		t.Fatalf("server.port = %d, want 8080", cfg.Server.Port)
	}
}

func TestApplyServerEnvOverridesKeepsYAMLWhenUnset(t *testing.T) {
	t.Setenv("APP_PORT", "")
	cfg := &Config{Server: &ServerConfig{Port: 8080}}
	applyServerEnvOverrides(cfg)
	if cfg.Server.Port != 8080 {
		t.Fatalf("server.port = %d, want 8080", cfg.Server.Port)
	}
}
