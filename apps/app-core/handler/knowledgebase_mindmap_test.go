package handler

import (
	"encoding/json"
	"testing"

	"github.com/Tencent/WeKnora/apps/app-core/types"
)

func TestAppendMindmapFile(t *testing.T) {
	cases := []struct {
		name       string
		folderPath string
		fileName   string
		want       string
	}{
		{
			name:       "空folder_path 直接挂在根下",
			folderPath: "",
			fileName:   "root.pdf",
			want:       `{"content":"KB","children":[{"content":"root.pdf"}]}`,
		},
		{
			name:       "单层文件夹",
			folderPath: "docs",
			fileName:   "a.md",
			want:       `{"content":"KB","children":[{"content":"docs","children":[{"content":"a.md"}]}]}`,
		},
		{
			name:       "多层文件夹按 / 分层",
			folderPath: "docs/spec",
			fileName:   "design.md",
			want: `{"content":"KB","children":[{"content":"docs","children":[` +
				`{"content":"spec","children":[{"content":"design.md"}]}]}]}`,
		},
		{
			name:       "未归一化的路径（前后斜杠）应被清理",
			folderPath: "/docs/spec/",
			fileName:   "x.md",
			want: `{"content":"KB","children":[{"content":"docs","children":[` +
				`{"content":"spec","children":[{"content":"x.md"}]}]}]}`,
		},
		{
			name:       "含 . 的相对路径应被归一化丢弃",
			folderPath: "docs/./spec",
			fileName:   "y.md",
			want: `{"content":"KB","children":[{"content":"docs","children":[` +
				`{"content":"spec","children":[{"content":"y.md"}]}]}]}`,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			root := &mindmapNode{Content: "KB"}
			appendMindmapFile(root, tc.folderPath, tc.fileName)
			got, err := json.Marshal(root)
			if err != nil {
				t.Fatalf("marshal: %v", err)
			}
			if string(got) != tc.want {
				t.Errorf("got  %s\nwant %s", got, tc.want)
			}
		})
	}
}

// Same folder must be merged into one node instead of duplicated.
func TestAppendMindmapFileMergesSharedFolders(t *testing.T) {
	root := &mindmapNode{Content: "KB"}
	appendMindmapFile(root, "docs/spec", "a.md")
	appendMindmapFile(root, "docs/spec", "b.md")
	appendMindmapFile(root, "docs/ops", "c.md")
	appendMindmapFile(root, "", "root.md")

	// 同一目录合并成一个节点，不重复出现 docs；spec 在 ops 之前是插入顺序
	// （本用例不调用 sortMindmapTree，排序由 TestSortMindmapTree 覆盖）
	want := `{"content":"KB","children":[` +
		`{"content":"docs","children":[` +
		`{"content":"spec","children":[{"content":"a.md"},{"content":"b.md"}]},` +
		`{"content":"ops","children":[{"content":"c.md"}]}` +
		`]},` +
		`{"content":"root.md"}]}`
	got, err := json.Marshal(root)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if string(got) != want {
		t.Errorf("got  %s\nwant %s", got, want)
	}
}

// A file whose name equals a folder name must not be mistaken for that folder.
func TestAppendMindmapFileDistinguishesFileFromFolder(t *testing.T) {
	root := &mindmapNode{Content: "KB"}
	// "docs" 先作为叶子文件出现，随后 "docs/a.md" 又把 docs 变成文件夹
	appendMindmapFile(root, "", "docs")
	appendMindmapFile(root, "docs", "a.md")

	got, err := json.Marshal(root)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	want := `{"content":"KB","children":[{"content":"docs","children":[{"content":"a.md"}]}]}`
	if string(got) != want {
		t.Errorf("got  %s\nwant %s", got, want)
	}
}

func TestSortMindmapTreeFoldersBeforeFiles(t *testing.T) {
	root := &mindmapNode{Content: "KB"}
	appendMindmapFile(root, "", "zebra.md")
	appendMindmapFile(root, "", "alpha.md")
	appendMindmapFile(root, "zfolder", "z.md")
	appendMindmapFile(root, "afolder", "a.md")
	sortMindmapTree(root)

	got, err := json.Marshal(root)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	want := `{"content":"KB","children":[` +
		`{"content":"afolder","children":[{"content":"a.md"}]},` +
		`{"content":"zfolder","children":[{"content":"z.md"}]},` +
		`{"content":"alpha.md"},` +
		`{"content":"zebra.md"}]}`
	if string(got) != want {
		t.Errorf("got  %s\nwant %s", got, want)
	}
}

// Guard against regressing to the old LLM-shaped tree: the root must always be
// the knowledge base name and every leaf must be a real file name.
func TestMindmapTreeMatchesFolderPath(t *testing.T) {
	root := &mindmapNode{Content: "报价专用"}
	appendMindmapFile(root, "标准化产品", "报价单.xlsx")
	appendMindmapFile(root, "四川电信酒店项目", "方案.docx")

	if root.Content != "报价专用" {
		t.Errorf("root = %q, want 报价专用", root.Content)
	}
	if len(root.Children) != 2 {
		t.Fatalf("want 2 folders, got %d", len(root.Children))
	}
	for _, c := range root.Children {
		if !c.isFolder() {
			t.Errorf("%q should be a folder", c.Content)
		}
	}
	// 反向验证：归一化应把脏路径压平成同一目录
	if got := types.NormalizeKnowledgeFolderPath("a//b/./c/"); got != "a/b/c" {
		t.Errorf("normalize = %q, want a/b/c", got)
	}
}