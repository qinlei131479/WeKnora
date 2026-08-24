// 文件类型图标（彩色 SVG），用于在文件名/路径前渲染。目录图标由 FileTypeIcon 使用 TDesign folder。
// 注意：仅用于「渲染文件名称前的类型图标」，按钮图标请勿使用此处的资源。
import archiveIcon from '@harness/assets/icons/files/archive.svg?url'
import audioIcon from '@harness/assets/icons/files/audio.svg?url'
import cadIcon from '@harness/assets/icons/files/cad.svg?url'
import codeIcon from '@harness/assets/icons/files/code.svg?url'
import fileIcon from '@harness/assets/icons/files/file.svg?url'
import imageIcon from '@harness/assets/icons/files/image.svg?url'
import markdownIcon from '@harness/assets/icons/files/markdown.svg?url'
import pdfIcon from '@harness/assets/icons/files/pdf.svg?url'
import pptIcon from '@harness/assets/icons/files/ppt.svg?url'
import psdIcon from '@harness/assets/icons/files/psd.svg?url'
import pythonIcon from '@harness/assets/icons/files/python.svg?url'
import spreadsheetIcon from '@harness/assets/icons/files/spreadsheet.svg?url'
import textIcon from '@harness/assets/icons/files/text.svg?url'
import videoIcon from '@harness/assets/icons/files/video.svg?url'
import webIcon from '@harness/assets/icons/files/web.svg?url'
import wordIcon from '@harness/assets/icons/files/word.svg?url'

const EXTENSION_ICONS = {
  // 文档
  pdf: pdfIcon,
  doc: wordIcon,
  docx: wordIcon,
  rtf: wordIcon,
  ppt: pptIcon,
  pptx: pptIcon,
  xls: spreadsheetIcon,
  xlsx: spreadsheetIcon,
  csv: spreadsheetIcon,
  // 文本 / Markdown
  txt: textIcon,
  text: textIcon,
  log: textIcon,
  md: markdownIcon,
  markdown: markdownIcon,
  mdx: markdownIcon,
  // 代码
  py: pythonIcon,
  js: codeIcon,
  mjs: codeIcon,
  cjs: codeIcon,
  jsx: codeIcon,
  ts: codeIcon,
  tsx: codeIcon,
  vue: codeIcon,
  json: codeIcon,
  yaml: codeIcon,
  yml: codeIcon,
  toml: codeIcon,
  ini: codeIcon,
  conf: codeIcon,
  env: codeIcon,
  sh: codeIcon,
  bash: codeIcon,
  bat: codeIcon,
  go: codeIcon,
  rs: codeIcon,
  c: codeIcon,
  h: codeIcon,
  cpp: codeIcon,
  java: codeIcon,
  css: codeIcon,
  less: codeIcon,
  scss: codeIcon,
  sql: codeIcon,
  xml: codeIcon,
  // 网页
  html: webIcon,
  htm: webIcon,
  // 图片
  png: imageIcon,
  jpg: imageIcon,
  jpeg: imageIcon,
  gif: imageIcon,
  bmp: imageIcon,
  webp: imageIcon,
  svg: imageIcon,
  apng: imageIcon,
  avif: imageIcon,
  ico: imageIcon,
  // 设计 / 工程
  psd: psdIcon,
  dwg: cadIcon,
  dxf: cadIcon,
  // 音视频
  mp3: audioIcon,
  wav: audioIcon,
  flac: audioIcon,
  aac: audioIcon,
  ogg: audioIcon,
  m4a: audioIcon,
  mp4: videoIcon,
  mov: videoIcon,
  avi: videoIcon,
  mkv: videoIcon,
  webm: videoIcon,
  flv: videoIcon,
  // 压缩包
  zip: archiveIcon,
  rar: archiveIcon,
  '7z': archiveIcon,
  tar: archiveIcon,
  gz: archiveIcon
}

const getExtension = (name) => {
  const cleanName = String(name || '')
    .trim()
    .toLowerCase()
    .split(/[?#]/)[0]
  const fileName = cleanName.split('/').pop() || ''
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex <= 0) return ''
  return fileName.slice(dotIndex + 1)
}

/**
 * 解析文件对应的彩色图标 URL。目录图标由 FileTypeIcon 使用 TDesign folder。
 * @param {string} name 文件名或路径
 */
export const resolveFileIconUrl = (name) => EXTENSION_ICONS[getExtension(name)] || fileIcon
