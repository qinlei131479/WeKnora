package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/Tencent/WeKnora/internal/application/service"
	"github.com/Tencent/WeKnora/internal/errors"
	"github.com/Tencent/WeKnora/internal/logger"
	"github.com/Tencent/WeKnora/internal/models/chat"
	"github.com/Tencent/WeKnora/internal/types"
	secutils "github.com/Tencent/WeKnora/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ProxyChatCompletions is the P6 internal OpenAI-compatible chat proxy.
// Credentials stay in WeKnora; the caller sends a user JWT and the model :id.
func (h *ModelHandler) ProxyChatCompletions(c *gin.Context) {
	ctx := c.Request.Context()
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		c.Error(errors.NewBadRequestError("Model ID cannot be empty"))
		return
	}
	raw, err := io.ReadAll(io.LimitReader(c.Request.Body, 8<<20))
	if err != nil {
		c.Error(errors.NewBadRequestError("failed to read request body"))
		return
	}
	if err := rejectProxySecrets(raw); err != nil {
		c.Error(errors.NewBadRequestError(err.Error()))
		return
	}
	var req openAIChatProxyRequest
	if err := json.Unmarshal(raw, &req); err != nil {
		c.Error(errors.NewBadRequestError("invalid chat completions body"))
		return
	}
	model, err := h.service.GetModelByID(ctx, id)
	if err != nil {
		if err == service.ErrModelNotFound {
			c.Error(errors.NewNotFoundError("Model not found"))
			return
		}
		c.Error(errors.NewInternalServerError(err.Error()))
		return
	}
	if model.Type != types.ModelTypeKnowledgeQA {
		c.Error(errors.NewBadRequestError("model type must be KnowledgeQA for chat"))
		return
	}
	instance, err := h.service.GetChatModel(ctx, id)
	if err != nil {
		c.Error(errors.NewInternalServerError(err.Error()))
		return
	}
	messages := convertProxyMessages(req.Messages)
	if len(messages) == 0 {
		c.Error(errors.NewBadRequestError("messages cannot be empty"))
		return
	}
	opts := proxyChatOptions(req)
	if req.Stream {
		h.proxyChatStream(c, instance, id, messages, opts)
		return
	}
	resp, err := instance.Chat(ctx, messages, opts)
	if err != nil {
		logger.ErrorWithFields(ctx, err, map[string]interface{}{"model_id": secutils.SanitizeForLog(id)})
		c.Error(errors.NewInternalServerError(err.Error()))
		return
	}
	c.JSON(http.StatusOK, buildOpenAIChatResponse(id, resp, false))
}

func (h *ModelHandler) proxyChatStream(c *gin.Context, instance chat.Chat, modelID string, messages []chat.Message, opts *chat.ChatOptions) {
	ctx := c.Request.Context()
	stream, err := instance.ChatStream(ctx, messages, opts)
	if err != nil {
		c.Error(errors.NewInternalServerError(err.Error()))
		return
	}
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Status(http.StatusOK)
	flusher, _ := c.Writer.(http.Flusher)
	chunkID := "chatcmpl-" + uuid.NewString()
	for event := range stream {
		payload := buildOpenAIChatChunk(chunkID, modelID, event)
		if payload == nil {
			continue
		}
		if _, err := fmt.Fprintf(c.Writer, "data: %s\n\n", payload); err != nil {
			return
		}
		if flusher != nil {
			flusher.Flush()
		}
		// event.Done also fires for the "thinking done" hand-off marker
		// (ResponseTypeThinking, see thinkingEmitter.finish) that reasoning
		// models emit *before* their real answer starts streaming. Breaking
		// on that marker would end the SSE stream right after the model's
		// chain-of-thought and drop the actual answer entirely.
		if event.Done && event.ResponseType != types.ResponseTypeThinking {
			break
		}
	}
	_, _ = io.WriteString(c.Writer, "data: [DONE]\n\n")
	if flusher != nil {
		flusher.Flush()
	}
}

// ProxyEmbeddings is the P6 internal OpenAI-compatible embeddings proxy.
func (h *ModelHandler) ProxyEmbeddings(c *gin.Context) {
	ctx := c.Request.Context()
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		c.Error(errors.NewBadRequestError("Model ID cannot be empty"))
		return
	}
	raw, err := io.ReadAll(io.LimitReader(c.Request.Body, 8<<20))
	if err != nil {
		c.Error(errors.NewBadRequestError("failed to read request body"))
		return
	}
	if err := rejectProxySecrets(raw); err != nil {
		c.Error(errors.NewBadRequestError(err.Error()))
		return
	}
	var req openAIEmbeddingProxyRequest
	if err := json.Unmarshal(raw, &req); err != nil {
		c.Error(errors.NewBadRequestError("invalid embeddings body"))
		return
	}
	inputs := req.inputList()
	if len(inputs) == 0 {
		c.Error(errors.NewBadRequestError("input cannot be empty"))
		return
	}
	model, err := h.service.GetModelByID(ctx, id)
	if err != nil {
		if err == service.ErrModelNotFound {
			c.Error(errors.NewNotFoundError("Model not found"))
			return
		}
		c.Error(errors.NewInternalServerError(err.Error()))
		return
	}
	if model.Type != types.ModelTypeEmbedding {
		c.Error(errors.NewBadRequestError("model type must be Embedding"))
		return
	}
	embedder, err := h.service.GetEmbeddingModel(ctx, id)
	if err != nil {
		c.Error(errors.NewInternalServerError(err.Error()))
		return
	}
	vectors, err := embedder.BatchEmbed(ctx, inputs)
	if err != nil {
		c.Error(errors.NewInternalServerError(err.Error()))
		return
	}
	data := make([]gin.H, 0, len(vectors))
	for i, vec := range vectors {
		data = append(data, gin.H{"object": "embedding", "index": i, "embedding": vec})
	}
	c.JSON(http.StatusOK, gin.H{
		"object": "list",
		"model":  id,
		"data":   data,
	})
}

// ProxyRerank is the P6 internal rerank proxy.
func (h *ModelHandler) ProxyRerank(c *gin.Context) {
	ctx := c.Request.Context()
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		c.Error(errors.NewBadRequestError("Model ID cannot be empty"))
		return
	}
	raw, err := io.ReadAll(io.LimitReader(c.Request.Body, 8<<20))
	if err != nil {
		c.Error(errors.NewBadRequestError("failed to read request body"))
		return
	}
	if err := rejectProxySecrets(raw); err != nil {
		c.Error(errors.NewBadRequestError(err.Error()))
		return
	}
	var req openAIRerankProxyRequest
	if err := json.Unmarshal(raw, &req); err != nil {
		c.Error(errors.NewBadRequestError("invalid rerank body"))
		return
	}
	if strings.TrimSpace(req.Query) == "" || len(req.Documents) == 0 {
		c.Error(errors.NewBadRequestError("query and documents are required"))
		return
	}
	model, err := h.service.GetModelByID(ctx, id)
	if err != nil {
		if err == service.ErrModelNotFound {
			c.Error(errors.NewNotFoundError("Model not found"))
			return
		}
		c.Error(errors.NewInternalServerError(err.Error()))
		return
	}
	if model.Type != types.ModelTypeRerank {
		c.Error(errors.NewBadRequestError("model type must be Rerank"))
		return
	}
	reranker, err := h.service.GetRerankModel(ctx, id)
	if err != nil {
		c.Error(errors.NewInternalServerError(err.Error()))
		return
	}
	results, err := reranker.Rerank(ctx, req.Query, req.Documents)
	if err != nil {
		c.Error(errors.NewInternalServerError(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"model": id, "results": results})
}

func rejectProxySecrets(raw []byte) error {
	var probe map[string]json.RawMessage
	if err := json.Unmarshal(raw, &probe); err != nil {
		return nil
	}
	for _, key := range []string{"api_key", "app_secret", "APIKey", "AppSecret"} {
		if _, ok := probe[key]; ok {
			return fmt.Errorf("proxy request must not include model credentials")
		}
	}
	return nil
}

type openAIChatProxyRequest struct {
	Messages            []openAIProxyMessage `json:"messages"`
	Stream              bool                 `json:"stream"`
	Temperature         *float64             `json:"temperature"`
	TopP                *float64             `json:"top_p"`
	MaxTokens           *int                 `json:"max_tokens"`
	MaxCompletionTokens *int                 `json:"max_completion_tokens"`
	Tools               json.RawMessage      `json:"tools"`
	ToolChoice          json.RawMessage      `json:"tool_choice"`
}

type openAIProxyMessage struct {
	Role             string          `json:"role"`
	Content          json.RawMessage `json:"content"`
	Name             string          `json:"name,omitempty"`
	ToolCallID       string          `json:"tool_call_id,omitempty"`
	ToolCalls        json.RawMessage `json:"tool_calls,omitempty"`
	ReasoningContent string          `json:"reasoning_content,omitempty"`
}

type openAIEmbeddingProxyRequest struct {
	Input json.RawMessage `json:"input"`
}

func (r openAIEmbeddingProxyRequest) inputList() []string {
	var one string
	if err := json.Unmarshal(r.Input, &one); err == nil && strings.TrimSpace(one) != "" {
		return []string{one}
	}
	var many []string
	if err := json.Unmarshal(r.Input, &many); err == nil {
		return many
	}
	return nil
}

type openAIRerankProxyRequest struct {
	Query     string   `json:"query"`
	Documents []string `json:"documents"`
}

func convertProxyMessages(in []openAIProxyMessage) []chat.Message {
	out := make([]chat.Message, 0, len(in))
	for _, msg := range in {
		item := chat.Message{
			Role:             msg.Role,
			Name:             msg.Name,
			ToolCallID:       msg.ToolCallID,
			ReasoningContent: msg.ReasoningContent,
			Content:          proxyMessageContent(msg.Content),
		}
		if len(msg.ToolCalls) > 0 {
			var calls []chat.ToolCall
			if err := json.Unmarshal(msg.ToolCalls, &calls); err == nil {
				item.ToolCalls = calls
			}
		}
		out = append(out, item)
	}
	return out
}

func proxyMessageContent(raw json.RawMessage) string {
	if len(raw) == 0 || string(raw) == "null" {
		return ""
	}
	var text string
	if err := json.Unmarshal(raw, &text); err == nil {
		return text
	}
	var parts []map[string]any
	if err := json.Unmarshal(raw, &parts); err == nil {
		var b strings.Builder
		for _, part := range parts {
			if part["type"] == "text" {
				if s, ok := part["text"].(string); ok {
					b.WriteString(s)
				}
			}
		}
		return b.String()
	}
	return strings.TrimSpace(string(raw))
}

func proxyChatOptions(req openAIChatProxyRequest) *chat.ChatOptions {
	opts := &chat.ChatOptions{}
	if req.Temperature != nil {
		opts.Temperature = *req.Temperature
	}
	if req.TopP != nil {
		opts.TopP = *req.TopP
	}
	if req.MaxTokens != nil {
		opts.MaxTokens = *req.MaxTokens
	}
	if req.MaxCompletionTokens != nil {
		opts.MaxCompletionTokens = *req.MaxCompletionTokens
	}
	if len(req.Tools) > 0 && string(req.Tools) != "null" {
		var tools []chat.Tool
		if err := json.Unmarshal(req.Tools, &tools); err == nil {
			opts.Tools = tools
		}
	}
	if len(req.ToolChoice) > 0 && string(req.ToolChoice) != "null" {
		var asString string
		if err := json.Unmarshal(req.ToolChoice, &asString); err == nil {
			opts.ToolChoice = asString
		}
	}
	return opts
}

func buildOpenAIChatResponse(modelID string, resp *types.ChatResponse, _ bool) gin.H {
	message := gin.H{"role": "assistant", "content": ""}
	if resp != nil {
		message["content"] = resp.Content
		if resp.ReasoningContent != "" {
			message["reasoning_content"] = resp.ReasoningContent
		}
		if len(resp.ToolCalls) > 0 {
			message["tool_calls"] = resp.ToolCalls
		}
	}
	finish := "stop"
	if resp != nil && resp.FinishReason != "" {
		finish = resp.FinishReason
	}
	return gin.H{
		"id":      "chatcmpl-" + uuid.NewString(),
		"object":  "chat.completion",
		"created": time.Now().Unix(),
		"model":   modelID,
		"choices": []gin.H{{
			"index":         0,
			"message":       message,
			"finish_reason": finish,
		}},
	}
}

func buildOpenAIChatChunk(id, modelID string, event types.StreamResponse) []byte {
	delta := gin.H{}
	if event.Content != "" {
		// Reasoning-capable models (DeepSeek thinking, Qwen3 thinking, vLLM
		// reasoning, etc.) stream their chain-of-thought as a distinct
		// ResponseTypeThinking event before the real answer. Without this
		// check every thinking token would land in `content` and get
		// rendered as if it were the final answer (see buildOpenAIChatResponse,
		// which already separates the two for the non-streaming path).
		if event.ResponseType == types.ResponseTypeThinking {
			delta["reasoning_content"] = event.Content
		} else {
			delta["content"] = event.Content
		}
	}
	if len(event.ToolCalls) > 0 {
		calls := make([]gin.H, 0, len(event.ToolCalls))
		for i, tc := range event.ToolCalls {
			calls = append(calls, gin.H{
				"index":    i,
				"id":       tc.ID,
				"type":     tc.Type,
				"function": tc.Function,
			})
		}
		delta["tool_calls"] = calls
	}
	finish := interface{}(nil)
	// Only the answer stream's own Done marker should surface finish_reason.
	// The thinking-phase Done marker (see thinkingEmitter.finish) just signals
	// "reasoning ended, answer starts next" — it must not be mistaken by the
	// OpenAI-compatible client for the end of the completion.
	if event.Done && event.ResponseType != types.ResponseTypeThinking {
		reason := event.FinishReason
		if reason == "" {
			reason = "stop"
		}
		finish = reason
	}
	if len(delta) == 0 && finish == nil {
		return nil
	}
	body, err := json.Marshal(gin.H{
		"id":      id,
		"object":  "chat.completion.chunk",
		"created": time.Now().Unix(),
		"model":   modelID,
		"choices": []gin.H{{
			"index":         0,
			"delta":         delta,
			"finish_reason": finish,
		}},
	})
	if err != nil {
		return nil
	}
	return body
}
