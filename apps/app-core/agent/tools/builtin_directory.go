package tools

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/Tencent/WeKnora/apps/app-core/types"
)

const (
	// BuiltinToolSourceChat 表示平台对话侧目录，由 app-core 启动同步维护。
	BuiltinToolSourceChat = "chat"
	// BuiltinToolSourceWork 表示工作模式目录，由 Harness 启动同步维护。
	BuiltinToolSourceWork = "work"
)

const (
	// BuiltinToolCategoryBuildin 表示未归入专业域的内置工具。
	BuiltinToolCategoryBuildin = "buildin"
	// BuiltinToolCategoryKnowledge 表示知识库检索工具。
	BuiltinToolCategoryKnowledge = "knowledge"
	// BuiltinToolCategoryWiki 表示 Wiki 工具。
	BuiltinToolCategoryWiki = "wiki"
	// BuiltinToolCategoryDatabase 表示数据库与表格分析工具。
	BuiltinToolCategoryDatabase = "database"
)

type builtinToolSchemaProvider interface {
	Parameters() json.RawMessage
}

var builtinToolSchemaFactories = map[string]func() builtinToolSchemaProvider{
	ToolThinking:  func() builtinToolSchemaProvider { return &sequentialThinkingTool },
	ToolTodoWrite: func() builtinToolSchemaProvider { return &todoWriteTool },

	ToolGrepChunks:          func() builtinToolSchemaProvider { return &grepChunksTool },
	ToolKnowledgeSearch:     func() builtinToolSchemaProvider { return &knowledgeSearchTool },
	ToolListKnowledgeChunks: func() builtinToolSchemaProvider { return &listKnowledgeChunksTool },
	ToolQueryKnowledgeGraph: func() builtinToolSchemaProvider { return &queryKnowledgeGraphTool },
	ToolGetDocumentInfo:     func() builtinToolSchemaProvider { return &getDocumentInfoTool },
	ToolSearchConversations: func() builtinToolSchemaProvider { return &searchConversationsTool },

	ToolDatabaseQuery: func() builtinToolSchemaProvider { return &databaseQueryTool },
	ToolDataAnalysis:  func() builtinToolSchemaProvider { return &dataAnalysisTool },
	ToolDataSchema:    func() builtinToolSchemaProvider { return &dataSchemaTool },

	ToolWikiReadPage: func() builtinToolSchemaProvider {
		return NewWikiReadPageTool(nil, nil, nil, nil)
	},
	ToolWikiWritePage: func() builtinToolSchemaProvider {
		return NewWikiWritePageTool(nil, nil, nil)
	},
	ToolWikiReplaceText: func() builtinToolSchemaProvider {
		return NewWikiReplaceTextTool(nil, nil, nil)
	},
	ToolWikiRenamePage: func() builtinToolSchemaProvider {
		return NewWikiRenamePageTool(nil, nil)
	},
	ToolWikiDeletePage: func() builtinToolSchemaProvider {
		return NewWikiDeletePageTool(nil, nil)
	},
	ToolWikiSearch: func() builtinToolSchemaProvider {
		return NewWikiSearchTool(nil, nil, nil, nil)
	},
	ToolWikiReadSourceDoc: func() builtinToolSchemaProvider {
		return NewWikiReadSourceDocTool(nil, nil)
	},
	ToolWikiFlagIssue: func() builtinToolSchemaProvider {
		return NewWikiFlagIssueTool(nil, nil)
	},
	ToolWikiReadIssue: func() builtinToolSchemaProvider {
		return NewWikiReadIssueTool(nil, nil)
	},
	ToolWikiUpdateIssue: func() builtinToolSchemaProvider {
		return NewWikiUpdateIssueTool(nil, nil)
	},
}

func builtinToolCategory(toolSlug string) string {
	switch toolSlug {
	case ToolThinking, ToolTodoWrite:
		return BuiltinToolCategoryBuildin
	case ToolGrepChunks, ToolKnowledgeSearch, ToolListKnowledgeChunks,
		ToolQueryKnowledgeGraph, ToolGetDocumentInfo, ToolSearchConversations:
		return BuiltinToolCategoryKnowledge
	case ToolDatabaseQuery, ToolDataAnalysis, ToolDataSchema:
		return BuiltinToolCategoryDatabase
	case ToolWikiReadPage, ToolWikiWritePage, ToolWikiReplaceText,
		ToolWikiRenamePage, ToolWikiDeletePage, ToolWikiSearch,
		ToolWikiReadSourceDoc, ToolWikiFlagIssue, ToolWikiReadIssue,
		ToolWikiUpdateIssue:
		return BuiltinToolCategoryWiki
	default:
		return BuiltinToolCategoryBuildin
	}
}

func builtinToolInputSchema(toolSlug string) (types.JSON, error) {
	factory, found := builtinToolSchemaFactories[toolSlug]
	if !found {
		return nil, fmt.Errorf("builtin tool %q has no input schema factory", toolSlug)
	}
	schema := factory().Parameters()
	var parsed struct {
		Properties map[string]any `json:"properties"`
	}
	if err := json.Unmarshal(schema, &parsed); err != nil {
		return nil, fmt.Errorf("invalid input schema for builtin tool %q: %w", toolSlug, err)
	}
	if len(parsed.Properties) == 0 {
		return nil, fmt.Errorf("builtin tool %q input schema has no properties", toolSlug)
	}
	return types.JSON(schema), nil
}

// BuiltinTool 是 amp_builtin_tools 的目录投影；工具定义仍保留在各代码注册表中。
type BuiltinTool struct {
	ID            int64      `gorm:"column:id;primaryKey;autoIncrement"`
	ToolSlug      string     `gorm:"column:tool_slug;type:varchar(128);not null;uniqueIndex:uq_amp_builtin_tools_slug_source,priority:1"`
	Source        string     `gorm:"column:source;type:varchar(32);not null;default:work;uniqueIndex:uq_amp_builtin_tools_slug_source,priority:2"`
	CapabilityKey string     `gorm:"column:capability_key;type:varchar(191);not null;uniqueIndex:uq_amp_builtin_tools_capability"`
	Name          string     `gorm:"column:name;type:varchar(255);not null"`
	Description   string     `gorm:"column:description;not null;default:''"`
	Category      string     `gorm:"column:category;type:varchar(64);not null;default:general;index"`
	InputSchema   types.JSON `gorm:"column:input_schema;type:jsonb;not null"`
	Enabled       bool       `gorm:"column:enabled;not null;default:true"`
	Version       *string    `gorm:"column:version;type:varchar(64)"`
	CreatedAt     *time.Time `gorm:"column:created_at;not null"`
	UpdatedAt     *time.Time `gorm:"column:updated_at;not null"`
}

// TableName 显式绑定 amp_builtin_tools，避免 GORM 复数化生成错误表名。
func (BuiltinTool) TableName() string {
	return "amp_builtin_tools"
}

// SyncBuiltinToolDefinitions 同步平台侧目录，并只清理 source=chat 的退役工具。
func SyncBuiltinToolDefinitions(ctx context.Context, db *gorm.DB) error {
	definitions := AvailableToolDefinitions()
	expected := make(map[string]struct{}, len(definitions))
	for _, definition := range definitions {
		expected[definition.Name] = struct{}{}
	}

	return db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var managed []BuiltinTool
		if err := tx.Where("source = ?", BuiltinToolSourceChat).Find(&managed).Error; err != nil {
			return err
		}
		for _, row := range managed {
			if _, found := expected[row.ToolSlug]; found {
				continue
			}
			if err := tx.Delete(&row).Error; err != nil {
				return err
			}
		}

		for _, definition := range definitions {
			schema, err := builtinToolInputSchema(definition.Name)
			if err != nil {
				return err
			}
			row := BuiltinTool{
				ToolSlug:      definition.Name,
				Source:        BuiltinToolSourceChat,
				CapabilityKey: BuiltinToolSourceChat + ":" + definition.Name,
				Name:          definition.Label,
				Description:   definition.Description,
				Category:      builtinToolCategory(definition.Name),
				InputSchema:   schema,
				Enabled:       true,
			}
			if err := tx.Clauses(clause.OnConflict{
				Columns: []clause.Column{{Name: "tool_slug"}, {Name: "source"}},
				DoUpdates: clause.AssignmentColumns([]string{
					"capability_key",
					"name",
					"description",
					"category",
					"input_schema",
					"enabled",
					"updated_at",
				}),
			}).Create(&row).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
