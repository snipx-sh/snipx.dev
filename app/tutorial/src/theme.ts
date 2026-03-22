/** Tokyo Night color tokens — shared with the React SPA. */
export const T = {
  bg: "#1a1b26",
  bgDark: "#13131a",
  bgPanel: "#16161e",
  bgHL: "#1e2030",
  bgHover: "#252637",
  bgActive: "#2a2d3e",
  border: "#3b4261",
  borderBrt: "#545c7e",
  fg: "#c0caf5",
  fgDim: "#a9b1d6",
  fgMuted: "#565f89",
  blue: "#7aa2f7",
  cyan: "#7dcfff",
  green: "#9ece6a",
  green1: "#73daca",
  purple: "#bb9af7",
  orange: "#ff9e64",
  yellow: "#e0af68",
  red: "#f7768e",
  teal: "#2ac3de",
} as const

export const LANG_COLOR: Record<string, string> = {
  nushell: T.blue,
  bash: T.green,
  sh: T.green,
  rust: T.orange,
  typescript: T.cyan,
  javascript: T.yellow,
  toml: T.yellow,
  yaml: T.purple,
}

/** Monaco editor theme definition matching Tokyo Night. */
export const MONACO_THEME_RULES = [
  { token: "", foreground: "c0caf5", background: "1a1b26" },
  { token: "comment", foreground: "565f89", fontStyle: "italic" },
  { token: "keyword", foreground: "bb9af7" },
  { token: "string", foreground: "9ece6a" },
  { token: "number", foreground: "ff9e64" },
  { token: "type", foreground: "2ac3de" },
  { token: "function", foreground: "7aa2f7" },
  { token: "variable", foreground: "c0caf5" },
  { token: "operator", foreground: "89ddff" },
  { token: "delimiter", foreground: "a9b1d6" },
  { token: "identifier", foreground: "c0caf5" },
  { token: "tag", foreground: "f7768e" },
  { token: "attribute.name", foreground: "bb9af7" },
  { token: "attribute.value", foreground: "9ece6a" },
]

export const MONACO_THEME_COLORS = {
  "editor.background": T.bg,
  "editor.foreground": T.fg,
  "editor.lineHighlightBackground": T.bgHL,
  "editor.selectionBackground": "#515c7e40",
  "editorCursor.foreground": T.blue,
  "editorLineNumber.foreground": T.fgMuted,
  "editorLineNumber.activeForeground": T.fgDim,
  "editorIndentGuide.background": "#3b426140",
  "editorGutter.background": T.bg,
}
