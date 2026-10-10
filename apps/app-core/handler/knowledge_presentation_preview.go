package handler

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/Tencent/WeKnora/apps/app-core/logger"
)

var (
	presentationPreviewMu sync.Mutex
	// 测试可替换，避免本机装了 LibreOffice 时误走真实转换。
	findPresentationSoffice       = findSofficeBinary
	convertPresentationForPreview = convertPresentationWithSoffice
)

type bytesReadSeekCloser struct {
	*bytes.Reader
}

func (bytesReadSeekCloser) Close() error { return nil }

// presentationPreview 把 ppt / pptx / pptm 预览转成 PDF。
// 转换失败时仍返回原始文件，调用方继续按原格式预览。
func (h *KnowledgeHandler) presentationPreview(ctx context.Context, file io.ReadCloser, filename string) (io.ReadCloser, string, string) {
	ext := strings.ToLower(filepath.Ext(filename))
	if ext != ".ppt" && ext != ".pptx" && ext != ".pptm" {
		return file, filename, ""
	}
	data, err := io.ReadAll(file)
	_ = file.Close()
	if err != nil {
		logger.Warnf(ctx, "读取幻灯片预览失败: %v", err)
		return bytesReadSeekCloser{bytes.NewReader(data)}, filename, ""
	}
	if pdf := h.convertPresentationPreview(ctx, data, ext); bytes.HasPrefix(pdf, []byte("%PDF")) {
		base := strings.TrimSuffix(filepath.Base(filename), ext)
		if base == "" || base == "." {
			base = "preview"
		}
		return bytesReadSeekCloser{bytes.NewReader(pdf)}, base + ".pdf", "application/pdf"
	}
	return bytesReadSeekCloser{bytes.NewReader(data)}, filename, ""
}

func (h *KnowledgeHandler) convertPresentationPreview(ctx context.Context, data []byte, ext string) []byte {
	if pdf, ok := loadCachedPresentationPDF(data); ok {
		return pdf
	}
	presentationPreviewMu.Lock()
	defer presentationPreviewMu.Unlock()
	if pdf, ok := loadCachedPresentationPDF(data); ok {
		return pdf
	}
	pdf := h.convertPresentationUncached(ctx, data, ext)
	if bytes.HasPrefix(pdf, []byte("%PDF")) {
		storeCachedPresentationPDF(data, pdf)
	}
	return pdf
}

func (h *KnowledgeHandler) convertPresentationUncached(ctx context.Context, data []byte, ext string) []byte {
	pdf, err := convertPresentationForPreview(ctx, data, ext)
	if err != nil || !bytes.HasPrefix(pdf, []byte("%PDF")) {
		logger.Warnf(ctx, "幻灯片转 PDF 失败，回退原文件预览: %v", err)
		return nil
	}
	return pdf
}

func presentationCachePath(data []byte) string {
	sum := sha256.Sum256(data)
	return filepath.Join(os.TempDir(), "weknora-presentation-preview", hex.EncodeToString(sum[:])+".pdf")
}

func loadCachedPresentationPDF(data []byte) ([]byte, bool) {
	cached, err := os.ReadFile(presentationCachePath(data))
	if err != nil || !bytes.HasPrefix(cached, []byte("%PDF")) {
		return nil, false
	}
	return cached, true
}

func storeCachedPresentationPDF(data, pdf []byte) {
	path := presentationCachePath(data)
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return
	}
	prunePresentationPreviewCache(dir)
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, pdf, 0o644); err != nil {
		return
	}
	_ = os.Rename(tmp, path)
}

func prunePresentationPreviewCache(dir string) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return
	}
	cutoff := time.Now().Add(-24 * time.Hour)
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil || !info.ModTime().Before(cutoff) {
			continue
		}
		_ = os.Remove(filepath.Join(dir, entry.Name()))
	}
}

func findSofficeBinary() string {
	candidates := []string{
		"/usr/bin/soffice",
		"/usr/lib/libreoffice/program/soffice",
		"/opt/libreoffice25.2/program/soffice",
		"/opt/homebrew/bin/soffice",
		"/Applications/LibreOffice.app/Contents/MacOS/soffice",
	}
	for _, path := range candidates {
		info, err := os.Stat(path)
		if err == nil && !info.IsDir() {
			return path
		}
	}
	if path, err := exec.LookPath("soffice"); err == nil {
		return path
	}
	return ""
}

// convertPresentationWithSoffice 在提供知识库预览的进程里直接调用 soffice，
// 参数与 Python 侧 file_preview.convert_office_to_pdf 一致。
func convertPresentationWithSoffice(ctx context.Context, data []byte, ext string) ([]byte, error) {
	soffice := findPresentationSoffice()
	if soffice == "" {
		return nil, os.ErrNotExist
	}
	pdf, err := runSofficePDFConvert(ctx, soffice, data, ext)
	if err != nil {
		return nil, err
	}
	if !bytes.HasPrefix(pdf, []byte("%PDF")) {
		return nil, os.ErrInvalid
	}
	return pdf, nil
}

func runSofficePDFConvert(ctx context.Context, soffice string, data []byte, ext string) ([]byte, error) {
	tempDir, err := os.MkdirTemp("", "weknora-ppt-preview-*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(tempDir)
	profileDir, err := os.MkdirTemp("", "weknora-ppt-profile-*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(profileDir)

	src := filepath.Join(tempDir, "input"+ext)
	if err := os.WriteFile(src, data, 0o644); err != nil {
		return nil, err
	}
	userInstallation := (&url.URL{Scheme: "file", Path: filepath.ToSlash(profileDir)}).String()
	runCtx, cancel := context.WithTimeout(ctx, 120*time.Second)
	defer cancel()
	cmd := exec.CommandContext(runCtx, soffice,
		"--headless",
		"--nologo",
		"--nofirststartwizard",
		"--nodefault",
		"--nolockcheck",
		"-env:UserInstallation="+userInstallation,
		"--convert-to", "pdf",
		"--outdir", tempDir,
		src,
	)
	output, err := cmd.CombinedOutput()
	if err != nil {
		if len(output) > 0 {
			logger.Warnf(ctx, "soffice 转换输出: %s", trimPreviewLog(output))
		}
		return nil, err
	}
	return os.ReadFile(filepath.Join(tempDir, "input.pdf"))
}

func trimPreviewLog(output []byte) string {
	text := strings.TrimSpace(string(output))
	if len(text) > 500 {
		return text[:500]
	}
	return text
}
