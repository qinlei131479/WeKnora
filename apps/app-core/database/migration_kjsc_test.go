package database

import "testing"

func TestWithMigrationsTable(t *testing.T) {
	t.Parallel()
	got := withMigrationsTable("postgres://u:p@h:5432/db?sslmode=disable", kjscMigrationsTable)
	want := "postgres://u:p@h:5432/db?sslmode=disable&x-migrations-table=schema_migrations_kjsc"
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
	if withMigrationsTable("sqlite3://x", kjscMigrationsTable) != "sqlite3://x" {
		t.Fatal("sqlite DSN must stay unchanged")
	}
}
