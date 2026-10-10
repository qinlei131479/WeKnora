package service

import (
	"context"
	"io"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/Tencent/WeKnora/apps/app-core/infrastructure/docparser"
	"github.com/Tencent/WeKnora/apps/app-core/logger"
	"github.com/Tencent/WeKnora/apps/app-core/models/asr"
	"github.com/Tencent/WeKnora/apps/app-core/sourceloc"
	"github.com/Tencent/WeKnora/apps/app-core/types"
)

// attachStructureBlocks gives a parse result source blocks when the parser
// reported none: office files are aligned against their own structure, and
// plain-text files that the parser passed through verbatim map onto
// themselves. Failures only cost the locators, never the parse.
func attachStructureBlocks(ctx context.Context, fileType string, data []byte, result *types.ReadResult) {
	if result == nil || len(result.SourceBlocks) > 0 || result.MarkdownContent == "" || len(data) == 0 {
		return
	}
	ft := strings.ToLower(strings.TrimPrefix(fileType, "."))
	switch {
	case sourceloc.SupportsStructure(ft):
		started := time.Now()
		blocks, err := sourceloc.AlignStructure(ft, data, result.MarkdownContent)
		if err != nil {
			logger.Warnf(ctx, "[SourceLocator] reading %s structure failed: %v", ft, err)
			return
		}
		result.SourceBlocks = blocks
		logger.Infof(ctx, "[SourceLocator] aligned %d %s blocks in %s", len(blocks), ft, time.Since(started))
	case ft == "md" || ft == "markdown" || ft == "txt" || ft == "text":
		if result.MarkdownContent == string(data) {
			result.SourceBlocks = passThroughTextBlocks(result.MarkdownContent)
		}
	}
}

// passThroughTextBlocks maps a verbatim text original onto itself. Text
// locators count from after a UTF-8 BOM, since viewers decode the file
// without it; the blocks still cover the markdown, BOM included.
func passThroughTextBlocks(content string) []types.SourceBlock {
	body, hasBOM := strings.CutPrefix(content, "\ufeff")
	blocks := sourceloc.TextBlocks(body)
	if hasBOM {
		for i := range blocks {
			blocks[i].Start++
			blocks[i].End++
		}
	}
	return blocks
}

// transcriptWithSegments renders an ASR result with one line per timed
// segment, and the time blocks that point each line back into the audio.
// Without segments the plain transcript is returned and no blocks.
func transcriptWithSegments(result *asr.TranscriptionResult) (string, []types.SourceBlock) {
	if result == nil {
		return "", nil
	}
	if len(result.Segments) == 0 {
		return result.Text, nil
	}
	var (
		sb     strings.Builder
		blocks []types.SourceBlock
		pos    int
	)
	for _, seg := range result.Segments {
		text := strings.TrimSpace(seg.Text)
		if text == "" {
			continue
		}
		if sb.Len() > 0 {
			sb.WriteByte('\n')
			pos++
		}
		n := len([]rune(text))
		sb.WriteString(text)
		blocks = append(blocks, types.SourceBlock{
			Start: pos, End: pos + n,
			Locator: types.SourceLocator{
				Type:    types.SourceLocatorTime,
				StartMs: int64(seg.Start * 1000),
				EndMs:   int64(seg.End * 1000),
			},
		})
		pos += n
	}
	if len(blocks) == 0 {
		return result.Text, nil
	}
	return sb.String(), blocks
}

// buildSourceIndex re-aims the parser's source blocks at the markdown the
// chunker will split, and places every stored image in the original file.
// parsed is the markdown the blocks were recorded against.
func buildSourceIndex(
	parsed string, blocks []types.SourceBlock, final string, images []docparser.StoredImage,
) *sourceloc.Index {
	if len(blocks) == 0 {
		return nil
	}
	idx := sourceloc.NewIndex(final, sourceloc.RemapBlocks(blocks, parsed, final))
	if idx == nil {
		return nil
	}
	// Visit the images in document order so rune offsets are counted in one
	// pass over the markdown instead of once per image.
	type placed struct{ image, at int }
	var found []placed
	for i := range images {
		if images[i].ServingURL == "" {
			continue
		}
		if at := strings.Index(final, images[i].ServingURL); at >= 0 {
			found = append(found, placed{image: i, at: at})
		}
	}
	sort.Slice(found, func(a, b int) bool { return found[a].at < found[b].at })
	bytePos, runePos := 0, 0
	for _, f := range found {
		runePos += utf8.RuneCountInString(final[bytePos:f.at])
		bytePos = f.at
		images[f.image].SourceLocators = idx.LocatorsAt(runePos)
	}
	return idx
}

// isPresentationPackage 判断文件是 OOXML 演示文稿。旧版 .ppt 是 OLE，
// 不能按 pptx 的幻灯片 XML 抽文字。
func isPresentationPackage(fileType string) bool {
	switch strings.TrimPrefix(strings.ToLower(strings.TrimSpace(fileType)), ".") {
	case "pptx", "pptm":
		return true
	default:
		return false
	}
}

// missingParagraphs 返回 recovered 里正文尚未包含的段落，避免和解析器
// 已经抽出的幻灯片文字重复。
func missingParagraphs(markdown, recovered string) string {
	recovered = strings.TrimSpace(recovered)
	if recovered == "" {
		return ""
	}
	var missing []string
	seen := make(map[string]struct{})
	for _, paragraph := range strings.Split(recovered, "\n\n") {
		paragraph = strings.TrimSpace(paragraph)
		if paragraph == "" {
			continue
		}
		if _, ok := seen[paragraph]; ok {
			continue
		}
		seen[paragraph] = struct{}{}
		if strings.Contains(markdown, paragraph) {
			continue
		}
		missing = append(missing, paragraph)
	}
	return strings.Join(missing, "\n\n")
}

// prependTextBlock 把补上的正文放在图片标记前面。摘要采样优先保留开头，
// 若把文字追加在一长串图片引用后面，采样窗口会把正文裁掉。
func prependTextBlock(base, extra string) string {
	extra = strings.TrimSpace(extra)
	if extra == "" {
		return base
	}
	base = strings.TrimSpace(base)
	if base == "" {
		return extra
	}
	return extra + "\n\n" + base
}

// readStoredFile 读取知识条目对应的原始文件。读失败时返回 nil，调用方
// 继续用已有正文，不把摘要流程打成错误。
func (s *knowledgeService) readStoredFile(
	ctx context.Context, kb *types.KnowledgeBase, filePath string,
) []byte {
	if s == nil || kb == nil || strings.TrimSpace(filePath) == "" {
		return nil
	}
	fileSvc := s.resolveFileServiceForPath(ctx, kb, filePath)
	if fileSvc == nil {
		return nil
	}
	reader, err := fileSvc.GetFile(ctx, filePath)
	if err != nil {
		logger.Warnf(ctx, "[summary] read presentation file failed: %v", err)
		return nil
	}
	defer reader.Close()
	data, err := io.ReadAll(reader)
	if err != nil {
		logger.Warnf(ctx, "[summary] read presentation bytes failed: %v", err)
		return nil
	}
	return data
}

// presentationParagraphs 从 pptx/pptm 原文抽出幻灯片和备注文字。
func (s *knowledgeService) presentationParagraphs(
	ctx context.Context, kb *types.KnowledgeBase, filePath, fileType string,
) string {
	if !isPresentationPackage(fileType) {
		return ""
	}
	data := s.readStoredFile(ctx, kb, filePath)
	if len(data) == 0 {
		return ""
	}
	text, err := sourceloc.PresentationText(data)
	if err != nil {
		logger.Warnf(ctx, "[summary] presentation text extract failed: %v", err)
		return ""
	}
	return text
}

// mergeSparsePresentationText 在解析结果去掉图片后几乎没有文字时，
// 把幻灯片形状里的文字补回正文。文字放在前面，后续分块和摘要都能用到。
func (s *knowledgeService) mergeSparsePresentationText(
	ctx context.Context, kb *types.KnowledgeBase, filePath, fileType, markdown string,
) string {
	if realTextRuneCount(markdown) >= imageDominatedTextThreshold {
		return markdown
	}
	extra := missingParagraphs(markdown, s.presentationParagraphs(ctx, kb, filePath, fileType))
	if extra == "" {
		return markdown
	}
	logger.Infof(ctx, "[summary] supplemented presentation text: file=%s added_runes=%d",
		fileType, utf8.RuneCountInString(extra))
	return prependTextBlock(markdown, extra)
}

// imageEvidenceText 取出尚未写进正文的图片 OCR / 描述。图片子块和父文本
// 对不上时，摘要侧的按 URL 合并会漏掉这些文字。
func (s *knowledgeService) imageEvidenceText(
	ctx context.Context, knowledge *types.Knowledge, already string,
) string {
	if s == nil || s.chunkRepo == nil || knowledge == nil || knowledge.ID == "" {
		return ""
	}
	chunks, err := s.chunkRepo.ListChunksByKnowledgeIDAndTypes(
		ctx, knowledge.TenantID, knowledge.ID,
		[]types.ChunkType{types.ChunkTypeImageOCR, types.ChunkTypeImageCaption},
	)
	if err != nil {
		logger.Warnf(ctx, "[summary] list image evidence failed: %v", err)
		return ""
	}
	var parts []string
	for _, chunk := range chunks {
		if chunk == nil || !chunk.IsEnabled {
			continue
		}
		text := strings.TrimSpace(chunk.Content)
		if text == "" || strings.Contains(already, text) {
			continue
		}
		parts = append(parts, text)
		already += "\n" + text
	}
	return strings.Join(parts, "\n\n")
}

// presentationFallbackChunk 在完全没有文本分块时，用幻灯片形状文字造一块
// 仅供本次摘要使用的内容。解析器整篇失败时，点「生成摘要」仍能读到标题和正文。
func (s *knowledgeService) presentationFallbackChunk(
	ctx context.Context, kb *types.KnowledgeBase, knowledge *types.Knowledge,
) *types.Chunk {
	if knowledge == nil {
		return nil
	}
	text := strings.TrimSpace(s.presentationParagraphs(ctx, kb, knowledge.FilePath, knowledge.FileType))
	if realTextRuneCount(text) < minTextContentRunes {
		return nil
	}
	return &types.Chunk{
		ID:          knowledge.ID + ":presentation",
		TenantID:    knowledge.TenantID,
		KnowledgeID: knowledge.ID,
		Content:     text,
		IsEnabled:   true,
	}
}

// mergeSparseSummaryEvidence 在送模型前补上图片识别结果和幻灯片原文。
// 只在正文稀疏时读取原文，避免给文字充足的文档多一次存储读取。
func (s *knowledgeService) mergeSparseSummaryEvidence(
	ctx context.Context, knowledge *types.Knowledge, content string,
) string {
	if knowledge == nil || realTextRuneCount(content) >= imageDominatedTextThreshold {
		return content
	}
	if extra := s.imageEvidenceText(ctx, knowledge, content); extra != "" {
		content = prependTextBlock(content, extra)
	}
	if realTextRuneCount(content) >= imageDominatedTextThreshold {
		return content
	}
	if s.kbService == nil || !isPresentationPackage(knowledge.FileType) {
		return content
	}
	kb, err := s.kbService.GetKnowledgeBaseByIDOnly(ctx, knowledge.KnowledgeBaseID)
	if err != nil || kb == nil {
		logger.Warnf(ctx, "[summary] presentation supplement skipped, kb unavailable: %v", err)
		return content
	}
	return s.mergeSparsePresentationText(ctx, kb, knowledge.FilePath, knowledge.FileType, content)
}
