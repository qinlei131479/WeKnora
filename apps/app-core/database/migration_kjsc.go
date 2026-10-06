package database

// 企业 KJSC 迁移：独立于官方 schema_migrations 的第二套迁移树。
//
// 外置原因：migration.go 与上游 internal/database/migration.go 的差异全部来自本文件中的
// 企业新增能力（6 个函数 + 2 个常量），主文件其余部分与上游逐字节一致。
// 外置后 migration.go 可整文件端口上游版本，不再需要人工三方合并。
//
// 边界：不要在本文件里改写上游 migration.go 的任何类型或函数，否则外置失效。
// 上游函数（如 recoverFromDirtyState、MigrationOptions）只调用、不修改。

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/Tencent/WeKnora/apps/app-core/logger"
	"github.com/golang-migrate/migrate/v4"
)

const (
	kjscMigrationsPath  = "file://migrations/version_kjsc"
	kjscMigrationsTable = "schema_migrations_kjsc"
)

func withMigrationsTable(dsn, table string) string {
	if table == "" || strings.HasPrefix(dsn, "sqlite3://") {
		return dsn
	}
	sep := "?"
	if strings.Contains(dsn, "?") {
		sep = "&"
	}
	return dsn + sep + "x-migrations-table=" + table
}

// RunKjscMigrationsWithOptions applies company migrations under
// migrations/version_kjsc using schema_migrations_kjsc. Postgres only;
// SQLite skips this tree. Failures are independent of official schema_migrations.
func RunKjscMigrationsWithOptions(dsn string, opts MigrationOptions) error {
	ctx := context.Background()
	if opts.SQLiteDBPath != "" || strings.HasPrefix(dsn, "sqlite3://") {
		logger.Infof(ctx, "Skip kjsc migrations on sqlite")
		return nil
	}

	logger.Infof(ctx, "Starting kjsc database migration...")
	m, err := migrate.New(kjscMigrationsPath, withMigrationsTable(dsn, kjscMigrationsTable))
	if err != nil {
		return fmt.Errorf("failed to create kjsc migrate instance: %w", err)
	}
	defer m.Close()

	oldVersion, oldDirty, versionErr := m.Version()
	if versionErr != nil && versionErr != migrate.ErrNilVersion {
		return fmt.Errorf("failed to get kjsc migration version: %w", versionErr)
	}
	if versionErr == migrate.ErrNilVersion {
		logger.Infof(ctx, "kjsc schema has no migration history, will start from version 0")
	} else {
		logger.Infof(ctx, "kjsc migration version: %d, dirty: %v", oldVersion, oldDirty)
	}

	if oldDirty {
		if !opts.AutoRecoverDirty {
			return fmt.Errorf("kjsc schema_migrations_kjsc is dirty at version %d", oldVersion)
		}
		if err := recoverFromDirtyState(ctx, m, oldVersion); err != nil {
			return err
		}
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		recovered, recErr := recoverMissingKjscVersion(ctx, m, err)
		if recErr != nil {
			return recErr
		}
		if !recovered {
			return fmt.Errorf("failed to run kjsc migrations: %w", err)
		}
	}

	version, dirty, err := m.Version()
	if err != nil && err != migrate.ErrNilVersion {
		return fmt.Errorf("failed to get kjsc migration version after up: %w", err)
	}
	if err == migrate.ErrNilVersion {
		logger.Infof(ctx, "kjsc migrations produced no version")
		return nil
	}

	logger.Infof(ctx, "kjsc database is at version %d (dirty=%v)", version, dirty)
	return nil
}

// recoverMissingKjscVersion 处理库版本在 migrations/version_kjsc 中没有对应文件的情况。
// 例如库停在 10，目录只有 1–6 和 11 时，golang-migrate 会直接失败，11 不会执行。
// 这时回退到目录里不高于该版本的最近文件，再继续执行更新的迁移。
func recoverMissingKjscVersion(ctx context.Context, m *migrate.Migrate, upErr error) (bool, error) {
	missing, ok := parseMissingMigrationVersion(upErr)
	if !ok {
		return false, nil
	}
	anchor, found := latestKjscVersionAtOrBelow(missing - 1)
	if !found {
		return false, nil
	}
	logger.Warnf(ctx, "kjsc 迁移版本 %d 在 migrations/version_kjsc 中没有文件，从版本 %d 继续", missing, anchor)
	if err := m.Force(anchor); err != nil {
		return false, fmt.Errorf("failed to continue kjsc migrations from version %d: %w", anchor, err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return false, fmt.Errorf("failed to run kjsc migrations: %w", err)
	}
	return true, nil
}

func parseMissingMigrationVersion(err error) (int, bool) {
	if err == nil || !strings.Contains(err.Error(), "no migration found for version ") {
		return 0, false
	}
	const prefix = "no migration found for version "
	msg := err.Error()
	idx := strings.Index(msg, prefix)
	rest := msg[idx+len(prefix):]
	end := strings.IndexByte(rest, ':')
	if end <= 0 {
		return 0, false
	}
	n, convErr := strconv.Atoi(strings.TrimSpace(rest[:end]))
	if convErr != nil || n < 0 {
		return 0, false
	}
	return n, true
}

func latestKjscVersionAtOrBelow(target int) (int, bool) {
	entries, err := os.ReadDir("migrations/version_kjsc")
	if err != nil || target < 0 {
		return 0, false
	}
	best := -1
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".up.sql") {
			continue
		}
		ver, ok := leadingMigrationVersion(entry.Name())
		if !ok || ver > target || ver <= best {
			continue
		}
		best = ver
	}
	if best < 0 {
		return 0, false
	}
	return best, true
}

func leadingMigrationVersion(name string) (int, bool) {
	i := 0
	for i < len(name) && name[i] >= '0' && name[i] <= '9' {
		i++
	}
	if i == 0 || i >= len(name) || name[i] != '_' {
		return 0, false
	}
	n, err := strconv.Atoi(name[:i])
	if err != nil {
		return 0, false
	}
	return n, true
}
