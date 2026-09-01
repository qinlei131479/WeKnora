package session

import (
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/Tencent/WeKnora/internal/errors"
	"github.com/Tencent/WeKnora/internal/logger"
	"github.com/Tencent/WeKnora/internal/types"
	secutils "github.com/Tencent/WeKnora/internal/utils"
	"github.com/gin-gonic/gin"
)

const internalParseMaxBytes = 32 << 20

// ParseInternal extracts markdown from an uploaded file using WeKnora parser
// engines. It does not create a session or knowledge entry.
func (h *Handler) ParseInternal(c *gin.Context) {
	ctx := c.Request.Context()
	tenantID := types.MustTenantIDFromContext(ctx)
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.Error(errors.NewBadRequestError("file is required"))
		return
	}
	defer file.Close()
	if header.Size > internalParseMaxBytes {
		c.Error(errors.NewBadRequestError("file is too large"))
		return
	}
	data, err := io.ReadAll(io.LimitReader(file, internalParseMaxBytes+1))
	if err != nil {
		c.Error(errors.NewBadRequestError("failed to read file"))
		return
	}
	if int64(len(data)) > internalParseMaxBytes {
		c.Error(errors.NewBadRequestError("file is too large"))
		return
	}
	name := header.Filename
	if safe, ok := secutils.ValidateInput(name); ok {
		name = safe
	}
	name = filepath.Base(name)
	attachment, err := h.attachmentProcessor.ProcessAttachment(ctx, data, name, int64(len(data)), tenantID, "")
	if err != nil {
		logger.ErrorWithFields(ctx, err, map[string]interface{}{"file": secutils.SanitizeForLog(name)})
		c.Error(errors.NewBadRequestError(err.Error()))
		return
	}
	markdown := ""
	if attachment != nil {
		markdown = strings.TrimSpace(attachment.Content)
	}
	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"file_name": name,
		"markdown": markdown,
	})
}
