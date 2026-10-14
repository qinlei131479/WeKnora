package handler

import (
	"encoding/json"
	"sort"
	"strings"
	"time"

	"github.com/Tencent/WeKnora/apps/app-core/errors"
	"github.com/Tencent/WeKnora/apps/app-core/logger"
	"github.com/Tencent/WeKnora/apps/app-core/types"
	"github.com/gin-gonic/gin"
)

const mindmapFileLimit = 200

// mindmapNode is one node of the generated tree. The shape matches what the
// front end feeds to markmap: {content, children}.
type mindmapNode struct {
	Content  string         `json:"content"`
	Children []*mindmapNode `json:"children,omitempty"`

	// folder marks an intermediate directory node. It cannot be derived from
	// Children: a folder named "docs" is created *before* its first file is
	// attached, so at childFolder() time it still has no children and would
	// otherwise be indistinguishable from a file leaf of the same name.
	folder bool
}

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

// GenerateKnowledgeBaseMindmap builds the mindmap purely from the stored folder
// structure: knowledge base name -> folder path segments -> file name.
//
// It deliberately does NOT call an LLM. The previous version shipped a flat
// file-name list to a chat model and let it invent category names, which meant
// the tree drifted from the real folders on every regeneration ("standardized
// products", "Sichuan Telecom hotel project", ...). The tree here is derived
// from knowledges.folder_path, so it is deterministic and always matches the
// sidebar.
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

	root := &mindmapNode{Content: kb.Name}
	fileIDs := map[string]string{}
	fileCount := 0
	for _, item := range items {
		if item == nil || item.FileName == "" {
			continue
		}
		if fileCount >= mindmapFileLimit {
			break
		}
		// FolderPath is already normalized on write ("a/b", no leading or
		// trailing slash). Files outside any folder have it empty and stay
		// directly under the root, mirroring the sidebar tree.
		appendMindmapFile(root, item.FolderPath, item.FileName)
		fileIDs[item.ID] = mindmapFileKey(item.FolderPath, item.FileName)
		fileCount++
	}
	if fileCount == 0 {
		c.Error(errors.NewBadRequestError("知识库中没有文件"))
		return
	}
	sortMindmapTree(root)

	mindmap, err := json.Marshal(root)
	if err != nil {
		c.Error(errors.NewInternalServerError(err.Error()))
		return
	}
	fileIDsRaw, _ := json.Marshal(fileIDs)
	metaRaw, _ := json.Marshal(gin.H{
		"generated_at": time.Now().UTC().Format(time.RFC3339),
		"file_count":   fileCount,
	})
	if err := h.service.SaveMindmap(ctx, id, mindmap, fileIDsRaw, metaRaw); err != nil {
		c.Error(errors.NewInternalServerError(err.Error()))
		return
	}
	logger.Infof(ctx, "knowledge base mindmap regenerated from folder tree: kb_id=%s file_count=%d", id, fileCount)
	// 生成响应与 GET 对齐，都带 mindmap_file_ids（文件树路径 -> 知识 ID），
	// 前端生成后无需再发一次 GET 就能建立「节点 -> 预览」的映射。
	c.JSON(200, gin.H{
		"success":          true,
		"mindmap":          json.RawMessage(mindmap),
		"mindmap_file_ids": json.RawMessage(fileIDsRaw),
		"name":             kb.Name,
		"kb_id":            id,
		"message":          "success",
	})
}

// mindmapFileKey 生成 fileIDs 的值：与导图树一致的「文件夹路径/文件名」
// （路径已归一化，无路径时就是文件名），供前端按节点路径精确匹配同名文件。
func mindmapFileKey(folderPath string, fileName string) string {
	if path := types.NormalizeKnowledgeFolderPath(folderPath); path != "" {
		return path + "/" + fileName
	}
	return fileName
}

// appendMindmapFile inserts fileName under the folder chain described by
// folderPath, creating any missing intermediate nodes. Segments are reused when
// two files share a directory, so the result mirrors the real folder tree.
func appendMindmapFile(root *mindmapNode, folderPath string, fileName string) {
	node := root
	path := types.NormalizeKnowledgeFolderPath(folderPath)
	if path != "" {
		for _, segment := range strings.Split(path, "/") {
			if segment == "" {
				continue
			}
			node = childFolder(node, segment)
		}
	}
	node.Children = append(node.Children, &mindmapNode{Content: fileName})
}

// childFolder returns the node to use as the sub-folder called name.
//
// Reuse rules, in order:
//  1. an existing folder with this name — the normal case when several files
//     share a directory;
//  2. an existing *leaf* with this name — a root-level file called "docs"
//     that a later file ("docs/a.md") turns into a directory. The leaf is
//     upgraded in place instead of producing two sibling nodes with the same
//     name, which is what markmap would render as two unrelated nodes;
//  3. otherwise append a fresh folder node.
func childFolder(parent *mindmapNode, name string) *mindmapNode {
	var leaf *mindmapNode
	for _, child := range parent.Children {
		if child.Content != name {
			continue
		}
		if child.isFolder() {
			return child
		}
		if leaf == nil {
			leaf = child
		}
	}
	if leaf != nil {
		leaf.folder = true
		return leaf
	}
	folder := &mindmapNode{Content: name, folder: true}
	parent.Children = append(parent.Children, folder)
	return folder
}

// isFolder reports whether this node is an intermediate folder rather than a
// leaf file.
func (n *mindmapNode) isFolder() bool {
	return n.folder
}

func orEmptyJSON(raw json.RawMessage) []byte {
	if len(raw) == 0 {
		return []byte("null")
	}
	return raw
}

// sortMindmapTree orders siblings so folders come before files and each group
// is alphabetical, giving a stable tree across regenerations. It runs on the
// fully built tree, so isFolder() no longer depends on Children being populated.
func sortMindmapTree(node *mindmapNode) {
	if len(node.Children) == 0 {
		return
	}
	sort.SliceStable(node.Children, func(i, j int) bool {
		a, b := node.Children[i], node.Children[j]
		if a.isFolder() != b.isFolder() {
			return a.isFolder()
		}
		return a.Content < b.Content
	})
	for _, child := range node.Children {
		sortMindmapTree(child)
	}
}
