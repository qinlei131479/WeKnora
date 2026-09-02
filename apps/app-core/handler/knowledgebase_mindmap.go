package handler

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/Tencent/WeKnora/apps/app-core/errors"
	"github.com/Tencent/WeKnora/apps/app-core/logger"
	"github.com/Tencent/WeKnora/apps/app-core/models/chat"
	"github.com/Tencent/WeKnora/apps/app-core/types"
	"github.com/gin-gonic/gin"
)

const mindmapFileLimit = 200

var mindmapSystemPrompt = `你是一个专业的知识整理助手。根据文件列表生成层次分明的思维导图 JSON。
规则：根节点是知识库名称；2-4 层；叶子必须是文件名；每个文件名只能出现一次。
只返回 JSON，结构：{"content":"知识库名称","children":[{"content":"分类","children":[{"content":"文件名"}]}]}`

// GetKnowledgeBaseMindmap returns the stored file-tree mindmap.
func (h *KnowledgeBaseHandler) GetKnowledgeBaseMindmap(c *gin.Context) {
	kb, id, _, _, err := h.validateAndGetKnowledgeBase(c)
	if err != nil {
		c.Error(err)
		return
	}
	mindmap, fileIDs, metadata, err := h.service.GetMindmap(c.Request.Context(), id)
	if err != nil {
		c.Error(err)
		return
	}
	c.JSON(200, gin.H{
		"success":          true,
		"mindmap":          json.RawMessage(orEmptyJSON(mindmap)),
		"mindmap_file_ids": json.RawMessage(orEmptyJSON(fileIDs)),
		"mindmap_metadata": json.RawMessage(orEmptyJSON(metadata)),
		"name":             kb.Name,
	})
}

// GenerateKnowledgeBaseMindmap builds a file-tree mindmap with the tenant chat model.
func (h *KnowledgeBaseHandler) GenerateKnowledgeBaseMindmap(c *gin.Context) {
	ctx := c.Request.Context()
	kb, id, _, _, err := h.validateAndGetKnowledgeBase(c)
	if err != nil {
		c.Error(err)
		return
	}
	items, err := h.knowledgeService.ListKnowledgeByKnowledgeBaseID(ctx, id)
	if err != nil {
		c.Error(errors.NewInternalServerError(err.Error()))
		return
	}
	files := make([]string, 0, len(items))
	fileIDs := map[string]string{}
	for _, item := range items {
		if item == nil || item.FileName == "" {
			continue
		}
		files = append(files, item.FileName)
		fileIDs[item.ID] = item.FileName
		if len(files) >= mindmapFileLimit {
			break
		}
	}
	if len(files) == 0 {
		c.Error(errors.NewBadRequestError("知识库中没有文件"))
		return
	}
	modelID := strings.TrimSpace(kb.SummaryModelID)
	if modelID == "" {
		models, listErr := h.modelService.ListModels(ctx)
		if listErr != nil {
			c.Error(errors.NewInternalServerError(listErr.Error()))
			return
		}
		for _, m := range models {
			if m != nil && m.Type == types.ModelTypeKnowledgeQA && m.IsDefault {
				modelID = m.ID
				break
			}
		}
		if modelID == "" {
			for _, m := range models {
				if m != nil && m.Type == types.ModelTypeKnowledgeQA {
					modelID = m.ID
					break
				}
			}
		}
	}
	if modelID == "" {
		c.Error(errors.NewBadRequestError("未配置可用的聊天模型，无法生成思维导图"))
		return
	}
	instance, err := h.modelService.GetChatModel(ctx, modelID)
	if err != nil {
		c.Error(errors.NewInternalServerError(err.Error()))
		return
	}
	userMsg := fmt.Sprintf("知识库名称：%s\n文件列表：\n- %s", kb.Name, strings.Join(files, "\n- "))
	resp, err := instance.Chat(ctx, []chat.Message{
		{Role: "system", Content: mindmapSystemPrompt},
		{Role: "user", Content: userMsg},
	}, &chat.ChatOptions{})
	if err != nil {
		logger.ErrorWithFields(ctx, err, map[string]interface{}{"kb_id": id})
		c.Error(errors.NewInternalServerError("生成思维导图失败"))
		return
	}
	mindmap, err := parseMindmapJSON(resp.Content)
	if err != nil {
		c.Error(errors.NewInternalServerError("模型返回的思维导图格式无效"))
		return
	}
	fileIDsRaw, _ := json.Marshal(fileIDs)
	metaRaw, _ := json.Marshal(gin.H{
		"generated_at": time.Now().UTC().Format(time.RFC3339),
		"file_count":   len(files),
	})
	if err := h.service.SaveMindmap(ctx, id, mindmap, fileIDsRaw, metaRaw); err != nil {
		c.Error(errors.NewInternalServerError(err.Error()))
		return
	}
	c.JSON(200, gin.H{
		"success": true,
		"mindmap": json.RawMessage(mindmap),
		"name":    kb.Name,
		"kb_id":   id,
		"message": "success",
	})
}

func orEmptyJSON(raw json.RawMessage) []byte {
	if len(raw) == 0 {
		return []byte("null")
	}
	return raw
}

func parseMindmapJSON(content string) ([]byte, error) {
	content = strings.TrimSpace(content)
	if i := strings.Index(content, "{"); i >= 0 {
		if j := strings.LastIndex(content, "}"); j > i {
			content = content[i : j+1]
		}
	}
	var node map[string]any
	if err := json.Unmarshal([]byte(content), &node); err != nil {
		return nil, err
	}
	if strings.TrimSpace(fmt.Sprint(node["content"])) == "" {
		return nil, fmt.Errorf("missing content")
	}
	return json.Marshal(node)
}
