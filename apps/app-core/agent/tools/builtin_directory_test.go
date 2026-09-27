package tools

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/Tencent/WeKnora/apps/app-core/types"
)

func TestSyncBuiltinToolDefinitionsManagesChatRowsOnly(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&BuiltinTool{}))

	version := "v1"
	require.NoError(t, db.Create(&BuiltinTool{
		ToolSlug:      "retired_chat_tool",
		Source:        BuiltinToolSourceChat,
		CapabilityKey: "chat:retired_chat_tool",
		Name:          "已退役平台工具",
		InputSchema:   types.JSON([]byte(`{}`)),
		Enabled:       true,
	}).Error)
	require.NoError(t, db.Create(&BuiltinTool{
		ToolSlug:      ToolThinking,
		Source:        BuiltinToolSourceChat,
		CapabilityKey: "chat:" + ToolThinking,
		Name:          "旧名称",
		Description:   "旧描述",
		InputSchema:   types.JSON([]byte(`{}`)),
		Enabled:       true,
		Version:       &version,
	}).Error)
	require.NoError(t, db.Create(&BuiltinTool{
		ToolSlug:      ToolThinking,
		Source:        BuiltinToolSourceWork,
		CapabilityKey: "work:" + ToolThinking,
		Name:          "工作模式思考",
		Description:   "工作模式描述",
		InputSchema:   types.JSON([]byte(`{}`)),
		Enabled:       true,
	}).Error)

	require.NoError(t, SyncBuiltinToolDefinitions(context.Background(), db))

	var chatRows []BuiltinTool
	require.NoError(t, db.Where("source = ?", BuiltinToolSourceChat).Order("tool_slug").Find(&chatRows).Error)
	require.Len(t, chatRows, len(AvailableToolDefinitions()))
	allowedCategories := map[string]bool{
		BuiltinToolCategoryBuildin:   true,
		BuiltinToolCategoryKnowledge: true,
		BuiltinToolCategoryWiki:      true,
		BuiltinToolCategoryDatabase:  true,
	}
	categoriesBySlug := make(map[string]string, len(chatRows))
	for _, row := range chatRows {
		require.True(t, allowedCategories[row.Category], "unexpected category: %s", row.Category)
		require.NotEqual(t, `{"type":"object"}`, string(row.InputSchema))
		var schema map[string]any
		require.NoError(t, json.Unmarshal(row.InputSchema, &schema))
		require.NotEmpty(t, schema["properties"])
		categoriesBySlug[row.ToolSlug] = row.Category
		if row.ToolSlug == ToolThinking {
			require.Equal(t, "思考", row.Name)
			require.Equal(t, "chat:"+ToolThinking, row.CapabilityKey)
			require.Equal(t, "v1", *row.Version)
			continue
		}
		require.Equal(t, "chat:"+row.ToolSlug, row.CapabilityKey)
	}
	require.Equal(t, BuiltinToolCategoryBuildin, categoriesBySlug[ToolThinking])
	require.Equal(t, BuiltinToolCategoryKnowledge, categoriesBySlug[ToolKnowledgeSearch])
	require.Equal(t, BuiltinToolCategoryDatabase, categoriesBySlug[ToolDatabaseQuery])
	require.Equal(t, BuiltinToolCategoryWiki, categoriesBySlug[ToolWikiSearch])

	var workRows []BuiltinTool
	require.NoError(t, db.Where("source = ?", BuiltinToolSourceWork).Find(&workRows).Error)
	require.Len(t, workRows, 1)
	require.Equal(t, "工作模式思考", workRows[0].Name)
	require.Equal(t, "work:"+ToolThinking, workRows[0].CapabilityKey)

	var total int64
	require.NoError(t, db.Model(&BuiltinTool{}).Count(&total).Error)
	require.EqualValues(t, len(AvailableToolDefinitions())+1, total)
}

func TestBuiltinToolCategoryDefaultsUnknownToolToBuildin(t *testing.T) {
	require.Equal(t, BuiltinToolCategoryBuildin, builtinToolCategory("unknown_tool"))
}
