package handler

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Tencent/WeKnora/apps/app-core/middleware"
	"github.com/Tencent/WeKnora/apps/app-core/types"
	"github.com/Tencent/WeKnora/apps/app-core/types/interfaces"
	"github.com/gin-gonic/gin"
)

type previewKnowledgeServiceStub struct {
	interfaces.KnowledgeService
	filename string
	body     string
}

type closeNotifyRecorder struct {
	*httptest.ResponseRecorder
}

func (r *closeNotifyRecorder) CloseNotify() <-chan bool {
	ch := make(chan bool, 1)
	return ch
}

func (s *previewKnowledgeServiceStub) GetKnowledgeByIDOnly(context.Context, string) (*types.Knowledge, error) {
	return &types.Knowledge{ID: "k1", TenantID: 42, KnowledgeBaseID: "kb1"}, nil
}

func (s *previewKnowledgeServiceStub) GetKnowledgeFile(context.Context, string) (io.ReadCloser, string, error) {
	body := s.body
	if body == "" {
		body = `<html><script>alert(1)</script></html>`
	}
	return io.NopCloser(strings.NewReader(body)), s.filename, nil
}

func TestPreviewKnowledgeFileForcesActiveContentDownload(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.ErrorHandler())
	router.Use(func(c *gin.Context) {
		c.Set(types.TenantIDContextKey.String(), uint64(42))
		c.Next()
	})

	h := &KnowledgeHandler{kgService: &previewKnowledgeServiceStub{filename: "payload.html"}}
	router.GET("/knowledge/:id/preview", h.PreviewKnowledgeFile)

	req := httptest.NewRequest(http.MethodGet, "/knowledge/k1/preview", nil)
	w := &closeNotifyRecorder{ResponseRecorder: httptest.NewRecorder()}
	router.ServeHTTP(w, req)

	if got, want := w.Code, http.StatusOK; got != want {
		t.Fatalf("status = %d, want %d; body=%s", got, want, w.Body.String())
	}
	if got := w.Header().Get("Content-Type"); got != "application/octet-stream" {
		t.Fatalf("Content-Type = %q, want application/octet-stream", got)
	}
	if got := w.Header().Get("X-Content-Type-Options"); got != "nosniff" {
		t.Fatalf("X-Content-Type-Options = %q, want nosniff", got)
	}
	if got := w.Header().Get("Content-Disposition"); !strings.HasPrefix(got, "attachment") {
		t.Fatalf("Content-Disposition = %q, want attachment", got)
	}
}

func TestPreviewKnowledgeFileServesConvertedPresentationPDF(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.ErrorHandler())
	router.Use(func(c *gin.Context) {
		c.Set(types.TenantIDContextKey.String(), uint64(42))
		c.Next()
	})

	pdf := "%PDF-1.4 preview"
	origConvert := convertPresentationForPreview
	convertPresentationForPreview = func(context.Context, []byte, string) ([]byte, error) {
		return []byte(pdf), nil
	}
	t.Cleanup(func() { convertPresentationForPreview = origConvert })

	h := &KnowledgeHandler{
		kgService: &previewKnowledgeServiceStub{filename: "slides.pptx", body: "PK-fake-pptx-converted"},
	}
	router.GET("/knowledge/:id/preview", h.PreviewKnowledgeFile)

	req := httptest.NewRequest(http.MethodGet, "/knowledge/k1/preview", nil)
	w := &closeNotifyRecorder{ResponseRecorder: httptest.NewRecorder()}
	router.ServeHTTP(w, req)

	if got, want := w.Code, http.StatusOK; got != want {
		t.Fatalf("status = %d, want %d; body=%s", got, want, w.Body.String())
	}
	if got := w.Header().Get("Content-Type"); got != "application/pdf" {
		t.Fatalf("Content-Type = %q, want application/pdf", got)
	}
	if got := w.Header().Get("Content-Disposition"); !strings.Contains(got, "slides.pdf") || !strings.HasPrefix(got, "inline") {
		t.Fatalf("Content-Disposition = %q, want inline pdf", got)
	}
	if got := w.Body.String(); got != pdf {
		t.Fatalf("body = %q, want converted pdf", got)
	}
}

func TestPreviewKnowledgeFileKeepsOriginalWhenPresentationConvertFails(t *testing.T) {
	origFinder := findPresentationSoffice
	findPresentationSoffice = func() string { return "" }
	t.Cleanup(func() { findPresentationSoffice = origFinder })

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(middleware.ErrorHandler())
	router.Use(func(c *gin.Context) {
		c.Set(types.TenantIDContextKey.String(), uint64(42))
		c.Next()
	})

	original := "PK-fake-pptx-fallback"
	h := &KnowledgeHandler{
		kgService: &previewKnowledgeServiceStub{filename: "deck.pptx", body: original},
	}
	router.GET("/knowledge/:id/preview", h.PreviewKnowledgeFile)

	req := httptest.NewRequest(http.MethodGet, "/knowledge/k1/preview", nil)
	w := &closeNotifyRecorder{ResponseRecorder: httptest.NewRecorder()}
	router.ServeHTTP(w, req)

	if got, want := w.Code, http.StatusOK; got != want {
		t.Fatalf("status = %d, want %d; body=%s", got, want, w.Body.String())
	}
	if got := w.Body.String(); got != original {
		t.Fatalf("body = %q, want original pptx", got)
	}
	if got := w.Header().Get("Content-Type"); got == "application/pdf" {
		t.Fatalf("Content-Type = %q, original pptx must not be served as pdf", got)
	}
}
